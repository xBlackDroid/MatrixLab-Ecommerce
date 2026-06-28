/**
 * Configuración visual por tipografía de Etiquetas Escolares Lab.
 *
 * Las muestras del PDF (`/images/school-labels/typography/0NN.webp`) son
 * imágenes raster, así que NO se pueden re-rotular con el nombre del cliente.
 * Para que la vista previa de la derecha refleje de verdad la tipografía
 * elegida (y no se quede en una fuente genérica), cada código se asocia a una
 * "receta" visual: familia, peso, estilo, transform, espaciado, color de
 * acento y una decoración simple (sombra / contorno) para la preview.
 *
 * La MISMA receta alimenta:
 *   - la galería de tipografías (fallback cuando la muestra raster no carga), y
 *   - la vista previa de la etiqueta (nombre + apellidos del cliente),
 * de modo que ambas se mantienen consistentes y cambian de inmediato al
 * seleccionar otro código. Si una muestra raster no se puede replicar 1:1, la
 * receta es el mejor matching visual posible; el código elegido siempre se
 * muestra claramente en la UI.
 *
 * Para ajustar/añadir estilos: edita TYPOGRAPHY_RECIPES (el índice se deriva
 * del número del código de forma determinística, así que el catálogo de 54
 * códigos queda cubierto sin tocar nada más).
 */

import type { CSSProperties } from "react";

export interface TypographyRecipe {
  /** Etiqueta corta del estilo (referencia interna / accesibilidad). */
  id: string;
  /** Familia tipográfica (system/web-safe, con fallbacks alegres). */
  fontFamily: string;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  letterSpacing?: string;
  textTransform?: CSSProperties["textTransform"];
  /** Color de acento (sobre superficies claras, p. ej. la galería). */
  color: string;
  /** Sombra de texto extra para la preview (sobre el fondo de color). */
  previewTextShadow?: string;
  /** Contorno (text-stroke) opcional para estilos tipo "outline". */
  previewStroke?: string;
}

/**
 * Recetas visuales. La variedad de peso / itálica / mayúsculas / espaciado se
 * percibe SIEMPRE (aunque la familia caiga a una fuente del sistema), por lo
 * que cada código se ve claramente distinto del anterior.
 */
export const TYPOGRAPHY_RECIPES: TypographyRecipe[] = [
  {
    id: "serif-bold",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontWeight: 800,
    color: "#e63946",
    previewTextShadow: "0 2px 6px rgba(0,0,0,0.5)",
  },
  {
    id: "script",
    fontFamily: "'Segoe Script', 'Brush Script MT', 'Comic Sans MS', cursive",
    fontStyle: "italic",
    fontWeight: 600,
    color: "#118ab2",
    previewTextShadow: "0 2px 8px rgba(0,0,0,0.45)",
  },
  {
    id: "sans-tracked",
    fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
    fontWeight: 800,
    letterSpacing: "0.05em",
    color: "#2a9d4a",
    previewTextShadow: "0 2px 5px rgba(0,0,0,0.45)",
  },
  {
    id: "typewriter",
    fontFamily: "'Courier New', 'Lucida Console', monospace",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.02em",
    color: "#6a4c93",
    previewTextShadow: "0 2px 5px rgba(0,0,0,0.5)",
  },
  {
    id: "elegant-italic",
    fontFamily: "Palatino, 'Palatino Linotype', 'Book Antiqua', serif",
    fontStyle: "italic",
    fontWeight: 700,
    color: "#f4711e",
    previewTextShadow: "0 2px 6px rgba(0,0,0,0.45)",
  },
  {
    id: "bubbly",
    fontFamily: "'Comic Sans MS', 'Comic Sans', 'Chalkboard SE', cursive",
    fontWeight: 700,
    color: "#ff5da2",
    previewTextShadow: "0 2px 6px rgba(0,0,0,0.4)",
  },
  {
    id: "wide-sans",
    fontFamily: "Verdana, Geneva, sans-serif",
    fontWeight: 800,
    letterSpacing: "0.09em",
    color: "#3a86ff",
    previewTextShadow: "0 2px 5px rgba(0,0,0,0.45)",
  },
  {
    id: "impact",
    fontFamily: "Impact, 'Haettenschweiler', 'Arial Narrow Bold', sans-serif",
    fontWeight: 400,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    color: "#d00000",
    previewTextShadow: "0 1px 0 rgba(0,0,0,0.35)",
    previewStroke: "1px rgba(0,0,0,0.35)",
  },
  {
    id: "classic-serif",
    fontFamily: "'Times New Roman', Times, serif",
    fontWeight: 700,
    color: "#5f0f40",
    previewTextShadow: "0 2px 6px rgba(0,0,0,0.5)",
  },
  {
    id: "heavy-sans",
    fontFamily: "'Arial Black', 'Arial Bold', Gadget, sans-serif",
    fontWeight: 900,
    color: "#007f5f",
    previewTextShadow: "0 2px 6px rgba(0,0,0,0.45)",
  },
  {
    id: "engraved-caps",
    fontFamily: "'Copperplate', 'Copperplate Gothic Light', serif",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.13em",
    color: "#8338ec",
    previewTextShadow: "0 2px 5px rgba(0,0,0,0.45)",
  },
  {
    id: "handwriting",
    fontFamily: "'Lucida Handwriting', 'Brush Script MT', cursive",
    fontStyle: "italic",
    fontWeight: 600,
    color: "#e36414",
    previewTextShadow: "0 2px 8px rgba(0,0,0,0.4)",
  },
  {
    id: "rounded-bold",
    fontFamily: "'Trebuchet MS', 'Segoe UI', system-ui, sans-serif",
    fontWeight: 900,
    letterSpacing: "0.01em",
    color: "#ff006e",
    previewTextShadow: "0 2px 6px rgba(0,0,0,0.45)",
  },
  {
    id: "mono-spaced",
    fontFamily: "'Lucida Console', 'Courier New', monospace",
    fontWeight: 700,
    letterSpacing: "0.07em",
    color: "#1d3557",
    previewTextShadow: "0 2px 5px rgba(0,0,0,0.5)",
  },
  {
    id: "calligraphy",
    fontFamily: "'Monotype Corsiva', 'Brush Script MT', 'Segoe Script', cursive",
    fontStyle: "italic",
    fontWeight: 700,
    color: "#9d0208",
    previewTextShadow: "0 2px 8px rgba(0,0,0,0.4)",
  },
  {
    id: "tall-display",
    fontFamily: "'Bebas Neue', 'Oswald', 'Arial Narrow', sans-serif",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#0077b6",
    previewTextShadow: "0 2px 5px rgba(0,0,0,0.45)",
  },
];

/** Receta para un código (001 … 054). Determinística y siempre definida. */
export function getTypographyRecipe(code: string | null | undefined): TypographyRecipe {
  const n = parseInt(code ?? "", 10);
  const index = Number.isFinite(n) && n > 0 ? (n - 1) % TYPOGRAPHY_RECIPES.length : 0;
  return TYPOGRAPHY_RECIPES[index]!;
}

/**
 * Estilo para superficies CLARAS (galería de tipografías): usa el color de
 * acento de la receta. Pensado para el nombre del cliente sobre fondo blanco.
 */
export function typographyFallbackStyle(code: string): CSSProperties {
  const r = getTypographyRecipe(code);
  return {
    fontFamily: r.fontFamily,
    fontWeight: r.fontWeight,
    fontStyle: r.fontStyle,
    letterSpacing: r.letterSpacing,
    textTransform: r.textTransform,
    color: r.color,
  };
}

/**
 * Estilo para la VISTA PREVIA (texto blanco sobre el fondo de color). Mantiene
 * el texto legible y añade la sombra/contorno de la receta para que cada
 * tipografía se distinga (peso, itálica, mayúsculas, espaciado y decoración).
 */
export function typographyPreviewStyle(code: string): CSSProperties {
  const r = getTypographyRecipe(code);
  const style: CSSProperties = {
    fontFamily: r.fontFamily,
    fontWeight: r.fontWeight,
    fontStyle: r.fontStyle,
    letterSpacing: r.letterSpacing,
    textTransform: r.textTransform,
  };
  if (r.previewTextShadow) style.textShadow = r.previewTextShadow;
  if (r.previewStroke) {
    // Contorno fino para estilos tipo "outline" (Impact). Prefijo + estándar.
    (style as Record<string, string>).WebkitTextStroke = r.previewStroke;
  }
  return style;
}

/**
 * Equivalente para Canvas 2D (preview rasterizada al guardar). Devuelve la
 * cadena `ctx.font` y si el texto debe ir en MAYÚSCULAS, para que la miniatura
 * guardada también refleje la tipografía elegida (familia, peso, estilo).
 */
export function typographyCanvasFont(
  code: string,
  sizePx: number,
): { font: string; uppercase: boolean } {
  const r = getTypographyRecipe(code);
  const style = r.fontStyle === "italic" ? "italic " : "";
  const weight = r.fontWeight ?? 700;
  return {
    font: `${style}${weight} ${sizePx}px ${r.fontFamily}`,
    uppercase: r.textTransform === "uppercase",
  };
}
