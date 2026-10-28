/**
 * Precio por variante en el inventario admin.
 *
 * Sin dependencias de servidor: lo usan la tabla de cliente (captura y
 * formato), la presentación de servidor y la validación de la API. El precio
 * EFECTIVO es el mismo que cobra la tienda (`resolveUnitPrice`): el precio de
 * la variante si existe; si no, el precio base del producto.
 */

/** Tope de captura (igual que `priceSchema` del admin de productos). */
export const INVENTORY_PRICE_MAX = 1_000_000;

/** De dónde sale el precio que se muestra en la fila. */
export type InventoryPriceSource = "variant" | "base" | "none";

export interface InventoryPricing {
  /** `product_variants.price` tal cual (null = hereda el precio base). */
  override: number | null;
  /** `products.base_price`; null si la variante no tiene producto. */
  base: number | null;
  /** Lo que cobra la tienda; null → "Sin precio" (nunca un 0 inventado). */
  effective: number | null;
  source: InventoryPriceSource;
}

/**
 * Monto de la base o de la API normalizado: número finito ≥ 0 o null. El
 * Data API entrega `numeric` como número, pero se aceptan cadenas numéricas
 * por si algún día llega como texto. Cualquier otra cosa → null.
 */
export function toPriceAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value.trim())) {
    return toPriceAmount(Number(value.trim()));
  }
  return null;
}

/** Precio que muestra la fila: variante ?? base, sin inventar ceros. */
export function resolveInventoryPricing(
  override: unknown,
  base: unknown,
): InventoryPricing {
  const variantPrice = toPriceAmount(override);
  const basePrice = toPriceAmount(base);
  if (variantPrice !== null) {
    return { override: variantPrice, base: basePrice, effective: variantPrice, source: "variant" };
  }
  if (basePrice !== null) {
    return { override: null, base: basePrice, effective: basePrice, source: "base" };
  }
  return { override: null, base: null, effective: null, source: "none" };
}

/**
 * ¿Monto válido para guardar? Número finito, 0 ≤ n ≤ 1,000,000 y como mucho
 * dos decimales. Se comprueba sobre la representación decimal exacta del
 * número (no con aritmética flotante): 0.29 pasa, 0.291 y 1e-7 no.
 */
export function isValidPriceAmount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= INVENTORY_PRICE_MAX &&
    /^\d+(\.\d{1,2})?$/.test(String(value))
  );
}

export type PriceInputResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

/**
 * Lee lo que el admin escribió en el campo de precio. Acepta punto o coma
 * decimal ("199.5", "199,50") y un "$" opcional. Rechaza en vez de adivinar:
 * vacío (nunca se vuelve 0), negativos, más de dos decimales, separadores de
 * miles ("1,234" sería ambiguo) y cualquier texto sobrante. Nada de
 * `parseFloat`, que convierte "12abc" en 12 sin avisar.
 */
export function parsePriceInput(raw: string): PriceInputResult {
  const text = raw.replace(/\s+/g, "").replace(/^\$/, "");
  if (text === "") return { ok: false, error: "Escribe un precio." };
  if (text.startsWith("-")) {
    return { ok: false, error: "El precio no puede ser negativo." };
  }
  const match = /^(\d*)(?:[.,](\d*))?$/.exec(text);
  if (!match || (match[1] === "" && !match[2])) {
    return { ok: false, error: "Usa solo números, con punto o coma decimal." };
  }
  const [, whole, fraction = ""] = match;
  if (fraction.length > 2) {
    return { ok: false, error: "Máximo dos decimales (sin separador de miles)." };
  }
  const value = Number(`${whole || "0"}.${fraction || "0"}`);
  if (!Number.isFinite(value) || value > INVENTORY_PRICE_MAX) {
    return { ok: false, error: "El precio máximo es $1,000,000.00." };
  }
  return { ok: true, value };
}

/** Texto inicial del campo: "199.5" → "199.50"; sin precio → vacío. */
export function priceInputValue(value: number | null): string {
  return value === null ? "" : value.toFixed(2);
}

const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

/** "$1,299.00"; null → "Sin precio" (un 0 real sí se muestra como $0.00). */
export function formatInventoryPrice(value: number | null): string {
  return value === null ? "Sin precio" : mxn.format(value);
}

/** Igualdad de montos tal como los guarda `numeric(12,2)`. */
export function samePriceAmount(a: number | null, b: number | null): boolean {
  if (a === null || b === null) return a === b;
  return Math.round(a * 100) === Math.round(b * 100);
}
