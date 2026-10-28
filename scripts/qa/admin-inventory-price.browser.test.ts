/**
 * QA de NAVEGADOR del editor de precio en /admin/inventario (flujo real).
 *
 * Levanta `next start` (requiere `next build` previo) con credenciales
 * EFÍMERAS generadas aquí: secreto de sesión admin aleatorio, una sesión
 * firmada localmente (registrada sólo en la base falsa) y una "service role"
 * aleatoria. SUPABASE_URL apunta a un Data API FALSO en 127.0.0.1 que vive en
 * este proceso: nada sale a la red ni toca datos reales. Se borran del
 * entorno todas las variables SUPABASE/DATABASE_URL/MERCADOPAGO heredadas.
 *
 * Verifica, con la página, la API y el helper reales:
 *   - 7 columnas, precio efectivo (variante / base heredada / $0 / Sin precio)
 *     y las 1,030 variantes leídas en páginas de 500;
 *   - editar y guardar UNA variante (coma decimal), sólo `price`, con
 *     compare-and-swap; stock, estado, otros colores y precio base intactos;
 *     auditoría inventory.price_update; sin movimientos de inventario;
 *   - cancelar / Escape / sin cambios / inválidos → cero peticiones;
 *   - error 500 y red caída conservan el borrador; conflicto 409 muestra el
 *     precio vigente y no lo pisa; doble toque → un solo guardado; busy real;
 *   - quitar el precio propio para volver a la base;
 *   - sesión + CSRF obligatorios, cuerpos inválidos 400, todo no-store;
 *   - el ajuste de stock existente sigue funcionando y no toca el precio;
 *   - iPhone (WebKit) 320/375/390/430 sin overflow, campo ≥16px decimal,
 *     objetivos ≥44px; cero errores de runtime y cero violaciones de CSP.
 *
 * Capturas opcionales: INVENTORY_SCREENSHOT_DIR=<carpeta fuera del repo>.
 *
 * Uso: npx tsx scripts/qa/admin-inventory-price.browser.test.ts
 */
import { spawn, type ChildProcess } from "node:child_process";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { chromium, devices, webkit, type Browser, type BrowserContext, type Page } from "@playwright/test";

const ROOT = join(__dirname, "..", "..");
const SHOTS = process.env.INVENTORY_SCREENSHOT_DIR;
const PORT = 3000 + Math.floor(Math.random() * 400) + 5200;
const BASE = `http://localhost:${PORT}`;

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

// ---------------------------------------------------------------------------
// Credenciales efímeras (nunca se imprimen)
// ---------------------------------------------------------------------------
const SESSION_SECRET = randomBytes(36).toString("base64url");
const SERVICE_KEY = `fake-service-${randomBytes(24).toString("base64url")}`;
const CSRF = randomBytes(18).toString("base64url");
const SID = randomBytes(18).toString("base64url");
const SID_HASH = createHash("sha256").update(SID).digest("hex");

function adminCookie(): string {
  const payload = { sid: SID, csrf: CSRF, exp: Math.floor(Date.now() / 1000) + 3600, v: 1 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

// ---------------------------------------------------------------------------
// Data API falso (subconjunto de PostgREST que usan las rutas probadas)
// ---------------------------------------------------------------------------
type Variant = {
  id: string;
  product_id: string | null;
  title: string;
  sku: string | null;
  price: number | null;
  stock: number;
  color: string | null;
  size: string | null;
  option_label: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};
type Product = {
  id: string;
  title: string;
  handle: string;
  images: string[];
  base_price: number;
  category: { handle: string; title: string } | null;
};

class FakeSupabase {
  variants = new Map<string, Variant>();
  products = new Map<string, Product>();
  audit: Array<Record<string, unknown>> = [];
  movements: Array<Record<string, unknown>> = [];
  variantPatches: Array<{ query: string; body: Record<string, unknown> }> = [];
  ranges: string[] = [];
  badKey = 0;
  nextPatchStatus: number | null = null;
  patchDelayMs = 0;
  private server: Server | null = null;
  url = "";

  async start() {
    this.server = createServer((req, res) => void this.handle(req, res));
    await new Promise<void>((r) => this.server!.listen(0, "127.0.0.1", r));
    this.url = `http://127.0.0.1:${(this.server!.address() as AddressInfo).port}`;
  }

  stop() {
    this.server?.close();
  }

  private send(res: ServerResponse, status: number, body: unknown) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(body === undefined ? "" : JSON.stringify(body));
  }

  private static matches(row: Record<string, unknown>, filters: Array<[string, string]>) {
    return filters.every(([col, expr]) => {
      if (expr === "is.null") return row[col] === null;
      if (!expr.startsWith("eq.")) return false;
      const value = expr.slice(3);
      const cell = row[col];
      if (typeof cell === "number") return Number(value) === cell;
      return cell !== null && cell !== undefined && String(cell) === value;
    });
  }

  private productJoin(productId: string | null) {
    const p = productId ? this.products.get(productId) : undefined;
    if (!p) return null;
    return { title: p.title, handle: p.handle, images: p.images, base_price: p.base_price, categories: p.category };
  }

  private async handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? "/", "http://fake");
    if (req.headers.apikey !== SERVICE_KEY) {
      this.badKey += 1;
      return this.send(res, 401, { message: "bad key" });
    }
    const table = url.pathname.replace(/^\/rest\/v1\//, "");
    const reserved = new Set(["select", "order", "offset", "limit", "columns", "on_conflict"]);
    const filters = [...url.searchParams.entries()].filter(([k]) => !reserved.has(k)) as Array<[string, string]>;
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks).toString("utf8");
    const body = raw ? JSON.parse(raw) : null;
    const wantsObject = String(req.headers.accept ?? "").includes("vnd.pgrst.object");
    const select = url.searchParams.get("select") ?? "*";

    if (table === "admin_sessions" && req.method === "GET") {
      const ok = filters.some(([c, e]) => c === "token_hash" && e === `eq.${SID_HASH}`);
      return this.send(res, 200, ok ? [{ id: "fake-session", expires_at: new Date(Date.now() + 3_600_000).toISOString() }] : []);
    }
    if (table === "inventory_movements" && req.method === "GET") {
      return this.send(res, 200, [...this.movements].reverse().slice(0, Number(url.searchParams.get("limit") ?? 100)));
    }
    if ((table === "audit_logs" || table === "inventory_movements") && req.method === "POST") {
      const rows = Array.isArray(body) ? body : [body];
      const target = table === "audit_logs" ? this.audit : this.movements;
      for (const row of rows) {
        const v = this.variants.get(String(row.product_variant_id));
        target.push({ id: randomUUID(), created_at: new Date().toISOString(), ...row, ...(table === "inventory_movements" ? { product_variants: v ? { title: v.title, sku: v.sku } : null } : {}) });
      }
      return this.send(res, 201, undefined);
    }
    if (table !== "product_variants") return this.send(res, 404, { message: `tabla no simulada: ${table}` });

    const embed = (v: Variant) => (select.includes("products(") ? { ...v, products: this.productJoin(v.product_id) } : { ...v });
    if (req.method === "GET") {
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? 100_000);
      if (url.searchParams.has("offset")) this.ranges.push(`${offset}+${limit}`);
      const rows = [...this.variants.values()]
        .filter((v) => FakeSupabase.matches(v, filters))
        .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
        .slice(offset, offset + limit)
        .map(embed);
      if (wantsObject) return rows.length === 1 ? this.send(res, 200, rows[0]) : this.send(res, 406, { code: "PGRST116", message: "no rows" });
      return this.send(res, 200, rows);
    }
    if (req.method === "PATCH") {
      this.variantPatches.push({ query: url.search, body });
      if (this.patchDelayMs) await new Promise((r) => setTimeout(r, this.patchDelayMs));
      if (this.nextPatchStatus) {
        const status = this.nextPatchStatus;
        this.nextPatchStatus = null;
        return this.send(res, status, { code: "XX000", message: "simulated failure" });
      }
      const rows = [...this.variants.values()].filter((v) => FakeSupabase.matches(v, filters));
      for (const row of rows) Object.assign(row, body, { updated_at: new Date().toISOString() });
      const out = rows.map((r) => ({ ...r }));
      if (wantsObject) return out.length === 1 ? this.send(res, 200, out[0]) : this.send(res, 406, { code: "PGRST116", message: "no rows" });
      return this.send(res, 200, out);
    }
    return this.send(res, 405, { message: "método no simulado" });
  }
}

// ---------------------------------------------------------------------------
// Datos sintéticos (fotos reales del catálogo público, todo lo demás inventado)
// ---------------------------------------------------------------------------
const db = new FakeSupabase();
const P_WEAR = randomUUID();
const P_LASER = randomUUID();
const P_FILL = randomUUID();
const ids = {
  black: randomUUID(),
  white: randomUUID(),
  grey: randomUUID(),
  laser: randomUUID(),
  orphan: randomUUID(),
};
const TOTAL_VARIANTS = 1030;

function seed() {
  db.products.set(P_WEAR, { id: P_WEAR, title: "Playera MatrixLab Wear WR001", handle: "wear-lista-wr001", images: [], base_price: 349, category: { handle: "playeras-prendas", title: "Playeras y prendas" } });
  db.products.set(P_LASER, { id: P_LASER, title: "Grabado láser QA", handle: "qa-grabado-laser", images: ["/images/categories/matrixlab-laser.png"], base_price: 0, category: { handle: "grabado-laser", title: "Grabado láser" } });
  db.products.set(P_FILL, { id: P_FILL, title: "Imán QA", handle: "qa-iman", images: ["/images/matrixlab-stickers/imn-auto001.webp"], base_price: 89, category: { handle: "imanes", title: "Imanes" } });
  const v = (id: string, product: string | null, n: number, fields: Partial<Variant>): Variant => ({
    id, product_id: product, title: "Pieza", sku: null, price: null, stock: 5, color: null, size: null, option_label: null,
    status: "disponible", created_at: `2026-01-01T00:${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}.000Z`, updated_at: "2026-01-01T00:00:00.000Z", ...fields,
  });
  const rows = [
    v(ids.black, P_WEAR, 0, { title: "Negra / M", sku: "QA-WR001-N-M", color: "Negra", size: "M", stock: 6 }),
    v(ids.white, P_WEAR, 1, { title: "Blanca / M", sku: "QA-WR001-B-M", color: "Blanca", size: "M", stock: 2 }),
    v(ids.grey, P_WEAR, 2, { title: "Gris / L", sku: "QA-WR001-G-L", color: "Gris", size: "L", stock: 0, price: 379, status: "agotado" }),
    v(ids.laser, P_LASER, 3, { title: "Pieza", sku: "QA-LASER", stock: 0, status: "sobre_pedido" }),
    v(ids.orphan, null, 4, { title: "Variante huérfana", sku: "QA-HUERFANA", stock: 1, status: "oculto" }),
  ];
  for (let i = rows.length; i < TOTAL_VARIANTS; i++) {
    rows.push(v(randomUUID(), P_FILL, 10 + i, { title: `Pieza ${i}`, sku: `QA-FILL-${String(i).padStart(4, "0")}`, stock: i % 9 }));
  }
  for (const row of rows) db.variants.set(row.id, row);
}

// ---------------------------------------------------------------------------
// Servidor Next local
// ---------------------------------------------------------------------------
async function startServer(): Promise<ChildProcess> {
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/SUPABASE|DATABASE_URL|MERCADOPAGO|ADMIN_/i.test(key)) delete env[key];
  }
  Object.assign(env, {
    NODE_ENV: "production",
    PORT: String(PORT),
    ADMIN_SESSION_SECRET: SESSION_SECRET,
    SUPABASE_URL: db.url,
    SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
  });
  delete env.VERCEL_ENV;
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

const INIT_SCRIPT = `
  window.__csp = [];
  document.addEventListener('securitypolicyviolation', function (e) {
    window.__csp.push(e.violatedDirective + ' ' + e.blockedURI);
  });
`;

type Watch = { errors: string[]; pricePatches: Array<{ body: Record<string, unknown>; csrf: string | null }>; otherMutations: string[] };

async function newContext(browser: Browser, opts: Parameters<Browser["newContext"]>[0]): Promise<BrowserContext> {
  const ctx = await browser.newContext({ ...opts, baseURL: BASE });
  await ctx.addCookies([{ name: "ml_admin", value: adminCookie(), url: BASE, httpOnly: true, sameSite: "Lax" }]);
  await ctx.addInitScript(INIT_SCRIPT);
  if (browser.browserType().name() === "webkit") {
    // Igual que admin-inventory.browser: WebKit aplica upgrade-insecure-requests
    // también a http://localhost. Sólo se quita esa directiva del documento.
    await ctx.route("**/admin/inventario", async (route) => {
      const response = await route.fetch();
      const headers = { ...response.headers() };
      headers["content-security-policy"] = (headers["content-security-policy"] ?? "").replace(/;\s*upgrade-insecure-requests/, "");
      await route.fulfill({ response, headers });
    });
  }
  return ctx;
}

async function openInventory(ctx: BrowserContext, watch: Watch, label: string): Promise<Page> {
  const page = await ctx.newPage();
  page.on("pageerror", (e) => watch.errors.push(`${label} pageerror: ${e.message}`));
  page.on("console", (m) => {
    // Los 4xx/5xx se registran abajo con su URL; aquí sólo errores reales.
    if (m.type() !== "error" || m.text().startsWith("Failed to load resource")) return;
    if (m.text().includes("/_vercel/insights/")) return; // Analytics sólo existe en Vercel.
    watch.errors.push(`${label} console: ${m.text()}`);
  });
  page.on("response", (res) => {
    const path = new URL(res.url()).pathname;
    // 409/500 de la API de precio los provoca el escenario a propósito.
    if (res.status() >= 400 && !path.startsWith("/_vercel/") && path !== "/api/admin/inventory/price") {
      watch.errors.push(`${label} ${res.status()} ${path}`);
    }
  });
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (url.pathname === "/api/admin/inventory/price") {
      watch.pricePatches.push({ body: JSON.parse(req.postData() ?? "null"), csrf: req.headers()["x-ml-csrf"] ?? null });
    } else if (req.method() !== "GET" && !url.pathname.startsWith("/admin/inventario")) {
      watch.otherMutations.push(`${req.method()} ${url.pathname}`);
    }
  });
  await page.goto("/admin/inventario", { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="inventory-row"]');
  return page;
}

const row = (page: Page, sku: string) => page.locator('[data-testid="inventory-row"]', { hasText: sku }).first();
const priceText = async (page: Page, sku: string) => (await row(page, sku).getByTestId("inventory-price").textContent())?.trim();
const sourceText = async (page: Page, sku: string) => (await row(page, sku).getByTestId("inventory-price-source").textContent())?.trim();
const field = (page: Page, sku: string) => row(page, sku).getByLabel("Nuevo precio (MXN)");
const editorOf = (page: Page, sku: string) => row(page, sku).getByTestId("inventory-price-editor");

async function openEditor(page: Page, sku: string) {
  await row(page, sku).getByRole("button", { name: /^Editar precio de / }).click();
  await editorOf(page, sku).waitFor();
}

async function waitFor(fn: () => Promise<boolean> | boolean, ms = 8000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

async function layoutIssues(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const issues: string[] = [];
    const vw = window.innerWidth;
    if (document.documentElement.scrollWidth > vw + 1) issues.push(`scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);
    document.querySelectorAll('[data-testid="inventory-row"]').forEach((r, i) => {
      if (i > 6) return;
      r.querySelectorAll("td, td *").forEach((el) => {
        const box = el.getBoundingClientRect();
        if (box.width && (box.right > vw + 1 || box.left < -1)) issues.push(`fila ${i} ${el.tagName} recortado`);
      });
    });
    return [...new Set(issues)];
  });
}

const variant = (id: string) => db.variants.get(id)!;
const snapshot = () => JSON.stringify([...db.variants.values()].map((v) => [v.id, v.price, v.stock, v.status, v.title, v.sku, v.color, v.size]));

// ---------------------------------------------------------------------------
// API: sesión, CSRF, validación, no-store
// ---------------------------------------------------------------------------
async function apiSuite() {
  console.log("\n--- API /api/admin/inventory/price: auth, CSRF y validación ---");
  const before = snapshot();
  const patchesBefore = db.variantPatches.length;
  const call = (headers: Record<string, string>, body: unknown) =>
    fetch(`${BASE}/api/admin/inventory/price`, { method: "PATCH", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  const valid = { variantId: ids.black, price: 1, expectedPrice: null };
  const cookie = `ml_admin=${adminCookie()}`;

  const noSession = await call({}, valid);
  check("sin sesión → 401", noSession.status === 401, String(noSession.status));
  check("401 no-store", (noSession.headers.get("cache-control") ?? "").includes("no-store"));
  const noCsrf = await call({ Cookie: cookie }, valid);
  check("sesión sin CSRF → 401", noCsrf.status === 401, String(noCsrf.status));
  const badCsrf = await call({ Cookie: cookie, "x-ml-csrf": randomBytes(18).toString("base64url") }, valid);
  check("CSRF incorrecto → 401", badCsrf.status === 401, String(badCsrf.status));
  const forged = adminCookie().replace(/\.[^.]+$/, `.${randomBytes(32).toString("base64url")}`);
  const badSig = await call({ Cookie: `ml_admin=${forged}`, "x-ml-csrf": CSRF }, valid);
  check("firma de sesión falsa → 401", badSig.status === 401, String(badSig.status));

  const auth = { Cookie: cookie, "x-ml-csrf": CSRF };
  const invalid: Array<[string, unknown]> = [
    ["precio como texto con coma", { variantId: ids.black, price: "399,50", expectedPrice: null }],
    ["vacío", { variantId: ids.black, price: "", expectedPrice: null }],
    ["sin price", { variantId: ids.black, expectedPrice: null }],
    ["negativo", { variantId: ids.black, price: -1, expectedPrice: null }],
    ["3 decimales", { variantId: ids.black, price: 10.555, expectedPrice: null }],
    ["> 1,000,000", { variantId: ids.black, price: 1_000_001, expectedPrice: null }],
    ["llave stock extra", { variantId: ids.black, price: 10, expectedPrice: null, stock: 0 }],
  ];
  for (const [name, body] of invalid) {
    const res = await call(auth, body);
    const data = await res.json().catch(() => null);
    check(`${name} → 400 genérico`, res.status === 400 && data?.code === "INVALID_PRICE" && !JSON.stringify(data).includes("issues"), String(res.status));
  }
  const notJson = await fetch(`${BASE}/api/admin/inventory/price`, { method: "PATCH", headers: { ...auth, "Content-Type": "application/json" }, body: "{precio" });
  check("JSON roto → 400", notJson.status === 400);
  const missing = await call(auth, { variantId: randomUUID(), price: 10, expectedPrice: null });
  check("variante inexistente → 404 no-store", missing.status === 404 && (missing.headers.get("cache-control") ?? "").includes("no-store"), String(missing.status));
  const noBase = await call(auth, { variantId: ids.orphan, price: null, expectedPrice: null });
  check("quitar precio sin base → 422", noBase.status === 422, String(noBase.status));
  const get = await fetch(`${BASE}/api/admin/inventory/price`, { headers: { Cookie: cookie } });
  check("GET no existe (405)", get.status === 405, String(get.status));

  check("ningún intento rechazado escribió en la base", snapshot() === before && db.variantPatches.length === patchesBefore);
  check("ninguna auditoría por intentos rechazados", db.audit.length === 0);
}

// ---------------------------------------------------------------------------
// Flujo completo en escritorio (Chromium)
// ---------------------------------------------------------------------------
async function desktopSuite(browser: Browser) {
  console.log("\n--- /admin/inventario escritorio [chromium] ---");
  const watch: Watch = { errors: [], pricePatches: [], otherMutations: [] };
  const ctx = await newContext(browser, { viewport: { width: 1440, height: 900 } });
  const page = await openInventory(ctx, watch, "1440");

  const headers = (await page.locator("thead th").allTextContents()).map((t) => t.trim());
  check("7 columnas con Precio MXN", headers.join("|") === "Producto|Bloque|Variante|SKU|Precio MXN|Stock|Estado", headers.join("|"));
  check(`las ${TOTAL_VARIANTS} variantes, en páginas de 500`, (await page.getByText(`${TOTAL_VARIANTS} de ${TOTAL_VARIANTS} variantes`).count()) === 1 && db.ranges.slice(0, 3).join(",") === "0+500,500+500,1000+500", db.ranges.slice(0, 3).join(","));
  check("hereda base: $349.00 + fuente", (await priceText(page, "QA-WR001-N-M")) === "$349.00" && (await sourceText(page, "QA-WR001-N-M")) === "Hereda precio base");
  check("precio propio: $379.00", (await priceText(page, "QA-WR001-G-L")) === "$379.00" && (await sourceText(page, "QA-WR001-G-L")) === "Precio de variante");
  check("base $0 → $0.00", (await priceText(page, "QA-LASER")) === "$0.00");
  check("huérfana → Sin precio", (await priceText(page, "QA-HUERFANA")) === "Sin precio");
  check("fotos y bloque siguen", (await row(page, "QA-WR001-B-M").locator("img").getAttribute("src")) === "/images/matrixlab-wear/colors/wr001-blanca.webp" && (await row(page, "QA-LASER").textContent())!.includes("MatrixLab Láser"));

  // Sin cambios / cancelar / Escape / inválidos → cero peticiones.
  await openEditor(page, "QA-WR001-N-M");
  check("editor con el precio vigente", (await field(page, "QA-WR001-N-M").inputValue()) === "349.00");
  await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Guardar" }).click();
  check("mismo precio → cierra sin petición", (await editorOf(page, "QA-WR001-N-M").count()) === 0 && watch.pricePatches.length === 0);
  await openEditor(page, "QA-WR001-N-M");
  await field(page, "QA-WR001-N-M").fill("555");
  await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Cancelar" }).click();
  await openEditor(page, "QA-WR001-N-M");
  await field(page, "QA-WR001-N-M").fill("556");
  await field(page, "QA-WR001-N-M").press("Escape");
  check("Cancelar y Escape → sin petición y precio intacto", watch.pricePatches.length === 0 && (await editorOf(page, "QA-WR001-N-M").count()) === 0 && (await priceText(page, "QA-WR001-N-M")) === "$349.00");
  await openEditor(page, "QA-WR001-N-M");
  for (const [text, message] of [["", "Escribe un precio."], ["12abc", "Usa solo números"], ["1,234", "Máximo dos decimales"], ["-5", "negativo"]] as const) {
    await field(page, "QA-WR001-N-M").fill(text);
    await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Guardar" }).click();
    const alert = (await editorOf(page, "QA-WR001-N-M").getByRole("alert").textContent()) ?? "";
    check(`"${text}" → error en pantalla, sin petición`, alert.includes(message) && watch.pricePatches.length === 0 && (await field(page, "QA-WR001-N-M").getAttribute("aria-invalid")) === "true", alert);
  }
  check("blur del campo no guarda", await (async () => { await field(page, "QA-WR001-N-M").fill("777"); await page.locator("#inventory-search").focus(); await page.waitForTimeout(300); return watch.pricePatches.length === 0; })());

  // Error 500 conserva el borrador; reintento explícito guarda.
  db.nextPatchStatus = 500;
  await field(page, "QA-WR001-N-M").fill("399,50");
  await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Guardar" }).click();
  await editorOf(page, "QA-WR001-N-M").getByRole("alert").waitFor();
  const err500 = (await editorOf(page, "QA-WR001-N-M").getByRole("alert").textContent()) ?? "";
  check("500 → mensaje claro, borrador y 'Sin guardar'", err500.includes("No pudimos guardar el precio") && (await field(page, "QA-WR001-N-M").inputValue()) === "399,50" && (await editorOf(page, "QA-WR001-N-M").getByText("Sin guardar.").count()) === 1, err500);
  check("500 → base sin cambios", variant(ids.black).price === null);
  check("500 → Guardar vuelve a estar disponible", await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Guardar" }).isEnabled());

  // Red caída.
  await page.route("**/api/admin/inventory/price", (r) => r.abort("failed"), { times: 1 });
  await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Guardar" }).click();
  check(
    "red caída → 'No pudimos confirmar el guardado', borrador intacto, sin afirmar que no se guardó",
    (await waitFor(async () => ((await editorOf(page, "QA-WR001-N-M").getByRole("alert").textContent()) ?? "").includes("No pudimos confirmar el guardado. Revisa tu conexión y el precio actual antes de reintentar."))) &&
      (await field(page, "QA-WR001-N-M").inputValue()) === "399,50" &&
      !((await editorOf(page, "QA-WR001-N-M").getByRole("alert").textContent()) ?? "").includes("no se guardó"),
  );

  // Guardado real con busy y doble toque.
  db.patchDelayMs = 1200;
  const patchesBefore = db.variantPatches.length;
  const pageRequests = watch.pricePatches.length;
  await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Guardar" }).evaluate((b) => {
    const button = b as HTMLButtonElement;
    button.click();
    button.click();
    button.form!.requestSubmit(); // Enter en el campo = submit del formulario
  });
  await page.waitForTimeout(250);
  const busy = {
    readOnly: await field(page, "QA-WR001-N-M").evaluate((el) => (el as HTMLInputElement).readOnly),
    saveDisabled: await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Guardando…" }).isDisabled(),
    cancelDisabled: await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Cancelar" }).isDisabled(),
  };
  check("busy: campo de solo lectura, Guardar y Cancelar deshabilitados", busy.readOnly && busy.saveDisabled && busy.cancelDisabled, JSON.stringify(busy));
  check("guardado confirmado en pantalla", await waitFor(async () => (await priceText(page, "QA-WR001-N-M")) === "$399.50"));
  db.patchDelayMs = 0;
  check("doble toque + Enter → una sola petición y un solo UPDATE", watch.pricePatches.length - pageRequests === 1 && db.variantPatches.length - patchesBefore === 1, `${watch.pricePatches.length - pageRequests}/${db.variantPatches.length - patchesBefore}`);
  const sent = watch.pricePatches.at(-1)!;
  check("cuerpo: coma → 399.5, expectedPrice null, CSRF", JSON.stringify(sent.body) === JSON.stringify({ variantId: ids.black, price: 399.5, expectedPrice: null }) && sent.csrf === CSRF, JSON.stringify(sent.body));
  const update = db.variantPatches.at(-1)!;
  check("UPDATE sólo price con id + price IS NULL", JSON.stringify(update.body) === JSON.stringify({ price: 399.5 }) && update.query.includes(`id=eq.${ids.black}`) && update.query.includes("price=is.null"), update.query);
  check("Negra/M: precio nuevo, stock y estado intactos", variant(ids.black).price === 399.5 && variant(ids.black).stock === 6 && variant(ids.black).status === "disponible");
  check("Blanca/M (mismo producto, otro color) intacta", variant(ids.white).price === null && variant(ids.white).stock === 2);
  check("precio base del producto intacto", db.products.get(P_WEAR)!.base_price === 349 && (await priceText(page, "QA-WR001-B-M")) === "$349.00");
  check("tras refrescar: Precio de variante", await waitFor(async () => (await sourceText(page, "QA-WR001-N-M")) === "Precio de variante"));
  const audit1 = db.audit.at(-1) as { action?: string; entity_id?: string; metadata?: Record<string, unknown> } | undefined;
  check(
    "auditoría inventory.price_update old/new",
    audit1?.action === "inventory.price_update" && audit1.entity_id === ids.black && audit1.metadata?.old_price === null && audit1.metadata?.new_price === 399.5,
    JSON.stringify(audit1?.metadata),
  );
  check("auditoría sin secretos", !JSON.stringify(db.audit).includes(CSRF) && !JSON.stringify(db.audit).includes(SERVICE_KEY) && !JSON.stringify(db.audit).includes(SID));
  check("el precio no crea movimientos de inventario", db.movements.length === 0);

  // Conflicto: otro dispositivo cambia el precio después de la lectura.
  variant(ids.black).price = 420;
  await openEditor(page, "QA-WR001-N-M");
  await field(page, "QA-WR001-N-M").fill("410");
  await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Guardar" }).click();
  await editorOf(page, "QA-WR001-N-M").getByRole("alert").waitFor();
  const conflict = (await editorOf(page, "QA-WR001-N-M").getByRole("alert").textContent()) ?? "";
  check("409 → avisa el precio vigente y conserva el borrador", conflict.includes("Otro dispositivo") && conflict.includes("$420.00") && (await field(page, "QA-WR001-N-M").inputValue()) === "410", conflict);
  check("409 → no pisó el precio del otro dispositivo", variant(ids.black).price === 420);
  check("409 → la fila muestra el precio vigente", await waitFor(async () => (await priceText(page, "QA-WR001-N-M")) === "$420.00"));
  await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Guardar" }).click();
  check("reemplazo explícito tras revisar → guarda 410", await waitFor(async () => variant(ids.black).price === 410 && (await priceText(page, "QA-WR001-N-M")) === "$410.00"));
  check("auditoría del reemplazo: 420 → 410", (db.audit.at(-1) as { metadata?: Record<string, unknown> }).metadata?.old_price === 420 && (db.audit.at(-1) as { metadata?: Record<string, unknown> }).metadata?.new_price === 410);

  // Tiempo agotado (15 s): no se afirma nada; el reintento choca con el CAS.
  await openEditor(page, "QA-WR001-N-M");
  await field(page, "QA-WR001-N-M").fill("415");
  db.patchDelayMs = 17_000;
  const t0 = Date.now();
  await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Guardar" }).click();
  const timedOut = await waitFor(async () => ((await editorOf(page, "QA-WR001-N-M").getByRole("alert").textContent().catch(() => "")) ?? "").includes("No pudimos confirmar el guardado"), 25_000);
  const waited = Date.now() - t0;
  check("timeout ~15 s → aviso sin confirmar", timedOut && waited >= 14_000 && waited < 20_000, `${waited} ms`);
  check("timeout → busy liberado y borrador intacto", (await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Guardar" }).isEnabled()) && (await field(page, "QA-WR001-N-M").inputValue()) === "415");
  check("el servidor sí terminó guardando (por eso no se afirma lo contrario)", await waitFor(() => variant(ids.black).price === 415, 6000));
  db.patchDelayMs = 0;
  await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Guardar" }).click();
  await waitFor(async () => ((await editorOf(page, "QA-WR001-N-M").getByRole("alert").textContent()) ?? "").includes("Otro dispositivo"));
  check("reintento tras timeout → 409 con el vigente (sin reintento silencioso)", ((await editorOf(page, "QA-WR001-N-M").getByRole("alert").textContent()) ?? "").includes("$415.00") && variant(ids.black).price === 415);
  await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Cancelar" }).click();

  // Quitar precio propio → vuelve a la base.
  await openEditor(page, "QA-WR001-G-L");
  check("huérfana no ofrece 'Usar precio base'", await (async () => { await openEditor(page, "QA-HUERFANA"); const n = await editorOf(page, "QA-HUERFANA").getByRole("button", { name: /Usar precio base/ }).count(); await editorOf(page, "QA-HUERFANA").getByRole("button", { name: "Cancelar" }).click(); return n === 0; })());
  await editorOf(page, "QA-WR001-G-L").getByRole("button", { name: "Usar precio base ($349.00)" }).click();
  check("Usar precio base → price null en la base", await waitFor(() => variant(ids.grey).price === null));
  check("la fila hereda $349.00", await waitFor(async () => (await priceText(page, "QA-WR001-G-L")) === "$349.00" && (await sourceText(page, "QA-WR001-G-L")) === "Hereda precio base"));
  check("expectedPrice 379 enviado", JSON.stringify(watch.pricePatches.at(-1)!.body) === JSON.stringify({ variantId: ids.grey, price: null, expectedPrice: 379 }));
  check("Gris/L sigue agotada con stock 0", variant(ids.grey).status === "agotado" && variant(ids.grey).stock === 0);

  // Precio 0 explícito.
  await openEditor(page, "QA-WR001-B-M");
  await field(page, "QA-WR001-B-M").fill("0");
  await editorOf(page, "QA-WR001-B-M").getByRole("button", { name: "Guardar" }).click();
  check("precio 0 se guarda y muestra $0.00", await waitFor(async () => variant(ids.white).price === 0 && (await priceText(page, "QA-WR001-B-M")) === "$0.00"));

  // Stock sigue funcionando y no toca precio.
  const blackPrice = variant(ids.black).price;
  await page.getByRole("button", { name: "Sumar 1 a Playera MatrixLab Wear WR001 · Negra / M" }).click();
  check("ajuste de stock existente sigue funcionando", await waitFor(() => variant(ids.black).stock === 7));
  check("el ajuste de stock no tocó el precio", variant(ids.black).price === blackPrice && db.movements.length === 1);
  check("PATCH de stock por la ruta original", watch.otherMutations.includes("PATCH /api/admin/inventory"), watch.otherMutations.join(","));

  // Borrador abierto + cambio externo + refresco por ajuste de stock normal:
  // el precio esperado sigue siendo el visto al abrir → 409, nunca pisarlo.
  await openEditor(page, "QA-WR001-B-M");
  await field(page, "QA-WR001-B-M").fill("55");
  variant(ids.white).price = 77; // otro dispositivo
  await page.getByRole("button", { name: "Sumar 1 a Playera MatrixLab Wear WR001 · Blanca / M" }).click();
  check("refresco por stock trae el precio ajeno a la fila", await waitFor(async () => variant(ids.white).stock === 3 && (await priceText(page, "QA-WR001-B-M")) === "$77.00"));
  check("el borrador sigue abierto e intacto tras el refresco", (await field(page, "QA-WR001-B-M").inputValue()) === "55");
  await editorOf(page, "QA-WR001-B-M").getByRole("button", { name: "Guardar" }).click();
  await editorOf(page, "QA-WR001-B-M").getByRole("alert").waitFor();
  const stale = (await editorOf(page, "QA-WR001-B-M").getByRole("alert").textContent()) ?? "";
  check("guardar el borrador viejo → 409 con el precio ajeno", stale.includes("Otro dispositivo") && stale.includes("$77.00"), stale);
  check("expectedPrice enviado = precio visto al abrir (0)", JSON.stringify(watch.pricePatches.at(-1)!.body) === JSON.stringify({ variantId: ids.white, price: 55, expectedPrice: 0 }));
  check("precio ajeno intacto, stock intacto", variant(ids.white).price === 77 && variant(ids.white).stock === 3);
  await editorOf(page, "QA-WR001-B-M").getByRole("button", { name: "Cancelar" }).click();

  check("sin violaciones de CSP", (await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).length === 0);
  if (SHOTS) await page.screenshot({ path: join(SHOTS, "admin-precio-desktop-1440-chromium.png") });
  check("sin errores de runtime", watch.errors.length === 0, watch.errors.slice(0, 3).join(" | "));
  await ctx.close();
}

// ---------------------------------------------------------------------------
// iPhone / anchos móviles
// ---------------------------------------------------------------------------
async function mobileSuite(browser: Browser, engine: string) {
  console.log(`\n--- /admin/inventario móvil [${engine}] ---`);
  const watch: Watch = { errors: [], pricePatches: [], otherMutations: [] };
  const iphone = { ...devices["iPhone 14"], defaultBrowserType: undefined };
  for (const width of [320, 375, 390, 430]) {
    const ctx = await newContext(browser, { ...iphone, viewport: { width, height: 844 } });
    const page = await openInventory(ctx, watch, `${engine}-${width}`);
    check(`[${engine}] ${width}: tarjetas sin overflow`, (await layoutIssues(page)).length === 0, (await layoutIssues(page)).slice(0, 3).join(" | "));
    await openEditor(page, "QA-WR001-N-M");
    const metrics = await editorOf(page, "QA-WR001-N-M").evaluate((el) => {
      const input = el.querySelector("input")!;
      const card = el.closest('[data-testid="inventory-row"]')!.getBoundingClientRect();
      return {
        font: parseFloat(getComputedStyle(input).fontSize),
        mode: input.getAttribute("inputmode"),
        type: input.getAttribute("type"),
        small: [...el.querySelectorAll<HTMLElement>("button, input")].filter((b) => b.getBoundingClientRect().height < 44).map((b) => b.textContent),
        widthRatio: el.getBoundingClientRect().width / (card.width - 32),
      };
    });
    check(`[${engine}] ${width}: campo decimal ≥16px, controles ≥44px, ancho completo`, metrics.font >= 16 && metrics.mode === "decimal" && metrics.type === "text" && metrics.small.length === 0 && metrics.widthRatio > 0.95, JSON.stringify(metrics));
    check(`[${engine}] ${width}: editor abierto sin overflow`, (await layoutIssues(page)).length === 0, (await layoutIssues(page)).slice(0, 3).join(" | "));
    const editBtn = await row(page, "QA-WR001-B-M").getByRole("button", { name: /^Editar precio de / }).boundingBox();
    check(`[${engine}] ${width}: 'Editar precio' ≥44px`, !!editBtn && editBtn.height >= 44, JSON.stringify(editBtn));
    if (width === 390) {
      // Flujo completo en el iPhone: escribir con coma, guardar, confirmar.
      const before = variant(ids.laser).price;
      await editorOf(page, "QA-WR001-N-M").getByRole("button", { name: "Cancelar" }).click();
      await openEditor(page, "QA-LASER");
      await field(page, "QA-LASER").fill("125,5");
      if (SHOTS) {
        await row(page, "QA-LASER").scrollIntoViewIfNeeded();
        await page.screenshot({ path: join(SHOTS, `admin-precio-editor-iphone-390-${engine}.png`) });
      }
      await editorOf(page, "QA-LASER").getByRole("button", { name: "Guardar" }).click();
      check(`[${engine}] 390: guardado en iPhone`, before === null && (await waitFor(async () => variant(ids.laser).price === 125.5 && (await priceText(page, "QA-LASER")) === "$125.50")));
      check(`[${engine}] 390: cifra en una línea`, await row(page, "QA-LASER").getByTestId("inventory-price").evaluate((el) => el.getBoundingClientRect().height < 30));
      if (SHOTS) {
        await row(page, "QA-LASER").scrollIntoViewIfNeeded();
        await page.screenshot({ path: join(SHOTS, `admin-precio-guardado-iphone-390-${engine}.png`) });
      }
      // Volver al estado previo con la propia UI (base $0 → 0 explícito no; se quita el precio propio).
      await openEditor(page, "QA-LASER");
      await editorOf(page, "QA-LASER").getByRole("button", { name: "Usar precio base ($0.00)" }).click();
      check(`[${engine}] 390: vuelve a heredar $0.00`, await waitFor(async () => variant(ids.laser).price === null && (await priceText(page, "QA-LASER")) === "$0.00"));
    } else if (SHOTS && width === 320) {
      await row(page, "QA-WR001-N-M").scrollIntoViewIfNeeded();
      await page.screenshot({ path: join(SHOTS, `admin-precio-editor-iphone-320-${engine}.png`) });
    }
    check(`[${engine}] ${width}: sin violaciones de CSP`, (await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).length === 0);
    await ctx.close();
  }
  check(`[${engine}] sin errores de runtime`, watch.errors.length === 0, watch.errors.slice(0, 3).join(" | "));
}

async function main() {
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
  seed();
  await db.start();
  const server = await startServer();
  try {
    console.log("\n--- Servidor local aislado ---");
    const page = await fetch(`${BASE}/admin/inventario`, { headers: { Cookie: `ml_admin=${adminCookie()}` }, redirect: "manual" });
    check("/admin/inventario con sesión efímera → 200", page.status === 200, String(page.status));
    const anon = await fetch(`${BASE}/admin/inventario`, { redirect: "manual" });
    check("/admin/inventario sin sesión → login", [302, 303, 307, 308].includes(anon.status) && (anon.headers.get("location") ?? "").includes("/admin/login"), String(anon.status));
    check("el servidor sólo habló con el Data API falso (llave efímera)", db.badKey === 0);

    await apiSuite();
    const browser = await chromium.launch();
    await desktopSuite(browser);
    await mobileSuite(browser, "chromium");
    await browser.close();
    const wk = await webkit.launch().catch(() => null);
    if (wk) {
      await mobileSuite(wk, "webkit");
      await wk.close();
    } else {
      console.log("(WebKit no instalado: se omite la pasada en WebKit)");
    }
    check("ningún producto (precio base) modificado", db.products.get(P_WEAR)!.base_price === 349 && db.products.get(P_LASER)!.base_price === 0 && db.products.get(P_FILL)!.base_price === 89);
    check("ninguna llave de servicio incorrecta", db.badKey === 0);
  } finally {
    server.kill();
    db.stop();
  }
  console.log(failures === 0 ? "\nTodo OK." : `\n${failures} fallo(s).`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Error");
  process.exit(1);
});
