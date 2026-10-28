import assert from "node:assert/strict";
import { chromium, expect, type Locator, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { withHarness } from "./harness";
async function singleLineLabel(label: Locator) {
  const rows = await label.evaluate(element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const positions: number[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      for (const rect of range.getClientRects()) if (rect.width && rect.height) positions.push(Math.round(rect.y));
    }
    return [...new Set(positions)];
  });
  assert.equal(rows.length, 1, "Etiqueta de navegación completa en una línea");
}
async function mobileLayout(page: Page, scope: Locator = page.locator("body")) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "Sin desbordamiento horizontal");
  const controls = await scope.locator('button:visible, a:visible, summary:visible, input:not([type="checkbox"]):not([type="hidden"]):visible, select:visible').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect(), css = getComputedStyle(node);
    return { label: node.textContent?.trim() || node.getAttribute("name"), width: rect.width, height: rect.height, font: parseFloat(css.fontSize), form: node.matches("input,select") };
  }));
  for (const control of controls) {
    assert.ok(control.width >= 44 && control.height >= 44, `Control táctil: ${control.label}`);
    if (control.form) assert.ok(control.font >= 16, `Campo sin zoom iOS: ${control.label}`);
  }
}
async function main() {
  await withHarness(async (h) => {
    await mkdir(".consignment-tests/screenshots", { recursive: true });
    const browser = await chromium.launch({ headless: true });
    try {
      const admin = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const origami = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
      const other = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await admin.addCookies([{ name: "ml_admin", value: h.adminCookie, url: h.url }]);
      await other.addCookies([{ name: "ml_distributor", value: h.otherCookie, url: h.url }]);
      const b = await other.newPage(); await b.goto(h.url + "/distribuidores?id=" + h.dist);
      await expect(b.getByRole("heading", { name: "Distribuidor B TEST", exact: true })).toBeVisible();
      await expect(b.getByRole("heading", { name: "Pieza privada B", exact: true })).toBeVisible();
      await expect(b.getByRole("heading", { name: "Pieza Origami TEST", exact: true })).toHaveCount(0);
      const a = await admin.newPage(), o = await origami.newPage(); const errors: string[] = [];
      for (const p of [a, o]) p.on("pageerror", (e) => errors.push(e.message));
      await a.goto(h.url + "/admin/distribuidores");
      const origamiProfile = a.getByRole("article", { name: "Distribuidor Origami TEST", exact: true });
      await expect(origamiProfile).toBeVisible();
      await expect(origamiProfile.getByRole("link", { name: "Administrar inventario", exact: true })).toHaveAttribute("href", `/admin/distribuidores/${h.dist}?seccion=inventario`);
      await expect(origamiProfile.getByRole("link", { name: "Registrar entrega", exact: true })).toHaveAttribute("href", `/admin/distribuidores/${h.dist}?seccion=entregas`);
      await expect(origamiProfile.getByRole("link", { name: "Usuarios y acceso", exact: true })).toHaveAttribute("href", `/admin/distribuidores/${h.dist}?seccion=accesos`);
      for (const width of [320, 390, 430]) {
        await a.setViewportSize({ width, height: 844 }); await mobileLayout(a, a.locator("main"));
      }
      await a.setViewportSize({ width: 390, height: 844 });
      await a.screenshot({ path: ".consignment-tests/screenshots/admin-distributor-directory.png", fullPage: true });
      await origamiProfile.getByRole("link", { name: "Registrar entrega", exact: true }).click();
      await expect(a.getByRole("heading", { name: "Confirmar entrega de piezas", exact: true })).toBeVisible();
      await expect(a.getByRole("heading", { name: "Origami TEST", exact: true })).toBeVisible();
      await mobileLayout(a, a.locator("main"));
      await a.reload();
      await expect(a.getByRole("button", { name: "Entregas", exact: true })).toHaveAttribute("aria-current", "page");
      await a.getByRole("link", { name: "Ver distribuidores", exact: true }).click();
      await origamiProfile.getByRole("link", { name: "Usuarios y acceso", exact: true }).click();
      await expect(a.getByRole("heading", { name: "Usuarios de Origami TEST", exact: true })).toBeVisible();
      await expect(a.getByText("origami", { exact: true })).toBeVisible();
      await mobileLayout(a, a.locator("main"));
      await a.getByRole("link", { name: "Ver distribuidores", exact: true }).click();
      await a.getByLabel("Nombre", { exact: true }).fill("Distribuidor C TEST");
      await a.getByLabel("Identificador", { exact: true }).fill("distribuidor-c-test");
      await a.getByRole("button", { name: "Crear y configurar inventario", exact: true }).click();
      await expect(a).toHaveURL(/\/admin\/distribuidores\/[a-f0-9-]+\?seccion=piezas$/);
      await expect(a.getByRole("heading", { name: "Distribuidor C TEST", exact: true })).toBeVisible();
      await expect(a.getByRole("heading", { name: "Agregar pieza privada", exact: true })).toBeVisible();
      await expect(a.locator("dl > div").filter({ has: a.getByText("Piezas disponibles", { exact: true }) }).locator("dd")).toHaveText("0");
      await a.getByRole("button", { name: "3. Vincular usuarios", exact: true }).click();
      await expect(a.getByRole("heading", { name: "Usuarios de Distribuidor C TEST", exact: true })).toBeVisible();
      await expect(a.getByText("Todavía no hay usuarios. Crea el acceso de este distribuidor aquí.", { exact: true })).toBeVisible();
      await a.getByRole("link", { name: "Ver distribuidores", exact: true }).click();
      await origamiProfile.getByRole("link", { name: "Administrar inventario", exact: true }).click();
      await expect(a.getByRole("button", { name: "Inventario", exact: true })).toHaveAttribute("aria-current", "page");
      await a.screenshot({ path: ".consignment-tests/screenshots/admin-distributor-setup.png", fullPage: true });
      await a.setViewportSize({ width: 1440, height: 1000 });
      await o.goto(h.url + "/distribuidores"); await expect(o).toHaveURL(h.url + "/distribuidores/login");
      const logo = o.getByRole("img", { name: "MatrixLab Stickers", exact: true });
      await expect(logo).toBeVisible();
      await expect.poll(() => logo.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      for (const width of [320, 360, 390, 430]) {
        await o.setViewportSize({ width, height: 844 }); await mobileLayout(o);
      }
      await o.setViewportSize({ width: 390, height: 844 });
      await o.screenshot({ path: ".consignment-tests/screenshots/origami-login.png", fullPage: true });
      await o.getByLabel("Usuario", { exact: true }).fill("origami");
      await o.getByLabel("Contraseña", { exact: true }).fill("Fixture-password-1234");
      await o.getByRole("button", { name: "Mostrar contraseña", exact: true }).click();
      await expect(o.getByLabel("Contraseña", { exact: true })).toHaveAttribute("type", "text");
      await expect(o.getByRole("button", { name: "Ocultar contraseña", exact: true })).toHaveAttribute("aria-pressed", "true");
      await o.getByRole("button", { name: "Ocultar contraseña", exact: true }).click();
      await expect(o.getByLabel("Contraseña", { exact: true })).toHaveAttribute("type", "password");
      await o.getByRole("button", { name: "Entrar", exact: true }).click();
      await expect(o).toHaveURL(h.url + "/distribuidores");
      await expect(a.getByRole("heading", { name: "Origami TEST", exact: true })).toBeVisible();
      await expect(o.getByRole("heading", { name: "Pieza Origami TEST", exact: true })).toBeVisible();
      const stockValue = o.locator("dl > div").filter({ has: o.getByText("Valor del stock a costo", { exact: true }) }).locator("dd");
      await expect(stockValue).toHaveText("$1,000.00");
      await expect(o.getByText("Tu costo", { exact: true }).locator("..").getByText("$100.00", { exact: true })).toBeVisible();
      await expect(o.getByText("Precio sugerido", { exact: true }).locator("..").getByText("$180.00", { exact: true })).toBeVisible();
      await expect(o.getByText("Crédito disponible", { exact: true })).toHaveCount(0);
      await expect(o.getByText("Pagos recibidos", { exact: true })).toHaveCount(0);
      for (const title of ["Deuda por ventas", "Pendiente de pago"]) {
        await expect(o.getByText(title, { exact: true })).toHaveCount(0);
        await expect(a.getByText(title, { exact: true })).toHaveCount(0);
      }
      const balance = o.locator("dl > div").filter({ has: o.getByText("Por pagar", { exact: true }) }).locator("dd");
      await expect(balance).toHaveCount(1); await expect(balance).toHaveText("$0.00");
      for (const width of [320, 360, 390, 430, 768]) {
        await o.setViewportSize({ width, height: 844 }); await mobileLayout(o);
        for (const section of ["Inventario", "Venta", "Estado de cuenta"]) {
          await expect(o.getByRole("button", { name: section, exact: true })).toBeInViewport();
          await singleLineLabel(o.getByRole("button", { name: section, exact: true }));
        }
        await singleLineLabel(o.getByRole("link", { name: "Escanear", exact: true }));
        await singleLineLabel(o.getByRole("button", { name: "Salir", exact: true }));
      }
      await o.setViewportSize({ width: 390, height: 844 });
      await o.screenshot({ path: ".consignment-tests/screenshots/origami-inventory-before-sale.png", fullPage: true });
      assert.equal(await o.getByRole("button", { name: "Pagos", exact: true }).count(), 0);
      for (const title of ["Piezas", "Entregas", "Correcciones", "Accesos"]) assert.equal(await o.getByRole("button", { name: title, exact: true }).count(), 0);
      await o.getByRole("button", { name: "Registrar venta", exact: true }).click();
      await expect(o.getByRole("button", { name: "Venta", exact: true })).toHaveAttribute("aria-current", "page");
      await o.getByLabel("Cantidad", { exact: true }).fill("3");
      await o.getByLabel("Precio real unitario MXN").fill("170.00");
      await mobileLayout(o);
      await o.getByRole("button", { name: "Revisar venta", exact: true }).click();
      await expect(o.getByText("A pagar a MatrixLab", { exact: true }).locator("..").getByText("$300.00", { exact: true })).toBeVisible();
      await o.evaluate(() => window.scrollTo(0, 0));
      await o.screenshot({ path: ".consignment-tests/screenshots/origami-sale-review.png", fullPage: true });
      await o.getByRole("button", { name: "Confirmar venta", exact: true }).click();
      await expect(o.getByRole("status")).toContainText("VTA-");
      await expect(stockValue).toHaveText("$700.00");
      await expect(balance).toHaveText("$300.00");
      await expect(a.locator("dd").filter({ hasText: "$300.00" }).first()).toBeVisible({ timeout: 20000 });
      await a.getByRole("button", { name: "Pagos", exact: true }).click();
      for (const expected of ["$150.00", "$0.00"]) {
        await a.getByLabel("Monto recibido MXN", { exact: true }).fill("150.00");
        await a.getByLabel("Fecha del pago").fill("2026-10-10");
        await a.getByRole("button", { name: "Confirmar pago recibido", exact: true }).click();
        await expect(a.getByRole("dialog", { name: "Revisar operación" })).toBeVisible();
        await a.getByRole("button", { name: "Confirmar operación", exact: true }).click();
        await expect(a.getByRole("status")).toContainText("PAG-");
        await expect(a.locator("dl > div").filter({ has: a.getByText("Por pagar", { exact: true }) }).locator("dd")).toHaveText(expected);
        await o.getByRole("button", { name: "Actualizar", exact: true }).click();
        await expect(balance).toHaveText(expected);
      }
      await o.getByRole("button", { name: "Estado de cuenta", exact: true }).click();
      await o.getByRole("button", { name: "Actualizar", exact: true }).click();
      await expect(stockValue).toHaveText("$700.00");
      await expect(o.getByRole("heading", { name: "Pagos a MatrixLab", exact: true })).toBeVisible();
      await expect(o.locator("dl > div").filter({ has: o.getByText("Pagos a MatrixLab", { exact: true }) }).locator("dd")).toHaveText("$300.00");
      await expect(o.locator("summary")).toContainText("Pagada");
      await expect(o.getByText("Deuda neta:", { exact: false })).toHaveCount(0);
      await a.evaluate(() => window.scrollTo(0, 0));
      await o.evaluate(() => window.scrollTo(0, 0));
      await a.screenshot({ path: ".consignment-tests/screenshots/admin.png", fullPage: true });
      await o.screenshot({ path: ".consignment-tests/screenshots/origami-mobile.png", fullPage: true });
      assert.equal(await o.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await o.goto(h.url + "/distribuidores/escanear");
      for (const width of [320, 390, 430]) {
        await o.setViewportSize({ width, height: 844 }); await mobileLayout(o);
      }
      await o.setViewportSize({ width: 390, height: 844 });
      await o.screenshot({ path: ".consignment-tests/screenshots/origami-scanner.png", fullPage: true });
      await o.getByLabel("Código o SKU").fill("DEMO-01"); await o.getByRole("button", { name: "Buscar pieza manualmente" }).click();
      await expect(o.getByRole("heading", { name: "Registrar venta", exact: true })).toBeVisible();
      assert.equal((await h.db.query("select count(*)::int n from consignment_sales where distributor_id=$1", [h.dist])).rows[0].n, 1);
      // Perder la respuesta después del COMMIT: reintentar no duplica la venta.
      await o.getByRole("button", { name: "Revisar venta", exact: true }).click();
      let lost = false;
      await o.route("**/api/distributor", async (route) => {
        if (!lost && route.request().method() === "POST" && route.request().postDataJSON().action === "sale") {
          lost = true; await route.fetch(); await route.abort("connectionfailed");
        } else await route.continue();
      });
      await o.getByRole("button", { name: "Confirmar venta", exact: true }).click();
      await expect(o.getByRole("button", { name: "Reintentar confirmación anterior" })).toBeVisible();
      await o.getByRole("button", { name: "Reintentar confirmación anterior" }).click();
      await expect(o.getByRole("status")).toContainText("VTA-");
      assert.equal((await h.db.query("select count(*)::int n from consignment_sales where distributor_id=$1", [h.dist])).rows[0].n, 2);
      await a.getByRole("button", { name: "Piezas", exact: true }).click();
      await a.getByLabel("Nombre", { exact: true }).fill("Nueva pieza privada TEST");
      await a.getByLabel("SKU / código interno").fill("PRIVATE-02");
      await a.getByLabel("Precio sugerido MXN", { exact: true }).fill("99.00");
      await a.getByRole("button", { name: "Guardar ficha", exact: true }).click();
      await a.getByRole("button", { name: "Confirmar operación", exact: true }).click();
      await expect(a.getByRole("status")).toContainText("Guardado");
      await o.getByRole("button", { name: "Inventario", exact: true }).click();
      await o.getByRole("button", { name: "Actualizar", exact: true }).click();
      await expect(o.getByRole("heading", { name: "Nueva pieza privada TEST", exact: true })).toHaveCount(0);
      await a.getByRole("button", { name: "Entregas", exact: true }).click();
      const newItem = (await h.db.query("select id from consignment_items where sku='PRIVATE-02'")).rows[0].id;
      await a.getByLabel("Pieza de la entrega 1").selectOption(newItem);
      await a.getByLabel("Cantidad entregada 1").fill("2");
      await a.getByLabel("Costo unitario para Origami TEST MXN 1").fill("50.00");
      await a.getByLabel("Precio sugerido MXN 1").fill("99.00");
      await a.getByLabel("Fecha de entrega", { exact: true }).fill("2026-10-10");
      await a.getByRole("button", { name: "Confirmar entrega", exact: true }).click();
      await a.getByRole("button", { name: "Confirmar operación", exact: true }).click();
      await expect(a.getByRole("status")).toContainText("ENT-");
      await o.getByRole("button", { name: "Actualizar", exact: true }).click();
      await expect(o.getByRole("heading", { name: "Nueva pieza privada TEST", exact: true })).toBeVisible();
      await b.getByRole("button", { name: "Actualizar", exact: true }).click();
      await expect(b.getByRole("heading", { name: "Nueva pieza privada TEST", exact: true })).toHaveCount(0);
      await a.screenshot({ path: ".consignment-tests/screenshots/admin-delivery.png", fullPage: true });
      await o.screenshot({ path: ".consignment-tests/screenshots/origami-inventory.png", fullPage: true });
      await a.getByRole("button", { name: "Accesos", exact: true }).click();
      await a.getByLabel("Usuario", { exact: true }).fill("origami-auxiliar");
      await a.getByLabel("Nueva contraseña", { exact: true }).fill("Fixture-auxiliar-1234");
      await a.getByRole("button", { name: "Revisar acceso", exact: true }).click();
      await expect(a.getByRole("dialog", { name: "Revisar acceso" })).toContainText("origami-auxiliar");
      await a.getByRole("button", { name: "Confirmar acceso", exact: true }).click();
      await expect(a.getByRole("status").filter({ hasText: "Acceso de origami-auxiliar guardado" })).toBeVisible();
      const fresh = await browser.newContext({ viewport: { width: 390, height: 844 } }), f = await fresh.newPage();
      await f.goto(h.url + "/distribuidores/login");
      await f.getByLabel("Usuario", { exact: true }).fill("origami-auxiliar");
      await f.getByLabel("Contraseña", { exact: true }).fill("Fixture-auxiliar-1234");
      await f.getByRole("button", { name: "Entrar", exact: true }).click();
      await expect(f.getByRole("heading", { name: "Origami TEST", exact: true })).toBeVisible();
      await expect(f.getByRole("heading", { name: "Nueva pieza privada TEST", exact: true })).toBeVisible();
      await expect(f.getByRole("heading", { name: "Pieza privada B", exact: true })).toHaveCount(0);
      await expect(f.getByRole("button", { name: "Accesos", exact: true })).toHaveCount(0);
      await a.screenshot({ path: ".consignment-tests/screenshots/admin-access.png", fullPage: true });
      await h.db.query("update consignment_items set name=$1,sku=$2 where id=$3", ["Pieza ".repeat(25).trim(), "SKU".repeat(20), h.item]);
      await o.getByRole("button", { name: "Actualizar", exact: true }).click();
      await o.setViewportSize({ width: 320, height: 844 }); await mobileLayout(o);
      await o.evaluate(() => window.scrollTo(0, 0));
      await o.screenshot({ path: ".consignment-tests/screenshots/origami-320-long-content.png", fullPage: true });
      await fresh.close();
      assert.deepEqual(errors, []); console.log("T19/T22/T25: móvil/escritorio, dos sesiones, venta → abonos → liquidación, captura manual sin descuento");
      console.log("T21/T27/T28: respuesta perdida después de COMMIT y alta gradual privada hasta confirmar entrega");
      console.log("T16/T17: tercer distribuidor aislado en navegador; Origami sin controles administrativos de inventario o pagos");
      console.log("Móvil: 320/360/390/430 y tablet 768, controles >=44px, campos >=16px, navegación visible, contenido largo y reducción de movimiento");
      console.log("Admin: directorio con accesos directos por perfil, entregas/accesos conservados al recargar, alta abre configuración, usuario auxiliar recibe sólo el inventario de su distribuidor");
    } finally { await browser.close(); }
  });
}
main().catch((e) => { console.error(e); process.exit(1); });
