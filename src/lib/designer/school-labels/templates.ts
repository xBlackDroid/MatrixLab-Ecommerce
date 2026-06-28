/**
 * Plantillas editables por tipografía para Etiquetas Escolares Lab.
 *
 * Las muestras del PDF (`/images/school-labels/typography/0NN.webp`) son
 * imágenes raster: NO se pueden re-rotular con el nombre real del cliente. Para
 * que la VISTA PREVIA construya una etiqueta de verdad (nombre real + apellidos
 * reales con el estilo de la tipografía elegida), cada código se asocia a una
 * PLANTILLA editable: layout, estilo del nombre, estilo de los apellidos y
 * decoraciones (emoji/forma).
 *
 * IMPORTANTE — honestidad visual: las fuentes exactas del PDF no están
 * instaladas. Estas plantillas hacen el MEJOR MATCHING VISUAL posible con
 * fuentes web (Google Fonts cargadas en la página) y fuentes seguras del
 * sistema como respaldo. No son idénticas al PDF; son una reconstrucción fiel
 * del estilo (composición, color, peso, mayúsculas, decoración).
 *
 * Prioridad de calidad: 001, 003, 008, 011, 015, 018, 028, 035, 054 tienen
 * plantilla a mano. El resto cae a un generador determinístico que reutiliza
 * las "recipes" existentes, de modo que cada uno de los 54 códigos se ve
 * distinto y nunca aparece texto genérico.
 */

import { getTypographyRecipe } from "@/lib/designer/school-labels/typography-styles";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Composición general de la etiqueta. */
export type LabelLayout =
  | "twoLine" // nombre (1–2 líneas) + apellidos debajo
  | "scriptName" // nombre + apellidos en cursiva, en diagonal
  | "badge" // estilo escudo/varsity con estrellas
  | "iconLeft" // ícono grande a la izquierda + nombre a la derecha
  | "arched" // nombre en arco suave (aprox. por rotación de letras)
  | "character"; // ilustración/personaje grande + nombre

/** Cómo se colorea el texto del nombre. */
export type ColorMode =
  | "solid" // un solo color
  | "rainbowLetters" // cada letra un color vivo
  | "pastelLetters" // cada letra un color pastel
  | "gradient"; // degradado recortado al texto

export interface TemplateTextStyle {
  fontFamily: string;
  /** Tamaño base en px (se reescala según el ancho y el largo del texto). */
  fontSize: number;
  fontWeight?: number | string;
  fontStyle?: "normal" | "italic";
  textTransform?: "uppercase" | "capitalize" | "none";
  letterSpacing?: string;
  colorMode?: ColorMode;
  /** Color para `solid` (y respaldo si una paleta falta). */
  color?: string;
  /** Degradado para `gradient`. */
  gradient?: string;
  /** Paleta para `rainbowLetters` / `pastelLetters`. */
  palette?: readonly string[];
  /** Contorno (text-stroke), p. ej. "2px #ffffff". */
  stroke?: string;
  /** Sombra del texto. */
  shadow?: string;
}

export interface TemplateDecoration {
  type: "emoji" | "shape" | "asset";
  /** Emoji (👟), id de forma o ruta del asset. */
  value: string;
  position: "left" | "right" | "background" | "top" | "bottom";
}

export interface TypographyTemplate {
  code: string;
  layout: LabelLayout;
  /** Fondo (gradiente/colour CSS) de la etiqueta. Las muestras son claras. */
  surface?: string;
  /** Rotación del bloque del nombre (grados) para layouts en diagonal. */
  nameRotateDeg?: number;
  nameStyle: TemplateTextStyle;
  lastNameStyle: TemplateTextStyle;
  decorations?: TemplateDecoration[];
}

// ---------------------------------------------------------------------------
// Paletas reutilizables (matching de las muestras)
// ---------------------------------------------------------------------------

const PALETTE = {
  /** Pastel arcoíris suave (008, 001). */
  pastel: ["#f472b6", "#22d3ee", "#a78bfa", "#fb923c", "#34d399", "#f9a8d4"],
  /** Arcoíris vivo (015, 035). */
  vivid: ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"],
  /** Mezcla cálida/fría de la muestra 003. */
  candy: ["#14b8a6", "#fbbf24", "#f472b6", "#d946ef", "#fb7185", "#f59e0b"],
} as const;

// Familias tipográficas (Google Fonts cargadas en la página, con respaldos
// del sistema para que nunca se rompa si la fuente no carga).
const FONT = {
  baloo: "'Baloo 2', 'Trebuchet MS', system-ui, sans-serif",
  fredoka: "'Fredoka', 'Trebuchet MS', system-ui, sans-serif",
  luckiest: "'Luckiest Guy', 'Comic Sans MS', 'Chalkboard SE', cursive",
  pacifico: "'Pacifico', 'Brush Script MT', cursive",
  caveat: "'Caveat', 'Segoe Script', 'Comic Sans MS', cursive",
  graduate: "'Graduate', 'Copperplate', 'Times New Roman', serif",
  nunito: "'Nunito', 'Arial Black', system-ui, sans-serif",
  saira: "'Saira Condensed', 'Arial Narrow', 'Arial Black', sans-serif",
} as const;

const INK = "#1f2937"; // gris muy oscuro para apellidos tipo "negro" del PDF

// ---------------------------------------------------------------------------
// Plantillas prioritarias (a mano, matching de las muestras del PDF)
// ---------------------------------------------------------------------------

const TEMPLATES: Record<string, TypographyTemplate> = {
  // 001 — pastel suave, flor a la izquierda, apellidos negros.
  "001": {
    code: "001",
    layout: "iconLeft",
    surface: "linear-gradient(135deg,#ffffff 0%,#fff7fb 100%)",
    nameStyle: {
      fontFamily: FONT.fredoka,
      fontSize: 52,
      fontWeight: 600,
      textTransform: "capitalize",
      colorMode: "pastelLetters",
      palette: PALETTE.pastel,
    },
    lastNameStyle: {
      fontFamily: FONT.nunito,
      fontSize: 17,
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      color: INK,
    },
    decorations: [{ type: "emoji", value: "🌼", position: "left" }],
  },

  // 003 — nombre arcoíris en mayúsculas + apellidos en cursiva oscura.
  "003": {
    code: "003",
    layout: "twoLine",
    surface: "linear-gradient(135deg,#ffffff 0%,#f6fffb 100%)",
    nameStyle: {
      fontFamily: FONT.baloo,
      fontSize: 54,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.01em",
      colorMode: "rainbowLetters",
      palette: PALETTE.candy,
    },
    lastNameStyle: {
      fontFamily: FONT.caveat,
      fontSize: 26,
      fontWeight: 700,
      textTransform: "capitalize",
      color: INK,
    },
  },

  // 008 — letras grandes pastel con contorno + apellidos negros.
  "008": {
    code: "008",
    layout: "twoLine",
    surface: "linear-gradient(135deg,#ffffff 0%,#fbf7ff 100%)",
    nameStyle: {
      fontFamily: FONT.luckiest,
      fontSize: 58,
      fontWeight: 400,
      textTransform: "uppercase",
      letterSpacing: "0.01em",
      colorMode: "pastelLetters",
      palette: PALETTE.pastel,
      stroke: "1.5px rgba(255,255,255,0.9)",
      shadow: "0 2px 0 rgba(0,0,0,0.08)",
    },
    lastNameStyle: {
      fontFamily: FONT.nunito,
      fontSize: 18,
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: "#0f172a",
    },
  },

  // 011 — deportivo: nombre azul en itálica + balón a la izquierda.
  "011": {
    code: "011",
    layout: "iconLeft",
    surface: "linear-gradient(135deg,#ffffff 0%,#f1f6ff 100%)",
    nameStyle: {
      fontFamily: FONT.saira,
      fontSize: 56,
      fontWeight: 800,
      fontStyle: "italic",
      textTransform: "uppercase",
      letterSpacing: "0.01em",
      colorMode: "solid",
      color: "#1d4ed8",
      shadow: "0 2px 2px rgba(29,78,216,0.18)",
    },
    lastNameStyle: {
      fontFamily: FONT.saira,
      fontSize: 24,
      fontWeight: 800,
      fontStyle: "italic",
      textTransform: "uppercase",
      letterSpacing: "0.02em",
      color: "#9fc0e8",
    },
    decorations: [{ type: "emoji", value: "⚽", position: "left" }],
  },

  // 015 — arcoíris vivo en mayúsculas redondeadas + apellidos negros.
  "015": {
    code: "015",
    layout: "twoLine",
    surface: "linear-gradient(135deg,#ffffff 0%,#f4f9ff 100%)",
    nameStyle: {
      fontFamily: FONT.baloo,
      fontSize: 56,
      fontWeight: 800,
      textTransform: "uppercase",
      colorMode: "rainbowLetters",
      palette: PALETTE.vivid,
    },
    lastNameStyle: {
      fontFamily: FONT.nunito,
      fontSize: 18,
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: "#0f172a",
    },
  },

  // 018 — cursiva rosa en diagonal + paleta/helado.
  "018": {
    code: "018",
    layout: "scriptName",
    surface: "linear-gradient(135deg,#ffffff 0%,#fff5fa 100%)",
    nameRotateDeg: -10,
    nameStyle: {
      fontFamily: FONT.pacifico,
      fontSize: 40,
      fontWeight: 400,
      textTransform: "capitalize",
      colorMode: "solid",
      color: "#ec4899",
      shadow: "0 2px 6px rgba(236,72,153,0.22)",
    },
    lastNameStyle: {
      fontFamily: FONT.pacifico,
      fontSize: 26,
      fontWeight: 400,
      textTransform: "capitalize",
      color: "#f472b6",
    },
    decorations: [
      { type: "emoji", value: "🍭", position: "right" },
      { type: "emoji", value: "🍦", position: "background" },
    ],
  },

  // 028 — varsity verde con estrellas + balón.
  "028": {
    code: "028",
    layout: "badge",
    surface: "linear-gradient(135deg,#ffffff 0%,#f3fff6 100%)",
    nameStyle: {
      fontFamily: FONT.graduate,
      fontSize: 44,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.02em",
      colorMode: "solid",
      color: "#15803d",
    },
    lastNameStyle: {
      fontFamily: FONT.graduate,
      fontSize: 18,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#166534",
    },
    decorations: [
      { type: "emoji", value: "⭐", position: "top" },
      { type: "emoji", value: "⚽", position: "left" },
    ],
  },

  // 035 — divertido, arcoíris, con emoji de carita.
  "035": {
    code: "035",
    layout: "twoLine",
    surface: "linear-gradient(135deg,#ffffff 0%,#fffdf2 100%)",
    nameStyle: {
      fontFamily: FONT.luckiest,
      fontSize: 50,
      fontWeight: 400,
      textTransform: "uppercase",
      colorMode: "rainbowLetters",
      palette: PALETTE.vivid,
      stroke: "1px rgba(0,0,0,0.06)",
    },
    lastNameStyle: {
      fontFamily: FONT.baloo,
      fontSize: 22,
      fontWeight: 800,
      textTransform: "uppercase",
      colorMode: "rainbowLetters",
      palette: PALETTE.vivid,
    },
    decorations: [{ type: "emoji", value: "😎", position: "left" }],
  },

  // 054 — burbuja azul infantil + apellidos en cursiva verde + personaje.
  "054": {
    code: "054",
    layout: "character",
    surface: "linear-gradient(135deg,#ffffff 0%,#f0fbff 100%)",
    nameStyle: {
      fontFamily: FONT.baloo,
      fontSize: 46,
      fontWeight: 800,
      textTransform: "uppercase",
      colorMode: "solid",
      color: "#2563eb",
      stroke: "2px #ffffff",
      shadow: "0 3px 0 rgba(37,99,235,0.25)",
    },
    lastNameStyle: {
      fontFamily: FONT.caveat,
      fontSize: 26,
      fontWeight: 700,
      textTransform: "capitalize",
      color: "#22c55e",
    },
    decorations: [{ type: "emoji", value: "🐉", position: "left" }],
  },
};

// ---------------------------------------------------------------------------
// Fallback determinístico para el resto de los 54 códigos
// ---------------------------------------------------------------------------

/**
 * Construye una plantilla para cualquier código sin plantilla a mano,
 * reutilizando la "recipe" del catálogo. Alterna color sólido / arcoíris según
 * el número para que cada código se vea distinto (nunca genérico).
 */
function buildFallbackTemplate(code: string): TypographyTemplate {
  const recipe = getTypographyRecipe(code);
  const n = parseInt(code, 10);
  const variant = Number.isFinite(n) ? n % 3 : 0;

  const colorMode: ColorMode =
    variant === 0 ? "solid" : variant === 1 ? "rainbowLetters" : "pastelLetters";
  const palette = variant === 1 ? PALETTE.vivid : PALETTE.pastel;
  const isScript = recipe.fontStyle === "italic";

  return {
    code,
    layout: isScript ? "scriptName" : "twoLine",
    surface: "linear-gradient(135deg,#ffffff 0%,#f7f7fb 100%)",
    nameRotateDeg: isScript ? -6 : 0,
    nameStyle: {
      fontFamily: recipe.fontFamily,
      fontSize: 50,
      fontWeight: recipe.fontWeight ?? 800,
      fontStyle: recipe.fontStyle,
      textTransform: recipe.textTransform === "uppercase" ? "uppercase" : "capitalize",
      letterSpacing: recipe.letterSpacing,
      colorMode,
      color: recipe.color,
      palette,
      shadow: "0 2px 4px rgba(0,0,0,0.08)",
    },
    lastNameStyle: {
      fontFamily: isScript ? FONT.caveat : FONT.nunito,
      fontSize: isScript ? 24 : 17,
      fontWeight: isScript ? 700 : 900,
      textTransform: isScript ? "capitalize" : "uppercase",
      letterSpacing: isScript ? undefined : "0.04em",
      color: INK,
    },
  };
}

const fallbackCache = new Map<string, TypographyTemplate>();

/**
 * Devuelve la plantilla de un código. Prioritarios → plantilla a mano; el
 * resto → fallback determinístico cacheado. Siempre definida.
 */
export function getTypographyTemplate(
  code: string | null | undefined,
): TypographyTemplate {
  const key = (code ?? "001").trim() || "001";
  const hand = TEMPLATES[key];
  if (hand) return hand;
  const cached = fallbackCache.get(key);
  if (cached) return cached;
  const built = buildFallbackTemplate(key);
  fallbackCache.set(key, built);
  return built;
}

/** Códigos con plantilla diseñada a mano (los priorizados). */
export const CURATED_TEMPLATE_CODES = Object.keys(TEMPLATES);
