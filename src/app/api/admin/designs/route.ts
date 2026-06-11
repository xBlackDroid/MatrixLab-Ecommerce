import { type NextRequest, NextResponse } from "next/server";
import {
  jsonError,
  readJsonBody,
  serviceUnavailable,
  tooManyRequests,
} from "@/lib/api";
import { logAudit, requireServiceClient } from "@/lib/db/admin";
import { requireAdminMutation } from "@/lib/security/admin-auth";
import { isSupabaseConfigured } from "@/lib/security/env";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { AdminDesignUpdateSchema } from "@/lib/validation/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cambia el estado de producción de un diseño (revisión/producción/listo). */
export async function PATCH(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`admin-api:${ip}`, RATE_LIMITS.adminApi);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);
  if (!isSupabaseConfigured()) {
    return serviceUnavailable("Base de datos no configurada.");
  }
  const admin = await requireAdminMutation(request);
  if (!admin) return jsonError("No autorizado.", 401);

  const body = await readJsonBody(request);
  const parsed = AdminDesignUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Datos inválidos.", 400);

  const client = requireServiceClient();
  const { error } = await client
    .from("design_projects")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.designId);
  if (error) return jsonError("No pudimos actualizar el diseño.", 500);

  await logAudit({
    actor: "admin",
    action: `design.status.${parsed.data.status}`,
    entityType: "design_project",
    entityId: parsed.data.designId,
  });
  return NextResponse.json({ ok: true });
}
