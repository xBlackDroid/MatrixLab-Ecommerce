import { z } from "zod";
import {
  CATEGORY_STATUSES,
  ORDER_STATUSES,
  PRODUCT_STATUSES,
  ProductHandleSchema,
  VARIANT_STATUSES,
} from "@/lib/validation/store";

export const AdminLoginSchema = z
  .object({
    password: z.string().min(8).max(200),
  })
  .strict();

const priceSchema = z.number().nonnegative().max(1_000_000);

export const AdminProductSchema = z
  .object({
    title: z.string().min(2).max(120),
    handle: ProductHandleSchema,
    description: z.string().max(5000).optional().default(""),
    categoryId: z.uuid(),
    basePrice: priceSchema,
    compareAtPrice: priceSchema.nullable().optional(),
    images: z.array(z.url().max(600)).max(8).default([]),
    status: z.enum(PRODUCT_STATUSES),
    isCustomizable: z.boolean().default(false),
    productionTime: z.string().max(80).optional().default(""),
    minQuantity: z.number().int().min(1).max(999).default(1),
    maxQuantity: z.number().int().min(1).max(999).default(999),
    tags: z.array(z.string().min(1).max(40)).max(12).default([]),
  })
  .strict()
  .refine((data) => data.maxQuantity >= data.minQuantity, {
    message: "maxQuantity debe ser mayor o igual a minQuantity",
    path: ["maxQuantity"],
  });

export const AdminProductUpdateSchema = z
  .object({
    id: z.uuid(),
    title: z.string().min(2).max(120).optional(),
    handle: ProductHandleSchema.optional(),
    description: z.string().max(5000).optional(),
    categoryId: z.uuid().optional(),
    basePrice: priceSchema.optional(),
    compareAtPrice: priceSchema.nullable().optional(),
    images: z.array(z.url().max(600)).max(8).optional(),
    status: z.enum(PRODUCT_STATUSES).optional(),
    isCustomizable: z.boolean().optional(),
    productionTime: z.string().max(80).optional(),
    minQuantity: z.number().int().min(1).max(999).optional(),
    maxQuantity: z.number().int().min(1).max(999).optional(),
    tags: z.array(z.string().min(1).max(40)).max(12).optional(),
  })
  .strict();

export const AdminVariantSchema = z
  .object({
    productId: z.uuid(),
    title: z.string().min(1).max(120),
    sku: z.string().max(60).optional(),
    price: priceSchema.nullable().optional(),
    stock: z.number().int().min(0).max(1_000_000).default(0),
    color: z.string().max(40).optional(),
    size: z.string().max(20).optional(),
    optionLabel: z.string().max(80).optional(),
    status: z.enum(VARIANT_STATUSES).default("disponible"),
  })
  .strict();

export const AdminCategorySchema = z
  .object({
    title: z.string().min(2).max(80),
    handle: ProductHandleSchema,
    description: z.string().max(1000).optional().default(""),
    imageUrl: z.url().max(600).optional().nullable(),
    sortOrder: z.number().int().min(0).max(999).default(0),
    status: z.enum(CATEGORY_STATUSES).default("activa"),
  })
  .strict();

export const AdminCategoryUpdateSchema = AdminCategorySchema.partial()
  .extend({ id: z.uuid() })
  .strict();

export const InventoryAdjustSchema = z
  .object({
    variantId: z.uuid(),
    /** Delta de stock: positivo repone, negativo descuenta. */
    delta: z
      .number()
      .int()
      .min(-100_000)
      .max(100_000)
      .refine((n) => n !== 0, { message: "El ajuste no puede ser 0" })
      .optional(),
    status: z.enum(VARIANT_STATUSES).optional(),
    reason: z.string().max(200).optional(),
  })
  .strict()
  .refine((data) => data.delta !== undefined || data.status !== undefined, {
    message: "Se requiere delta o status",
  });

export const AdminOrderUpdateSchema = z
  .object({
    orderId: z.uuid(),
    status: z.enum(ORDER_STATUSES),
  })
  .strict();

/** Estados de producción que el admin puede asignar a un diseño. */
export const ADMIN_DESIGN_STATUSES = [
  "in_review",
  "in_production",
  "completed",
  "production_ready",
] as const;

export const AdminDesignUpdateSchema = z
  .object({
    designId: z.uuid(),
    status: z.enum(ADMIN_DESIGN_STATUSES),
  })
  .strict();

export const AdminOrdersQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
});
