// Adaptador HTTP SOLO de prueba: transporte
// PostgREST mínimo hacia PostgreSQL real. No es un servidor de producción.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID, randomBytes, createHmac } from "node:crypto";
import { once } from "node:events";
import type { Pool } from "pg";
import { resolve } from "node:path";
import { withDatabase, freePort } from "./database";
import { hashPassword } from "../../../src/lib/consignments/passwords";
import { sessionHash, signToken } from "../../../src/lib/consignments/tokens";
export interface Harness { url: string; db: Pool; dist: string; other: string; item: string; otherItem: string; user: string;
  adminCookie: string; adminCsrf: string; cookie: string; otherCookie: string; csrf: string; membership: string; gatewayUrl: string; restart: () => Promise<void>; trace: string[] }
export async function withHarness(run: (h: Harness) => Promise<void>, flag = true,
  storageHook?: (url: URL, input: Record<string, unknown>, method: string) => Promise<{ status: number; data: unknown }>) {
  await withDatabase(async (db) => {
    const dist = randomUUID(), other = randomUUID(), user = randomUUID(), item = randomUUID(), otherItem = randomUUID(), membership = randomUUID();
    const secret = randomBytes(40).toString("hex"), adminSecret = randomBytes(40).toString("hex"), password = "Fixture-password-1234";
    await db.query("insert into distributors(id,name,slug) values($1,'Origami TEST','origami'),($2,'Distribuidor B TEST','b')", [dist, other]);
    await db.query("insert into distributor_memberships(id,distributor_id,auth_user_id,email) values($1,$2,$3,'origami@example.test')", [membership, dist, user]);
    for (const [d, id, name] of [[dist, item, "Pieza Origami TEST"], [other, otherItem, "Pieza privada B"]]) {
      await db.query("insert into consignment_items(id,distributor_id,name,sku,scan_code,suggested_price_cents,created_by) values($1,$2,$3,'DEMO-01',$4,18000,'fixture')", [id, d, name, "MLC" + id.replaceAll("-", "")]);
    }
    const delivery = { kind: "inicial", lines: [{ itemId: item, quantity: 10, costCents: 10000, suggestedCents: 18000 }] };
    await db.query("select consignment_command($1,'fixture','matrixlab_admin',null,$2,'delivery',$3)", [dist, randomUUID(), delivery]);
    await db.query("select consignment_command($1,'fixture','matrixlab_admin',null,$2,'delivery',$3)", [other, randomUUID(),
      { kind: "inicial", lines: [{ itemId: otherItem, quantity: 2, costCents: 7000, suggestedCents: 18000 }] }]);
    const a = { sid: randomBytes(18).toString("base64url"), csrf: randomBytes(18).toString("base64url"), exp: Math.floor(Date.now() / 1000) + 3600, v: 1 };
    const body = Buffer.from(JSON.stringify(a)).toString("base64url");
    const adminCookie = `${body}.${createHmac("sha256", adminSecret).update(body).digest("base64url")}`;
    await db.query("insert into admin_sessions(token_hash,expires_at) values($1,now()+interval '1 hour')", [sessionHash(a.sid)]);
    const signed = signToken(secret);
    await db.query("insert into consignment_sessions(token_hash,membership_id,distributor_id,auth_user_id,expires_at) values($1,$2,$3,$4,now()+interval '1 hour')", [sessionHash(signed.payload.sid), membership, dist, user]);
    const otherUser = randomUUID(), otherMember = randomUUID(), otherSigned = signToken(secret);
    await db.query("insert into distributor_memberships(id,distributor_id,auth_user_id,email) values($1,$2,$3,'b@example.test')", [otherMember, other, otherUser]);
    await db.query("insert into consignment_sessions(token_hash,membership_id,distributor_id,auth_user_id,expires_at) values($1,$2,$3,$4,now()+interval '1 hour')", [sessionHash(otherSigned.payload.sid), otherMember, other, otherUser]);
    await db.query("insert into distributor_credentials(membership_id,distributor_id,username,password_digest) values($1,$2,'origami',$3),($4,$5,'distribuidor-b',$3)", [membership,dist,await hashPassword(password),otherMember,other]);
    const trace: string[] = [];
    const gateway = createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? "/", "http://127.0.0.1"); let raw = ""; for await (const chunk of req) raw += chunk;
        const input = raw ? JSON.parse(raw) : {};
        if (url.pathname.startsWith("/storage/") && storageHook) {
          const out = await storageHook(url, input, req.method ?? "GET");
          res.writeHead(out.status, { "Content-Type": "application/json" }); res.end(JSON.stringify(out.data)); return;
        }
        let result: unknown; let status = 200;
        if (url.pathname.startsWith("/rest/v1/rpc/")) {
          const name = url.pathname.split("/").pop()!;
          if (!/^(consignment_(command|preview|snapshot|access_command|open_session)|admin_login_lock_state|register_admin_login_failure|clear_admin_login_attempts|design_delete_begin|design_delete_finish|design_write_begin)$/.test(name)) throw new Error("Unsupported RPC");
          const keys = Object.keys(input); const args = keys.map((k, idx) => `${k}=>$${idx + 1}`).join(",");
          result = (await db.query(`select public.${name}(${args}) result`, keys.map((k) => k === "p_assets" ? input[k] : typeof input[k] === "object" && input[k] !== null ? JSON.stringify(input[k]) : input[k]))).rows[0].result;
        } else if (url.pathname.startsWith("/rest/v1/")) {
          const table = url.pathname.split("/").pop()!;
          if (!/^(distributors|distributor_memberships|distributor_credentials|consignment_sessions|admin_sessions|product_variants|design_projects|uploaded_assets|design_deletion_jobs|design_write_leases|orders|cart_items|audit_logs)$/.test(table)) throw new Error("Unsupported table");
          const params: unknown[] = []; const filters: string[] = [];
          for (const [key, value] of url.searchParams) {
            if (["select", "limit", "order"].includes(key)) continue;
            if (!/^[a-z_]+$/.test(key)) throw new Error("Bad column");
            const dot = value.indexOf("."), op = value.slice(0, dot), val = value.slice(dot + 1);
            if (op === "is" && val === "null") filters.push(`${key} is null`);
            else if (op === "in" && val.startsWith("(") && val.endsWith(")")) { params.push(val === "()" ? [] : val.slice(1,-1).split(",").map(v => v.replace(/^"|"$/g,""))); filters.push(`${key}=any($${params.length})`); }
            else if (["eq", "gt", "lt"].includes(op)) { params.push(val); filters.push(`${key}${op === "eq" ? "=" : op === "gt" ? ">" : "<"}$${params.length}`); }
            else throw new Error("Bad filter");
          }
          let sql: string;
          if (req.method === "POST") {
            const values = Array.isArray(input) ? input[0] : input; const cols = Object.keys(values);
            if (cols.some((c) => !/^[a-z_]+$/.test(c))) throw new Error("Bad insert");
            params.push(...cols.map((c) => values[c])); sql = `insert into public.${table}(${cols.join(",")}) values(${cols.map((_, i) => "$" + (i + 1)).join(",")}) returning *`;
          } else if (req.method === "PATCH") {
            const cols = Object.keys(input); if (cols.some((c) => !/^[a-z_]+$/.test(c))) throw new Error("Bad update");
            const sets = cols.map((c) => { params.push(input[c]); return `${c}=$${params.length}`; });
            sql = `update public.${table} set ${sets.join(",")} where ${filters.join(" and ") || "false"} returning *`;
          } else if (req.method === "DELETE") sql = `delete from public.${table} where ${filters.join(" and ") || "false"} returning *`;
          else sql = `select * from public.${table}${filters.length ? " where " + filters.join(" and ") : ""}`;
          let rows = (await db.query(sql, params)).rows;
          const select = url.searchParams.get("select");
          if (table === "design_projects" && select?.includes("orders(order_number)")) rows = rows.map(row => ({...row,orders:null}));
          if (select && select !== "*" && /^[a-z_,]+$/.test(select)) rows = rows.map(row => Object.fromEntries(select.split(",").map(k => [k,row[k]])));
          result = req.headers.accept?.includes("application/vnd.pgrst.object+json") ? rows[0] ?? null : rows;
        } else { status = 404; result = {}; }
        trace.push(`${req.method} ${url.pathname} ${status}`);
        res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(result));
      } catch (e) { const err = e as { message?: string; code?: string }; trace.push(`${req.method} ${req.url?.split("?")[0]} ${err.code ?? "adapter-error"}`); res.writeHead(400, { "Content-Type": "application/json" }); res.end(JSON.stringify({ message: err.message, code: err.code })); }
    });
    gateway.listen(0, "127.0.0.1"); await once(gateway, "listening"); const addr = gateway.address(); if (!addr || typeof addr === "string") throw new Error("No gateway");
    const gatewayUrl = `http://127.0.0.1:${addr.port}`, port = await freePort(), url = `http://127.0.0.1:${port}`;
    const launch = () => spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
      windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NODE_ENV: "production", CONSIGNMENTS_ENABLED: String(flag),
        CONSIGNMENT_SESSION_SECRET: secret, ADMIN_SESSION_SECRET: adminSecret, ADMIN_ACCESS_PASSWORD: password,
        SUPABASE_URL: gatewayUrl, NEXT_PUBLIC_SUPABASE_URL: gatewayUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-anon",
        CONSIGNMENTS_SITE_URL: url,
        SUPABASE_SERVICE_ROLE_KEY: "fixture-service", NEXT_PUBLIC_SITE_URL: url, DATABASE_URL: "",
        MERCADOPAGO_ACCESS_TOKEN: "", MERCADOPAGO_WEBHOOK_SECRET: "" } });
    let child = launch(); let logs = "";
    const capture = () => { child.stdout?.on("data", (c) => { logs += c; }); child.stderr?.on("data", (c) => { logs += c; }); };
    const ready = async () => {
      const end = Date.now() + 45000;
      while (true) {
        if (child.exitCode !== null) throw new Error("Servidor de prueba terminó: " + logs);
        try { await fetch(url + "/distribuidores/login"); break; } catch { if (Date.now() > end) throw new Error("Servidor no inició: " + logs); await new Promise((r) => setTimeout(r, 300)); }
      }
    };
    capture();
    try {
      await ready();
      const restart = async () => { child.kill(); await once(child, "exit"); child = launch(); capture(); await ready(); };
      await run({ url, db, dist, other, item, otherItem, user, adminCookie, adminCsrf: a.csrf, cookie: signed.token, otherCookie: otherSigned.token, csrf: signed.payload.csrf, membership, gatewayUrl, restart, trace });
    } finally { child.kill(); await once(child, "exit").catch(() => {}); await new Promise<void>((r) => gateway.close(() => r())); }
  });
}
