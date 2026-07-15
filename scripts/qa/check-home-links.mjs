#!/usr/bin/env node
/**
 * QA de navegación: recorre todos los `href` internos visibles de una página
 * (por defecto `/`) y verifica que ninguno responda 404/5xx. También valida
 * que las anclas (`/#seccion`) apunten a un id que exista en el HTML.
 *
 * Uso:
 *   node scripts/qa/check-home-links.mjs [baseUrl] [rutas extra...]
 *   node scripts/qa/check-home-links.mjs http://localhost:3000 / /tienda
 *
 * Sale con código 1 si encuentra cualquier link roto (404/5xx o ancla
 * inexistente): pensado para correr en QA local o CI con el server arriba.
 */

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const pages = process.argv.length > 3 ? process.argv.slice(3) : ["/"];

/** Extrae los href de anchors del HTML (suficiente para HTML server-rendered). */
function extractHrefs(html) {
  const hrefs = new Set();
  const re = /<a\b[^>]*?href="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) hrefs.add(m[1]);
  return [...hrefs];
}

function isInternal(href) {
  if (href.startsWith("/")) return true;
  if (href.startsWith(base)) return true;
  return false;
}

async function fetchPage(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "MatrixLab-QA-LinkChecker" },
  });
  const html = res.ok ? await res.text() : "";
  return { status: res.status, html, finalUrl: res.url };
}

const results = [];
const checkedTargets = new Map(); // path → {status, html}

async function checkTarget(path) {
  if (checkedTargets.has(path)) return checkedTargets.get(path);
  const { status, html } = await fetchPage(base + path);
  const entry = { status, html };
  checkedTargets.set(path, entry);
  return entry;
}

let failures = 0;

for (const page of pages) {
  const { status, html } = await checkTarget(page);
  if (status >= 400) {
    console.error(`✗ página base ${page} → ${status}`);
    failures += 1;
    continue;
  }
  const hrefs = extractHrefs(html).filter(isInternal);
  console.log(`\n== ${page} — ${hrefs.length} links internos ==`);
  for (const href of hrefs.sort()) {
    const raw = href.startsWith(base) ? href.slice(base.length) : href;
    const [path, hash] = raw.split("#");
    const targetPath = path === "" ? "/" : path;
    const target = await checkTarget(targetPath);
    let ok = target.status < 400;
    let note = String(target.status);
    if (ok && hash) {
      const idRe = new RegExp(`id="${hash}"`);
      if (!idRe.test(target.html)) {
        ok = false;
        note = `${target.status} pero no existe id="${hash}"`;
      } else {
        note = `${target.status} + ancla #${hash} OK`;
      }
    }
    console.log(`${ok ? "✓" : "✗"} ${raw} → ${note}`);
    if (!ok) failures += 1;
  }
}

console.log(
  failures === 0
    ? "\nTodos los links internos responden sin 404 y las anclas existen."
    : `\n${failures} link(s) rotos.`,
);
process.exit(failures === 0 ? 0 : 1);
