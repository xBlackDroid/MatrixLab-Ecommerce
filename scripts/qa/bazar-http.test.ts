import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import type { Command } from "../../src/lib/bazar/domain";

async function main() {
  loadEnvConfig(process.cwd());
  // Only the local QA process uses this signing secret; never accepted by production.
  process.env.ADMIN_SESSION_SECRET = "bazar-local-qa-only-20261031-distinct-from-production";
  const { createAdminSessionToken, hashAdminSid } = await import("../../src/lib/security/session");
  const { requireServiceClient } = await import("../../src/lib/db/admin");
  const db = requireServiceClient(), session = createAdminSessionToken()!;
  const date = "2099-10-30", base = "http://127.0.0.1:3012";
  const existing = await db.from("bazar_days").select("date").eq("date", date).maybeSingle();
  assert.equal(existing.error, null); assert.equal(existing.data, null, "QA date must be empty");
  const { error } = await db.from("admin_sessions").insert({ token_hash: hashAdminSid(session.payload.sid), expires_at: new Date(session.payload.exp * 1000).toISOString() });
  assert.equal(error, null);
  const headers = { Cookie: `ml_admin=${session.token}`, "Content-Type": "application/json", "x-ml-csrf": session.payload.csrf };
  const send = async (command: Command, requestId = randomUUID()) => {
    const r = await fetch(`${base}/api/admin/bazar`, { method: "POST", headers, body: JSON.stringify({ date, requestId, command }) });
    return { status: r.status, body: await r.json() };
  };
  try {
    assert.equal((await fetch(`${base}/api/admin/bazar?date=${date}`)).status, 401);
    assert.equal((await fetch(`${base}/api/admin/bazar`, { method: "POST", headers: { Cookie: headers.Cookie }, body: "{}" })).status, 401);
    const item = randomUUID();
    assert.equal((await send({ kind: "item", name: "QA bazar HTTP", sku: "QA-ONLY", quantity: 2, priceCents: 27900 }, item)).status, 200);
    const command: Command = { kind: "sale", method: "transferencia", notes: "QA only", lines: [{ itemId: item, quantity: 1, priceCents: 25000 }] };
    const saleId = randomUUID();
    const repeated = await Promise.all([send(command, saleId), send(command, saleId)]);
    assert.deepEqual(repeated.map(r => r.status), [200, 200]);
    assert.equal(repeated[1].body.state.sales.length, 1);
    assert.equal(repeated[1].body.state.items[0].stock, 1);
    const racing = await Promise.all([send(command), send(command)]);
    assert.deepEqual(racing.map(r => r.status).sort(), [200, 409]);
    const result = await send({ kind: "void", saleId, reason: "QA cancellation" });
    assert.equal(result.status, 200); assert.equal(result.body.state.items[0].stock, 1);
    console.log("PASS HTTP/DB: admin guard, CSRF rejection, persistent inventory, concurrent idempotency, last-piece race and cancellation.");
  } finally {
    await db.from("admin_sessions").delete().eq("token_hash", hashAdminSid(session.payload.sid));
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
