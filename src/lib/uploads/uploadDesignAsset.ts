"use client";

import {
  isUploadErrorCode,
  UPLOAD_ERRORS,
  uploadErrorMessage,
  type UploadErrorCode,
} from "@/lib/uploads/errors";

/**
 * Helper de subida del arte del cliente al storage privado del Laboratorio.
 *
 * Centraliza el `fetch` a /api/uploads/design-assets con manejo de errores
 * TIPADO: traduce el `code` / status del servidor a un mensaje humano del
 * catálogo UPLOAD_ERRORS y marca cuándo el fallo es por configuración pendiente
 * (`configPending`) para que el editor entre en modo previsualización en vez de
 * mostrar un error genérico. El archivo original se sube tal cual (sin recomprimir);
 * el servidor genera la preview aparte.
 */

export interface UploadAssetSuccess {
  ok: true;
  assetId: string;
  designProjectId: string;
  signedUrl?: string;
  width: number;
  height: number;
  fileName: string;
}

export interface UploadAssetFailure {
  ok: false;
  code: UploadErrorCode;
  message: string;
  /** El storage no está listo: el editor sigue usable en modo previsualización. */
  configPending: boolean;
  status: number;
}

export type UploadAssetResult = UploadAssetSuccess | UploadAssetFailure;

/** Mapea el status HTTP a un código del catálogo cuando el servidor no envió uno. */
function codeFromStatus(status: number): UploadErrorCode {
  switch (status) {
    case 401:
      return "SESSION_MISSING";
    case 404:
      return "DESIGN_NOT_FOUND";
    case 409:
      return "DESIGN_LOCKED";
    case 413:
      return "FILE_TOO_LARGE";
    case 415:
      return "INVALID_TYPE";
    case 422:
      return "IMAGE_DIMENSIONS";
    case 429:
      return "RATE_LIMITED";
    case 503:
      return "STORAGE_NOT_CONFIGURED";
    default:
      return "UNKNOWN";
  }
}

export async function uploadDesignAsset(params: {
  file: File;
  designProjectId: string;
  signal?: AbortSignal;
}): Promise<UploadAssetResult> {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("designProjectId", params.designProjectId);

  let res: Response;
  try {
    res = await fetch("/api/uploads/design-assets", {
      method: "POST",
      body: formData,
      signal: params.signal,
    });
  } catch {
    return {
      ok: false,
      code: "NETWORK",
      message: UPLOAD_ERRORS.NETWORK,
      configPending: false,
      status: 0,
    };
  }

  const data = (await res.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (res.ok && data?.ok) {
    return {
      ok: true,
      assetId: String(data.assetId ?? ""),
      designProjectId: String(data.designProjectId ?? params.designProjectId),
      signedUrl: typeof data.signedUrl === "string" ? data.signedUrl : undefined,
      width: Number(data.width) || 0,
      height: Number(data.height) || 0,
      fileName:
        typeof data.fileName === "string" ? data.fileName : params.file.name,
    };
  }

  const serverCode = data?.code;
  const code: UploadErrorCode = isUploadErrorCode(serverCode)
    ? serverCode
    : codeFromStatus(res.status);
  const serverMessage =
    typeof data?.error === "string" && data.error.trim() ? data.error : null;

  return {
    ok: false,
    code,
    // El mensaje del servidor suele ser más específico (incluye el límite real);
    // si no llega, usamos el del catálogo.
    message: serverMessage ?? uploadErrorMessage(code),
    configPending: code === "STORAGE_NOT_CONFIGURED",
    status: res.status,
  };
}
