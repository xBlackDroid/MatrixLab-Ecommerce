import { type NextRequest, NextResponse } from "next/server";
import {
  jsonError,
  readJsonBody,
  serviceUnavailable,
  tooManyRequests,
} from "@/lib/api";
import { logAudit, requireServiceClient } from "@/lib/db/admin";
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
import { sanitizeMultiline, sanitizeText } from "@/lib/security/sanitize";
import {
  AdminCategorySchema,
  AdminCategoryUpdateSchema,
} from "@/lib/validation/admin";

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
  const client = requireServiceClient();
  const { data, error } = await client
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return jsonError("No pudimos cargar categorías.", 500);
  return NextResponse.json({ ok: true, categories: data ?? [] });
}

export async function POST(request: NextRequest) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const admin = await requireAdminMutation(request);
  if (!admin) return jsonError("No autorizado.", 401);

  const body = await readJsonBody(request);
  const parsed = AdminCategorySchema.safeParse(body);
  if (!parsed.success) return jsonError("Datos inválidos.", 400);
  const input = parsed.data;

  const client = requireServiceClient();
  const { data, error } = await client
    .from("categories")
    .insert({
      title: sanitizeText(input.title, 80),
      handle: input.handle,
      description: sanitizeMultiline(input.description, 1000),
      image_url: input.imageUrl ?? null,
      sort_order: input.sortOrder,
      status: input.status,
    })
    .select("id")
    .single();
  if (error || !data) {
    const isDuplicate = error?.code === "23505";
    return jsonError(
      isDuplicate ? "Ya existe una categoría con ese handle." : "No pudimos crear la categoría.",
      isDuplicate ? 409 : 500,
    );
  }

  await logAudit({
    actor: "admin",
    action: "category.create",
    entityType: "category",
    entityId: data.id,
  });
  return NextResponse.json({ ok: true, categoryId: data.id });
}

export async function PATCH(request: NextRequest) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const admin = await requireAdminMutation(request);
  if (!admin) return jsonError("No autorizado.", 401);

  const body = await readJsonBody(request);
  const parsed = AdminCategoryUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Datos inválidos.", 400);
  const { id, ...changes } = parsed.data;

  const updates: Record<string, unknown> = {};
  if (changes.title !== undefined) updates.title = sanitizeText(changes.title, 80);
  if (changes.handle !== undefined) updates.handle = changes.handle;
  if (changes.description !== undefined) {
    updates.description = sanitizeMultiline(changes.description, 1000);
  }
  if (changes.imageUrl !== undefined) updates.image_url = changes.imageUrl;
  if (changes.sortOrder !== undefined) updates.sort_order = changes.sortOrder;
  if (changes.status !== undefined) updates.status = changes.status;
  if (Object.keys(updates).length === 0) {
    return jsonError("Nada que actualizar.", 400);
  }

  const client = requireServiceClient();
  const { error } = await client.from("categories").update(updates).eq("id", id);
  if (error) return jsonError("No pudimos actualizar la categoría.", 500);

  await logAudit({
    actor: "admin",
    action: "category.update",
    entityType: "category",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
