import type { DesignerProductType, GarmentProfile } from "@/lib/db/types";

/**
 * Áreas máximas de impresión (cm) por perfil y talla, según la tabla del
 * cliente. Son la fuente principal: NO cambiar valores sin dejar comentario.
 *
 * Cómo editar medidas: ajusta MAX_PRINT_AREA_CM (apparel) o
 * FIXED_PRINT_AREA_CM (gorras/tote). Todo lo demás (canvas, advertencias)
 * se deriva de aquí automáticamente.
 */

export type GarmentSize = "CH" | "M" | "G" | "EG";

export interface PrintAreaCm {
  width: number;
  height: number;
}

export const MAX_PRINT_AREA_CM: Record<
  GarmentProfile,
  Record<GarmentSize, PrintAreaCm>
> = {
  nino: {
    CH: { width: 22, height: 26 },
    M: { width: 24, height: 28 },
    G: { width: 28, height: 32 },
    EG: { width: 30, height: 34 },
  },
  mujer: {
    CH: { width: 26, height: 34 },
    M: { width: 30, height: 36 },
    G: { width: 34, height: 38 },
    // NOTA (valor atípico en la fuente): EG ancho 32 cm < G ancho 34 cm.
    // Se respeta el dato proporcionado por el cliente sin modificarlo.
    EG: { width: 32, height: 40 },
  },
  hombre: {
    CH: { width: 34, height: 43 },
    M: { width: 38, height: 45 },
    G: { width: 40, height: 48 },
    EG: { width: 42, height: 52 },
  },
};

export const PROFILE_LABELS: Record<GarmentProfile, string> = {
  nino: "Niño",
  mujer: "Mujer",
  hombre: "Hombre",
};

/**
 * Áreas fijas (cm) para productos sin perfil/talla. La espalda usa el mismo
 * valor que el frente salvo que se indique. Valores conservadores de marca.
 */
const FIXED_PRINT_AREA_CM: Partial<
  Record<DesignerProductType, { front: PrintAreaCm; back?: PrintAreaCm }>
> = {
  "gorra-trucker": { front: { width: 12, height: 7 } },
  "gorra-clasica": { front: { width: 11, height: 6 } },
  gorra: { front: { width: 12, height: 7 } },
  tote: { front: { width: 30, height: 35 }, back: { width: 30, height: 35 } },
};

/**
 * Devuelve el área máxima de impresión en cm para una zona dada.
 * Apparel con tallas usa la tabla; el resto usa áreas fijas.
 */
export function getPrintAreaCm(params: {
  productType: DesignerProductType;
  usesProfileSize: boolean;
  profile: GarmentProfile;
  size: GarmentSize;
  zone: "front" | "back";
}): PrintAreaCm {
  const { productType, usesProfileSize, profile, size, zone } = params;
  if (usesProfileSize) {
    return MAX_PRINT_AREA_CM[profile][size];
  }
  const fixed = FIXED_PRINT_AREA_CM[productType];
  if (!fixed) return { width: 24, height: 30 };
  return zone === "back" ? (fixed.back ?? fixed.front) : fixed.front;
}

/** Redondea cm a un decimal para mostrar. */
export function formatCm(value: number): string {
  return `${Math.round(value * 10) / 10} cm`;
}
