/**
 * QA del COTIZADOR admin: validación de la foto, concurrencia optimista e
 * invariantes de seguridad leídas del código.
 *
 * Sin base de datos: el repositorio es un stub en memoria que reproduce la
 * semántica del UPDATE … WHERE version = $base de Postgres (atómico).
 *
 * Correr con: npx tsx scripts/qa/admin-cotizador-workspace.test.ts
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  MAX_SNAPSHOT_BYTES,
  parseWorkspaceSave,
  type WorkspaceSnapshot,
} from "../../src/lib/admin-cotizador/schema";
import {
  loadWorkspace,
  saveWorkspace,
  type WorkspaceRecord,
  type WorkspaceRepo,
  type WorkspaceWrite,
} from "../../src/lib/admin-cotizador/workspace-core";
import { isDynamicRoute, buildStrictCsp } from "../../src/middleware";

const ROOT = join(__dirname, "..", "..");
const LEGACY = join(ROOT, "src", "lib", "admin-cotizador", "legacy");

/** SHA-256 del <script> de MatrixLab_Cotizador_v4_4.html (fórmulas verbatim). */
const ORIGINAL_SCRIPT_SHA256 =
  "6e053a87d11f9fccc936b15f92a6780f4a5fa5b4a289ca8a001a02467c37b8f0";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");

function baseSnapshot(): WorkspaceSnapshot {
  return {
    schema: 1,
    activePage: "cotizacion",
    cot: {
      num: 7,
      nextNum: 8,
      iva: true,
      lines: [{ id: 1730000000000, desc: "Stickers 5×5", qty: 50, unitPrice: 4.25 }],
      fields: {
        cliente: "Evento de prueba",
        tel: "55 0000 0000",
        fechaEvento: "2026-11-02",
        lugar: "Salón",
        tipo: "Stickers",
        vigencia: "15 días",
        notas: "Entrega: 5 días hábiles",
      },
    },
    rec: {
      num: 3,
      iva: false,
      payMethod: "transferencia",
      status: "anticipo",
      lines: [{ id: 1730000000000.5, desc: "Anticipo", qty: 1, unitPrice: 500 }],
      attachment: { name: "comprobante.pdf", size: 120 },
      fields: {
        cotRef: "COT-007",
        cliente: "Evento de prueba",
        tel: "",
        fechaPago: "",
        lugar: "",
        tipo: "",
        payRef: "",
        notas: "",
      },
    },
    savedCots: [
      {
        cotNum: "COT-006",
        fecha: "20/10/2026",
        cliente: "—",
        tel: "—",
        lugar: "—",
        tipo: "Servicios MatrixLab",
        iva: false,
        lines: [{ desc: "Línea", qty: 2, unitPrice: 10 }],
      },
    ],
    costs: { "c-pvc": "11.50", "c-adu": "" },
    modules: {
      inputs: { "qty-tshirt": "20", "chk-liston": true },
      chips: { g0: 1 },
      subTabs: { stickers: 2 },
      counters: { qtyD: 10, tsCustomQty: 30, pQty: 5 },
    },
  };
}

// ---------------------------------------------------------------------------
console.log("\n--- A. Validación de la foto ---");
{
  const ok = parseWorkspaceSave({ baseVersion: 0, snapshot: baseSnapshot() });
  check("acepta una foto completa y válida", ok.ok);

  const negativeDiscount = baseSnapshot();
  negativeDiscount.cot.lines.push({ id: 2, desc: "Descuento", qty: 1, unitPrice: -50 });
  check("acepta línea de descuento negativa (el original la permite)", parseWorkspaceSave({ baseVersion: 0, snapshot: negativeDiscount }).ok);

  const mutate = (fn: (s: Record<string, any>) => void) => {
    const s = baseSnapshot() as unknown as Record<string, any>;
    fn(s);
    return parseWorkspaceSave({ baseVersion: 1, snapshot: s });
  };
  const rejects = (name: string, fn: (s: Record<string, any>) => void) => {
    const r = mutate(fn);
    check(`rechaza ${name}`, !r.ok && r.reason === "invalid");
  };
  rejects("llaves desconocidas en la raíz", (s) => { s.extra = "x"; });
  rejects("llaves desconocidas en una línea", (s) => { s.cot.lines[0].cost = 1; });
  rejects("cantidad 0", (s) => { s.cot.lines[0].qty = 0; });
  rejects("cantidad no entera", (s) => { s.cot.lines[0].qty = 1.5; });
  rejects("precio como texto", (s) => { s.cot.lines[0].unitPrice = "4.25"; });
  rejects("precio fuera de rango", (s) => { s.cot.lines[0].unitPrice = 1e12; });
  rejects("descripción de más de 600 caracteres", (s) => { s.cot.lines[0].desc = "x".repeat(601); });
  rejects("fecha con formato libre", (s) => { s.cot.fields.fechaEvento = "mañana"; });
  rejects("forma de pago desconocida", (s) => { s.rec.payMethod = "bitcoin"; });
  rejects("más de 50 cotizaciones guardadas", (s) => { s.savedCots = Array.from({ length: 51 }, () => s.savedCots[0]); });
  rejects("costo con id fuera del patrón", (s) => { s.costs["__proto__x"] = "1"; });
  rejects("costo no numérico", (s) => { s.costs["c-pvc"] = "1; drop"; });
  rejects("página activa desconocida", (s) => { s.activePage = "admin"; });
  rejects("versión de esquema distinta", (s) => { s.schema = 2; });
  rejects("contador por debajo del mínimo del original", (s) => { s.modules.counters.qtyD = 5; });

  check(
    "rechaza baseVersion negativa",
    !parseWorkspaceSave({ baseVersion: -1, snapshot: baseSnapshot() }).ok,
  );
  check(
    "rechaza sobre sin baseVersion",
    !parseWorkspaceSave({ snapshot: baseSnapshot() }).ok,
  );

  const big = baseSnapshot();
  big.cot.fields.notas = "x".repeat(4000);
  big.savedCots = Array.from({ length: 50 }, (_, i) => ({
    ...big.savedCots[0]!,
    cotNum: `COT-${i}`,
    lines: Array.from({ length: 10 }, () => ({ desc: "y".repeat(600), qty: 1, unitPrice: 1 })),
  }));
  const tooBig = parseWorkspaceSave({ baseVersion: 0, snapshot: big });
  check(
    `rechaza fotos de más de ${MAX_SNAPSHOT_BYTES / 1024} KB con too_large`,
    !tooBig.ok && tooBig.reason === "too_large",
  );
}

// ---------------------------------------------------------------------------

function memoryRepo(initial: WorkspaceRecord | null): WorkspaceRepo & { row: WorkspaceRecord | null; writes: number } {
  const state = {
    row: initial ? { ...initial } : null,
    writes: 0,
    async read() {
      await Promise.resolve();
      return state.row ? { ...state.row } : null;
    },
    async updateIfVersion(expected: number, next: WorkspaceWrite) {
      await Promise.resolve();
      // Comparar-y-escribir en un solo paso, como el UPDATE … WHERE version.
      if (!state.row || state.row.version !== expected) return null;
      state.writes += 1;
      state.row = { version: next.version, snapshot: next.snapshot, updatedAt: new Date(Date.now() + state.writes).toISOString() };
      return { ...state.row };
    },
    async insertInitial(next: WorkspaceWrite) {
      await Promise.resolve();
      if (state.row) return "conflict" as const;
      state.writes += 1;
      state.row = { version: next.version, snapshot: next.snapshot, updatedAt: new Date().toISOString() };
      return { ...state.row };
    },
  };
  return state;
}

async function concurrencySuite() {
  console.log("\n--- B. Concurrencia optimista (repositorio en memoria) ---");
  const seeded = memoryRepo({ version: 0, snapshot: {}, updatedAt: null });
  const empty = await loadWorkspace(seeded);
  check("versión 0 se lee como 'nada guardado'", empty.version === 0 && empty.snapshot === null);

  const first = await saveWorkspace(seeded, 0, baseSnapshot(), "admin");
  check("primer guardado sobre la fila semilla → versión 1", first.status === "saved" && first.record.version === 1);

  const stale = await saveWorkspace(seeded, 0, baseSnapshot(), "admin");
  check(
    "guardado con versión base vieja → conflicto (no sobrescribe)",
    stale.status === "conflict" && stale.current?.version === 1 && seeded.writes === 1,
  );

  const second = await saveWorkspace(seeded, 1, baseSnapshot(), "admin");
  check("guardado con la versión vigente → versión 2", second.status === "saved" && second.record.version === 2);

  // Dos dispositivos parten de la misma versión y guardan a la vez.
  const a = baseSnapshot();
  a.cot.fields.cliente = "Dispositivo A";
  const b = baseSnapshot();
  b.cot.fields.cliente = "Dispositivo B";
  const [ra, rb] = await Promise.all([
    saveWorkspace(seeded, 2, a, "admin"),
    saveWorkspace(seeded, 2, b, "admin"),
  ]);
  const saved = [ra, rb].filter((r) => r.status === "saved");
  const conflicts = [ra, rb].filter((r) => r.status === "conflict");
  check("carrera simultánea: exactamente uno guarda", saved.length === 1 && conflicts.length === 1);
  const winner = (saved[0] as { record: WorkspaceRecord }).record;
  check(
    "carrera simultánea: la base conserva la foto del ganador, sin mezcla",
    seeded.row?.version === 3 && seeded.row?.snapshot === winner.snapshot,
  );

  const missing = memoryRepo(null);
  const created = await saveWorkspace(missing, 0, baseSnapshot(), "admin");
  check("sin fila semilla: el primer guardado la crea (versión 1)", created.status === "saved" && created.record.version === 1);
  const [c1, c2] = await Promise.all([
    saveWorkspace(memoryRepoShared, 0, a, "admin"),
    saveWorkspace(memoryRepoShared, 0, b, "admin"),
  ]);
  check(
    "sin fila semilla y en carrera: uno crea, el otro recibe conflicto",
    [c1, c2].filter((r) => r.status === "saved").length === 1 &&
      [c1, c2].filter((r) => r.status === "conflict").length === 1,
  );
  const staleMissing = await saveWorkspace(memoryRepo(null), 4, baseSnapshot(), "admin");
  check("sin fila y versión base > 0 → conflicto (no inventa historia)", staleMissing.status === "conflict");
}
const memoryRepoShared = memoryRepo(null);

// ---------------------------------------------------------------------------
function invariantsSuite() {
  console.log("\n--- C. Invariantes del código ---");
  const markup = readFileSync(join(LEGACY, "markup.html"), "utf8");
  const adapter = readFileSync(join(LEGACY, "adapter.js"), "utf8");
  const calculator = readFileSync(join(LEGACY, "calculator.js"), "utf8");

  check(
    "calculator.js es el script original byte por byte (fórmulas intactas)",
    // CRLF→LF: con core.autocrlf una copia en Windows cambia los finales de línea.
    createHash("sha256").update(calculator.replace(/\r\n/g, "\n")).digest("hex") === ORIGINAL_SCRIPT_SHA256,
  );
  check("markup.html no tiene handlers en línea", !/\son[a-z]+\s*=/i.test(markup));
  check("adapter.js no genera handlers en línea", !/\son(click|change|input|error|load)\s*=/i.test(adapter));
  check("markup.html no tiene javascript: URLs", !/javascript:/i.test(markup));
  check("adapter.js no usa eval / new Function", !/\beval\(|new Function\(/.test(adapter));
  check(
    "ninguna fuente JS/CSS contiene </script o </style (cerraría el bloque)",
    ![calculator, adapter, readFileSync(join(LEGACY, "styles.css"), "utf8"), readFileSync(join(LEGACY, "adapter.css"), "utf8")]
      .some((s) => /<\/(script|style)/i.test(s)),
  );

  const walk = (dir: string, out: string[] = []): string[] => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, out);
      else out.push(full);
    }
    return out;
  };
  const publicLeak = walk(join(ROOT, "public")).filter((f) =>
    /cotizador|calculator\.js/i.test(f.slice(ROOT.length)) || /lienzoArea|vcorteHoloAPrice/.test(readFileSync(f).toString("latin1")),
  );
  check("nada del cotizador (costos internos) vive en public/", publicLeak.length === 0, publicLeak.join(", "));

  const route = read("src", "app", "admin", "cotizador", "route.ts");
  check("/admin/cotizador exige sesión admin viva", /getAdminFromRequest\(request\)/.test(route) && /redirect\(/.test(route));
  check("/admin/cotizador responde private, no-store y noindex", /private, no-store/.test(route) && /noindex/.test(route));
  check("/admin/cotizador usa el nonce del middleware", /x-nonce/.test(route));
  check("/admin/cotizador cae en la CSP ESTRICTA", isDynamicRoute("/admin/cotizador"));
  const csp = buildStrictCsp("0".repeat(32), false);
  check(
    "la CSP estricta no permite inline ni eval y bloquea marcos/objetos",
    !(csp.split("; ").find((d) => d.startsWith("script-src")) ?? "unsafe-inline").includes("unsafe-inline") &&
      !/unsafe-eval/.test(csp) &&
      /frame-ancestors 'none'/.test(csp) &&
      /object-src 'none'/.test(csp) &&
      /form-action 'self'/.test(csp),
  );

  const api = read("src", "app", "api", "admin", "cotizador", "workspace", "route.ts");
  check("API GET exige sesión admin", /export async function GET[\s\S]*getAdminFromRequest/.test(api));
  check("API PUT exige sesión + CSRF", /export async function PUT[\s\S]*requireAdminMutation/.test(api));
  check("API responde private, no-store", /private, no-store/.test(api));
  check("API aplica límite de guardado propio", /adminQuoteWorkspaceSave/.test(api));

  const doc = read("src", "lib", "admin-cotizador", "document.ts");
  check("el documento lleva noindex", /name="robots" content="noindex, nofollow"/.test(doc));
  check("los <script> del documento llevan nonce", (doc.match(/<script nonce="\$\{nonce\}">/g) ?? []).length === 2);

  const migrations = readdirSync(join(ROOT, "supabase", "migrations")).filter((f) => f.endsWith("_admin_quote_workspace.sql"));
  check("existe la migración admin_quote_workspace", migrations.length === 1);
  // Sin comentarios: sólo cuenta el SQL que se ejecuta.
  const sql = (migrations[0] ? read("supabase", "migrations", migrations[0]) : "").replace(/--.*$/gm, "");
  check("RLS habilitada y forzada", /enable row level security/.test(sql) && /force row level security/.test(sql));
  check("sin policies (deny-all)", !/create policy/i.test(sql));
  check(
    "revoca todo a public, anon y authenticated",
    ["public", "anon", "authenticated"].every((r) => new RegExp(`revoke all on table public\\.admin_quote_workspace from ${r};`).test(sql)),
  );
  check(
    "sólo service_role recibe permisos",
    /grant select, insert, update on table public\.admin_quote_workspace to service_role;/.test(sql) &&
      (sql.match(/\bgrant\b/gi) ?? []).length === 1,
  );
  check("la migración no es destructiva", !/\b(drop|truncate|delete from)\b/i.test(sql));

  const nav = read("src", "components", "admin", "AdminNav.tsx");
  check("AdminNav enlaza al cotizador", nav.includes('"/admin/cotizador"'));
  check("el resumen admin enlaza al cotizador", read("src", "app", "admin", "page.tsx").includes('href="/admin/cotizador"'));
  check("no se usa la service role en el cliente del cotizador", !/service_role|SUPABASE/i.test(adapter));
  check("next.config traza las fuentes privadas en el deployment", /outputFileTracingIncludes[\s\S]*admin-cotizador\/legacy/.test(read("next.config.ts")));
  check("el HTML original no se copió a public/", !existsSync(join(ROOT, "public", "MatrixLab_Cotizador_v4_4.html")));
}

concurrencySuite().then(() => {
  invariantsSuite();
  console.log(failures === 0 ? "\nTodo OK." : `\n${failures} fallo(s).`);
  process.exit(failures === 0 ? 0 : 1);
});
