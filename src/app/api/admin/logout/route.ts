import { type NextRequest, NextResponse } from "next/server";
import { tooManyRequests } from "@/lib/api";
import { logAudit } from "@/lib/db/admin";
import { revokeAdminSession } from "@/lib/security/admin-auth";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import {
  ADMIN_COOKIE,
  readAdminToken,
  verifyAdminSessionToken,
} from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`admin-api:${ip}`, RATE_LIMITS.adminApi);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const payload = verifyAdminSessionToken(readAdminToken(request));
  if (payload) {
    await revokeAdminSession(payload);
    await logAudit({
      actor: "admin",
      action: "admin.logout",
      entityType: "admin_session",
    });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
