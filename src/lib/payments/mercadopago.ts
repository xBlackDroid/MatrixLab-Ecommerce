import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { getServerEnv, getSiteUrl, isProduction } from "@/lib/security/env";
import type {
  CreatePreferenceInput,
  CreatePreferenceResult,
  NormalizedPayment,
  PaymentStatusMapping,
} from "@/lib/payments/types";

/**
 * Integración Mercado Pago Checkout Pro.
 *
 * - El Access Token vive SOLO aquí (backend). Nunca se devuelve al cliente.
 * - La preferencia se crea con precios recalculados en servidor.
 * - El webhook se confirma consultando a Mercado Pago, nunca confiando solo
 *   en el payload recibido.
 */

let cachedClient: MercadoPagoConfig | null = null;

function getMpClient(): MercadoPagoConfig | null {
  if (cachedClient) return cachedClient;
  const token = getServerEnv().mpAccessToken;
  if (!token) return null;
  cachedClient = new MercadoPagoConfig({
    accessToken: token,
    options: { timeout: 8000 },
  });
  return cachedClient;
}

export async function createCheckoutPreference(
  input: CreatePreferenceInput,
): Promise<CreatePreferenceResult> {
  const client = getMpClient();
  const siteUrl = getSiteUrl();
  if (!client || !siteUrl) return { ok: false, error: "NOT_CONFIGURED" };

  try {
    const preference = new Preference(client);
    const successUrl = `${siteUrl}/tienda/checkout/success?orderId=${input.orderId}`;
    const response = await preference.create({
      body: {
        items: input.lines.map((line, index) => ({
          id: `${input.orderNumber}-${index + 1}`,
          title: line.title.slice(0, 120),
          quantity: line.quantity,
          unit_price: line.unitPrice,
          currency_id: "MXN",
        })),
        payer: {
          name: input.customerName.slice(0, 80),
          ...(input.customerEmail ? { email: input.customerEmail } : {}),
        },
        external_reference: input.orderId,
        back_urls: {
          success: successUrl,
          failure: `${siteUrl}/tienda/checkout/failure?orderId=${input.orderId}`,
          pending: `${siteUrl}/tienda/checkout/pending?orderId=${input.orderId}`,
        },
        // auto_return requiere back_urls https públicas.
        ...(successUrl.startsWith("https://")
          ? { auto_return: "approved" as const }
          : {}),
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        statement_descriptor: "MATRIXLAB",
        metadata: {
          order_id: input.orderId,
          order_number: input.orderNumber,
          session_hash: input.sessionHash,
        },
      },
    });

    const redirectUrl = response.init_point ?? response.sandbox_init_point;
    if (!response.id || !redirectUrl) {
      return { ok: false, error: "PROVIDER_ERROR" };
    }
    return { ok: true, preferenceId: String(response.id), redirectUrl };
  } catch {
    // Nunca propagar detalles del proveedor (pueden incluir headers/token).
    return { ok: false, error: "PROVIDER_ERROR" };
  }
}

/** Consulta el estado REAL del pago en Mercado Pago. */
export async function fetchPayment(
  paymentId: string,
): Promise<NormalizedPayment | null> {
  const client = getMpClient();
  if (!client) return null;
  if (!/^\d{1,32}$/.test(paymentId)) return null;
  try {
    const payment = await new Payment(client).get({ id: paymentId });
    if (!payment.id || !payment.status) return null;
    return {
      paymentId: String(payment.id),
      status: payment.status,
      externalReference: payment.external_reference ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Verifica la firma `x-signature` de webhooks de Mercado Pago.
 * Manifest oficial: "id:[data.id];request-id:[x-request-id];ts:[ts];"
 * Si MERCADOPAGO_WEBHOOK_SECRET no está configurado:
 *   - en producción se rechaza el webhook (estricto);
 *   - en desarrollo se permite (modo test) porque igual se confirma el pago
 *     consultando a Mercado Pago con el Access Token.
 */
export function verifyWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = getServerEnv().mpWebhookSecret;
  if (!secret) return !isProduction();
  const { xSignature, xRequestId, dataId } = params;
  if (!xSignature || !dataId) return false;

  const parts = Object.fromEntries(
    xSignature
      .split(",")
      .map((part) => part.split("=").map((s) => s.trim()))
      .filter((pair) => pair.length === 2),
  ) as Record<string, string>;
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId ?? ""};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Mapea estados de Mercado Pago a estados locales (whitelist). */
export function mapPaymentStatus(mpStatus: string): PaymentStatusMapping {
  switch (mpStatus) {
    case "approved":
      return { paymentStatus: "approved", orderStatus: "pagado" };
    case "pending":
    case "authorized":
    case "in_process":
    case "in_mediation":
      return {
        paymentStatus: mpStatus === "in_process" ? "in_process" : "pending",
        orderStatus: "pendiente_pago",
      };
    case "rejected":
      return { paymentStatus: "rejected", orderStatus: "pago_rechazado" };
    case "cancelled":
      return { paymentStatus: "cancelled", orderStatus: "cancelado" };
    case "refunded":
    case "charged_back":
      return { paymentStatus: "refunded", orderStatus: "cancelado" };
    default:
      return { paymentStatus: "pending", orderStatus: "pendiente_pago" };
  }
}
