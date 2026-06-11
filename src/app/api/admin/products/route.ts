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
  AdminProductSchema,
  AdminProductUpdateSchema,
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
    .from("products")
    .select("*, product_variants(*), categories(id, title, handle)")
    .order("created_at", { ascending: false });
  if (error) return jsonError("No pudimos cargar productos.", 500);
  return NextResponse.json({ ok: true, products: data ?? [] });
}

export async function POST(request: NextRequest) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const admin = await requireAdminMutation(request);
  if (!admin) return jsonError("No autorizado.", 401);

  const body = await readJsonBody(request);
  const parsed = AdminProductSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Datos inválidos. Revisa el formulario.", 400);
  }
  const input = parsed.data;

  const client = requireServiceClient();
  const { data, error } = await client
    .from("products")
    .insert({
      title: sanitizeText(input.title, 120),
      handle: input.handle,
      description: sanitizeMultiline(input.description, 5000),
      category_id: input.categoryId,
      base_price: input.basePrice,
      compare_at_price: input.compareAtPrice ?? null,
      images: input.images,
      status: input.status,
      is_customizable: input.isCustomizable,
      production_time: sanitizeText(input.productionTime, 80) || null,
      min_quantity: input.minQuantity,
      max_quantity: input.maxQuantity,
      tags: input.tags.map((tag) => sanitizeText(tag, 40)),
    })
    .select("id")
    .single();
  if (error || !data) {
    const isDuplicate = error?.code === "23505";
    return jsonError(
      isDuplicate ? "Ya existe un producto con ese handle." : "No pudimos crear el producto.",
      isDuplicate ? 409 : 500,
    );
  }

  await logAudit({
    actor: "admin",
    action: "product.create",
    entityType: "product",
    entityId: data.id,
  });
  return NextResponse.json({ ok: true, productId: data.id });
}

export async function PATCH(request: NextRequest) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const admin = await requireAdminMutation(request);
  if (!admin) return jsonError("No autorizado.", 401);

  const body = await readJsonBody(request);
  const parsed = AdminProductUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Datos inválidos.", 400);
  const { id, ...changes } = parsed.data;

  const updates: Record<string, unknown> = {};
  if (changes.title !== undefined) updates.title = sanitizeText(changes.title, 120);
  if (changes.handle !== undefined) updates.handle = changes.handle;
  if (changes.description !== undefined) {
    updates.description = sanitizeMultiline(changes.description, 5000);
  }
  if (changes.categoryId !== undefined) updates.category_id = changes.categoryId;
  if (changes.basePrice !== undefined) updates.base_price = changes.basePrice;
  if (changes.compareAtPrice !== undefined) {
    updates.compare_at_price = changes.compareAtPrice;
  }
  if (changes.images !== undefined) updates.images = changes.images;
  if (changes.status !== undefined) updates.status = changes.status;
  if (changes.isCustomizable !== undefined) {
    updates.is_customizable = changes.isCustomizable;
  }
  if (changes.productionTime !== undefined) {
    updates.production_time = sanitizeText(changes.productionTime, 80) || null;
  }
  if (changes.minQuantity !== undefined) updates.min_quantity = changes.minQuantity;
  if (changes.maxQuantity !== undefined) updates.max_quantity = changes.maxQuantity;
  if (changes.tags !== undefined) {
    updates.tags = changes.tags.map((tag) => sanitizeText(tag, 40));
  }
  if (Object.keys(updates).length === 0) {
    return jsonError("Nada que actualizar.", 400);
  }

  const client = requireServiceClient();
  const { error } = await client.from("products").update(updates).eq("id", id);
  if (error) return jsonError("No pudimos actualizar el producto.", 500);

  await logAudit({
    actor: "admin",
    action: "product.update",
    entityType: "product",
    entityId: id,
    metadata: { fields: Object.keys(updates) },
  });
  return NextResponse.json({ ok: true });
}
