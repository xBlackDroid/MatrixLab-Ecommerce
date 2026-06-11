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
import {
  ensureSessionId,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/security/session";
import {
  addItemToCart,
  buildCartView,
  CART_ERROR_MESSAGES,
} from "@/lib/store/cart";
import { CartAddItemSchema } from "@/lib/validation/cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Agregar producto al carrito. Precios/stock se resuelven en servidor. */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`cart-items:${ip}`, RATE_LIMITS.cart);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  if (!isSupabaseConfigured()) {
    return serviceUnavailable(
      "La tienda está en configuración. Intenta más tarde.",
    );
  }

  const body = await readJsonBody(request);
  const parsed = CartAddItemSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Datos inválidos.", 400);
  }

  const { sessionId, isNew } = ensureSessionId(request);
  try {
    const result = await addItemToCart({ sessionId, ...parsed.data });
    if (!result.ok) {
      const status = result.error === "INTERNAL" ? 500 : 409;
      return jsonError(CART_ERROR_MESSAGES[result.error], status, result.error);
    }
    const cart = await buildCartView(sessionId);
    const response = NextResponse.json({ ok: true, cart });
    if (isNew) {
      response.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions());
    }
    return response;
  } catch {
    return jsonError(CART_ERROR_MESSAGES.INTERNAL, 500);
  }
}
