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
import { sanitizeText } from "@/lib/security/sanitize";
import { AdminVariantSchema } from "@/lib/validation/admin";
import { UuidSchema } from "@/lib/validation/store";

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

export async function POST(request: NextRequest) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const admin = await requireAdminMutation(request);
  if (!admin) return jsonError("No autorizado.", 401);

  const body = await readJsonBody(request);
  const parsed = AdminVariantSchema.safeParse(body);
  if (!parsed.success) return jsonError("Datos inválidos.", 400);
  const input = parsed.data;

  const client = requireServiceClient();
  const { data, error } = await client
    .from("product_variants")
    .insert({
      product_id: input.productId,
      title: sanitizeText(input.title, 120),
      sku: input.sku ? sanitizeText(input.sku, 60) : null,
      price: input.price ?? null,
      stock: input.stock,
      color: input.color ? sanitizeText(input.color, 40) : null,
      size: input.size ? sanitizeText(input.size, 20) : null,
      option_label: input.optionLabel
        ? sanitizeText(input.optionLabel, 80)
        : null,
      status: input.status,
    })
    .select("id")
    .single();
  if (error || !data) {
    const isDuplicate = error?.code === "23505";
    return jsonError(
      isDuplicate ? "Ya existe una variante con ese SKU." : "No pudimos crear la variante.",
      isDuplicate ? 409 : 500,
    );
  }

  await logAudit({
    actor: "admin",
    action: "variant.create",
    entityType: "product_variant",
    entityId: data.id,
  });
  return NextResponse.json({ ok: true, variantId: data.id });
}

export async function DELETE(request: NextRequest) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const admin = await requireAdminMutation(request);
  if (!admin) return jsonError("No autorizado.", 401);

  const url = new URL(request.url);
  const idParsed = UuidSchema.safeParse(url.searchParams.get("id"));
  if (!idParsed.success) return jsonError("Datos inválidos.", 400);

  const client = requireServiceClient();
  const { error } = await client
    .from("product_variants")
    .delete()
    .eq("id", idParsed.data);
  if (error) {
    return jsonError(
      "No se pudo eliminar la variante (puede tener pedidos asociados). Puedes ocultarla cambiando su estado.",
      409,
    );
  }

  await logAudit({
    actor: "admin",
    action: "variant.delete",
    entityType: "product_variant",
    entityId: idParsed.data,
  });
  return NextResponse.json({ ok: true });
}
