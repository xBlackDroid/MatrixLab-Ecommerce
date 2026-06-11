import { type NextRequest, NextResponse } from "next/server";
import {
  jsonError,
  readJsonBody,
  serviceUnavailable,
  tooManyRequests,
} from "@/lib/api";
import { logAudit } from "@/lib/db/admin";
import { persistAdminSession } from "@/lib/security/admin-auth";
import { isAdminConfigured } from "@/lib/security/env";
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

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`admin-login:${ip}`, RATE_LIMITS.adminLogin);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  // Sin ADMIN_SESSION_SECRET o sin password configurado, el admin queda
  // bloqueado por completo.
  if (!isAdminConfigured()) {
    return serviceUnavailable("El panel no está configurado.");
  }

  const body = await readJsonBody(request);
  const parsed = AdminLoginSchema.safeParse(body);
  if (!parsed.success) return jsonError("Credenciales inválidas.", 401);

  if (!verifyAdminPassword(parsed.data.password)) {
    await logAudit({
      actor: "anonymous",
      action: "admin.login_failed",
      entityType: "admin_session",
    });
    return jsonError("Credenciales inválidas.", 401);
  }

  const session = createAdminSessionToken();
  if (!session) return serviceUnavailable("El panel no está configurado.");

  await persistAdminSession(session.payload);
  await logAudit({
    actor: "admin",
    action: "admin.login",
    entityType: "admin_session",
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, session.token, adminCookieOptions());
  return response;
}
