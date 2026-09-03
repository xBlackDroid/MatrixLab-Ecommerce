import { z } from "zod";
import { normalizeMexicanPhone } from "@/lib/validation/checkout";
import type { CourseRegistrationRules } from "@/lib/store/courses/types";
import { COURSE_ANY_DATE_VALUE } from "@/lib/store/courses/matrixlab-tumbler";

/**
 * Registro de interés a un curso / workshop.
 *
 * Esta validación es la que MANDA. El formulario del navegador valida lo mismo
 * para dar errores junto al campo, pero el servidor no confía en él: el
 * endpoint vuelve a construir este esquema DESDE LOS DATOS DE LA EDICIÓN y
 * revalida el payload completo antes de escribir una sola fila.
 *
 * Por qué es un CONSTRUCTOR y no un esquema fijo: las fechas del sondeo y el
 * tope de lugares son datos de la edición. La Edición 3 tendrá otras fechas, y
 * un enum quemado aquí las aceptaría mal o las rechazaría todas. Derivando el
 * esquema de la edición, la validación sigue siendo exacta sin tocar código.
 */

/** Caracteres de control (se eliminan siempre; nunca son texto legítimo). */
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

/** Igual, pero conservando tab y salto de línea (texto multilínea). */
const MULTILINE_CONTROL_CHARS =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/**
 * Limpieza de texto libre.
 *
 * Se hace DENTRO del esquema —mismo criterio que la dirección del checkout—
 * para que un campo obligatorio no pueda quedar vacío DESPUÉS de validar. Se
 * quitan los signos < y > pero se CONSERVA el texto: nadie necesita etiquetas
 * HTML en su nombre, pero sí puede escribir "Ana <3". Lo que quede vacío lo
 * rechaza el .min(2) con el mensaje del campo, en vez de guardarse en blanco.
 */
const limpiar = (value: string) =>
  value
    .replace(/[<>]/g, "")
    .replace(CONTROL_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();

/** Igual que `limpiar` pero conservando saltos de línea (comentario libre). */
const limpiarMultilinea = (value: string) =>
  value
    .replace(/[<>]/g, "")
    .replace(MULTILINE_CONTROL_CHARS, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/**
 * Nombre de quien se registra. Mínimo 2 caracteres: se pide un nombre para
 * poder saludarle por WhatsApp, no un nombre legal completo.
 */
const nameField = z
  .string()
  .max(120, "Máximo 120 caracteres.")
  .transform(limpiar)
  .pipe(
    z.string().min(2, "Escribe tu nombre.").max(80, "Máximo 80 caracteres."),
  );

/**
 * WhatsApp. Se reutiliza EL NORMALIZADOR DEL CHECKOUT en vez de escribir aquí
 * una regla parecida: con dos algoritmos, uno acabaría rechazando formatos
 * (044/045, +52, 521…) que el otro sí acepta, y la persona nunca llegaría a la
 * rama que los arregla. Una sola regla, un solo comportamiento.
 */
const whatsappField = z
  .string()
  .max(25, "Teléfono demasiado largo.")
  .transform(normalizeMexicanPhone)
  .pipe(z.string().regex(/^[0-9]{10}$/, "Escribe los 10 dígitos de tu WhatsApp."));

/** Correo OPCIONAL: el canal de contacto real de este taller es WhatsApp. */
const emailField = z.preprocess(
  emptyToUndefined,
  z.email("Correo inválido.").max(120, "Máximo 120 caracteres.").optional(),
);

/** Comentario libre y opcional. */
const commentField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .max(600, "Máximo 600 caracteres.")
    .transform(limpiarMultilinea)
    .pipe(z.string().max(400, "Máximo 400 caracteres."))
    .optional(),
);

/** Estados del registro. El inicial es siempre "interested": no hay pago aún. */
export const COURSE_REGISTRATION_STATUSES = [
  "interested",
  "contacted",
  "confirmed",
  "cancelled",
] as const;

export type CourseRegistrationStatus =
  (typeof COURSE_REGISTRATION_STATUSES)[number];

export const COURSE_REGISTRATION_INITIAL_STATUS: CourseRegistrationStatus =
  "interested";

/**
 * Nombre del campo TRAMPA (honeypot) del formulario.
 *
 * Va oculto para las personas y vacío siempre; un bot que rellena todos los
 * inputs lo llena. El endpoint lo revisa y lo descarta ANTES de validar, así
 * que nunca llega al esquema (que es `.strict()` y lo rechazaría con un error
 * que le enseñaría al bot exactamente qué campo quitar).
 */
export const COURSE_HONEYPOT_FIELD = "website";

/** Valores de fecha aceptados por una edición (sondeo + "cualquiera"). */
export function courseDateValues(edition: CourseRegistrationRules): string[] {
  return [
    ...edition.dateOptions.map((option) => option.value),
    COURSE_ANY_DATE_VALUE,
  ];
}

/**
 * Campos que escribe la persona. Los usa el formulario del navegador tal cual;
 * el servidor los envuelve con `buildCourseRegistrationSchema`.
 */
export function buildCourseRegistrationFieldsSchema(edition: CourseRegistrationRules) {
  const allowedDates = new Set(courseDateValues(edition));
  return z.object({
    name: nameField,
    phone: whatsappField,
    email: emailField,
    preferredDate: z
      .string()
      .refine(
        (value) => allowedDates.has(value),
        "Elige una de las fechas del sondeo.",
      ),
    partySize: z.coerce
      .number()
      .int("Elige cuántos lugares quieres.")
      .min(1, "Mínimo un lugar.")
      .max(
        edition.maxPartySize,
        `Para más de ${edition.maxPartySize} lugares escríbenos por WhatsApp.`,
      ),
    comment: commentField,
  });
}

/**
 * Payload COMPLETO que acepta el endpoint. Incluye a qué curso y edición
 * apunta el registro para que el servidor no dependa de un estado implícito.
 *
 * `.strict()` a propósito: una clave de más se rechaza en vez de guardarse a
 * medias, y es lo que impide colar campos ajenos (status, id, created_at) por
 * esta puerta.
 */
export function buildCourseRegistrationSchema(edition: CourseRegistrationRules) {
  return z
    .object({
      courseSlug: z
        .string()
        .min(1)
        .max(120)
        .regex(/^[a-z0-9-]+$/, "Curso inválido."),
      edition: z.coerce.number().int().min(1).max(999),
      ...buildCourseRegistrationFieldsSchema(edition).shape,
    })
    .strict();
}

export type CourseRegistrationInput = z.infer<
  ReturnType<typeof buildCourseRegistrationSchema>
>;

/**
 * Primera pasada: sólo a qué curso/edición apunta el payload.
 *
 * Hace falta porque el esquema completo se DERIVA de la edición, y para
 * conocerla hay que leer estos dos campos antes. Es deliberadamente laxo con
 * el resto de las claves: la validación de verdad viene después, con el
 * esquema `.strict()` que sí conoce la edición.
 */
export const CourseRegistrationTargetSchema = z.object({
  courseSlug: z.string().min(1).max(120),
  edition: z.coerce.number().int().min(1).max(999),
});
