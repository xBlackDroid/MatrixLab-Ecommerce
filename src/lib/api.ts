import "server-only";

import { NextResponse } from "next/server";

/**
 * Respuestas JSON estandarizadas. Los mensajes de error hacia el público son
 * genéricos: los detalles internos solo van a logs de servidor (sin secretos).
 */

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function jsonError(
  message: string,
  status = 400,
  code?: string,
): NextResponse {
  return NextResponse.json(
    { ok: false, error: message, ...(code ? { code } : {}) },
    { status },
  );
}

export function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "Demasiadas solicitudes. Espera un momento e intenta de nuevo.",
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export function serviceUnavailable(message: string): NextResponse {
  return jsonError(message, 503, "NOT_CONFIGURED");
}

const MAX_JSON_BYTES = 256 * 1024;

/** Lectura segura de JSON con límite de tamaño. Devuelve null si es inválido. */
export async function readJsonBody(request: Request): Promise<unknown | null> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_JSON_BYTES) return null;
  try {
    const text = await request.text();
    if (text.length > MAX_JSON_BYTES) return null;
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
