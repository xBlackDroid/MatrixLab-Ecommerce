import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

export function formatPrice(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return mxn.format(Number.isFinite(n) ? n : 0);
}

/** Redondea a 2 decimales para montos en MXN. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Cantidad con su unidad comercial: "1 planilla", "2 planillas".
 *
 * `unit` llega SIEMPRE resuelta desde el servidor (`CartLineView.unitLabel`);
 * esta función sólo la escribe. Sin unidad propia devuelve `null` y quien la
 * llama conserva su copy genérico: no se inventa una unidad para productos que
 * se venden por pieza.
 */
export function formatUnitQuantity(
  quantity: number,
  unit: { one: string; many: string } | null | undefined,
): string | null {
  if (!unit) return null;
  return `${quantity} ${quantity === 1 ? unit.one : unit.many}`;
}

/**
 * Cantidad con unidad y RESPALDO GENÉRICO: "2 planillas" si hay unidad propia,
 * "2 piezas" si no. Es el copy de los totales (resumen del carrito, badge),
 * que siempre tienen que decir algo. La forma sin respaldo es
 * `formatUnitQuantity`, para donde no debe aparecer nada.
 */
export function formatQuantityWithUnit(
  quantity: number,
  unit: { one: string; many: string } | null | undefined,
): string {
  return (
    formatUnitQuantity(quantity, unit) ??
    `${quantity} ${quantity === 1 ? "pieza" : "piezas"}`
  );
}

/**
 * Unidad de un CONJUNTO de líneas (resumen del carrito, badge del header).
 *
 * Un total sólo puede nombrar una unidad si TODAS las líneas comparten la
 * misma: un carrito mixto (una planilla + un vaso) devuelve `null` y quien
 * llama cae al copy genérico, que es lo correcto — no son la misma cosa. Se
 * comparan singular Y plural: dos unidades distintas podrían compartir el
 * singular y el total acabaría con el plural de la primera línea.
 */
export function sharedCommercialUnit<
  T extends { unitLabel: { one: string; many: string } | null },
>(lines: readonly T[]): T["unitLabel"] {
  const first = lines[0]?.unitLabel ?? null;
  if (!first) return null;
  return lines.every(
    (line) =>
      line.unitLabel?.one === first.one && line.unitLabel?.many === first.many,
  )
    ? first
    : null;
}
