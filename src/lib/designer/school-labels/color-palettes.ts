/**
 * Catálogo de combinaciones de color de Etiquetas Escolares Lab.
 *
 * Tomado del PDF de referencia "Cómo Hacer tu Pedido" ("Elige tu combinación
 * de colores", partes 1 y 2): combinaciones de Arcoíris y gamas
 * monocromáticas. Cada combinación tiene un código de 3 letras (el mismo que
 * el cliente escribe en el formato del PDF) y un nombre comercial.
 *
 * Los `swatches` (hex) son aproximaciones de marca para los selectores y la
 * vista previa; cuando el cliente final apruebe las muestras impresas se
 * ajustan aquí sin tocar la UI.
 *
 * Cómo agregar/editar una paleta:
 *   1. Agrega o ajusta una entrada en SCHOOL_COLOR_PALETTES (code único de 3
 *      letras en MAYÚSCULAS, name, group y swatches).
 *   2. Si agregas un código nuevo, inclúyelo también en la whitelist de
 *      `src/lib/validation/school-labels.ts` (SCHOOL_COLOR_CODES se deriva de
 *      aquí, así que normalmente no hay que tocar nada más).
 */

export type SchoolColorGroup = "arcoiris" | "monocromatica";

export interface SchoolColorPalette {
  /** Código de 3 letras del PDF (ARC, PAS, …). */
  code: string;
  /** Nombre comercial mostrado al cliente. */
  name: string;
  group: SchoolColorGroup;
  /** Muestras de color (3–6) para los swatches y la preview. */
  swatches: string[];
}

export const SCHOOL_COLOR_GROUP_LABELS: Record<SchoolColorGroup, string> = {
  arcoiris: "Combinaciones de Arcoíris",
  monocromatica: "Gamas monocromáticas",
};

export const SCHOOL_COLOR_PALETTES: SchoolColorPalette[] = [
  // --- Combinaciones de Arcoíris (PDF parte 1 de 2) ------------------------
  {
    code: "ARC",
    name: "Arcoíris Clásico",
    group: "arcoiris",
    swatches: ["#E63946", "#F4A024", "#F2C400", "#2A9D4A", "#2147A8", "#6B2FA0"],
  },
  {
    code: "PAS",
    name: "Pastel Arcoíris",
    group: "arcoiris",
    swatches: ["#F7B7C8", "#FBD5A5", "#FBF1A6", "#BDE7C8", "#A7C7E7", "#CBB6E4"],
  },
  {
    code: "NEO",
    name: "Neón",
    group: "arcoiris",
    swatches: ["#FF2D95", "#FF6B00", "#DFFF1F", "#3DF56A", "#1FE0FF", "#9D4BFF"],
  },
  {
    code: "TRO",
    name: "Tropical",
    group: "arcoiris",
    swatches: ["#FF5E5B", "#FF9F1C", "#FFD23F", "#1FB6B0", "#06A77D", "#118AB2"],
  },
  {
    code: "SUN",
    name: "Atardecer",
    group: "arcoiris",
    swatches: ["#3A1C71", "#7B2D8E", "#D7263D", "#F46036", "#F9A03F", "#FFD45C"],
  },
  {
    code: "OCE",
    name: "Océano",
    group: "arcoiris",
    swatches: ["#03045E", "#0077B6", "#00B4D8", "#48CAE4", "#90E0EF", "#CAF0F8"],
  },
  {
    code: "FIE",
    name: "Fiesta",
    group: "arcoiris",
    swatches: ["#E71D73", "#F7941D", "#FFE000", "#39B54A", "#00AEEF", "#92278F"],
  },
  {
    code: "GAL",
    name: "Galaxia",
    group: "arcoiris",
    swatches: ["#0B0033", "#3D087B", "#5F0F8B", "#8A2BE2", "#C77DFF", "#E0AAFF"],
  },

  // --- Gamas monocromáticas (PDF parte 2 de 2) -----------------------------
  {
    code: "ROS",
    name: "Rosas",
    group: "monocromatica",
    swatches: ["#FFE0EC", "#FBB6CE", "#F47CA0", "#E85285", "#C81E63"],
  },
  {
    code: "AZU",
    name: "Azules",
    group: "monocromatica",
    swatches: ["#DCEBFF", "#A7C7E7", "#5B8DEF", "#2147A8", "#16243F"],
  },
  {
    code: "VER",
    name: "Verdes",
    group: "monocromatica",
    swatches: ["#E2F4D7", "#A8D88A", "#6FBF44", "#2E9D4A", "#14532D"],
  },
  {
    code: "MOR",
    name: "Morados",
    group: "monocromatica",
    swatches: ["#EFE0F7", "#CBB6E4", "#A371D6", "#7A2FB0", "#4A1B6E"],
  },
  {
    code: "NAR",
    name: "Naranjas",
    group: "monocromatica",
    swatches: ["#FFE8D1", "#FFC089", "#FF9A3C", "#F4711E", "#C24E07"],
  },
  {
    code: "AMA",
    name: "Amarillos",
    group: "monocromatica",
    swatches: ["#FFF8D6", "#FBEFA0", "#F7DE3A", "#F2C400", "#C99A06"],
  },
  {
    code: "ROJ",
    name: "Rojos",
    group: "monocromatica",
    swatches: ["#FFD9D6", "#F58A84", "#E63946", "#C81D25", "#7A1015"],
  },
  {
    code: "GRI",
    name: "Grises",
    group: "monocromatica",
    swatches: ["#F1F2F4", "#C7CAD1", "#9AA0A8", "#5A5F68", "#22262C"],
  },
  {
    code: "CAF",
    name: "Cafés",
    group: "monocromatica",
    swatches: ["#EFE2D3", "#D2B48C", "#A9764B", "#6B4A33", "#3F2A1C"],
  },
];

const PALETTE_BY_CODE = new Map(
  SCHOOL_COLOR_PALETTES.map((palette) => [palette.code, palette]),
);

/** Lista plana de los códigos válidos (ARC, PAS, …). */
export const SCHOOL_COLOR_CODES: string[] = SCHOOL_COLOR_PALETTES.map(
  (palette) => palette.code,
);

export function isSchoolColorCode(value: string): boolean {
  return PALETTE_BY_CODE.has(value);
}

export function getSchoolColorPalette(
  code: string,
): SchoolColorPalette | null {
  return PALETTE_BY_CODE.get(code) ?? null;
}

/** Agrupa las paletas por familia (arcoíris / monocromática) preservando orden. */
export function groupSchoolColorPalettes(): Array<{
  group: SchoolColorGroup;
  label: string;
  palettes: SchoolColorPalette[];
}> {
  const groups: SchoolColorGroup[] = ["arcoiris", "monocromatica"];
  return groups.map((group) => ({
    group,
    label: SCHOOL_COLOR_GROUP_LABELS[group],
    palettes: SCHOOL_COLOR_PALETTES.filter((p) => p.group === group),
  }));
}
