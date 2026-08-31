import { type NextRequest, NextResponse } from "next/server";
import {
  jsonError,
  readJsonBody,
  serviceUnavailable,
  tooManyRequests,
} from "@/lib/api";
import { logAudit } from "@/lib/db/admin";
import { persistAdminSession } from "@/lib/security/admin-auth";
import { isAdminConfigured, isAdminPasswordWeak } from "@/lib/security/env";
import {
  clearAdminLoginFailures,
  getAdminLoginLock,
  registerAdminLoginFailure,
} from "@/lib/security/login-throttle";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/security/session";
import { AdminLoginSchema } from "@/lib/validation/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Login del panel.
 *
 * DOS frenos, a propósito:
 *   1. `checkRateLimit` (en memoria) absorbe ráfagas sin tocar la base, pero
 *      vive en el proceso: en serverless cada instancia nueva empieza con el
 *      contador en cero, así que por sí solo NO detiene una fuerza bruta.
 *   2. `login-throttle` guarda los intentos en Postgres, compartidos por todas
 *      las instancias. Ese es el control real.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`admin-login:${ip}`, RATE_LIMITS.adminLogin);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  // Sin ADMIN_SESSION_SECRET o sin password configurado, el admin queda
  // bloqueado por completo.
  if (!isAdminConfigured()) {
    return serviceUnavailable("El panel no está configurado.");
  }

  // Bloqueo durable: se comprueba ANTES de tocar la contraseña, para que un
  // atacante bloqueado no obtenga ni siquiera la señal de tiempo del compare.
  const lock = await getAdminLoginLock(ip);
  if (lock.locked) return tooManyRequests(lock.retryAfterSeconds);

  const body = await readJsonBody(request);
  const parsed = AdminLoginSchema.safeParse(body);
  if (!parsed.success) return jsonError("Credenciales inválidas.", 401);

  if (!verifyAdminPassword(parsed.data.password)) {
    const failure = await registerAdminLoginFailure(ip);
    await logAudit({
      actor: "anonymous",
      action: "admin.login_failed",
      entityType: "admin_session",
      metadata: { locked: failure.locked },
    });
    if (failure.locked) return tooManyRequests(failure.retryAfterSeconds);
    return jsonError("Credenciales inválidas.", 401);
  }

  const session = createAdminSessionToken();
  if (!session) return serviceUnavailable("El panel no está configurado.");

  await persistAdminSession(session.payload);
  await clearAdminLoginFailures(ip);
  await logAudit({
    actor: "admin",
    action: "admin.login",
    entityType: "admin_session",
    // Señal operativa (sin el valor): una contraseña corta en un panel sin
    // segundo factor es el eslabón más débil de todo el sistema.
    metadata: { weakPassword: isAdminPasswordWeak() },
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, session.token, adminCookieOptions());
  return response;
}
