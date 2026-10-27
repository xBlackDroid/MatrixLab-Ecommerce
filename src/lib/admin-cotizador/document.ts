import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Documento HTML completo del cotizador admin.
 *
 * El cotizador original (≈3 000 líneas de HTML + JS vanilla) se sirve como
 * documento propio en lugar de convertirlo a React: así sus fórmulas, sus
 * PDFs y su `window.print()` funcionan exactamente igual (incluido iOS, que
 * imprime mal desde iframes).
 *
 * Las fuentes viven en src/lib/admin-cotizador/legacy/ — NUNCA en public/:
 * contienen costos internos y márgenes. Sólo salen por la ruta autenticada
 * /admin/cotizador. `next.config.ts` las incluye en el trazado de archivos
 * del deployment (outputFileTracingIncludes).
 *
 * CSP: la ruta cae en la política ESTRICTA del middleware (nonce +
 * strict-dynamic, sin 'unsafe-inline'). Los dos <script> llevan el nonce de
 * la petición y el markup no tiene handlers en línea, así que no hace falta
 * ninguna excepción de CSP.
 */

const LEGACY_DIR = join(process.cwd(), "src", "lib", "admin-cotizador", "legacy");

type LegacySources = {
  styles: string;
  adapterCss: string;
  markup: string;
  calculator: string;
  adapter: string;
};

let cached: LegacySources | null = null;

export function loadLegacySources(): LegacySources {
  if (cached) return cached;
  const read = (file: string) => readFileSync(join(LEGACY_DIR, file), "utf8");
  const sources: LegacySources = {
    styles: read("styles.css"),
    adapterCss: read("adapter.css"),
    markup: read("markup.html"),
    calculator: read("calculator.js"),
    adapter: read("adapter.js"),
  };
  for (const [name, value] of Object.entries(sources)) {
    // Un `</script` o `</style` literal cerraría el bloque antes de tiempo.
    if (/<\/(script|style)/i.test(value) && name !== "markup") {
      throw new Error(`COTIZADOR_SOURCE_UNSAFE:${name}`);
    }
  }
  // En desarrollo se relee en cada petición para ver cambios al instante.
  if (process.env.NODE_ENV === "production") cached = sources;
  return sources;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const SHELL_TOP = `
<div class="mlz-topbar" role="banner">
  <a class="mlz-back" href="/admin" aria-label="Volver al panel admin">‹ Panel</a>
  <div class="mlz-title"><strong>Cotizador</strong><span>Interno v4.4 · costos privados</span></div>
  <p class="mlz-status" id="mlz-status" role="status" aria-live="polite" data-state="loading">Cargando guardado de la nube…</p>
  <div class="mlz-actions" id="mlz-actions">
    <button type="button" class="mlz-btn" id="mlz-reload" disabled>Recargar guardado</button>
    <button type="button" class="mlz-btn mlz-btn--primary" id="mlz-save" disabled>Guardar en la nube</button>
  </div>
</div>
<div class="mlz-notice" id="mlz-notice" role="alert" hidden></div>
<div class="mlz-picker">
  <label for="mlz-module">Módulo</label>
  <select id="mlz-module"></select>
</div>
<noscript><p class="mlz-notice">El cotizador necesita JavaScript activado.</p></noscript>
`;

export function renderCotizadorDocument(options: {
  nonce: string;
  csrf: string;
}): string {
  const src = loadLegacySources();
  const nonce = escapeAttr(options.nonce);
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0b0f19">
<meta name="ml-csrf" content="${escapeAttr(options.csrf)}">
<title>Cotizador | MatrixLab Admin</title>
<style nonce="${nonce}">${src.styles}</style>
<style nonce="${nonce}">${src.adapterCss}</style>
</head>
<body class="mlz">
${SHELL_TOP}
${src.markup}
<script nonce="${nonce}">${src.calculator}</script>
<script nonce="${nonce}">${src.adapter}</script>
</body>
</html>
`;
}
