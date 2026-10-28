import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { CommandSchema, EnvelopeSchema, account, inventoryValue, money, parsePesos, statementCsv, type Snapshot } from "../../../src/lib/consignments/domain";
import { signToken, verifyToken } from "../../../src/lib/consignments/tokens";
import QRCode from "qrcode";
import jsQR from "jsqr";

async function main() {
  assert.equal(parsePesos("100.01"), 10001); assert.equal(parsePesos("0.1"), 10);
  for (const invalid of ["1.001", "-1", "1e4", "NaN", "10000000000000000"]) assert.throws(() => parsePesos(invalid));
  for (const v of [NaN, Infinity, 0.1, Number.MAX_SAFE_INTEGER + 1, -1]) assert.throws(() => money(v));
  const line = { itemId: randomUUID(), quantity: 1, priceCents: 1000 };
  for (const quantity of [0, -1, 1.1, 1000001, "1", null]) assert.equal(CommandSchema.safeParse({ action: "preview", payload: { lines: [{ ...line, quantity }] } }).success, false);
  assert.equal(CommandSchema.safeParse({ action: "preview", payload: { lines: [{ ...line, costCents: 1 }] } }).success, false);
  assert.equal(CommandSchema.safeParse({ action: "preview", payload: { lines: [line, line] } }).success, false);
  assert.equal(CommandSchema.safeParse({ action: "preview", payload: { lines: [{ ...line, priceCents: 0 }] } }).success, false);
  assert.equal(CommandSchema.safeParse({ action: "preview", payload: { lines: [{ ...line, priceCents: 0, zeroReason: "Regalo" }] } }).success, true);
  assert.equal(EnvelopeSchema.safeParse({ distributorId: randomUUID(), actor: "admin", command: { action: "preview", payload: { lines: [line] } } }).success, false);
  const secret = "test-secret-" + "x".repeat(32), signed = signToken(secret);
  assert.deepEqual(verifyToken(signed.token, secret), signed.payload);
  assert.equal(verifyToken(signed.token + "x", secret), null); assert.equal(verifyToken(signed.token, "other".repeat(10)), null);
  assert.equal(verifyToken(signed.token + ".extra", secret), null);
  console.log("T04/T18: dinero entero, límites, entradas estrictas y firma de sesión");
  const base = { distributor: { id: randomUUID(), name: "Test", is_active: true }, items: [], lots: [], saleLines: [], allocations: [], applications: [], deliveries: [], adjustments: [], memberships: [],
    sales: [{ id: "s", folio: "=FORMULA()", effective_date: "2026-10-01", debt_cents: 30000, debt_reverted_cents: 10000, net_debt_cents: 20000, pending_cents: 0, public_total_cents: 51000, applied_cents: 20000, status: "confirmada" }],
    payments: [{ id: "p", folio: "PAY", effective_date: "2026-10-02", amount_cents: 30000, available_cents: 10000, applied_cents: 20000, reference: "test", method: "otro", status: "activo", voided_at: null }],
    returns: [{ id: "r", folio: "RETURN", effective_date: "2026-10-03", debt_reverted_cents: 10000 }] } as Snapshot;
  const csv = statementCsv(base, "2026-10-02", "2026-10-03");
  assert.match(csv, /300\.00/); assert.match(csv, /-100\.00/);
  assert.match(statementCsv(base), /'=FORMULA/);
  const valued = { ...base, lots: [
    { id: "lot-a", item_id: "item", available_quantity: 2, unit_cost_cents: 10001 },
    { id: "lot-b", item_id: "item", available_quantity: 3, unit_cost_cents: 12050 },
    { id: "consumed", item_id: "item", available_quantity: 0, unit_cost_cents: 99999 },
  ] };
  assert.equal(account(valued).inventoryValue, 56152);
  assert.equal(account(valued).credit, 10000);
  assert.equal(account({ ...valued, payments: [] }).inventoryValue, 56152);
  assert.equal(account({ ...valued, totals: { ...account(valued), inventoryValue: 0 } }).inventoryValue, 56152);
  assert.equal(inventoryValue([]), 0);
  assert.throws(() => inventoryValue([{ id: "bad", item_id: "item", available_quantity: -1, unit_cost_cents: 100 }]), /INVALID_STOCK_VALUE/);
  assert.throws(() => inventoryValue([{ id: "large", item_id: "item", available_quantity: 1000000, unit_cost_cents: 1000000000000 }]), /INVALID_STOCK_VALUE/);
  assert.match(statementCsv(valued), /"Valor del stock a costo","561\.52"/);
  assert.match(statementCsv(valued), /Pago a MatrixLab/);
  console.log("Valor del stock: costo por lote, centavos exactos, independiente de pagos y saldos a favor");
  console.log("T23: saldo inicial/final y neutralización CSV");
  const code = "MLC" + randomUUID().replaceAll("-", "");
  const matrix = QRCode.create(code).modules; const scale = 8, margin = 4, size = (matrix.size + margin * 2) * scale;
  const pixels = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const mx = Math.floor(x / scale) - margin, my = Math.floor(y / scale) - margin;
    const dark = mx >= 0 && my >= 0 && mx < matrix.size && my < matrix.size && matrix.get(my, mx);
    const offset = (y * size + x) * 4; pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = dark ? 0 : 255; pixels[offset + 3] = 255;
  }
  assert.equal(jsQR(pixels, size, size)?.data, code); console.log("T19: QR real generado y leído por decoder");
}
main().catch((e) => { console.error(e); process.exit(1); });
