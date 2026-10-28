import "server-only";

import { requireServiceClient } from "@/lib/db/admin";
import type {
  InventoryMovementRow,
  ProductRow,
  ProductVariantRow,
} from "@/lib/db/types";
import type { InventoryRow } from "@/lib/store/commercial-blocks";
import {
  presentInventoryEntries,
  type InventoryEntry,
} from "@/lib/store/inventory-presentation";

/**
 * Reglas de disponibilidad. El stock del frontend nunca se usa para decidir:
 * estas funciones consultan el estado real en servidor.
 */

export type AvailabilityResult =
  | { ok: true; onDemand: boolean }
  | { ok: false; reason: "no_disponible" | "stock_insuficiente" | "cantidad_invalida" };

export function checkAvailability(
  product: Pick<
    ProductRow,
    "status" | "min_quantity" | "max_quantity"
  > & { tags?: string[] },
  variant: Pick<ProductVariantRow, "status" | "stock"> | null,
  quantity: number,
): AvailabilityResult {
  if (product.tags?.includes("precio-cotizacion")) return { ok: false, reason: "no_disponible" };
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { ok: false, reason: "cantidad_invalida" };
  }
  if (quantity < product.min_quantity || quantity > product.max_quantity) {
    return { ok: false, reason: "cantidad_invalida" };
  }

  // Estados de producto no vendibles.
  if (!["disponible", "sobre_pedido"].includes(product.status)) {
    return { ok: false, reason: "no_disponible" };
  }

  const variantStatus = variant?.status ?? "disponible";
  if (["oculto", "agotado"].includes(variantStatus)) {
    return { ok: false, reason: "no_disponible" };
  }

  // Sobre pedido (producto o variante): se permite vender sin stock.
  if (product.status === "sobre_pedido" || variantStatus === "sobre_pedido") {
    return { ok: true, onDemand: true };
  }

  // Disponible: exigir stock real cuando hay variante con inventario.
  if (variant && variant.stock < quantity) {
    return { ok: false, reason: "stock_insuficiente" };
  }
  return { ok: true, onDemand: false };
}

/** Ajuste manual de stock desde admin (movimiento auditado). */
export async function adjustStock(params: {
  variantId: string;
  delta?: number;
  status?: ProductVariantRow["status"];
  reason?: string;
  actor: string;
}): Promise<{ ok: boolean; variant?: ProductVariantRow; error?: string }> {
  const client = requireServiceClient();

  const { data: variantData, error: findError } = await client
    .from("product_variants")
    .select("*")
    .eq("id", params.variantId)
    .maybeSingle();
  if (findError || !variantData) {
    return { ok: false, error: "VARIANT_NOT_FOUND" };
  }
  const variant = variantData as ProductVariantRow;

  const updates: Record<string, unknown> = {};
  if (params.delta !== undefined) {
    updates.stock = Math.max(0, variant.stock + params.delta);
  }
  if (params.status) {
    updates.status = params.status;
  }

  const { data: updated, error: updateError } = await client
    .from("product_variants")
    .update(updates)
    .eq("id", params.variantId)
    .select("*")
    .single();
  if (updateError || !updated) {
    return { ok: false, error: "UPDATE_FAILED" };
  }

  if (params.delta !== undefined && params.delta !== 0) {
    await client.from("inventory_movements").insert({
      product_variant_id: params.variantId,
      order_id: null,
      movement_type: params.delta > 0 ? "reposicion" : "ajuste",
      quantity: params.delta,
      reason: params.reason ?? "Ajuste manual desde admin",
    });
  }

  return { ok: true, variant: updated as ProductVariantRow };
}

type InventoryReadClient = Pick<ReturnType<typeof requireServiceClient>, "from">;

export async function listInventory(
  client: InventoryReadClient = requireServiceClient(),
): Promise<InventoryRow[]> {
  const entries: InventoryEntry[] = [];
  const pageSize = 500;
  // La ampliación por color supera 1,000 variantes. Leer todas las páginas
  // evita omitir existencias en el administrador por el límite del Data API.
  // Las relaciones anidadas son LEFT JOIN (nunca inner): una variante sin
  // producto o un producto sin categoría siguen apareciendo.
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from("product_variants")
      .select("*, products(title, handle, images, categories(handle, title))")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error("No pudimos consultar el inventario.");
    const page = (data ?? []) as InventoryEntry[];
    entries.push(...page);
    if (page.length < pageSize) return presentInventoryEntries(entries);
  }
}

export async function listMovements(
  limit = 100,
): Promise<
  Array<
    InventoryMovementRow & {
      product_variants: Pick<ProductVariantRow, "title" | "sku"> | null;
    }
  >
> {
  const client = requireServiceClient();
  const { data, error } = await client
    .from("inventory_movements")
    .select("*, product_variants(title, sku)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as Array<
    InventoryMovementRow & {
      product_variants: Pick<ProductVariantRow, "title" | "sku"> | null;
    }
  >;
}
