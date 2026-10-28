import "server-only";

import { requireServiceClient } from "@/lib/db/admin";
import type { ProductVariantRow } from "@/lib/db/types";
import {
  resolveInventoryPricing,
  samePriceAmount,
  toPriceAmount,
  type InventoryPricing,
} from "@/lib/store/inventory-pricing";

/**
 * Cambio de precio de UNA variante desde Inventario.
 *
 * Sólo escribe `product_variants.price` de la fila pedida: nunca el precio
 * base del producto, otras tallas/colores, stock ni estado, y no crea
 * `inventory_movements` (un precio no es un movimiento de existencias). La
 * tienda y el checkout ya resuelven `variant.price ?? base_price` desde la
 * base en cada request, así que el cambio se cobra tal cual.
 *
 * Compare-and-swap: el UPDATE lleva el precio que el admin tenía en pantalla
 * como condición (`.eq("price", …)` o `.is("price", null)`). Si otro
 * dispositivo lo cambió entre la lectura y el guardado, no se toca ninguna
 * fila y se devuelve CONFLICT con el precio vigente.
 */

type PriceClient = Pick<ReturnType<typeof requireServiceClient>, "from">;

type ProductPriceJoin = { base_price: unknown } | { base_price: unknown }[] | null;

type CurrentVariant = { variant: ProductVariantRow; pricing: InventoryPricing };

export type VariantPriceUpdateResult =
  | {
      ok: true;
      changed: boolean;
      variant: ProductVariantRow;
      oldPrice: number | null;
      pricing: InventoryPricing;
    }
  | { ok: false; error: "NOT_FOUND" | "NO_BASE_PRICE" | "UPDATE_FAILED" }
  | { ok: false; error: "CONFLICT"; pricing: InventoryPricing };

function single<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** Precio vigente + precio base del producto (LEFT JOIN: puede ser huérfana). */
async function readCurrent(
  client: PriceClient,
  variantId: string,
): Promise<{ ok: true; row: CurrentVariant | null } | { ok: false }> {
  const { data, error } = await client
    .from("product_variants")
    .select("*, products(base_price)")
    .eq("id", variantId)
    .maybeSingle();
  if (error) return { ok: false };
  if (!data) return { ok: true, row: null };
  const { products, ...variant } = data as ProductVariantRow & { products: ProductPriceJoin };
  return {
    ok: true,
    row: {
      variant,
      pricing: resolveInventoryPricing(variant.price, single(products)?.base_price ?? null),
    },
  };
}

export async function updateVariantPrice(
  params: { variantId: string; price: number | null; expectedPrice: number | null },
  client: PriceClient = requireServiceClient(),
): Promise<VariantPriceUpdateResult> {
  const read = await readCurrent(client, params.variantId);
  if (!read.ok) return { ok: false, error: "UPDATE_FAILED" };
  if (!read.row) return { ok: false, error: "NOT_FOUND" };

  const current = read.row.pricing;
  const currentRaw = toPriceAmount(read.row.variant.price);
  if (!samePriceAmount(currentRaw, params.expectedPrice)) {
    return { ok: false, error: "CONFLICT", pricing: current };
  }
  // Quitar el precio propio sólo si hay un precio base al cual volver.
  if (params.price === null && current.base === null) {
    return { ok: false, error: "NO_BASE_PRICE" };
  }
  if (samePriceAmount(currentRaw, params.price)) {
    // Mismo precio: no se escribe ni se audita nada.
    return { ok: true, changed: false, variant: read.row.variant, oldPrice: currentRaw, pricing: current };
  }

  let query = client
    .from("product_variants")
    .update({ price: params.price })
    .eq("id", params.variantId);
  query =
    currentRaw === null
      ? query.is("price", null)
      : query.eq("price", currentRaw);
  const { data, error } = await query.select("*");
  if (error) return { ok: false, error: "UPDATE_FAILED" };

  const rows = (data ?? []) as ProductVariantRow[];
  if (rows.length === 0) {
    // Ninguna fila cumplió la condición: otro guardado ganó (o se borró).
    const again = await readCurrent(client, params.variantId);
    if (!again.ok) return { ok: false, error: "UPDATE_FAILED" };
    if (!again.row) return { ok: false, error: "NOT_FOUND" };
    return { ok: false, error: "CONFLICT", pricing: again.row.pricing };
  }
  if (rows.length !== 1 || rows[0].id !== params.variantId) {
    return { ok: false, error: "UPDATE_FAILED" };
  }

  const variant = rows[0];
  return {
    ok: true,
    changed: true,
    variant,
    oldPrice: currentRaw,
    pricing: resolveInventoryPricing(variant.price, current.base),
  };
}
