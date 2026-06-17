import { z } from "zod";
import {
  DESIGNER_PRODUCT_TYPES,
  GARMENT_PROFILES,
  GARMENT_SIZES,
  PRINT_ZONES,
  PRODUCT_TYPES,
  SHEET_SHAPES,
} from "@/lib/validation/store";

/** Límite duro del JSON de diseño serializado (bytes) — v1. */
export const DESIGN_JSON_MAX_BYTES = 20_000;

/** Límite del JSON de diseño v2 (multi-asset / planillas / láser). */
export const DESIGN_JSON_MAX_BYTES_V2 = 80_000;

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
    // Amplio (Etapa 2). v1 sigue enviando playera/gorra/tote ⊂ este conjunto.
    productType: z.enum(DESIGNER_PRODUCT_TYPES),
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

// ===========================================================================
// Esquemas v2: prendas multi-imagen, planillas y láser.
// El backend NO confía en el cliente: estos límites son la barrera real.
// ===========================================================================

const SHEET_PRODUCT_TYPES = [
  "stickers-planilla",
  "stickers-repeticion",
  "imanes-planilla",
  "imanes-repeticion",
] as const;

const finiteNumber = z.number().finite();

// ---- Prendas (garment) ----------------------------------------------------

const GarmentAssetSchema = z
  .object({
    assetId: z.uuid(),
    url: z.string().max(1200).optional(),
    x: finiteNumber,
    y: finiteNumber,
    scale: z.number().min(0.05).max(12),
    rotation: z.number().min(-180).max(180),
    widthCm: z.number().min(0).max(400),
    heightCm: z.number().min(0).max(400),
    withinSafeArea: z.boolean().optional(),
  })
  .strict();

const GarmentViewSchema = z
  .object({
    printAreaCm: z
      .object({ width: z.number().min(0).max(400), height: z.number().min(0).max(400) })
      .strict(),
    assets: z.array(GarmentAssetSchema).max(2),
  })
  .strict();

export const GarmentDesignJsonSchema = z
  .object({
    version: z.literal(2),
    designerType: z.literal("garment"),
    productType: z.enum(DESIGNER_PRODUCT_TYPES),
    profile: z.enum(GARMENT_PROFILES),
    size: z.enum(GARMENT_SIZES),
    colorId: z.string().max(40),
    stage: z
      .object({ width: z.number(), height: z.number() })
      .strict()
      .optional(),
    views: z
      .object({ front: GarmentViewSchema, back: GarmentViewSchema })
      .strict(),
  })
  .strict()
  // Máximo 1 imagen al frente, 2 atrás. Barrera de seguridad en backend.
  .refine((d) => d.views.front.assets.length <= 1, {
    message: "El frente admite máximo 1 imagen.",
    path: ["views", "front", "assets"],
  })
  .refine((d) => d.views.back.assets.length <= 2, {
    message: "La espalda admite máximo 2 imágenes.",
    path: ["views", "back", "assets"],
  });

export const GarmentSavePayloadSchema = z
  .object({
    designerType: z.literal("garment"),
    productType: z.enum(DESIGNER_PRODUCT_TYPES),
    productId: z.uuid(),
    variantId: z.uuid().optional(),
    colorId: z.string().max(40),
    profile: z.enum(GARMENT_PROFILES),
    size: z.enum(GARMENT_SIZES),
    customerNotes: z.string().max(500).optional(),
    designJson: GarmentDesignJsonSchema,
    previewDataUrl: z.string().max(PREVIEW_MAX_BYTES).optional(),
  })
  .strict();

// ---- Planillas (sheet) ----------------------------------------------------

const SheetFreeAssetSchema = z
  .object({
    assetId: z.uuid(),
    url: z.string().max(1200).optional(),
    xCm: z.number().min(0).max(30),
    yCm: z.number().min(0).max(40),
    widthCm: z.number().min(1).max(20),
    heightCm: z.number().min(1).max(26),
    rotation: z.number().min(-180).max(180).default(0),
    shape: z.enum([...SHEET_SHAPES, "custom"]).default("custom"),
  })
  .strict();

const SheetPlacementSchema = z
  .object({ xCm: z.number().min(0).max(30), yCm: z.number().min(0).max(40) })
  .strict();

export const SheetDesignJsonSchema = z
  .object({
    version: z.literal(1),
    designerType: z.literal("sheet"),
    sheetType: z.enum(["stickers", "imanes"]),
    mode: z.enum(["free", "repeat"]),
    unit: z.literal("cm"),
    page: z
      .object({
        format: z.literal("letter"),
        widthCm: z.number(),
        heightCm: z.number(),
      })
      .strict(),
    printableArea: z
      .object({
        xCm: z.number(),
        yCm: z.number(),
        widthCm: z.number(),
        heightCm: z.number(),
      })
      .strict(),
    minSpacingCm: z.number().min(0).max(10),
    // Modo libre.
    assets: z.array(SheetFreeAssetSchema).max(7).optional(),
    // Modo repetición.
    baseAssetId: z.uuid().optional(),
    shape: z.enum(SHEET_SHAPES).optional(),
    pieceSizeCm: z
      .object({
        width: z.number().min(3).max(10),
        height: z.number().min(3).max(10),
      })
      .strict()
      .optional(),
    count: z.number().int().min(0).max(400).optional(),
    placements: z.array(SheetPlacementSchema).max(400).optional(),
  })
  .strict()
  .refine(
    (d) => (d.mode === "free" ? Array.isArray(d.assets) : Boolean(d.baseAssetId)),
    { message: "Configuración de planilla incompleta." },
  );

export const SheetSavePayloadSchema = z
  .object({
    designerType: z.literal("sheet"),
    productType: z.enum(SHEET_PRODUCT_TYPES),
    productId: z.uuid(),
    variantId: z.uuid().optional(),
    customerNotes: z.string().max(500).optional(),
    designJson: SheetDesignJsonSchema,
    previewDataUrl: z.string().max(PREVIEW_MAX_BYTES).optional(),
  })
  .strict();

// ---- Láser (solo texto en esta etapa) -------------------------------------

/** Fuentes permitidas (debe coincidir con LASER_FONTS en laser-config). */
export const LASER_ALLOWED_FONT_IDS = [
  "montserrat",
  "fredoka",
  "arial",
  "sans",
] as const;

/** Rango del área láser (cm). Debe coincidir con laser-config. */
export const LASER_AREA_LIMITS = {
  minWidthCm: 5,
  maxWidthCm: 35,
  minHeightCm: 5,
  maxHeightCm: 45,
} as const;

const LaserTextElementSchema = z
  .object({
    type: z.literal("text"),
    text: z.string().min(1).max(40),
    fontId: z.enum(LASER_ALLOWED_FONT_IDS),
    x: finiteNumber,
    y: finiteNumber,
    scale: z.number().min(0.05).max(12),
    rotation: z.number().min(-180).max(180),
    fontSize: z.number().min(6).max(200).optional(),
  })
  .strict();

export const LaserDesignJsonSchema = z
  .object({
    version: z.literal(1),
    designerType: z.literal("laser"),
    templateId: z.string().max(40),
    // Dimensiones libres del área dentro del rango permitido.
    widthCm: z
      .number()
      .min(LASER_AREA_LIMITS.minWidthCm)
      .max(LASER_AREA_LIMITS.maxWidthCm),
    heightCm: z
      .number()
      .min(LASER_AREA_LIMITS.minHeightCm)
      .max(LASER_AREA_LIMITS.maxHeightCm),
    // Solo texto: sin assets de imagen.
    elements: z.array(LaserTextElementSchema).min(1).max(12),
  })
  .strict();

export const LaserSavePayloadSchema = z
  .object({
    designerType: z.literal("laser"),
    productType: z.literal("laser"),
    productId: z.uuid(),
    variantId: z.uuid().optional(),
    customerNotes: z.string().max(500).optional(),
    designJson: LaserDesignJsonSchema,
    previewDataUrl: z.string().max(PREVIEW_MAX_BYTES).optional(),
  })
  .strict();

/** Unión discriminada para el endpoint de guardado v2. */
export const DesignSaveV2Schema = z.discriminatedUnion("designerType", [
  GarmentSavePayloadSchema,
  SheetSavePayloadSchema,
  LaserSavePayloadSchema,
]);

export type DesignSaveV2Input = z.infer<typeof DesignSaveV2Schema>;
