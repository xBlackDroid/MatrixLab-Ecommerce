/**
 * QA de los FOLIOS de cotización (COT-xxx) del cotizador admin.
 *
 *   A. Contrato del POST (Zod estricto), conteo y huella SHA-256.
 *   B. SQL REAL en un PostgreSQL embebido y aislado (loopback, sin env ni
 *      credenciales externas; ver scripts/qa/consignments/database.ts): se
 *      aplican TODAS las migraciones y se prueba 38 → 39 → 40, lotes,
 *      idempotencia tras respuesta perdida, conflicto de contenido,
 *      concurrencia con dos clientes, que nunca retrocede, re-aplicar la
 *      migración y privilegios (anon/authenticated sin acceso; sólo
 *      service_role ejecuta la función).
 *   C. Invariantes leídas del código (ruta, adapter, migración).
 *
 * Correr con: npx tsx scripts/qa/admin-cotizador-folios.test.ts
 */
import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Pool, PoolClient } from "pg";
import {
  FOLIO_SEED_LAST_ISSUED,
  FolioRpcResultSchema,
  folioCount,
  formatFolio,
  parseFolioReserve,
  reserveFolios,
  type FolioRepo,
} from "../../src/lib/admin-cotizador/folios";
import { withDatabase } from "./consignments/database";

const ROOT = join(__dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

function body(overrides: Record<string, unknown> = {}, lines = 1) {
  return {
    requestId: randomUUID(),
    mode: "integrated",
    quote: {
      iva: false,
      lines: Array.from({ length: lines }, (_, i) => ({ desc: `Servicio ${i + 1}`, qty: 10 + i, unitPrice: 12.5 })),
      fields: { cliente: "Evento", tel: "", fechaEvento: "2026-11-14", lugar: "", tipo: "Stickers", vigencia: "15 días", notas: "" },
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
function contractSuite() {
  console.log("\n--- A. Contrato, conteo y huella ---");
  const ok = parseFolioReserve(body());
  check("acepta una solicitud válida", ok.ok);
  check("integrada → 1 folio", folioCount("integrated", 5) === 1);
  check("individual de 1 línea → 1 folio", folioCount("individual", 1) === 1);
  check("individual de 3 líneas → 3 folios", folioCount("individual", 3) === 3);
  const ind = parseFolioReserve(body({ mode: "individual" }, 3));
  check("el servidor calcula el conteo (individual 3 → 3)", ind.ok && ind.count === 3);

  const rejects = (name: string, value: unknown) => check(`rechaza ${name}`, !parseFolioReserve(value).ok);
  // Cuerpos deliberadamente inválidos: se mutan sin tipos a propósito.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = () => body() as Record<string, any>;
  rejects("llaves desconocidas (p. ej. un folio propuesto por el cliente)", { ...b(), folio: 99 });
  rejects("requestId que no es UUID", { ...b(), requestId: "abc" });
  rejects("modo desconocido", { ...b(), mode: "batch" });
  rejects("sin líneas", { ...b(), quote: { ...b().quote, lines: [] } });
  rejects("más de 200 líneas", body({}, 201));
  rejects("precio NaN", (() => { const x = b(); x.quote.lines[0].unitPrice = Number.NaN; return x; })());
  rejects("precio Infinity", (() => { const x = b(); x.quote.lines[0].unitPrice = Number.POSITIVE_INFINITY; return x; })());
  rejects("precio como texto", (() => { const x = b(); x.quote.lines[0].unitPrice = "12.5"; return x; })());
  rejects("cantidad 0", (() => { const x = b(); x.quote.lines[0].qty = 0; return x; })());
  rejects("cantidad no entera", (() => { const x = b(); x.quote.lines[0].qty = 1.5; return x; })());
  rejects("llave extra en una línea (costo interno)", (() => { const x = b(); x.quote.lines[0].cost = 3; return x; })());
  rejects("campo de cliente desconocido", (() => { const x = b(); x.quote.fields.email = "a@b"; return x; })());

  const base = body();
  const p1 = parseFolioReserve(base);
  const reordered = parseFolioReserve({
    quote: { fields: { ...base.quote.fields }, lines: base.quote.lines.map((l) => ({ unitPrice: l.unitPrice, qty: l.qty, desc: l.desc })), iva: base.quote.iva },
    mode: base.mode,
    requestId: randomUUID(),
  });
  const changed = parseFolioReserve({ ...base, quote: { ...base.quote, iva: true } });
  const otherMode = parseFolioReserve({ ...base, mode: "individual" });
  check(
    "huella SHA-256 hex, independiente del orden de llaves y del UUID",
    p1.ok && reordered.ok && /^[0-9a-f]{64}$/.test(p1.fingerprint) && p1.fingerprint === reordered.fingerprint,
  );
  check("cambiar el contenido cambia la huella", p1.ok && changed.ok && p1.fingerprint !== changed.fingerprint);
  check("el modo forma parte de la huella", p1.ok && otherMode.ok && p1.fingerprint !== otherMode.fingerprint);
  check("formato de folio COT-039 / COT-1000", formatFolio(39) === "COT-039" && formatFolio(1000) === "COT-1000");
  check("la semilla es la última emitida (38)", FOLIO_SEED_LAST_ISSUED === 38);
}

// ---------------------------------------------------------------------------
type Reserve = { first: number; count: number; last_issued: number; replayed: boolean };

async function asRole<T>(pool: Pool, role: string, run: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query(`set role ${role}`);
    return await run(client);
  } finally {
    await client.query("reset role").catch(() => {});
    client.release();
  }
}

async function rpc(c: PoolClient, id: string, count: number, fp: string): Promise<Reserve> {
  const r = await c.query("select public.admin_quote_reserve_folios($1::uuid, $2::int, $3::text) as r", [id, count, fp]);
  const parsed = FolioRpcResultSchema.safeParse(r.rows[0].r);
  if (!parsed.success) throw new Error("respuesta jsonb inesperada");
  return parsed.data;
}

async function sqlError(run: () => Promise<unknown>): Promise<string> {
  try { await run(); return "OK"; } catch (e) { return (e as { code?: string }).code ?? "ERR"; }
}

const fp = (seed: string) => (seed.repeat(64)).slice(0, 64);
const lastIssued = async (pool: Pool) =>
  (await pool.query("select last_issued from public.admin_quote_folio_counter where id = 'cot'")).rows[0].last_issued as number;

/** FolioRepo sobre pg con la misma semántica que folio-store.ts (Supabase rpc). */
function pgRepo(pool: Pool): FolioRepo {
  return {
    lastIssued: () => lastIssued(pool),
    reserve: ({ requestId, count, fingerprint }) =>
      asRole(pool, "service_role", async (c) => {
        try {
          const r = await rpc(c, requestId, count, fingerprint);
          return { first: r.first, count: r.count, lastIssued: r.last_issued, replayed: r.replayed };
        } catch (e) {
          if ((e as { code?: string }).code === "MLQ09") return "conflict" as const;
          throw e;
        }
      }),
  };
}

async function databaseSuite(pool: Pool) {
  console.log("\n--- B. SQL real (PostgreSQL embebido) ---");
  const migration = readdirSync(join(ROOT, "supabase", "migrations")).find((f) => f.endsWith("_admin_quote_folios.sql"))!;
  const sql = read("supabase", "migrations", migration);

  // Estado tras aplicar la migración: 38 emitida, 39 siguiente, sin reservas.
  check("semilla: última emitida 38", (await lastIssued(pool)) === 38);
  const peek = await pool.query("select last_issued + 1 as next from public.admin_quote_folio_counter where id = 'cot'");
  check("SELECT del siguiente (39) no consume nada", peek.rows[0].next === 39 && (await lastIssued(pool)) === 38);
  check("sin reservas al aplicar", (await pool.query("select count(*)::int n from public.admin_quote_folio_reservations")).rows[0].n === 0);

  // Las consultas de validación de docs/ADMIN_COTIZADOR.md, tal cual.
  const docs = read("docs", "ADMIN_COTIZADOR.md").replace(/\r\n/g, "\n");
  const blocks = [...docs.slice(docs.indexOf("### Folios:")).matchAll(/```sql\n([\s\S]*?)```/g)].map((m) => m[1]!);
  check("la documentación trae 2 bloques SQL de validación", blocks.length >= 2);
  const docRead = await pool.query(blocks[0]!);
  const docResults = Array.isArray(docRead) ? docRead : [docRead];
  check(
    "validación de docs (sólo lectura): 38 | 39, 0 reservas, permisos f/f/t",
    docResults[0]!.rows[0].last_issued === 38 && docResults[0]!.rows[0].next === 39 &&
      Number(docResults[1]!.rows[0].count) === 0 &&
      docResults[4]!.rows[0].anon === false && docResults[4]!.rows[0].auth === false && docResults[4]!.rows[0].svc === true,
  );
  await asRole(pool, "postgres", async (c) => {
    const out = await c.query(blocks[1]!);
    const rows = (Array.isArray(out) ? out : [out]).flatMap((r) => r.rows);
    const probe = rows.find((r) => r.admin_quote_reserve_folios)?.admin_quote_reserve_folios;
    check("prueba funcional de docs (BEGIN … ROLLBACK) ve COT-039", probe?.first === 39);
  });
  check("tras la validación de docs: sigue 38 y 0 reservas", (await lastIssued(pool)) === 38 && (await pool.query("select count(*)::int n from public.admin_quote_folio_reservations")).rows[0].n === 0);

  // Re-aplicar la migración es inocuo.
  await pool.query(sql);
  check("re-aplicar la migración no cambia el contador", (await lastIssued(pool)) === 38);

  // Validación de despliegue SIN consumir: transacción con ROLLBACK.
  await asRole(pool, "service_role", async (c) => {
    await c.query("begin");
    const probe = await rpc(c, randomUUID(), 1, fp("a"));
    await c.query("rollback");
    check("prueba dentro de transacción + ROLLBACK ve 39…", probe.first === 39);
  });
  check("…y el ROLLBACK no deja rastro (sigue 38, 0 reservas)", (await lastIssued(pool)) === 38 && (await pool.query("select count(*)::int n from public.admin_quote_folio_reservations")).rows[0].n === 0);

  const repo = pgRepo(pool);
  const asParsed = (overrides: Record<string, unknown> = {}, lines = 1) => {
    const p = parseFolioReserve(body(overrides, lines));
    if (!p.ok) throw new Error("solicitud de prueba inválida");
    return p;
  };

  // 38 → 39 → 40, y lote individual contiguo.
  const integrated = await reserveFolios(repo, asParsed());
  check("primera integrada → COT-039", integrated.status === "reserved" && integrated.folios.join() === "COT-039" && integrated.next === 40);
  const again = await reserveFolios(repo, asParsed());
  check("repetir el PDF (solicitud nueva) → COT-040, nunca repite", again.status === "reserved" && again.folios.join() === "COT-040");
  const batch = await reserveFolios(repo, asParsed({ mode: "individual" }, 3));
  check("individual de 3 → COT-041…043 contiguos", batch.status === "reserved" && batch.folios.join() === "COT-041,COT-042,COT-043" && batch.next === 44);
  const single = await reserveFolios(repo, asParsed({ mode: "individual" }, 1));
  check("individual de 1 línea → 1 folio (COT-044)", single.status === "reserved" && single.folios.join() === "COT-044");

  // Respuesta perdida: mismo UUID + mismo contenido → mismo rango, no consume.
  const lost = asParsed({ mode: "individual" }, 2);
  const firstTry = await reserveFolios(repo, lost);
  const before = await lastIssued(pool);
  const retry = await reserveFolios(repo, lost);
  check(
    "reintento tras respuesta perdida → mismo rango, replayed, sin consumir",
    firstTry.status === "reserved" && retry.status === "reserved" &&
      retry.folios.join() === firstTry.folios.join() && retry.reservation.replayed && !firstTry.reservation.replayed &&
      (await lastIssued(pool)) === before,
  );
  // Mismo UUID con otro contenido o conteo → conflicto, nada consumido.
  const tamperedBody = body({ mode: "individual", requestId: lost.request.requestId }, 2);
  tamperedBody.quote.fields.cliente = "Otro cliente";
  const tampered = parseFolioReserve(tamperedBody);
  check(
    "mismo UUID con otro contenido → conflicto (no comparte folio)",
    tampered.ok && (await reserveFolios(repo, tampered)).status === "conflict" && (await lastIssued(pool)) === before,
  );
  const otherCount = await sqlError(() => asRole(pool, "service_role", (c) => rpc(c, lost.request.requestId, 3, lost.fingerprint)));
  check("mismo UUID y huella pero otro conteo → MLQ09", otherCount === "MLQ09" && (await lastIssued(pool)) === before);

  // Entradas inválidas en la función: nada se consume.
  const bad = async (label: string, id: string | null, count: number | null, f: string | null, code: string) => {
    const got = await sqlError(() => asRole(pool, "service_role", (c) =>
      c.query("select public.admin_quote_reserve_folios($1::uuid, $2::int, $3::text)", [id, count, f])));
    check(`función rechaza ${label} (${code})`, got === code && (await lastIssued(pool)) === before, got);
  };
  await bad("UUID nulo", null, 1, fp("b"), "MLQ01");
  await bad("conteo 0", randomUUID(), 0, fp("b"), "MLQ02");
  await bad("conteo 201", randomUUID(), 201, fp("b"), "MLQ02");
  await bad("huella no hex", randomUUID(), 1, "x".repeat(64), "MLQ03");
  await bad("huella nula", randomUUID(), 1, null, "MLQ03");

  // Concurrencia: dos clientes (conexiones) reservando a la vez.
  const start = await lastIssued(pool);
  const jobs: Array<Promise<Reserve>> = [];
  let requested = 0;
  for (let i = 0; i < 40; i++) {
    const count = (i % 3) + 1;
    requested += count;
    jobs.push(asRole(pool, "service_role", (c) => rpc(c, randomUUID(), count, fp(String(i % 10)))));
  }
  const results = await Promise.all(jobs);
  const taken = results.flatMap((r) => Array.from({ length: r.count }, (_, k) => r.first + k)).sort((x, y) => x - y);
  const contiguous = taken.every((n, i) => n === start + 1 + i);
  check(
    `40 reservas simultáneas: ${requested} folios únicos, contiguos y sin huecos`,
    taken.length === requested && new Set(taken).size === requested && contiguous && (await lastIssued(pool)) === start + requested,
  );

  // Mismo UUID enviado por dos dispositivos a la vez → un solo rango.
  const dupId = randomUUID();
  const preDup = await lastIssued(pool);
  const [d1, d2] = await Promise.all([
    asRole(pool, "service_role", (c) => rpc(c, dupId, 2, fp("c"))),
    asRole(pool, "service_role", (c) => rpc(c, dupId, 2, fp("c"))),
  ]);
  check(
    "doble envío simultáneo del mismo UUID → mismo rango, se consume una sola vez",
    d1.first === d2.first && d1.replayed !== d2.replayed && (await lastIssued(pool)) === preDup + 2,
  );

  // Nunca retrocede: ni service_role puede bajar el contador.
  const current = await lastIssued(pool);
  check("service_role no puede bajar el contador (trigger)", (await sqlError(() => asRole(pool, "service_role", (c) => c.query("update public.admin_quote_folio_counter set last_issued = last_issued - 1 where id = 'cot'")))) === "MLQ08");
  check("ni el superusuario puede ponerlo bajo 38 (CHECK + trigger)", (await sqlError(() => pool.query("update public.admin_quote_folio_counter set last_issued = 10 where id = 'cot'"))) !== "OK");
  check("service_role no puede borrar el contador", (await sqlError(() => asRole(pool, "service_role", (c) => c.query("delete from public.admin_quote_folio_counter")))) === "42501");
  check("service_role no puede borrar reservas", (await sqlError(() => asRole(pool, "service_role", (c) => c.query("delete from public.admin_quote_folio_reservations")))) === "42501");
  check("service_role no puede editar reservas", (await sqlError(() => asRole(pool, "service_role", (c) => c.query("update public.admin_quote_folio_reservations set first_folio = 39")))) === "42501");
  check(
    "dos reservas jamás comparten folio (EXCLUDE)",
    (await sqlError(() => pool.query("insert into public.admin_quote_folio_reservations values ($1, 39, 1, $2)", [randomUUID(), fp("d")]))) === "23P01",
  );
  check("el contador sigue intacto tras los intentos", (await lastIssued(pool)) === current);

  // Re-aplicar la migración con el contador avanzado: NO rebaja a 38.
  await pool.query(sql);
  check("re-aplicar con contador avanzado no lo rebaja", (await lastIssued(pool)) === current);

  // Privilegios.
  for (const role of ["anon", "authenticated"]) {
    for (const table of ["admin_quote_folio_counter", "admin_quote_folio_reservations"]) {
      const privs = await pool.query(
        `select bool_or(has_table_privilege($1, 'public.' || $2, p)) any from unnest(array['select','insert','update','delete','truncate','references','trigger']) p`,
        [role, table],
      );
      check(`${role} sin ningún privilegio en ${table}`, privs.rows[0].any === false);
    }
    const exec = await pool.query("select has_function_privilege($1, 'public.admin_quote_reserve_folios(uuid,integer,text)', 'execute') x", [role]);
    check(`${role} no puede ejecutar la función`, exec.rows[0].x === false);
    const call = await sqlError(() => asRole(pool, role, (c) => rpc(c, randomUUID(), 1, fp("e"))));
    check(`${role}: llamar la función → 42501`, call === "42501", call);
    const sel = await sqlError(() => asRole(pool, role, (c) => c.query("select * from public.admin_quote_folio_counter")));
    check(`${role}: leer el contador → 42501`, sel === "42501", sel);
  }
  const publicAcl = await pool.query(
    `select count(*)::int n from pg_proc p cross join lateral aclexplode(p.proacl) a
      where p.proname in ('admin_quote_reserve_folios', 'admin_quote_folio_counter_guard') and a.grantee = 0`,
  );
  check("PUBLIC sin EXECUTE en las funciones", publicAcl.rows[0].n === 0);
  const sr = await pool.query(`select
      has_table_privilege('service_role', 'public.admin_quote_folio_counter', 'select') cs,
      has_table_privilege('service_role', 'public.admin_quote_folio_counter', 'update') cu,
      has_table_privilege('service_role', 'public.admin_quote_folio_counter', 'insert') ci,
      has_table_privilege('service_role', 'public.admin_quote_folio_reservations', 'select') rs,
      has_table_privilege('service_role', 'public.admin_quote_folio_reservations', 'insert') ri,
      has_table_privilege('service_role', 'public.admin_quote_folio_reservations', 'update') ru,
      has_function_privilege('service_role', 'public.admin_quote_reserve_folios(uuid,integer,text)', 'execute') fx,
      has_function_privilege('service_role', 'public.admin_quote_folio_counter_guard()', 'execute') gx`);
  const s = sr.rows[0];
  check("service_role: mínimos (contador select/update; reservas select/insert; execute)", s.cs && s.cu && !s.ci && s.rs && s.ri && !s.ru && s.fx && !s.gx, JSON.stringify(s));
  const fn = await pool.query(`select prosecdef, proconfig from pg_proc where proname in ('admin_quote_reserve_folios', 'admin_quote_folio_counter_guard')`);
  check("funciones SECURITY INVOKER con search_path vacío", fn.rows.length === 2 && fn.rows.every((r) => r.prosecdef === false && (r.proconfig ?? []).includes('search_path=""')), JSON.stringify(fn.rows));
  const rls = await pool.query(`select relname, relrowsecurity, relforcerowsecurity from pg_class
      where relname in ('admin_quote_folio_counter', 'admin_quote_folio_reservations')`);
  check("RLS habilitada y forzada en ambas tablas", rls.rows.length === 2 && rls.rows.every((r) => r.relrowsecurity && r.relforcerowsecurity));
  const policies = await pool.query(`select count(*)::int n from pg_policies where tablename like 'admin_quote_folio%'`);
  check("sin policies (deny-all)", policies.rows[0].n === 0);
  const cols = await pool.query(`select column_name from information_schema.columns where table_name = 'admin_quote_folio_reservations' order by 1`);
  check(
    "las reservas no guardan cliente, montos ni costos",
    cols.rows.map((r) => r.column_name).join() === "created_at,fingerprint,first_folio,folio_count,request_id",
  );
}

// ---------------------------------------------------------------------------
function invariantsSuite() {
  console.log("\n--- C. Invariantes del código ---");
  const route = read("src", "app", "api", "admin", "cotizador", "folios", "route.ts");
  check("GET exige sesión admin", /export async function GET[\s\S]*getAdminFromRequest/.test(route));
  check("POST exige sesión + CSRF", /export async function POST[\s\S]*requireAdminMutation/.test(route));
  check("POST con límite propio", /adminQuoteFolioReserve/.test(route));
  check("respuestas private, no-store", /private, no-store/.test(route));
  check("la auditoría sólo registra números", /metadata: \{ first: reservation\.first, count: reservation\.count \}/.test(route));
  const store = read("src", "lib", "admin-cotizador", "folio-store.ts");
  check("el repositorio es server-only", store.startsWith('import "server-only";'));

  const adapter = read("src", "lib", "admin-cotizador", "legacy", "adapter.js");
  check("el adapter pide el folio al servidor", adapter.includes("'/api/admin/cotizador/folios'"));
  check("el renderer original numera desde el folio confirmado", /COT\.cotNum = d\.first;/.test(adapter));
  check("el adapter nunca incrementa el folio localmente", !/COT\.cotNum\s*(\+\+|\+=|=\s*COT\.cotNum\s*\+)/.test(adapter));
  check("sin controles manuales de folio (se quitan antes de ALLOWED)", adapter.indexOf("header.replaceChild(panel, controls)") < adapter.indexOf("var ALLOWED = {}"));
  check("adapter sin eval ni handlers en línea", !/\beval\(|new Function\(/.test(adapter) && !/\son(click|change|input|error|load)\s*=/i.test(adapter));

  const sql = read("supabase", "migrations", readdirSync(join(ROOT, "supabase", "migrations")).find((f) => f.endsWith("_admin_quote_folios.sql"))!)
    .replace(/--.*$/gm, "");
  check("migración sin SECURITY DEFINER", !/security\s+definer/i.test(sql));
  check("migración no destructiva", !/\b(drop|truncate|delete\s+from)\b/i.test(sql));
  check("semilla sin pisar un contador existente", /values \('cot', 38\)\s*on conflict \(id\) do nothing;/.test(sql));
  check(
    "grants sólo a service_role",
    (sql.match(/\bgrant\b[^;]*;/gi) ?? []).every((g) => /to service_role;$/.test(g)) && (sql.match(/\bgrant\b/gi) ?? []).length === 3,
  );
  check(
    "EXECUTE revocado a public, anon y authenticated",
    ["public", "anon", "authenticated"].every((r) =>
      new RegExp(`revoke all on function public\\.admin_quote_reserve_folios\\(uuid, integer, text\\) from ${r};`).test(sql)),
  );
}

async function main() {
  contractSuite();
  invariantsSuite();
  await withDatabase(async (pool) => { await databaseSuite(pool); });
  console.log(failures === 0 ? "\nTodo OK." : `\n${failures} fallo(s).`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("QA abortado:", e instanceof Error ? e.message : e);
  process.exit(1);
});
