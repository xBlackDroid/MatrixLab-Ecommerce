import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAudit, requireServiceClient } from "@/lib/db/admin";
import type { OrderRow } from "@/lib/db/types";
import {
  fetchPayment,
  mapPaymentStatus,
  paymentMismatchReason,
  requireLivePayments,
  verifyWebhookSignature,
} from "@/lib/payments/mercadopago";
import {
  isMercadoPagoConfigured,
  isSupabaseConfigured,
} from "@/lib/security/env";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Moneda única de la tienda. Todo cobro debe llegar en esta moneda. */
const ORDER_CURRENCY = "MXN";

/**
 * Webhook de Mercado Pago (configurado vía notification_url).
 *
 * Seguridad:
 * - Valida firma x-signature si MERCADOPAGO_WEBHOOK_SECRET está configurado,
 *   incluida la FRESCURA del `ts` (un HMAC válido no caduca por sí solo).
 * - NUNCA confía en el payload: consulta el pago real a Mercado Pago con el
 *   Access Token (solo backend).
 * - Valida la INTEGRIDAD del cobro antes de marcar pagado: monto ≥ total del
 *   pedido, moneda MXN y `live_mode` real. Un pago parcial, en otra moneda o
 *   de sandbox no libera producción ni descuenta inventario.
 * - Idempotente: payment_events.event_id es único y `processed_at` marca los
 *   eventos ya aplicados, así un reenvío no duplica efectos pero un evento
 *   que quedó registrado sin aplicarse sí se reintenta. El descuento de
 *   inventario es transaccional (función SQL process_paid_order) y solo
 *   ocurre con pago aprobado.
 * - Responde 200 en eventos ignorables para evitar reintentos infinitos y
 *   5xx solo cuando conviene que Mercado Pago reintente.
 */

const WebhookBodySchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    type: z.string().max(60).optional(),
    topic: z.string().max(60).optional(),
    action: z.string().max(80).optional(),
    live_mode: z.boolean().optional(),
    data: z
      .object({ id: z.union([z.string(), z.number()]).optional() })
      .loose()
      .optional(),
  })
  .loose();

function extractPaymentId(
  body: z.infer<typeof WebhookBodySchema> | null,
  url: URL,
): { topic: string | null; paymentId: string | null } {
  const topic = body?.type ?? body?.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const rawId =
    body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const paymentId =
    rawId !== undefined && rawId !== null ? String(rawId) : null;
  return { topic: topic ?? null, paymentId };
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`webhook:${ip}`, RATE_LIMITS.webhook);
  if (!limit.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  if (!isSupabaseConfigured() || !isMercadoPagoConfigured()) {
    // 503: que Mercado Pago reintente cuando el servicio esté configurado.
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let body: z.infer<typeof WebhookBodySchema> | null = null;
  try {
    const raw = await request.text();
    if (raw.length > 64 * 1024) {
      return NextResponse.json({ received: true }, { status: 200 });
    }
    if (raw.trim()) {
      const parsed = WebhookBodySchema.safeParse(JSON.parse(raw));
      body = parsed.success ? parsed.data : null;
    }
  } catch {
    body = null;
  }

  const url = new URL(request.url);
  const { topic, paymentId } = extractPaymentId(body, url);

  // Solo procesamos notificaciones de pagos.
  if (!topic || !topic.includes("payment") || !paymentId) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Firma (estricta en producción cuando hay secreto configurado).
  const signatureOk = verifyWebhookSignature({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId: paymentId,
  });
  if (!signatureOk) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Confirmar el estado REAL del pago contra Mercado Pago.
  const fetched = await fetchPayment(paymentId);
  if (!fetched.ok) {
    if (fetched.reason === "NOT_FOUND") {
      // El id no corresponde a un pago: reintentar no cambiaría nada.
      return NextResponse.json({ received: true }, { status: 200 });
    }
    // Transitorio: 500 para que MP reintente con backoff.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  const payment = fetched.payment;

  const client = requireServiceClient();
  const eventId = `mp:payment:${payment.paymentId}:${payment.status}`;

  // Idempotencia: se registra el evento antes de aplicarlo y se marca
  // `processed_at` al terminar. Un evento YA aplicado se ignora; uno
  // registrado pero sin aplicar (p. ej. la entrega anterior falló al
  // descontar inventario y devolvió 500) se vuelve a procesar en el
  // reintento de Mercado Pago, en vez de darse por bueno y perder el pago.
  const { error: insertError } = await client.from("payment_events").insert({
    provider: "mercadopago",
    event_id: eventId,
    order_id: null,
    payment_reference: payment.paymentId,
    status: payment.status,
    raw_event_safe: {
      topic,
      action: body?.action ?? null,
      live_mode: body?.live_mode ?? null,
      external_reference: payment.externalReference,
    },
  });
  if (insertError) {
    if (insertError.code !== "23505") {
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    const { data: existing, error: existingError } = await client
      .from("payment_events")
      .select("processed_at")
      .eq("event_id", eventId)
      .maybeSingle();
    if (existingError) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    if (existing?.processed_at) {
      // Evento ya aplicado: nada que repetir.
      return NextResponse.json({ received: true }, { status: 200 });
    }
    // Registrado pero sin aplicar: continuar. Los efectos son idempotentes
    // (process_paid_order usa lock de fila y no repite el pago).
  }

  // external_reference = orderId interno (uuid).
  const orderIdParse = z.uuid().safeParse(payment.externalReference ?? "");
  if (!orderIdParse.success) {
    await client
      .from("payment_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("event_id", eventId);
    return NextResponse.json({ received: true }, { status: 200 });
  }
  const orderId = orderIdParse.data;

  const { data: orderData } = await client
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (!orderData) {
    await client
      .from("payment_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("event_id", eventId);
    return NextResponse.json({ received: true }, { status: 200 });
  }
  const order = orderData as OrderRow;

  await client
    .from("payment_events")
    .update({ order_id: order.id })
    .eq("event_id", eventId);

  const mapping = mapPaymentStatus(payment.status);

  // ---------------------------------------------------------------------
  // INTEGRIDAD DEL COBRO. `external_reference` dice a QUÉ pedido apunta el
  // pago, no CUÁNTO se cobró. Antes de marcar pagado se exige que el dinero
  // recibido cubra el total del pedido, en MXN y en modo real. Un pago
  // parcial, en otra moneda o de sandbox NO libera producción: el pedido se
  // queda en revisión manual y queda registrado en la bitácora.
  // ---------------------------------------------------------------------
  if (mapping.paymentStatus === "approved") {
    const mismatch = paymentMismatchReason({
      transactionAmount: payment.transactionAmount,
      currencyId: payment.currencyId,
      liveMode: payment.liveMode,
      orderTotal: Number(order.total),
      expectedCurrency: ORDER_CURRENCY,
      requireLiveMode: requireLivePayments(),
    });
    if (mismatch) {
      await logAudit({
        actor: "webhook:mercadopago",
        action: "payment.rejected_mismatch",
        entityType: "order",
        entityId: order.id,
        metadata: {
          orderNumber: order.order_number,
          reason: mismatch,
          // Sólo importes/moneda: nunca datos del pagador ni del proveedor.
          paidAmount: payment.transactionAmount,
          paidCurrency: payment.currencyId,
          expectedAmount: Number(order.total),
        },
      });
      // Evento consumido: reintentarlo daría el mismo resultado. El pedido
      // NO se marca pagado y queda para revisión manual en el panel.
      await client
        .from("payment_events")
        .update({ processed_at: new Date().toISOString() })
        .eq("event_id", eventId);
      return NextResponse.json({ received: true }, { status: 200 });
    }
  }

  try {
    if (mapping.paymentStatus === "approved") {
      // Transaccional e idempotente: marca pagado, descuenta inventario,
      // registra movimientos y libera diseños a producción.
      const { error: rpcError } = await client.rpc("process_paid_order", {
        p_order_id: order.id,
        p_payment_reference: payment.paymentId,
      });
      if (rpcError) {
        return NextResponse.json({ ok: false }, { status: 500 });
      }
    } else if (order.paid_at && mapping.paymentStatus !== "refunded") {
      // No degradar un pedido ya pagado por eventos tardíos.
    } else {
      const { error: updateError } = await client
        .from("orders")
        .update({
          payment_status: mapping.paymentStatus,
          status: mapping.orderStatus,
          payment_reference: payment.paymentId,
        })
        .eq("id", order.id);
      if (updateError) {
        // Sin marcar processed_at: el reintento de MP vuelve a aplicarlo.
        return NextResponse.json({ ok: false }, { status: 500 });
      }
    }

    await client
      .from("payment_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("event_id", eventId);

    await logAudit({
      actor: "webhook:mercadopago",
      action: `payment.${payment.status}`,
      entityType: "order",
      entityId: order.id,
      metadata: { orderNumber: order.order_number },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
