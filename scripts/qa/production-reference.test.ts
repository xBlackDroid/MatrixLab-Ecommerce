/**
 * Recibo de RECUPERACIÓN ACUMULATIVA.
 *
 * El 27/10/2026 producción corría un despliegue CLI (dpl_2aZrvYwCLTPqVr1yY6V5zTZQxrwH)
 * cuyo código NO estaba en `main`. El PR #7 (cotizador) se fusionó sobre el
 * `main` viejo y redesplegó, perdiendo funciones aprobadas. Este repositorio
 * restaura ese snapshot exacto y le suma el cotizador.
 *
 * Este QA impide que vuelva a pasar en silencio:
 *   1. Cada archivo del snapshot de producción existe y su SHA-1 coincide
 *      (tal cual, o con finales de línea CRLF→LF: Git guarda LF), salvo los
 *      archivos de integración enumerados abajo.
 *   2. Los archivos de integración conservan las piezas del snapshot que no
 *      deben perderse (p. ej. Distribuidores en el menú) y suman el cotizador.
 *   3. Todo archivo versionado es del snapshot, o del cotizador (lista
 *      cerrada), o metadatos del repo. Nada viejo de `main` se cuela.
 *
 * Correr con: npx tsx scripts/qa/production-reference.test.ts
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");
const RECEIPT = "scripts/qa/fixtures/production-reference-dpl_2aZrvYwCLTPqVr1yY6V5zTZQxrwH.json";

type Entry = { path: string; sha1: string; sha1Lf?: string };
const receipt = JSON.parse(readFileSync(join(ROOT, RECEIPT), "utf8")) as {
  deploymentId: string;
  files: Entry[];
};

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

/** Archivos del snapshot modificados A PROPÓSITO para integrar el cotizador. */
const INTEGRATION_FILES: Record<string, { keep: string[]; add: string[] }> = {
  "next.config.ts": {
    keep: ["/distribuidores/escanear", "/admin/distribuidores/:path*", "securityHeaders"],
    add: ["outputFileTracingIncludes", "./src/lib/admin-cotizador/legacy/**/*"],
  },
  "src/app/admin/page.tsx": {
    keep: ["requireAdminPage", "Pedidos recientes"],
    add: ['href="/admin/cotizador"'],
  },
  "src/components/admin/AdminNav.tsx": {
    keep: ["consignmentsEnabled", "/admin/distribuidores", "Distribuidores", "/admin/disenos"],
    add: ['"/admin/cotizador"', "document: true", "aria-label"],
  },
  "src/lib/security/rate-limit.ts": {
    keep: ["courseRegistration", "adminLogin", "webhook"],
    add: ["adminQuoteWorkspaceSave"],
  },
};

/** Archivos que suma el cotizador (no existen en el snapshot). */
const COTIZADOR_FILES = new Set([
  "docs/ADMIN_COTIZADOR.md",
  "scripts/cotizador/import-legacy.mjs",
  "scripts/qa/admin-cotizador-workspace.test.ts",
  "scripts/qa/admin-cotizador.browser.test.ts",
  "scripts/qa/production-reference.test.ts",
  RECEIPT,
  "src/app/admin/cotizador/route.ts",
  "src/app/api/admin/cotizador/workspace/route.ts",
  "src/lib/admin-cotizador/document.ts",
  "src/lib/admin-cotizador/legacy/adapter.css",
  "src/lib/admin-cotizador/legacy/adapter.js",
  "src/lib/admin-cotizador/legacy/calculator.js",
  "src/lib/admin-cotizador/legacy/markup.html",
  "src/lib/admin-cotizador/legacy/styles.css",
  "src/lib/admin-cotizador/schema.ts",
  "src/lib/admin-cotizador/workspace-core.ts",
  "src/lib/admin-cotizador/workspace-store.ts",
  "supabase/migrations/20261027185726_admin_quote_workspace.sql",
]);

/** Metadatos del repo que el despliegue CLI no sube. */
const REPO_META = new Set([".gitignore", ".env.example"]);

const sha1 = (buf: Buffer | string) => createHash("sha1").update(buf).digest("hex");

console.log(`\n--- Snapshot de producción ${receipt.deploymentId} (${receipt.files.length} archivos) ---`);
const mismatched: string[] = [];
const missing: string[] = [];
let exact = 0;
let eolOnly = 0;
for (const entry of receipt.files) {
  const file = join(ROOT, entry.path);
  if (!existsSync(file)) {
    missing.push(entry.path);
    continue;
  }
  if (entry.path in INTEGRATION_FILES) continue;
  const buf = readFileSync(file);
  const raw = sha1(buf);
  if (raw === entry.sha1) {
    exact += 1;
    continue;
  }
  // Una copia en Windows con core.autocrlf vuelve a poner CRLF: se normaliza.
  const lf = sha1(Buffer.from(buf.toString("latin1").replace(/\r\n/g, "\n"), "latin1"));
  if (entry.sha1Lf && lf === entry.sha1Lf) eolOnly += 1;
  else if (lf === entry.sha1) exact += 1;
  else mismatched.push(entry.path);
}
const expected = receipt.files.length - Object.keys(INTEGRATION_FILES).length;
check("ningún archivo del snapshot falta", missing.length === 0, missing.slice(0, 10).join(", "));
check(
  `${expected} archivos del snapshot idénticos (${exact} exactos + ${eolOnly} sólo CRLF→LF)`,
  mismatched.length === 0 && exact + eolOnly === expected,
  mismatched.slice(0, 10).join(", "),
);

console.log("\n--- Archivos de integración (snapshot + cotizador) ---");
for (const [path, rules] of Object.entries(INTEGRATION_FILES)) {
  const source = readFileSync(join(ROOT, path), "utf8");
  const lost = rules.keep.filter((s) => !source.includes(s));
  const absent = rules.add.filter((s) => !source.includes(s));
  check(`${path} conserva lo del snapshot`, lost.length === 0, lost.join(", "));
  check(`${path} suma el cotizador`, absent.length === 0, absent.join(", "));
}

console.log("\n--- Nada fuera de la lista ---");
const reference = new Set(receipt.files.map((f) => f.path));
let tracked: string[] = [];
try {
  tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/);
} catch {
  console.log("(sin git: se omite la verificación de archivos versionados)");
}
if (tracked.length) {
  const extra = tracked.filter((f) => !reference.has(f) && !COTIZADOR_FILES.has(f) && !REPO_META.has(f));
  check("todo archivo versionado es del snapshot, del cotizador o metadato", extra.length === 0, extra.join(", "));
  const notTracked = [...COTIZADOR_FILES].filter((f) => !tracked.includes(f));
  check("los archivos del cotizador están versionados", notTracked.length === 0, notTracked.join(", "));
}

console.log(failures === 0 ? "\nTodo OK." : `\n${failures} fallo(s).`);
process.exit(failures === 0 ? 0 : 1);
