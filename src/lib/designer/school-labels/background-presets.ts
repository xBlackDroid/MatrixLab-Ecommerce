/**
 * Fondos automáticos de Etiquetas Escolares Lab.
 *
 * Regla del PDF de referencia ("Cómo Hacer tu Pedido"): el cliente NO diseña
 * el fondo. Al elegir una paleta de color, el laboratorio sugiere
 * automáticamente un fondo acorde (arcoíris, neón, océano, etc.). Cada paleta
 * (código de 3 letras) pertenece a una "familia" de fondo.
 *
 * Los fondos son gradientes CSS — sin imágenes pesadas — para no bloquear la
 * carga. Cada preset trae dos variantes:
 *   - `gradient`: fondo vivo de la etiqueta (texto blanco encima, con velo).
 *   - `soft`: velo translúcido pastel para tarjetas/superficies.
 */

export type BackgroundFamily =
  | "arcoiris"
  | "neon"
  | "acuatico"
  | "rosa"
  | "verde"
  | "galaxia"
  | "atardecer"
  | "tropical"
  | "fiesta"
  | "rojo"
  | "gris"
  | "cafe";

export interface BackgroundPreset {
  id: BackgroundFamily;
  label: string;
  description: string;
  /** Gradiente vivo para la etiqueta. */
  gradient: string;
  /** Velo translúcido pastel (tarjetas/superficies sobre fondo oscuro). */
  soft: string;
  /** Color de acento para detalles/chips. */
  accent: string;
  /** true si el fondo es oscuro (el texto blanco siempre es legible). */
  dark?: boolean;
}

export const BACKGROUND_PRESETS: Record<BackgroundFamily, BackgroundPreset> = {
  arcoiris: {
    id: "arcoiris",
    label: "Arcoíris suave",
    description: "Degradado arcoíris pastel, alegre y escolar.",
    gradient:
      "linear-gradient(120deg,#f9a8d4 0%,#fcd34d 26%,#86efac 52%,#7dd3fc 76%,#c4b5fd 100%)",
    soft: "linear-gradient(120deg,rgba(249,168,212,.16),rgba(252,211,77,.14),rgba(125,211,252,.16),rgba(196,181,253,.16))",
    accent: "#f472b6",
  },
  neon: {
    id: "neon",
    label: "Neón brillante",
    description: "Colores neón vibrantes con mucho brillo.",
    gradient:
      "linear-gradient(120deg,#ff2d95 0%,#ff6b00 28%,#f5d90a 50%,#39ff14 74%,#00e5ff 100%)",
    soft: "linear-gradient(120deg,rgba(255,45,149,.16),rgba(57,255,20,.14),rgba(0,229,255,.16))",
    accent: "#39ff14",
  },
  acuatico: {
    id: "acuatico",
    label: "Azul acuático",
    description: "Tonos de océano y agua, frescos y limpios.",
    gradient:
      "linear-gradient(135deg,#0077b6 0%,#00b4d8 45%,#48cae4 74%,#90e0ef 100%)",
    soft: "linear-gradient(135deg,rgba(0,119,182,.16),rgba(72,202,228,.14),rgba(144,224,239,.16))",
    accent: "#00b4d8",
  },
  rosa: {
    id: "rosa",
    label: "Rosa pastel",
    description: "Rosas suaves y dulces, estilo escolar.",
    gradient: "linear-gradient(135deg,#ff8fab 0%,#fb6f92 50%,#ffb3c6 100%)",
    soft: "linear-gradient(135deg,rgba(255,143,171,.18),rgba(255,179,198,.16))",
    accent: "#fb6f92",
  },
  verde: {
    id: "verde",
    label: "Verde escolar",
    description: "Verdes naturales, frescos y amigables.",
    gradient: "linear-gradient(135deg,#2e9d4a 0%,#52b788 46%,#95d5b2 100%)",
    soft: "linear-gradient(135deg,rgba(46,157,74,.16),rgba(149,213,178,.16))",
    accent: "#52b788",
  },
  galaxia: {
    id: "galaxia",
    label: "Galaxia",
    description: "Morados profundos con brillo de galaxia.",
    gradient:
      "linear-gradient(135deg,#0b0033 0%,#3d087b 40%,#7a2fb0 70%,#c77dff 100%)",
    soft: "linear-gradient(135deg,rgba(61,8,123,.20),rgba(199,125,255,.16))",
    accent: "#c77dff",
    dark: true,
  },
  atardecer: {
    id: "atardecer",
    label: "Atardecer cálido",
    description: "Cálidos de atardecer: naranjas, ámbar y rosa.",
    gradient:
      "linear-gradient(135deg,#3a1c71 0%,#d7263d 34%,#f46036 60%,#f9a03f 82%,#ffd45c 100%)",
    soft: "linear-gradient(135deg,rgba(244,96,54,.16),rgba(255,212,92,.16))",
    accent: "#f9a03f",
  },
  tropical: {
    id: "tropical",
    label: "Tropical",
    description: "Mezcla tropical viva y veraniega.",
    gradient:
      "linear-gradient(135deg,#ff5e5b 0%,#ff9f1c 30%,#ffd23f 50%,#1fb6b0 78%,#118ab2 100%)",
    soft: "linear-gradient(135deg,rgba(255,94,91,.16),rgba(31,182,176,.16))",
    accent: "#1fb6b0",
  },
  fiesta: {
    id: "fiesta",
    label: "Fiesta",
    description: "Multicolor festivo y divertido.",
    gradient:
      "linear-gradient(120deg,#e71d73 0%,#f7941d 24%,#ffe000 44%,#39b54a 64%,#00aeef 82%,#92278f 100%)",
    soft: "linear-gradient(120deg,rgba(231,29,115,.16),rgba(255,224,0,.14),rgba(0,174,239,.16))",
    accent: "#00aeef",
  },
  rojo: {
    id: "rojo",
    label: "Rojos",
    description: "Gama de rojos intensos y cálidos.",
    gradient:
      "linear-gradient(135deg,#7a1015 0%,#c81d25 46%,#e63946 72%,#f58a84 100%)",
    soft: "linear-gradient(135deg,rgba(200,29,37,.16),rgba(245,138,132,.16))",
    accent: "#e63946",
  },
  gris: {
    id: "gris",
    label: "Grises",
    description: "Gama de grises sobria y elegante.",
    gradient:
      "linear-gradient(135deg,#22262c 0%,#5a5f68 45%,#9aa0a8 74%,#c7cad1 100%)",
    soft: "linear-gradient(135deg,rgba(90,95,104,.18),rgba(199,202,209,.16))",
    accent: "#9aa0a8",
  },
  cafe: {
    id: "cafe",
    label: "Cafés",
    description: "Tonos café cálidos y acogedores.",
    gradient:
      "linear-gradient(135deg,#3f2a1c 0%,#6b4a33 45%,#a9764b 74%,#d2b48c 100%)",
    soft: "linear-gradient(135deg,rgba(107,74,51,.18),rgba(210,180,140,.16))",
    accent: "#a9764b",
  },
};

/** Paleta (código de 3 letras) → familia de fondo automático. */
const PALETTE_FAMILY: Record<string, BackgroundFamily> = {
  ARC: "arcoiris",
  PAS: "arcoiris",
  NEO: "neon",
  TRO: "tropical",
  SUN: "atardecer",
  OCE: "acuatico",
  FIE: "fiesta",
  GAL: "galaxia",
  ROS: "rosa",
  AZU: "acuatico",
  VER: "verde",
  MOR: "galaxia",
  NAR: "atardecer",
  AMA: "atardecer",
  ROJ: "rojo",
  GRI: "gris",
  CAF: "cafe",
};

/** Fondo automático sugerido para una paleta. Cae a "arcoíris" por defecto. */
export function getBackgroundForPalette(
  code: string | null | undefined,
): BackgroundPreset {
  const family = (code && PALETTE_FAMILY[code]) || "arcoiris";
  return BACKGROUND_PRESETS[family];
}

export function getBackgroundPreset(id: string): BackgroundPreset | null {
  return BACKGROUND_PRESETS[id as BackgroundFamily] ?? null;
}

/** Lista de familias válidas (para whitelist de validación). */
export const SCHOOL_BACKGROUND_FAMILIES = Object.keys(
  BACKGROUND_PRESETS,
) as BackgroundFamily[];
