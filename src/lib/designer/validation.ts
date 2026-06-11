import {
  ALLOWED_UPLOAD_EXTENSIONS,
  ALLOWED_UPLOAD_MIME_TYPES,
  UPLOAD_MAX_DIMENSION,
  UPLOAD_MIN_DIMENSION,
} from "@/lib/validation/designer";

/**
 * Validación de archivos del diseñador en el CLIENTE (primera línea).
 * El servidor re-valida todo (MIME real con sharp, peso, dimensiones):
 * esta capa solo evita subir archivos claramente inválidos.
 */

export const CLIENT_MAX_UPLOAD_MB = 10;

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

export function validateDesignFile(file: File): FileValidationResult {
  const mime = file.type.toLowerCase();
  if (!(ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(mime)) {
    return {
      ok: false,
      error: "Formato no permitido. Usa PNG, JPG o WEBP (recomendamos PNG).",
    };
  }
  const name = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_UPLOAD_EXTENSIONS.some((ext) =>
    name.endsWith(ext),
  );
  if (!hasValidExtension) {
    return {
      ok: false,
      error: "La extensión del archivo no es válida. Usa .png, .jpg o .webp.",
    };
  }
  if (file.size > CLIENT_MAX_UPLOAD_MB * 1024 * 1024) {
    return {
      ok: false,
      error: `El archivo pesa demasiado. Máximo ${CLIENT_MAX_UPLOAD_MB} MB.`,
    };
  }
  if (file.size <= 0) {
    return { ok: false, error: "El archivo está vacío." };
  }
  return { ok: true };
}

export function validateImageDimensions(
  width: number,
  height: number,
): FileValidationResult {
  if (width < UPLOAD_MIN_DIMENSION || height < UPLOAD_MIN_DIMENSION) {
    return {
      ok: false,
      error: `La imagen es muy pequeña. Mínimo ${UPLOAD_MIN_DIMENSION}px por lado para buena calidad.`,
    };
  }
  if (width > UPLOAD_MAX_DIMENSION || height > UPLOAD_MAX_DIMENSION) {
    return {
      ok: false,
      error: `La imagen es demasiado grande. Máximo ${UPLOAD_MAX_DIMENSION}px por lado.`,
    };
  }
  return { ok: true };
}
