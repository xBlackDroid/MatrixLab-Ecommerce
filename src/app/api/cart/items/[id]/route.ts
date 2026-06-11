import { type NextRequest, NextResponse } from "next/server";
import {
  jsonError,
  readJsonBody,
  serviceUnavailable,
  tooManyRequests,
} from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/security/env";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { readSessionId } from "@/lib/security/session";
import {
  buildCartView,
  CART_ERROR_MESSAGES,
  removeItem,
  updateItemQuantity,
} from "@/lib/store/cart";
import { CartUpdateItemSchema } from "@/lib/validation/cart";
import { UuidSchema } from "@/lib/validation/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function guard(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`cart-items:${ip}`, RATE_LIMITS.cart);
  if (!limit.ok) return { response: tooManyRequests(limit.retryAfterSeconds) };
  if (!isSupabaseConfigured()) {
    return {
      response: serviceUnavailable(
        "La tienda está en configuración. Intenta más tarde.",
      ),
    };
  }
  const sessionId = readSessionId(request);
  if (!sessionId) {
    return { response: jsonError("Tu sesión expiró. Recarga la página.", 401) };
  }
  return { sessionId };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guarded = guard(request);
  if ("response" in guarded) return guarded.response;

  const { id } = await context.params;
  const idParsed = UuidSchema.safeParse(id);
  const body = await readJsonBody(request);
  const bodyParsed = CartUpdateItemSchema.safeParse(body);
  if (!idParsed.success || !bodyParsed.success) {
    return jsonError("Datos inválidos.", 400);
  }

  try {
    const result = await updateItemQuantity({
      sessionId: guarded.sessionId,
      itemId: idParsed.data,
      quantity: bodyParsed.data.quantity,
    });
    if (!result.ok) {
      const status = result.error === "INTERNAL" ? 500 : 409;
      return jsonError(CART_ERROR_MESSAGES[result.error], status, result.error);
    }
    const cart = await buildCartView(guarded.sessionId);
    return NextResponse.json({ ok: true, cart });
  } catch {
    return jsonError(CART_ERROR_MESSAGES.INTERNAL, 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const guarded = guard(request);
  if ("response" in guarded) return guarded.response;

  const { id } = await context.params;
  const idParsed = UuidSchema.safeParse(id);
  if (!idParsed.success) return jsonError("Datos inválidos.", 400);

  try {
    const result = await removeItem({
      sessionId: guarded.sessionId,
      itemId: idParsed.data,
    });
    if (!result.ok) {
      const status = result.error === "INTERNAL" ? 500 : 404;
      return jsonError(CART_ERROR_MESSAGES[result.error], status, result.error);
    }
    const cart = await buildCartView(guarded.sessionId);
    return NextResponse.json({ ok: true, cart });
  } catch {
    return jsonError(CART_ERROR_MESSAGES.INTERNAL, 500);
  }
}
