/**
 * Sanitizacion de texto visible. No se permite HTML en inputs de clientes:
 * todo texto libre (notas, nombres, busquedas) pasa por aqui antes de
 * persistirse o mostrarse.
 */

// Caracteres de control Unicode (se conservan tab y newline).
const CONTROL_CHARS = new RegExp(
  "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]",
  "g",
);

// Marcas diacriticas combinantes (para generar handles sin acentos).
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

/** Quita tags HTML, caracteres de control y normaliza espacios. */
export function sanitizeText(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, " ") // sin HTML
    .replace(CONTROL_CHARS, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Sanitiza conservando saltos de linea (notas multilinea). */
export function sanitizeMultiline(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(CONTROL_CHARS, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

const HANDLE_REGEX = /^[a-z0-9-]+$/;

/** Valida un handle contra la whitelist de caracteres permitidos. */
export function isValidHandle(handle: string): boolean {
  return HANDLE_REGEX.test(handle) && handle.length <= 120;
}

/** Convierte un titulo en handle seguro (solo a-z, 0-9 y guiones). */
export function toHandle(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** Nombre de archivo seguro para metadata (nunca se usa como ruta final). */
export function safeFileName(original: string): string {
  return original
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}
