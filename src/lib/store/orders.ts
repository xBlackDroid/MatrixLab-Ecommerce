import "server-only";

import { randomBytes } from "node:crypto";
import { logAudit, requireServiceClient } from "@/lib/db/admin";
import type {
  DesignProjectRow,
  OrderItemRow,
  OrderRow,
  OrderStatus,
} from "@/lib/db/types";
import { loadCartItems, type CartErrorCode } from "@/lib/store/cart";
import { checkAvailability } from "@/lib/store/inventory";
import { computeTotals, resolveUnitPrice } from "@/lib/store/pricing";
import { sanitizeMultiline, sanitizeText } from "@/lib/security/sanitize";
import { ORDER_STATUSES } from "@/lib/validation/store";

/**
 * Pedidos. Se crean SOLO desde el endpoint de checkout, con precios e
 * inventario recalculados aquí. El inventario NO se descuenta al crear el
 * pedido: se descuenta de forma transaccional cuando el webhook confirma el
 * pago (función SQL process_paid_order).
 */

export function generateOrderNumber(): string {
  const now = new Date();
  const stamp = [
    String(now.getFullYear()).slice(2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `ML${stamp}-${suffix}`;
}

export type CreateOrderError =
  | CartErrorCode
  | "CART_EMPTY"
  | "CART_INVALID_ITEMS";

export interface CreateOrderResult {
  order: OrderRow;
  items: OrderItemRow[];
}

export async function createOrderFromCart(params: {
  sessionId: string;
  cartId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  shippingAddress?: Record<string, string | undefined>;
  notes?: string;
}): Promise<
  | { ok: true; data: CreateOrderResult }
  | { ok: false; error: CreateOrderError; detail?: string }
> {
  const client = requireServiceClient();

  // El carrito debe pertenecer a la sesión y estar activo.
  const { data: cartData } = await client
    .from("carts")
    .select("*")
    .eq("id", params.cartId)
    .eq("session_id", params.sessionId)
    .eq("status", "active")
    .maybeSingle();
  if (!cartData) return { ok: false, error: "CART_NOT_FOUND" };

  const hydrated = await loadCartItems(params.cartId);
  if (hydrated.length === 0) return { ok: false, error: "CART_EMPTY" };

  // Validación final de inventario/estado + precios desde DB.
  const pricedLines = [];
  for (const { item, product, variant, design } of hydrated) {
    const availability = checkAvailability(product, variant, item.quantity);
    if (!availability.ok) {
      return {
        ok: false,
        error: "CART_INVALID_ITEMS",
        detail: product.title,
      };
    }
    if (item.is_custom) {
      if (!design || design.session_id !== params.sessionId) {
        return { ok: false, error: "DESIGN_NOT_FOUND" };
      }
      if (!["added_to_cart", "draft"].includes(design.status)) {
        return { ok: false, error: "DESIGN_NOT_EDITABLE" };
      }
    }
    pricedLines.push({
      item,
      product,
      variant,
      design,
      unitPrice: resolveUnitPrice(product, variant),
    });
  }

  const totals = computeTotals(
    pricedLines.map((line) => ({
      quantity: line.item.quantity,
      unitPrice: line.unitPrice,
    })),
  );

  const orderNumber = generateOrderNumber();
  const shippingAddress = params.shippingAddress
    ? Object.fromEntries(
        Object.entries(params.shippingAddress)
          .filter(([, value]) => typeof value === "string" && value.trim())
          .map(([key, value]) => [key, sanitizeText(value, 240)]),
      )
    : null;

  const { data: orderData, error: orderError } = await client
    .from("orders")
    .insert({
      order_number: orderNumber,
      session_id: params.sessionId,
      customer_name: sanitizeText(params.customerName, 80),
      customer_email: params.customerEmail
        ? sanitizeText(params.customerEmail, 120)
        : null,
      customer_phone: sanitizeText(params.customerPhone, 20),
      shipping_address: shippingAddress,
      payment_provider: "mercadopago",
      payment_status: "pending",
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total,
      status: "pendiente_pago",
      notes: params.notes ? sanitizeMultiline(params.notes, 500) : null,
    })
    .select("*")
    .single();
  if (orderError || !orderData) return { ok: false, error: "INTERNAL" };
  const order = orderData as OrderRow;

  const itemsPayload = pricedLines.map((line) => ({
    order_id: order.id,
    product_id: line.product.id,
    variant_id: line.variant?.id ?? null,
    title_snapshot: line.product.title,
    variant_snapshot: line.variant?.title ?? null,
    quantity: line.item.quantity,
    unit_price: line.unitPrice,
    total: Math.round(line.unitPrice * line.item.quantity * 100) / 100,
    is_custom: line.item.is_custom,
    design_project_id: line.item.design_project_id,
    production_notes: line.design?.customer_notes
      ? sanitizeMultiline(line.design.customer_notes, 500)
      : null,
  }));

  const { data: itemsData, error: itemsError } = await client
    .from("order_items")
    .insert(itemsPayload)
    .select("*");
  if (itemsError || !itemsData) {
    // Limpieza defensiva: no dejar pedidos vacíos.
    await client.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "INTERNAL" };
  }

  // Ligar diseños al pedido (quedan bloqueados para edición del cliente).
  const designIds = pricedLines
    .map((line) => line.item.design_project_id)
    .filter((id): id is string => Boolean(id));
  if (designIds.length > 0) {
    await client
      .from("design_projects")
      .update({ status: "ordered", order_id: order.id })
      .in("id", designIds)
      .eq("session_id", params.sessionId);
  }

  return { ok: true, data: { order, items: itemsData as OrderItemRow[] } };
}

export async function setOrderPreference(
  orderId: string,
  preferenceId: string,
): Promise<void> {
  const client = requireServiceClient();
  await client
    .from("orders")
    .update({ payment_preference_id: preferenceId })
    .eq("id", orderId);
}

/** Pedido visible para el cliente solo si coincide su sesión. */
export async function getOrderForSession(
  orderId: string,
  sessionId: string,
): Promise<{ order: OrderRow; items: OrderItemRow[] } | null> {
  const client = requireServiceClient();
  const { data: orderData } = await client
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("session_id", sessionId)
    .maybeSingle();
  if (!orderData) return null;
  const { data: itemsData } = await client
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  return {
    order: orderData as OrderRow,
    items: (itemsData ?? []) as OrderItemRow[],
  };
}

// ---------------------------------------------------------------------------
// Operaciones de administración
// ---------------------------------------------------------------------------

export async function listOrdersAdmin(
  status?: OrderStatus,
): Promise<Array<OrderRow & { order_items: { count: number }[] }>> {
  const client = requireServiceClient();
  let query = client
    .from("orders")
    .select("*, order_items(count)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return data as Array<OrderRow & { order_items: { count: number }[] }>;
}

export async function getOrderAdmin(orderId: string): Promise<{
  order: OrderRow;
  items: OrderItemRow[];
  designs: DesignProjectRow[];
} | null> {
  const client = requireServiceClient();
  const { data: orderData } = await client
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (!orderData) return null;
  const [{ data: itemsData }, { data: designsData }] = await Promise.all([
    client
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
    client.from("design_projects").select("*").eq("order_id", orderId),
  ]);
  return {
    order: orderData as OrderRow,
    items: (itemsData ?? []) as OrderItemRow[],
    designs: (designsData ?? []) as DesignProjectRow[],
  };
}

export async function updateOrderStatusAdmin(params: {
  orderId: string;
  status: OrderStatus;
  actor: string;
}): Promise<{ ok: boolean }> {
  const client = requireServiceClient();
  const { error } = await client
    .from("orders")
    .update({ status: params.status })
    .eq("id", params.orderId);
  if (error) return { ok: false };
  await logAudit({
    actor: params.actor,
    action: `order.status.${params.status}`,
    entityType: "order",
    entityId: params.orderId,
  });
  return { ok: true };
}
