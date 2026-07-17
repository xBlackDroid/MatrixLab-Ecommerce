import type { DesignerProductType } from "@/lib/db/types";

/**
 * FUENTE ÚNICA DE VERDAD del mapeo ruta/tipo de diseñador → handle REAL del
 * producto base en Supabase producción.
 *
 * Los 11 handles canónicos confirmados en producción (seed_designer_base_v2):
 *   etiquetas-escolares-personalizadas, gorra-clasica-personalizada,
 *   gorra-personalizada, gorra-trucker-personalizada,
 *   grabado-laser-personalizado, pieza-3d-personalizada, planilla-imanes,
 *   planilla-stickers, playera-personalizada, sudadera-personalizada,
 *   tote-bag-personalizada.
 *
 * REGLA: ningún módulo debe volver a escribir un handle de producto base a
 * mano. Todo consumo (catálogo del laboratorio, resolvers, rutas, CTAs,
 * mocks de respaldo) debe salir de aquí. Si un handle cambia en la base,
 * se corrige en ESTE archivo y en ningún otro lado.
 *
 * Las llaves incluyen tanto los tipos de diseñador (playera, stickers-planilla,
 * laser, …) como alias legibles de ruta/categoría (tote-bag, grabado-laser,
 * impresion-3d, …) para que cualquier lookup "viejo" resuelva igual al
 * producto real en lugar de caer a modo previsualización.
 */
export const DESIGNER_PRODUCT_HANDLE_MAP = {
  playera: "playera-personalizada",
  sudadera: "sudadera-personalizada",

  gorra: "gorra-personalizada",
  "gorra-clasica": "gorra-clasica-personalizada",
  "gorra-trucker": "gorra-trucker-personalizada",

  tote: "tote-bag-personalizada",
  "tote-bag": "tote-bag-personalizada",

  "stickers-planilla": "planilla-stickers",
  "stickers-repeticion": "planilla-stickers",

  "imanes-planilla": "planilla-imanes",
  "imanes-repeticion": "planilla-imanes",

  laser: "grabado-laser-personalizado",
  "grabado-laser": "grabado-laser-personalizado",

  "impresion-3d": "pieza-3d-personalizada",
  "pieza-3d": "pieza-3d-personalizada",

  "etiquetas-escolares": "etiquetas-escolares-personalizadas",
} as const;

export type DesignerHandleAlias = keyof typeof DESIGNER_PRODUCT_HANDLE_MAP;
export type CanonicalDesignerHandle =
  (typeof DESIGNER_PRODUCT_HANDLE_MAP)[DesignerHandleAlias];

/** Handles reales del catálogo (valores del mapa, únicos). */
export const CANONICAL_DESIGNER_HANDLES: ReadonlySet<string> = new Set(
  Object.values(DESIGNER_PRODUCT_HANDLE_MAP),
);

/**
 * Traduce cualquier entrada (tipo de diseñador, alias de ruta o un handle ya
 * canónico) al handle REAL del producto base. Si la entrada no es ni alias ni
 * handle canónico, se devuelve tal cual (el resolver decidirá si existe).
 */
export function resolveDesignerHandle(input: string): string {
  const key = input.trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(DESIGNER_PRODUCT_HANDLE_MAP, key)) {
    return DESIGNER_PRODUCT_HANDLE_MAP[key as DesignerHandleAlias];
  }
  return key;
}

export function isCanonicalDesignerHandle(handle: string): boolean {
  return CANONICAL_DESIGNER_HANDLES.has(handle);
}

/**
 * Mapa inverso handle → tipo de diseñador, para el CTA "Personalizar en el
 * laboratorio" de la página de producto. Cuando varios tipos comparten el
 * mismo producto base (las dos planillas de stickers, los dos modos de
 * imanes), gana el tipo PRINCIPAL de esa familia.
 */
export const DESIGNER_HANDLE_TO_TYPE: Record<string, DesignerProductType> = {
  "playera-personalizada": "playera",
  "sudadera-personalizada": "sudadera",
  "gorra-personalizada": "gorra",
  "gorra-trucker-personalizada": "gorra-trucker",
  "gorra-clasica-personalizada": "gorra-clasica",
  "tote-bag-personalizada": "tote",
  "planilla-stickers": "stickers-planilla",
  "planilla-imanes": "imanes-planilla",
  "grabado-laser-personalizado": "laser",
  "etiquetas-escolares-personalizadas": "etiquetas-escolares",
};
