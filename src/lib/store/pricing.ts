import "server-only";

import type { ProductRow, ProductVariantRow } from "@/lib/db/types";
import { roundMoney } from "@/lib/utils";

/**
 * TODA la lógica de precios vive en el servidor. Los precios, cantidades y
 * totales que envía el cliente jamás se usan para cobrar: aquí se resuelven
 * desde la base de datos.
 */

/** Precio unitario real: precio de variante o, en su defecto, precio base. */
export function resolveUnitPrice(
  product: Pick<ProductRow, "base_price">,
  variant?: Pick<ProductVariantRow, "price"> | null,
): number {
  const variantPrice = variant?.price;
  const price =
    variantPrice !== null && variantPrice !== undefined
      ? Number(variantPrice)
      : Number(product.base_price);
  return roundMoney(Number.isFinite(price) && price >= 0 ? price : 0);
}

export interface PricedLine {
  quantity: number;
  unitPrice: number;
}

export function computeLineTotal(line: PricedLine): number {
  return roundMoney(line.unitPrice * line.quantity);
}

export function computeTotals(lines: PricedLine[]) {
  const subtotal = roundMoney(
    lines.reduce((acc, line) => acc + computeLineTotal(line), 0),
  );
  // Etapa 1: envío se coordina después de la compra (sin paqueterías aún).
  const shipping = 0;
  return {
    subtotal,
    shipping,
    total: roundMoney(subtotal + shipping),
    currency: "MXN" as const,
  };
}
