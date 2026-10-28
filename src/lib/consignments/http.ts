import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireServiceClient } from "@/lib/db/admin";
import { readJsonBody } from "@/lib/api";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/security/rate-limit";
import { CommandSchema, statementCsv, account, type Command } from "./domain";
import { enabled, snapshot } from "./server";

export function response(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}
export const fail = (code: string, status: number, error: string) => response({ ok: false, code, error }, status);
export function gate(req: NextRequest) {
  if (!enabled()) return fail("DISABLED", 404, "Este apartado no está disponible.");
  if (!checkRateLimit(`consign:${getClientIp(req)}`, RATE_LIMITS.adminApi).ok) return fail("RATE_LIMIT", 429, "Espera un momento.");
  return null;
}
export function dbFailure(error: { message?: string; code?: string }) {
  const msg = error.message ?? "";
  const codes: Record<string, [number, string]> = {
    CONS_NOT_FOUND: [404, "No encontramos esa pieza o documento."], CONS_FORBIDDEN: [403, "No tienes permiso para esta operación."],
    CONS_STOCK: [409, "No hay suficientes piezas. Actualiza el inventario."], CONS_IDEMPOTENCY: [409, "Esta intención ya se usó con datos diferentes."],
    CONS_PREVIEW_CHANGED: [409, "El inventario o el costo cambió. Revisa el resumen de nuevo."], CONS_STATE: [409, "El documento ya se corrigió o tiene movimientos posteriores."],
    CONS_BALANCE: [409, "El importe supera el saldo disponible."], CONS_QUANTITY: [409, "La devolución supera las piezas vendidas."], CONS_INVALID: [400, "Revisa los datos capturados."],
  };
  for (const [code, [status, text]] of Object.entries(codes)) if (msg.includes(code)) return fail(code, status, text);
  if (error.code?.startsWith("23") || error.code?.startsWith("22")) return fail("INVALID", 400, "Revisa los datos; el código puede estar repetido.");
  return fail("SERVICE", 503, "No pudimos guardar o consultar. Conserva el formulario e intenta de nuevo.");
}
export async function runCommand(req: NextRequest, dist: string, actor: string, actorType: "matrixlab_admin" | "distribuidor", member: string | null, command: Command) {
  const db = requireServiceClient();
  if (actorType === "distribuidor" && !["sale", "preview"].includes(command.action)) return fail("FORBIDDEN", 403, "No tienes permiso para esta operación.");
  if (command.action === "membership") {
    return fail("INVALID_USER", 400, "Administra las cuentas desde la sección Accesos.");
  }
  if (command.action === "preview") {
    const { data, error } = await db.rpc("consignment_preview", { p_distributor: dist, p_lines: command.payload.lines });
    return error ? dbFailure(error) : response({ ok: true, quote: data });
  }
  const key = req.headers.get("idempotency-key") ?? "";
  if (!/^[A-Za-z0-9_-]{8,120}$/.test(key)) return fail("INVALID_KEY", 400, "Falta la clave de confirmación.");
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await db.rpc("consignment_command", { p_distributor: dist, p_actor: actor,
      p_actor_type: actorType, p_membership: member, p_key: key, p_action: command.action, p_payload: command.payload });
    if (error && ["40001", "40P01"].includes(error.code) && attempt < 2) continue;
    return error ? dbFailure(error) : response({ ok: true, result: data });
  }
  return fail("SERVICE", 503, "Intenta de nuevo con la misma confirmación.");
}
export async function parseCommand(req: NextRequest) { return CommandSchema.safeParse(await readJsonBody(req)); }
export async function readAccount(req: NextRequest, dist: string, admin: boolean) {
  const scan = req.nextUrl.searchParams.get("scan");
  const s = await snapshot(dist, admin);
  if (scan !== null) {
    if (scan.length > 100) return fail("INVALID", 400, "Código inválido.");
    const item = s.items.find((i) => (i.scan_code === scan || i.sku === scan) && i.status === "activa" && i.stock > 0);
    return item ? response({ ok: true, item }) : fail("NOT_FOUND", 404, "Código no disponible en tu inventario.");
  }
  if (req.nextUrl.searchParams.get("export") === "csv") {
    const from = req.nextUrl.searchParams.get("from") ?? undefined;
    const to = req.nextUrl.searchParams.get("to") ?? undefined;
    if ((from && !z.iso.date().safeParse(from).success) || (to && !z.iso.date().safeParse(to).success) || (from && to && from > to))
      return fail("INVALID", 400, "Rango de fechas inválido.");
    return new NextResponse(statementCsv(s, from, to), { headers: { "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="estado-consignaciones.csv"', "Cache-Control": "private, no-store" } });
  }
  const from = req.nextUrl.searchParams.get("from") ?? undefined, to = req.nextUrl.searchParams.get("to") ?? undefined;
  const page = Number(req.nextUrl.searchParams.get("page") ?? 0), size = 20;
  if (!Number.isSafeInteger(page) || page < 0 || page > 100000 || (from && !z.iso.date().safeParse(from).success)
    || (to && !z.iso.date().safeParse(to).success) || (from && to && from > to)) return fail("INVALID", 400, "Rango o página inválidos.");
  const inRange = (v: { effective_date: string }) => (!from || v.effective_date >= from) && (!to || v.effective_date <= to);
  const sales = s.sales.filter(inRange), payments = s.payments.filter(inRange), deliveries = s.deliveries.filter(inRange),
    returns = s.returns.filter(inRange), adjustments = s.adjustments.filter(inRange);
  s.totals = account(s);
  s.pagination = { page, size, sales: sales.length, payments: payments.length, deliveries: deliveries.length, returns: returns.length, adjustments: adjustments.length };
  const slice = <T,>(values: T[]) => values.slice(page * size, (page + 1) * size);
  s.sales = slice(sales); s.payments = slice(payments); s.deliveries = slice(deliveries); s.returns = slice(returns); s.adjustments = slice(adjustments);
  const saleIds = new Set(s.sales.map((v) => v.id)), paymentIds = new Set(s.payments.map((p) => p.id));
  s.saleLines = s.saleLines.filter((l) => saleIds.has(l.sale_id)); s.allocations = s.allocations.filter((a) => saleIds.has(a.sale_id));
  s.applications = s.applications.filter((a) => saleIds.has(a.sale_id) || paymentIds.has(a.payment_id));
  return response({ ok: true, snapshot: s });
}
