/**
 * Catálogo compartido de errores de subida del Laboratorio.
 *
 * Sin directivas ("use client" / "server-only"): es solo data + funciones puras,
 * seguro de importar tanto en rutas de API (servidor) como en componentes de
 * cliente. Es el ÚNICO origen de verdad de los mensajes de subida y evita el
 * genérico "en configuración" cuando el problema real es storage, sesión,
 * formato o permisos.
 */

export const UPLOAD_ERRORS = {
  STORAGE_NOT_CONFIGURED: "El almacenamiento aún no está configurado.",
  FILE_TOO_LARGE: "Tu imagen supera el tamaño permitido.",
  INVALID_TYPE: "Formato no permitido. Usa PNG, JPG o WEBP.",
  SESSION_MISSING: "No pudimos iniciar tu sesión de diseño.",
  STORAGE_POLICY: "No pudimos guardar la imagen por permisos de almacenamiento.",
  NO_BASE_PRODUCT: "No encontramos el producto base en catálogo.",
  IMAGE_INVALID: "El archivo no es una imagen válida.",
  IMAGE_DIMENSIONS: "La imagen no cumple las medidas recomendadas.",
  DESIGN_NOT_FOUND: "No encontramos tu diseño. Recarga la página.",
  DESIGN_LOCKED: "Este diseño ya está ligado a un pedido.",
  RATE_LIMITED: "Demasiadas solicitudes. Espera un momento e intenta de nuevo.",
  NETWORK: "Sin conexión. Revisa tu internet e intenta de nuevo.",
  UNKNOWN: "No pudimos subir la imagen. Intenta otra o escríbenos por WhatsApp.",
} as const;

export type UploadErrorCode = keyof typeof UPLOAD_ERRORS;

export function isUploadErrorCode(value: unknown): value is UploadErrorCode {
  return typeof value === "string" && value in UPLOAD_ERRORS;
}

export function uploadErrorMessage(code: UploadErrorCode): string {
  return UPLOAD_ERRORS[code];
}

/**
 * Fallos por configuración pendiente del backend: el Laboratorio NO debe verse
 * roto. Entra en modo "previsualización" (se puede diseñar y mover la imagen,
 * pero guardar / agregar al carrito queda gated con un mensaje claro).
 */
export function isConfigPendingCode(code: UploadErrorCode): boolean {
  return code === "STORAGE_NOT_CONFIGURED";
}
