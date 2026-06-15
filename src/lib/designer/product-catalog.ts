import type { DesignerKind, DesignerProductType } from "@/lib/db/types";

/**
 * Catálogo del Laboratorio MatrixLab (Etapa 2).
 *
 * Es la fuente única que define, por cada tipo de diseñador:
 * - a qué familia de editor pertenece (garment | sheet | laser),
 * - su nombre público (sin términos técnicos prohibidos),
 * - el producto base de la tienda con el que se cobra/agrega al carrito.
 *
 * Reutiliza el modelo existente: cada entrada apunta a un `baseHandle` que
 * debe existir en la tabla `products` (ver supabase/seed.sql). El diseñador
 * NO inventa precios: usa el producto base como en Etapa 1.
 */

export type DesignerBadge = "Prendas" | "Planillas" | "Láser";

export interface DesignerCatalogEntry {
  id: DesignerProductType;
  kind: DesignerKind;
  /** Nombre interno (puede contener ids técnicos). */
  label: string;
  /** Nombre visible al cliente. Sin términos técnicos prohibidos. */
  publicName: string;
  shortDescription: string;
  badge: DesignerBadge;
  isNew: boolean;
  /** Handle del producto base en la tienda (carrito + precio). */
  baseHandle: string;
  /** Solo prendas con tallas (playera, sudadera) usan perfil/talla. */
  usesProfileSize: boolean;
  /** Hojas: subtipo y modo. */
  sheetType?: "stickers" | "imanes";
  sheetMode?: "free" | "repeat";
  /** Clave de ícono (se resuelve en la UI; lib no importa lucide). */
  iconKey: "shirt" | "hoodie" | "cap" | "bag" | "grid" | "repeat" | "laser";
  /** Orden en la pantalla del laboratorio. */
  order: number;
  /** Legado/alias que no se muestra como card en el laboratorio. */
  hiddenFromLab?: boolean;
}

export const DESIGNER_CATALOG: Record<
  DesignerProductType,
  DesignerCatalogEntry
> = {
  playera: {
    id: "playera",
    kind: "garment",
    label: "Playera",
    publicName: "Playera personalizada",
    shortDescription:
      "Playera personalizada con acabado premium para crear una pieza única o producir por volumen.",
    badge: "Prendas",
    isNew: false,
    baseHandle: "playera-personalizada",
    usesProfileSize: true,
    iconKey: "shirt",
    order: 1,
  },
  sudadera: {
    id: "sudadera",
    kind: "garment",
    label: "Sudadera",
    publicName: "Sudadera personalizada",
    shortDescription:
      "Sudadera personalizada con acabado premium para eventos, marcas, regalos y equipos.",
    badge: "Prendas",
    isNew: true,
    baseHandle: "sudadera-personalizada",
    usesProfileSize: true,
    iconKey: "hoodie",
    order: 2,
  },
  "gorra-trucker": {
    id: "gorra-trucker",
    kind: "garment",
    label: "Gorra trucker",
    publicName: "Gorra trucker personalizada",
    shortDescription:
      "Gorra trucker personalizada para eventos, marcas, equipos y activaciones.",
    badge: "Prendas",
    isNew: true,
    baseHandle: "gorra-trucker-personalizada",
    usesProfileSize: false,
    iconKey: "cap",
    order: 3,
  },
  "gorra-clasica": {
    id: "gorra-clasica",
    kind: "garment",
    label: "Gorra clásica ajustable",
    publicName: "Gorra clásica ajustable",
    shortDescription:
      "Gorra clásica ajustable con personalización premium para destacar tu marca o evento.",
    badge: "Prendas",
    isNew: true,
    baseHandle: "gorra-clasica-personalizada",
    usesProfileSize: false,
    iconKey: "cap",
    order: 4,
  },
  tote: {
    id: "tote",
    kind: "garment",
    label: "Tote bag",
    publicName: "Tote bag personalizada",
    shortDescription:
      "Tote bag personalizada para regalos, eventos, marcas y experiencias creativas.",
    badge: "Prendas",
    isNew: false,
    baseHandle: "tote-bag-personalizada",
    usesProfileSize: false,
    iconKey: "bag",
    order: 5,
  },
  // Legado Etapa 1: la ruta /tienda/disenador/gorra sigue viva como alias de
  // la gorra trucker. No se muestra como card propia en el laboratorio.
  gorra: {
    id: "gorra",
    kind: "garment",
    label: "Gorra",
    publicName: "Gorra personalizada",
    shortDescription:
      "Gorra personalizada para eventos, marcas, equipos y activaciones.",
    badge: "Prendas",
    isNew: false,
    baseHandle: "gorra-personalizada",
    usesProfileSize: false,
    iconKey: "cap",
    order: 99,
    hiddenFromLab: true,
  },
  "stickers-planilla": {
    id: "stickers-planilla",
    kind: "sheet",
    label: "Planilla de stickers",
    publicName: "Planilla de stickers",
    shortDescription:
      "Sube hasta 7 imágenes y arma tu planilla tamaño carta con libertad y control.",
    badge: "Planillas",
    isNew: true,
    baseHandle: "planilla-stickers",
    usesProfileSize: false,
    sheetType: "stickers",
    sheetMode: "free",
    iconKey: "grid",
    order: 6,
  },
  "stickers-repeticion": {
    id: "stickers-repeticion",
    kind: "sheet",
    label: "Stickers en repetición",
    publicName: "Stickers en repetición",
    shortDescription:
      "Sube una imagen, elige forma y tamaño, y llenamos automáticamente tu hoja carta.",
    badge: "Planillas",
    isNew: true,
    baseHandle: "planilla-stickers",
    usesProfileSize: false,
    sheetType: "stickers",
    sheetMode: "repeat",
    iconKey: "repeat",
    order: 7,
  },
  "imanes-planilla": {
    id: "imanes-planilla",
    kind: "sheet",
    label: "Planilla de imanes",
    publicName: "Planilla de imanes",
    shortDescription:
      "Crea una planilla de imanes personalizados en hoja carta con tus imágenes favoritas.",
    badge: "Planillas",
    isNew: true,
    baseHandle: "planilla-imanes",
    usesProfileSize: false,
    sheetType: "imanes",
    sheetMode: "free",
    iconKey: "grid",
    order: 8,
  },
  "imanes-repeticion": {
    id: "imanes-repeticion",
    kind: "sheet",
    label: "Imanes en repetición",
    publicName: "Imanes en repetición",
    shortDescription:
      "Repite una imagen en formato cuadrado, circular o rectangular para producir imanes por hoja.",
    badge: "Planillas",
    isNew: true,
    baseHandle: "planilla-imanes",
    usesProfileSize: false,
    sheetType: "imanes",
    sheetMode: "repeat",
    iconKey: "repeat",
    order: 9,
  },
  laser: {
    id: "laser",
    kind: "laser",
    label: "Laboratorio láser",
    publicName: "Laboratorio láser",
    shortDescription:
      "Diseña grabados personalizados sobre plantillas como termos, tazas, tags, llaveros y acrílicos.",
    badge: "Láser",
    isNew: true,
    baseHandle: "grabado-laser-personalizado",
    usesProfileSize: false,
    iconKey: "laser",
    order: 10,
  },
};

export function isDesignerProductType(
  value: string,
): value is DesignerProductType {
  return Object.prototype.hasOwnProperty.call(DESIGNER_CATALOG, value);
}

export function getCatalogEntry(
  productType: DesignerProductType,
): DesignerCatalogEntry {
  return DESIGNER_CATALOG[productType];
}

/** Entradas visibles como cards en /tienda/disenador, ordenadas. */
export function listLabEntries(): DesignerCatalogEntry[] {
  return Object.values(DESIGNER_CATALOG)
    .filter((entry) => !entry.hiddenFromLab)
    .sort((a, b) => a.order - b.order);
}

/** Mapa tipo de diseñador → handle del producto base (carrito + precio). */
export const DESIGNER_TYPE_TO_HANDLE = Object.fromEntries(
  Object.values(DESIGNER_CATALOG).map((entry) => [entry.id, entry.baseHandle]),
) as Record<DesignerProductType, string>;
