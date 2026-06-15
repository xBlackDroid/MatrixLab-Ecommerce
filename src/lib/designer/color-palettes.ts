import type { DesignerProductType } from "@/lib/db/types";

/**
 * Paletas de color del Laboratorio (Etapa 2).
 *
 * Tomadas de las imágenes de referencia del cliente (playera, sudadera,
 * gorra trucker, gorra clásica ajustable). Los hex son aproximaciones de
 * marca; cuando existan telas/mockups reales se ajustan aquí sin tocar UI.
 *
 * Cómo editar colores:
 * 1. Agrega/ajusta una entrada en MASTER_COLORS (id único, label, hex, group).
 * 2. Inclúyela en PRODUCT_COLOR_IDS para el/los productos que la ofrecen.
 * El selector (ColorSwatchGrid) agrupa automáticamente por `group`.
 */

export type ColorGroup =
  | "basicos"
  | "blanco-negro-grises"
  | "colores"
  | "pasteles"
  | "neon";

export interface ProductColor {
  id: string;
  label: string;
  hex?: string;
  textureUrl?: string;
  group: ColorGroup;
  /** Tono de sombra para dar volumen en el mockup vectorial. */
  shadowHex: string;
}

type MasterColor = Omit<ProductColor, "shadowHex"> & { shadowHex?: string };

/** Oscurece un hex un porcentaje (genera shadowHex si no se define). */
function darken(hex: string, amount = 0.18): string {
  const n = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(n.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(n.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(n.slice(4, 6), 16) * (1 - amount)));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const MASTER_DEFS: Record<string, MasterColor> = {
  // Blanco / negro / grises
  blanco: { id: "blanco", label: "Blanco", hex: "#F4F5F7", group: "blanco-negro-grises", shadowHex: "#D6D8DD" },
  negro: { id: "negro", label: "Negro", hex: "#1E2024", group: "blanco-negro-grises", shadowHex: "#0E1014" },
  "gris-claro": { id: "gris-claro", label: "Gris claro", hex: "#C7CAD1", group: "blanco-negro-grises" },
  "gris-oscuro": { id: "gris-oscuro", label: "Gris oscuro", hex: "#474B54", group: "blanco-negro-grises" },
  "gris-jaspe": { id: "gris-jaspe", label: "Gris jaspe", hex: "#9AA0A8", group: "blanco-negro-grises" },
  crema: { id: "crema", label: "Crema", hex: "#ECE6D6", group: "blanco-negro-grises" },
  natural: { id: "natural", label: "Natural", hex: "#E8DDC4", group: "blanco-negro-grises" },
  // Colores
  beige: { id: "beige", label: "Beige", hex: "#DAC9A6", group: "colores" },
  caqui: { id: "caqui", label: "Caqui", hex: "#B8A77F", group: "colores" },
  cafe: { id: "cafe", label: "Café", hex: "#6B4A33", group: "colores" },
  chedron: { id: "chedron", label: "Chedrón", hex: "#C7922F", group: "colores" },
  rojo: { id: "rojo", label: "Rojo", hex: "#C8252B", group: "colores" },
  vino: { id: "vino", label: "Vino", hex: "#6E1E2A", group: "colores" },
  coral: { id: "coral", label: "Coral", hex: "#FF6F61", group: "colores" },
  naranja: { id: "naranja", label: "Naranja", hex: "#E8772E", group: "colores" },
  mango: { id: "mango", label: "Mango", hex: "#F4A024", group: "colores" },
  "amarillo-mango": { id: "amarillo-mango", label: "Amarillo mango", hex: "#F6B11F", group: "colores" },
  amarillo: { id: "amarillo", label: "Amarillo", hex: "#F2C400", group: "colores" },
  canario: { id: "canario", label: "Canario", hex: "#F7DE3A", group: "colores" },
  "verde-bandera": { id: "verde-bandera", label: "Verde bandera", hex: "#1E7A43", group: "colores" },
  "verde-olivo": { id: "verde-olivo", label: "Verde olivo", hex: "#5C6B3C", group: "colores" },
  olivo: { id: "olivo", label: "Olivo", hex: "#566B2F", group: "colores" },
  "verde-limon": { id: "verde-limon", label: "Verde limón", hex: "#8DC63F", group: "colores" },
  botella: { id: "botella", label: "Verde botella", hex: "#14452F", group: "colores" },
  turquesa: { id: "turquesa", label: "Turquesa", hex: "#1FB6B0", group: "colores" },
  aqua: { id: "aqua", label: "Aqua", hex: "#6EC1E4", group: "colores" },
  "azul-cielo": { id: "azul-cielo", label: "Azul cielo", hex: "#7EC8E3", group: "colores" },
  "azul-rey": { id: "azul-rey", label: "Azul rey", hex: "#2147A8", group: "colores" },
  "azul-marino": { id: "azul-marino", label: "Azul marino", hex: "#16243F", group: "colores" },
  morado: { id: "morado", label: "Morado", hex: "#6B2FA0", group: "colores" },
  fucsia: { id: "fucsia", label: "Fucsia", hex: "#D81E7B", group: "colores" },
  // Pasteles
  "rosa-pastel": { id: "rosa-pastel", label: "Rosa pastel", hex: "#F4B8CE", group: "pasteles" },
  lila: { id: "lila", label: "Lila", hex: "#C9B6E4", group: "pasteles" },
  "azul-pastel": { id: "azul-pastel", label: "Azul pastel", hex: "#A7C7E7", group: "pasteles" },
  "turquesa-claro": { id: "turquesa-claro", label: "Turquesa claro", hex: "#7FD4CD", group: "pasteles" },
  // Neón
  "naranja-neon": { id: "naranja-neon", label: "Naranja neón", hex: "#FF6B00", group: "neon" },
  "verde-neon": { id: "verde-neon", label: "Verde neón", hex: "#5BE36A", group: "neon" },
  "amarillo-neon": { id: "amarillo-neon", label: "Amarillo neón", hex: "#DFFF1F", group: "neon" },
};

export const MASTER_COLORS: Record<string, ProductColor> = Object.fromEntries(
  Object.entries(MASTER_DEFS).map(([id, c]) => [
    id,
    { ...c, shadowHex: c.shadowHex ?? (c.hex ? darken(c.hex) : "#0E1014") },
  ]),
);

/** Disponibilidad de colores por producto (según imágenes de referencia). */
const PRODUCT_COLOR_IDS: Partial<Record<DesignerProductType, string[]>> = {
  playera: [
    "blanco", "negro", "gris-jaspe", "gris-oscuro", "crema", "rojo", "vino",
    "coral", "naranja", "amarillo", "verde-bandera", "turquesa", "aqua",
    "azul-cielo", "azul-rey", "azul-marino", "morado", "fucsia",
    "rosa-pastel", "lila",
  ],
  sudadera: [
    "blanco", "negro", "gris-claro", "gris-jaspe", "gris-oscuro", "crema",
    "rojo", "vino", "verde-olivo", "azul-rey", "azul-marino", "morado",
    "rosa-pastel", "lila",
  ],
  "gorra-trucker": [
    "negro", "blanco", "gris-claro", "gris-oscuro", "rojo", "vino",
    "naranja", "amarillo-mango", "canario", "verde-bandera", "verde-olivo",
    "verde-limon", "turquesa", "azul-rey", "azul-marino", "morado", "fucsia",
    "rosa-pastel", "azul-pastel", "lila", "naranja-neon", "verde-neon",
  ],
  "gorra-clasica": [
    "blanco", "negro", "gris-claro", "gris-oscuro", "beige", "caqui", "cafe",
    "chedron", "rojo", "vino", "coral", "naranja", "mango", "canario",
    "verde-bandera", "olivo", "botella", "verde-limon", "azul-cielo",
    "azul-rey", "azul-marino", "morado", "turquesa-claro", "rosa-pastel",
    "amarillo-neon",
  ],
  // Legado: gorra trucker base
  gorra: ["negro", "azul-marino", "beige", "blanco", "rojo"],
  tote: ["natural", "negro", "blanco", "azul-marino", "rojo"],
};

/** Orden de secciones en el selector. */
export const COLOR_GROUP_ORDER: ColorGroup[] = [
  "blanco-negro-grises",
  "basicos",
  "colores",
  "pasteles",
  "neon",
];

export const COLOR_GROUP_LABELS: Record<ColorGroup, string> = {
  basicos: "Básicos",
  "blanco-negro-grises": "Blanco / negro / grises",
  colores: "Colores",
  pasteles: "Pasteles",
  neon: "Neón",
};

export function getColorsForProduct(
  productType: DesignerProductType,
): ProductColor[] {
  const ids = PRODUCT_COLOR_IDS[productType] ?? ["blanco", "negro"];
  return ids.map((id) => MASTER_COLORS[id]).filter(Boolean) as ProductColor[];
}

export function getColorById(
  productType: DesignerProductType,
  colorId: string | null | undefined,
): ProductColor | null {
  if (!colorId) return null;
  const colors = getColorsForProduct(productType);
  return colors.find((c) => c.id === colorId) ?? null;
}

export function getDefaultColor(productType: DesignerProductType): ProductColor {
  const colors = getColorsForProduct(productType);
  return colors[0] ?? MASTER_COLORS.blanco!;
}

/** Agrupa colores por sección, preservando el orden definido. */
export function groupColors(
  colors: ProductColor[],
): Array<{ group: ColorGroup; label: string; colors: ProductColor[] }> {
  return COLOR_GROUP_ORDER.map((group) => ({
    group,
    label: COLOR_GROUP_LABELS[group],
    colors: colors.filter((c) => c.group === group),
  })).filter((section) => section.colors.length > 0);
}
