import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { withHarness } from "./harness";
import { checkTarget, provisionDistributor } from "../../consignments/provision-origami";
import { accessFingerprint, hashPassword, verifyPassword } from "../../../src/lib/consignments/passwords";
async function main() {
  const project = "abcdefghijklmnopqrst", secret = randomBytes(40).toString("hex"), password = randomBytes(18).toString("base64url");
  checkTarget(project, "https://staging.example.test", `https://${project}.supabase.co`);
  assert.throws(() => checkTarget(project, "http://localhost:3000", `https://${project}.supabase.co`), /HTTPS_STAGING/);
  assert.throws(() => checkTarget(project, "https://staging.example.test", "https://otroproyecto.supabase.co"), /PROJECT_MISMATCH/);
  const hash = await hashPassword(password);
  assert.ok(await verifyPassword(password, hash)); assert.equal(await verifyPassword(password + "x", hash), false);
  assert.equal(await verifyPassword(password, null), false); assert.equal(await verifyPassword(password, "malformed"), false);
  assert.notEqual(await hashPassword(password), hash, "Cada contraseña tiene sal aleatoria");
  await withHarness(async (h) => {
    const db = createClient(h.gatewayUrl, "fixture-service", { auth: { persistSession: false, autoRefreshToken: false } });
    const stock = async () => Number((await h.db.query("select sum(available_quantity)::int n from consignment_lots where distributor_id=$1", [h.dist])).rows[0].n);
    const before = await stock();
    const options = { username: "origami", password, secret, name: "Origami", slug: "origami" };
    await assert.rejects(provisionDistributor(db, { ...options, secret: "short" }), /ACCESS_SECRET_REQUIRED/);
    assert.equal((await provisionDistributor(db, options)).status, "already_created");
    assert.equal(await stock(), before);
    await assert.rejects(provisionDistributor(db, { ...options, slug: "otro" }), /USERNAME_ALREADY_ASSIGNED/);
    const created = await provisionDistributor(db, { ...options, username: "nuevo", name: "Otro distribuidor", slug: "nuevo" });
    assert.equal(created.status, "created");
    const repeated = await provisionDistributor(db, { ...options, username: "nuevo", name: "Otro distribuidor", slug: "nuevo" });
    assert.equal(repeated.distributorId, created.distributorId); assert.equal(repeated.status, "already_created");
    assert.equal((await h.db.query("select count(*)::int n from consignment_items where distributor_id=$1", [created.distributorId])).rows[0].n, 0);
    assert.equal((await h.db.query("select email from distributor_memberships where distributor_id=$1", [created.distributorId])).rows[0].email, null);
    assert.equal(h.trace.some(v => v.includes("/auth/v1/")), false, "No depende de Auth ni envía correo");
    const login = async (username: string, value: string) => fetch(h.url + "/api/distributor/auth", { method: "POST", headers: { Origin: h.url, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password: value }) });
    let r = await login("NUEVO", password); assert.equal(r.status, 200);
    const cookie = r.headers.get("set-cookie")!.split(";")[0];
    r = await fetch(h.url + "/api/distributor", { headers: { Cookie: cookie } });
    const snapshot = (await r.json()).snapshot; assert.equal(snapshot.distributor.id, created.distributorId); assert.equal(snapshot.items.length, 0);
    const adminPost = (body: unknown, key = randomUUID(), csrf = h.adminCsrf) => fetch(h.url + "/api/admin/distributors/access", { method: "POST",
      headers: { Cookie: `ml_admin=${h.adminCookie}`, "Content-Type": "application/json", "x-ml-csrf": csrf, "Idempotency-Key": key }, body: JSON.stringify(body) });
    // Obtener el nombre real de la cookie del admin del harness/servidor.
    const command = { action: "create" as const, distributorId: h.dist, username: "origami-operador", password };
    const rawCommand = { ...command, role: "matrixlab_admin" };
    assert.equal((await adminPost(rawCommand)).status, 400);
    assert.equal((await adminPost(command, randomUUID(), "csrf-incorrecto")).status, 401);
    assert.equal((await fetch(h.url + "/api/admin/distributors/access?id=" + h.dist, { headers: { Cookie: `ml_distributor=${h.cookie}` } })).status, 401);
    const key = randomUUID();
    const first = await adminPost(command, key); assert.equal(first.status, 200, await first.clone().text()); const result = await first.json();
    await h.restart();
    const replay = await adminPost(command, key); assert.equal(replay.status, 200); assert.deepEqual(await replay.json(), result);
    assert.equal((await adminPost({ ...command, password: password + "x" }, key)).status, 409);
    assert.equal((await h.db.query("select count(*)::int n from distributor_credentials where username='origami-operador'")).rows[0].n, 1);
    const accounts = await fetch(h.url + "/api/admin/distributors/access?id=" + h.dist, { headers: { Cookie: `ml_admin=${h.adminCookie}` } });
    assert.equal(accounts.status, 200); assert.doesNotMatch(await accounts.text(), /password|scrypt|digest/);
    const foreignReset = await adminPost({ action: "reset", distributorId: h.other, username: "origami-operador", password: password + "x" });
    assert.equal(foreignReset.status, 404);
    const currentDigest = (await h.db.query("select password_digest from distributor_credentials where username='origami-operador'")).rows[0].password_digest;
    const activeLogin = await login("origami-operador", password); assert.equal(activeLogin.status, 200);
    const oldCookie = activeLogin.headers.get("set-cookie")!.split(";")[0];
    const reset = await adminPost({ action: "reset", distributorId: h.dist, username: "origami-operador", password: password + "x" });
    assert.equal(reset.status, 200); assert.equal((await fetch(h.url + "/api/distributor", { headers: { Cookie: oldCookie } })).status, 401);
    assert.equal((await login("origami-operador", password)).status, 401); assert.equal((await login("origami-operador", password + "x")).status, 200);
    const memberId = (await h.db.query("select membership_id from distributor_credentials where username='origami-operador'")).rows[0].membership_id;
    assert.equal((await h.db.query("select consignment_open_session($1,$2,$3,now()+interval '1 hour') ok", [memberId,currentDigest,randomBytes(32).toString("hex")])).rows[0].ok, false, "Una verificación anterior al reset no abre sesión");
    for (const action of ["disable", "enable"]) {
      assert.equal((await adminPost({ action, distributorId: h.dist, username: "origami-operador" })).status, 200);
      assert.equal((await login("origami-operador", password + "x")).status, action === "disable" ? 401 : 200);
    }
    assert.equal((await fetch(h.url + "/api/distributor", { headers: { Cookie: oldCookie } })).status, 401, "Reactivar no resucita sesiones antiguas");
    const audit = JSON.stringify((await h.db.query("select metadata from consignment_audit_events where action like 'access_%'")).rows);
    assert.ok(!audit.includes(password)); assert.doesNotMatch(audit, /scrypt|password_digest/);
    const fp = accessFingerprint(command, secret); assert.equal(fp.length, 64);
    for (const role of ["anon", "authenticated"]) {
      const privileges = (await h.db.query("select has_table_privilege($1,'public.distributor_credentials','SELECT') t, has_function_privilege($1,'public.consignment_access_command(uuid,text,text,text,text,text,text)','EXECUTE') f", [role])).rows[0];
      assert.equal(privileges.t, false); assert.equal(privileges.f, false);
    }
    assert.equal(await stock(), before);
    console.log("Cuentas nativas: alta/reintento/restablecer/suspender, sesiones revocadas, contraseñas protegidas, aislamiento y stock intacto");
  });
}
main().catch((e) => { console.error(e); process.exit(1); });
