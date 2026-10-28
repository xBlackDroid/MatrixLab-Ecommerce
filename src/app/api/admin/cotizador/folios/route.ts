import { type NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api";
import {
  formatFolio,
  parseFolioReserve,
  reserveFolios,
} from "@/lib/admin-cotizador/folios";
import { createFolioRepo } from "@/lib/admin-cotizador/folio-store";
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

/**
 * Folios consecutivos de cotización (COT-xxx) del cotizador admin.
 *
 *   GET → { lastIssued, next, nextFolio }      (sólo lectura, no reserva)
 *   POST { requestId, mode, quote } (CSRF) → 200 { first, count, folios, next, replayed }
 *                                          | 409 IDEMPOTENCY_CONFLICT
 *
 * Sólo el servidor elige el número: el navegador nunca propone uno. Ver
 * src/lib/admin-cotizador/folios.ts y la migración *_admin_quote_folios.sql.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

function reply(body: Record<string, unknown>, status = 200, extra?: HeadersInit) {
  const response = NextResponse.json(body, { status });
  for (const [key, value] of Object.entries(PRIVATE_HEADERS)) {
    response.headers.set(key, value);
  }
  if (extra) new Headers(extra).forEach((v, k) => response.headers.set(k, v));
  return response;
}

function fail(message: string, status: number, code?: string, extra?: HeadersInit) {
  return reply({ ok: false, error: message, ...(code ? { code } : {}) }, status, extra);
}

function guard(request: NextRequest, reserving: boolean) {
  const ip = getClientIp(request);
  const limits = [checkRateLimit(`admin-api:${ip}`, RATE_LIMITS.adminApi)];
  if (reserving) {
    limits.push(
      checkRateLimit(`admin-quote-folio:${ip}`, RATE_LIMITS.adminQuoteFolioReserve),
    );
  }
  const blocked = limits.find((limit) => !limit.ok);
  if (blocked) {
    return fail(
      "Demasiadas solicitudes. Espera un momento e intenta de nuevo.",
      429,
      "RATE_LIMITED",
      { "Retry-After": String(blocked.retryAfterSeconds) },
    );
  }
  if (!isSupabaseConfigured()) {
    return fail("La nube no está configurada en este servidor.", 503, "NOT_CONFIGURED");
  }
  return null;
}

export async function GET(request: NextRequest) {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  if (!(await getAdminFromRequest(request))) {
    return fail("No autorizado.", 401, "UNAUTHORIZED");
  }
  try {
    const lastIssued = await createFolioRepo().lastIssued();
    return reply({
      ok: true,
      lastIssued,
      next: lastIssued + 1,
      nextFolio: formatFolio(lastIssued + 1),
    });
  } catch {
    return fail("No pudimos leer el folio de cotizaciones.", 500, "READ_FAILED");
  }
}

export async function POST(request: NextRequest) {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const admin = await requireAdminMutation(request);
  if (!admin) return fail("No autorizado.", 401, "UNAUTHORIZED");

  const body = await readJsonBody(request);
  if (body === null) {
    return fail("La solicitud es demasiado grande o no es JSON válido.", 413, "TOO_LARGE");
  }
  const parsed = parseFolioReserve(body);
  if (!parsed.ok) return fail("Datos de la cotización inválidos.", 400, "INVALID");

  try {
    const outcome = await reserveFolios(createFolioRepo(), parsed);
    if (outcome.status === "conflict") {
      return fail(
        "Esta solicitud ya se usó con otro contenido. Vuelve a generar el PDF.",
        409,
        "IDEMPOTENCY_CONFLICT",
      );
    }
    const { reservation } = outcome;
    if (!reservation.replayed) {
      // Sólo números: nunca cliente, montos ni la huella.
      await logAudit({
        actor: "admin",
        action: "quote_folio.reserve",
        entityType: "admin_quote_folio",
        entityId: null,
        metadata: { first: reservation.first, count: reservation.count },
      });
    }
    return reply({
      ok: true,
      first: reservation.first,
      count: reservation.count,
      folios: outcome.folios,
      lastIssued: reservation.lastIssued,
      next: outcome.next,
      replayed: reservation.replayed,
    });
  } catch {
    return fail("No pudimos asignar el folio. No se generó ningún PDF.", 500, "RESERVE_FAILED");
  }
}
