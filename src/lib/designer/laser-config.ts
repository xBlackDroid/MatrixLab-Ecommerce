/**
 * Configuración del Laboratorio láser (Etapa 2).
 *
 * En esta etapa el láser es SOLO texto: el cliente elige una forma/plantilla,
 * ajusta libremente las dimensiones del área (dentro de un rango) y coloca
 * texto corto. No hay subida de imágenes. La producción real (corte/grabado)
 * se cotiza y ejecuta aparte; aquí solo se captura la intención de diseño.
 */

/** px lógicos por cm en el lienzo láser (compartido canvas/orquestador). */
export const LASER_PX_PER_CM = 14;

/** Margen visual (cm) alrededor del área dentro del lienzo. */
export const LASER_PADDING_CM = 2.5;

/** Margen de seguridad interno del área (fracción del lado menor). */
export const LASER_SAFE_INSET_RATIO = 0.08;

/** Rango permitido del área láser (cm). */
export const LASER_MIN_CM = { width: 5, height: 5 } as const;
export const LASER_MAX_CM = { width: 35, height: 45 } as const;
export const LASER_DEFAULT_CM = { width: 15, height: 10 } as const;

/** Limita y cuantiza (0.5 cm) una dimensión del área al rango permitido. */
export function clampLaserDim(axis: "width" | "height", value: number): number {
  const min = LASER_MIN_CM[axis];
  const max = LASER_MAX_CM[axis];
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value * 2) / 2));
}

export type LaserTemplateShape = "rect" | "roundrect" | "circle" | "pill";

export interface LaserTemplate {
  id: string;
  label: string;
  shape: LaserTemplateShape;
  /** Dimensión sugerida del área en cm al elegir esta forma (editable luego). */
  sizeCm: { width: number; height: number };
}

/**
 * Formas/plantillas disponibles. Se mantienen las que gustan visualmente y se
 * eliminan Señalética pequeña, Medalla / Pet Tag y Caja pequeña. "Tag de
 * acrílico" se renombra públicamente a "Tag".
 */
export const LASER_TEMPLATES: LaserTemplate[] = [
  { id: "termo", label: "Termo", shape: "roundrect", sizeCm: { width: 22, height: 8 } },
  { id: "taza", label: "Taza", shape: "roundrect", sizeCm: { width: 20, height: 8 } },
  { id: "vaso", label: "Vaso", shape: "roundrect", sizeCm: { width: 18, height: 8 } },
  { id: "tumbler", label: "Tumbler", shape: "roundrect", sizeCm: { width: 24, height: 9 } },
  { id: "llavero", label: "Llavero", shape: "roundrect", sizeCm: { width: 6, height: 5 } },
  { id: "tag", label: "Tag", shape: "roundrect", sizeCm: { width: 7, height: 5 } },
  { id: "placa-acrilica", label: "Placa acrílica", shape: "rect", sizeCm: { width: 20, height: 12 } },
  { id: "porta-vaso", label: "Porta vaso", shape: "circle", sizeCm: { width: 10, height: 10 } },
  { id: "tabla-madera", label: "Tabla de madera", shape: "roundrect", sizeCm: { width: 30, height: 20 } },
];

export function getLaserTemplate(id: string): LaserTemplate {
  return LASER_TEMPLATES.find((t) => t.id === id) ?? LASER_TEMPLATES[0]!;
}

/** Fuentes seguras (con fallback de sistema). No se cargan webfonts externas. */
export const LASER_FONTS = [
  { id: "montserrat", label: "Montserrat", family: "Montserrat, system-ui, sans-serif" },
  { id: "fredoka", label: "Fredoka", family: "Fredoka, system-ui, sans-serif" },
  { id: "arial", label: "Arial", family: "Arial, Helvetica, sans-serif" },
  { id: "sans", label: "Sans", family: "system-ui, sans-serif" },
] as const;

export const LASER_FONT_IDS = LASER_FONTS.map((f) => f.id);

export const LASER_TEXT_MAX_LENGTH = 40;
