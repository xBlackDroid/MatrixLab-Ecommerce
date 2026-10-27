import { type NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api";
import { parseWorkspaceSave } from "@/lib/admin-cotizador/schema";
import {
  loadWorkspace,
  saveWorkspace,
} from "@/lib/admin-cotizador/workspace-core";
import { createWorkspaceRepo } from "@/lib/admin-cotizador/workspace-store";
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
 * Foto en la nube del cotizador admin (/admin/cotizador).
 *
 *   GET → { version, snapshot | null, updatedAt }
 *   PUT { baseVersion, snapshot } (CSRF) → 200 { version, updatedAt }
 *                                         | 409 VERSION_CONFLICT
 *
 * La foto contiene costos internos y márgenes: toda respuesta es privada y
 * `no-store` (ni el navegador ni un proxy deben guardarla).
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

function guard(request: NextRequest, saving: boolean) {
  const ip = getClientIp(request);
  const limits = [checkRateLimit(`admin-api:${ip}`, RATE_LIMITS.adminApi)];
  if (saving) {
    limits.push(
      checkRateLimit(`admin-quote-save:${ip}`, RATE_LIMITS.adminQuoteWorkspaceSave),
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
    const record = await loadWorkspace(createWorkspaceRepo());
    return reply({
      ok: true,
      version: record.version,
      snapshot: record.snapshot,
      updatedAt: record.updatedAt,
    });
  } catch {
    return fail("No pudimos leer el guardado de la nube.", 500, "READ_FAILED");
  }
}

export async function PUT(request: NextRequest) {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const admin = await requireAdminMutation(request);
  if (!admin) return fail("No autorizado.", 401, "UNAUTHORIZED");

  const body = await readJsonBody(request);
  if (body === null) {
    return fail("El guardado es demasiado grande o no es JSON válido.", 413, "TOO_LARGE");
  }
  const parsed = parseWorkspaceSave(body);
  if (!parsed.ok) {
    return parsed.reason === "too_large"
      ? fail("El guardado excede el tamaño máximo permitido.", 413, "TOO_LARGE")
      : fail("Datos del cotizador inválidos.", 400, "INVALID");
  }

  try {
    const outcome = await saveWorkspace(
      createWorkspaceRepo(),
      parsed.baseVersion,
      parsed.snapshot,
      "admin",
    );
    if (outcome.status === "conflict") {
      return reply(
        {
          ok: false,
          code: "VERSION_CONFLICT",
          error: "Hay una versión más reciente guardada desde otra sesión.",
          currentVersion: outcome.current?.version ?? 0,
          updatedAt: outcome.current?.updatedAt ?? null,
        },
        409,
      );
    }
    await logAudit({
      actor: "admin",
      action: "quote_workspace.save",
      entityType: "admin_quote_workspace",
      entityId: null,
      metadata: { version: outcome.record.version },
    });
    return reply({
      ok: true,
      version: outcome.record.version,
      updatedAt: outcome.record.updatedAt,
    });
  } catch {
    return fail("No pudimos guardar en la nube.", 500, "WRITE_FAILED");
  }
}
