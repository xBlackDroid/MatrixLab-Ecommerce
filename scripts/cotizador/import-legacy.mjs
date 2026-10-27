/**
 * Importa el cotizador standalone (MatrixLab_Cotizador_vX.html) al proyecto.
 *
 * Uso:
 *   node scripts/cotizador/import-legacy.mjs "<ruta al HTML original>"
 *
 * Escribe en src/lib/admin-cotizador/legacy/:
 *   - styles.css     → el <style> original, VERBATIM.
 *   - calculator.js  → el <script> original, VERBATIM (fórmulas intactas; el
 *                      QA compara su SHA-256 contra el original).
 *   - markup.html    → el <body> sin el <script>, con estas adaptaciones
 *                      mecánicas y nada más:
 *       1. Cada `onclick/onchange/oninput="fn(args)"` se vuelve
 *          `data-ml-click='["fn",args…]'`. La CSP estricta del panel (nonce +
 *          strict-dynamic, sin 'unsafe-inline') bloquea los handlers en línea;
 *          `adapter.js` los despacha con un listener delegado. `this` se
 *          codifica como "$this" y `this.value` como "$value".
 *       2. Los chips `<div class="chip">` pasan a `<button type="button">`
 *          para que sean alcanzables con teclado.
 *       3. Botones de cantidad / folio / borrar reciben aria-label.
 *       4. Los `<input type="number">` reciben inputmode (numeric si el
 *          paso es entero, decimal si no) para el teclado correcto en iOS.
 *
 * El HTML original NO se modifica. Si aparece un handler con una forma no
 * prevista, el script falla en vez de adivinar.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "src", "lib", "admin-cotizador", "legacy");

const source = process.argv[2];
if (!source) {
  console.error("Falta la ruta al HTML original.");
  process.exit(1);
}
const html = readFileSync(source, "utf8");

function between(text, open, close) {
  const start = text.indexOf(open);
  const end = text.indexOf(close, start + open.length);
  if (start < 0 || end < 0) throw new Error(`No se encontró ${open}…${close}`);
  return { start, end, inner: text.slice(start + open.length, end) };
}

const style = between(html, "<style>", "</style>").inner;
const body = between(html, "<body>", "</body>").inner;
const scriptBlock = between(body, "<script>", "</script>");
const script = scriptBlock.inner;
let markup = body.slice(0, scriptBlock.start);

// ---------------------------------------------------------------------------
// 1. Handlers en línea → data-ml-*
// ---------------------------------------------------------------------------
function parseArg(token) {
  const t = token.trim();
  if (t === "this") return "$this";
  if (t === "this.value") return "$value";
  if (t === "true") return true;
  if (t === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  const quoted = /^'([^'\\]*)'$/.exec(t);
  if (quoted) return quoted[1];
  throw new Error(`Argumento no soportado: ${t}`);
}

function toSpec(code) {
  const margin =
    /^document\.getElementById\('([\w-]+)-lbl'\)\.textContent=this\.value\+'%';(\w+)\(\)$/.exec(
      code,
    );
  if (margin) return ["setMargen", "$this", margin[2]];
  const call = /^(\w+)\((.*)\)$/.exec(code);
  if (!call) throw new Error(`Handler no soportado: ${code}`);
  const args = call[2].trim() === "" ? [] : call[2].split(",").map(parseArg);
  return [call[1], ...args];
}

let handlerCount = 0;
markup = markup.replace(/\son(click|change|input)="([^"]*)"/g, (_, event, code) => {
  handlerCount += 1;
  const spec = JSON.stringify(toSpec(code));
  if (spec.includes("'")) throw new Error(`Comilla simple en ${spec}`);
  return ` data-ml-${event}='${spec}'`;
});
if (/\son[a-z]+=/i.test(markup)) {
  throw new Error("Quedó algún handler en línea sin convertir.");
}

// ---------------------------------------------------------------------------
// 2. Chips → <button type="button">
// ---------------------------------------------------------------------------
let chipCount = 0;
markup = markup.replace(
  /<div class="chip( active)?"([^>]*)>([\s\S]*?)<\/div>/g,
  (_, active, attrs, inner) => {
    chipCount += 1;
    return `<button type="button" class="chip${active ?? ""}"${attrs}>${inner}</button>`;
  },
);

// ---------------------------------------------------------------------------
// 3. aria-labels de controles sin texto descriptivo
// ---------------------------------------------------------------------------
markup = markup.replace(
  /<button class="qty-btn"([^>]*)>([−+])<\/button>/g,
  (_, attrs, sign) =>
    `<button type="button" class="qty-btn" aria-label="${
      sign === "+" ? "Aumentar cantidad" : "Disminuir cantidad"
    }"${attrs}>${sign}</button>`,
);
markup = markup.replace(
  /<button class="btn btn-outline btn-sm"([^>]*data-ml-click='\["(prev|next)(Cot|Rec)Num"\]'[^>]*)>([‹›])<\/button>/g,
  (_, attrs, dir, kind, glyph) =>
    `<button type="button" class="btn btn-outline btn-sm" aria-label="${
      dir === "prev" ? "Folio anterior" : "Folio siguiente"
    } de ${kind === "Cot" ? "cotización" : "recibo"}"${attrs}>${glyph}</button>`,
);
markup = markup.replace(
  /(<button class="btn btn-outline btn-sm"[^>]*clearSavedCots[^>]*)( title="[^"]*")>/,
  '$1$2 aria-label="Borrar lista de cotizaciones guardadas">',
);
// El resto de <button> sin type explícito: type="button" (no hay formularios,
// pero así ninguno envía nada si algún día se envuelve en uno).
markup = markup.replace(/<button (?!type=)/g, '<button type="button" ');

// ---------------------------------------------------------------------------
// 4. inputmode para teclados numéricos en iOS
// ---------------------------------------------------------------------------
// Teclado de enteros SÓLO para conteos de piezas. Precios, costos, medidas y
// fees llevan decimal aunque su `step` sea entero: un costo de $59.50 tiene
// que poder escribirse (inputmode="numeric" en iOS no trae punto decimal).
const COUNT_INPUT_IDS = new Set([
  "ts-mixto-inf",
  "ts-mixto-adu",
  "cl-mixto-eco",
  "cl-mixto-prem",
  "plan-pph-num",
]);
markup = markup.replace(/<input type="number"([^>]*)>/g, (tag, attrs) => {
  if (/inputmode=/.test(attrs)) return tag;
  const id = /id="([^"]+)"/.exec(attrs)?.[1] ?? "";
  const isCount = /class="qty-input"/.test(attrs) || COUNT_INPUT_IDS.has(id);
  return `<input type="number" inputmode="${isCount ? "numeric" : "decimal"}"${attrs}>`;
});

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "styles.css"), style);
writeFileSync(join(OUT, "calculator.js"), script);
writeFileSync(join(OUT, "markup.html"), markup.trim() + "\n");

const sha = createHash("sha256").update(script).digest("hex");
console.log(
  `OK · ${handlerCount} handlers convertidos · ${chipCount} chips · calculator.js sha256=${sha}`,
);
