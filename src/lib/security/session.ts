import "server-only";

import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getServerEnv, isProduction } from "@/lib/security/env";

/**
 * Sesiones de tienda (carrito) y sesiones de administración.
 *
 * - Tienda: cookie httpOnly `ml_session` con un id aleatorio no adivinable.
 *   El carrito y los diseños se asocian a este id en el servidor.
 * - Admin: cookie httpOnly `ml_admin` con payload firmado HMAC-SHA256 usando
 *   ADMIN_SESSION_SECRET, más registro en la tabla admin_sessions para poder
 *   revocar sesiones.
 */

export const SESSION_COOKIE = "ml_session";
export const ADMIN_COOKIE = "ml_admin";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const ADMIN_MAX_AGE_SECONDS = 60 * 60 * 8;

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;

export function newSessionId(): string {
  return randomBytes(24).toString("base64url");
}

export function isValidSessionId(
  value: string | null | undefined,
): value is string {
  return typeof value === "string" && SESSION_ID_PATTERN.test(value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction(),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/** Lee el sessionId de un request de API (sin crearlo). */
export function readSessionId(request: NextRequest): string | null {
  const value = request.cookies.get(SESSION_COOKIE)?.value;
  return isValidSessionId(value) ? value : null;
}

/** Lee el sessionId desde un Server Component (solo lectura). */
export async function readSessionIdFromCookies(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  return isValidSessionId(value) ? value : null;
}

/**
 * Obtiene el sessionId actual o genera uno nuevo. El caller es responsable
 * de setear la cookie en la respuesta cuando `isNew` es true.
 */
export function ensureSessionId(request: NextRequest): {
  sessionId: string;
  isNew: boolean;
} {
  const existing = readSessionId(request);
  if (existing) return { sessionId: existing, isNew: false };
  return { sessionId: newSessionId(), isNew: true };
}

/**
 * Hash corto del sessionId para rutas de storage y metadata: nunca exponer
 * el sessionId crudo fuera de la cookie.
 */
export function hashSessionId(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex").slice(0, 16);
}

// ---------------------------------------------------------------------------
// Sesión de administración (payload firmado)
// ---------------------------------------------------------------------------

export interface AdminSessionPayload {
  /** Id de sesión (se guarda hasheado en admin_sessions para revocación). */
  sid: string;
  /** Token CSRF ligado a la sesión; se exige en mutaciones admin. */
  csrf: string;
  /** Expiración unix (segundos). */
  exp: number;
  v: 1;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function signPayload(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Crea el token firmado de sesión admin. Devuelve null si falta el secreto. */
export function createAdminSessionToken(): {
  token: string;
  payload: AdminSessionPayload;
} | null {
  const secret = getServerEnv().adminSessionSecret;
  if (!secret) return null;
  const payload: AdminSessionPayload = {
    sid: randomBytes(18).toString("base64url"),
    csrf: randomBytes(18).toString("base64url"),
    exp: Math.floor(Date.now() / 1000) + ADMIN_MAX_AGE_SECONDS,
    v: 1,
  };
  const encoded = b64url(JSON.stringify(payload));
  const signature = signPayload(encoded, secret);
  return { token: `${encoded}.${signature}`, payload };
}

/** Verifica firma y expiración del token admin. */
export function verifyAdminSessionToken(
  token: string | null | undefined,
): AdminSessionPayload | null {
  const secret = getServerEnv().adminSessionSecret;
  if (!secret || !token || token.length > 2048) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts as [string, string];
  const expected = signPayload(encoded, secret);
  if (!safeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as AdminSessionPayload;
    if (payload.v !== 1) return null;
    if (typeof payload.sid !== "string" || typeof payload.csrf !== "string") {
      return null;
    }
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** Hash de sid para persistir en admin_sessions (nunca guardar el token). */
export function hashAdminSid(sid: string): string {
  return createHash("sha256").update(sid).digest("hex");
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction(),
    path: "/",
    maxAge: ADMIN_MAX_AGE_SECONDS,
  };
}

export function readAdminToken(request: NextRequest): string | null {
  return request.cookies.get(ADMIN_COOKIE)?.value ?? null;
}

export async function readAdminTokenFromCookies(): Promise<string | null> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value ?? null;
}

/** Comparación de password en tiempo constante (login admin). */
export function verifyAdminPassword(candidate: string): boolean {
  const expected = getServerEnv().adminAccessPassword;
  if (!expected) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
