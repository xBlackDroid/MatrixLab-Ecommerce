import type { DesignerProductType } from "@/lib/db/types";

/**
 * Configuración de planillas (stickers / imanes) en hoja tamaño carta.
 * Todas las unidades internas son centímetros; el lienzo se escala a px.
 *
 * Cómo editar: ajusta PRINTABLE_AREA_CM (área imprimible real, dejando los
 * márgenes de producción como zona no imprimible) y MIN_SPACING_CM.
 */

export const LETTER_CM = { width: 21.59, height: 27.94 } as const;

/** Margen de producción (no imprimible) alrededor de la hoja. */
export const SHEET_MARGIN_CM = 1;

/** Área imprimible segura dentro de la hoja carta. */
export const PRINTABLE_AREA_CM = {
  xCm: SHEET_MARGIN_CM,
  yCm: SHEET_MARGIN_CM,
  widthCm: LETTER_CM.width - SHEET_MARGIN_CM * 2,
  heightCm: LETTER_CM.height - SHEET_MARGIN_CM * 2,
} as const;

/** Separación mínima obligatoria entre piezas. */
export const MIN_SPACING_CM = 2;

/** Máximo de imágenes distintas en modo libre. */
export const MAX_FREE_IMAGES = 7;

/** Rango de tamaño de pieza en modo repetición. */
export const REPEAT_MIN_CM = 3;
export const REPEAT_MAX_CM = 10;

/** Tamaño por defecto de una pieza nueva en modo libre. */
export const DEFAULT_PIECE_CM = 5;

/** Resolución objetivo para el export de producción. */
export const EXPORT_DPI = 300;

export function getSheetTypeFromProduct(
  productType: DesignerProductType,
): "stickers" | "imanes" {
  return productType.startsWith("imanes") ? "imanes" : "stickers";
}

export function getSheetModeFromProduct(
  productType: DesignerProductType,
): "free" | "repeat" {
  return productType.endsWith("repeticion") ? "repeat" : "free";
}

/** px por cm para una hoja renderizada a un ancho dado en px. */
export function pxPerCmForWidth(canvasWidthPx: number): number {
  return canvasWidthPx / LETTER_CM.width;
}
