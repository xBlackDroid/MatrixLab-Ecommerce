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

/** Tipos del diseñador v1 (legado). NO ampliar: el mockup v1 depende de él. */
export type ProductTypeId = "playera" | "gorra" | "tote";

/**
 * Catálogo completo de tipos del Laboratorio (Etapa 2). Superconjunto de
 * ProductTypeId, por lo que los diseños v1 siguen siendo válidos.
 */
export type DesignerProductType =
  | "playera"
  | "sudadera"
  | "gorra"
  | "gorra-trucker"
  | "gorra-clasica"
  | "tote"
  | "stickers-planilla"
  | "stickers-repeticion"
  | "imanes-planilla"
  | "imanes-repeticion"
  | "laser"
  | "etiquetas-escolares";

/** Familia de diseñador: define qué editor se monta. */
export type DesignerKind = "garment" | "sheet" | "laser" | "school-labels";

/** Perfil de talla para prendas (afecta área máxima de impresión). */
export type GarmentProfile = "nino" | "mujer" | "hombre";

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

/**
 * Copia INMUTABLE de la dirección con la que se compró un pedido.
 *
 * Vive en `orders.shipping_address` (jsonb) y no se re-lee de ningún perfil:
 * si el cliente cambia su domicilio después, el pedido histórico sigue
 * diciendo a dónde se envió. La forma la valida `ShippingAddressSchema`
 * (src/lib/validation/checkout.ts) y la documenta la migración 0006.
 */
export interface ShippingAddressSnapshot {
  recipient_name: string;
  phone: string;
  email: string;
  postal_code: string;
  state: string;
  municipality: string;
  neighborhood: string;
  street: string;
  exterior_number: string;
  interior_number?: string;
  references?: string;
}

/** Modalidad de entrega. Espeja el CHECK de `orders.delivery_method`. */
export type DeliveryMethod = "shipping";

export interface OrderRow {
  id: string;
  order_number: string;
  session_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  /**
   * `null` en los pedidos anteriores a la captura de dirección: hay que
   * tratarlos siempre como "sin dirección registrada", nunca asumir el objeto.
   */
  shipping_address: ShippingAddressSnapshot | null;
  /**
   * OPCIONAL a propósito: la columna llega con la migración 0006 y hasta que
   * se aplique, un `select("*")` no la trae. Marcarla obligatoria haría que
   * `order.delivery_method === "pickup"` compilara comparando contra
   * `undefined`. Cuando 0006 esté aplicada en todos los entornos se puede
   * volver obligatoria.
   */
  delivery_method?: DeliveryMethod;
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
  /** Amplio (Etapa 2). Los diseños v1 siguen cayendo dentro de este tipo. */
  product_type: DesignerProductType;
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
  /** Columnas aditivas Etapa 2 (migración 0004). Nullables para diseños v1. */
  designer_type: DesignerKind | null;
  profile: GarmentProfile | null;
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
  /** Nombre público del diseño personalizado (deriva del tipo de diseñador). */
  customTitle: string | null;
  variantId: string | null;
  variantTitle: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /**
   * Unidad comercial de la línea, RESUELTA EN SERVIDOR a partir del producto
   * (ver `commercialUnitOf`). `null` = producto sin unidad propia: la UI
   * conserva su copy genérico ("pieza", "c/u"). El cliente nunca la envía: el
   * carrito sólo acepta ids y cantidad, así que no puede falsificarse.
   */
  unitLabel: CommercialUnit | null;
  image: string | null;
  isCustom: boolean;
  designProjectId: string | null;
  designPreviewUrl: string | null;
  minQuantity: number;
  maxQuantity: number;
  availability: "ok" | "stock_insuficiente" | "no_disponible";
}

/**
 * Unidad comercial de un producto, en singular y plural ("planilla" /
 * "planillas"). Vive aquí, con el resto de modelos de vista, para que este
 * archivo —que importan componentes de cliente— no dependa de los módulos de
 * catálogo. Quién la resuelve: `commercialUnitOf` en store/curated-lines.
 */
export interface CommercialUnit {
  one: string;
  many: string;
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
