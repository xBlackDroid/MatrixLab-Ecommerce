/**
 * QA de NAVEGADOR del cotizador admin (/admin/cotizador).
 *
 * Levanta `next start` (requiere `next build` previo) con un secreto de sesión
 * ALEATORIO generado aquí y SIN Supabase: la sesión admin se valida sólo por
 * firma (modo sin base de datos), así que se usa una sesión sintética local
 * sin tocar el login real ni datos de producción. La API de la nube se
 * sustituye con un stub (page.route) para probar guardar / restaurar /
 * conflicto / error. Nada de esto imprime secretos.
 *
 * Verifica:
 *   - paridad de fórmulas, tarjetas de resultado y PDFs contra el HTML
 *     original (si está disponible; ruta en COTIZADOR_ORIGINAL_HTML);
 *   - tarjetas de línea en iPhone, edición de totales, borrar, recibos;
 *   - PDF integrado / individual / recibo interceptando window.print;
 *   - objetivos táctiles ≥44px, campos ≥16px, sin overflow horizontal;
 *   - nube: restaurar, guardar, 409, error, borrador local, sin pisar cambios;
 *   - cero errores de runtime y cero violaciones de CSP.
 *
 * Uso: npx tsx scripts/qa/admin-cotizador.browser.test.ts
 */
import { spawn, type ChildProcess } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  chromium,
  devices,
  webkit,
  type Browser,
  type BrowserContext,
  type Page,
  type Route,
} from "@playwright/test";
import { parseWorkspaceSave } from "../../src/lib/admin-cotizador/schema";
import { formatFolio, parseFolioReserve } from "../../src/lib/admin-cotizador/folios";

const ROOT = join(__dirname, "..", "..");
const PORT = 3000 + Math.floor(Math.random() * 500) + 3200;
const BASE = `http://localhost:${PORT}`;
const ORIGINAL =
  process.env.COTIZADOR_ORIGINAL_HTML ??
  "C:/Users/casta/iCloudDrive/MatrixLab Images/Cotizaciones/MatrixLab_Cotizador_v4_4.html";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

// ---------------------------------------------------------------------------
// Servidor local + sesión sintética
// ---------------------------------------------------------------------------
const SECRET = randomBytes(36).toString("base64url");
const CSRF = randomBytes(18).toString("base64url");

function adminCookie(): string {
  const payload = {
    sid: randomBytes(18).toString("base64url"),
    csrf: CSRF,
    exp: Math.floor(Date.now() / 1000) + 3600,
    v: 1,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

async function startServer(): Promise<ChildProcess> {
  const env: NodeJS.ProcessEnv = { ...process.env, ADMIN_SESSION_SECRET: SECRET, NODE_ENV: "production", PORT: String(PORT) };
  for (const key of Object.keys(env)) {
    if (/SUPABASE|DATABASE_URL|MERCADOPAGO/i.test(key)) delete env[key];
  }
  const child = spawn(process.execPath, [join(ROOT, "node_modules", "next", "dist", "bin", "next"), "start", "-p", String(PORT)], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "ignore", "pipe"],
  });
  child.stderr?.on("data", () => { /* no imprimir: podría incluir rutas/env */ });
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`${BASE}/admin/login`, { redirect: "manual" });
      if (res.status > 0) return child;
    } catch { /* aún no arranca */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill();
  throw new Error("El servidor local no arrancó");
}

// ---------------------------------------------------------------------------
// Utilidades de página
// ---------------------------------------------------------------------------
type Problems = { errors: string[] };

const INIT_SCRIPT = `
  window.__prints = [];
  window.__csp = [];
  window.print = function () {
    window.__prints.push(document.getElementById('print-template').innerHTML);
  };
  document.addEventListener('securitypolicyviolation', function (e) {
    window.__csp.push(e.violatedDirective + ' ' + e.blockedURI);
  });
`;

async function newContext(browser: Browser, opts: Parameters<Browser["newContext"]>[0] = {}): Promise<BrowserContext> {
  const ctx = await browser.newContext({ ...opts, baseURL: BASE });
  await ctx.addCookies([{ name: "ml_admin", value: adminCookie(), url: BASE, httpOnly: true, sameSite: "Lax" }]);
  await ctx.addInitScript(INIT_SCRIPT);
  return ctx;
}

function track(page: Page, problems: Problems, label: string) {
  page.on("pageerror", (e) => problems.errors.push(`${label} pageerror: ${e.message}`));
  page.on("console", (m) => {
    // Las respuestas 409/500/503 que el stub devuelve a propósito generan un
    // "Failed to load resource" en consola: es el escenario probado, no un bug.
    if (m.type() !== "error") return;
    if (m.location().url.includes("/api/admin/cotizador/")) return;
    problems.errors.push(`${label} console: ${m.text()}`);
  });
  page.on("dialog", (d) => d.accept());
}

async function cspViolations(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
}

/** Stub de la API de la nube con estado. */
class CloudStub {
  version = 0;
  snapshot: unknown = null;
  updatedAt: string | null = null;
  puts: Array<{ baseVersion: number; snapshot: unknown; csrf: string | null }> = [];
  nextPut: { status: number; body?: Record<string, unknown> } | null = null;
  getStatus = 200;

  async handle(route: Route) {
    const req = route.request();
    if (req.method() === "GET") {
      if (this.getStatus !== 200) {
        return route.fulfill({ status: this.getStatus, contentType: "application/json", body: JSON.stringify({ ok: false, code: "NOT_CONFIGURED", error: "x" }) });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, version: this.version, snapshot: this.version ? this.snapshot : null, updatedAt: this.updatedAt }),
      });
    }
    const body = JSON.parse(req.postData() ?? "{}");
    this.puts.push({ baseVersion: body.baseVersion, snapshot: body.snapshot, csrf: req.headers()["x-ml-csrf"] ?? null });
    if (this.nextPut) {
      const forced = this.nextPut;
      this.nextPut = null;
      return route.fulfill({ status: forced.status, contentType: "application/json", body: JSON.stringify(forced.body ?? { ok: false }) });
    }
    if (!parseWorkspaceSave(body).ok) {
      return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ ok: false, code: "INVALID" }) });
    }
    if (body.baseVersion !== this.version) {
      return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ ok: false, code: "VERSION_CONFLICT", currentVersion: this.version, updatedAt: this.updatedAt }) });
    }
    this.version += 1;
    this.snapshot = body.snapshot;
    this.updatedAt = new Date().toISOString();
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, version: this.version, updatedAt: this.updatedAt }) });
  }
}

/**
 * Stub de /api/admin/cotizador/folios con la semántica del servidor: valida
 * con el MISMO Zod, exige CSRF, idempotencia por UUID + huella, y sólo el
 * stub elige el número (contador global compartido entre "dispositivos").
 */
class FolioStub {
  lastIssued = 38;
  getStatus = 200;
  reservations = new Map<string, { first: number; count: number; fingerprint: string }>();
  posts: Array<{ requestId: string; mode: string; count: number; csrf: string | null; valid: boolean }> = [];
  /** Paridad con el original: devuelve siempre este folio inicial, sin contador. */
  fixedFirst: number | null = null;
  /** Respuesta forzada al siguiente POST (no reserva nada). */
  nextPost: { status: number; body?: Record<string, unknown> } | null = null;
  /** Reserva y luego corta la conexión: respuesta perdida. */
  dropNext = false;
  /** Corta la conexión sin reservar (sin red). */
  abortNext = false;
  /** Nunca responde (timeout del cliente). */
  hang = false;
  delayMs = 0;

  async handle(route: Route) {
    const req = route.request();
    if (req.method() === "GET") {
      if (this.getStatus !== 200) {
        return route.fulfill({ status: this.getStatus, contentType: "application/json", body: JSON.stringify({ ok: false }) });
      }
      return route.fulfill({ json: { ok: true, lastIssued: this.lastIssued, next: this.lastIssued + 1, nextFolio: formatFolio(this.lastIssued + 1) } });
    }
    const body = JSON.parse(req.postData() ?? "{}");
    const parsed = parseFolioReserve(body);
    const csrf = req.headers()["x-ml-csrf"] ?? null;
    this.posts.push({ requestId: body.requestId, mode: body.mode, count: parsed.ok ? parsed.count : 0, csrf, valid: parsed.ok });
    if (this.hang) return;
    if (this.abortNext) { this.abortNext = false; return route.abort("failed"); }
    if (this.nextPost) {
      const forced = this.nextPost;
      this.nextPost = null;
      return route.fulfill({ status: forced.status, contentType: "application/json", body: JSON.stringify(forced.body ?? { ok: false }) });
    }
    if (csrf !== CSRF) return route.fulfill({ status: 401, json: { ok: false, code: "UNAUTHORIZED" } });
    if (!parsed.ok) return route.fulfill({ status: 400, json: { ok: false, code: "INVALID" } });
    if (this.delayMs) await new Promise((r) => setTimeout(r, this.delayMs));
    let replayed = false;
    let first: number;
    const prior = this.reservations.get(parsed.request.requestId);
    if (prior) {
      if (prior.count !== parsed.count || prior.fingerprint !== parsed.fingerprint) {
        return route.fulfill({ status: 409, json: { ok: false, code: "IDEMPOTENCY_CONFLICT" } });
      }
      first = prior.first;
      replayed = true;
    } else if (this.fixedFirst !== null) {
      first = this.fixedFirst;
      this.lastIssued = Math.max(this.lastIssued, first + parsed.count - 1);
    } else {
      first = this.lastIssued + 1;
      this.lastIssued += parsed.count;
      this.reservations.set(parsed.request.requestId, { first, count: parsed.count, fingerprint: parsed.fingerprint });
    }
    if (this.dropNext) { this.dropNext = false; return route.abort("failed"); }
    const folios = Array.from({ length: parsed.count }, (_, i) => formatFolio(first + i));
    return route.fulfill({ json: { ok: true, first, count: parsed.count, folios, lastIssued: this.lastIssued, next: this.lastIssued + 1, replayed } });
  }
}

async function openCotizador(ctx: BrowserContext, stub: CloudStub, problems: Problems, label: string, folios = new FolioStub(), beforeGoto?: (page: Page) => Promise<unknown>): Promise<Page> {
  const page = await ctx.newPage();
  track(page, problems, label);
  if (beforeGoto) await beforeGoto(page);
  await page.route("**/api/admin/cotizador/workspace", (route) => stub.handle(route));
  await page.route("**/api/admin/cotizador/folios", (route) => folios.handle(route));
  await page.goto("/admin/cotizador");
  await page.waitForFunction(() => {
    const s = document.getElementById("mlz-status");
    return s && s.getAttribute("data-state") !== "loading";
  });
  return page;
}

const statusOf = (page: Page) => page.locator("#mlz-status").getAttribute("data-state");

// ---------------------------------------------------------------------------
// Escenarios de paridad (se ejecutan igual en el original y en el adaptado)
// ---------------------------------------------------------------------------
type Step =
  | { page: string }
  | { chip: string; text: string }
  | { tab: string; text: string }
  | { fill: string; value: string }
  | { check: string; on: boolean }
  | { range: string; value: string }
  | { qty: string; times: number };

async function runStep(page: Page, step: Step, mobile: boolean) {
  if ("page" in step) {
    if (mobile) await page.selectOption("#mlz-module", step.page);
    else await page.click(`.main-tab[data-page="${step.page}"]`);
  } else if ("chip" in step) {
    await page.locator(`${step.chip} .chip`, { hasText: step.text }).first().click();
  } else if ("tab" in step) {
    await page.locator(`${step.tab} .sub-tab`, { hasText: step.text }).first().click();
  } else if ("fill" in step) {
    await page.fill(`#${step.fill}`, step.value);
    await page.dispatchEvent(`#${step.fill}`, "change");
  } else if ("check" in step) {
    await page.setChecked(`#${step.check}`, step.on);
  } else if ("range" in step) {
    await page.$eval(`#${step.range}`, (el, v) => {
      (el as HTMLInputElement).value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, step.value);
  } else if ("qty" in step) {
    for (let i = 0; i < step.times; i++) await page.click(step.qty);
  }
}

const SCENARIOS: Array<{ name: string; steps: Step[] }> = [
  { name: "estado inicial", steps: [] },
  {
    name: "dulceros completo",
    steps: [
      { page: "dulceros" },
      { chip: "#page-dulceros", text: "Dulcero lunchera" },
      { check: "chk-liston", on: true },
      { check: "chk-agra", on: true },
      { chip: "#agra-opts", text: "6×12" },
      { check: "chk-sticker", on: true },
      { chip: "#sticker-opts", text: "Vinil transparente" },
      { fill: "sticker-size", value: "4" },
      { qty: '#page-dulceros .qty-btn >> nth=1', times: 3 },
      { range: "margen-d", value: "55" },
    ],
  },
  {
    name: "tatuajes station + kit",
    steps: [
      { page: "tattoo" },
      { chip: "#ts-size-chips", text: "5 cm" },
      { chip: "#ts-pkg-chips", text: "Personalizado" },
      { qty: "#ts-custom-qty .qty-btn >> nth=1", times: 2 },
      { check: "chk-ts-diseno", on: false },
      { tab: "#page-tattoo", text: "Bolsas Tattoo Kit" },
      { chip: "#tk-size-chips", text: "3 cm" },
      { chip: "#tk-pkg-chips", text: "Max" },
      { range: "margen-tk", value: "60" },
    ],
  },
  {
    name: "t-shirt mixto",
    steps: [
      { page: "tshirt" },
      { chip: "#tshirt-tipo-chips", text: "Mixto" },
      { fill: "ts-mixto-inf", value: "6" },
      { fill: "ts-mixto-adu", value: "9" },
      { fill: "qty-tshirt", value: "25" },
      { check: "chk-talla-esp", on: true },
      { fill: "ts-area", value: "450" },
      { fill: "ts-mdo", value: "600" },
    ],
  },
  {
    name: "cap lab mixto",
    steps: [
      { page: "caplab" },
      { chip: "#caplab-gorra-chips", text: "Camionera" },
      { chip: "#caplab-parche-chips", text: "Mixto" },
      { fill: "cl-mixto-eco", value: "4" },
      { fill: "cl-mixto-prem", value: "6" },
      { fill: "qty-caplab", value: "15" },
    ],
  },
  {
    name: "prendas tote custom",
    steps: [
      { page: "prendas" },
      { chip: "#prendas-tipo-chips", text: "Tote bag" },
      { qty: "#page-prendas .qty-btn >> nth=1", times: 3 },
      { chip: "#area-chips", text: "Custom" },
      { fill: "p-area-custom", value: "420" },
      { check: "chk-p-talla-esp", on: true },
    ],
  },
  {
    name: "stickers troquelado / planilla / UV",
    steps: [
      { page: "stickers" },
      { chip: "#stk-mat-chips", text: "Holo texturizado" },
      { chip: "#stk-lam-chips", text: "Texturizado" },
      { chip: "#stk-cut-chips", text: "Design Space" },
      { fill: "stk-w", value: "4" },
      { fill: "stk-h", value: "6" },
      { fill: "qty-stk", value: "120" },
      { tab: "#page-stickers", text: "Planillas" },
      { chip: "#stk-mat-chips", text: "Papel magnético" },
      { chip: "#plan-pph-chips", text: "4 planillas" },
      { tab: "#page-stickers", text: "Etiquetas UV" },
      { fill: "uv-w", value: "7" },
      { fill: "uv-h", value: "3.5" },
      { fill: "qty-uv", value: "200" },
    ],
  },
  {
    name: "imanes vinil de corte + resina",
    steps: [
      { page: "imanes" },
      { chip: "#imn-print-chips", text: "Vinil de corte" },
      { chip: "#imn-corte-chips", text: "Holográfico económico" },
      { chip: "#imn-acabado-chips", text: "Resina" },
      { fill: "imn-w", value: "8" },
      { fill: "imn-h", value: "6" },
    ],
  },
  {
    name: "accesorios tags + vasos",
    steps: [
      { page: "accesorios" },
      { chip: "#acc-tl-tipo-chips", text: "Tag redondo" },
      { check: "chk-acc-double-dtf", on: true },
      { check: "chk-acc-foto", on: true },
      { fill: "acc-foto-area", value: "15" },
      { check: "chk-acc-corte", on: true },
      { tab: "#page-accesorios", text: "Vasos" },
      { chip: "#acc-vaso-chips", text: "Tumbler 24oz tapa color" },
      { fill: "acc-v-agua", value: "200" },
      { fill: "acc-v-glitter", value: "3" },
      { fill: "acc-v-dtf-w", value: "6" },
      { fill: "acc-v-dtf-h", value: "4" },
    ],
  },
  {
    name: "láser con insumo + 3D PETG",
    steps: [
      { page: "fablab" },
      { check: "chk-laser-insumo", on: true },
      { fill: "laser-insumo-nombre", value: "Termo 20oz" },
      { fill: "laser-insumo-costo", value: "45" },
      { fill: "laser-consumible", value: "2" },
      { fill: "laser-min", value: "12.5" },
      { tab: "#page-fablab", text: "Impresión 3D" },
      { chip: "#fab-3d-fil-chips", text: "PETG" },
      { fill: "p3d-gramos", value: "120" },
      { fill: "p3d-horas", value: "4.5" },
      { fill: "p3d-post", value: "10" },
      { fill: "qty-p3d", value: "3" },
    ],
  },
  {
    name: "insumos personalizados",
    steps: [
      { page: "insumos" },
      { fill: "c-pvc", value: "13.2" },
      { fill: "c-dtf-uv-price", value: "500" },
      { fill: "c-3d-merma", value: "15" },
      { fill: "c-adu", value: "64.5" },
    ],
  },
];

async function readResults(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { PRICES: unknown; C: unknown };
    const grids: Record<string, string[]> = {};
    document.querySelectorAll(".res-grid").forEach((g) => {
      grids[g.id] = Array.from(g.querySelectorAll(".res-card")).map((c) => (c.textContent ?? "").replace(/\s+/g, " ").trim());
    });
    const notes: Record<string, string> = {};
    document.querySelectorAll("p.note[id], [id$='-desglose'], #stk-cut-note, #plan-pph-note").forEach((n) => {
      notes[n.id] = (n.textContent ?? "").trim();
    });
    return { prices: JSON.stringify(w.PRICES), costs: JSON.stringify(w.C), grids, notes };
  });
}

async function buildQuote(page: Page, mobile: boolean) {
  await runStep(page, { page: "stickers" }, mobile);
  await page.locator("#sub-stk-troquelado .add-cot-btn").click();
  await runStep(page, { page: "dulceros" }, mobile);
  await page.locator("#page-dulceros .add-cot-btn").click();
  await runStep(page, { page: "cotizacion" }, mobile);
  await page.fill("#cot-cliente", "Fiesta <Ana> & Co");
  await page.fill("#cot-tel", "55 1234 5678");
  await page.fill("#cot-lugar", "Salón Jardín");
  await page.fill("#cot-fecha-evento", "2026-11-14");
  await page.fill("#cot-notas", "Entrega: 5 días hábiles\nAnticipo del 50%");
}

async function parity(browser: Browser) {
  console.log("\n--- 1. Paridad con el HTML original ---");
  if (!existsSync(ORIGINAL)) {
    console.log(`(omitido: no existe ${ORIGINAL}; define COTIZADOR_ORIGINAL_HTML)`);
    return;
  }
  const problems: Problems = { errors: [] };
  const stub = new CloudStub();
  for (const scenario of SCENARIOS) {
    const ctxA = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctxA.addInitScript(INIT_SCRIPT);
    const original = await ctxA.newPage();
    original.on("dialog", (d) => d.accept());
    await original.goto("file:///" + ORIGINAL.replace(/\\/g, "/"));
    const ctxB = await newContext(browser, { viewport: { width: 1280, height: 900 } });
    const adapted = await openCotizador(ctxB, stub, problems, `paridad:${scenario.name}`);
    for (const step of scenario.steps) {
      await runStep(original, step, false);
      await runStep(adapted, step, false);
    }
    const [a, b] = await Promise.all([readResults(original), readResults(adapted)]);
    const gridDiff = Object.keys(a.grids).filter((k) => JSON.stringify(a.grids[k]) !== JSON.stringify(b.grids[k]));
    const noteDiff = Object.keys(a.notes).filter((k) => a.notes[k] !== b.notes[k]);
    check(`paridad PRICES · ${scenario.name}`, a.prices === b.prices);
    check(`paridad costos C · ${scenario.name}`, a.costs === b.costs);
    check(`paridad tarjetas de resultado · ${scenario.name}`, gridDiff.length === 0, gridDiff.join(", "));
    check(`paridad notas/desgloses · ${scenario.name}`, noteDiff.length === 0, noteDiff.join(", "));
    await ctxA.close();
    await ctxB.close();
  }

  // PDFs: misma cotización en ambos → mismo HTML de impresión.
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctxA.addInitScript(INIT_SCRIPT);
  const original = await ctxA.newPage();
  original.on("dialog", (d) => d.accept());
  await original.goto("file:///" + ORIGINAL.replace(/\\/g, "/"));
  const ctxB = await newContext(browser, { viewport: { width: 1280, height: 900 } });
  // Mismo folio de partida en ambos: el original muestra COT-003 y no lo
  // avanza tras imprimir; el servidor (stub) devuelve COT-003 en cada PDF.
  const parityFolios = new FolioStub();
  parityFolios.fixedFirst = 3;
  const adapted = await openCotizador(ctxB, stub, problems, "paridad:pdf", parityFolios);
  for (const page of [original, adapted]) {
    await buildQuote(page, false);
    await page.evaluate(() => { const w = window as any; w.COT.cotNum = 3; w.syncCotNum(w.getCotNumStr()); });
    await page.click("text=Cotización integrada");
    await page.waitForFunction(() => (window as any).__prints.length === 1);
    await page.click("text=Cotización individual");
    await page.waitForFunction(() => (window as any).__prints.length === 2);
    await runStep(page, { page: "recibos" }, false);
    await page.click("text=Cargar de cotización actual");
    await page.locator("#rec-pay-chips .chip", { hasText: "Transferencia" }).click();
    await page.selectOption("#rec-status", "anticipo");
    await page.fill("#rec-pay-ref", "OP-123");
    await page.click("text=Generar recibo PDF");
    await page.waitForFunction(() => (window as any).__prints.length === 3);
  }
  const [pa, pb] = await Promise.all([
    original.evaluate(() => (window as any).__prints as string[]),
    adapted.evaluate(() => (window as any).__prints as string[]),
  ]);
  check("PDF integrado idéntico al original", pa[0] === pb[0]);
  check("PDF individual (1 hoja por servicio) idéntico al original", pa[1] === pb[1]);
  check("PDF de recibo idéntico al original", pa[2] === pb[2]);
  check("el PDF escapa el texto del cliente", (pb[0] ?? "").includes("Fiesta &lt;Ana&gt; &amp; Co"));
  await ctxA.close();
  await ctxB.close();
  check("paridad sin errores de runtime", problems.errors.length === 0, problems.errors.slice(0, 3).join(" | "));
}

// ---------------------------------------------------------------------------
// iPhone: tarjetas, toque, tipografía, overflow, PDFs
// ---------------------------------------------------------------------------
async function overflowAt(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const w = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > w + 1) out.push(`documento ${document.documentElement.scrollWidth}>${w}`);
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (r.width === 0 || style.visibility === "hidden" || el.closest("#print-template")) return;
      if (r.right > w + 1 || r.left < -1) {
        const fixedAncestor = (el as HTMLElement).closest(".mlz-actions");
        if (!fixedAncestor) out.push(`${el.tagName.toLowerCase()}#${el.id || ""}.${(el.className || "").toString().split(" ")[0]} ${Math.round(r.left)}..${Math.round(r.right)}`);
      }
    });
    return out.slice(0, 5);
  });
}

async function touchProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const sel = "button, .chip, .main-tab, .sub-tab, .pill-opt, .qty-btn, .cot-del-btn, a.mlz-back, a.mlz-btn, select, input:not([type=checkbox]):not([type=file]):not([type=range]), .chk-row";
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || el.closest("#print-template") || el.offsetParent === null) return;
      if (r.height < 43.5 || r.width < 43.5) out.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}#${el.id} ${Math.round(r.width)}×${Math.round(r.height)}`);
    });
    return out;
  });
}

async function smallFonts(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("input, select, textarea"))
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
      .map((el) => `${el.tagName.toLowerCase()}#${el.id} ${getComputedStyle(el).fontSize}`)
      .slice(0, 5),
  );
}

async function mobileSuite(browser: Browser, engine: string) {
  console.log(`\n--- 2. iPhone (${engine}) ---`);
  const problems: Problems = { errors: [] };
  const stub = new CloudStub();
  const iphone = engine === "webkit" ? devices["iPhone 14"] : { ...devices["iPhone 14"], defaultBrowserType: undefined };
  const ctx = await newContext(browser, { ...iphone, defaultBrowserType: undefined } as never);
  const page = await openCotizador(ctx, stub, problems, `iphone-${engine}`);

  check(`[${engine}] estado vacío de la nube en español`, (await page.textContent("#mlz-status"))?.includes("Aún no hay nada guardado") ?? false);
  check(`[${engine}] selector de módulo visible y pestañas ocultas`, await page.isVisible("#mlz-module") && !(await page.isVisible(".main-tabs")));
  const options = await page.$$eval("#mlz-module option", (o) => o.map((x) => (x as HTMLOptionElement).value));
  check(`[${engine}] el selector alcanza los 12 módulos`, options.length === 12, options.join(","));

  // Objetivos táctiles y tipografía en cada módulo.
  const touchIssues: string[] = [];
  const fontIssues: string[] = [];
  for (const p of options) {
    await page.selectOption("#mlz-module", p);
    touchIssues.push(...(await touchProblems(page)).map((x) => `${p}: ${x}`));
    fontIssues.push(...(await smallFonts(page)));
  }
  check(`[${engine}] controles táctiles ≥44×44 en todos los módulos`, touchIssues.length === 0, touchIssues.slice(0, 6).join(" | "));
  check(`[${engine}] campos con texto ≥16px`, fontIssues.length === 0, fontIssues.join(" | "));
  const modes = await page.$$eval("#page-insumos input[type=number], #qty-tshirt, #cot-cliente", (els) => els.map((e) => `${e.id}:${e.getAttribute("inputmode")}`));
  check(`[${engine}] inputmode decimal en costos y numeric en cantidades`, modes.filter((m) => m.startsWith("c-")).every((m) => m.endsWith(":decimal")) && modes.includes("qty-tshirt:numeric"));

  // Cotización con líneas en tarjetas.
  await buildQuote(page, true);
  await page.click("text=+ Línea manual");
  const focusedDesc = await page.evaluate(() => (document.activeElement as HTMLElement)?.getAttribute("data-field"));
  check(`[${engine}] la línea manual nueva recibe el foco`, focusedDesc === "desc");
  await page.locator("#cot-lines-body .cot-line-row").nth(2).locator('[data-field="desc"]').fill("Diseño extra");
  await page.locator("#cot-lines-body .cot-line-row").nth(2).locator('[data-field="unitPrice"]').fill("150");
  const cards = await page.$$eval("#cot-lines-body .cot-line-row", (rows) =>
    rows.map((row) => {
      const labels = Array.from(row.querySelectorAll(".line-label")).map((l) => ({ text: l.textContent, visible: (l as HTMLElement).offsetWidth > 1 }));
      const del = row.querySelector(".cot-del-btn")!.getBoundingClientRect();
      return { labels, del: [del.width, del.height], aria: row.querySelector(".cot-del-btn")!.getAttribute("aria-label"), width: row.getBoundingClientRect().width };
    }),
  );
  check(`[${engine}] 3 líneas como tarjetas`, cards.length === 3);
  check(
    `[${engine}] cada tarjeta muestra Concepto/Cantidad/Precio unitario/Importe`,
    cards.every((c) => c.labels.map((l) => l.text).join("|") === "Concepto|Cantidad|Precio unitario|Importe" && c.labels.every((l) => l.visible)),
  );
  check(`[${engine}] borrar ≥44×44 con aria-label`, cards.every((c) => c.del[0]! >= 44 && c.del[1]! >= 44 && /^Eliminar línea \d/.test(c.aria ?? "")));
  const clipped = await page.$$eval("#cot-lines-body textarea[data-field=desc]", (els) =>
    els.filter((t) => (t as HTMLTextAreaElement).scrollHeight > (t as HTMLTextAreaElement).clientHeight + 1 || (t as HTMLTextAreaElement).scrollWidth > (t as HTMLTextAreaElement).clientWidth + 1).length);
  check(`[${engine}] los conceptos largos se leen completos en la tarjeta`, clipped === 0, String(clipped));
  check(`[${engine}] cabecera de tabla oculta en móvil`, !(await page.isVisible("#cot-lines-wrap .cot-line-header")));

  // Editar cantidad → importes y total se recalculan.
  const qtyInput = page.locator("#cot-lines-body .cot-line-row").nth(0).locator('[data-field="qty"]');
  await qtyInput.fill("80");
  await qtyInput.dispatchEvent("change");
  const totals = await page.evaluate(() => {
    const w = window as any;
    const sub = w.COT.lines.reduce((s: number, l: any) => s + l.qty * l.unitPrice, 0);
    return { expected: w.fmtK(sub), shown: document.getElementById("tot-total")!.textContent, rowTotal: document.querySelector("#cot-lines-body .cot-line-total")!.textContent, rowExpected: w.fmtK(w.COT.lines[0].qty * w.COT.lines[0].unitPrice), qty0: w.COT.lines[0].qty };
  });
  check(`[${engine}] editar cantidad actualiza importe y total`, totals.qty0 === 80 && totals.shown === totals.expected && totals.rowTotal === totals.rowExpected, JSON.stringify(totals));
  await page.click("text=Con IVA 16%");
  const iva = await page.evaluate(() => ({ visible: getComputedStyle(document.getElementById("iva-row")!).display !== "none", total: document.getElementById("tot-total")!.textContent }));
  check(`[${engine}] IVA visible y total sin cortes de línea`, iva.visible && /^\$[\d,]+$/.test(iva.total ?? ""));
  const totalBox = await page.$eval("#tot-total", (el) => el.getBoundingClientRect().height);
  check(`[${engine}] el total cabe en una línea`, totalBox < 44, String(totalBox));

  // Borrar la línea manual.
  await page.locator("#cot-lines-body .cot-line-row").nth(2).locator(".cot-del-btn").click();
  check(`[${engine}] borrar línea`, (await page.locator("#cot-lines-body .cot-line-row").count()) === 2);

  // PDFs por intercepción de window.print.
  await page.click("text=Cotización integrada");
  await page.waitForFunction(() => (window as any).__prints.length === 1);
  await page.click("text=Cotización individual");
  await page.waitForFunction(() => (window as any).__prints.length === 2);
  const prints = await page.evaluate(() => (window as any).__prints as string[]);
  check(`[${engine}] PDF integrado: 1 hoja con ambas líneas`, (prints[0]!.match(/class="pdf-page"/g) ?? []).length === 1 && prints[0]!.includes("COTIZACIÓN DE SERVICIO"));
  check(`[${engine}] PDF individual: 1 hoja por servicio con folios consecutivos`, (prints[1]!.match(/class="pdf-page/g) ?? []).length === 2 && /COT-\d{3}[\s\S]*COT-\d{3}/.test(prints[1]!));
  check(`[${engine}] folios del servidor: integrada COT-039, individual COT-040 y COT-041`, prints[0]!.includes(">COT-039<") && />COT-040<[\s\S]*>COT-041</.test(prints[1]!) && !prints[1]!.includes(">COT-039<"));
  check(`[${engine}] PDF con fecha real del evento`, prints[0]!.includes("14/11/2026"));
  const saved = await page.evaluate(() => (window as unknown as FolioWin).getSavedCots().map((s) => s.cotNum).join());
  // Cada folio emitido queda en el historial, sin reemplazos (folios únicos).
  check(`[${engine}] el historial guarda las cotizaciones generadas`, saved === "COT-041,COT-040,COT-039", saved);

  // Recibo desde la cotización actual.
  await page.selectOption("#mlz-module", "recibos");
  await page.click("text=Cargar de cotización actual");
  check(`[${engine}] recibo: líneas cargadas como tarjetas`, (await page.locator("#rec-lines-body .cot-line-row").count()) === 2);
  const recBefore = await page.textContent("#rec-num-display");
  await page.click("text=Generar recibo PDF");
  await page.waitForFunction(() => (window as any).__prints.length === 3);
  const recPdf = await page.evaluate(() => (window as any).__prints[2] as string);
  check(`[${engine}] PDF de recibo generado`, recPdf.includes("RECIBO DE PAGO") && recPdf.includes(recBefore ?? "??"));
  check(`[${engine}] folio de recibo avanza`, (await page.textContent("#rec-num-display")) !== recBefore);

  // Reserva inferior: lo último del contenido es alcanzable sobre la barra fija.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const reach = await page.evaluate(() => {
    const bar = document.getElementById("mlz-actions")!.getBoundingClientRect();
    const footer = document.querySelector("footer")!.getBoundingClientRect();
    return { barTop: bar.top, footerBottom: footer.bottom, fixed: getComputedStyle(document.getElementById("mlz-actions")!).position };
  });
  check(`[${engine}] barra de acciones fija y el final del contenido queda por encima`, reach.fixed === "fixed" && reach.footerBottom <= reach.barTop + 1, JSON.stringify(reach));

  // Overflow horizontal en anchos de iPhone y escritorio.
  for (const width of [320, 375, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 860 });
    const issues: string[] = [];
    for (const p of options) {
      await page.evaluate((pg) => (window as any).switchPage(pg), p);
      issues.push(...(await overflowAt(page)).map((x) => `${p}: ${x}`));
    }
    check(`[${engine}] sin overflow horizontal a ${width}px`, issues.length === 0, issues.slice(0, 4).join(" | "));
  }
  const cardWidth = await page.evaluate(() => getComputedStyle(document.querySelector("#rec-lines-body .cot-line-row")!).gridTemplateAreas);
  check(`[${engine}] a 1440px las líneas vuelven a ser filas de tabla`, cardWidth === "none");

  check(`[${engine}] sin violaciones de CSP`, (await cspViolations(page)).length === 0, (await cspViolations(page)).join(" | "));
  // El WebKit de Playwright en Windows no implementa <input type="date">, y la
  // última línea del original (`valueAsDate = …`) lanza InvalidStateError ahí
  // (también en el HTML original). En iOS Safari sí existe; se tolera SÓLO
  // ese error y sólo si el motor no soporta el tipo date.
  const noDateInput = await page.evaluate(() => { const i = document.createElement("input"); i.type = "date"; return i.type !== "date"; });
  const runtimeErrors = problems.errors.filter((e) => !(noDateInput && /pageerror: The object is in an invalid state/.test(e)));
  if (noDateInput) {
    check(`[${engine}] sin soporte de date: la fecha se rellena igual`, /^\d{4}-\d{2}-\d{2}$/.test(await page.inputValue("#rec-fecha-pago")));
  }
  check(`[${engine}] sin errores de runtime`, runtimeErrors.length === 0, runtimeErrors.slice(0, 3).join(" | "));
  await ctx.close();
}

// ---------------------------------------------------------------------------
// Nube: guardar, restaurar en otro dispositivo, conflicto, error, borrador
// ---------------------------------------------------------------------------
async function cloudSuite(browser: Browser) {
  console.log("\n--- 3. Nube (API sustituida por stub) ---");
  const problems: Problems = { errors: [] };
  const stub = new CloudStub();
  const iphone = { ...devices["iPhone 14"], defaultBrowserType: undefined } as never;

  // Dispositivo A: trabajo nuevo y guardado.
  const ctxA = await newContext(browser, iphone);
  const a = await openCotizador(ctxA, stub, problems, "nube-A");
  await runStep(a, { page: "tshirt" }, true);
  await runStep(a, { chip: "#tshirt-tipo-chips", text: "Infantil" }, true);
  await runStep(a, { fill: "qty-tshirt", value: "33" }, true);
  await a.locator("#page-tshirt .add-cot-btn").click();
  await runStep(a, { page: "insumos" }, true);
  await runStep(a, { fill: "c-inf", value: "52.5" }, true);
  await runStep(a, { page: "cotizacion" }, true);
  await a.fill("#cot-cliente", "Escuela Primavera");
  await a.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "dirty");
  check("cambios sin guardar visibles", (await a.textContent("#mlz-status"))?.includes("Sin guardar") ?? false);
  await a.click("#mlz-save");
  await a.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "saved");
  check("guardar: estado 'Guardado en la nube' con fecha", /Guardado en la nube · \d{2}\/\d{2}\/\d{4}/.test((await a.textContent("#mlz-status")) ?? ""));
  check("guardar: envía CSRF de la sesión", stub.puts[0]?.csrf === CSRF);
  check("guardar: versión base 0 y foto válida para el servidor", stub.puts[0]?.baseVersion === 0 && parseWorkspaceSave({ baseVersion: 0, snapshot: stub.puts[0]?.snapshot }).ok);
  const priceA = await a.evaluate(() => JSON.stringify((window as any).PRICES.tshirt));

  // Dispositivo B (sin localStorage): restaura la foto completa.
  const ctxB = await newContext(browser, iphone);
  const b = await openCotizador(ctxB, stub, problems, "nube-B");
  const restored = await b.evaluate(() => {
    const w = window as any;
    return {
      cliente: (document.getElementById("cot-cliente") as HTMLInputElement).value,
      lines: w.COT.lines.length,
      cInf: (document.getElementById("c-inf") as HTMLInputElement).value,
      CInf: w.C.inf,
      tipo: w.STS.tipo,
      qty: (document.getElementById("qty-tshirt") as HTMLInputElement).value,
      page: (document.getElementById("mlz-module") as HTMLSelectElement).value,
      price: JSON.stringify(w.PRICES.tshirt),
      state: document.getElementById("mlz-status")!.getAttribute("data-state"),
    };
  });
  check(
    "otro dispositivo: restaura cotización, costos, módulo y página",
    restored.cliente === "Escuela Primavera" && restored.lines === 1 && restored.cInf === "52.5" && restored.CInf === 52.5 && restored.tipo === "infantil" && restored.qty === "33" && restored.page === "cotizacion",
    JSON.stringify(restored),
  );
  check("otro dispositivo: mismo precio calculado", restored.price === priceA);
  check("otro dispositivo: estado guardado (sin falsos 'sin guardar')", restored.state === "saved", String(restored.state));

  // A guarda de nuevo → B queda desfasado → 409 al guardar.
  await a.fill("#cot-lugar", "Patio central");
  await a.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "dirty");
  await a.click("#mlz-save");
  await a.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "saved");
  await b.fill("#cot-vigencia", "30 días");
  await b.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "dirty");
  await b.click("#mlz-save");
  await b.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "conflict");
  check("conflicto 409: aviso visible y nada sobrescrito", (await b.isVisible("#mlz-notice")) && stub.version === 2 && (stub.snapshot as any).cot.fields.vigencia === "15 días");
  check("conflicto 409: los cambios locales siguen en pantalla", (await b.inputValue("#cot-vigencia")) === "30 días");
  await b.click("text=Reemplazarla con mis cambios");
  await b.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "saved");
  check("conflicto: reemplazo explícito guarda con la versión vigente", stub.version === 3 && (stub.snapshot as any).cot.fields.vigencia === "30 días" && stub.puts.at(-1)?.baseVersion === 2);

  // Error del servidor al guardar → mensaje claro, borrador local intacto.
  await b.fill("#cot-tel", "55 9999 0000");
  await b.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "dirty");
  stub.nextPut = { status: 500, body: { ok: false, code: "WRITE_FAILED" } };
  await b.click("#mlz-save");
  await b.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "error");
  check("error al guardar: mensaje en español", ((await b.textContent("#mlz-notice")) ?? "").includes("Tus cambios siguen en este dispositivo"));

  // Recarga del navegador: recupera el borrador local sin pisarlo con la nube.
  await b.reload();
  await b.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") !== "loading");
  check("al recargar recupera cambios locales sin guardar", (await b.inputValue("#cot-tel")) === "55 9999 0000" && (await statusOf(b)) === "dirty");

  // Mientras tanto A guarda otra versión → B arranca en conflicto y elige.
  await a.fill("#cot-notas", "Pago: 50% anticipo");
  await a.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "dirty");
  // A está desfasado (B guardó v3) → conflicto; A carga la nube a propósito.
  await a.click("#mlz-save");
  await a.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "conflict");
  await a.click("text=Cargar la versión de la nube");
  await a.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "saved");
  check("cargar versión de la nube tras conflicto", (await a.inputValue("#cot-vigencia")) === "30 días");
  await a.fill("#cot-notas", "Pago: 50% anticipo");
  await a.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "dirty");
  await a.click("#mlz-save");
  await a.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "saved");
  await b.reload();
  await b.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") !== "loading");
  check("arranque con borrador viejo + nube nueva → conflicto explícito", (await statusOf(b)) === "conflict" && ((await b.textContent("#mlz-notice")) ?? "").includes("Elige cuál conservar"));
  check("arranque en conflicto: conserva el borrador en pantalla", (await b.inputValue("#cot-tel")) === "55 9999 0000");
  await b.click("text=Usar la versión de la nube");
  check("elegir la nube aplica la última versión", (await b.inputValue("#cot-notas")) === "Pago: 50% anticipo" && (await statusOf(b)) === "saved");

  // Recargar guardado con cambios: pide confirmación (aquí se cancela).
  await b.fill("#cot-cliente", "Cambio no guardado");
  await b.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "dirty");
  b.removeAllListeners("dialog");
  let asked = false;
  b.on("dialog", (d) => { asked = true; void d.dismiss(); });
  await b.click("#mlz-reload");
  await b.waitForTimeout(200);
  check("recargar con cambios pide confirmación y no los pisa si se cancela", asked && (await b.inputValue("#cot-cliente")) === "Cambio no guardado");

  // Nube no configurada (503).
  const ctxC = await newContext(browser, iphone);
  const off = new CloudStub();
  off.getStatus = 503;
  const c = await openCotizador(ctxC, off, problems, "nube-503");
  check("503: aviso de nube no configurada", ((await c.textContent("#mlz-notice")) ?? "").includes("no está configurada") && (await statusOf(c)) === "error");

  for (const [label, page] of [["A", a], ["B", b], ["503", c]] as const) {
    const v = await cspViolations(page);
    check(`nube ${label}: sin violaciones de CSP`, v.length === 0, v.join(" | "));
  }
  check("nube: sin errores de runtime", problems.errors.length === 0, problems.errors.slice(0, 3).join(" | "));
  await ctxA.close();
  await ctxB.close();
  await ctxC.close();
}

// ---------------------------------------------------------------------------
// Folios COT-xxx asignados por el servidor (API sustituida por FolioStub)
// ---------------------------------------------------------------------------
type FolioWin = {
  __prints: string[];
  COT: { cotNum: number; lines: unknown[] };
  getSavedCots(): Array<{ cotNum: string }>;
  generatePDF(integrated: boolean): void;
  generateReceiptPDF(): void;
  nextCotNum(): void;
  prevCotNum(): void;
  syncCotNum(value: string): void;
};
const printsOf = (page: Page) => page.evaluate(() => (window as unknown as FolioWin).__prints);
const folioOf = (html: string) => [...html.matchAll(/N° de Cotización:<\/span><span class="pdf-info-val v-purple">(COT-\d+)</g)].map((m) => m[1]).join(",");

async function until(fn: () => boolean, label: string, ms = 10_000) {
  const end = Date.now() + ms;
  while (!fn()) {
    if (Date.now() > end) throw new Error(`Timeout esperando: ${label}`);
    await new Promise((r) => setTimeout(r, 25));
  }
}

/** Pulsa generar y espera a que termine (impreso o rechazado). */
async function generate(page: Page, folios: FolioStub, which: "integrada" | "individual") {
  const posts = folios.posts.length;
  const prints = (await printsOf(page)).length;
  await page.click(`text=Cotización ${which}`);
  await until(() => folios.posts.length > posts, "POST de folio");
  await page.waitForFunction(() => !document.querySelector(".container")!.hasAttribute("inert"));
  await page.waitForTimeout(250); // el original imprime con setTimeout(150)
  const after = await printsOf(page);
  return { printed: after.length > prints, html: after.length > prints ? after[after.length - 1]! : "" };
}

async function folioSuite(browser: Browser, engine: string) {
  console.log(`\n--- 4. Folios del servidor (${engine}) ---`);
  const problems: Problems = { errors: [] };
  const cloud = new CloudStub();
  const folios = new FolioStub();
  const desktop = { viewport: { width: 1280, height: 900 } };
  const ctx = await newContext(browser, desktop);
  const page = await openCotizador(ctx, cloud, problems, `folios-${engine}`, folios);
  await page.waitForFunction(() => document.getElementById("cot-num-display")!.textContent === "COT-038");

  check(`[${engine}] arranque: última emitida COT-038 y siguiente COT-039`, (await page.textContent("#mlz-folio-next")) === "COT-039");
  check(`[${engine}] leer el estado no reserva folios`, folios.posts.length === 0 && folios.lastIssued === 38);
  check(
    `[${engine}] sin flechas ni campo manual de folio`,
    await page.evaluate(() => !document.getElementById("cot-num-input") && !document.querySelector("[data-ml-click*='CotNum']")),
  );

  // Intentos de fijar el folio a mano: no influyen en el PDF.
  await buildQuote(page, false);
  await page.evaluate(() => { const w = window as unknown as FolioWin; w.nextCotNum(); w.syncCotNum("COT-900"); w.prevCotNum(); w.COT.cotNum = 900; });
  const first = await generate(page, folios, "integrada");
  check(`[${engine}] integrada → COT-039 (folio manual ignorado)`, first.printed && folioOf(first.html) === "COT-039", folioOf(first.html));
  check(`[${engine}] el POST lleva CSRF y contenido válido para el servidor`, folios.posts.every((p) => p.csrf === CSRF && p.valid) && folios.posts[0]!.mode === "integrated");
  check(`[${engine}] tras emitir: última COT-039, siguiente COT-040`, (await page.textContent("#cot-num-display")) === "COT-039" && (await page.textContent("#mlz-folio-next")) === "COT-040");
  check(`[${engine}] título del documento con el folio (nombre del PDF)`, (await page.title()).includes("COT-039"));
  check(`[${engine}] botón para reabrir el PDF emitido`, (await page.isVisible("#mlz-reprint")) && ((await page.textContent("#mlz-reprint")) ?? "").includes("COT-039"));

  const repeat = await generate(page, folios, "integrada");
  check(`[${engine}] repetir el PDF → folio nuevo COT-040 (nunca recicla)`, folioOf(repeat.html) === "COT-040" && folios.posts[1]!.requestId !== folios.posts[0]!.requestId);
  const batch = await generate(page, folios, "individual");
  check(`[${engine}] individual de 2 → COT-041 y COT-042 contiguos`, folioOf(batch.html) === "COT-041,COT-042" && folios.posts.at(-1)!.count === 2);

  // Reabrir: mismo PDF y folio, sin POST.
  const posts = folios.posts.length;
  await page.click("#mlz-reprint");
  const reprinted = await printsOf(page);
  check(`[${engine}] reabrir reimprime el mismo folio sin pedir otro`, reprinted.at(-1) === batch.html && folios.posts.length === posts);

  // Recibo: sólo enlaza un folio ya emitido para ese mismo contenido.
  await runStep(page, { page: "recibos" }, false);
  await page.click("text=Cargar de cotización actual");
  check(`[${engine}] recibo enlaza el folio emitido (COT-041)`, (await page.inputValue("#rec-cot-ref")) === "COT-041");
  await page.click("text=Generar recibo PDF");
  await page.waitForFunction(() => (window as unknown as FolioWin).__prints.length === 5);
  check(`[${engine}] el PDF del recibo cita COT-041`, ((await printsOf(page)).at(-1) ?? "").includes("COT-041"));
  await runStep(page, { page: "cotizacion" }, false);
  await page.fill("#cot-cliente", "Cliente sin emitir");
  await runStep(page, { page: "recibos" }, false);
  await page.click("text=Cargar de cotización actual");
  check(`[${engine}] contenido sin emitir: el recibo no apunta a un folio inexistente`, (await page.inputValue("#rec-cot-ref")) === "");
  await runStep(page, { page: "cotizacion" }, false);

  // Doble toque y bloqueo durante la solicitud.
  folios.delayMs = 600;
  const before = folios.posts.length;
  await page.evaluate(() => {
    const b = document.querySelector<HTMLButtonElement>("[data-ml-click='[\"generatePDF\",true]']")!;
    b.click(); b.click(); (window as unknown as FolioWin).generatePDF(true);
  });
  await page.waitForFunction(() => document.querySelector(".container")!.hasAttribute("inert"));
  const locked = await page.evaluate(() => ({
    save: (document.getElementById("mlz-save") as HTMLButtonElement).disabled,
    reload: (document.getElementById("mlz-reload") as HTMLButtonElement).disabled,
    hint: document.getElementById("mlz-folio-hint")!.textContent,
  }));
  check(`[${engine}] en vuelo: edición, guardar y recargar bloqueados`, locked.save && locked.reload && /Asignando/.test(locked.hint ?? ""));
  await page.waitForFunction(() => !document.querySelector(".container")!.hasAttribute("inert"));
  folios.delayMs = 0;
  check(`[${engine}] doble toque → un solo POST`, folios.posts.length === before + 1);
  await page.waitForTimeout(250);
  check(`[${engine}] doble toque → COT-043`, folioOf((await printsOf(page)).at(-1)!) === "COT-043");

  // Respuesta perdida: el servidor reservó COT-044, el cliente no lo supo.
  await page.fill("#cot-cliente", "Respuesta perdida");
  folios.dropNext = true;
  const lost = await generate(page, folios, "integrada");
  check(`[${engine}] sin respuesta: no hay PDF y se avisa`, !lost.printed && ((await page.textContent("#mlz-notice")) ?? "").includes("No se generó el PDF"));
  check(`[${engine}] sin respuesta: el folio visible no se inventa`, (await page.textContent("#cot-num-display")) === "COT-043");
  // La solicitud pendiente sobrevive a recargar la página.
  await page.reload();
  await page.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") !== "loading");
  await page.waitForFunction(() => document.getElementById("cot-num-display")!.textContent === "COT-044");
  const lostId = folios.posts.at(-1)!.requestId;
  const retry = await generate(page, folios, "integrada");
  check(
    `[${engine}] reintento tras recargar: mismo UUID → el mismo COT-044, sin consumir otro`,
    folioOf(retry.html) === "COT-044" && folios.posts.at(-1)!.requestId === lostId && folios.lastIssued === 44,
    `${folioOf(retry.html)} ${folios.lastIssued}`,
  );

  // Pendiente + contenido cambiado → UUID nuevo (nunca comparte folio).
  await page.fill("#cot-cliente", "Otro pendiente");
  folios.dropNext = true;
  await generate(page, folios, "integrada");
  const staleId = folios.posts.at(-1)!.requestId;
  await page.fill("#cot-cliente", "Contenido cambiado");
  const changed = await generate(page, folios, "integrada");
  check(`[${engine}] contenido cambiado tras fallo → UUID nuevo y folio nuevo`, folios.posts.at(-1)!.requestId !== staleId && folioOf(changed.html) === "COT-046");

  // Sin red, sesión vencida, nube sin configurar, rate limit: ni PDF ni folio.
  for (const [label, arm, text] of [
    ["sin red", () => { folios.abortNext = true; }, "sin conexión"],
    ["sesión vencida (401)", () => { folios.nextPost = { status: 401 }; }, "sesión expiró"],
    ["nube sin configurar (503)", () => { folios.nextPost = { status: 503 }; }, "no está configurada"],
    ["demasiados intentos (429)", () => { folios.nextPost = { status: 429 }; }, "demasiados intentos"],
  ] as const) {
    arm();
    const r = await generate(page, folios, "integrada");
    const notice = (await page.textContent("#mlz-notice")) ?? "";
    check(`[${engine}] ${label}: no se imprime y se avisa`, !r.printed && notice.includes(text) && notice.includes("sigue aquí"), notice.slice(0, 120));
    if (label.includes("401")) check(`[${engine}] 401 ofrece iniciar sesión`, await page.isVisible("#mlz-notice a[href='/admin/login']"));
  }
  check(`[${engine}] los fallos no consumieron folios`, folios.lastIssued === 46);
  check(`[${engine}] la cotización sigue intacta tras los fallos`, (await page.inputValue("#cot-cliente")) === "Contenido cambiado" && (await page.evaluate(() => (window as unknown as FolioWin).COT.lines.length)) === 2);
  const okAgain = await generate(page, folios, "integrada");
  check(`[${engine}] reintento correcto tras los fallos → COT-047`, folioOf(okAgain.html) === "COT-047");

  // Borrar el historial no toca el contador.
  await runStep(page, { page: "recibos" }, false);
  await page.click("[aria-label='Borrar lista de cotizaciones guardadas']");
  await runStep(page, { page: "cotizacion" }, false);
  const afterClear = await generate(page, folios, "integrada");
  check(`[${engine}] borrar historial no reinicia el folio → COT-048`, folioOf(afterClear.html) === "COT-048" && (await page.evaluate(() => (window as unknown as FolioWin).getSavedCots().length)) === 1);

  // Guardar en la nube con una foto "vieja" (cot.num 5) y abrir otro dispositivo.
  await page.click("#mlz-save");
  await page.waitForFunction(() => document.getElementById("mlz-status")!.getAttribute("data-state") === "saved");
  const old = cloud.snapshot as { cot: { num: number; nextNum: number | null } };
  old.cot.num = 5;
  old.cot.nextNum = 6;
  const ctxB = await newContext(browser, desktop);
  await ctxB.addInitScript("localStorage.setItem('mlCotNum', '7');");
  const b = await openCotizador(ctxB, cloud, problems, `folios-B-${engine}`, folios);
  await b.waitForFunction(() => document.getElementById("cot-num-display")!.textContent === "COT-048");
  await runStep(b, { page: "cotizacion" }, false);
  const restored = await generate(b, folios, "integrada");
  check(`[${engine}] restaurar nube/caché viejo no hace retroceder: otro dispositivo → COT-049`, folioOf(restored.html) === "COT-049");

  // Dos dispositivos a la vez: folios distintos.
  const pa = generate(page, folios, "integrada");
  const pb = generate(b, folios, "integrada");
  const [ra, rb] = await Promise.all([pa, pb]);
  const pair = [folioOf(ra.html), folioOf(rb.html)].sort().join();
  check(`[${engine}] dos dispositivos simultáneos → COT-050 y COT-051`, pair === "COT-050,COT-051", pair);

  // Carrera: respuesta → render de la plantilla → otro toque ANTES del
  // print() programado (setTimeout 150 ms del original). El observador corre
  // como microtarea justo tras el render, siempre antes de ese temporizador.
  const racePosts = folios.posts.length;
  const racePrints = (await printsOf(page)).length;
  await page.evaluate(() => {
    const w = window as unknown as FolioWin & { __race?: Record<string, unknown> };
    const tpl = document.getElementById("print-template")!;
    const obs = new MutationObserver(() => {
      obs.disconnect();
      const individual = document.querySelector<HTMLButtonElement>("[data-ml-click='[\"generatePDF\",false]']")!;
      w.__race = {
        printsAtRender: w.__prints.length,
        disabled: individual.disabled,
        inert: document.querySelector(".container")!.hasAttribute("inert"),
        html: tpl.innerHTML,
      };
      individual.click();
      w.generatePDF(true);
      w.generateReceiptPDF();
      document.getElementById("mlz-reprint")!.click();
    });
    obs.observe(tpl, { childList: true, subtree: true });
  });
  await page.click("text=Cotización integrada");
  await page.waitForFunction((n) => (window as unknown as FolioWin).__prints.length > n, racePrints);
  await page.waitForFunction(() => !document.querySelector(".container")!.hasAttribute("inert"));
  await page.waitForTimeout(400);
  const race = await page.evaluate(() => (window as unknown as { __race: { printsAtRender: number; disabled: boolean; inert: boolean; html: string } }).__race);
  const racePrinted = (await printsOf(page)).slice(racePrints);
  check(`[${engine}] carrera: el segundo toque llega tras el render y antes del print, con bloqueo activo`, race.printsAtRender === racePrints && race.disabled && race.inert);
  check(
    `[${engine}] carrera: un solo POST y una sola impresión, con el folio original COT-052`,
    folios.posts.length === racePosts + 1 && racePrinted.length === 1 && folioOf(racePrinted[0]!) === "COT-052" && racePrinted[0] === race.html,
    `${folios.posts.length - racePosts} POST, ${racePrinted.length} impresiones, ${racePrinted.map(folioOf).join("|")}`,
  );
  const legit = await generate(page, folios, "integrada");
  check(`[${engine}] terminado el bloqueo, un toque legítimo sí genera COT-053`, folioOf(legit.html) === "COT-053");

  for (const p of [page, b]) {
    const v = await cspViolations(p);
    check(`[${engine}] folios: sin violaciones de CSP`, v.length === 0, v.join(" | "));
  }
  const noDateInput = await page.evaluate(() => { const i = document.createElement("input"); i.type = "date"; return i.type !== "date"; });
  const runtimeErrors = problems.errors.filter((e) => !(noDateInput && /pageerror: The object is in an invalid state/.test(e)));
  check(`[${engine}] folios: sin errores de runtime`, runtimeErrors.length === 0, runtimeErrors.slice(0, 3).join(" | "));
  await ctx.close();
  await ctxB.close();

  // Timeout real del cliente (12 s acortados) y arranque sin servidor de folios.
  const slow = new FolioStub();
  slow.hang = true;
  const ctxT = await newContext(browser, desktop);
  await ctxT.addInitScript(`
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = function (fn, ms, ...args) { return nativeTimeout(fn, ms === 12000 ? 300 : ms, ...args); };
  `);
  const t = await openCotizador(ctxT, new CloudStub(), { errors: [] }, `folios-timeout-${engine}`, slow);
  await buildQuote(t, false);
  const timedOut = await generate(t, slow, "integrada");
  check(`[${engine}] timeout: sin PDF y edición liberada`, !timedOut.printed && ((await t.textContent("#mlz-notice")) ?? "").includes("tardó demasiado"));
  const pendingKept = await t.evaluate(() => JSON.parse(sessionStorage.getItem("mlCotizadorFolios:tab:v2") ?? "null")?.pending?.requestId);
  check(`[${engine}] timeout: la solicitud queda pendiente para reintentar`, pendingKept === slow.posts[0]!.requestId);
  await ctxT.close();

  const down = new FolioStub();
  down.getStatus = 503;
  const ctxD = await newContext(browser, desktop);
  const d = await openCotizador(ctxD, new CloudStub(), { errors: [] }, `folios-down-${engine}`, down);
  await d.waitForTimeout(300);
  check(`[${engine}] sin servidor de folios: no se muestra un folio inventado`, (await d.textContent("#cot-num-display")) === "—" && ((await d.textContent("#mlz-folio-hint")) ?? "").includes("requiere conexión"));
  await ctxD.close();
}

/** Pestañas del MISMO navegador (BrowserContext compartido) y almacenamiento bloqueado. */
async function folioTabSuite(browser: Browser, engine: string) {
  console.log(`\n--- 5. Folios por pestaña (${engine}) ---`);
  const problems: Problems = { errors: [] };
  const cloud = new CloudStub();
  const folios = new FolioStub();
  const desktop = { viewport: { width: 1280, height: 900 } };
  const TAB_KEY = "mlCotizadorFolios:tab:v2";
  const ctx = await newContext(browser, desktop);

  const p1 = await openCotizador(ctx, cloud, problems, `tab1-${engine}`, folios);
  await buildQuote(p1, false);
  await p1.waitForTimeout(400); // caché local del espacio de trabajo (compartido)
  const p2 = await openCotizador(ctx, cloud, problems, `tab2-${engine}`, folios);
  await runStep(p2, { page: "cotizacion" }, false);
  check(`[${engine}] la segunda pestaña abre el mismo contenido`, (await p2.inputValue("#cot-cliente")) === (await p1.inputValue("#cot-cliente")));

  const [g1, g2] = await Promise.all([generate(p1, folios, "integrada"), generate(p2, folios, "integrada")]);
  const ids = folios.posts.slice(-2).map((p) => p.requestId);
  const pair = [folioOf(g1.html), folioOf(g2.html)];
  check(`[${engine}] dos pestañas, mismo contenido, a la vez → UUID distintos`, ids[0] !== ids[1]);
  check(`[${engine}] dos pestañas → folios distintos COT-039 y COT-040`, [...pair].sort().join() === "COT-039,COT-040", pair.join());
  for (const [p, own] of [[p1, pair[0]], [p2, pair[1]]] as const) {
    await runStep(p, { page: "recibos" }, false);
    await p.click("text=Cargar de cotización actual");
    check(`[${engine}] cada pestaña: el recibo cita su propio folio (${own})`, (await p.inputValue("#rec-cot-ref")) === own);
    await runStep(p, { page: "cotizacion" }, false);
  }
  check(`[${engine}] el estado de folios no usa localStorage compartido`, await p1.evaluate(() => localStorage.getItem("mlCotizadorFolios:v1") === null && Object.keys(localStorage).every((k) => !k.startsWith("mlCotizadorFolios"))));

  // Pestaña duplicada: hereda una copia de sessionStorage con el pendiente.
  await p1.fill("#cot-cliente", "Pestaña duplicada");
  folios.dropNext = true;
  await generate(p1, folios, "integrada");
  const heldId = folios.posts.at(-1)!.requestId;
  const copied = await p1.evaluate((k) => sessionStorage.getItem(k), TAB_KEY);
  check(`[${engine}] el pendiente vive en sessionStorage de la pestaña`, !!copied && copied.includes(heldId));
  await p1.waitForTimeout(400);
  const p3 = await openCotizador(ctx, cloud, problems, `tab3-${engine}`, folios, (p) =>
    p.addInitScript(([k, v]) => { if (!sessionStorage.getItem(k as string)) sessionStorage.setItem(k as string, v as string); }, [TAB_KEY, copied]));
  await runStep(p3, { page: "cotizacion" }, false);
  check(`[${engine}] la pestaña duplicada tiene el mismo contenido y el mismo pendiente`, (await p3.inputValue("#cot-cliente")) === "Pestaña duplicada" && ((await p3.evaluate((k) => sessionStorage.getItem(k), TAB_KEY)) ?? "").includes(heldId));
  // Ambas a la vez, con la respuesta retrasada para que se traslapen.
  folios.delayMs = 800;
  const [r1, r3] = await Promise.all([generate(p1, folios, "integrada"), generate(p3, folios, "integrada")]);
  folios.delayMs = 0;
  const dupIds = folios.posts.slice(-2).map((p) => p.requestId);
  check(`[${engine}] duplicada: sólo la pestaña dueña reutiliza el UUID pendiente`, dupIds.filter((id) => id === heldId).length === 1, dupIds.join(" "));
  check(
    `[${engine}] duplicada: la dueña recupera COT-041 y la copia recibe COT-042`,
    folioOf(r1.html) === "COT-041" && folioOf(r3.html) === "COT-042" && folios.lastIssued === 42,
    `${folioOf(r1.html)} ${folioOf(r3.html)} ${folios.lastIssued}`,
  );
  // Secuencial: la dueña termina (y suelta el lock) ANTES de que la copia
  // genere. La copia no debe reutilizar el UUID ya resuelto.
  await p1.fill("#cot-cliente", "Duplicada secuencial");
  folios.dropNext = true;
  await generate(p1, folios, "integrada");
  const seqId = folios.posts.at(-1)!.requestId;
  const seqCopy = await p1.evaluate((k) => sessionStorage.getItem(k), TAB_KEY);
  await p1.waitForTimeout(400);
  const p4 = await openCotizador(ctx, cloud, problems, `tab4-${engine}`, folios, (p) =>
    p.addInitScript(([k, v]) => { if (!sessionStorage.getItem(k as string)) sessionStorage.setItem(k as string, v as string); }, [TAB_KEY, seqCopy]));
  await runStep(p4, { page: "cotizacion" }, false);
  const own = await generate(p1, folios, "integrada");
  const copy = await generate(p4, folios, "integrada");
  check(
    `[${engine}] duplicada secuencial: la dueña recupera COT-043; la copia pide UUID nuevo → COT-044`,
    folioOf(own.html) === "COT-043" && folioOf(copy.html) === "COT-044" && folios.posts.at(-1)!.requestId !== seqId && folios.lastIssued === 44,
    `${folioOf(own.html)} ${folioOf(copy.html)} ${folios.lastIssued}`,
  );
  for (const p of [p1, p2, p3, p4]) {
    const v = await cspViolations(p);
    check(`[${engine}] pestañas: sin violaciones de CSP`, v.length === 0, v.join(" | "));
  }
  await ctx.close();

  // Almacenamiento rechazado (Storage lanza) + respuesta perdida: el UUID
  // sigue en memoria y el reintento recupera el mismo folio.
  const blocked = new FolioStub();
  const ctxS = await newContext(browser, desktop);
  await ctxS.addInitScript(`
    for (const m of ['getItem', 'setItem', 'removeItem']) {
      Storage.prototype[m] = function () { throw new DOMException('Almacenamiento bloqueado', 'SecurityError'); };
    }
  `);
  const s = await openCotizador(ctxS, new CloudStub(), problems, `storage-${engine}`, blocked);
  await buildQuote(s, false);
  blocked.dropNext = true;
  const lost = await generate(s, blocked, "integrada");
  const lostId = blocked.posts.at(-1)!.requestId;
  const again = await generate(s, blocked, "integrada");
  check(`[${engine}] almacenamiento bloqueado: sin respuesta no imprime`, !lost.printed);
  check(
    `[${engine}] almacenamiento bloqueado: el reintento usa el mismo UUID y recupera COT-039`,
    blocked.posts.at(-1)!.requestId === lostId && folioOf(again.html) === "COT-039" && blocked.lastIssued === 39,
    `${folioOf(again.html)} ${blocked.lastIssued}`,
  );
  await ctxS.close();

  const noDate = /pageerror: The object is in an invalid state/;
  const errors = problems.errors.filter((e) => !noDate.test(e));
  check(`[${engine}] pestañas: sin errores de runtime`, errors.length === 0, errors.slice(0, 3).join(" | "));
}

// ---------------------------------------------------------------------------
// Servidor real: auth, cabeceras, API sin base
// ---------------------------------------------------------------------------
async function loadingSuite(browser: Browser, engine: string) {
  console.log(`\n--- Carga lenta y timeout: ${engine} ---`);
  const ctx = await newContext(browser, { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  let pending: Route | undefined;
  await page.route("**/api/admin/cotizador/workspace", (route) => { pending = route; });
  await page.goto("/admin/cotizador");
  await page.waitForFunction(() => document.querySelector(".container")?.hasAttribute("inert"));
  await page.locator("#chk-liston").evaluate((el) => (el as HTMLInputElement).focus());
  check(`${engine}: la lectura inicial bloquea la edición y el foco`, await page.evaluate(() => !document.querySelector(".container")!.contains(document.activeElement)));
  if (!pending) throw new Error("Falta la petición inicial de la nube");
  await pending.fulfill({ json: { ok: true, version: 0, snapshot: null, updatedAt: null } });
  await page.waitForFunction(() => !document.querySelector(".container")?.hasAttribute("inert"));
  check(`${engine}: al terminar la carga se habilitan los controles`, await page.locator("#mlz-save").isEnabled());
  await ctx.close();

  const offlineCtx = await newContext(browser);
  await offlineCtx.addInitScript(`
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = function (fn, ms, ...args) { return nativeTimeout(fn, ms === 12000 ? 50 : ms, ...args); };
    const nativeFetch = window.fetch.bind(window);
    window.fetch = function (url, init) {
      if (String(url).includes('/api/admin/cotizador/workspace')) {
        return new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('Timeout', 'AbortError')), { once: true }));
      }
      return nativeFetch(url, init);
    };
  `);
  const offline = await offlineCtx.newPage();
  await offline.goto("/admin/cotizador");
  await offline.waitForFunction(() => document.getElementById("mlz-status")?.getAttribute("data-state") === "error");
  check(`${engine}: timeout de lectura permite seguir trabajando`, await offline.evaluate(() => !document.querySelector(".container")!.hasAttribute("inert")) && await offline.locator("#mlz-save").isEnabled());
  await offline.locator('.main-tab[data-page="cotizacion"]').click();
  await offline.fill("#cot-cliente", "Borrador después de timeout");
  await offline.click("#mlz-save");
  await offline.waitForFunction(() => document.getElementById("mlz-status")?.getAttribute("data-state") === "error");
  check(`${engine}: timeout de guardado conserva el borrador y permite reintentar`, await offline.inputValue("#cot-cliente") === "Borrador después de timeout" && await offline.locator("#mlz-save").isEnabled());
  await offlineCtx.close();
}

async function serverSuite() {
  console.log("\n--- 0. Servidor: auth y cabeceras ---");
  const anon = await fetch(`${BASE}/admin/cotizador`, { redirect: "manual" });
  check("sin sesión → redirige al login", anon.status >= 300 && anon.status < 400 && (anon.headers.get("location") ?? "").includes("/admin/login"));
  const forged = await fetch(`${BASE}/admin/cotizador`, { redirect: "manual", headers: { cookie: `ml_admin=${adminCookie().replace(/.$/, "x")}` } });
  check("cookie con firma alterada → login", forged.status >= 300 && forged.status < 400);
  const res = await fetch(`${BASE}/admin/cotizador`, { redirect: "manual", headers: { cookie: `ml_admin=${adminCookie()}` } });
  const html = await res.text();
  const csp = res.headers.get("content-security-policy") ?? "";
  const nonce = /'nonce-([a-f0-9]{32})'/.exec(csp)?.[1];
  check("con sesión → 200 HTML", res.status === 200 && (res.headers.get("content-type") ?? "").includes("text/html"));
  check("CSP estricta con nonce y strict-dynamic, sin unsafe-inline en scripts", !!nonce && /strict-dynamic/.test(csp) && !/script-src[^;]*unsafe-inline/.test(csp));
  check("frame-ancestors 'none', object-src 'none', form-action 'self'", /frame-ancestors 'none'/.test(csp) && /object-src 'none'/.test(csp) && /form-action 'self'/.test(csp));
  check("ambos scripts llevan el nonce de la respuesta", (html.match(new RegExp(`<script nonce="${nonce}">`, "g")) ?? []).length === 2);
  check("Cache-Control private, no-store", /private, no-store/.test(res.headers.get("cache-control") ?? ""));
  check("X-Robots-Tag noindex y meta robots", /noindex/.test(res.headers.get("x-robots-tag") ?? "") && html.includes('name="robots" content="noindex, nofollow"'));
  check("X-Frame-Options DENY y HSTS del next.config", res.headers.get("x-frame-options") === "DENY" && !!res.headers.get("strict-transport-security"));
  check("el token CSRF va en el documento, no el secreto", html.includes(`content="${CSRF}"`) && !html.includes(SECRET));
  const api = await fetch(`${BASE}/api/admin/cotizador/workspace`, { headers: { cookie: `ml_admin=${adminCookie()}` } });
  check("API sin Supabase → 503 NOT_CONFIGURED, no-store", api.status === 503 && /no-store/.test(api.headers.get("cache-control") ?? ""));
  const folioGet = await fetch(`${BASE}/api/admin/cotizador/folios`, { headers: { cookie: `ml_admin=${adminCookie()}` } });
  check("API de folios sin Supabase → 503, no-store (nunca un folio local)", folioGet.status === 503 && /no-store/.test(folioGet.headers.get("cache-control") ?? ""));
  const folioAnon = await fetch(`${BASE}/api/admin/cotizador/folios`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  check("POST de folios sin sesión ni CSRF → rechazado", folioAnon.status >= 400 && !(await folioAnon.text()).includes('"first"'));
  const nav = await fetch(`${BASE}/admin`, { headers: { cookie: `ml_admin=${adminCookie()}` } });
  check("el resumen admin enlaza al cotizador", (await nav.text()).includes('href="/admin/cotizador"'));
}

async function main() {
  if (!existsSync(join(ROOT, ".next", "BUILD_ID"))) throw new Error("Corre `next build` antes de este QA.");
  const server = await startServer();
  try {
    await serverSuite();
    const browser = await chromium.launch();
    try {
      await parity(browser);
      await mobileSuite(browser, "chromium");
      await cloudSuite(browser);
      await loadingSuite(browser, "chromium");
      await folioSuite(browser, "chromium");
      await folioTabSuite(browser, "chromium");
    } finally {
      await browser.close();
    }
    const wk = await webkit.launch().catch(() => null);
    if (wk) {
      try { await mobileSuite(wk, "webkit"); await loadingSuite(wk, "webkit"); await folioSuite(wk, "webkit"); await folioTabSuite(wk, "webkit"); } finally { await wk.close(); }
    } else {
      console.log("(WebKit no disponible: se omite la pasada en WebKit)");
    }
  } finally {
    server.kill();
  }
  console.log(failures === 0 ? "\nTodo OK." : `\n${failures} fallo(s).`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("QA abortado:", e instanceof Error ? e.message : e);
  process.exit(1);
});
