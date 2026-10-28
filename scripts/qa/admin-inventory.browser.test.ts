/**
 * QA de NAVEGADOR de Inventario (bloque comercial + miniatura).
 *
 * Levanta DOS `next start` (requiere `next build` previo), ambos con
 * NODE_ENV=production y SIN Supabase ni credenciales:
 *   - VERCEL_ENV=preview    → /preview/inventario responde con la muestra;
 *   - VERCEL_ENV=production → /preview/inventario responde 404.
 * En los dos, /admin/inventario sigue exigiendo sesión admin.
 *
 * Sobre la vista de muestra verifica: banner, fotos reales que cargan,
 * fallback "Sin imagen", búsqueda y filtro por bloque, estado sin resultados,
 * CERO peticiones de mutación (modo readOnly), tarjetas legibles sin overflow
 * a 320/375/390/430 px, objetivos táctiles ≥44px, campos ≥16px, tabla densa
 * a 1440 px, cero errores de runtime y cero violaciones de CSP.
 *
 * Capturas opcionales: INVENTORY_SCREENSHOT_DIR=<carpeta fuera del repo>.
 *
 * Uso: npx tsx scripts/qa/admin-inventory.browser.test.ts
 */
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, devices, webkit, type Browser, type Page } from "@playwright/test";

const ROOT = join(__dirname, "..", "..");
const SHOTS = process.env.INVENTORY_SCREENSHOT_DIR;
const PREVIEW_ROWS = 13;

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

async function startServer(vercelEnv: "preview" | "production"): Promise<{ child: ChildProcess; base: string }> {
  const port = 3000 + Math.floor(Math.random() * 400) + (vercelEnv === "preview" ? 3800 : 4300);
  const base = `http://localhost:${port}`;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ADMIN_SESSION_SECRET: randomBytes(36).toString("base64url"),
    NODE_ENV: "production",
    VERCEL_ENV: vercelEnv,
    PORT: String(port),
  };
  for (const key of Object.keys(env)) {
    if (/SUPABASE|DATABASE_URL|MERCADOPAGO/i.test(key)) delete env[key];
  }
  const child = spawn(process.execPath, [join(ROOT, "node_modules", "next", "dist", "bin", "next"), "start", "-p", String(port)], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "ignore", "pipe"],
  });
  child.stderr?.on("data", () => { /* no imprimir: podría incluir rutas/env */ });
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`${base}/admin/login`, { redirect: "manual" });
      if (res.status > 0) return { child, base };
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

type Watch = { errors: string[]; mutations: string[] };

async function openPreview(browser: Browser, base: string, opts: Parameters<Browser["newContext"]>[0], watch: Watch, label: string) {
  const ctx = await browser.newContext({ ...opts, baseURL: base });
  await ctx.addInitScript(INIT_SCRIPT);
  if (browser.browserType().name() === "webkit") {
    // WebKit aplica `upgrade-insecure-requests` también a http://localhost y
    // pide CSS/JS por https (que el servidor local no sirve). En Vercel todo
    // es https; aquí se quita SÓLO esa directiva del documento para WebKit.
    // Chromium conserva la CSP completa y es el que verifica violaciones.
    await ctx.route("**/preview/inventario", async (route) => {
      const response = await route.fetch();
      const headers = { ...response.headers() };
      headers["content-security-policy"] = (headers["content-security-policy"] ?? "")
        .replace(/;\s*upgrade-insecure-requests/, "");
      await route.fulfill({ response, headers });
    });
  }
  const page = await ctx.newPage();
  page.on("pageerror", (e) => watch.errors.push(`${label} pageerror: ${e.message}`));
  page.on("console", (m) => {
    // Los 404 se registran abajo con su URL; aquí sólo errores reales.
    if (m.type() !== "error" || m.text().startsWith("Failed to load resource")) return;
    if (m.text().includes("/_vercel/insights/")) return; // Analytics sólo existe en Vercel.
    watch.errors.push(`${label} console: ${m.text()}`);
  });
  page.on("response", (res) => {
    const path = new URL(res.url()).pathname;
    if (res.status() >= 400 && !path.startsWith("/_vercel/")) watch.errors.push(`${label} ${res.status()} ${path}`);
  });
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (req.method() !== "GET" || url.pathname.startsWith("/api/")) {
      watch.mutations.push(`${req.method()} ${url.pathname}`);
    }
  });
  await page.goto("/preview/inventario", { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="inventory-row"]');
  return { ctx, page };
}

const rowCount = (page: Page) => page.locator('[data-testid="inventory-row"]').count();

async function layoutIssues(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const issues: string[] = [];
    const vw = window.innerWidth;
    if (document.documentElement.scrollWidth > vw + 1) issues.push(`scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);
    document.querySelectorAll('[data-testid="inventory-row"]').forEach((row, i) => {
      const r = row.getBoundingClientRect();
      if (r.left < -1 || r.right > vw + 1) issues.push(`fila ${i} fuera (${Math.round(r.left)}-${Math.round(r.right)})`);
      row.querySelectorAll("td, td *").forEach((el) => {
        const box = el.getBoundingClientRect();
        if (box.width && (box.right > vw + 1 || box.left < -1)) issues.push(`fila ${i} ${el.tagName} recortado`);
      });
    });
    return [...new Set(issues)];
  });
}

/** Las miniaturas son lazy: para medir y capturar se fuerza su carga. */
async function loadAllImages(page: Page) {
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll<HTMLImageElement>('[data-testid="inventory-row"] img')];
    imgs.forEach((img) => { img.loading = "eager"; });
    await Promise.all(imgs.map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))));
  });
}

async function previewSuite(browser: Browser, base: string, engine: string) {
  console.log(`\n--- Vista previa /preview/inventario [${engine}] ---`);
  const watch: Watch = { errors: [], mutations: [] };

  // Escritorio 1440.
  const { ctx, page } = await openPreview(browser, base, { viewport: { width: 1440, height: 900 } }, watch, "1440");
  check(`[${engine}] banner de muestra visible`, await page.getByText("Datos de muestra · Solo lectura").isVisible());
  check(`[${engine}] ${PREVIEW_ROWS} variantes de muestra`, (await rowCount(page)) === PREVIEW_ROWS, String(await rowCount(page)));
  const headers = (await page.locator("thead th").allTextContents()).map((t) => t.trim());
  check(`[${engine}] 1440: columnas Producto/Bloque/Variante/SKU/Stock/Estado`, headers.join("|") === "Producto|Bloque|Variante|SKU|Stock|Estado", headers.join("|"));
  await loadAllImages(page);
  const imgs = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLImageElement>('[data-testid="inventory-row"] img')].map((img) => ({
      ok: img.complete && img.naturalWidth > 0,
      alt: img.alt,
      fit: getComputedStyle(img).objectFit,
      w: img.getAttribute("width"),
      h: img.getAttribute("height"),
      lazy: img.getAttribute("loading"),
      box: Math.round(img.closest("[data-testid=inventory-thumb]")!.getBoundingClientRect().width),
    })),
  );
  check(`[${engine}] fotos reales cargan (${imgs.length})`, imgs.length >= 9 && imgs.every((i) => i.ok), JSON.stringify(imgs.filter((i) => !i.ok)));
  check(`[${engine}] miniaturas object-contain con width/height y alt`, imgs.every((i) => i.fit === "contain" && i.w === "64" && i.h === "64" && i.alt.startsWith("Foto de ")));
  check(`[${engine}] miniatura de escritorio 56px`, imgs.every((i) => i.box === 56), [...new Set(imgs.map((i) => i.box))].join(","));
  check(`[${engine}] fallback 'Sin imagen' (3 casos, sin icono roto)`, (await page.getByText("Sin imagen", { exact: true }).count()) === 3);
  check(`[${engine}] 1440: filas de tabla densas`, (await page.locator('[data-testid="inventory-row"]').first().evaluate((el) => getComputedStyle(el).display)) === "table-row");
  check(`[${engine}] 1440: sin overflow`, (await layoutIssues(page)).length === 0, (await layoutIssues(page)).slice(0, 3).join(" | "));
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `inventario-preview-desktop-1440-${engine}.png`), fullPage: true });

  // Búsqueda y filtro por bloque.
  const search = page.getByLabel("Buscar");
  const blockSelect = page.getByLabel("Bloque", { exact: true });
  await search.fill("laser");
  check(`[${engine}] búsqueda 'laser' (sin acento) → bloque Láser`, (await rowCount(page)) === 1 && (await page.locator('[data-testid="inventory-row"]').first().textContent())!.includes("MatrixLab Láser"));
  await search.fill("wraps");
  check(`[${engine}] búsqueda por categoría 'wraps' → UV Sticker`, (await rowCount(page)) === 1 && (await page.locator('[data-testid="inventory-row"]').first().textContent())!.includes("UV Sticker"));
  await search.fill("");
  const optionsText = await blockSelect.locator("option").allTextContents();
  check(`[${engine}] opciones del filtro con 'Todos los bloques' y conteos`, optionsText[0].startsWith("Todos los bloques (13)") && optionsText.some((o) => o.startsWith("Sin bloque (2)")), optionsText.join(" | "));
  await blockSelect.selectOption("stickers");
  const stickerRows = await page.locator('[data-testid="inventory-row"]').allTextContents();
  check(`[${engine}] MatrixLab Stickers → sólo el imán (UV Sticker queda fuera)`, stickerRows.length === 1 && !stickerRows[0].includes("UV Sticker"), String(stickerRows.length));
  await blockSelect.selectOption("tumbler");
  const tumblerRows = await page.locator('[data-testid="inventory-row"]').allTextContents();
  check(`[${engine}] MatrixLab Tumbler → UV Sticker, Sparkle y vaso`, tumblerRows.length === 3 && tumblerRows.some((t) => t.includes("UV Sticker")));
  await blockSelect.selectOption("wear");
  check(`[${engine}] MatrixLab Wear → 3 colores + gorra`, (await rowCount(page)) === 4);
  const wearSrcs = await page.locator('[data-testid="inventory-row"] img').evaluateAll((els) => els.map((e) => (e as HTMLImageElement).getAttribute("src")));
  check(`[${engine}] foto distinta por color`, new Set(wearSrcs).size === 3 && wearSrcs.every((s) => s?.includes("/colors/wr001-")), wearSrcs.join(","));
  await blockSelect.selectOption("none");
  check(`[${engine}] Sin bloque → sin categoría + huérfana`, (await rowCount(page)) === 2);
  await search.fill("zzz-no-existe");
  check(`[${engine}] estado sin resultados`, await page.getByText("Ninguna variante coincide con los filtros.").isVisible());
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  check(`[${engine}] 'Limpiar filtros' restaura todo`, (await rowCount(page)) === PREVIEW_ROWS && (await blockSelect.inputValue()) === "all");

  // Solo lectura: nada llega a la API.
  const first = page.locator('[data-testid="inventory-row"]').first();
  const stockBefore = await first.locator("td").nth(4).textContent();
  // aria-disabled (solo lectura): Playwright no hace clic sin `force`, un
  // usuario sí puede pulsarlos; se fuerza para probar que no llaman a la API.
  await page.getByRole("button", { name: /^Sumar 1 a Playera MatrixLab Wear WR001 · Negra \/ M$/ }).click({ force: true });
  await page.getByRole("button", { name: /^Restar 1 a Playera MatrixLab Wear WR001 · Negra \/ M$/ }).click({ force: true });
  await page.getByLabel("Estado de Playera MatrixLab Wear WR001 · Negra / M").evaluate((el) => {
    const select = el as HTMLSelectElement;
    select.value = "agotado";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(400);
  check(`[${engine}] +/−/estado no envían ninguna petición`, watch.mutations.length === 0, watch.mutations.join(", "));
  check(`[${engine}] stock y estado sin cambios`, (await first.locator("td").nth(4).textContent()) === stockBefore && (await page.getByLabel("Estado de Playera MatrixLab Wear WR001 · Negra / M").inputValue()) === "disponible");
  check(`[${engine}] aviso de solo lectura`, await page.getByText("Vista de muestra: solo lectura", { exact: false }).first().isVisible());
  check(`[${engine}] sin violaciones de CSP (1440)`, (await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).length === 0);
  await ctx.close();

  // iPhone y anchos móviles.
  const iphone = { ...devices["iPhone 14"], defaultBrowserType: undefined };
  for (const width of [320, 375, 390, 430]) {
    const { ctx: mctx, page: m } = await openPreview(browser, base, { ...iphone, viewport: { width, height: 844 } }, watch, `${width}`);
    check(`[${engine}] ${width}: sin overflow ni recortes`, (await layoutIssues(m)).length === 0, (await layoutIssues(m)).slice(0, 4).join(" | "));
    const card = await m.locator('[data-testid="inventory-row"]').first().evaluate((el) => ({
      display: getComputedStyle(el).display,
      labels: [...el.querySelectorAll("td span")].filter((s) => getComputedStyle(s).display !== "none").map((s) => s.textContent?.trim()),
      thumb: Math.round(el.querySelector('[data-testid="inventory-thumb"]')!.getBoundingClientRect().width),
    }));
    check(
      `[${engine}] ${width}: tarjeta apilada con Bloque/Variante/SKU/Stock/Estado`,
      card.display === "flex" && ["Bloque", "Variante", "SKU", "Stock", "Estado"].every((l) => card.labels.includes(l)),
      JSON.stringify(card.labels.slice(0, 8)),
    );
    check(`[${engine}] ${width}: miniatura 64px`, card.thumb === 64, String(card.thumb));
    check(`[${engine}] ${width}: encabezado de tabla oculto visualmente`, await m.locator("thead").evaluate((el) => el.getBoundingClientRect().height <= 1));
    const targets = await m.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-testid="inventory-row"] button, [data-testid="inventory-row"] select, #inventory-search, #inventory-block')]
        .map((el) => { const r = el.getBoundingClientRect(); return { h: r.height, w: r.width, tag: el.tagName }; })
        .filter((t) => t.h < 44 || (t.tag === "BUTTON" && t.w < 44)),
    );
    check(`[${engine}] ${width}: objetivos táctiles ≥44px`, targets.length === 0, JSON.stringify(targets.slice(0, 3)));
    const fonts = await m.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("input, select")].map((el) => parseFloat(getComputedStyle(el).fontSize)),
    );
    check(`[${engine}] ${width}: campos ≥16px (sin zoom en iOS)`, fonts.every((f) => f >= 16), fonts.join(","));
    if (SHOTS && (width === 390 || width === 320)) {
      await loadAllImages(m);
      await m.screenshot({ path: join(SHOTS, `inventario-preview-iphone-${width}-${engine}.png`), fullPage: true });
      if (width === 390) {
        await m.getByLabel("Bloque", { exact: true }).selectOption("tumbler");
        await loadAllImages(m);
        await m.screenshot({ path: join(SHOTS, `inventario-preview-iphone-390-tumbler-${engine}.png`), fullPage: true });
      }
    }
    check(`[${engine}] ${width}: sin violaciones de CSP`, (await m.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).length === 0);
    await mctx.close();
  }

  // Tableta táctil: puntero grueso ≥44px aunque la tabla sea densa.
  const { ctx: tctx, page: t } = await openPreview(browser, base, { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true }, watch, "820");
  const coarse = await t.evaluate(() => matchMedia("(pointer: coarse)").matches);
  if (coarse) {
    const small = await t.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-testid="inventory-row"] button, [data-testid="inventory-row"] select')]
        .filter((el) => el.getBoundingClientRect().height < 44).length,
    );
    check(`[${engine}] 820 táctil: controles ≥44px`, small === 0, String(small));
  } else {
    console.log(`(${engine}: el motor no emula pointer: coarse; se omite 820 táctil)`);
  }
  await tctx.close();

  check(`[${engine}] ninguna mutación en toda la sesión`, watch.mutations.length === 0, watch.mutations.join(", "));
  check(`[${engine}] sin errores de runtime`, watch.errors.length === 0, watch.errors.slice(0, 3).join(" | "));
}

async function main() {
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
  const preview = await startServer("preview");
  const production = await startServer("production");
  try {
    console.log("\n--- Rutas y protección ---");
    const prodPreview = await fetch(`${production.base}/preview/inventario`, { redirect: "manual" });
    check("VERCEL_ENV=production: /preview/inventario → 404", prodPreview.status === 404, String(prodPreview.status));
    const prodBody = await prodPreview.text();
    check("VERCEL_ENV=production: la 404 no filtra datos de muestra", !prodBody.includes("MUESTRA-") && !prodBody.includes("Datos de muestra"));
    for (const [name, server] of [["production", production], ["preview", preview]] as const) {
      const admin = await fetch(`${server.base}/admin/inventario`, { redirect: "manual" });
      check(
        `VERCEL_ENV=${name}: /admin/inventario sin sesión → login`,
        [302, 303, 307, 308].includes(admin.status) && (admin.headers.get("location") ?? "").includes("/admin/login"),
        `${admin.status}`,
      );
      const api = await fetch(`${server.base}/api/admin/inventory`, { method: "PATCH", body: "{}", headers: { "Content-Type": "application/json" } });
      check(`VERCEL_ENV=${name}: PATCH inventario sin sesión rechazado (sin 2xx)`, api.status >= 400, String(api.status));
    }
    const ok = await fetch(`${preview.base}/preview/inventario`);
    const csp = ok.headers.get("content-security-policy") ?? "";
    check("VERCEL_ENV=preview: /preview/inventario → 200", ok.status === 200, String(ok.status));
    check("VERCEL_ENV=preview: CSP estricta con nonce", /'nonce-[a-z0-9]+'/.test(csp) && csp.includes("'strict-dynamic'") && !/script-src[^;]*'unsafe-inline'/.test(csp));
    check("VERCEL_ENV=preview: noindex", (await ok.text()).includes("noindex"));

    const browser = await chromium.launch();
    await previewSuite(browser, preview.base, "chromium");
    await browser.close();
    const wk = await webkit.launch().catch(() => null);
    if (wk) {
      await previewSuite(wk, preview.base, "webkit");
      await wk.close();
    } else {
      console.log("(WebKit no instalado: se omite la pasada en WebKit)");
    }
  } finally {
    preview.child.kill();
    production.child.kill();
  }
  console.log(failures === 0 ? "\nTodo OK." : `\n${failures} fallo(s).`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Error");
  process.exit(1);
});
