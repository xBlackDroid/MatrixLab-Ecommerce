import { z } from "zod";
import { PRINT_ZONES, PRODUCT_TYPES } from "@/lib/validation/store";

/** Límite duro del JSON de diseño serializado (bytes). */
export const DESIGN_JSON_MAX_BYTES = 20_000;

/** MIME types permitidos para assets del diseñador. SVG queda PROHIBIDO. */
export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ALLOWED_UPLOAD_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
] as const;

export const UPLOAD_MIN_DIMENSION = 100;
export const UPLOAD_MAX_DIMENSION = 8000;

/** Preview compuesta (dataURL) que genera el canvas: límite en bytes. */
export const PREVIEW_MAX_BYTES = 2_000_000;

export const DesignerCreateSchema = z
  .object({
    productType: z.enum(PRODUCT_TYPES),
    productId: z.uuid(),
    variantId: z.uuid().optional(),
  })
  .strict();

export const DesignerSaveSchema = z
  .object({
    productType: z.enum(PRODUCT_TYPES),
    productId: z.uuid(),
    variantId: z.uuid().optional(),
    baseColor: z.string().max(40).optional(),
    selectedSize: z.string().max(20).optional(),
    printZone: z.enum(PRINT_ZONES),
    positionX: z.number().finite(),
    positionY: z.number().finite(),
    scale: z.number().min(0.1).max(5),
    rotation: z.number().min(-180).max(180),
    customerNotes: z.string().max(500).optional(),
    designJson: z.record(z.string(), z.unknown()).optional(),
    /** Preview compuesta exportada del canvas como data URL (opcional). */
    previewDataUrl: z.string().max(PREVIEW_MAX_BYTES).optional(),
  })
  .strict();

export type DesignerSaveInput = z.infer<typeof DesignerSaveSchema>;

export const UploadMetaSchema = z
  .object({
    designProjectId: z.uuid(),
  })
  .strict();

/** Validación de metadatos del archivo (el MIME real se verifica con sharp). */
export const UploadFileSchema = z.object({
  mimeType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().min(UPLOAD_MIN_DIMENSION).max(UPLOAD_MAX_DIMENSION),
  height: z.number().int().min(UPLOAD_MIN_DIMENSION).max(UPLOAD_MAX_DIMENSION),
});
