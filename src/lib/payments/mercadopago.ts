import "server-only";

import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import {
  getServerEnv,
  getSiteUrl,
  isProduction,
  usesLiveMercadoPagoCredentials,
} from "@/lib/security/env";
import {
  buildSignatureManifest,
  isSignatureTimestampFresh,
  parseSignatureHeader,
  signatureMatches,
} from "@/lib/payments/mercadopago-core";
import type {
  CreatePreferenceInput,
  CreatePreferenceResult,
  FetchPaymentResult,
} from "@/lib/payments/types";

export { mapPaymentStatus, paymentMismatchReason } from "@/lib/payments/mercadopago-core";

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

  const shipping = Math.round((input.shipping ?? 0) * 100) / 100;

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
        // El cobro de Mercado Pago debe coincidir con el total del pedido.
        // Si algún día el envío deja de ser 0, va como costo de envío en la
        // preferencia en lugar de quedarse sin cobrar.
        ...(shipping > 0
          ? { shipments: { cost: shipping, mode: "not_specified" as const } }
          : {}),
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

/** Lee el `status` HTTP de un error del SDK sin exponer su contenido. */
function errorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const candidate = (error as { status?: unknown; statusCode?: unknown });
  const value = candidate.status ?? candidate.statusCode;
  return typeof value === "number" ? value : null;
}

/**
 * Consulta el estado REAL del pago en Mercado Pago.
 *
 * Distingue "no existe" de "fallo transitorio": un id inexistente (404) no
 * debe provocar 5xx eternos en el webhook, mientras que un timeout o un 5xx
 * del proveedor sí debe pedirle a Mercado Pago que reintente.
 */
export async function fetchPayment(
  paymentId: string,
): Promise<FetchPaymentResult> {
  const client = getMpClient();
  if (!client) return { ok: false, reason: "TRANSIENT" };
  if (!/^\d{1,32}$/.test(paymentId)) return { ok: false, reason: "NOT_FOUND" };
  try {
    const payment = await new Payment(client).get({ id: paymentId });
    if (!payment.id || !payment.status) {
      return { ok: false, reason: "TRANSIENT" };
    }
    return {
      ok: true,
      payment: {
        paymentId: String(payment.id),
        status: payment.status,
        externalReference: payment.external_reference ?? null,
        // Datos de INTEGRIDAD del cobro: el webhook los compara contra el
        // pedido antes de marcarlo pagado. Un campo ausente queda en null y
        // el webhook rechaza aplicar el pago (fail-closed).
        transactionAmount:
          typeof payment.transaction_amount === "number"
            ? payment.transaction_amount
            : null,
        currencyId:
          typeof payment.currency_id === "string" ? payment.currency_id : null,
        liveMode:
          typeof payment.live_mode === "boolean" ? payment.live_mode : null,
      },
    };
  } catch (error) {
    const status = errorStatus(error);
    if (status === 400 || status === 404) {
      return { ok: false, reason: "NOT_FOUND" };
    }
    return { ok: false, reason: "TRANSIENT" };
  }
}

/**
 * Verifica la firma `x-signature` de webhooks de Mercado Pago.
 *
 * Si MERCADOPAGO_WEBHOOK_SECRET no está configurado el webhook se rechaza en
 * producción Y en cualquier despliegue que use credenciales REALES de Mercado
 * Pago (`APP_USR-…`), aunque NODE_ENV no diga "production". El puente de
 * desarrollo sin secreto sólo aplica a credenciales de prueba: así una
 * instancia de staging apuntando a la cuenta real nunca acepta notificaciones
 * sin firmar.
 *
 * Además de la firma se valida la FRESCURA del `ts`: un HMAC válido no caduca
 * por sí solo, y sin ventana de tiempo una notificación capturada podría
 * reenviarse indefinidamente.
 */
export function verifyWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  /** Inyectable para pruebas; por defecto el reloj del servidor. */
  nowMs?: number;
}): boolean {
  const secret = getServerEnv().mpWebhookSecret;
  if (!secret) return !isProduction() && !usesLiveMercadoPagoCredentials();
  if (!params.dataId) return false;
  const parsed = parseSignatureHeader(params.xSignature);
  if (!parsed) return false;
  if (!isSignatureTimestampFresh(parsed.ts, params.nowMs ?? Date.now())) {
    return false;
  }

  return signatureMatches({
    secret,
    manifest: buildSignatureManifest({
      dataId: params.dataId,
      requestId: params.xRequestId,
      ts: parsed.ts,
    }),
    v1: parsed.v1,
  });
}

/**
 * ¿El webhook debe exigir `live_mode`?
 *
 * En producción siempre. Además, en cualquier despliegue con credenciales
 * reales: aplicar un pago de sandbox sobre la cuenta real marcaría pedidos
 * como pagados sin dinero de por medio.
 */
export function requireLivePayments(): boolean {
  return isProduction() || usesLiveMercadoPagoCredentials();
}
