import "server-only";

import { requireServiceClient } from "@/lib/db/admin";
import { BUCKETS, createSignedUrl } from "@/lib/db/storage";
import type {
  CartItemRow,
  CartLineView,
  CartRow,
  CartView,
  DesignProjectRow,
  ProductRow,
  ProductVariantRow,
} from "@/lib/db/types";
import { checkAvailability } from "@/lib/store/inventory";
import { getDesignerDisplayName } from "@/lib/designer/product-catalog";
import { computeTotals, resolveUnitPrice } from "@/lib/store/pricing";

/**
 * Carrito por sesión. El navegador solo conoce su cookie httpOnly; toda
 * lectura/escritura valida en servidor que el carrito pertenezca a la sesión.
 * Los precios mostrados y cobrados SIEMPRE se resuelven desde la base de
 * datos (unit_price_snapshot es solo referencia/auditoría).
 */

export type CartErrorCode =
  | "DB_NOT_CONFIGURED"
  | "CART_NOT_FOUND"
  | "ITEM_NOT_FOUND"
  | "PRODUCT_NOT_FOUND"
  | "VARIANT_NOT_FOUND"
  | "VARIANT_REQUIRED"
  | "NOT_SELLABLE"
  | "OUT_OF_STOCK"
  | "QUANTITY_INVALID"
  | "DESIGN_NOT_FOUND"
  | "DESIGN_NOT_EDITABLE"
  | "INTERNAL";

export const CART_ERROR_MESSAGES: Record<CartErrorCode, string> = {
  DB_NOT_CONFIGURED:
    "La tienda está en configuración. Intenta de nuevo más tarde.",
  CART_NOT_FOUND: "No encontramos tu carrito. Vuelve a intentarlo.",
  ITEM_NOT_FOUND: "Ese producto ya no está en tu carrito.",
  PRODUCT_NOT_FOUND: "El producto ya no está disponible.",
  VARIANT_NOT_FOUND: "Esa opción ya no está disponible.",
  VARIANT_REQUIRED: "Selecciona una opción del producto.",
  NOT_SELLABLE: "Este producto no está disponible por ahora.",
  OUT_OF_STOCK: "No hay piezas suficientes disponibles.",
  QUANTITY_INVALID: "La cantidad no es válida para este producto.",
  DESIGN_NOT_FOUND: "No encontramos tu diseño. Vuelve a guardarlo.",
  DESIGN_NOT_EDITABLE: "Este diseño ya está ligado a un pedido.",
  INTERNAL: "Algo salió mal. Intenta de nuevo.",
};

type Result<T> = { ok: true; data: T } | { ok: false; error: CartErrorCode };

export async function getOrCreateCart(sessionId: string): Promise<Result<CartRow>> {
  const client = requireServiceClient();
  const { data: existing, error: findError } = await client
    .from("carts")
    .select("*")
    .eq("session_id", sessionId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (findError) return { ok: false, error: "INTERNAL" };
  if (existing) return { ok: true, data: existing as CartRow };

  const { data: created, error: createError } = await client
    .from("carts")
    .insert({ session_id: sessionId, status: "active" })
    .select("*")
    .single();
  if (createError || !created) return { ok: false, error: "INTERNAL" };
  return { ok: true, data: created as CartRow };
}

export async function getActiveCart(sessionId: string): Promise<CartRow | null> {
  const client = requireServiceClient();
  const { data } = await client
    .from("carts")
    .select("*")
    .eq("session_id", sessionId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as CartRow | null) ?? null;
}

export interface HydratedCartItem {
  item: CartItemRow;
  product: ProductRow;
  variant: ProductVariantRow | null;
  design: DesignProjectRow | null;
}

/** Carga items con producto/variante/diseño. Descarta huérfanos. */
export async function loadCartItems(cartId: string): Promise<HydratedCartItem[]> {
  const client = requireServiceClient();
  const { data, error } = await client
    .from("cart_items")
    .select("*, products(*), product_variants(*), design_projects(*)")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];

  const rows = data as Array<
    CartItemRow & {
      products: ProductRow | null;
      product_variants: ProductVariantRow | null;
      design_projects: DesignProjectRow | null;
    }
  >;

  return rows
    .filter((row) => row.products !== null)
    .map((row) => {
      const { products, product_variants, design_projects, ...item } = row;
      return {
        item: item as CartItemRow,
        product: products as ProductRow,
        variant: product_variants,
        design: design_projects,
      };
    });
}

export async function buildCartView(sessionId: string): Promise<CartView> {
  const empty: CartView = {
    cartId: null,
    status: null,
    items: [],
    totals: { subtotal: 0, shipping: 0, total: 0, currency: "MXN" },
    count: 0,
  };
  const cart = await getActiveCart(sessionId);
  if (!cart) return empty;

  const hydrated = await loadCartItems(cart.id);
  const lines: CartLineView[] = [];

  for (const { item, product, variant, design } of hydrated) {
    const unitPrice = resolveUnitPrice(product, variant);
    const availability = checkAvailability(product, variant, item.quantity);
    let designPreviewUrl: string | null = null;
    if (design?.preview_url) {
      designPreviewUrl = await createSignedUrl(
        BUCKETS.designPreviews,
        design.preview_url,
        1800,
      );
    }
    const customTitle =
      item.is_custom && design
        ? getDesignerDisplayName(design.product_type)
        : null;
    lines.push({
      id: item.id,
      productId: product.id,
      productHandle: product.handle,
      title: product.title,
      customTitle,
      variantId: variant?.id ?? null,
      variantTitle: variant?.title ?? null,
      quantity: item.quantity,
      unitPrice,
      lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
      image: Array.isArray(product.images) ? (product.images[0] ?? null) : null,
      isCustom: item.is_custom,
      designProjectId: item.design_project_id,
      designPreviewUrl,
      minQuantity: product.min_quantity,
      maxQuantity: product.max_quantity,
      availability: availability.ok
        ? "ok"
        : availability.reason === "stock_insuficiente"
          ? "stock_insuficiente"
          : "no_disponible",
    });
  }

  return {
    cartId: cart.id,
    status: cart.status,
    items: lines,
    totals: computeTotals(lines),
    count: lines.reduce((acc, line) => acc + line.quantity, 0),
  };
}

export async function addItemToCart(params: {
  sessionId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  designProjectId?: string;
}): Promise<Result<{ cartId: string }>> {
  const client = requireServiceClient();
  const { sessionId, productId, variantId, quantity, designProjectId } = params;

  const { data: productData, error: productError } = await client
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();
  if (productError || !productData) {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }
  const product = productData as ProductRow;
  if (product.status === "oculto") {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  let variant: ProductVariantRow | null = null;
  if (variantId) {
    const { data: variantData } = await client
      .from("product_variants")
      .select("*")
      .eq("id", variantId)
      .eq("product_id", productId)
      .maybeSingle();
    if (!variantData) return { ok: false, error: "VARIANT_NOT_FOUND" };
    variant = variantData as ProductVariantRow;
  } else {
    // Si el producto tiene variantes visibles, exigir selección.
    const { count } = await client
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId)
      .neq("status", "oculto");
    if ((count ?? 0) > 0) return { ok: false, error: "VARIANT_REQUIRED" };
  }

  let design: DesignProjectRow | null = null;
  if (designProjectId) {
    const { data: designData } = await client
      .from("design_projects")
      .select("*")
      .eq("id", designProjectId)
      .eq("session_id", sessionId)
      .maybeSingle();
    if (!designData) return { ok: false, error: "DESIGN_NOT_FOUND" };
    design = designData as DesignProjectRow;
    if (!["draft", "added_to_cart"].includes(design.status)) {
      return { ok: false, error: "DESIGN_NOT_EDITABLE" };
    }
  }

  const cartResult = await getOrCreateCart(sessionId);
  if (!cartResult.ok) return cartResult;
  const cart = cartResult.data;

  // Línea existente (mismo producto+variante, sin diseño) → sumar cantidades.
  let existingItem: CartItemRow | null = null;
  if (!designProjectId) {
    let query = client
      .from("cart_items")
      .select("*")
      .eq("cart_id", cart.id)
      .eq("product_id", productId)
      .eq("is_custom", false);
    query = variantId
      ? query.eq("variant_id", variantId)
      : query.is("variant_id", null);
    const { data: existingData } = await query.limit(1).maybeSingle();
    existingItem = (existingData as CartItemRow | null) ?? null;
  }

  const totalQuantity = (existingItem?.quantity ?? 0) + quantity;
  const availability = checkAvailability(product, variant, totalQuantity);
  if (!availability.ok) {
    const map = {
      no_disponible: "NOT_SELLABLE",
      stock_insuficiente: "OUT_OF_STOCK",
      cantidad_invalida: "QUANTITY_INVALID",
    } as const;
    return { ok: false, error: map[availability.reason] };
  }

  const unitPrice = resolveUnitPrice(product, variant);

  if (existingItem) {
    const { error } = await client
      .from("cart_items")
      .update({ quantity: totalQuantity, unit_price_snapshot: unitPrice })
      .eq("id", existingItem.id);
    if (error) return { ok: false, error: "INTERNAL" };
  } else {
    const { error } = await client.from("cart_items").insert({
      cart_id: cart.id,
      product_id: productId,
      variant_id: variant?.id ?? null,
      quantity,
      unit_price_snapshot: unitPrice,
      is_custom: Boolean(designProjectId),
      design_project_id: designProjectId ?? null,
    });
    if (error) return { ok: false, error: "INTERNAL" };
  }

  if (design) {
    await client
      .from("design_projects")
      .update({ status: "added_to_cart", cart_id: cart.id })
      .eq("id", design.id)
      .eq("session_id", sessionId);
  }

  return { ok: true, data: { cartId: cart.id } };
}

/** Devuelve el item solo si pertenece al carrito activo de la sesión. */
async function findOwnedItem(
  sessionId: string,
  itemId: string,
): Promise<{ item: CartItemRow; cart: CartRow } | null> {
  const client = requireServiceClient();
  const cart = await getActiveCart(sessionId);
  if (!cart) return null;
  const { data } = await client
    .from("cart_items")
    .select("*")
    .eq("id", itemId)
    .eq("cart_id", cart.id)
    .maybeSingle();
  if (!data) return null;
  return { item: data as CartItemRow, cart };
}

export async function updateItemQuantity(params: {
  sessionId: string;
  itemId: string;
  quantity: number;
}): Promise<Result<{ cartId: string }>> {
  const client = requireServiceClient();
  const owned = await findOwnedItem(params.sessionId, params.itemId);
  if (!owned) return { ok: false, error: "ITEM_NOT_FOUND" };

  const { data: productData } = await client
    .from("products")
    .select("*")
    .eq("id", owned.item.product_id)
    .maybeSingle();
  if (!productData) return { ok: false, error: "PRODUCT_NOT_FOUND" };
  const product = productData as ProductRow;

  let variant: ProductVariantRow | null = null;
  if (owned.item.variant_id) {
    const { data: variantData } = await client
      .from("product_variants")
      .select("*")
      .eq("id", owned.item.variant_id)
      .maybeSingle();
    variant = (variantData as ProductVariantRow | null) ?? null;
  }

  const availability = checkAvailability(product, variant, params.quantity);
  if (!availability.ok) {
    const map = {
      no_disponible: "NOT_SELLABLE",
      stock_insuficiente: "OUT_OF_STOCK",
      cantidad_invalida: "QUANTITY_INVALID",
    } as const;
    return { ok: false, error: map[availability.reason] };
  }

  const { error } = await client
    .from("cart_items")
    .update({
      quantity: params.quantity,
      unit_price_snapshot: resolveUnitPrice(product, variant),
    })
    .eq("id", params.itemId);
  if (error) return { ok: false, error: "INTERNAL" };
  return { ok: true, data: { cartId: owned.cart.id } };
}

export async function removeItem(params: {
  sessionId: string;
  itemId: string;
}): Promise<Result<{ cartId: string }>> {
  const client = requireServiceClient();
  const owned = await findOwnedItem(params.sessionId, params.itemId);
  if (!owned) return { ok: false, error: "ITEM_NOT_FOUND" };

  // El diseño vuelve a draft para que el cliente pueda reutilizarlo.
  if (owned.item.design_project_id) {
    await client
      .from("design_projects")
      .update({ status: "draft", cart_id: null })
      .eq("id", owned.item.design_project_id)
      .eq("session_id", params.sessionId)
      .in("status", ["added_to_cart"]);
  }

  const { error } = await client
    .from("cart_items")
    .delete()
    .eq("id", params.itemId);
  if (error) return { ok: false, error: "INTERNAL" };
  return { ok: true, data: { cartId: owned.cart.id } };
}
