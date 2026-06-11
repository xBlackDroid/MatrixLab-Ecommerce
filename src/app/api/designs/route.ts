import { type NextRequest, NextResponse } from "next/server";
import {
  jsonError,
  readJsonBody,
  serviceUnavailable,
  tooManyRequests,
} from "@/lib/api";
import { requireServiceClient } from "@/lib/db/admin";
import type { ProductRow } from "@/lib/db/types";
import { isSupabaseConfigured } from "@/lib/security/env";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import {
  ensureSessionId,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/security/session";
import { DesignerCreateSchema } from "@/lib/validation/designer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Crea un borrador de diseño ligado a la sesión. */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`designs:${ip}`, RATE_LIMITS.designs);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  if (!isSupabaseConfigured()) {
    return serviceUnavailable(
      "El diseñador está en configuración. Intenta más tarde o cotiza por WhatsApp.",
    );
  }

  const body = await readJsonBody(request);
  const parsed = DesignerCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Datos inválidos.", 400);

  const { sessionId, isNew } = ensureSessionId(request);
  const client = requireServiceClient();

  // El producto debe existir, ser visible y permitir personalización.
  const { data: productData } = await client
    .from("products")
    .select("id, status, is_customizable")
    .eq("id", parsed.data.productId)
    .maybeSingle();
  const product = productData as Pick<
    ProductRow,
    "id" | "status" | "is_customizable"
  > | null;
  if (!product || product.status === "oculto" || !product.is_customizable) {
    return jsonError("Este producto no se puede personalizar.", 409);
  }

  if (parsed.data.variantId) {
    const { data: variantData } = await client
      .from("product_variants")
      .select("id")
      .eq("id", parsed.data.variantId)
      .eq("product_id", parsed.data.productId)
      .maybeSingle();
    if (!variantData) return jsonError("Opción inválida.", 409);
  }

  const { data: created, error } = await client
    .from("design_projects")
    .insert({
      session_id: sessionId,
      product_type: parsed.data.productType,
      product_id: parsed.data.productId,
      variant_id: parsed.data.variantId ?? null,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !created) {
    return jsonError("No pudimos crear tu diseño. Intenta de nuevo.", 500);
  }

  const response = NextResponse.json({ ok: true, designId: created.id });
  if (isNew) {
    response.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions());
  }
  return response;
}
