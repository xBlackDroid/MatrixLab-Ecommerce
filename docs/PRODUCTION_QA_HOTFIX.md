# PRODUCTION QA HOTFIX — MatrixLab

Hotfix de los bloqueadores funcionales reportados por QA en producción
(https://www.matrixlabintelligence.com). No rediseña la home, no toca Mercado
Pago, no elimina MatrixLab Tumbler / Etiquetas Escolares / landing, y conserva
todo el hardening de seguridad (CSP, sesiones admin, rate limiting, Zod,
validación producto/variante, uploads seguros, webhook MP, límites de body,
RLS, cookies seguras).

Rama: `claude/matrixlab-production-qa-vj9ptw` (rol de
`hotfix/production-qa-blockers`, creada desde el main actual `3cc7073`).

---

## Resumen por prioridad

| # | Problema reportado | Causa raíz | Estado |
|---|--------------------|-----------|--------|
| P0 | Producción solo tiene `etiquetas-escolares-personalizadas` | Los seeds de productos base nunca se ejecutaron completos en el Supabase productivo | `supabase/seed_designer_base_v2.sql` (transaccional, idempotente, probado en Postgres 16) |
| P1 | “Para guardar o agregar al carrito necesitamos activar este producto en catálogo” | Consecuencia directa de P0: el resolver no encuentra el producto base y el diseñador cae a modo previsualización | Se corrige al ejecutar el seed; contratos Zod verificados con test automatizado; fix adicional en `/admin/disenos` |
| P2 | Stickers-planilla: lienzo vacío al subir imagen y elegir círculo | (a) La matemática del `fillPattern` de Konva desplazaba la imagen fuera del círculo; (b) la pieza se colocaba hasta DESPUÉS de subir al storage (race con red lenta) | Máscara real con `clipFunc` + colocación inmediata con persistencia en segundo plano |
| P3 | “Vista de giro” no funciona bien | Solo se capturaba preview de lados CON diseño (espalda vacía → mensaje “guarda tu diseño”); la espalda se mostraba espejeada (`scaleX(-1)`) | Captura de ambos lados siempre (mockup vacío si no hay diseño), espalda sin espejo, botón "Espalda" solo cuando existe vista posterior |
| P4 | Links de la home a 404 (Impresión 3D) | `/tienda/categoria/[handle]` hace `notFound()` si la categoría no existe en la BD; producción no tiene `impresion-3d` | Seed incluye la categoría/producto de Impresión 3D + fallback “Próximamente” para categorías curadas + script de auditoría de links |
| P5 | Falta guía visible “para dummies” | Secciones solo con iconos/labels sueltos | Encabezados numerados 1–6 en diseñadores de prendas + botones táctiles ≥44px |
| P6 | Verificar imagen personalizada en etiquetas | — (ya implementado) | Verificado: PNG/JPG/JPEG/WEBP, mover, escalar, detrás del texto, contraste automático, persistencia en `design_json.customImage` |
| P7 | Responsive móvil sudadera/gorra | — | Verificado en 390×844 y 430×932: sin scroll horizontal, drawer accesible, CTA visible, upload/giro funcionan |

---

## P0 — Base de datos (ACCIÓN REQUERIDA EN PRODUCCIÓN)

**Archivo:** `supabase/seed_designer_base_v2.sql`

**Cómo ejecutarlo:** copiar y pegar TODO el archivo en el SQL Editor del
proyecto Supabase de producción y correrlo. Es seguro correrlo varias veces.

Garantiza (verificado contra el esquema real de `0001_schema.sql` +
`0004_designer_expansion.sql` + `0005_school_labels.sql`):

- Productos base de TODOS los diseñadores: `playera-personalizada`,
  `sudadera-personalizada`, `gorra-trucker-personalizada`,
  `gorra-clasica-personalizada`, `gorra-personalizada` (alias legado),
  `tote-bag-personalizada`, `planilla-stickers` (compartido por
  stickers-planilla y stickers-repeticion), `planilla-imanes` (legado),
  `grabado-laser-personalizado`, `etiquetas-escolares-personalizadas` y
  `pieza-3d-personalizada` (para el CTA de Impresión 3D).
- Todos con `is_customizable = true`, status vendible (`disponible` /
  `sobre_pedido`), categoría real, al menos una variante activa con precio > 0.
- **No** borra datos, **no** reemplaza ids existentes, **no** pisa
  títulos/descripciones/precios curados. Repara solo: `oculto` → status
  canónico, `is_customizable = false` → `true`, precio 0 → precio canónico,
  `min_quantity > 1` → 1 (el diseñador agrega quantity=1), variantes
  `oculto/agotado` → `sobre_pedido`.
- A prueba de ids canónicos reciclados (usa `gen_random_uuid()` si el id ya
  está ocupado por otra fila) y garantiza una variante de reparación (sku
  `…-R`) si un producto quedara sin variante visible.
- Transaccional: bloque `DO` atómico + `begin/commit`.

La consulta de validación va al final del archivo y devuelve por handle:
`status`, `is_customizable`, `variantes_visibles`, `sku_variantes`, `precio`
y un booleano `ok`. **Todas las filas deben salir con `ok = true`.**

**Evidencia:** probado contra Postgres 16 local con las migraciones reales,
partiendo del estado exacto reportado por QA (solo etiquetas):
- 1ª corrida: crea todo, respeta el precio curado existente (219 ≠ 199).
- 2ª corrida con datos rotos a propósito (producto oculto, precio 0,
  min_quantity 10, variante oculta/agotada, sku ligado a otro producto,
  título curado): repara lo mínimo y no pisa lo curado.
- 3ª corrida: cero filas nuevas (idempotencia exacta).
- Caso id reciclado: inserta con uuid nuevo sin tocar la fila ajena.

## P1 — Guardar y agregar al carrito

Causa raíz: el resolver (`getDesignerBaseProduct`) no encontraba el producto
base porque no existe en producción → los diseñadores caen a modo
previsualización con el mensaje reportado. **Con el seed aplicado, el flujo
completo (resolver → guardar → carrito) funciona sin tocar código del
backend**, que ya validaba correctamente producto/variante/sesión.

Cambios adicionales:

- `src/app/admin/disenos/page.tsx`: un diseño GUARDADO por el cliente
  permanece en status `draft` hasta agregarse al carrito, y la página lo
  excluía (`.neq status draft`) — por eso “guardar diseño” nunca aparecía en
  `/admin/disenos`. Ahora incluye drafts con `design_json` guardado (los
  borradores vacíos siguen ocultos).
- `scripts/qa/designer-contracts.test.ts`: test de contratos que valida los
  payloads reales de los 9 diseñadores (crear diseño, guardar v2 y carrito)
  contra los schemas Zod del backend (19/19 OK). Guardar y carrito usan el
  mismo contrato; no se relajó ninguna validación global.

## P2 — Stickers planilla sin preview

- `src/components/designer/sheets/SheetCanvas.tsx`: el círculo usaba
  `fillPattern*` con un transform que desplazaba la imagen `imgWidth/2` px
  fuera de la figura → círculos vacíos (el bug del QA). Ahora la forma
  (círculo / cuadrado / rectángulo) es una máscara real (`Group.clipFunc`) y
  la imagen se dibuja en modo *cover* (centrada, recorte uniforme, sin
  distorsión), con línea de corte punteada de referencia.
- `src/components/designer/sheets/SheetDesigner.tsx`: la pieza/imagen base
  aparece en la hoja INMEDIATAMENTE al subirla; la persistencia al storage
  corre en segundo plano y rellena `assetId`/URL firmada al confirmar (igual
  que el diseñador de prendas). Se eliminó la race condition que dejaba el
  lienzo vacío mientras la red respondía. El guardado sigue exigiendo
  `assetId` real (aviso claro si la subida sigue pendiente).
- Guarda de tamaño: una imagen muy vertical ya no puede generar un alto mayor
  al área imprimible (el ancho se ajusta), evitando payloads inválidos.

## P3 — Vista de giro

- `src/components/designer/GarmentDesigner.tsx` (`prepareSpinPreviews`):
  captura SIEMPRE frente y espalda (si la prenda tiene espalda). Un lado sin
  diseño produce el mockup vacío — nunca pantalla rota ni el mensaje “guarda
  tu diseño…”. Funciona desde el primer clic, sin guardar.
- `src/components/designer/ProductSpinViewer.tsx`:
  - la espalda ya NO se espejea (`scaleX(-1)` invertía el diseño y el texto);
  - el botón pasa de “Atrás” a “Espalda” (consistente con el selector de zona);
  - el botón de espalda solo aparece cuando existe vista posterior (las
    gorras, que solo se diseñan de frente, ya no muestran un botón roto);
  - sin vista posterior el giro recae en el frente (nunca queda en blanco);
  - botones con área táctil ≥44px.
- Aplica automáticamente a sudadera y tote (mismo motor `GarmentDesigner`).

## P4 — Navegación y 404

- `supabase/seed_designer_base_v2.sql` crea la categoría `impresion-3d` con el
  producto `pieza-3d-personalizada` (sobre pedido) → el CTA “Impresión 3D” de
  la home apunta a una **ruta de categoría real** (opción 1 del checklist).
- `src/app/tienda/categoria/[handle]/page.tsx`: respaldo “Próximamente” con
  CTA de WhatsApp para las categorías curadas enlazadas desde la home
  (`stickers`, `imanes`, `impresion-3d`, `etiquetas-escolares`,
  `matrixlab-tumbler`) cuando la fila aún no existe en la BD (p. ej. seed
  pendiente). Cualquier otro handle sigue dando 404 normal.
- `scripts/qa/check-home-links.mjs`: recorre todos los `href` internos de `/`
  (y páginas extra), verifica que ninguno dé 404/5xx y que las anclas
  `/#seccion` apunten a un `id` existente. Correr con el server arriba:
  `node scripts/qa/check-home-links.mjs http://localhost:3000 /`.

**Auditoría ejecutada (19 links internos de `/`, todos OK):**
`/`, `/#contacto`, `/#empresas`, `/#laboratorio`, `/#tshirtlab`, `/#tumbler`,
`/tienda`, `/tienda/categoria/imanes`, `/tienda/categoria/impresion-3d`,
`/tienda/categoria/matrixlab-tumbler`, `/tienda/categoria/stickers`,
`/tienda/disenador`, `/tienda/disenador/etiquetas-escolares`,
`/tienda/disenador/gorra` (→ `/gorras`), `/tienda/disenador/gorra-clasica`
(→ `/gorras`), `/tienda/disenador/laser`, `/tienda/disenador/playera`,
`/tienda/disenador/sudadera`, `/tienda/disenador/tote`. Los chips del hero
apuntan a rutas existentes y las anclas del footer/nav a secciones con `id`
real. “Cotizar por WhatsApp” abre `wa.me` (externo).

## P5 — UX “para dummies”

`GarmentDesigner` (playera, sudadera, gorras, tote) ahora muestra encabezados
numerados visibles:

1. **Elige tu prenda** (barra superior con nombre del producto y “Cambiar
   prenda”; en gorras es el selector trucker/clásica)
2. **Selecciona perfil, talla y color** (o “Selecciona el color” si la prenda
   no usa tallas)
3. **Sube tu diseño** (zona Frente/Espalda + upload + capas + medidas)
4. **Ajusta tamaño y posición** (encabezado del lienzo con instrucción)
5. **Revisa frente y espalda** (vista de giro + notas)
6. **Guarda o agrega al carrito** (CTA)

En móvil los pasos 2 y 5 viven en la botonera bajo el lienzo con su número
visible. Botones táctiles ≥44px (perfil, tallas, zonas, giro, drawer).

## P6 — Etiquetas escolares: imagen personalizada

Verificado en navegador (sin rehacer el motor de tipografías aprobado):

- Acepta PNG, JPG, JPEG y WEBP (whitelist en cliente y servidor; SVG
  prohibido); máx. 8 MB.
- La imagen aparece en la preview inmediatamente después del upload, se puede
  **mover** (drag con pointer events, también táctil) y **escalar** (30 % –
  300 %), siempre **detrás del texto** (z-order fijo) y con **velo de
  contraste automático** activable.
- No depende de catálogo de personajes: cualquier imagen propia del cliente
  funciona (la función es para imágenes/referencias del cliente; no se
  prometen personajes protegidos).
- `design_json.customImage` persiste `assetId`, `fileName`,
  `transform {x, y, scale}` y `readabilityOverlay`, validado por
  `SchoolLabelsDesignJsonSchema` y saneado en el backend.

## P7 — Responsive móvil

Verificado con Chromium (emulación táctil) en **390×844** y **430×932**:
home, sudadera y gorras sin scroll horizontal; drawer de perfil/talla/color
utilizable; upload, drag y escala funcionan; vista de giro abre; CTA final
alcanzable (56px de alto); modales y botonera inferior accesibles.

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `supabase/seed_designer_base_v2.sql` | **Nuevo.** Seed transaccional/idempotente de productos base (P0/P1/P4) |
| `src/components/designer/sheets/SheetCanvas.tsx` | Máscara real por `clipFunc` + imagen cover + línea de corte (P2) |
| `src/components/designer/sheets/SheetDesigner.tsx` | Colocación inmediata + persistencia en segundo plano + clamp de alto (P2) |
| `src/components/designer/GarmentDesigner.tsx` | Spin captura ambos lados; pasos numerados 1–6; targets 44px (P3/P5) |
| `src/components/designer/ProductSpinViewer.tsx` | Espalda sin espejo, botón “Espalda” condicional, fallback al frente (P3) |
| `src/components/designer/GorrasDesigner.tsx` | Encabezado “1. Elige tu prenda: tipo de gorra” (P5) |
| `src/components/designer/PrintZoneSelector.tsx` | Targets 44px + `data-testid` (P5/QA) |
| `src/app/admin/disenos/page.tsx` | Muestra diseños guardados en `draft` con `design_json` (P1) |
| `src/app/tienda/categoria/[handle]/page.tsx` | Fallback “Próximamente” para categorías curadas (P4) |
| `scripts/qa/check-home-links.mjs` | **Nuevo.** Auditoría automatizada de links internos (P4) |
| `scripts/qa/designer-contracts.test.ts` | **Nuevo.** Test de contratos Zod cliente↔backend (P1) |
| `package.json` | Override `postcss ^8.5.10` (npm audit: 0 vulnerabilidades) |
| `docs/qa-screenshots/*` | Capturas de evidencia desktop y móvil |

Seguridad: no se relajó ninguna validación. Los schemas Zod, la CSP, el rate
limiting, la validación de producto/variante y el resto del hardening quedan
intactos (el fix de payloads fue innecesario: los contratos ya eran
compatibles — se agregó el test para evitar drift futuro).

## Evidencia de QA

- `npm run type-check` ✓ · `npm run lint` ✓ · `npm run build` ✓ ·
  `npm audit` ✓ (0 vulnerabilidades tras el override de postcss).
- `node scripts/qa/check-home-links.mjs` → 19/19 links internos de `/` OK.
- `npx tsx scripts/qa/designer-contracts.test.ts` → 19/19 contratos OK.
- QA de navegador real (Chromium headless) → **35/35 checks OK** en desktop
  1440×900 y móvil 390×844 / 430×932, incluyendo: imagen visible al subir en
  playera/planilla/grid, círculo/cuadrado/rectángulo con máscara correcta,
  “Caben N piezas” se actualiza al cambiar tamaño, giro frente/espalda con y
  sin diseño posterior, persistencia del diseño frontal, imagen propia en
  etiquetas, cero 404 en rutas mínimas y CTA alcanzable en móvil.
- Capturas en `docs/qa-screenshots/` (desktop y móvil).
- Seed probado en Postgres 16 con migraciones reales (4 corridas, casos
  límite arriba).

## Riesgos pendientes

1. **El seed debe ejecutarse en el Supabase de PRODUCCIÓN** — es la causa
   raíz de P1. Hasta entonces, los diseñadores seguirán en modo
   previsualización (ahora con imagen visible y cotización por WhatsApp, pero
   sin guardar/carrito).
2. Guardar/carrito end-to-end contra Supabase real no se pudo ejercitar desde
   este entorno (sin credenciales): validado por contrato + lectura del
   backend + Postgres local. Verificar en producción tras el seed (checklist
   abajo).
3. El fallback “Próximamente” cubre solo las categorías curadas de la home;
   si se agregan nuevas cards a la home, añadirlas a
   `CURATED_CATEGORY_FALLBACKS` o crear su categoría real.
4. Los QA reportaron “forma circular” en `/tienda/disenador/stickers-planilla`
   (modo libre, sin selector de forma): el selector de formas vive en
   `stickers-repeticion`. Ambos quedaron verificados; si QA esperaba formas
   en el modo libre, es un feature nuevo (no un bug) y queda fuera de este
   hotfix.
5. `npm audit` quedó en 0 con el override `postcss ^8.5.10` (Next pinea
   8.4.31, vulnerable GHSA-qx2v-qp2m-jg93). El build/lint/type-check pasan
   con 8.5.19; si una actualización futura de Next lo resuelve, retirar el
   override.

## Hotfix 2 — Mapeo canónico ruta/tipo → handle real de Supabase

Con el seed ya ejecutado en producción (11 productos confirmados), se
centralizó TODO el mapeo entre rutas/tipos del diseñador y los handles reales
del catálogo en **una única fuente de verdad**:

- **`src/lib/designer/product-handles.ts` (nuevo):**
  `DESIGNER_PRODUCT_HANDLE_MAP` (tipo/alias → handle real, incluye alias
  `tote-bag`, `grabado-laser`, `impresion-3d`, `pieza-3d`, ambos modos de
  imanes), `resolveDesignerHandle()` (normaliza cualquier entrada — tipo,
  alias o handle canónico — al handle real), `CANONICAL_DESIGNER_HANDLES` y el
  mapa inverso `DESIGNER_HANDLE_TO_TYPE`.
- **`src/lib/designer/product-catalog.ts`:** todos los `baseHandle` del
  catálogo del laboratorio ahora DERIVAN del mapa (cero literales).
- **`src/lib/store/products.ts`:**
  - `getDesignerBaseProduct()` normaliza la entrada vía
    `resolveDesignerHandle()` antes de consultar — un lookup "viejo" por
    `playera`, `laser`, `stickers-planilla`, `tote`, etc. ya NO puede caer a
    modo previsualización: se traduce al handle real
    (`playera-personalizada`, `grabado-laser-personalizado`,
    `planilla-stickers`, `tote-bag-personalizada`). Como último respaldo, si
    el handle canónico no existiera en la base, intenta la consulta literal.
  - `getDesignerFallbackProduct()` usa la misma normalización.
  - `DESIGNER_PRODUCT_HANDLES` (handle → tipo, CTA de producto) derivado del
    mapa inverso en vez de literales.
  - **Diagnóstico de producción:** cuando el lookup del producto base no
    devuelve fila, se registra `[designer] lookup de producto base sin
    resultado` con `handle`, `usingServiceRole` y el código/mensaje de error
    de Supabase. Si producción sigue en modo previsualización con los datos
    presentes, este log en el hosting distingue entre "no existe la fila" y
    "la consulta falla" (clave inválida/env/RLS/timeout/URL).
- **Rutas:** la página de gorras y la de etiquetas escolares toman sus handles
  del mapa (`DESIGNER_PRODUCT_HANDLE_MAP["gorra-trucker"|"gorra-clasica"|"etiquetas-escolares"]`);
  el fallback de `SchoolLabelsLab` también.
- **Guardado/carrito/admin:** operan por `product_id`/`variant_id` resueltos
  desde el producto ya mapeado (verificado; no traducen handles por su
  cuenta), y los schemas Zod validan `productType` contra el mismo catálogo.
- **`scripts/qa/designer-handles.test.ts` (nuevo):** 66 checks que fallan si
  cualquier tipo, alias o entrada del catálogo deja de resolver a uno de los
  11 handles confirmados en producción.
  Correr con `npx tsx scripts/qa/designer-handles.test.ts`.

QA del hotfix 2: `type-check` ✓, `lint` ✓, `build` ✓, mapeo 66/66 ✓,
contratos 19/19 ✓, links de la home 19/19 sin 404 ✓, smoke de navegador en
las 8 rutas del diseñador (producto base resuelto, sin aviso de catálogo;
upload coloca la imagen y lista la capa) ✓.

**Si tras desplegar esta rama producción siguiera en previsualización:** el
problema ya no puede ser el mapeo — revisar en los logs del hosting el
warning `[designer] lookup de producto base sin resultado` (revela
código/mensaje del error real de Supabase) y validar
`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
en el entorno del deploy. Importante: el fix vive en ESTA rama; producción lo
recibe hasta que la rama se despliegue.

## Hotfix 3 — Diagnóstico de runtime del deployment (Preview en previsualización)

Con Supabase producción confirmado
(`sudadera-personalizada | disponible | true | 1 variante | SUD-CUSTOM`) y el
mensaje de catálogo aún visible en Preview, se auditó el runtime completo del
camino `getDesignerBaseProduct("sudadera-personalizada")` reproduciéndolo
contra un Supabase REST simulado (PostgREST) en 5 escenarios. Resultado: **el
código resuelve correctamente cuando el runtime tiene URL/llaves válidas del
proyecto correcto** — y una deducción clave:

> Si faltaran las variables de Supabase, la página usaría los mocks de
> desarrollo y NO mostraría el mensaje de catálogo. Que Preview muestre ese
> mensaje implica que su runtime SÍ tiene `SUPABASE_URL` + una llave, ejecuta
> la consulta… y no recibe la fila. Es decir: **el deployment Preview está
> consultando otro proyecto, o con llaves inválidas, o corre un commit viejo.**

### Log temporal `[designer runtime diagnostic]`

Cada visita a una ruta del diseñador emite UNA línea segura (sin llaves ni
URLs completas) en los logs del deployment con:
`productType`, `resolvedHandle`, `commit` (7 chars de `VERCEL_GIT_COMMIT_SHA`),
`vercelEnv`, `hasSupabaseUrl`, `hasServiceRole`, `hasAnonKey`, `projectRef`
(subdominio de la URL normalizada), `usingServiceRole`, `found`, `status`,
`isCustomizable`, `variantCount`, `variantSkus`, `errorCode`, `errorMessage`.

**Cómo leerla (firmas verificadas en reproducción local):**

| Firma en el log | Causa exacta | Corrección |
|---|---|---|
| `found: true, status: 'disponible', variantSkus: ['SUD-CUSTOM']` | Todo bien: si aún ves el banner, el HTML es de un deployment/caché viejo | Redeploy / hard-refresh |
| `commit` ≠ `9fc11ac`+ o `null` en Vercel | El deployment NO corre esta rama | Desplegar la rama del hotfix (check 1) |
| `projectRef` ≠ `spgrjhlwmyjfwiwsgqvn` | Preview apunta a OTRO proyecto Supabase (env vars de Preview ≠ producción) | Corregir `SUPABASE_URL` del entorno Preview en Vercel (check 3) |
| `found: false, errorCode: null, errorMessage: null` | El proyecto consultado NO tiene la fila (proyecto equivocado o sin seed) | Igual que arriba: revisar `projectRef` |
| `errorMessage: 'Invalid API key'` | `SUPABASE_SERVICE_ROLE_KEY` / anon key inválidas o de otro proyecto | Re-copiar llaves del proyecto correcto (check 2) |
| `errorMessage: 'read-timeout'` | URL inaccesible desde el runtime (URL rota, red) | Revisar `SUPABASE_URL` exacta |
| `hasSupabaseUrl: false` | (No produce el mensaje de catálogo: caería a mocks) | Definir las vars en el scope Preview |

### Verificaciones ejecutadas (reproducción con mock PostgREST)

1. **Proyecto correcto** → consulta EXACTA `handle=eq.sudadera-personalizada`
   (visible en el access-log del mock), acepta `status='disponible'`,
   encuentra `SUD-CUSTOM` (variantCount 1), página SIN banner ni mensaje. ✓
2. **Proyecto sin la fila** → `found:false, error null` + banner. ✓
3. **Llave inválida (401)** → `errorMessage:'Invalid API key'` + banner. ✓
4. **URL inaccesible** → `errorMessage:'read-timeout'` + banner. ✓
5. **URL sucia** `…/rest/v1/` con slash final → se normaliza y resuelve igual
   (check 4). ✓
6. **Sin cache negativo** (check 9): el MISMO proceso que falló 3 veces
   resolvió al instante al recuperarse la fuente; las rutas son
   `force-dynamic` y no se cachea ningún resultado (solo el cliente HTTP). ✓
7. `usingServiceRole:true` cuando `SUPABASE_SERVICE_ROLE_KEY` existe
   (check 5); con solo anon también funciona (RLS permite
   `status <> 'oculto'`). ✓

### Robustez agregada

* Reintento único de la lectura (producto y variantes) cuando hay ERROR
  transitorio (cold start / hipo de red). Un resultado vacío limpio NO se
  reintenta ni se cachea.
* Presupuesto del resolver ampliado a 9s (era 4s totales; un cold start
  serverless con TLS podía tirar a previsualización por timeout).

### Pasos para cerrar en Vercel

1. Abrir el deployment Preview → Functions/Logs.
2. Visitar `/tienda/disenador/sudadera` en ese Preview.
3. Buscar `[designer runtime diagnostic]` y comparar contra la tabla.
4. Aplicar la corrección de la fila que coincida (env vars del scope
   Preview: `SUPABASE_URL` → `https://spgrjhlwmyjfwiwsgqvn.supabase.co`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) y redeploy.
5. Confirmado `found:true` sin banner → **retirar el log temporal** (bloque
   `console.info("[designer runtime diagnostic]", …)` marcado con
   `TODO(diagnóstico temporal)` en `src/lib/store/products.ts`; el
   `console.warn` de "lookup sin resultado" sí se queda).

## Hotfix 4 — Falso fallback por timeout del resolver (log real: 9.01s)

### Causa raíz exacta (confirmada con el log real de Vercel)

El log de Preview (`commit b5ecaff`) mostró `errorMessage: "read-timeout"` con
duración de función de 9.01s y `projectRef` correcto. La cadena era:

1. Cada lectura individual tenía un timeout local de **4s** (`READ_TIMEOUT_MS`).
2. El resolver hacía **lecturas secuenciales**: producto → (reintento) →
   variantes → (reintento) → fallback del catálogo.
3. Todo bajo un **presupuesto global rígido de 9s** que cortaba la función a
   los 9.01s y devolvía `null` ⇒ modo previsualización **con el producto
   existente** en Supabase. La latencia real Preview↔Supabase (>4s por
   lectura en frío) convertía el presupuesto en un falso negativo garantizado.

### Corrección

`src/lib/store/products.ts` (`resolveDesignerBaseProduct`):

* **UNA sola lectura** con variantes embebidas por la FK real:
  `products?select=*,product_variants(*)&handle=eq.<handle>&limit=1`
  (el mismo embed ya probado del catálogo público). Antes: 2–3+ requests
  secuenciales; ahora: **1 request por resolución**.
* **Sin presupuesto global**: se eliminó el corte rígido de 9s (y el
  `withTimeout` huérfano). La única lectura tiene su propio límite de **15s**
  (`DESIGNER_READ_TIMEOUT_MS`).
* **Máximo un reintento** y SOLO ante fallos transitorios (timeout, conexión,
  429, 5xx — `isTransientReadError`), con espera corta de **350ms**. Un
  resultado limpio sin fila (`found:false` sin error) **nunca** se reintenta
  ni se cachea. Nota: supabase-js además reintenta 5xx internamente (medido:
  hasta 4 requests/~7s antes de exponer `code: '503'`), así que el peor caso
  acotado es ~30s únicamente con Supabase caído dos veces seguidas — sin
  bloqueo indefinido; después la página degrada a previsualización.
* **Estados**: el diseñador acepta `disponible` y `sobre_pedido` siempre que
  `is_customizable = true` (ahora también validado en el resolver); nunca se
  exige stock físico a personalizados bajo pedido. `oculto` o
  `is_customizable=false` ⇒ previsualización (fallback legítimo).
* El respaldo por el path del catálogo público solo corre ante miss limpio o
  error NO transitorio (p. ej. llave service inválida, donde el path anon
  puede funcionar); tras doble fallo transitorio no se apilan más timeouts.

### Números antes / después

| Métrica | Antes (b5ecaff) | Después |
|---|---|---|
| Requests a Supabase por resolución | 2 secuenciales + hasta 2 reintentos + 1 fallback | **1** (embed) |
| Timeout por lectura | 4s | 15s |
| Presupuesto global | 9s rígido (cortaba la función) | Ninguno (límite por lectura) |
| Preview real (log Vercel) | 9.01s → `read-timeout`, `found:false` | — (pendiente redeploy) |
| Reproducción: Supabase a 6s/request | falso negativo garantizado (4s < 6s) | `found:true, attempts:1, elapsedMs:6354` |
| Reproducción: latencia normal | — | `elapsedMs` 47–95ms, `attempts:1` |
| 7 rutas × 5 cargas (35 resoluciones) | — | 35/35 `found:true`, 0 intermitencias, 1 request c/u |
| 503 transitorio (1º falla, 2º ok) | — | recuperado sin fallback (la lib reintenta; capa propia cubre timeout/conexión) |

Log local esperado para sudadera (verificado):
`resolvedHandle:'sudadera-personalizada', status:'disponible',
variantSkus:['SUD-CUSTOM'], found:true, isCustomizable:true, variantCount:1,
errorCode:null, errorMessage:null`.

### Región (documentación de la decisión)

El log de Vercel muestra la función en **Washington D.C. (iad1)**. Desde este
entorno de trabajo NO fue posible verificar la región real del proyecto
Supabase `spgrjhlwmyjfwiwsgqvn` (el proxy de salida bloquea la consulta), así
que **no se fijó región por código** (la instrucción exige comprobar antes de
hardcodear). Cómo cerrar esto:

1. Supabase Dashboard → Project Settings → General → **Region**.
2. Si es `us-east-1` (N. Virginia): iad1 ya es la región óptima — no hacer nada.
3. Si es otra: en Vercel → Project Settings → Functions → Region elegir la
   más cercana (o `vercel.json` → `{"regions": ["<id>"]}`). Mapeo rápido:
   `us-east-1→iad1`, `us-west-1→sfo1`, `sa-east-1→gru1`,
   `eu-west-1→dub1`, `eu-central-1→fra1`, `ap-southeast-1→sin1`.
   Con la lectura única + 15s, la latencia cruzada deja de ser bloqueante en
   cualquier caso; fijar región es optimización, no requisito.

### Log temporal

`[designer runtime diagnostic]` sigue activo (una línea por resolución) ahora
con `elapsedMs` y `attempts`. **Retirarlo tras confirmar en Preview** (bloque
marcado `TODO(diagnóstico temporal)` en `src/lib/store/products.ts`).

### Copy

`src/lib/designer/school-labels/info-content.ts`: eliminado
“Cuenta Banamex a nombre de Karla Elorza.” de Métodos de pago →
Transferencia bancaria. Quedan solo las dos líneas de datos-al-confirmar y
comprobante por WhatsApp. Sin cambios de lógica de pagos.

### QA técnico del hotfix 4

`type-check` ✓ · `lint` ✓ · `build` ✓ · `npm audit` 0 vulnerabilidades ·
mapeo 66/66 ✓ · contratos 19/19 ✓ · reproducción con mock PostgREST en 6
escenarios (normal, 6s/request, 503 transitorio, 503 persistente, sin fila,
llave inválida) ✓.

### Pendiente en Vercel Preview (con Supabase real)

1. Desplegar la rama y abrir las 7 rutas del diseñador 5 veces cada una.
2. Confirmar en el log: `found:true, isCustomizable:true, variantCount>0,
   errorMessage:null` y para sudadera `variantSkus:['SUD-CUSTOM']`.
3. QA funcional: sin mensaje de catálogo; guardar habilitado; carrito;
   `/tienda/carrito`; `/admin/disenos`; stickers-planilla/repetición y gorras
   guardan; sin regresión en etiquetas.
4. Confirmada la corrección → retirar el log temporal.

## Hotfix 5 — "TypeError: fetch failed": la función no alcanza el host de Supabase

### Qué dice el log real de `2554274`

`elapsedMs:14456, attempts:2, errorMessage:"TypeError: fetch failed"` con
projectRef y llaves correctos. `fetch failed` de undici significa que el
runtime **ni siquiera obtuvo una respuesta HTTP**: el fallo es de RED pura
(DNS, TCP o TLS) hacia `https://spgrjhlwmyjfwiwsgqvn.supabase.co`. No es la
consulta, no es PostgREST, no es RLS ni el mapeo. Los "read-timeout" previos
eran este mismo fallo enmascarado por el timer local de 4s. Los ~7s por
intento son los reintentos internos de supabase-js fallando en cadena.

### Qué se embarcó en este hotfix

1. **Sonda de red de bajo nivel** (solo corre cuando la lectura falla a nivel
   de red): agrega al diagnóstico `netHost` (hostname realmente usado),
   `netHostClean` (¿el host tiene caracteres raros/invisibles?), `netDns`
   (resultado del lookup con familias v4/v6 o código ENOTFOUND/…),
   `netConnect` (fetch crudo a `/auth/v1/health`: `http:<status>` o código
   ECONNREFUSED/ETIMEDOUT/CERT_*) y `nodeVersion`. Verificada localmente:
   DNS roto → `ENOTFOUND`; puerto bloqueado → `ok(v4)` + `ECONNREFUSED`.
2. **Fix candidato #1 — caracteres invisibles en `SUPABASE_URL`**:
   `normalizeSupabaseUrl` ahora elimina zero-width spaces (U+200B/C/D),
   word-joiner, BOM, NBSP y espacios internos. Un solo U+200B pegado al
   copiar la URL al panel de Vercel corrompe el hostname y produce EXACTAMENTE
   `TypeError: fetch failed` persistente, aunque la variable "se vea" bien.
   Reproducido y verificado: URL con U+200B incrustado → antes fetch failed,
   ahora `found:true` con `SUD-CUSTOM`.
3. **Fix candidato #2 — respaldo de URL**: si `SUPABASE_URL` falta en un
   scope, se usa `NEXT_PUBLIC_SUPABASE_URL` (mismo valor público estándar).

### Cómo leer la nueva línea del log en Preview

| Firma de la sonda | Causa exacta | Corrección |
|---|---|---|
| `found:true` (ya no aparece sonda) | Era el carácter invisible en la URL: el fix #1 lo eliminó | Nada: cerrado |
| `netHostClean:false` o `netDns:ENOTFOUND` con host "raro" | Carácter invisible/typo visible en `SUPABASE_URL` | Reescribir la variable A MANO (no pegar) en Vercel |
| `netDns:ENOTFOUND` con host correcto | El hostname no existe: typo `.com`/`.co`, o proyecto pausado/eliminado sin DNS | Verificar URL exacta y estado del proyecto en Supabase |
| `netDns:ok(v4[,v6])` + `netConnect:ETIMEDOUT/ECONNREFUSED` | Red bloqueada hacia el gateway: proyecto PAUSADO (plan free), restricciones, o incidente | Supabase Dashboard → restaurar/verificar el proyecto |
| `netDns:ok(v6)` (solo v6) + fetch failed | Runtime sin egreso IPv6 con host solo-AAAA | Actualizar Node en Vercel (Settings → Node.js ≥20) |
| `netDns:ok` + `netConnect:http:401/200` | ¡La red FUNCIONA con conexión fresca! ⇒ sockets keep-alive rancios del pool | Redeploy; si reincide, avisar para montar fetch propio sin pool |
| `nodeVersion: v18.x` | Node 18 sin auto-selección de familia + host dual-stack | Vercel → Settings → Node.js Version ≥ 20 |

**Chequeo manual de 60 segundos (en paralelo):** desde tu máquina, correr
`curl -sI https://spgrjhlwmyjfwiwsgqvn.supabase.co/rest/v1/` — si responde
(aunque sea 401) el proyecto está vivo y el problema es del runtime de
Vercel; si no responde tampoco desde tu máquina, el proyecto está
pausado/incidentado (Supabase Dashboard lo mostrará como "Paused").
También revisar que en Preview `/tienda` muestre productos reales: si
tampoco carga catálogo, el bloqueo de red es global del deployment (misma
causa) y no algo específico del diseñador.

### Nota

Desde este entorno de trabajo no es posible reproducir la ruta de red
Vercel→Supabase (el proxy local bloquea la salida hacia `*.supabase.co`), por
lo que la corrección definitiva depende de la firma que arroje la sonda en el
próximo deploy de Preview. Los dos fixes candidatos embarcados cubren las dos
causas más frecuentes de este error con configuración "correcta".

## Instrucciones exactas de producción

1. **Supabase (SQL Editor):** ejecutar `supabase/seed_designer_base_v2.sql`
   completo. Revisar que la consulta final devuelva `ok = true` en las 11
   filas. (Re-ejecutable sin riesgo.)
2. **Deploy** de esta rama al hosting (tras aprobar el QA de la rama).
3. **Smoke test en producción (en este orden):**
   1. `/tienda/disenador/playera`: NO debe aparecer el banner de modo
      previsualización; subir imagen → guardar → “Diseño guardado ✓”.
   2. Agregar al carrito → aparece en `/tienda/carrito` con precio.
   3. `/admin/disenos`: el diseño guardado aparece con preview.
   4. Repetir guardar+carrito en sudadera, gorras (trucker y clásica), tote,
      stickers-planilla, stickers-repeticion (círculo), laser y
      etiquetas-escolares (con imagen propia).
   5. Home: click a cada card/chip — cero 404 (o correr
      `node scripts/qa/check-home-links.mjs https://www.matrixlabintelligence.com /`).
   6. Móvil real: sudadera y gorra (subir, mover, escalar, girar, guardar).
4. **No hacer merge a main** hasta completar el punto 3.
