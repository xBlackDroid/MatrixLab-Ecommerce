/**
 * Configuración del Laboratorio láser (Etapa 2 — estructura base).
 *
 * Define el área de trabajo de la cortadora, el área segura (área total menos
 * 15% de margen) y las plantillas/figuras base. NO implementa lógica física
 * de corte todavía: deja todo listo para una etapa de producción posterior.
 */

export const LASER_WORK_AREA_CM = { width: 50, height: 30 } as const;

/** px lógicos por cm en el lienzo láser (compartido canvas/orquestador). */
export const LASER_PX_PER_CM = 14;

/** Margen de seguridad: el área útil es el 85% del área total. */
export const LASER_SAFE_MARGIN_RATIO = 0.15;

export function getLaserSafeAreaCm() {
  const factor = 1 - LASER_SAFE_MARGIN_RATIO;
  const width = LASER_WORK_AREA_CM.width * factor;
  const height = LASER_WORK_AREA_CM.height * factor;
  return {
    width,
    height,
    xCm: (LASER_WORK_AREA_CM.width - width) / 2,
    yCm: (LASER_WORK_AREA_CM.height - height) / 2,
  };
}

export type LaserTemplateShape = "rect" | "roundrect" | "circle" | "pill";

export interface LaserTemplate {
  id: string;
  label: string;
  shape: LaserTemplateShape;
  /** Tamaño representativo de la pieza en cm (solo visual en esta etapa). */
  sizeCm: { width: number; height: number };
}

export const LASER_TEMPLATES: LaserTemplate[] = [
  { id: "termo", label: "Termo", shape: "roundrect", sizeCm: { width: 22, height: 8 } },
  { id: "taza", label: "Taza", shape: "roundrect", sizeCm: { width: 20, height: 8 } },
  { id: "vaso", label: "Vaso", shape: "roundrect", sizeCm: { width: 18, height: 8 } },
  { id: "tumbler", label: "Tumbler", shape: "roundrect", sizeCm: { width: 24, height: 9 } },
  { id: "llavero", label: "Llavero", shape: "roundrect", sizeCm: { width: 6, height: 3 } },
  { id: "tag-acrilico", label: "Tag de acrílico", shape: "roundrect", sizeCm: { width: 7, height: 4 } },
  { id: "placa-acrilica", label: "Placa acrílica", shape: "rect", sizeCm: { width: 20, height: 12 } },
  { id: "senaletica", label: "Señalética pequeña", shape: "rect", sizeCm: { width: 15, height: 10 } },
  { id: "porta-vaso", label: "Porta vaso", shape: "circle", sizeCm: { width: 10, height: 10 } },
  { id: "medalla", label: "Medalla / pet tag", shape: "circle", sizeCm: { width: 5, height: 5 } },
  { id: "tabla-madera", label: "Tabla de madera", shape: "roundrect", sizeCm: { width: 30, height: 20 } },
  { id: "caja", label: "Caja pequeña", shape: "rect", sizeCm: { width: 15, height: 12 } },
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

export const LASER_TEXT_MAX_LENGTH = 40;
