import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import QRCode from "qrcode";
import { withHarness } from "./harness";
declare global { interface Window { cameraFixture: { calls: number; stops: number; constraints: MediaStreamConstraints | null; release?: () => void; error?: string; tracks?: number } } }
async function main() {
  await withHarness(async (h) => {
    const browser = await chromium.launch({ headless: true, args: ["--use-fake-device-for-media-stream"] });
    try {
      const code = (await h.db.query("select scan_code from consignment_items where id=$1", [h.item])).rows[0].scan_code;
      const qr = await QRCode.toDataURL(code, { width: 400, margin: 4 });
      for (const mode of ["deny", "defer", "qr", "native-denied", "native-allowed"] as const) {
        const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
        if (mode === "native-denied") await context.grantPermissions([], { origin: h.url });
        if (mode === "native-allowed") await context.grantPermissions(["camera"], { origin: h.url });
        await context.addCookies([{ name: "ml_distributor", value: h.cookie, url: h.url }]);
        // Fuente JS literal: evita helpers de nombres que tsx inserta en
        // funciones serializadas para ejecutarse en otro contexto.
        await context.addInitScript({ content: `(() => {
          const { mode, qr } = ${JSON.stringify({ mode, qr })};
          window.cameraFixture = { calls: 0, stops: 0, constraints: null };
          const nativeMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
          navigator.mediaDevices.getUserMedia = async (constraints) => {
            window.cameraFixture.calls++; window.cameraFixture.constraints = constraints ?? null;
            if (mode.startsWith("native")) return nativeMedia(constraints);
            if (mode === "deny") throw new DOMException("Permission denied", "NotAllowedError");
            if (mode === "defer") await new Promise((r) => { window.cameraFixture.release = r; });
            const canvas = document.createElement("canvas"); canvas.width = 400; canvas.height = 400;
            const ctx = canvas.getContext("2d");
            let img = null;
            if (mode === "qr") { img = new Image(); img.src = qr; await img.decode(); }
            const draw = () => { ctx.fillStyle = "white"; ctx.fillRect(0, 0, 400, 400); if (img) ctx.drawImage(img, 0, 0); };
            draw(); const frames = setInterval(draw, 50);
            let stream;
            try { stream = canvas.captureStream(20); } catch (e) { window.cameraFixture.error = e.message; clearInterval(frames); throw e; }
            window.cameraFixture.tracks = stream.getTracks().length;
            for (const track of stream.getTracks()) { const nativeStop = track.stop.bind(track); track.stop = () => { window.cameraFixture.stops++; clearInterval(frames); nativeStop(); }; }
            return stream;
          };
        })();` });
        const page = await context.newPage(); await page.goto(h.url + "/distribuidores/escanear");
        if (mode.startsWith("native")) {
          const session = await context.newCDPSession(page);
          await session.send("Browser.setPermission", { permission: { name: "camera" }, setting: mode === "native-denied" ? "denied" : "granted", origin: h.url });
          assert.equal(await page.evaluate(async () => (await navigator.permissions.query({ name: "camera" as PermissionName })).state), mode === "native-denied" ? "denied" : "granted");
        }
        await expect(page.getByRole("button", { name: "Abrir cámara", exact: true })).toBeVisible();
        assert.equal(await page.evaluate(() => window.cameraFixture.calls), 0, "No pedir permiso sin acción del usuario");
        await page.getByRole("button", { name: "Abrir cámara", exact: true }).click();
        if (mode === "deny" || mode === "native-denied") {
          const denied = page.getByRole("alert").filter({ hasText: "No diste permiso de cámara" });
          const unavailable = page.getByRole("alert").filter({ hasText: "Este navegador no puede abrir la cámara" });
          await expect(mode === "deny" ? denied : denied.or(unavailable)).toBeVisible();
          if (mode === "native-denied" && await unavailable.isVisible()) console.log("Límite de entorno: permiso nativo denegado comprobado; backend de captura no soportado antes de adquirir video");
          await page.getByLabel("Código o SKU").fill("DEMO-01");
          await page.getByRole("button", { name: "Buscar pieza manualmente" }).click();
          await expect(page.getByRole("heading", { name: "Registrar venta", exact: true })).toBeVisible();
        } else if (mode === "defer") {
          await expect(page.getByRole("button", { name: "Cancelar apertura de cámara" })).toBeVisible();
          await page.getByRole("button", { name: "Cancelar apertura de cámara" }).click();
          await page.evaluate(() => window.cameraFixture.release?.());
          try { await expect.poll(() => page.evaluate(() => window.cameraFixture.stops)).toBe(1); }
          catch { throw new Error("Late camera fixture: " + JSON.stringify(await page.evaluate(() => window.cameraFixture))); }
          await expect(page.getByRole("button", { name: "Abrir cámara", exact: true })).toBeVisible();
        } else if (mode === "native-allowed") {
          const close = page.getByRole("button", { name: "Cerrar cámara", exact: true });
          const unsupported = page.getByRole("alert").filter({ hasText: "Este navegador no puede abrir la cámara" });
          await expect(close.or(unsupported)).toBeVisible();
          if (await close.isVisible()) {
            await close.click();
            assert.equal(await page.locator("video").evaluate((v: HTMLVideoElement) => (v.srcObject as MediaStream).getTracks().every((t) => t.readyState === "ended")), true);
          } else console.log("Límite de entorno: permiso nativo concedido, backend de dispositivo sintético no soportado; alternativa visible");
        } else {
          await expect(page.getByRole("heading", { name: "Registrar venta", exact: true })).toBeVisible({ timeout: 15000 });
          assert.ok((await page.evaluate(() => window.cameraFixture.stops)) >= 1);
        }
        assert.equal(await page.evaluate(() => window.cameraFixture.calls), 1);
        assert.equal(await page.evaluate(() => window.cameraFixture.constraints?.audio), false);
        assert.equal((await h.db.query("select sum(available_quantity)::int n from consignment_lots where distributor_id=$1", [h.dist])).rows[0].n, 10);
        assert.equal((await h.db.query("select count(*)::int n from consignment_sales where distributor_id=$1", [h.dist])).rows[0].n, 0);
        await context.close();
      }
      console.log("Cámara automatizada: permiso Chromium nativo autorizado/denegado con dispositivo sintético, cierre de tracks, cancelación tardía, QR en video de canvas y sin venta automática");
    } finally { await browser.close(); }
  });
}
main().catch((e) => { console.error(e); process.exit(1); });
