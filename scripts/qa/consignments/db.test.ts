import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { Pool } from "pg";
import { withDatabase } from "./database";
import { account } from "../../../src/lib/consignments/domain";

async function main() {
  await withDatabase(async (db) => {
    const dist = randomUUID(), other = randomUUID();
    const cmd = async (action: string, payload: unknown, key = randomUUID(), d = dist, actorType = "matrixlab_admin", member: string | null = null, actor = "test-admin") =>
      (await db.query("select public.consignment_command($1,$2,$3,$4,$5,$6,$7) result", [d, actor, actorType, member, key, action, payload])).rows[0].result;
    const snap = async (d = dist) => (await db.query("select public.consignment_snapshot($1,true) s", [d])).rows[0].s;
    const quote = async (lines: unknown, d = dist) => (await db.query("select public.consignment_preview($1,$2) q", [d, JSON.stringify(lines)])).rows[0].q;
    const sale = async (itemId: string, quantity: number, priceCents = 17000, key = randomUUID()) => {
      const lines = [{ itemId, quantity, priceCents }]; const preview = await quote(lines);
      return cmd("sale", { lines, fingerprint: preview.fingerprint }, key);
    };
    await cmd("distributor_create", { name: "Origami TEST", slug: "origami-test" });
    await cmd("distributor_create", { name: "Distribuidor B TEST", slug: "b-test" }, randomUUID(), other);
    const product = randomUUID(), publicVariant = randomUUID();
    await db.query("insert into products(id,title,handle,base_price,status) values($1,'Catálogo público TEST','catalogo-publico-test',180,'disponible')", [product]);
    await db.query("insert into product_variants(id,product_id,title,sku,stock) values($1,$2,'Pieza de tienda','PUBLIC-01',99)", [publicVariant, product]);
    assert.equal((await snap()).items.length, 0); console.log("T27: inventario inicia vacío");
    const item = (await cmd("item", { name: "Pieza privada", sku: "DEMO-ORI-01", unit: "pieza", suggestedCents: 18000 })).id;
    assert.equal((await db.query("select public.consignment_snapshot($1,false) s", [dist])).rows[0].s.items.length, 0);
    const delivery = await cmd("delivery", { kind: "inicial", lines: [{ itemId: item, quantity: 10, costCents: 10000, suggestedCents: 18000 }] });
    assert.equal((await snap()).items[0].stock, 10); assert.equal((await snap()).sales.length, 0);
    assert.equal(account(await snap()).inventoryValue, 100000);
    assert.equal(account(await snap()).pending, 0);
    const key = randomUUID(); const lines = [{ itemId: item, quantity: 3, priceCents: 17000 }]; const p = await quote(lines);
    const payload = { lines, fingerprint: p.fingerprint };
    const results = await Promise.all([cmd("sale", payload, key), cmd("sale", payload, key)]);
    assert.equal(results[0].id, results[1].id); const sold = results[0];
    let s = await snap(); assert.equal(s.items[0].stock, 7); assert.equal(s.sales[0].pending_cents, 30000); assert.equal(s.sales[0].public_total_cents, 51000);
    assert.equal(account(s).inventoryValue, 70000);
    await assert.rejects(cmd("sale", { ...payload, notes: "otro" }, key), /CONS_IDEMPOTENCY/);
    console.log("T01/T02/T07/T28: entrega y venta privada; idempotencia concurrente");
    await cmd("payment", { amountCents: 15000, method: "efectivo" });
    assert.equal((await snap()).sales[0].pending_cents, 15000);
    const payment = await cmd("payment", { amountCents: 15000, method: "transferencia" });
    assert.equal((await snap()).sales[0].pending_cents, 0);
    assert.equal(account(await snap()).inventoryValue, 70000);
    s = await snap(); const alloc = s.allocations[0];
    await cmd("return", { saleId: sold.id, void: false, reason: "Devolución prueba", allocations: [{ allocationId: alloc.id, quantity: 1, restock: true }] });
    s = await snap(); assert.equal(s.items[0].stock, 8); assert.equal(s.sales[0].net_debt_cents, 20000);
    assert.equal(account(s).inventoryValue, 80000);
    assert.equal(s.payments.reduce((n: number, v: { available_cents: number }) => n + v.available_cents, 0), 10000);
    const later = await sale(item, 1);
    await cmd("apply_credit", { paymentId: payment.id, targets: [{ saleId: later.id, amountCents: 10000 }] });
    s = await snap(); assert.equal(s.payments.reduce((n: number, v: { available_cents: number }) => n + v.available_cents, 0), 0);
    assert.equal(s.sales.reduce((n: number, v: { pending_cents: number }) => n + v.pending_cents, 0), 0);
    console.log("T09/T10/T13: ejemplo monetario completo y devolución pagada");
    await cmd("void_payment", { paymentId: payment.id, reason: "Pago capturado por error" });
    await assert.rejects(cmd("void_payment", { paymentId: payment.id, reason: "Otra anulación" }), /CONS_STATE/);
    assert.equal((await snap()).items[0].stock, 7);
    const fifo = (await cmd("item", { name: "FIFO", sku: "DEMO-FIFO", unit: "pieza", suggestedCents: 20000 })).id;
    await cmd("delivery", { kind: "reposicion", lines: [{ itemId: fifo, quantity: 2, costCents: 10000, suggestedCents: 20000 }, { itemId: fifo, quantity: 3, costCents: 12000, suggestedCents: 20000 }] });
    const f = await sale(fifo, 3); s = await snap(); assert.equal(s.sales.find((v: { id: string }) => v.id === f.id).debt_cents, 32000);
    assert.equal(account(s).inventoryValue, 94000);
    console.log("T03/T12: FIFO exacto y anulación de pago");
    await assert.rejects(cmd("reverse_delivery", { deliveryId: delivery.id, reason: "Corrección" }), /CONS_STATE/);
    await assert.rejects(cmd("sale", payload, randomUUID(), other), /CONS_NOT_FOUND/);
    await assert.rejects(cmd("payment", { amountCents: 10000, method: "otro" }, randomUUID(), dist, "distribuidor", null, randomUUID()), /CONS_FORBIDDEN/);
    const before = await snap();
    await assert.rejects(cmd("delivery", { kind: "reposicion", lines: [{ itemId: item, quantity: 2, costCents: 10000, suggestedCents: 18000 }, { itemId: randomUUID(), quantity: 1, costCents: 10000, suggestedCents: 18000 }] }), /CONS_NOT_FOUND/);
    assert.deepEqual(await snap(), before); console.log("T08/T14/T16: rollback real y aislamiento");
    const one = (await cmd("item", { name: "Última", sku: "DEMO-LAST", unit: "pieza", suggestedCents: 20000 })).id;
    await cmd("delivery", { kind: "reposicion", lines: [{ itemId: one, quantity: 1, costCents: 10000, suggestedCents: 20000 }] });
    const lastLines = [{ itemId: one, quantity: 1, priceCents: 20000 }]; const lp = await quote(lastLines);
    const racing = await Promise.allSettled([cmd("sale", { lines: lastLines, fingerprint: lp.fingerprint }), cmd("sale", { lines: lastLines, fingerprint: lp.fingerprint })]);
    assert.equal(racing.filter((v) => v.status === "fulfilled").length, 1); console.log("T06: última pieza, dos conexiones, una venta");
    const lastSale = racing.find((v) => v.status === "fulfilled");
    if (!lastSale || lastSale.status !== "fulfilled") throw new Error("No sale");
    s = await snap(); const lastAllocation = s.allocations.find((v: { sale_id: string }) => v.sale_id === lastSale.value.id);
    const returnPayload = { saleId: lastSale.value.id, void: false, reason: "Devolución concurrente", allocations: [{ allocationId: lastAllocation.id, quantity: 1, restock: true }] };
    const returns = await Promise.allSettled([cmd("return", returnPayload), cmd("return", returnPayload)]);
    assert.equal(returns.filter((v) => v.status === "fulfilled").length, 1);
    console.log("T15: dos devoluciones simultáneas no exceden lo vendido");
    const creditPayment = await cmd("payment", { amountCents: 20000, method: "otro", targets: [] });
    const creditPayload = { paymentId: creditPayment.id, targets: [{ saleId: f.id, amountCents: 15000 }] };
    const applications = await Promise.allSettled([cmd("apply_credit", creditPayload), cmd("apply_credit", creditPayload)]);
    assert.equal(applications.filter((v) => v.status === "fulfilled").length, 1);
    assert.equal((await snap()).payments.find((p: { id: string }) => p.id === creditPayment.id).available_cents, 5000);
    console.log("T11: el mismo crédito no se utiliza dos veces");
    const multiBefore = await snap();
    const insufficient = [{ itemId: item, quantity: 1, priceCents: 18000 }, { itemId: fifo, quantity: 999, priceCents: 18000 }];
    await assert.rejects(cmd("sale", { lines: insufficient, fingerprint: "0".repeat(64) }), /CONS_STOCK/);
    assert.deepEqual(await snap(), multiBefore);
    await assert.rejects(cmd("sale", { lines: [{ itemId: item, quantity: 1, priceCents: 18000 }], fingerprint: "0".repeat(64) }), /CONS_PREVIEW_CHANGED/);
    console.log("T05/T21: venta multilínea insuficiente y preview viejo no escriben nada");
    const untouchedItem = (await cmd("item", { name: "Entrega reversible", sku: "DEMO-REV", unit: "pieza", suggestedCents: 10000 })).id;
    const reversible = await cmd("delivery", { kind: "inicial", lines: [{ itemId: untouchedItem, quantity: 2, costCents: 5000, suggestedCents: 10000 }] });
    await cmd("reverse_delivery", { deliveryId: reversible.id, reason: "Entrega equivocada" });
    assert.equal((await snap()).items.find((i: { id: string }) => i.id === untouchedItem).stock, 0);
    const availableLot = (await snap()).lots.find((l: { item_id: string; available_quantity: number }) => l.item_id === fifo && l.available_quantity > 0);
    await cmd("adjustment", { kind: "merma", itemId: fifo, lotId: availableLot.id, quantity: 1, reason: "Pieza dañada" });
    await assert.rejects(cmd("adjustment", { kind: "retorno_matrixlab", itemId: fifo, lotId: availableLot.id, quantity: 99, reason: "Retorno" }), /CONS_STOCK/);
    await cmd("return", { saleId: f.id, void: true, reason: "Anular prueba FIFO" });
    assert.equal((await snap()).sales.find((v: { id: string }) => v.id === f.id).net_debt_cents, 0);
    const uid = randomUUID();
    const membership = await cmd("membership", { userId: uid, email: "test@example.test", status: "activa" });
    await db.query("insert into consignment_sessions(token_hash,membership_id,distributor_id,auth_user_id,expires_at) values($1,$2,$3,$4,now()+interval '1 hour')", [randomUUID(), membership.id, dist, uid]);
    await cmd("membership", { userId: uid, email: "test@example.test", status: "revocada" });
    assert.equal((await db.query("select count(*)::int n from consignment_sessions where membership_id=$1 and revoked_at is null", [membership.id])).rows[0].n, 0);
    await assert.rejects(db.query("update consignment_lots set unit_cost_cents=1 where id=$1", [availableLot.id]), /CONS_IMMUTABLE/);
    console.log("T12/T13/T14/T18: reversión, merma, anulación, revocación y costo inmutable");
    const multiLines = [{ itemId: item, quantity: 1, priceCents: 17000 }, { itemId: fifo, quantity: 1, priceCents: 18000 }];
    const multiQuote = await quote(multiLines);
    const multiSale = await cmd("sale", { lines: multiLines, fingerprint: multiQuote.fingerprint });
    const secondSale = await sale(item, 1);
    await cmd("payment", { amountCents: 20000, method: "transferencia", targets: [
      { saleId: multiSale.id, amountCents: 10000 }, { saleId: secondSale.id, amountCents: 10000 }] });
    assert.equal((await snap()).sales.find((v: { id: string }) => v.id === secondSale.id).pending_cents, 0);
    const historyBefore = (await snap()).saleLines;
    await cmd("item", { id: item, name: "Nombre nuevo", sku: "DEMO-ORI-NEW", unit: "pieza", suggestedCents: 99000 });
    assert.deepEqual((await snap()).saleLines, historyBefore);
    for (const [action, data] of [["void_payment", { paymentId: payment.id, reason: "Ajeno" }],
      ["return", { saleId: sold.id, void: true, reason: "Ajeno" }],
      ["reverse_delivery", { deliveryId: delivery.id, reason: "Ajeno" }]]) {
      await assert.rejects(cmd(action as string, data, randomUUID(), other), /CONS_NOT_FOUND/);
    }
    const ownerLot = (await snap()).lots.find((l: { item_id: string; available_quantity: number }) => l.item_id === item && l.available_quantity > 0);
    const debtBefore = (await snap()).sales.reduce((n: number, v: { net_debt_cents: number }) => n + v.net_debt_cents, 0);
    await cmd("adjustment", { kind: "retorno_matrixlab", itemId: item, lotId: ownerLot.id, quantity: 1, reason: "Retorno no vendido" });
    assert.equal((await snap()).sales.reduce((n: number, v: { net_debt_cents: number }) => n + v.net_debt_cents, 0), debtBefore);
    console.log("T02/T09/T14/T16/T23: multilínea, pago a dos ventas, retorno, IDs ajenos y snapshots inmutables");
    assert.equal((await db.query("select * from public.consignment_reconciliation where available_quantity<>ledger_quantity")).rowCount, 0);
    assert.equal((await db.query("select stock from product_variants where id=$1", [publicVariant])).rows[0].stock, 99);
    assert.equal((await snap()).items.some((i: { product_variant_id?: string }) => i.product_variant_id === publicVariant), false);
    await security(db);
    const checks = await db.query(await readFile("supabase/consignment_reconciliation.sql", "utf8")) as unknown as { rows: { can_select?: boolean }[] }[];
    assert.equal(checks.length, 7);
    checks.slice(0, 6).forEach((check) => assert.equal(check.rows.length, 0));
    assert.equal(checks[6].rows.some((row) => row.can_select), false);
    console.log("Reconciliación: seis consultas sin divergencias y privilegios privados revocados.");
  });
}
async function security(db: Pool) {
  for (const role of ["anon", "authenticated"]) {
    const conn = await db.connect();
    try {
      await conn.query(`set role ${role}`);
      await assert.rejects(conn.query("select * from public.consignment_items"), /permission denied/);
      await assert.rejects(conn.query("select public.consignment_snapshot($1,false)", [randomUUID()]), /permission denied/);
    } finally { await conn.query("reset role"); conn.release(); }
  }
  console.log("T17: roles públicos sin acceso directo a tablas/RPC");
}
main().catch((e) => { console.error(e); process.exit(1); });
