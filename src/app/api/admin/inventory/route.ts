import { type NextRequest, NextResponse } from "next/server";
import {
  jsonError,
  readJsonBody,
  serviceUnavailable,
  tooManyRequests,
} from "@/lib/api";
import { logAudit } from "@/lib/db/admin";
import {
  getAdminFromRequest,
  requireAdminMutation,
} from "@/lib/security/admin-auth";
import { isSupabaseConfigured } from "@/lib/security/env";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { adjustStock, listInventory, listMovements } from "@/lib/store/inventory";
import { InventoryAdjustSchema } from "@/lib/validation/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function guard(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`admin-api:${ip}`, RATE_LIMITS.adminApi);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);
  if (!isSupabaseConfigured()) {
    return serviceUnavailable("Base de datos no configurada.");
  }
  return null;
}

export async function GET(request: NextRequest) {
  const blocked = guard(request);
  if (blocked) return blocked;
  if (!(await getAdminFromRequest(request))) {
    return jsonError("No autorizado.", 401);
  }
  const [inventory, movements] = await Promise.all([
    listInventory(),
    listMovements(100),
  ]);
  return NextResponse.json({ ok: true, inventory, movements });
}

export async function PATCH(request: NextRequest) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const admin = await requireAdminMutation(request);
  if (!admin) return jsonError("No autorizado.", 401);

  const body = await readJsonBody(request);
  const parsed = InventoryAdjustSchema.safeParse(body);
  if (!parsed.success) return jsonError("Datos inválidos.", 400);

  const result = await adjustStock({
    variantId: parsed.data.variantId,
    delta: parsed.data.delta,
    status: parsed.data.status,
    reason: parsed.data.reason
      ? sanitizeText(parsed.data.reason, 200)
      : undefined,
    actor: "admin",
  });
  if (!result.ok) {
    return jsonError("No pudimos ajustar el inventario.", 500);
  }

  await logAudit({
    actor: "admin",
    action: "inventory.adjust",
    entityType: "product_variant",
    entityId: parsed.data.variantId,
    metadata: {
      delta: parsed.data.delta ?? null,
      status: parsed.data.status ?? null,
    },
  });
  return NextResponse.json({ ok: true, variant: result.variant });
}
