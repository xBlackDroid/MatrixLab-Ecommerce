import "server-only";

import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { getServiceClient } from "@/lib/db/admin";
import { isSupabaseConfigured } from "@/lib/security/env";
import { verifyCsrf } from "@/lib/security/csrf";
import {
  type AdminSessionPayload,
  hashAdminSid,
  readAdminToken,
  readAdminTokenFromCookies,
  verifyAdminSessionToken,
} from "@/lib/security/session";

/**
 * Autenticación del panel admin.
 * Doble verificación: firma HMAC del token + registro vivo en admin_sessions
 * (permite revocar sesiones). Si la base de datos no está configurada, basta
 * la firma (modo desarrollo).
 */

export async function persistAdminSession(
  payload: AdminSessionPayload,
): Promise<void> {
  const client = getServiceClient();
  if (!client) return;
  await client.from("admin_sessions").insert({
    token_hash: hashAdminSid(payload.sid),
    expires_at: new Date(payload.exp * 1000).toISOString(),
  });
  // Higiene oportunista: purga sesiones ya expiradas en cada login para que
  // la tabla no acumule registros muertos (no requiere cron).
  await client
    .from("admin_sessions")
    .delete()
    .lt("expires_at", new Date().toISOString());
}

export async function revokeAdminSession(
  payload: AdminSessionPayload,
): Promise<void> {
  const client = getServiceClient();
  if (!client) return;
  await client
    .from("admin_sessions")
    .delete()
    .eq("token_hash", hashAdminSid(payload.sid));
}

async function isSessionActive(payload: AdminSessionPayload): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;
  const client = getServiceClient();
  if (!client) return false;
  const { data } = await client
    .from("admin_sessions")
    .select("id, expires_at")
    .eq("token_hash", hashAdminSid(payload.sid))
    .maybeSingle();
  if (!data) return false;
  return new Date(data.expires_at as string).getTime() > Date.now();
}

/** Sesión admin válida desde un request de API (o null). */
export async function getAdminFromRequest(
  request: NextRequest,
): Promise<AdminSessionPayload | null> {
  const payload = verifyAdminSessionToken(readAdminToken(request));
  if (!payload) return null;
  return (await isSessionActive(payload)) ? payload : null;
}

/** Sesión admin válida desde Server Components (o null). */
export async function getAdminFromCookies(): Promise<AdminSessionPayload | null> {
  const payload = verifyAdminSessionToken(await readAdminTokenFromCookies());
  if (!payload) return null;
  return (await isSessionActive(payload)) ? payload : null;
}

/** Guard de páginas admin: redirige al login si no hay sesión válida. */
export async function requireAdminPage(): Promise<AdminSessionPayload> {
  const admin = await getAdminFromCookies();
  if (!admin) redirect("/admin/login");
  return admin;
}

/**
 * Guard para mutaciones admin: sesión válida + token CSRF correcto en el
 * header. Devuelve null si algo falla (el handler responde 401/403 genérico).
 */
export async function requireAdminMutation(
  request: NextRequest,
): Promise<AdminSessionPayload | null> {
  const payload = await getAdminFromRequest(request);
  if (!payload) return null;
  if (!verifyCsrf(request, payload.csrf)) return null;
  return payload;
}
