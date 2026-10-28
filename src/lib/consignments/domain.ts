import { z } from "zod";

export const MAX_CENTS = 1_000_000_000_000;
export const cents = z.number().int().min(0).max(MAX_CENTS);
const positive = cents.refine((n) => n > 0);
const uuid = z.uuid();
const qty = z.number().int().min(1).max(1_000_000);
const text = (max: number) => z.string().trim().max(max);
const reason = text(400).min(3);
const date = z.iso.date().optional();
export const saleLines = z.array(z.object({ itemId: uuid, quantity: qty, priceCents: cents,
  zeroReason: text(300).min(3).optional() }).strict().refine((l) => l.priceCents > 0 || !!l.zeroReason,
  "Indica un motivo para precio cero.")).min(1).max(50)
  .refine((lines) => new Set(lines.map((l) => l.itemId)).size === lines.length, "Combina piezas repetidas.");
const target = z.object({ saleId: uuid, amountCents: positive }).strict();
const item = z.object({ id: uuid.optional(), name: text(160).min(2), sku: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{1,59}$/),
  description: text(1000).optional(), variant: text(120).optional(),
  image: z.string().max(600).refine((v) => {
    if (/^\/(?!\/)[^\\]*$/.test(v)) return true;
    try { const u = new URL(v); return u.protocol === "https:" && /\.supabase\.(co|in)$/.test(u.hostname) && !u.username && !u.password; } catch { return false; }
  }).optional(),
  unit: z.enum(["pieza", "paquete", "juego", "par", "kit"]), suggestedCents: cents,
  variantId: uuid.optional(), status: z.enum(["activa", "inactiva"]).optional() }).strict();
const operation = <T extends string, S extends z.ZodType>(action: T, payload: S) =>
  z.object({ action: z.literal(action), payload }).strict();
export const CommandSchema = z.discriminatedUnion("action", [
  operation("distributor_create", z.object({ name: text(120).min(2), slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/) }).strict()),
  operation("distributor_update", z.object({ name: text(120).min(2).optional(), active: z.boolean().optional() }).strict()),
  operation("membership", z.object({ userId: uuid, email: z.email().max(160), status: z.enum(["activa", "inactiva", "revocada"]) }).strict()),
  operation("item", item),
  operation("delivery", z.object({ kind: z.enum(["inicial", "reposicion"]), date, reference: text(120).optional(), notes: text(1000).optional(),
    lines: z.array(z.object({ itemId: uuid, quantity: qty, costCents: positive, suggestedCents: cents }).strict()).min(1).max(50) }).strict()),
  operation("preview", z.object({ lines: saleLines }).strict()),
  operation("sale", z.object({ lines: saleLines, fingerprint: z.string().regex(/^[a-f0-9]{64}$/), date, notes: text(1000).optional() }).strict()),
  operation("payment", z.object({ amountCents: positive, method: z.enum(["transferencia", "efectivo", "otro"]), date,
    reference: text(120).optional(), notes: text(1000).optional(), targets: z.array(target).max(50).optional() }).strict()),
  operation("apply_credit", z.object({ paymentId: uuid, targets: z.array(target).min(1).max(50) }).strict()),
  operation("void_payment", z.object({ paymentId: uuid, reason }).strict()),
  operation("return", z.object({ saleId: uuid, void: z.boolean(), reason, date,
    allocations: z.array(z.object({ allocationId: uuid, quantity: qty, restock: z.boolean(), disposal: text(300).min(3).optional() }).strict()
      .refine((a) => a.restock || !!a.disposal)).max(50).optional() }).strict()
    .refine((p) => p.void || !!p.allocations?.length)),
  operation("adjustment", z.object({ itemId: uuid, lotId: uuid.optional(), kind: z.enum(["alta", "merma", "retorno_matrixlab"]),
    quantity: qty, costCents: positive.optional(), reason, date }).strict()
    .refine((p) => p.kind === "alta" ? !!p.costCents && !p.lotId : !!p.lotId && p.costCents === undefined)),
  operation("reverse_delivery", z.object({ deliveryId: uuid, reason }).strict()),
]);
export const EnvelopeSchema = z.object({ distributorId: uuid, command: CommandSchema }).strict();
export type Command = z.infer<typeof CommandSchema>;
export interface Item { id: string; name: string; sku: string; variant_label: string | null; description: string | null;
  commercial_unit: string; image_url: string | null; scan_code: string; stock: number; suggested_price_cents: number; status: string }
export interface Lot { id: string; item_id: string; available_quantity: number; unit_cost_cents: number }
export interface Sale { id: string; folio: string; effective_date: string; debt_cents: number; debt_reverted_cents: number;
  net_debt_cents: number; public_total_cents: number; applied_cents: number; pending_cents: number; status: string }
export interface Payment { id: string; folio: string; effective_date: string; amount_cents: number;
  available_cents: number; applied_cents: number; reference: string | null; method: string; status: string; voided_at: string | null }
export interface Snapshot {
  distributor: { id: string; name: string; is_active: boolean }; items: Item[]; lots: Lot[]; sales: Sale[]; payments: Payment[];
  saleLines: { id: string; sale_id: string; item_name_snapshot: string; item_sku_snapshot: string; quantity: number;
    returned_quantity: number; suggested_price_snapshot_cents: number; unit_public_price_cents: number }[];
  allocations: { id: string; sale_id: string; sale_line_id: string; item_id: string; lot_id: string; quantity: number; returned_quantity: number; unit_cost_cents: number }[];
  applications: { id: string; payment_id: string; sale_id: string; amount_cents: number; status: string }[];
  deliveries: { id: string; folio: string; effective_date: string; status: string }[];
  returns: { id: string; folio: string; effective_date: string; debt_reverted_cents: number }[];
  adjustments: { id: string; folio: string; effective_date: string; kind: string; quantity: number; reason: string }[];
  memberships: { id: string; auth_user_id: string; email: string | null; status: string }[];
  totals?: { debt: number; pending: number; paid: number; credit: number; inventoryValue: number };
  pagination?: { page: number; size: number; sales: number; payments: number; deliveries: number; returns: number; adjustments: number };
}
export interface Quote { fingerprint: string; debtCents: number; publicCents: number;
  lines: { itemId: string; name: string; sku: string; quantity: number; priceCents: number; suggestedCents: number; debtCents: number }[] }
export function money(value: number | string): number {
  const n = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  if (typeof n !== "number" || !Number.isSafeInteger(n) || n < 0 || n > MAX_CENTS) throw new Error("INVALID_MONEY");
  return n;
}
export function parsePesos(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("Usa un monto positivo con máximo dos decimales.");
  const [whole, fraction = ""] = value.split(".");
  return money(Number(whole) * 100 + Number(fraction.padEnd(2, "0")));
}
export const formatMoney = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value / 100);
export function inventoryValue(lots: readonly Lot[]): number {
  return lots.reduce((total, lot) => {
    if (!Number.isSafeInteger(lot.available_quantity) || lot.available_quantity < 0) throw new Error("INVALID_STOCK_VALUE");
    const value = total + lot.available_quantity * money(lot.unit_cost_cents);
    if (!Number.isSafeInteger(value)) throw new Error("INVALID_STOCK_VALUE");
    return value;
  }, 0);
}
export function account(s: Snapshot) {
  const stockValue = inventoryValue(s.lots);
  if (s.totals) return { ...s.totals, inventoryValue: stockValue };
  return { debt: s.sales.reduce((n, v) => n + money(v.net_debt_cents), 0),
    pending: s.sales.reduce((n, v) => n + money(v.pending_cents), 0),
    paid: s.payments.filter((p) => p.status === "activo").reduce((n, p) => n + money(p.amount_cents), 0),
    credit: s.payments.reduce((n, p) => n + money(p.available_cents), 0), inventoryValue: stockValue };
}
const safeCsv = (s: unknown) => {
  const value = String(s ?? "");
  return `"${(/^[\s]*[=+\-@\t\r]/.test(value) ? "'" : "") + value.replace(/"/g, '""')}"`;
};
export function statementCsv(s: Snapshot, from = "0000-01-01", to = "9999-12-31") {
  const events = [
    ...s.sales.map((v) => ({ date: v.effective_date, folio: v.folio, type: "Venta", debt: v.debt_cents, paid: 0 })),
    ...s.returns.map((v) => ({ date: v.effective_date, folio: v.folio, type: "Devolución", debt: -v.debt_reverted_cents, paid: 0 })),
    ...s.payments.flatMap((p) => [{ date: p.effective_date, folio: p.folio, type: "Pago a MatrixLab", debt: 0, paid: p.amount_cents },
      ...(p.voided_at ? [{ date: new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Mexico_City" }).format(new Date(p.voided_at)),
        folio: p.folio, type: "Anulación de pago", debt: 0, paid: -p.amount_cents }] : [])]),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.folio.localeCompare(b.folio));
  let balance = events.filter((e) => e.date < from).reduce((n, e) => n + e.debt - e.paid, 0);
  const rows: unknown[][] = [["Fecha", "Folio", "Concepto", "Deuda MXN", "Pago a MatrixLab MXN", "Saldo neto MXN"],
    [from, "", "Saldo inicial (negativo = saldo a favor)", "", "", (balance / 100).toFixed(2)]];
  for (const e of events.filter((e) => e.date >= from && e.date <= to)) {
    balance += e.debt - e.paid;
    rows.push([e.date, e.folio, e.type, (e.debt / 100).toFixed(2), (e.paid / 100).toFixed(2), (balance / 100).toFixed(2)]);
  }
  rows.push([to, "", "Saldo final (negativo = saldo a favor)", "", "", (balance / 100).toFixed(2)]);
  rows.push([], ["Detalle ventas", "SKU", "Cantidad", "Costo pactado por lote MXN", "Sugerido unitario MXN", "Venta real unitaria MXN", "Pendiente de venta MXN"]);
  for (const sale of s.sales.filter((sale) => sale.effective_date >= from && sale.effective_date <= to)) {
    for (const line of s.saleLines.filter((line) => line.sale_id === sale.id)) {
      const costs = s.allocations.filter((a) => a.sale_line_id === line.id).map((a) => `${a.quantity} x ${(a.unit_cost_cents / 100).toFixed(2)}`).join("; ");
      rows.push([sale.folio, line.item_sku_snapshot, line.quantity, costs,
        (line.suggested_price_snapshot_cents / 100).toFixed(2), (line.unit_public_price_cents / 100).toFixed(2), (sale.pending_cents / 100).toFixed(2)]);
    }
  }
  // Las cifras globales no cambian por filtrar el historial.
  const totals = account(s);
  rows.push(["Cuenta global", "Valor del stock a costo", (totals.inventoryValue / 100).toFixed(2), "Deuda por ventas", (totals.debt / 100).toFixed(2),
    "Pagos a MatrixLab", (totals.paid / 100).toFixed(2), "Pendiente", (totals.pending / 100).toFixed(2), "Saldo a favor del distribuidor", (totals.credit / 100).toFixed(2)]);
  return "\uFEFF" + rows.map((r) => r.map(safeCsv).join(",")).join("\r\n");
}
