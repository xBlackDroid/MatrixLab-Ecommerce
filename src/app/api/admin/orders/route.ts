import { type NextRequest, NextResponse } from "next/server";
import {
  jsonError,
  readJsonBody,
  serviceUnavailable,
  tooManyRequests,
} from "@/lib/api";
import type { OrderStatus } from "@/lib/db/types";
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
import { listOrdersAdmin, updateOrderStatusAdmin } from "@/lib/store/orders";
import { AdminOrderUpdateSchema, AdminOrdersQuerySchema } from "@/lib/validation/admin";

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

  const url = new URL(request.url);
  const statusRaw = url.searchParams.get("status") ?? undefined;
  const parsed = AdminOrdersQuerySchema.safeParse(
    statusRaw ? { status: statusRaw } : {},
  );
  if (!parsed.success) return jsonError("Filtro inválido.", 400);

  const orders = await listOrdersAdmin(parsed.data.status as OrderStatus);
  return NextResponse.json({ ok: true, orders });
}

export async function PATCH(request: NextRequest) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const admin = await requireAdminMutation(request);
  if (!admin) return jsonError("No autorizado.", 401);

  const body = await readJsonBody(request);
  const parsed = AdminOrderUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Datos inválidos.", 400);

  const result = await updateOrderStatusAdmin({
    orderId: parsed.data.orderId,
    status: parsed.data.status as OrderStatus,
    actor: "admin",
  });
  if (!result.ok) return jsonError("No pudimos actualizar el pedido.", 500);
  return NextResponse.json({ ok: true });
}
