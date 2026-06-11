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
}

export interface PaymentStatusMapping {
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
}
