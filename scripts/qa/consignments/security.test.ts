import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { withHarness } from "./harness";
import { signToken } from "../../../src/lib/consignments/tokens";
async function main() {
  await withHarness(async (h) => {
    const get = (path: string, cookie = h.cookie) => fetch(h.url + path, { headers: { Cookie: `ml_distributor=${cookie}` }, redirect: "manual" });
    const post = (body: unknown, csrf: string | null = h.csrf) => fetch(h.url + "/api/distributor", { method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `ml_distributor=${h.cookie}`, "Idempotency-Key": randomUUID(), ...(csrf ? { "x-ml-csrf": csrf } : {}) }, body: JSON.stringify(body) });
    assert.equal((await fetch(h.url + "/api/distributor")).status, 401);
    assert.equal((await get("/api/distributor", h.cookie + "x")).status, 401);
    assert.equal((await get("/api/distributor", signToken("different-".repeat(5)).token)).status, 401);
    let r = await get("/api/distributor"); assert.equal(r.status, 200); assert.match(r.headers.get("cache-control") ?? "", /no-store/);
    const snapshot = (await r.json()).snapshot;
    assert.equal(snapshot.items.length, 1); assert.equal(snapshot.items[0].id, h.item); assert.equal(snapshot.memberships.length, 0);
    r = await get(`/api/distributor?id=${h.other}`); assert.equal((await r.json()).snapshot.distributor.id, h.dist);
    assert.equal((await get("/api/admin/distributors")).status, 401);
    assert.equal((await get(`/api/admin/distributors/access?id=${h.dist}`)).status, 401);
    const intruderAccess = await fetch(h.url + "/api/admin/distributors/access", { method: "POST", headers: {
      Cookie: `ml_distributor=${h.cookie}`, "Content-Type": "application/json", "x-ml-csrf": h.csrf, "Idempotency-Key": randomUUID(),
    }, body: JSON.stringify({ action: "create", distributorId: h.dist, username: "intruso", password: "Fixture-intruso-1234" }) });
    assert.equal(intruderAccess.status, 401);
    assert.equal((await post({ action: "payment", payload: { amountCents: 10000, method: "otro" } })).status, 403);
    assert.equal((await post({ action: "item", payload: { name: "Intruso", sku: "XX-01", unit: "pieza", suggestedCents: 10000 } })).status, 403);
    const adminOnly = [
      { action: "delivery", payload: { kind: "reposicion", lines: [{ itemId: h.item, quantity: 100, costCents: 1, suggestedCents: 1 }] } },
      { action: "adjustment", payload: { itemId: h.item, kind: "alta", quantity: 100, costCents: 1, reason: "Inventario manipulado" } },
      { action: "reverse_delivery", payload: { deliveryId: snapshot.deliveries[0].id, reason: "Inventario manipulado" } },
      { action: "return", payload: { saleId: randomUUID(), void: true, reason: "Inventario manipulado" } },
      { action: "apply_credit", payload: { paymentId: randomUUID(), targets: [{ saleId: randomUUID(), amountCents: 1 }] } },
      { action: "void_payment", payload: { paymentId: randomUUID(), reason: "Pago manipulado" } },
      { action: "membership", payload: { userId: randomUUID(), email: "intruso@example.test", status: "activa" } },
      { action: "distributor_update", payload: { active: false } },
      { action: "distributor_create", payload: { name: "Intruso", slug: "intruso" } },
    ];
    for (const command of adminOnly) assert.equal((await post(command)).status, 403, command.action);
    assert.deepEqual((await (await get("/api/distributor")).json()).snapshot, snapshot);
    console.log("Origami restrictivo: todas las operaciones administrativas rechazadas, sin cambios de stock o dinero");
    const lines = [{ itemId: h.item, quantity: 1, priceCents: 18000 }];
    assert.equal((await post({ action: "preview", payload: { lines } }, null)).status, 401);
    assert.equal((await post({ action: "preview", payload: { lines: [{ ...lines[0], costCents: 1 }] } })).status, 400);
    assert.equal((await post({ action: "preview", payload: { lines: [{ ...lines[0], itemId: h.otherItem }] } })).status, 404);
    const quoteResponse = await post({ action: "preview", payload: { lines } }); assert.equal(quoteResponse.status, 200);
    const quote = (await quoteResponse.json()).quote;
    const saleBody = { action: "sale", payload: { lines, fingerprint: quote.fingerprint } }, saleKey = randomUUID();
    const durableSale = () => fetch(h.url + "/api/distributor", { method: "POST", headers: { Cookie: `ml_distributor=${h.cookie}`,
      "Content-Type": "application/json", "x-ml-csrf": h.csrf, "Idempotency-Key": saleKey }, body: JSON.stringify(saleBody) });
    const first = await durableSale(); assert.equal(first.status, 200); const firstResult = await first.json();
    await h.restart();
    const replay = await durableSale(); assert.equal(replay.status, 200); assert.deepEqual(await replay.json(), firstResult);
    assert.equal((await h.db.query("select count(*)::int n from consignment_sales where distributor_id=$1", [h.dist])).rows[0].n, 1);
    console.log("T07: idempotencia permanece tras reiniciar el servidor Next");
    assert.equal((await get("/api/distributor?scan=NO-EXISTE")).status, 404);
    const foreignCode = (await h.db.query("select scan_code from consignment_items where id=$1", [h.otherItem])).rows[0].scan_code;
    assert.equal((await get("/api/distributor?scan=" + foreignCode)).status, 404);
    assert.equal((await get("/api/distributor?export=csv&from=2026-10-10&to=2026-10-01")).status, 400);
    const csv = await (await get(`/api/distributor?export=csv&id=${h.other}`)).text(); assert.doesNotMatch(csv, /Pieza privada B/);
    assert.equal((await get("/api/distributor?page=-1")).status, 400);
    const firstPage = (await (await get("/api/distributor?page=0")).json()).snapshot;
    const emptyPage = (await (await get("/api/distributor?page=1")).json()).snapshot;
    assert.equal(emptyPage.sales.length, 0); assert.deepEqual(emptyPage.totals, firstPage.totals);
    console.log("T16/T18/T24/T29: aislamiento HTTP, CSRF, cookies, roles y CSV");
    const login = await fetch(h.url + "/api/distributor/auth", { method: "POST", headers: { "Content-Type": "application/json", Origin: h.url }, body: JSON.stringify({ action: "login", username: "origami", password: "Fixture-password-1234" }) });
    assert.equal(login.status, 200, `${await login.text()}\n${h.trace.slice(-12).join("\n")}`); assert.match(login.headers.get("set-cookie") ?? "", /HttpOnly/);
    assert.match(login.headers.get("set-cookie") ?? "", /Secure/);
    assert.match(login.headers.get("set-cookie") ?? "", /SameSite=lax/i);
    const newCookie = (login.headers.get("set-cookie") ?? "").split(";")[0].split("=").slice(1).join("=");
    assert.equal((await get("/api/distributor", newCookie)).status, 200);
    const publicHome = await (await fetch(h.url + "/")).text();
    assert.doesNotMatch(publicHome, /href=["']\/distribuidores/);
    const privateLoginPage = await (await fetch(h.url + "/distribuidores/login")).text();
    assert.match(privateLoginPage, /noindex/);
    const logoutLogin = await fetch(h.url + "/api/distributor/auth", { method: "POST", headers: { "Content-Type": "application/json", Origin: h.url }, body: JSON.stringify({ action: "login", username: "origami", password: "Fixture-password-1234" }) });
    assert.equal(logoutLogin.status, 200);
    const logoutCookie = logoutLogin.headers.get("set-cookie")!.split(";")[0];
    const logoutToken = logoutCookie.split("=").slice(1).join("=");
    const logoutCsrf = JSON.parse(Buffer.from(logoutToken.split(".")[0], "base64url").toString()).csrf;
    const logout = (origin: string, csrf: string) => fetch(h.url + "/api/distributor/auth", { method: "POST", headers: {
      Origin: origin, Cookie: logoutCookie, "Content-Type": "application/json", "x-ml-csrf": csrf,
    }, body: JSON.stringify({ action: "logout" }) });
    assert.equal((await logout(h.url, "wrong")).status, 401);
    assert.equal((await logout("https://foreign.example.test", logoutCsrf)).status, 403);
    assert.equal((await logout(h.url, logoutCsrf)).status, 200);
    assert.equal((await get("/api/distributor", logoutToken)).status, 401);
    const camera = await get("/distribuidores/escanear"), account = await get("/distribuidores");
    assert.match(camera.headers.get("permissions-policy") ?? "", /camera=\(self\)/);
    assert.match(account.headers.get("permissions-policy") ?? "", /camera=\(\)/);
    assert.match(camera.headers.get("content-security-policy") ?? "", /nonce-/);
    console.log("T20: cabeceras reales de cámara/CSP");
    await h.db.query("update distributor_memberships set status='inactiva' where id=$1", [h.membership]);
    assert.equal((await get("/api/distributor")).status, 401);
    assert.equal((await get("/api/distributor", newCookie)).status, 401);
    console.log("T18: revocación de membresía bloquea la siguiente petición");
    const attempt = () => fetch(h.url + "/api/distributor/auth", { method: "POST", headers: { "Content-Type": "application/json", Origin: h.url },
      body: JSON.stringify({ action: "login", username: "origami", password: "incorrecta" }) });
    for (let n = 0; n < 9; n++) assert.equal((await attempt()).status, 401);
    assert.equal((await attempt()).status, 429);
    await h.restart(); assert.equal((await attempt()).status, 429);
    console.log("T18: bloqueo de intentos persistente tras reiniciar Next");
  });
  await withHarness(async (h) => {
    assert.equal((await fetch(h.url + "/api/distributor")).status, 404);
    assert.equal((await fetch(h.url + "/api/admin/distributors")).status, 404);
    assert.equal((await fetch(h.url + "/distribuidores/login")).status, 404);
    console.log("T24: flag apagado bloquea páginas y APIs");
  }, false);
}
main().catch((e) => { console.error(e); process.exit(1); });
