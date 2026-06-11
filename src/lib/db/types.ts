/**
 * Tipos de filas de base de datos (snake_case, espejo de las tablas SQL en
 * supabase/migrations) y modelos de vista compuestos.
 */

export type CategoryStatus = "activa" | "oculta";

export type ProductStatus =
  | "disponible"
  | "agotado"
  | "sobre_pedido"
  | "oculto"
  | "proximamente";

export type VariantStatus = "disponible" | "agotado" | "sobre_pedido" | "oculto";

export type CartStatus = "active" | "checked_out" | "converted" | "abandoned";

export type OrderStatus =
  | "pendiente_pago"
  | "pagado"
  | "pago_rechazado"
  | "revisando_diseno"
  | "en_produccion"
  | "listo"
  | "enviado"
  | "entregado"
  | "cancelado";

export type PaymentStatus =
  | "pending"
  | "in_process"
  | "approved"
  | "rejected"
  | "cancelled"
  | "refunded";

export type DesignProjectStatus =
  | "draft"
  | "added_to_cart"
  | "ordered"
  | "production_ready"
  | "in_review"
  | "in_production"
  | "completed";

export type ProductTypeId = "playera" | "gorra" | "tote";

export type PrintZone = "front" | "back" | "center";

export type InventoryMovementType =
  | "venta"
  | "ajuste"
  | "reposicion"
  | "cancelacion";

export interface CategoryRow {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  status: CategoryStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: string;
  category_id: string | null;
  title: string;
  handle: string;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  images: string[];
  status: ProductStatus;
  is_customizable: boolean;
  production_time: string | null;
  min_quantity: number;
  max_quantity: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  title: string;
  sku: string | null;
  price: number | null;
  stock: number;
  color: string | null;
  size: string | null;
  option_label: string | null;
  status: VariantStatus;
  created_at: string;
  updated_at: string;
}

export interface CartRow {
  id: string;
  session_id: string;
  status: CartStatus;
  created_at: string;
  updated_at: string;
}

export interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price_snapshot: number;
  is_custom: boolean;
  design_project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderRow {
  id: string;
  order_number: string;
  session_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: Record<string, string> | null;
  payment_provider: string;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  payment_preference_id: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  title_snapshot: string;
  variant_snapshot: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  is_custom: boolean;
  design_project_id: string | null;
  production_notes: string | null;
  created_at: string;
}

export interface DesignProjectRow {
  id: string;
  session_id: string;
  product_type: ProductTypeId;
  product_id: string | null;
  variant_id: string | null;
  base_color: string | null;
  selected_size: string | null;
  uploaded_asset_url: string | null;
  preview_url: string | null;
  design_json: Record<string, unknown> | null;
  print_zone: PrintZone;
  position_x: number;
  position_y: number;
  scale: number;
  rotation: number;
  customer_notes: string | null;
  status: DesignProjectStatus;
  cart_id: string | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadedAssetRow {
  id: string;
  design_project_id: string;
  original_file_url: string;
  preview_url: string | null;
  file_name_safe: string;
  original_file_name: string;
  mime_type: string;
  width: number;
  height: number;
  size_bytes: number;
  created_at: string;
}

export interface PaymentEventRow {
  id: string;
  provider: string;
  event_id: string;
  order_id: string | null;
  payment_reference: string | null;
  status: string;
  processed_at: string | null;
  raw_event_safe: Record<string, unknown> | null;
  created_at: string;
}

export interface InventoryMovementRow {
  id: string;
  product_variant_id: string;
  order_id: string | null;
  movement_type: InventoryMovementType;
  quantity: number;
  reason: string | null;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Modelos de vista (composición para UI)
// ---------------------------------------------------------------------------

export interface ProductWithVariants extends ProductRow {
  variants: ProductVariantRow[];
  category?: Pick<CategoryRow, "id" | "title" | "handle"> | null;
}

/** Línea de carrito hidratada para UI; precios resueltos en servidor. */
export interface CartLineView {
  id: string;
  productId: string;
  productHandle: string;
  title: string;
  variantId: string | null;
  variantTitle: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image: string | null;
  isCustom: boolean;
  designProjectId: string | null;
  designPreviewUrl: string | null;
  minQuantity: number;
  maxQuantity: number;
  availability: "ok" | "stock_insuficiente" | "no_disponible";
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  total: number;
  currency: "MXN";
}

export interface CartView {
  cartId: string | null;
  status: CartStatus | null;
  items: CartLineView[];
  totals: CartTotals;
  count: number;
}
