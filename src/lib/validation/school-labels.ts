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
 *   - colorCode ∈ ARC/PAS/NEO/TRO/SUN/OCE/FIE/GAL/ROS/AZU/VER/MOR/NAR/AMA/ROJ/GRI/CAF
 *   - firstName requerido, lastName1 requerido, lastName2 opcional
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
    lastName1: z
      .string()
      .trim()
      .min(1, "Se requiere al menos un apellido.")
      .max(SCHOOL_FIELD_LIMITS.name)
      .refine((v) => !HTML_ANGLE.test(v), { message: "Apellido inválido." }),
    lastName2: safeText(SCHOOL_FIELD_LIMITS.name, "Apellido materno").optional(),
    nickname: safeText(SCHOOL_FIELD_LIMITS.nickname, "Apodo").optional(),
    school: safeText(SCHOOL_FIELD_LIMITS.school, "Colegio").optional(),
    grade: safeText(SCHOOL_FIELD_LIMITS.grade, "Grado").optional(),
    group: safeText(SCHOOL_FIELD_LIMITS.group, "Grupo").optional(),
  })
  .strict();

/**
 * Esquema del design_json (version 1). `.strict()` rechaza llaves extra para
 * que el payload no crezca de forma arbitraria.
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
    colorCode: z.enum(SCHOOL_COLOR_VALUES),
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
    addons: z.array(z.enum(SCHOOL_ADDON_VALUES)).max(SCHOOL_ADDON_VALUES.length),
    notes: safeText(SCHOOL_FIELD_LIMITS.notes, "Notas").optional(),
    previewUrl: z.string().max(512).optional(),
  })
  .strict();

export type SchoolLabelsDesignJson = z.infer<typeof SchoolLabelsDesignJsonSchema>;

// ---------------------------------------------------------------------------
// Helpers de validación para el cliente (no confiar: el servidor revalida).
// ---------------------------------------------------------------------------

export interface SchoolStudentInput {
  firstName: string;
  lastName1: string;
  lastName2?: string;
  nickname?: string;
  school?: string;
  grade?: string;
  group?: string;
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
  if (!input.lastName1.trim()) {
    errors.lastName1 = "Se requiere al menos un apellido.";
  } else if (input.lastName1.trim().length > SCHOOL_FIELD_LIMITS.name) {
    errors.lastName1 = `Máximo ${SCHOOL_FIELD_LIMITS.name} caracteres.`;
  } else if (HTML_ANGLE.test(input.lastName1)) {
    errors.lastName1 = "No se permite HTML.";
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
