import { z } from "zod";
import {
  SCHOOL_ADDON_IDS,
  SCHOOL_FIELD_LIMITS,
  SCHOOL_PACKAGE_IDS,
} from "@/lib/designer/school-labels/config";
import { SCHOOL_COLOR_CODES } from "@/lib/designer/school-labels/color-palettes";
import { SCHOOL_TYPOGRAPHY_CODES } from "@/lib/designer/school-labels/typography-options";

/**
 * Validación de Etiquetas Escolares Lab. Es la barrera real del servidor:
 * el cliente nunca es de confianza. Reglas:
 *   - package ∈ {elementary, ultra}
 *   - typographyCode ∈ 001 … 054
 *   - colorCode: OPCIONAL (el fondo es automático; el usuario ya no elige color)
 *   - student: solo firstName (requerido) + lastNames (requerido)
 *   - límites de longitud por campo, sin HTML ni scripts
 *   - addons dentro de la whitelist
 *   - tamaño total del JSON acotado (límite duro en designer.ts)
 */

/** Whitelists (derivadas de la config/catálogos) para reusar en cliente. */
export const SCHOOL_PACKAGE_VALUES = SCHOOL_PACKAGE_IDS as [string, ...string[]];
export const SCHOOL_TYPOGRAPHY_VALUES = SCHOOL_TYPOGRAPHY_CODES as [
  string,
  ...string[],
];
export const SCHOOL_COLOR_VALUES = SCHOOL_COLOR_CODES as [string, ...string[]];
export const SCHOOL_ADDON_VALUES = SCHOOL_ADDON_IDS as [string, ...string[]];

/** Límite duro del design_json de etiquetas escolares serializado (bytes). */
export const SCHOOL_DESIGN_JSON_MAX_BYTES = 12_000;

/** Caracteres prohibidos en texto libre (defensa simple anti-HTML/script). */
const HTML_ANGLE = /[<>]/;

/**
 * Cadena de texto seguro: sin HTML/scripts (rechaza `<`/`>`), con longitud
 * máxima. El servidor además sanitiza con sanitizeText antes de persistir.
 */
function safeText(maxLength: number, label: string) {
  return z
    .string()
    .max(maxLength, `${label}: máximo ${maxLength} caracteres.`)
    .refine((v) => !HTML_ANGLE.test(v), {
      message: `${label}: no se permite HTML.`,
    });
}

const StudentSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "El nombre es obligatorio.")
      .max(SCHOOL_FIELD_LIMITS.name)
      .refine((v) => !HTML_ANGLE.test(v), { message: "Nombre inválido." }),
    lastNames: z
      .string()
      .trim()
      .min(1, "Los apellidos son obligatorios.")
      .max(SCHOOL_FIELD_LIMITS.lastNames)
      .refine((v) => !HTML_ANGLE.test(v), { message: "Apellidos inválidos." }),
  })
  // Tolerante: ignora llaves extra del estudiante (p. ej. de diseños antiguos)
  // en vez de rechazar el guardado.
  .passthrough();

/**
 * Esquema del design_json (version 1).
 *
 * Tolerante a propósito: el laboratorio escolar se arma con texto/selección
 * (no con uploads ni canvas), así que aceptamos el set de campos del wizard y
 * DESCARTAMOS llaves desconocidas (p. ej. un `preview`) en lugar de rechazar
 * el guardado. Las validaciones duras se mantienen donde importan: package,
 * tipografía y color contra sus catálogos, y nombre/apellido requeridos.
 */
export const SchoolLabelsDesignJsonSchema = z
  .object({
    version: z.literal(1),
    designerType: z.literal("school-labels"),
    productType: z.literal("etiquetas-escolares"),
    /** Handle del producto base (referencia legible para producción/admin). */
    productHandle: z.string().max(120).optional(),
    package: z.enum(SCHOOL_PACKAGE_VALUES),
    /** Ultra puede llevar hasta 2 diseños diferentes (1 por defecto). */
    designCount: z.union([z.literal(1), z.literal(2)]).optional(),
    student: StudentSchema,
    typographyCode: z.enum(SCHOOL_TYPOGRAPHY_VALUES),
    // El color/paleta ya NO es parte del flujo: el fondo es automático. Se deja
    // opcional para no romper diseños antiguos que aún lo traigan.
    colorCode: z.enum(SCHOOL_COLOR_VALUES).optional(),
    theme: safeText(SCHOOL_FIELD_LIMITS.theme, "Temática").optional(),
    decorativeIcons: safeText(
      SCHOOL_FIELD_LIMITS.decorativeIcons,
      "Iconos decorativos",
    ).optional(),
    characterInspiration: safeText(
      SCHOOL_FIELD_LIMITS.characterInspiration,
      "Personaje o inspiración",
    ).optional(),
    specialColors: safeText(
      SCHOOL_FIELD_LIMITS.specialColors,
      "Colores especiales",
    ).optional(),
    designComments: safeText(
      SCHOOL_FIELD_LIMITS.designComments,
      "Comentarios de diseño",
    ).optional(),
    // Acepta cualquier array de strings (ids o nombres comerciales de add-ons).
    addons: z.array(z.string().max(80)).max(30).optional().default([]),
    notes: safeText(SCHOOL_FIELD_LIMITS.notes, "Notas").optional(),
    previewUrl: z.string().max(512).optional(),
    /** Familia de fondo automático sugerida por la paleta (arcoiris, neon…). */
    backgroundPreset: z.string().max(16).optional(),
    /** Imagen propia subida por el cliente (referencia en storage privado). */
    customImage: z
      .object({
        assetId: z.string().max(64).optional(),
        path: z.string().max(256).optional(),
        url: z.string().max(512).optional(),
        fileName: z.string().max(160).optional(),
        /** Posición/escala dentro de la etiqueta (editable en la preview). */
        transform: z
          .object({
            x: z.number(),
            y: z.number(),
            scale: z.number(),
          })
          .partial()
          .optional(),
        /** Velo claro de legibilidad sobre la imagen (auto, ON por defecto). */
        readabilityOverlay: z.boolean().optional(),
      })
      .partial()
      .optional(),
  })
  // Ignora llaves desconocidas (no rompe el guardado) en vez de .strict().
  .passthrough();

export type SchoolLabelsDesignJson = z.infer<typeof SchoolLabelsDesignJsonSchema>;

// ---------------------------------------------------------------------------
// Helpers de validación para el cliente (no confiar: el servidor revalida).
// ---------------------------------------------------------------------------

export interface SchoolStudentInput {
  firstName: string;
  lastNames: string;
}

/** Valida los datos del estudiante; devuelve errores por campo. */
export function validateSchoolStudent(
  input: SchoolStudentInput,
): { ok: boolean; errors: Partial<Record<keyof SchoolStudentInput, string>> } {
  const errors: Partial<Record<keyof SchoolStudentInput, string>> = {};
  if (!input.firstName.trim()) {
    errors.firstName = "El nombre es obligatorio.";
  } else if (input.firstName.trim().length > SCHOOL_FIELD_LIMITS.name) {
    errors.firstName = `Máximo ${SCHOOL_FIELD_LIMITS.name} caracteres.`;
  } else if (HTML_ANGLE.test(input.firstName)) {
    errors.firstName = "No se permite HTML.";
  }
  if (!input.lastNames.trim()) {
    errors.lastNames = "Los apellidos son obligatorios.";
  } else if (input.lastNames.trim().length > SCHOOL_FIELD_LIMITS.lastNames) {
    errors.lastNames = `Máximo ${SCHOOL_FIELD_LIMITS.lastNames} caracteres.`;
  } else if (HTML_ANGLE.test(input.lastNames)) {
    errors.lastNames = "No se permite HTML.";
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
