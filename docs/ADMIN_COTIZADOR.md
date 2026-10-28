# Cotizador admin (`/admin/cotizador`)

Cotizador interno v4.4 (bolsas dulceros, tatuajes, T-Shirt Lab, Cap Lab,
prendas, stickers, imanes, accesorios, láser/3D, cotización, recibos e
insumos) integrado al panel admin, con guardado en la nube.

## Uso

- Entrada: enlace **Cotizador** en la barra del panel y tarjeta en el Resumen
  (`/admin`). Requiere sesión admin; sin sesión redirige a `/admin/login`.
- En iPhone (< 640 px) las 12 pestañas se sustituyen por el selector
  **Módulo**; las líneas de cotización/recibo se muestran como tarjetas con
  Concepto, Cantidad, Precio unitario, Importe y botón de borrar.
- **Guardar en la nube** guarda todo el espacio de trabajo. **Recargar
  guardado** trae la última versión guardada (si hay cambios sin guardar, pide
  confirmación). El estado aparece arriba: guardado (con fecha), sin guardar,
  guardando, error o conflicto.
- La carga inicial y las recargas confirmadas bloquean temporalmente la
  edición para evitar sobrescribir cambios mientras llega la nube. Las
  peticiones vencen a los 12 segundos; si falla la conexión, se habilita el
  trabajo local y se conserva el borrador para reintentar.
- PDFs (cotización integrada / individual y recibo): igual que el original,
  vía el diálogo de impresión → "Guardar como PDF".

## Qué se guarda

Una foto única (singleton) con: cotización y recibo en curso (campos y
líneas), historial de cotizaciones generadas (máx. 50), folios (actual y
siguiente), costos de la pestaña Insumos y las selecciones de cada módulo
(chips, sub-pestañas, campos y contadores), más la página activa.

- La nube es la fuente principal. `localStorage` (`mlCotizadorWorkspace:v1`)
  es sólo caché/borrador local: al abrir, si este dispositivo tiene cambios
  sin guardar se recuperan en vez de pisarse.
- Concurrencia optimista por `version`: guardar sobre una versión vieja
  responde **409**; la pantalla conserva los cambios y ofrece "Cargar la
  versión de la nube" o "Reemplazarla con mis cambios" (con confirmación).
  Nunca gana el último en silencio.
- El servidor valida la foto (Zod estricto: tipos, rangos, longitudes, máx.
  200 KB), exige CSRF en `PUT` y aplica límite de 20 guardados/min por IP.

## Arquitectura

| Pieza | Archivo |
| --- | --- |
| Documento HTML autenticado | `src/app/admin/cotizador/route.ts`, `src/lib/admin-cotizador/document.ts` |
| Fuentes privadas (nunca en `public/`) | `src/lib/admin-cotizador/legacy/` |
| Script original **verbatim** (fórmulas) | `legacy/calculator.js` (SHA-256 verificado en QA) |
| Capa de integración (móvil, nube, a11y) | `legacy/adapter.js`, `legacy/adapter.css` |
| API | `src/app/api/admin/cotizador/workspace/route.ts` |
| Validación / concurrencia / repositorio | `src/lib/admin-cotizador/{schema,workspace-core,workspace-store}.ts` |
| Importador desde el HTML original | `scripts/cotizador/import-legacy.mjs` |

El cotizador se sirve como documento propio (no React) para que fórmulas,
PDFs y `window.print()` funcionen igual, incluido iOS. La ruta usa la **CSP
estricta** existente (nonce + `strict-dynamic`, sin `unsafe-inline`): el
importador convierte los `onclick/onchange/oninput` del original en atributos
`data-ml-*` que `adapter.js` despacha, así que no hay excepción de CSP.
`next.config.ts` incluye `legacy/**` en el trazado de la función
(`outputFileTracingIncludes`).

Para actualizar desde una versión nueva del HTML:

```bash
node scripts/cotizador/import-legacy.mjs "<ruta>/MatrixLab_Cotizador_vX.html"
```

Luego actualiza `ORIGINAL_SCRIPT_SHA256` en
`scripts/qa/admin-cotizador-workspace.test.ts` y corre el QA.

## Migración

`supabase/migrations/20261027185726_admin_quote_workspace.sql` (creada con
`supabase migration new admin_quote_workspace`): tabla
`public.admin_quote_workspace` con fila semilla `id = 'default'`,
`version = 0`. RLS habilitada y forzada **sin policies**; `revoke all` a
`public`, `anon` y `authenticated`; sólo `service_role` tiene
`select, insert, update`. El panel no usa Supabase Auth, así que todo el
acceso pasa por el servidor con el cliente service role tras validar la
sesión admin. Es aditiva e idempotente.

Aplicarla antes de desplegar el código (sin ella la API responde 500 al
leer/guardar; sin Supabase configurado responde 503 y la pantalla trabaja con
la copia local).

## QA

```bash
npm ci
npx playwright install chromium webkit
npx tsx scripts/qa/admin-cotizador-workspace.test.ts   # validación, carreras 409, invariantes
npx next build
npx tsx scripts/qa/admin-cotizador.browser.test.ts      # Playwright (Chromium + WebKit)
```

El QA de navegador levanta `next start` con un secreto de sesión aleatorio y
sin Supabase (sesión sintética local), compara fórmulas, tarjetas y PDFs con
el HTML original (`COTIZADOR_ORIGINAL_HTML`, se omite si no existe) y prueba
la nube con un stub de la API.

## Recuperación acumulativa (27/10/2026)

Producción corría un despliegue CLI (`dpl_2aZrvYwCLTPqVr1yY6V5zTZQxrwH`,
origen `914dddd` con cambios sin commitear de `codex/origami-consignaciones`)
cuyo código no estaba en `main`. El PR #7 se fusionó sobre el `main` viejo y su
despliegue perdió funciones aprobadas. La rama
`codex/cotizador-cumulative-recovery` restaura ese snapshot exacto y le suma el
cotizador.

- Recibo: `scripts/qa/fixtures/production-reference-dpl_2aZrvYwCLTPqVr1yY6V5zTZQxrwH.json`
  (943 archivos con su SHA-1 de producción y, para los 261 de texto subidos con
  CRLF, el SHA-1 tras normalizar a LF, que es como Git los guarda).
- `scripts/qa/production-reference.test.ts` verifica que todo archivo del
  snapshot sigue idéntico salvo los 4 de integración enumerados
  (`next.config.ts`, `src/app/admin/page.tsx`, `src/components/admin/AdminNav.tsx`,
  `src/lib/security/rate-limit.ts`) y que no hay archivos versionados fuera del
  snapshot, del cotizador o de metadatos (`.gitignore`, `.env.example`).
- Regla: nunca asumir que `main` es producción. Antes de fusionar, comparar
  contra el despliegue de producción vigente.
