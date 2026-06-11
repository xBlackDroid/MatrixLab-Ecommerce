import { type NextRequest, NextResponse } from "next/server";
import {
  jsonError,
  readJsonBody,
  serviceUnavailable,
  tooManyRequests,
} from "@/lib/api";
import { logAudit } from "@/lib/db/admin";
import { createCheckoutPreference } from "@/lib/payments/mercadopago";
import {
  assertNoLeakedSecrets,
  isCheckoutConfigured,
} from "@/lib/security/env";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { hashSessionId, readSessionId } from "@/lib/security/session";
import { CART_ERROR_MESSAGES } from "@/lib/store/cart";
import { createOrderFromCart, setOrderPreference } from "@/lib/store/orders";
import { CheckoutSchema } from "@/lib/validation/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  ...CART_ERROR_MESSAGES,
  CART_EMPTY: "Tu carrito está vacío.",
  CART_INVALID_ITEMS:
    "Alguno de los productos de tu carrito ya no está disponible en esa cantidad. Revisa tu carrito.",
};

/**
 * Crea el pedido local (pendiente_pago) y la preferencia de Mercado Pago.
 * Todo se recalcula en backend: precios, stock y totales del cliente se
 * ignoran. Devuelve únicamente { redirectUrl, orderId }.
 */
export async function POST(request: NextRequest) {
  assertNoLeakedSecrets();

  const ip = getClientIp(request);
  const sessionId = readSessionId(request);
  const limitKey = `checkout:${ip}:${sessionId ?? "anon"}`;
  const limit = checkRateLimit(limitKey, RATE_LIMITS.checkout);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  // Bloqueos por configuración: sin token MP, sin DB o sin SITE_URL no hay
  // checkout (las back_urls y notification_url dependen de SITE_URL).
  if (!isCheckoutConfigured()) {
    return serviceUnavailable(
      "Los pagos en línea están en configuración. Escríbenos por WhatsApp para completar tu pedido.",
    );
  }

  if (!sessionId) {
    return jsonError("Tu sesión expiró. Vuelve a cargar tu carrito.", 401);
  }

  const body = await readJsonBody(request);
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Revisa los datos del formulario.", 400);
  }

  try {
    const orderResult = await createOrderFromCart({
      sessionId,
      cartId: parsed.data.cartId,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone,
      shippingAddress: parsed.data.shippingAddress,
      notes: parsed.data.notes,
    });
    if (!orderResult.ok) {
      const message =
        CHECKOUT_ERROR_MESSAGES[orderResult.error] ??
        CART_ERROR_MESSAGES.INTERNAL;
      const status = orderResult.error === "INTERNAL" ? 500 : 409;
      return jsonError(message, status, orderResult.error);
    }

    const { order, items } = orderResult.data;

    const preference = await createCheckoutPreference({
      orderId: order.id,
      orderNumber: order.order_number,
      lines: items.map((item) => ({
        title: item.variant_snapshot
          ? `${item.title_snapshot} (${item.variant_snapshot})`
          : item.title_snapshot,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
      })),
      customerName: order.customer_name,
      customerEmail: order.customer_email ?? undefined,
      sessionHash: hashSessionId(sessionId),
    });

    if (!preference.ok) {
      await logAudit({
        actor: "system",
        action: "checkout.preference_failed",
        entityType: "order",
        entityId: order.id,
      });
      return jsonError(
        "No pudimos iniciar el pago con Mercado Pago. Intenta de nuevo en unos minutos.",
        502,
      );
    }

    await setOrderPreference(order.id, preference.preferenceId);
    await logAudit({
      actor: "system",
      action: "checkout.preference_created",
      entityType: "order",
      entityId: order.id,
      metadata: { orderNumber: order.order_number },
    });

    // Respuesta mínima: nada de tokens ni payloads del proveedor.
    return NextResponse.json({
      ok: true,
      redirectUrl: preference.redirectUrl,
      orderId: order.id,
    });
  } catch {
    return jsonError(
      "No pudimos procesar tu pedido. Intenta de nuevo.",
      500,
    );
  }
}
