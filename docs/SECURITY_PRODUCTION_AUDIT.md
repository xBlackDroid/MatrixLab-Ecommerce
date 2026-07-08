# Auditoría de Seguridad Pre-Producción — MatrixLab Ecommerce

- **Rama:** `feat/security-production-audit`
- **Fecha:** 2026-07-08
- **Alcance:** Proyecto propio MatrixLab-Ecommerce (Next.js App Router + TypeScript + Supabase + Mercado Pago).
- **Tipo:** Auditoría de caja blanca (revisión de código + pruebas locales no destructivas).
- **Restricciones respetadas:** sin pagos reales, sin fuerza bruta real, sin pruebas contra terceros, sin exponer secretos, sin tocar dominio/credenciales productivas.

---

## 1. Resumen ejecutivo

El proyecto **llega a producción en muy buen estado de seguridad**. La base
existente ya implementa correctamente los controles críticos de un ecommerce
con pagos: sesiones firmadas con HMAC, CSRF ligado a la sesión, rate limiting
por endpoint, validación Zod estricta (`.strict()`) en todas las entradas,
recálculo de precios en servidor, verificación de firma del webhook de Mercado
Pago con reconsulta del pago real, idempotencia transaccional del pago, RLS
*deny-by-default* en Supabase y uploads validados por *magic bytes* con `sharp`
(SVG y ejecutables rechazados de raíz).

La auditoría **no encontró vulnerabilidades Critical ni High explotables**. Se
corrigieron varios endurecimientos de severidad Medium/Low relacionados con
*fail-safe* de configuración, autorización defensiva en un endpoint de edición,
y rate limiting de un endpoint que no lo tenía. El único hallazgo pendiente es
una vulnerabilidad **moderate transitiva de `postcss`** heredada de Next.js, sin
parche estable disponible y con riesgo práctico bajo para esta app.

**Recomendación: apto para lanzar a producción**, una vez completado el
checklist de configuración de la sección 10 (secretos fuertes, webhook secret,
`NEXT_PUBLIC_SITE_URL` en https, y RLS aplicado en el proyecto Supabase real).

### Conteo de hallazgos

| Severidad | Total | Corregidos | Pendientes |
|-----------|-------|------------|------------|
| Critical  | 0     | 0          | 0          |
| High      | 0     | 0          | 0          |
| Medium    | 4     | 4          | 0          |
| Low       | 4     | 3          | 1          |
| Informativo | 6   | —          | —          |

---

## 2. Riesgos encontrados (detalle)

### MEDIUM

#### M-1 · Secretos admin sin validación de longitud mínima (fail-safe débil)
- **Archivo:** `src/lib/security/env.ts`, `src/lib/security/session.ts`
- **Riesgo:** `isAdminConfigured()` solo comprobaba que `ADMIN_SESSION_SECRET`
  y `ADMIN_ACCESS_PASSWORD` existieran. Un `ADMIN_SESSION_SECRET` corto (p. ej.
  `"123"`) habría producido firmas HMAC débiles y fácilmente forzables, dejando
  el panel admin firmado con un secreto trivial sin que nada lo impidiera.
- **Corrección:** se añadió `getAdminSessionSecret()`, que trata cualquier
  secreto de menos de 32 caracteres como **no configurado** (el panel queda
  bloqueado en fail-safe en lugar de operar con firma débil). `verifyAdminSessionToken`
  y `createAdminSessionToken` ahora consumen esa función. La contraseña exige
  mínimo 8 caracteres.

#### M-2 · Edición de diseño permitía re-apuntar a producto no personalizable
- **Archivo:** `src/app/api/designs/[id]/route.ts`
- **Riesgo:** el `POST /api/designs` (creación) validaba que el producto fuera
  visible y personalizable y que la variante perteneciera al producto, pero el
  `PATCH /api/designs/[id]` (guardado) aceptaba `productId`/`variantId` nuevos
  sin re-verificar. Un cliente podía crear un borrador válido y luego mover el
  diseño a un producto oculto/no-personalizable, o a una variante de otro
  producto, generando estados inconsistentes explotables aguas abajo (carrito,
  checkout).
- **Corrección:** nueva función `validateProductChange()` que aplica las mismas
  reglas de la creación **solo cuando** el guardado intenta cambiar
  producto/variante. Un diseño cuyo producto se ocultó *después* puede seguir
  guardándose (no se degrada UX), pero no puede re-apuntarse a un producto
  inválido. Se aplica en las ramas v1 y v2 del PATCH.

#### M-3 · Checkout en producción no verificaba https en SITE_URL
- **Archivo:** `src/lib/security/env.ts`
- **Riesgo:** `isCheckoutConfigured()` no comprobaba el esquema de
  `NEXT_PUBLIC_SITE_URL`. Con un `SITE_URL` http en producción, la
  `notification_url` del webhook y las `back_urls` viajarían sin TLS y
  `auto_return` se desactiva silenciosamente, degradando la seguridad del flujo
  de pago.
- **Corrección:** en producción, `isCheckoutConfigured()` devuelve `false`
  (checkout apagado, fail-safe) si `SITE_URL` no empieza por `https://`.

#### M-4 · Endpoint de logout admin sin rate limiting
- **Archivo:** `src/app/api/admin/logout/route.ts`
- **Riesgo:** todos los endpoints admin aplicaban `RATE_LIMITS.adminApi`
  excepto `logout`, que quedaba abierto a peticiones ilimitadas (cada una
  ejecuta una verificación de token + un DELETE en `admin_sessions`).
- **Corrección:** se añadió `checkRateLimit(..., RATE_LIMITS.adminApi)` al inicio
  del handler, alineándolo con el resto de rutas admin.

### LOW

#### L-1 · Tabla `admin_sessions` sin purga de sesiones expiradas
- **Archivo:** `src/lib/security/admin-auth.ts`
- **Riesgo:** las sesiones revocadas se borran, pero las expiradas por tiempo
  quedaban acumulándose en la tabla (crecimiento sin límite → *information
  buildup*, no explotable pero indeseable).
- **Corrección:** `persistAdminSession()` ahora ejecuta una purga oportunista
  (`delete where expires_at < now()`) en cada login. Sin necesidad de cron.

#### L-2 · `NEXT_PUBLIC_WHATSAPP_NUMBER` con fallback silencioso
- **Archivo:** `src/lib/whatsapp.ts`
- **Estado:** aceptable. Usa un `FALLBACK_NUMBER` de ceros cuando la variable
  falta; no es un secreto y no representa riesgo. Documentado como informativo.

#### L-3 · Advisory moderate de `postcss` transitivo (PENDIENTE)
- **Dependencia:** `postcss@8.4.31` (bundle interno de `next@15.5.20`).
- **Ver sección 9 (Dependencias).** Sin parche estable; riesgo práctico bajo.

#### L-4 · Mensajes de configuración exponen nombres de variables de entorno
- **Archivo:** `src/app/admin/login/page.tsx`, `src/app/admin/page.tsx`
- **Estado:** aceptable/por diseño. Cuando el panel no está configurado se
  muestra "configura `ADMIN_ACCESS_PASSWORD` y `ADMIN_SESSION_SECRET`". Son
  *nombres* de variables (no valores) y solo aparecen en el panel interno. No es
  fuga de secreto; se deja como está por utilidad operativa.

---

## 3. Archivos revisados

**Seguridad / auth**
- `src/lib/security/env.ts` · `session.ts` · `admin-auth.ts` · `csrf.ts` · `rate-limit.ts` · `sanitize.ts`

**Rutas API** (`src/app/api/**`)
- `cart/route.ts`, `cart/items/route.ts`, `cart/items/[id]/route.ts`
- `designs/route.ts`, `designs/[id]/route.ts`
- `uploads/design-assets/route.ts`
- `checkout/mercadopago/route.ts`
- `webhooks/mercadopago/route.ts`
- `admin/{login,logout,designs,orders,categories,inventory,products,products/variants,uploads}/route.ts`

**Validación Zod** (`src/lib/validation/**`)
- `cart.ts`, `checkout.ts`, `store.ts`, `admin.ts`, `designer.ts`, `school-labels.ts`

**Lógica de negocio** (`src/lib/store/**`, `src/lib/db/**`, `src/lib/payments/**`)
- `cart.ts`, `orders.ts`, `pricing.ts`, `inventory.ts`
- `db/admin.ts`, `db/client.ts`, `db/storage.ts`
- `payments/mercadopago.ts`

**Base de datos** (`supabase/migrations/**`)
- `0001_schema.sql`, `0002_rls.sql`, `0003_storage.sql`, `0004_designer_expansion.sql`, `0005_school_labels.sql`

**Frontend / config**
- `src/app/layout.tsx`, `src/app/tienda/checkout/**`, `src/components/store/OrderSummaryCard.tsx`
- `next.config.ts`, `.env.example`, `.gitignore`

---

## 4. Verificación por sección del alcance

### 1. Variables de entorno y secretos — ✅
- Ningún secreto backend usa prefijo `NEXT_PUBLIC_`. Verificado por grep.
- `assertNoLeakedSecrets()` bloquea el arranque en producción si aparece un
  `NEXT_PUBLIC_*` con patrón de secreto (SERVICE_ROLE, ACCESS_TOKEN, etc.).
- No hay secretos hardcodeados. `grep` de patrones (`sb_secret`, `APP_USR`,
  service role, access token) solo encontró nombres de variable y comentarios.
- `.env.example` contiene claves **vacías** (sin valores reales).
- `.gitignore` excluye `.env` y `.env.*` (salvo `.env.example`). El historial de
  git **no** contiene `.env` ni `.env.local` (verificado).
- Un único `console.error` en `env.ts` (guardia anti-fuga) que imprime nombres,
  nunca valores.
- Service role y access token de Mercado Pago solo se leen vía `getServerEnv()`
  dentro de módulos `import "server-only"`.
- **Corregido:** longitud mínima de secretos admin (M-1).

### 2. Rutas API — ✅
- Métodos HTTP correctos; `runtime = "nodejs"` y `dynamic = "force-dynamic"`.
- Validación Zod `.strict()` en todos los bodies.
- Límite de body global de 256 KB en `readJsonBody`; webhook con límite propio
  de 64 KB; uploads con límite por `UPLOAD_MAX_MB`.
- Errores genéricos al cliente; sin stack traces ni detalles del proveedor.
- Ownership por `session_id` de cookie httpOnly en carrito, diseños y pedidos.
- Precio/estado/propiedad **nunca** se toman del cliente.
- **Corregido:** re-validación de producto en edición (M-2), rate limit logout (M-4).

### 3. Validaciones Zod — ✅
- IDs son `z.uuid()`. Strings con `.max()` en todos los campos.
- `notes`, `theme`, `name`, `lastNames` acotados; `previewDataUrl` limitado a
  2 MB; `design_json` acotado (20 KB v1 / 80 KB v2 / 12 KB etiquetas).
- Usos de esquemas abiertos (`.loose()` / `.passthrough()`), ambos **justificados
  y mitigados**:
  - `WebhookBodySchema.loose()` en el webhook: Mercado Pago envía campos
    variables y el pago se reconfirma contra su API, no se confía en el payload.
  - `SchoolLabelsDesignJsonSchema.passthrough()` (aportado por la rama de
    etiquetas): tolera llaves nuevas/legadas del `design_json` para no romper
    guardados. Mitigado porque (a) el tamaño total está acotado a 12 KB, (b) el
    route sanea explícitamente **todo** campo de texto de usuario antes de
    persistir —no confía en el spread `...j`— y (c) nada del `design_json` se
    renderiza vía `dangerouslySetInnerHTML` (React escapa siempre). Ver nota de
    integración al final.
- `design_json` no permite HTML: texto de láser y etiquetas escolares se
  sanitiza con `sanitizeText` (quita tags, control chars) antes de persistir, y
  el schema de etiquetas rechaza `<`/`>` en los campos de nombre/apellidos y
  vía `safeText` en los descriptivos. Los campos añadidos por el flujo de imagen
  propia (`customImage.fileName`), `addons` y `backgroundPreset` también se
  sanean en el route.

### 4. Uploads y Storage — ✅
- Solo PNG/JPG/WEBP; MIME real verificado con `sharp` (no por extensión/header).
- SVG, HTML, JS, PDF, ZIP, ejecutables → rechazados.
- Nombre original nunca es la ruta: se renombra con `nanoid` y la ruta incluye
  `hashSessionId`. Sin path traversal posible.
- Buckets `design-assets`/`design-previews` privados; lectura solo por URL
  firmada con expiración (30–60 min). `product-images` público solo lectura.
- Metadata segura; `original_file_name` pasa por `safeFileName`.
- Service role solo en servidor.

### 5. Supabase y RLS — ✅
- RLS habilitado en todas las tablas. Catálogo con SELECT público filtrado por
  estado visible; escritura revocada para anon/authenticated.
- Tablas privadas (carts, orders, designs, payment_events, admin_sessions,
  audit_logs) sin policies → deny-by-default; acceso solo vía service role.
- Diseños/carritos no enumerables: PK UUID + filtro por `session_id`.
- `process_paid_order` es `security definer` con `execute` revocado a
  anon/authenticated y concedido solo a `service_role`.
- No se exponen `select *` en respuestas públicas (el catálogo mapea columnas).

### 6. Admin — ✅
- Password nunca se filtra; comparación en tiempo constante (`timingSafeEqual`).
- Sesión firmada HMAC-SHA256 + registro en `admin_sessions` para revocación.
- Cookie httpOnly, `secure` en producción, `sameSite=lax`, expiración 8 h.
- Páginas admin protegidas con `requireAdminPage()` (redirige a login).
  Verificado en runtime: `/admin/disenos` responde **307 → /admin/login** sin
  sesión, y una cookie `ml_admin` forjada también redirige.
- Sin bypass por query params (probado `?admin=1&bypass=true` → 307).
- Mutaciones admin exigen sesión válida **+** token CSRF en header `x-ml-csrf`.

### 7. Carrito y precios — ✅
- Precio final siempre recalculado server-side desde Supabase
  (`resolveUnitPrice`); `unit_price_snapshot` es solo auditoría.
- Variantes inexistentes/ajenas rechazadas; producto oculto no se agrega.
- Diseños personalizados validados por propiedad y estado editable.
- `checkAvailability` valida cantidad entera, min/max, estado y stock.
- Carrito vacío no genera pedido (`CART_EMPTY`); totales derivados de líneas
  válidas (no negativos, precio `>= 0`).

### 8. Mercado Pago — ✅
- Preferencia con precios recalculados; solo devuelve `redirectUrl` + `orderId`.
- Webhook: valida firma `x-signature` (manifiesto oficial `id;request-id;ts`)
  con `timingSafeEqual`; **estricto en producción** (rechaza si falta el secreto).
- Reconfirma el pago consultando la API de Mercado Pago (no confía en payload).
- Idempotente vía `payment_events.event_id` único; el pago aprobado ejecuta la
  función SQL transaccional `process_paid_order` (no duplica inventario/orden).
- No degrada un pedido ya pagado por eventos tardíos.
- Access token nunca sale al cliente.
- **Corregido (M-3):** en producción, `SITE_URL` debe ser https o el checkout
  no se habilita.

### 9. Rate limiting y abuso — ✅
- Rate limit por IP/sesión en checkout (5/min), cart (40/min), designs (20/min),
  uploads (10/5min), admin-login (5/5min), admin-api (120/min), webhook (120/min).
  Verificado en runtime: el 6.º login devuelve **429 + Retry-After**.
- Body cap de 256 KB; endpoints con arrays acotados por schema (`.max()` en
  assets, placements, elements, images, tags).
- **GraphQL: el proyecto NO usa GraphQL** (confirmado por grep en `src/` y
  `package.json`). No hay endpoint `/graphql`, introspection, batching ni
  resolvers. Los equivalentes REST/Next quedan cubiertos por rate limiting,
  validación Zod y límites de tamaño/profundidad de payload descritos arriba.
- **Corregido (M-4):** logout admin ahora con rate limit.

### 10. Information disclosure — ✅
- Mensajes de error genéricos; los `catch` devuelven texto fijo sin detalles.
- Solo un `console.error` (guardia de secretos, sin valores).
- Login admin devuelve **el mismo** "Credenciales inválidas." (401) para body
  malformado y password incorrecta → sin enumeración.
- No se revela si un email de cliente existe (no hay endpoint de lookup).
- El resumen de pedido (`OrderSummaryCard`) solo se muestra si el pedido
  pertenece a la sesión.

### 11. Seguridad frontend — ✅
- No hay `dangerouslySetInnerHTML` en el ecommerce (el único uso de JSON-LD está
  en el sitio Principal, con contenido controlado). Sin `innerHTML`/`eval`.
- Todos los `target="_blank"` llevan `rel="noopener noreferrer"` (verificado por
  script: 0 faltantes).
- Textos de usuario (notas, nombres, temática de etiquetas) se sanitizan y React
  escapa por defecto → sin XSS reflejado/persistente.
- Mensajes de WhatsApp se construyen con `encodeURIComponent`.
- No se usa `localStorage`/`sessionStorage` para datos sensibles.
- Sin secretos en el bundle cliente (grep de `NEXT_PUBLIC_*` solo halla anon key
  y valores públicos por diseño).

### 12. Cabeceras de seguridad (añadidas en hardening previo) — ✅
- CSP, HSTS, X-Content-Type-Options, X-Frame-Options: DENY, Referrer-Policy,
  Permissions-Policy y `poweredByHeader: false` en `next.config.ts`. Verificado
  en runtime con `curl -I`.

### 13. Pruebas manuales locales — ✅
Todas las rutas requeridas responden correctamente (servidor de producción local
sin DB configurada → catálogo cae a datos mock, panel admin en fail-safe):

| Ruta | Resultado |
|------|-----------|
| `/`, `/tienda`, `/tienda/disenador` | 200 |
| `/tienda/disenador/{etiquetas-escolares,playera,sudadera,gorra-trucker,gorra-clasica,tote}` | 200 |
| `/tienda/carrito` | 200 |
| `/admin/login` | 200 (muestra fail-safe sin secretos) |
| `/admin/disenos` | 307 → `/admin/login` (sin sesión) |

Sin errores de consola de JS en las páginas (los 404 observados corresponden a
imágenes de catálogo/Supabase ausentes por no haber DB en local, no a fallos de
código).

---

## 5. Hallazgos corregidos (en esta rama)

| ID | Severidad | Corrección | Archivo(s) |
|----|-----------|------------|------------|
| M-1 | Medium | Longitud mínima de secretos admin (fail-safe) | `security/env.ts`, `security/session.ts` |
| M-2 | Medium | Re-validación de producto/variante al editar diseño | `api/designs/[id]/route.ts` |
| M-3 | Medium | Checkout exige https en `SITE_URL` en producción | `security/env.ts` |
| M-4 | Medium | Rate limiting en logout admin | `api/admin/logout/route.ts` |
| L-1 | Low | Purga oportunista de `admin_sessions` expiradas | `security/admin-auth.ts` |

---

## 6. Hallazgos pendientes

| ID | Severidad | Estado | Motivo |
|----|-----------|--------|--------|
| L-3 | Low (moderate CVSS 6.1) | Pendiente / mitigado | `postcss < 8.5.10` transitivo de Next.js. `npm audit fix --force` solo ofrece degradar a `next@9` (ruptura total). Sin versión estable de Next que lo resuelva a la fecha. **Riesgo práctico bajo**: es CWE-79 en el *stringify* de CSS en build-time; la app no procesa CSS de origen no confiable en runtime. Mitigación: seguir el advisory y actualizar Next cuando publique un parche; la CSP añadida limita el impacto de cualquier XSS. |

---

## 7. Recomendaciones para Vercel

- Definir **todas** las variables de la sección 1 como *Environment Variables*
  del proyecto (Production/Preview separados). Nunca en el repo.
- `SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_ACCESS_TOKEN`,
  `MERCADOPAGO_WEBHOOK_SECRET`, `ADMIN_ACCESS_PASSWORD`, `ADMIN_SESSION_SECRET`
  **sin** prefijo `NEXT_PUBLIC_`.
- `ADMIN_SESSION_SECRET`: generar con `openssl rand -base64 32` (mínimo 32
  caracteres; ahora obligatorio por código).
- `NEXT_PUBLIC_SITE_URL` = dominio de producción **https** exacto (sin `/` final).
- Confirmar que las cabeceras de seguridad se sirven (ya en `next.config.ts`);
  opcionalmente activar Vercel *Deployment Protection* para Preview.
- Revisar que Preview deployments no usen credenciales productivas de Mercado
  Pago (usar credenciales de prueba en Preview).

## 8. Recomendaciones para Supabase

- **Aplicar las migraciones `0001`–`0005`** en el proyecto real y confirmar que
  RLS quedó **habilitado** en todas las tablas (el dashboard lo marca).
- Verificar que los buckets `design-assets` y `design-previews` estén como
  **privados** y `product-images` como público solo lectura.
- Confirmar los `revoke`/`grant` de `process_paid_order` (execute solo a
  `service_role`).
- Rotar la `service_role key` si estuvo alguna vez fuera de un gestor de
  secretos. No usarla jamás en cliente.
- Activar backups automáticos y, si el plan lo permite, *Point-in-Time Recovery*.

## 9. Recomendaciones para Mercado Pago

- Configurar `MERCADOPAGO_WEBHOOK_SECRET` en producción (el webhook lo **exige**
  y rechaza si falta — fail-safe ya implementado).
- Registrar la `notification_url` = `https://<dominio>/api/webhooks/mercadopago`.
- Usar credenciales de **producción** solo en el entorno Production de Vercel;
  credenciales de prueba (`TEST-…`) en Preview/local.
- Verificar en el panel de Mercado Pago que los eventos de `payment` lleguen y
  que la firma valide (revisar `audit_logs` y `payment_events`).
- Mantener el flujo actual (reconsulta del pago a la API) — no confiar en el
  payload del webhook.

---

## 10. Checklist antes de producción

- [ ] Todas las env vars definidas en Vercel (Production) sin `NEXT_PUBLIC_` en secretos.
- [ ] `ADMIN_SESSION_SECRET` ≥ 32 chars aleatorios (`openssl rand -base64 32`).
- [ ] `ADMIN_ACCESS_PASSWORD` fuerte (frase larga, ≥ 8 chars).
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` configurado y webhook registrado.
- [ ] `MERCADOPAGO_ACCESS_TOKEN` de **producción** solo en entorno Production.
- [ ] `NEXT_PUBLIC_SITE_URL` = dominio https exacto de producción.
- [ ] Migraciones Supabase `0001`–`0005` aplicadas; RLS verificado por tabla.
- [ ] Buckets privados/públicos verificados en Supabase Storage.
- [ ] `service_role key` solo en backend; rotada si hubo exposición.
- [ ] Cabeceras de seguridad verificadas en el dominio (`curl -I`).
- [ ] Probar un pago end-to-end con credenciales **de prueba** antes del switch a producción.
- [ ] Definir plan de actualización de Next.js para cerrar el advisory de `postcss` (L-3).
- [ ] Revisar `audit_logs` tras las primeras transacciones reales.

---

## 11. QA ejecutado

| Comando | Resultado |
|---------|-----------|
| `npm run type-check` | ✅ sin errores |
| `npm run lint` | ✅ sin warnings ni errores |
| `npm run build` | ✅ build exitoso (18 rutas) |
| `npm audit` | ⚠️ 2 moderate (`postcss` transitivo de Next — ver L-3) |
| Pruebas de rutas (HTTP + navegador) | ✅ ver sección 4.13 |
| Pruebas de fail-safe / bypass admin | ✅ ver secciones 4.6 y 4.9 |

**Veredicto: apto para producción** tras completar el checklist de la sección 10.

---

## 12. Nota de integración — `release/preprod-matrixlab`

Esta rama integra dos líneas de trabajo independientes derivadas de `main`:

- `feat/etiquetas-draft-engine` (motor interactivo de Etiquetas Escolares:
  imagen propia, galería de tipografías, plantillas, add-ons, simplificación de
  datos del alumno a `firstName` + `lastNames`).
- `feat/security-production-audit` (este informe + hardening M-1…M-4, L-1).

**Integración:** merge de ambas ramas (sin rebase, para no reescribir historia
ni perder commits). Solo `src/app/api/designs/[id]/route.ts` era tocado por las
dos ramas; git lo auto-fusionó (regiones disjuntas) y se verificó a mano que
conviven la simplificación de etiquetas (`lastNames`) y el guard de seguridad
`validateProductChange` (v1 y v2).

**Revisión de seguridad post-merge (regresión detectada y corregida):**
la rama de etiquetas cambió `SchoolLabelsDesignJsonSchema` de `.strict()` a
`.passthrough()` e introdujo campos nuevos de texto de usuario (`addons`,
`backgroundPreset`, `customImage.fileName`) que el bloque de sanitización de la
rama de seguridad —escrito antes de que esos campos existieran— no cubría. Un
merge textualmente limpio **no** detecta esto. Corrección aplicada en el route:
se sanean explícitamente `addons`, `backgroundPreset` y `customImage.fileName`
con `sanitizeText`, restaurando el principio "sanear todo texto de usuario antes
de persistir". Impacto real previo: **bajo** (no hay `dangerouslySetInnerHTML`
en el ecommerce y React escapa en render), pero se cierra por defensa en
profundidad y para mantener el informe fiel al código.

Con esto, **ni se perdieron cambios de etiquetas al traer seguridad, ni se
perdió seguridad al traer etiquetas.**
