import { type NextRequest, NextResponse } from "next/server";
import {
  jsonError,
  readJsonBody,
  serviceUnavailable,
  tooManyRequests,
} from "@/lib/api";
import { logAudit } from "@/lib/db/admin";
import { requireAdminMutation } from "@/lib/security/admin-auth";
import { isSupabaseConfigured } from "@/lib/security/env";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { updateVariantPrice } from "@/lib/store/inventory-price";
import { InventoryPriceUpdateSchema } from "@/lib/validation/inventory-price";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Precio de UNA variante desde Inventario. Separado de PATCH
 * /api/admin/inventory a propósito: no toca stock, estado ni movimientos.
 */

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function guard(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`admin-api:${ip}`, RATE_LIMITS.adminApi);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);
  if (!isSupabaseConfigured()) {
    return serviceUnavailable("Base de datos no configurada.");
  }
  return null;
}

export async function PATCH(request: NextRequest) {
  const blocked = guard(request);
  if (blocked) return noStore(blocked);
  const admin = await requireAdminMutation(request);
  if (!admin) return noStore(jsonError("No autorizado.", 401));

  const body = await readJsonBody(request);
  const parsed = InventoryPriceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return noStore(jsonError("Precio inválido.", 400, "INVALID_PRICE"));
  }

  let result: Awaited<ReturnType<typeof updateVariantPrice>>;
  try {
    result = await updateVariantPrice(parsed.data);
  } catch {
    return noStore(jsonError("No pudimos guardar el precio.", 500));
  }

  if (!result.ok) {
    switch (result.error) {
      case "CONFLICT":
        return noStore(
          NextResponse.json(
            {
              ok: false,
              error: "Otro dispositivo cambió este precio. Revisa el precio actual antes de guardar.",
              code: "PRICE_CONFLICT",
              pricing: result.pricing,
            },
            { status: 409 },
          ),
        );
      case "NOT_FOUND":
        return noStore(jsonError("La variante ya no existe.", 404, "NOT_FOUND"));
      case "NO_BASE_PRICE":
        return noStore(
          jsonError("Esta variante no tiene precio base al cual volver.", 422, "NO_BASE_PRICE"),
        );
      default:
        return noStore(jsonError("No pudimos guardar el precio.", 500));
    }
  }

  if (result.changed) {
    await logAudit({
      actor: "admin",
      action: "inventory.price_update",
      entityType: "product_variant",
      entityId: result.variant.id,
      metadata: {
        old_price: result.oldPrice,
        new_price: result.pricing.override,
        effective_price: result.pricing.effective,
        source: result.pricing.source,
      },
    });
  }

  return noStore(
    NextResponse.json({
      ok: true,
      changed: result.changed,
      variant: result.variant,
      pricing: result.pricing,
    }),
  );
}
