import type { OrderStatus, PaymentStatus } from "@/lib/db/types";

/** Capa agnóstica de proveedor: hoy Mercado Pago, extensible en etapa 2. */

export interface CheckoutLineInput {
  title: string;
  quantity: number;
  /** Precio unitario YA validado en backend (nunca del cliente). */
  unitPrice: number;
}

export interface CreatePreferenceInput {
  orderId: string;
  orderNumber: string;
  lines: CheckoutLineInput[];
  /** Costo de envío del pedido (0 en Etapa 1). Se cobra en la preferencia. */
  shipping?: number;
  customerName: string;
  customerEmail?: string;
  /** Hash anónimo de la sesión (nunca el sessionId crudo). */
  sessionHash: string;
}

export type CreatePreferenceResult =
  | { ok: true; preferenceId: string; redirectUrl: string }
  | { ok: false; error: "NOT_CONFIGURED" | "PROVIDER_ERROR" };

export interface NormalizedPayment {
  paymentId: string;
  status: string;
  externalReference: string | null;
  /**
   * Monto realmente cobrado por el proveedor. `null` si el proveedor no lo
   * declara: el webhook lo trata como no verificable y NO marca el pedido
   * pagado (fail-closed).
   */
  transactionAmount: number | null;
  /** Moneda del cobro (ISO-4217, p. ej. "MXN"). */
  currencyId: string | null;
  /** `false` = pago de sandbox/prueba; jamás debe aplicarse en producción. */
  liveMode: boolean | null;
}

/**
 * Resultado de consultar un pago al proveedor.
 * `NOT_FOUND` = el id no corresponde a un pago (no reintentar);
 * `TRANSIENT` = fallo de red/proveedor (conviene que el webhook reintente).
 */
export type FetchPaymentResult =
  | { ok: true; payment: NormalizedPayment }
  | { ok: false; reason: "NOT_FOUND" | "TRANSIENT" };

export interface PaymentStatusMapping {
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
}
