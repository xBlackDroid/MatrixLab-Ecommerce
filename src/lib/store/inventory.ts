import "server-only";

import { requireServiceClient } from "@/lib/db/admin";
import type {
  InventoryMovementRow,
  ProductRow,
  ProductVariantRow,
} from "@/lib/db/types";

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
  >,
  variant: Pick<ProductVariantRow, "status" | "stock"> | null,
  quantity: number,
): AvailabilityResult {
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

export async function listInventory(): Promise<
  Array<ProductVariantRow & { products: Pick<ProductRow, "title" | "handle"> | null }>
> {
  const client = requireServiceClient();
  const { data, error } = await client
    .from("product_variants")
    .select("*, products(title, handle)")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as Array<
    ProductVariantRow & { products: Pick<ProductRow, "title" | "handle"> | null }
  >;
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
