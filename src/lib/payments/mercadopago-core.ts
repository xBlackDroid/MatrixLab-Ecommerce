import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentStatusMapping } from "@/lib/payments/types";

/**
 * Lógica PURA de Mercado Pago (sin secretos ni red), separada de
 * `mercadopago.ts` para poder cubrirla con QA automatizado
 * (`scripts/qa/mercadopago-webhook.test.ts`) sin cargar `server-only`.
 */

/**
 * Manifest oficial de la firma `x-signature`:
 *   `id:[data.id];request-id:[x-request-id];ts:[ts];`
 *
 * Mercado Pago documenta que los segmentos cuyo valor NO viene en la
 * notificación se eliminan por completo del template (clave incluida). Emitir
 * `request-id:;` cuando falta la cabecera `x-request-id` produce un HMAC
 * distinto al del proveedor: la firma se rechaza, el webhook responde 401 y
 * el pago aprobado nunca se aplica al pedido.
 */
export function buildSignatureManifest(params: {
  dataId: string;
  requestId: string | null;
  ts: string;
}): string {
  const segments = [`id:${params.dataId.toLowerCase()};`];
  if (params.requestId) segments.push(`request-id:${params.requestId};`);
  segments.push(`ts:${params.ts};`);
  return segments.join("");
}

/** Parsea `ts=...,v1=...` de la cabecera `x-signature`. */
export function parseSignatureHeader(
  xSignature: string | null,
): { ts: string; v1: string } | null {
  if (!xSignature) return null;
  const parts: Record<string, string> = {};
  for (const part of xSignature.split(",")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key && value) parts[key] = value;
  }
  if (!parts.ts || !parts.v1) return null;
  return { ts: parts.ts, v1: parts.v1 };
}

/** Compara el HMAC esperado con `v1` en tiempo constante. */
export function signatureMatches(params: {
  secret: string;
  manifest: string;
  v1: string;
}): boolean {
  const expected = createHmac("sha256", params.secret)
    .update(params.manifest)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(params.v1, "utf8");
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

/**
 * Ventana de tolerancia del `ts` de `x-signature` (segundos).
 *
 * Mercado Pago firma `id + request-id + ts`, pero el HMAC por sí solo NO
 * caduca: una notificación capturada (proxy corporativo, log de un
 * intermediario, historial de un WAF) se puede reenviar tal cual meses después
 * y su firma seguiría siendo válida. Acotar la frescura del `ts` cierra esa
 * ventana de repetición. 15 minutos deja margen de sobra para el reloj del
 * proveedor y para los reintentos con backoff de Mercado Pago.
 */
export const SIGNATURE_MAX_AGE_SECONDS = 15 * 60;

/**
 * ¿El `ts` de la firma está dentro de la ventana aceptada?
 *
 * Mercado Pago envía `ts` en segundos unix (algunas integraciones históricas
 * lo mandan en milisegundos), así que se normaliza antes de comparar. Se
 * permite una desviación hacia el futuro para relojes adelantados.
 */
export function isSignatureTimestampFresh(
  ts: string,
  nowMs: number = Date.now(),
  maxAgeSeconds: number = SIGNATURE_MAX_AGE_SECONDS,
): boolean {
  const raw = Number(ts);
  if (!Number.isFinite(raw) || raw <= 0) return false;
  // Heurística de unidad: un timestamp en segundos no supera ~1e11 hasta el
  // año 5138; uno en milisegundos ya está por encima hoy.
  const tsMs = raw > 1e11 ? raw : raw * 1000;
  const deltaSeconds = (nowMs - tsMs) / 1000;
  return deltaSeconds <= maxAgeSeconds && deltaSeconds >= -maxAgeSeconds;
}

/** Motivo por el que un pago aprobado NO se aplica a su pedido. */
export type PaymentMismatchReason =
  | "CURRENCY_MISMATCH"
  | "AMOUNT_MISMATCH"
  | "TEST_PAYMENT_IN_PRODUCTION";

export interface PaymentMatchInput {
  /** Monto cobrado por Mercado Pago (transaction_amount). */
  transactionAmount: number | null;
  /** Moneda del cobro (currency_id). */
  currencyId: string | null;
  /** false = pago de sandbox/prueba. */
  liveMode: boolean | null;
  /** Total del pedido guardado en la base (fuente de verdad del negocio). */
  orderTotal: number;
  /** Moneda esperada del pedido. */
  expectedCurrency: string;
  /** true en despliegues productivos: un pago de prueba jamás debe aplicarse. */
  requireLiveMode: boolean;
}

/**
 * Tolerancia de redondeo al comparar montos (MXN).
 *
 * El total del pedido se calcula sumando líneas ya redondeadas a 2 decimales,
 * y Mercado Pago devuelve el cobro con la misma precisión. Un centavo de
 * diferencia por redondeo no debe bloquear un pago legítimo; nada mayor pasa.
 */
export const AMOUNT_TOLERANCE = 0.01;

/**
 * ¿El pago realmente corresponde al pedido que dice pagar?
 *
 * `external_reference` sólo dice A QUÉ pedido apunta el pago; no dice CUÁNTO
 * se cobró. Sin esta comprobación, cualquier pago aprobado en la cuenta de
 * Mercado Pago cuyo `external_reference` sea el UUID de un pedido lo marcaría
 * como pagado por el monto que fuera: un pago parcial (MP permite dividir el
 * cobro en dos tarjetas, y cada parcialidad es un `payment` aprobado propio),
 * un cobro en otra moneda, o un pago de sandbox si alguna vez se despliega con
 * credenciales de prueba. Aquí el servidor exige que el dinero recibido cubra
 * el total del pedido, en la moneda correcta y en modo real.
 *
 * Devuelve `null` cuando el pago es aplicable, o el motivo del rechazo.
 *
 * Un campo ausente (`null`) se trata como NO verificable y por lo tanto NO
 * aplicable: fail-closed. Un pago sin monto declarado no marca pedidos pagados.
 */
export function paymentMismatchReason(
  input: PaymentMatchInput,
): PaymentMismatchReason | null {
  if (input.requireLiveMode && input.liveMode === false) {
    return "TEST_PAYMENT_IN_PRODUCTION";
  }
  if (
    typeof input.currencyId !== "string" ||
    input.currencyId.toUpperCase() !== input.expectedCurrency.toUpperCase()
  ) {
    return "CURRENCY_MISMATCH";
  }
  if (
    typeof input.transactionAmount !== "number" ||
    !Number.isFinite(input.transactionAmount) ||
    input.transactionAmount + AMOUNT_TOLERANCE < input.orderTotal
  ) {
    return "AMOUNT_MISMATCH";
  }
  return null;
}
