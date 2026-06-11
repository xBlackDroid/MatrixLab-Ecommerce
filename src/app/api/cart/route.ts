import { type NextRequest, NextResponse } from "next/server";
import { jsonError, serviceUnavailable, tooManyRequests } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/security/env";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import {
  ensureSessionId,
  readSessionId,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/security/session";
import { buildCartView, getOrCreateCart } from "@/lib/store/cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMPTY_CART = {
  cartId: null,
  status: null,
  items: [],
  totals: { subtotal: 0, shipping: 0, total: 0, currency: "MXN" },
  count: 0,
};

/** Carrito actual de la sesión (lectura; nunca crea sesión ni carrito). */
export async function GET(request: NextRequest) {
  const sessionId = readSessionId(request);
  if (!sessionId || !isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, cart: EMPTY_CART });
  }
  try {
    const cart = await buildCartView(sessionId);
    return NextResponse.json({ ok: true, cart });
  } catch {
    return jsonError("No pudimos cargar tu carrito.", 500);
  }
}

/** Garantiza sesión + carrito activo (se usa antes del checkout). */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`cart:${ip}`, RATE_LIMITS.cart);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  if (!isSupabaseConfigured()) {
    return serviceUnavailable(
      "La tienda está en configuración. Intenta más tarde.",
    );
  }

  const { sessionId, isNew } = ensureSessionId(request);
  try {
    const result = await getOrCreateCart(sessionId);
    if (!result.ok) {
      return jsonError("No pudimos preparar tu carrito.", 500);
    }
    const response = NextResponse.json({
      ok: true,
      cartId: result.data.id,
    });
    if (isNew) {
      response.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions());
    }
    return response;
  } catch {
    return jsonError("No pudimos preparar tu carrito.", 500);
  }
}
