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

## Folio automático de cotizaciones (COT-xxx)

El número de cotización lo asigna **el servidor** al generar cada PDF; ya no
hay flechas ni campo para escribirlo. La pestaña Cotización muestra la
**última emitida** y el **siguiente folio** (sólo informativo).

- Integrada (o de una sola línea): 1 folio. Individual: un folio por hoja,
  contiguos (igual que el original).
- El folio se consume al **generar** (el navegador no puede saber si el PDF se
  guardó o se canceló) y **nunca se recicla**. Generar otra vez = folio nuevo.
- **Reabrir último PDF** vuelve a abrir el mismo PDF con su mismo folio, sin
  gastar otro (útil si Safari no abrió el diálogo o se cerró).
- Sin conexión, sesión vencida, nube sin configurar o error: **no se genera
  PDF ni número**; la cotización queda intacta y se avisa. Al reintentar con
  el mismo contenido se reutiliza la misma solicitud, así una respuesta
  perdida no duplica ni salta folios, aunque se recargue la pestaña. Si el
  contenido cambió, se pide uno nuevo (el anterior, si llegó a reservarse,
  queda como hueco: nunca se comparte un folio entre contenidos distintos).
- Ese estado (solicitud pendiente y último folio emitido) es **por pestaña**:
  vive en memoria y en `sessionStorage` (`mlCotizadorFolios:tab:v2`), nunca en
  `localStorage`. Dos pestañas con el mismo contenido son dos generaciones y
  reciben folios distintos; cada recibo cita el folio de su pestaña. Una
  pestaña duplicada hereda la copia, pero un Web Lock por UUID impide que dos
  pestañas vivas usen el mismo, y los UUID ya resueltos quedan marcados
  (`localStorage` `mlCotizadorFolioDone:v2`, sólo UUIDs) para que la copia
  nunca reimprima un folio ya emitido: pide uno nuevo. Si el navegador
  bloquea el almacenamiento, el pendiente sigue en memoria (sin sobrevivir a
  recargar). La clave vieja compartida `mlCotizadorFolios:v1` se ignora.
- Mientras se asigna el folio, y hasta que se lanza la impresión (250 ms
  tras construir el PDF), la edición, el recibo, Reabrir, Guardar y Recargar
  quedan bloqueados: un segundo toque no puede reservar otro folio ni
  reemplazar el PDF antes de imprimirse. Un doble toque envía una sola
  solicitud.
- "Cargar de cotización actual" en Recibos sólo enlaza el folio si ese mismo
  contenido ya se emitió; si no, deja la referencia vacía.
- Restaurar la nube, el caché local o borrar el historial **no** cambia el
  contador: sólo el servidor decide, y nunca retrocede.
- El folio sale impreso en el PDF y en el título del documento (nombre
  sugerido del archivo). La numeración de recibos (REC) no cambia.

API: `GET /api/admin/cotizador/folios` (estado, no reserva) y `POST` (sesión +
CSRF + 30/min por IP, Zod estricto, `no-store`). El servidor calcula cuántos
folios hacen falta y una huella SHA-256 del contenido; sólo guarda números y
la huella (nada de clientes, montos ni costos).

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

### Folios: `20261028192536_admin_quote_folios.sql`

Creada con `supabase migration new admin_quote_folios`. Aditiva e idempotente:

- `admin_quote_folio_counter`: fila única `id = 'cot'`, `last_issued` con
  semilla **38** (`ON CONFLICT DO NOTHING`: si ya existe no se toca). CHECK
  `>= 38` y trigger que rechaza cualquier decremento.
- `admin_quote_folio_reservations`: UUID de solicitud, primer folio, cantidad
  (1..200) y huella. EXCLUDE: dos reservas nunca comparten folio.
- `admin_quote_reserve_folios(uuid, int, text)`: `SECURITY INVOKER`,
  `search_path` vacío; `SELECT … FOR UPDATE` del singleton y, ya con el
  bloqueo, idempotencia (mismo UUID + huella + cantidad → mismo rango; mismo
  UUID con otro contenido → SQLSTATE `MLQ09` → HTTP 409).
- RLS habilitada y forzada sin policies; `revoke all` a public, anon y
  authenticated en tablas y funciones; `service_role` sólo recibe
  `select, update` (contador), `select, insert` (reservas) y `execute`.

Aplicarla **antes** de desplegar el código (sin ella el POST responde 500 y
no se genera PDF). Validación sin consumir folios (sólo lectura):

```sql
select last_issued, last_issued + 1 as next
  from public.admin_quote_folio_counter where id = 'cot';          -- 38 | 39
select count(*) from public.admin_quote_folio_reservations;         -- 0
select relname, relrowsecurity, relforcerowsecurity from pg_class
 where relname in ('admin_quote_folio_counter', 'admin_quote_folio_reservations'); -- t, t
select count(*) from pg_policies where tablename like 'admin_quote_folio%';         -- 0
select has_function_privilege('anon', 'public.admin_quote_reserve_folios(uuid,integer,text)', 'execute') as anon,
       has_function_privilege('authenticated', 'public.admin_quote_reserve_folios(uuid,integer,text)', 'execute') as auth,
       has_function_privilege('service_role', 'public.admin_quote_reserve_folios(uuid,integer,text)', 'execute') as svc; -- f, f, t
select proname, prosecdef, proconfig from pg_proc
 where proname in ('admin_quote_reserve_folios', 'admin_quote_folio_counter_guard'); -- f, {search_path=""}
select grantee, table_name, privilege_type from information_schema.role_table_grants
 where table_name like 'admin_quote_folio%' order by 1, 2, 3;       -- sólo service_role (+ dueño)
```

Prueba funcional opcional, también sin consumir (el contador es una tabla, no
una SEQUENCE, así que el ROLLBACK lo revierte; ejecutar las cuatro sentencias
en la MISMA sesión):

```sql
begin;
set local role service_role;
select public.admin_quote_reserve_folios(gen_random_uuid(), 1, repeat('a', 64)); -- {"first": 39, ...}
rollback;
-- Después: select last_issued … → sigue 38 y 0 reservas.
```

## QA

```bash
npm ci
npx playwright install chromium webkit
npx tsx scripts/qa/admin-cotizador-workspace.test.ts   # validación, carreras 409, invariantes
npx tsx scripts/qa/admin-cotizador-folios.test.ts      # folios: Zod, huella y SQL real en PostgreSQL embebido
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
