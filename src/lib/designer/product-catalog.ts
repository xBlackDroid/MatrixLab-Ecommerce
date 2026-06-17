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
    // Se accede desde la card pública "Gorras" (/tienda/disenador/gorras).
    hiddenFromLab: true,
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
    // Se accede desde la card pública "Gorras" (/tienda/disenador/gorras).
    hiddenFromLab: true,
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
    label: "Sticker Canvas Lab",
    publicName: "Sticker Canvas Lab",
    shortDescription:
      "Sube varias imágenes y acomódalas libremente en una hoja carta lista para producir.",
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
    label: "Sticker Grid Automático",
    publicName: "Sticker Grid Automático",
    shortDescription:
      "Sube una imagen, elige forma y tamaño, y el laboratorio llena tu hoja carta automáticamente.",
    badge: "Planillas",
    isNew: true,
    baseHandle: "planilla-stickers",
    usesProfileSize: false,
    sheetType: "stickers",
    sheetMode: "repeat",
    iconKey: "repeat",
    order: 7,
  },
  // Legado: los imanes ya no se promocionan en el laboratorio. La ruta sigue
  // viva pero oculta; se cotiza por WhatsApp (ver page.tsx LEGACY_QUOTE_TYPES).
  "imanes-planilla": {
    id: "imanes-planilla",
    kind: "sheet",
    label: "Planilla de imanes (legado)",
    publicName: "Planilla de imanes",
    shortDescription:
      "Crea una hoja carta de imanes personalizados con tus imágenes favoritas.",
    badge: "Planillas",
    isNew: false,
    baseHandle: "planilla-imanes",
    usesProfileSize: false,
    sheetType: "imanes",
    sheetMode: "free",
    iconKey: "grid",
    order: 8,
    hiddenFromLab: true,
  },
  // Legado: los imanes se trabajan públicamente desde "Planilla de imanes".
  // La ruta sigue viva (redirige a imanes-planilla) pero no se promociona.
  "imanes-repeticion": {
    id: "imanes-repeticion",
    kind: "sheet",
    label: "Imanes (repetición, legado)",
    publicName: "Planilla de imanes",
    shortDescription:
      "Crea una hoja carta de imanes personalizados con tus imágenes favoritas.",
    badge: "Planillas",
    isNew: false,
    baseHandle: "planilla-imanes",
    usesProfileSize: false,
    sheetType: "imanes",
    sheetMode: "repeat",
    iconKey: "repeat",
    order: 9,
    hiddenFromLab: true,
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

/**
 * Nombre público que se muestra al cliente en carrito y admin para un diseño
 * personalizado, derivado SIEMPRE del tipo de diseñador (no del producto base,
 * que puede ser compartido — p.ej. las dos planillas de stickers comparten el
 * mismo `planilla-stickers`). El precio/producto base siguen viniendo del
 * backend; esto solo cambia la etiqueta visible.
 */
const DESIGNER_DISPLAY_NAMES: Record<string, string> = {
  playera: "Playera personalizada",
  sudadera: "Sudadera personalizada",
  "gorra-trucker": "Gorra personalizada",
  "gorra-clasica": "Gorra personalizada",
  gorra: "Gorra personalizada",
  tote: "Tote bag personalizada",
  "stickers-planilla": "Sticker Canvas Lab",
  "stickers-repeticion": "Sticker Grid Automático",
  "imanes-planilla": "Planilla de imanes personalizada",
  "imanes-repeticion": "Planilla de imanes personalizada",
  laser: "Diseño láser personalizado",
};

export function getDesignerDisplayName(productType: string): string | null {
  return DESIGNER_DISPLAY_NAMES[productType] ?? null;
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

// ===========================================================================
// Bloques curados de la home del Laboratorio (/tienda/disenador).
// Separan claramente Prendas, Planillas y Láser. "Gorras" es UNA sola card
// pública que entra a /tienda/disenador/gorras (selector trucker/clásica).
// ===========================================================================

export interface LabCard {
  id: string;
  title: string;
  description: string;
  href: string;
  iconKey: DesignerCatalogEntry["iconKey"];
  badge: DesignerBadge;
  isNew?: boolean;
  /** CTA propio de la card (si no, "Abrir laboratorio"). */
  cta?: string;
}

export interface LabBlock {
  id: string;
  title: string;
  description: string;
  badge: DesignerBadge;
  cards: LabCard[];
}

export const LAB_BLOCKS: LabBlock[] = [
  {
    id: "prendas",
    title: "Prendas y accesorios textiles",
    description:
      "Sube tu imagen, acomódala y crea una prenda lista para producir.",
    badge: "Prendas",
    cards: [
      {
        id: "playera",
        title: "Playeras",
        description:
          "Playera personalizada con acabado premium para una pieza única o por volumen.",
        href: "/tienda/disenador/playera",
        iconKey: "shirt",
        badge: "Prendas",
      },
      {
        id: "sudadera",
        title: "Sudaderas",
        description:
          "Sudadera personalizada con acabado premium para eventos, marcas y equipos.",
        href: "/tienda/disenador/sudadera",
        iconKey: "hoodie",
        badge: "Prendas",
        isNew: true,
      },
      {
        id: "gorras",
        title: "Gorras",
        description:
          "Diseña tu gorra trucker o clásica ajustable con acabado premium.",
        href: "/tienda/disenador/gorras",
        iconKey: "cap",
        badge: "Prendas",
        isNew: true,
      },
      {
        id: "tote",
        title: "Tote bags",
        description:
          "Tote bag personalizada para regalos, eventos, marcas y experiencias.",
        href: "/tienda/disenador/tote",
        iconKey: "bag",
        badge: "Prendas",
      },
    ],
  },
  {
    id: "planillas",
    title: "Planillas creativas",
    description:
      "Arma tu hoja carta de stickers, a tu manera o de forma automática.",
    badge: "Planillas",
    cards: [
      {
        id: "stickers-planilla",
        title: "Sticker Canvas Lab",
        description:
          "Sube varias imágenes y acomódalas libremente en una hoja carta lista para producir.",
        href: "/tienda/disenador/stickers-planilla",
        iconKey: "grid",
        badge: "Planillas",
        isNew: true,
        cta: "Crear Sticker Canvas",
      },
      {
        id: "sticker-grid",
        title: "Sticker Grid Automático",
        description:
          "Sube una imagen, elige forma y tamaño, y el laboratorio llena tu hoja carta automáticamente.",
        href: "/tienda/disenador/stickers-repeticion",
        iconKey: "repeat",
        badge: "Planillas",
        isNew: true,
        cta: "Crear Sticker Grid",
      },
    ],
  },
  {
    id: "laser",
    title: "Laboratorio láser",
    description:
      "Diseña grabados de texto sobre plantillas como termos, tazas, tags, llaveros y acrílicos.",
    badge: "Láser",
    cards: [
      {
        id: "laser",
        title: "Laboratorio láser",
        description:
          "Elige una plantilla, ajusta las dimensiones y agrega tu texto para crear tu grabado.",
        href: "/tienda/disenador/laser",
        iconKey: "laser",
        badge: "Láser",
        isNew: true,
      },
    ],
  },
];
