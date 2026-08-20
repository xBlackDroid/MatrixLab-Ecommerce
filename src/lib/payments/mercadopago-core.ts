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
