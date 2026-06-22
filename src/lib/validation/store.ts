import { z } from "zod";

/**
 * Whitelists del catálogo. Cualquier filtro/orden/estado que llegue del
 * cliente DEBE pasar por estas listas: nunca se interpola input arbitrario
 * en queries.
 */

export const PRODUCT_SORT_OPTIONS = [
  "newest",
  "price_asc",
  "price_desc",
  "featured",
] as const;
export type ProductSort = (typeof PRODUCT_SORT_OPTIONS)[number];

/** Orden de catálogo: si llega algo fuera de whitelist se usa "newest". */
export const ProductSortSchema = z.enum(PRODUCT_SORT_OPTIONS).catch("newest");

export const PRODUCT_STATUSES = [
  "disponible",
  "agotado",
  "sobre_pedido",
  "oculto",
  "proximamente",
] as const;

export const VARIANT_STATUSES = [
  "disponible",
  "agotado",
  "sobre_pedido",
  "oculto",
] as const;

export const ORDER_STATUSES = [
  "pendiente_pago",
  "pagado",
  "pago_rechazado",
  "revisando_diseno",
  "en_produccion",
  "listo",
  "enviado",
  "entregado",
  "cancelado",
] as const;

export const CATEGORY_STATUSES = ["activa", "oculta"] as const;

/** Tipos del diseñador v1 (legado). No ampliar. */
export const PRODUCT_TYPES = ["playera", "gorra", "tote"] as const;

/** Catálogo completo del Laboratorio (Etapa 2). Superconjunto de PRODUCT_TYPES. */
export const DESIGNER_PRODUCT_TYPES = [
  "playera",
  "sudadera",
  "gorra",
  "gorra-trucker",
  "gorra-clasica",
  "tote",
  "stickers-planilla",
  "stickers-repeticion",
  "imanes-planilla",
  "imanes-repeticion",
  "laser",
  "etiquetas-escolares",
] as const;

export const DESIGNER_KINDS = [
  "garment",
  "sheet",
  "laser",
  "school-labels",
] as const;

export const GARMENT_PROFILES = ["nino", "mujer", "hombre"] as const;

export const GARMENT_SIZES = ["CH", "M", "G", "EG"] as const;

export const SHEET_TYPES = ["stickers", "imanes"] as const;

export const SHEET_MODES = ["free", "repeat"] as const;

export const SHEET_SHAPES = ["square", "circle", "rectangle"] as const;

export const PRINT_ZONES = ["front", "back", "center"] as const;

export const DESIGN_STATUSES = [
  "draft",
  "added_to_cart",
  "ordered",
  "production_ready",
  "in_review",
  "in_production",
  "completed",
] as const;

/** Handle: solo minúsculas, números y guiones. */
export const ProductHandleSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/, "Handle inválido");

export const UuidSchema = z.uuid();

/** Estados de producto que el público puede comprar. */
export const SELLABLE_PRODUCT_STATUSES: ReadonlySet<string> = new Set([
  "disponible",
  "sobre_pedido",
]);

/** Estados de producto visibles en catálogo. */
export const VISIBLE_PRODUCT_STATUSES: ReadonlySet<string> = new Set([
  "disponible",
  "agotado",
  "sobre_pedido",
  "proximamente",
]);
