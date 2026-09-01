# Auditoría de Seguridad WHITE-BOX — MatrixLab Ecommerce

| | |
|---|---|
| **Fecha** | 2026-08-31 |
| **Alcance** | Repositorio `xBlackDroid/MatrixLab-Ecommerce` completo (código, configuración, historial Git, migraciones SQL) + sitio productivo `https://www.matrixlabintelligence.com` |
| **Tipo** | Caja blanca defensiva. Revisión de código + build y ejecución reales en local + escaneo de historial Git + auditoría de dependencias |
| **Base auditada** | `5345334`, rama `claude/matrixlab-security-audit-f5090y` · 88 commits · 19 ramas remotas · 2026-06-11 → 2026-08-31 |
| **Restricciones respetadas** | Sin DoS/DDoS, sin fuerza bruta real, sin compras reales, sin tocar datos productivos, sin usar credenciales contra servicios externos. Ninguna prueba invasiva salió de este contenedor |
| **Auditoría previa** | `docs/SECURITY_PRODUCTION_AUDIT.md` (2026-07-08). Este informe **no la repite**: verifica sus correcciones y busca lo que quedó fuera |

---

## 1. Resumen ejecutivo

MatrixLab llega a esta auditoría con una arquitectura de seguridad **sólida y
poco común en una tienda de este tamaño**: el precio se recalcula siempre en
servidor, el navegador nunca habla directo con Postgres, RLS está en
*deny-by-default*, las mutaciones del panel exigen CSRF ligado a la sesión
firmada, y las subidas se validan por *magic bytes* con SVG prohibido de raíz.
El escaneo del historial completo —88 commits, 19 ramas— **no encontró un solo
secreto**, y el bundle que llega al navegador **no contiene ninguna variable
sensible**: la única `NEXT_PUBLIC_` que sobrevive a la compilación es el número
de WhatsApp.

Dicho eso, la auditoría encontró **cuatro problemas de severidad alta** que la
revisión anterior no cubrió, y todos comparten una raíz: *controles que existen
pero no funcionan en el entorno donde se ejecutan*.

1. **El freno de fuerza bruta del panel admin no frenaba nada.** Dos fallos se
   combinan: el contador vive en memoria del proceso (en Vercel cada invocación
   puede ser una instancia nueva con el contador en cero) y su clave se tomaba
   del primer elemento de `x-forwarded-for`, que **lo escribe el atacante**.
   Cambiando una cabecera en cada petición, cada intento caía en un bucket
   distinto. Detrás de ese único freno hay una sola contraseña compartida, sin
   segundo factor, que abre todos los pedidos y datos de clientes.

2. **El webhook marcaba pedidos como pagados sin comprobar cuánto se pagó.**
   Se verificaba la firma y se reconsultaba el pago al proveedor —bien—, pero
   se descartaban `transaction_amount`, `currency_id` y `live_mode`. Cualquier
   pago aprobado cuyo `external_reference` fuera el UUID de un pedido lo
   liberaba a producción y descontaba inventario, por el importe que fuera.

3. **`sharp@0.34.5` arrastra CVEs de libvips y es alcanzable sin autenticarse**
   desde `/api/uploads/design-assets`. Es la dependencia con peor relación
   entre gravedad y facilidad de alcance de todo el proyecto.

4. **No existe aviso de privacidad ni consentimiento en ningún punto de
   recolección**, y el Laboratorio de Etiquetas Escolares recoge **nombre y
   apellidos de menores de edad**. Es el hallazgo con mayor riesgo regulatorio
   bajo la LFPDPPP.

Los tres primeros están **corregidos y verificados en esta rama** (más nueve
hallazgos medios y bajos). El cuarto requiere texto legal del propietario.

### Conteo

| Severidad | Confirmados | Corregidos aquí | Pendientes del propietario |
|---|---|---|---|
| CRITICAL | 0 | — | — |
| HIGH | 4 | 2 | 2 (actualizar dependencias · aviso de privacidad) |
| MEDIUM | 6 | 5 | 1 (sobreventa: decisión de negocio) |
| LOW | 4 | 3 | 1 |
| INFO | 4 | — | — |

### Veredicto

**El sitio no está comprometido y no se detectó ninguna vía de fraude de pago
explotable hoy sin credenciales.** Pero el panel admin era forzable por fuerza
bruta y la confirmación de pagos carecía del control de integridad más básico.
Con los parches de esta rama aplicados y la migración `0006` ejecutada, ambas
clases desaparecen. Quedan dos tareas que sólo el propietario puede cerrar:
actualizar `sharp`/`next` y publicar el aviso de privacidad.

---

## 2. FASE 1 — Inventario de arquitectura

### 2.1 Stack real (versiones del lockfile, no del `package.json`)

| Componente | Versión | Nota |
|---|---|---|
| Next.js | **15.5.20** | App Router, sin Server Actions |
| React / React-DOM | 19.2.7 | |
| Node.js | 22.x (runtime local) | Todas las rutas declaran `runtime = "nodejs"`; **cero rutas Edge** salvo el middleware nuevo |
| Package manager | npm (`package-lock.json` v3) | 78 deps prod · 344 dev · 454 total |
| Supabase JS | 2.108.1 | |
| Mercado Pago SDK | 3.1.0 | Checkout Pro por redirección |
| sharp | **0.34.5** | Único paquete con `postinstall` junto a `unrs-resolver` |
| Zod | 4.4.3 | `.strict()` en todos los esquemas de entrada |
| Konva / react-konva | 10.3.0 / 19.2.5 | Diseñadores, sólo cliente (`dynamic import`) |
| Hosting | Vercel | Sin `vercel.json`; sin crons; sin Edge Functions |

### 2.2 Mapa de flujo

```
                          ┌──────────────────────────────────────┐
                          │             NAVEGADOR                │
                          │  cookies: ml_session (httpOnly)      │
                          │           ml_admin  (httpOnly, HMAC) │
                          │  storage local: NINGUNO              │
                          └───────────────┬──────────────────────┘
                                          │ https
                          ┌───────────────▼──────────────────────┐
                          │      VERCEL EDGE → middleware.ts     │
                          │      CSP por ruta (nonce | compat)   │
                          └───────────────┬──────────────────────┘
                                          │
   ┌──────────────────────────────────────▼──────────────────────────────────┐
   │                      NEXT.JS 15 · App Router (nodejs)                   │
   │                                                                          │
   │  PÚBLICO                     LABORATORIO                 ADMIN           │
   │  /                           /tienda/disenador/*         /admin/*        │
   │  /tienda                     /tienda/disenador/            (requireAdmin │
   │  /tienda/categoria/[handle]     etiquetas-escolares         Page en cada │
   │  /tienda/producto/[handle]                                  page.tsx)    │
   │  /tienda/carrito                                                          │
   │  /tienda/checkout(+3 result)                                              │
   │                                                                          │
   │  ROUTE HANDLERS (17)  ── Zod .strict() ── rate limit ── sesión/CSRF      │
   │   /api/cart · /api/cart/items[/id]                                       │
   │   /api/designs[/id] · /api/uploads/design-assets                         │
   │   /api/checkout/mercadopago                                              │
   │   /api/webhooks/mercadopago                                              │
   │   /api/admin/{login,logout,orders,products,products/variants,            │
   │               categories,inventory,designs,uploads}                      │
   └───────┬─────────────────────────────────────────────┬────────────────────┘
           │ service_role (salta RLS)                    │ Access Token
           │ anon key (sólo catálogo, con RLS)           │
   ┌───────▼──────────────────────────────┐   ┌──────────▼─────────────────────┐
   │            SUPABASE                  │   │        MERCADO PAGO            │
   │                                      │   │                                │
   │ Postgres (13 tablas + 1 nueva)       │   │  Preference.create  ──────►    │
   │   RLS ON en todas                    │   │    external_reference=orderId  │
   │   anon: SELECT sólo catálogo visible │   │    notification_url=/api/...   │
   │   resto: deny-by-default             │   │                                │
   │                                      │   │  ◄────── webhook x-signature   │
   │ Funciones SECURITY DEFINER           │   │  Payment.get (server-to-server)│
   │   process_paid_order                 │   │                                │
   │   admin_login_* (nuevas, 0006)       │   │  Redirección del comprador ►   │
   │                                      │   │    /tienda/checkout/{success,  │
   │ Storage                              │   │      failure,pending}          │
   │   design-assets   PRIVADO            │   └────────────────────────────────┘
   │   design-previews PRIVADO            │
   │   product-images  PÚBLICO (lectura)  │        ┌──────────────────┐
   └──────────────────────────────────────┘        │  wa.me (WhatsApp)│
                                                   │  Google Fonts    │
   FLUJO DEL DINERO (el crítico):                  └──────────────────┘
   carrito → POST /api/checkout/mercadopago
           → createOrderFromCart()  ← precios RECALCULADOS desde products/variants
           → orders(status=pendiente_pago) + order_items
           → Preference.create(items con unit_price del servidor)
           → { redirectUrl } al navegador · NADA más
   ...
   MP → POST /api/webhooks/mercadopago
      → verifica x-signature (HMAC + frescura del ts)
      → Payment.get(id) server-to-server
      → NUEVO: monto ≥ total ∧ moneda MXN ∧ live_mode
      → payment_events (event_id único = idempotencia)
      → RPC process_paid_order() ── transaccional, con lock de fila
           marca pagado · descuenta inventario · libera diseños · cierra carrito
```

### 2.3 Superficie de entrada (FASE 8)

`AUTH`: `SES` = cookie de sesión de tienda · `ADM` = sesión admin firmada ·
`CSRF` = además token `x-ml-csrf` · `FIRMA` = HMAC de Mercado Pago ·
`—` = anónimo.

| # | Método | Ruta | Auth | Entrada validada | DB | Externo | Riesgo |
|---|---|---|---|---|---|---|---|
| 1 | GET | `/api/cart` | SES | — | service_role | — | Bajo |
| 2 | POST | `/api/cart` | SES (crea) | — | service_role | — | Bajo |
| 3 | POST | `/api/cart/items` | SES (crea) | `CartAddItemSchema` | service_role | — | **Precio/cantidad** ✅ |
| 4 | PATCH | `/api/cart/items/[id]` | SES | `UuidSchema` + `CartUpdateItemSchema` | service_role | — | IDOR ✅ mitigado |
| 5 | DELETE | `/api/cart/items/[id]` | SES | `UuidSchema` | service_role | — | IDOR ✅ mitigado |
| 6 | POST | `/api/checkout/mercadopago` | SES | `CheckoutSchema` | service_role | **MP Preference** | **P0 fraude** ✅ |
| 7 | POST | `/api/webhooks/mercadopago` | FIRMA | `WebhookBodySchema` | service_role + RPC | **MP Payment.get** | **P0 fraude** ⚠️→✅ |
| 8 | POST | `/api/designs` | SES (crea) | `DesignerCreateSchema` | service_role | — | Cuota ⚠️→✅ |
| 9 | GET | `/api/designs/[id]` | SES | `UuidSchema` | service_role | Storage (firma) | IDOR ✅ mitigado |
| 10 | PATCH | `/api/designs/[id]` | SES | `DesignerSaveSchema` \| `DesignSaveV2Schema` | service_role | Storage | Mass-assign ✅ |
| 11 | POST | `/api/uploads/design-assets` | SES | `UploadMetaSchema` + sharp | service_role | Storage | **Upload** ⚠️→✅ |
| 12 | POST | `/api/admin/login` | — | `AdminLoginSchema` | service_role | — | **Fuerza bruta** ⚠️→✅ |
| 13 | POST | `/api/admin/logout` | ADM | — | service_role | — | Bajo |
| 14 | GET/PATCH | `/api/admin/orders` | ADM / ADM+CSRF | `AdminOrder*Schema` | service_role | — | **Datos personales** |
| 15 | GET/POST/PATCH | `/api/admin/products` | ADM / ADM+CSRF | `AdminProduct*Schema` | service_role | — | Precios |
| 16 | POST/DELETE | `/api/admin/products/variants` | ADM+CSRF | `AdminVariantSchema` | service_role | — | Precios/stock |
| 17 | GET/POST/PATCH | `/api/admin/categories` | ADM / ADM+CSRF | `AdminCategory*Schema` | service_role | — | Bajo |
| 18 | GET/PATCH | `/api/admin/inventory` | ADM / ADM+CSRF | `InventoryAdjustSchema` | service_role | — | Inventario |
| 19 | PATCH | `/api/admin/designs` | ADM+CSRF | `AdminDesignUpdateSchema` | service_role | — | Bajo |
| 20 | POST | `/api/admin/uploads` | ADM+CSRF | sharp + re-encode | service_role | Storage público | Upload ✅ |

**Comprobado y descartado en toda la superficie:** SQL injection (cero SQL
dinámico; todo es PostgREST parametrizado — `.eq()`, `.in()`, sin `.or()` con
input de usuario), inyección de comandos (no hay `exec`/`spawn` en runtime),
path traversal (los nombres de archivo los genera el servidor con `nanoid`; el
único `readdirSync` recibe handles restringidos a `^[a-z0-9-]+$` y devuelve un
booleano), SSRF (ninguna ruta acepta una URL del cliente para pedirla),
deserialización insegura (sólo `JSON.parse` con límite de 256 KB),
prototype pollution (Zod `.strict()` descarta claves extra antes de cualquier
spread), open redirect (no hay redirección con destino del cliente),
mass assignment (todos los `.strict()`).

---

## 3. FASE 2 — Escaneo de secretos en TODO el historial

**Resultado: cero secretos. Ni actuales ni borrados.**

### Método (reproducible)

```bash
# 1. Traer TODAS las ramas (el clon inicial sólo tenía main)
git fetch origin '+refs/heads/*:refs/remotes/origin/*'     # → 19 ramas, 88 commits

# 2. ¿Se commiteó alguna vez un archivo de credenciales?
git log --all --pretty=format: --name-only --diff-filter=A | sort -u \
  | grep -Ei '\.env|secret|credential|\.pem|\.key$|token|passw|vercel|backup|\.zip|\.gz'

# 3. Patrones de secreto sobre el contenido de los 88 commits
git rev-list --all | xargs -P4 -n20 git grep -I -n -E \
 'APP_USR-[A-Za-z0-9._-]{10,}|TEST-[0-9]{8,}|sb_secret_|sbp_[a-f0-9]{40}|eyJhbGciOiJIUzI1NiIs|
  BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}|xox[baprs]-|ghp_[A-Za-z0-9]{30,}|github_pat_|
  postgres(ql)?://[^ ]*:[^ @]{6,}@|AIza[0-9A-Za-z_-]{30,}|sk_live_|whsec_|SG\.[A-Za-z0-9_-]{20,}'

# 4. Asignaciones literales a nombres de variable sensibles
git rev-list --all | xargs -P4 -n20 git grep -I -n -E \
 '(ACCESS_TOKEN|SERVICE_ROLE_KEY|SECRET|PASSWORD|API_KEY|ANON_KEY|WEBHOOK_SECRET|DATABASE_URL|VERCEL_TOKEN)[A-Z_]*\s*[:=]\s*["'"'"'`][^"'"'"'`${][^"'"'"'`]{7,}'

# 5. Objetos colgantes / reflog / stash / tags
git fsck --lost-found --dangling ; git reflog --all ; git stash list ; git ls-remote --tags origin
```

### Hallazgos

| Comprobación | Resultado |
|---|---|
| `.env`, `.env.local`, `.env.production`, `.vercel/` en el historial | **Nunca commiteados.** El único es `.env.example`, sin valores |
| Patrones de token (MP, Supabase, AWS, GitHub, Stripe, JWT, claves privadas) | **0 coincidencias** en 88 commits |
| Asignaciones literales a nombres sensibles | 1 sola: `scripts/qa/mercadopago-webhook.test.ts:18` → `const SECRET = "test…"`. Es una **constante de prueba** del QA de firma, no una credencial |
| Objetos colgantes / commits huérfanos | Ninguno (`git fsck` limpio) |
| Stash / tags | Ninguno |
| Backups, `.sql` con datos, `.zip`, `.tar.gz`, logs | Ninguno. Los `.sql` son migraciones y seeds de catálogo, sin datos de clientes |
| PII embebida en el código | Sólo `src/lib/whatsapp.ts:7` → `FALLBACK_NUMBER = "5210000000000"`, un placeholder |

`.gitignore` cubre correctamente `.env`, `.env.*` (con `!.env.example`),
`.vercel`, `*.pem`, `/.uploads` y los logs de depuración.

> **Nota sobre gitleaks / trufflehog / detect-secrets:** no están instalados en
> este entorno y la política de egress de la sesión impide descargarlos. El
> escaneo se hizo con las expresiones de arriba, que cubren las reglas de alta
> señal de esas herramientas. Se recomienda además activar **GitHub Secret
> Scanning + Push Protection** en el repositorio (gratuito en repos privados con
> GitHub Advanced Security, o en público sin coste), que es un control continuo
> y no una foto puntual.

---

## 4. FASE 3 y 14 — Qué llega realmente al navegador

Estas comprobaciones se hicieron **sobre un `next build` real ejecutado en este
contenedor**, no leyendo el código.

| Comprobación | Comando | Resultado |
|---|---|---|
| Source maps del navegador | `find .next/static -name "*.map"` | **0 archivos** |
| Referencias `sourceMappingURL` en chunks | `grep -rl sourceMappingURL .next/static/chunks` | **0 archivos** |
| Nombres de variables secretas en el bundle | `grep -rlE "SERVICE_ROLE\|MERCADOPAGO_ACCESS_TOKEN\|ADMIN_SESSION_SECRET\|ADMIN_ACCESS_PASSWORD\|MERCADOPAGO_WEBHOOK_SECRET" .next/static` | **0 archivos** |
| Variables `NEXT_PUBLIC_` que sobreviven a la compilación | `grep -rhoE "NEXT_PUBLIC_[A-Z_]+" .next/static \| sort -u` | **Sólo `NEXT_PUBLIC_WHATSAPP_NUMBER`** |

Es un resultado mejor que el esperado: **ni siquiera la anon key de Supabase
llega al navegador**, porque el cliente nunca habla directo con Supabase — todo
pasa por route handlers. La `anon key` y la `publishable key` no serían una
vulnerabilidad aunque fueran visibles (están diseñadas para serlo y RLS las
acota), pero aquí directamente no salen.

**Por qué no pueden filtrarse:** `src/lib/security/env.ts` abre con
`import "server-only"`, lo que **rompe el build** si alguien lo importa desde un
componente cliente. Se verificó además que ningún componente con `"use client"`
importa como valor ningún módulo de `lib/db`, `lib/security`, `lib/payments` o
`lib/store` — las 20 coincidencias encontradas son `import type`, que
desaparece al compilar. Esa invariante ahora está cubierta por
`scripts/qa/security-contracts.test.ts`.

**Registro y mensajes de error:** sólo 4 llamadas a `console.*` en todo `src/`,
ninguna con datos personales ni secretos (registran handles de producto y
banderas booleanas). Los errores devueltos al cliente son genéricos: el
`catch` de `createCheckoutPreference` descarta deliberadamente el error del SDK
porque puede contener cabeceras con el token.

---

## 5. FASE 4 — Supabase

### 5.1 Base de datos: RLS tabla por tabla

Estado según `supabase/migrations/0002_rls.sql` (verificado línea a línea):

| Tabla | RLS | `anon` / `authenticated` | Policies |
|---|---|---|---|
| `categories` | ✅ ON | SELECT si `status='activa'` · INSERT/UPDATE/DELETE **revocados** | 1 (SELECT) |
| `products` | ✅ ON | SELECT si `status<>'oculto'` · escritura **revocada** | 1 (SELECT) |
| `product_variants` | ✅ ON | SELECT si variante y producto visibles · escritura **revocada** | 1 (SELECT) |
| `carts` | ✅ ON | `REVOKE ALL` | **0 → deny-by-default** |
| `cart_items` | ✅ ON | `REVOKE ALL` | **0** |
| `orders` | ✅ ON | `REVOKE ALL` | **0** |
| `order_items` | ✅ ON | `REVOKE ALL` | **0** |
| `design_projects` | ✅ ON | `REVOKE ALL` | **0** |
| `uploaded_assets` | ✅ ON | `REVOKE ALL` | **0** |
| `payment_events` | ✅ ON | `REVOKE ALL` | **0** |
| `inventory_movements` | ✅ ON | `REVOKE ALL` | **0** |
| `admin_sessions` | ✅ ON | `REVOKE ALL` | **0** |
| `audit_logs` | ✅ ON | `REVOKE ALL` | **0** |
| `admin_login_attempts` *(nueva, 0006)* | ✅ ON | `REVOKE ALL` | **0** |

**No hay ninguna policy con `using (true)`.** No hay INSERT/UPDATE/DELETE
anónimo en ninguna tabla. Las tablas con datos personales (`orders`,
`design_projects`, `uploaded_assets`) son inaccesibles con la anon key: aunque
alguien la extrajera, no obtiene un solo pedido.

La propiedad por cliente **no** se expresa en RLS sino en la aplicación,
porque el cliente no es un usuario de Supabase Auth — es una cookie httpOnly.
Se verificó que **todo** acceso a un recurso de cliente filtra por `session_id`:

- `getActiveCart` / `getOrCreateCart` → `.eq("session_id", sessionId)`
- `findOwnedItem` (carrito) → `.eq("cart_id", cart.id)` sobre el carrito de la sesión
- `getOrderForSession` → `.eq("session_id", sessionId)`
- `findOwnedDesign` → `.eq("session_id", sessionId)`
- subida de archivos → el diseño debe ser de la sesión antes de aceptar nada

**Sin IDOR/BOLA.** Se probó específicamente el camino que más suele fallar:
`/tienda/checkout/success?orderId=<uuid ajeno>` → `OrderSummaryCard` compara
`session_id` en servidor y devuelve `null`. No se filtra ni el número de pedido.

> ⚠️ **Límite de esta verificación, importante:** esto confirma que las
> migraciones **del repositorio** son correctas. No pude comprobar que estén
> **aplicadas** en el proyecto Supabase productivo (no tengo ni debo tener sus
> credenciales). Ejecuta esto en el SQL Editor de producción y confirma que el
> resultado coincide con la tabla de arriba:
>
> ```sql
> -- 1. ¿RLS realmente activo en todas?
> select relname, relrowsecurity
>   from pg_class c join pg_namespace n on n.oid = c.relnamespace
>  where n.nspname = 'public' and c.relkind = 'r'
>  order by relrowsecurity, relname;   -- ninguna debe salir con false
>
> -- 2. ¿Alguna policy permisiva de más?
> select schemaname, tablename, policyname, roles, cmd, qual
>   from pg_policies where schemaname = 'public' order by tablename;
>   -- esperado: SOLO 3 filas (categories, products, product_variants), todas SELECT
>
> -- 3. ¿Privilegios directos que salten RLS?
> select table_name, grantee, privilege_type
>   from information_schema.role_table_grants
>  where table_schema = 'public' and grantee in ('anon','authenticated')
>  order by table_name;   -- esperado: sólo SELECT en las 3 tablas de catálogo
>
> -- 4. Funciones: SECURITY DEFINER y search_path
> select p.proname, p.prosecdef, p.proconfig
>   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
>  where n.nspname = 'public';   -- toda DEFINER debe traer search_path en proconfig
> ```

### 5.2 Funciones / RPC

| Función | SECURITY | `search_path` | Ejecutable por | SQL dinámico |
|---|---|---|---|---|
| `process_paid_order(uuid, text)` | **DEFINER** | ✅ `set search_path = public` | **sólo `service_role`** (revocado a `public`, `anon`, `authenticated`) | No |
| `set_updated_at()` | INVOKER | ⚠️ mutable → ✅ **corregido en 0006** | trigger | No |
| `admin_login_lock_state(text)` *(0006)* | DEFINER | ✅ | sólo `service_role` | No |
| `register_admin_login_failure(...)` *(0006)* | DEFINER | ✅ | sólo `service_role` | No |
| `clear_admin_login_attempts(text)` *(0006)* | DEFINER | ✅ | sólo `service_role` | No |

**Cero SQL dinámico, cero `EXECUTE`, cero concatenación de cadenas** en las
funciones. `process_paid_order` está bien construida: `select … for update`
bloquea la fila del pedido, y el corte por `paid_at is not null` la hace
idempotente aunque Mercado Pago entregue el mismo evento cien veces.

### 5.3 Storage

| Bucket | Público | Límite | MIME permitidos | Policies `anon` |
|---|---|---|---|---|
| `design-assets` | **NO** | 10 MB | png/jpeg/webp | **ninguna** (deny-by-default) |
| `design-previews` | **NO** | 5 MB | png/jpeg/webp | **ninguna** |
| `product-images` | SÍ (sólo lectura) | 5 MB | png/jpeg/webp | 1 SELECT |

Los diseños de clientes **no son enumerables ni legibles** sin pasar por el
backend: no hay policy de SELECT en los buckets privados, así que ni listar ni
descargar es posible con la anon key. Las rutas incluyen
`sha256(sessionId)[0:16]/<designId>/<nanoid>.<ext>` — impredecibles y sin
colisiones; `upsert: false` evita sobrescritura; el nombre original del cliente
sólo vive como metadata, nunca como ruta. **No hay path traversal, ni
enumeración, ni sobrescritura, ni exposición pública de diseños de clientes.**

El único bucket público (`product-images`) contiene sólo imágenes de catálogo
subidas por el admin, **re-codificadas a WebP con sharp** (lo que destruye
cualquier payload y metadata EXIF).

---

## 6. FASE 6 — Mercado Pago (P0)

### 6.1 Dónde viven las credenciales

| Credencial | Ubicación | ¿Llega al navegador? |
|---|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | `src/lib/security/env.ts:49`, consumido sólo en `src/lib/payments/mercadopago.ts` (`server-only`) | **No** (verificado en el bundle) |
| `MERCADOPAGO_WEBHOOK_SECRET` | `env.ts:50` → `verifyWebhookSignature` | **No** |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Declarada en `.env.example`, **no se usa en ningún archivo** | No (ni siquiera se compila) |
| App ID | No se usa | — |

### 6.2 Manipulación de precio — **NO explotable** ✅

Se recorrió el camino completo del dinero. **El cliente no puede influir en el
importe por ninguna vía:**

- `CartAddItemSchema` es `.strict()` y acepta exactamente
  `{productId, variantId?, quantity, designProjectId?}`. Cualquier `price`,
  `unitPrice`, `total` o `discount` **rompe el parseo** (probado en el QA nuevo).
- `CheckoutSchema` es `.strict()` y no tiene ningún campo monetario.
- `resolveUnitPrice()` (`src/lib/store/pricing.ts:13`) lee `variant.price ??
  product.base_price` **desde la base**, y clampea negativos a 0.
- `createOrderFromCart()` recalcula precio y disponibilidad de **cada línea**
  justo antes de crear el pedido; `unit_price_snapshot` del carrito es sólo
  auditoría y nunca se cobra.
- `createCheckoutPreference()` construye los `items` de Mercado Pago con
  `item.unit_price` **de `order_items`**, escrito por el servidor.
- La respuesta al navegador es `{ ok, redirectUrl, orderId }` y nada más.

Simulaciones (todas rebotadas, cubiertas por `security-contracts.test.ts`):

| Intento | Resultado | Barrera |
|---|---|---|
| `price: 1` / `unitPrice: 0` / `total: 0` / `discount: 100` | 400 | Zod `.strict()` |
| `quantity: 0` / `-5` / `1.5` / `1000000` / `"3"` / `NaN` / `Infinity` | 400 | Zod + `checkAvailability` + CHECK en DB |
| `productId` inexistente / `' OR 1=1 --` / `../../etc/passwd` | 400 / 409 | `z.uuid()` |
| Variante de otro producto | 409 `VARIANT_NOT_FOUND` | `.eq("product_id", productId)` |
| Producto oculto | 409 `PRODUCT_NOT_FOUND` | `status === "oculto"` |
| `shipping` manipulado | 400 | `.strict()`; el envío se calcula en `computeTotals` (hoy 0) |

### 6.3 Confirmación de pago — **correcta** ✅

Las páginas `/tienda/checkout/{success,failure,pending}` **no escriben nada**:
sólo leen `orderId` de la query para mostrar un resumen si el pedido es de la
sesión. `PAID` se establece **exclusivamente** desde el webhook, tras
`Payment.get()` server-to-server. No hay `localStorage`, ni estado de frontend,
ni parámetro de la redirección que pueda marcar un pedido pagado.

### 6.4 Webhook — auditoría de los 11 controles

| Control | Antes | Ahora |
|---|---|---|
| Validación `x-signature` (HMAC) | ✅ | ✅ |
| Manifest correcto (omite `request-id` ausente) | ✅ | ✅ |
| Comparación en tiempo constante | ✅ `timingSafeEqual` | ✅ |
| Secreto sólo en servidor | ✅ | ✅ |
| **Frescura del `ts` (anti-replay)** | ❌ **ausente** | ✅ ventana de 15 min |
| **`live_mode`** | ❌ leído pero **nunca comprobado** | ✅ exigido en prod y con credencial real |
| Tipo de evento | ✅ whitelist `topic.includes("payment")` | ✅ |
| Payment ID | ✅ `^\d{1,32}$` + reconsulta a MP | ✅ |
| **Monto (`transaction_amount`)** | ❌ **descartado** | ✅ debe cubrir el total |
| **Moneda (`currency_id`)** | ❌ **descartada** | ✅ debe ser MXN |
| `external_reference` = orderId | ✅ `z.uuid()` | ✅ |
| Estado → whitelist | ✅ `mapPaymentStatus` | ✅ |
| **Idempotencia** | ✅ `payment_events.event_id` único + `processed_at` + RPC con lock | ✅ |

**Idempotencia verificada por lectura del código:** el mismo webhook 100 veces
produce 1 pedido pagado, 1 descuento de inventario y 1 transición de estado.
El `event_id` es `mp:payment:<id>:<status>`, único en la base; si ya trae
`processed_at`, se responde 200 sin repetir efectos; si quedó registrado pero
sin aplicar (una entrega anterior falló), se reintenta — y los efectos son
idempotentes porque `process_paid_order` corta en `paid_at is not null` bajo
`for update`. **Éste es un diseño correcto y poco habitual; se mantiene intacto.**

---

## 7. FASE 5 — Subida de archivos

| Control | Estado |
|---|---|
| Extensiones | No se usan: irrelevantes |
| MIME del cliente | **Ignorado** ✅ |
| Magic bytes | ✅ `sharp().metadata()` decide el formato real |
| Formatos permitidos | PNG, JPEG, WEBP. **SVG imposible**: no está en `FORMAT_TO_MIME`, así que `detected` queda `undefined` → 415 |
| Tamaño | ✅ `UPLOAD_MAX_MB` (10 por defecto, tope duro 50) + límite del bucket |
| Dimensiones | ✅ 100–8000 px por lado |
| **Bomba de descompresión** | ⚠️→✅ `limitInputPixels` + `failOn: "warning"` añadidos |
| Nombre de archivo | ✅ generado en servidor (`nanoid(14)`); el original sólo como metadata saneada |
| Ruta de storage | ✅ `hash(sesión)/designId/nanoid.ext`, no adivinable |
| Sobrescritura | ✅ `upsert: false` |
| Permisos | ✅ bucket privado sin policies; sólo URLs firmadas de 1 h |
| EXIF | ⚠️ el original **conserva** metadata (la preview no: se re-codifica a WebP) |
| **Content-sniffing / políglota** | ⚠️→✅ descarga forzada en los enlaces del panel |
| **Cuota por sesión** | ❌→✅ 60 diseños/sesión, 15 archivos/diseño, 150/sesión |

**Sobre re-codificar el original.** El ideal que pediste
(DECODE → VALIDATE → RE-ENCODE → NOMBRE ALEATORIO → STORE) se cumple en 4 de 5
pasos; el original **no** se re-codifica, y eso es deliberado: es el arte que se
va a imprimir y recomprimirlo degrada el resultado del negocio. El riesgo real
que quedaba abierto era que un archivo políglota (imagen válida *y* documento
válido a la vez) se renderizara como HTML al abrirlo desde el panel. Se cerró
por el otro extremo: los enlaces del panel ahora se firman con
`Content-Disposition: attachment`, así que el navegador **guarda** el archivo en
vez de interpretarlo. El canvas del diseñador conserva la URL en línea porque
ahí el navegador decodifica como imagen y nunca parsea HTML.
Además, el bucket vive en `*.supabase.co`: aunque algo se renderizara, sería en
un origen distinto al de la tienda, sin acceso a sus cookies.

Si en el futuro se prefiere el re-encode estricto, la conversión sin pérdida
(`png→png`, `webp lossless`, `jpeg quality 100 mozjpeg`) mantiene calidad de
impresión y elimina EXIF y cualquier apéndice.

---

## 8. FASE 7 — Lógica de negocio

| Abuso | Resultado |
|---|---|
| Manipulación de carrito | ❌ No: sólo ids + cantidad |
| Manipulación de precio | ❌ No: recálculo en servidor |
| Descuento inventado / envío gratis | ❌ No: no existen campos de descuento ni de envío en la entrada |
| Cantidad negativa / decimal / gigante | ❌ No: Zod + `checkAvailability` + CHECK en DB |
| Variante de otro producto | ❌ No: `.eq("product_id", …)` |
| Producto oculto | ❌ No: `status === "oculto"` rechazado en carrito y diseñador |
| Compra sin stock | ⚠️ **Sí, por diseño**: `sobre_pedido` lo permite explícitamente (es una decisión de negocio, no un fallo) |
| Diseño re-apuntado a otro producto | ❌ No: `validateProductChange` (corregido en la auditoría previa) |
| Personalización sin costo | ⚠️ **Por diseño**: los add-ons de Etiquetas Escolares no tienen precio en el sistema; se cotizan por WhatsApp. No es una fuga: el sistema nunca cobró por ellos |
| Pedidos duplicados | ⚠️ Un cliente puede generar N pedidos `pendiente_pago`; sólo se cobra el que pague. Ensucia el panel, no el dinero |
| Replay de pago | ❌ No: idempotencia + (ahora) frescura de firma |
| **Race condition de inventario** | ⚠️ **SÍ — ver ML-10** |

### ML-10 · Sobreventa por carrera entre pedidos

**Confirmado por lectura del código.** El inventario **no se reserva** al crear
el pedido (`orders.ts:20-22` lo documenta como decisión) y sólo se descuenta al
confirmarse el pago. `process_paid_order` bloquea la fila **del pedido**, no la
de la variante, y descuenta con:

```sql
update public.product_variants
   set stock = greatest(stock - v_item.quantity, 0)   -- 0001_schema.sql:353
```

`greatest(…, 0)` significa que si dos pedidos por la última unidad se pagan a la
vez, **ambos se marcan pagados** y el stock queda en 0 sin que nada falle: se
vendió dos veces lo que había una vez.

No lo parcheé porque la respuesta correcta es **una decisión de negocio**, no
técnica: para un taller de personalización sobre pedido, sobrevender puede ser
aceptable (se produce más) y bloquear la venta sería peor. Las dos opciones:

- **Aceptarlo** y detectarlo: alerta en el panel cuando `stock = 0` con pedidos
  pagados pendientes de producir.
- **Impedirlo**: cambiar la línea a un `update … where stock >= quantity` y, si
  no afecta filas, no marcar pagado sino dejar el pedido en un estado nuevo
  (`pagado_sin_stock`) para reembolso o contacto. Requiere flujo de reembolso.

---

## 9. FASE 9 — Administración

Rutas encontradas: `/admin`, `/admin/login`, `/admin/pedidos`,
`/admin/productos`, `/admin/categorias`, `/admin/inventario`, `/admin/disenos`.
No existen `/dashboard`, `/internal`, `/debug`, `/test` ni `/dev`.

| Control | Estado |
|---|---|
| Autorización en servidor | ✅ **Las 6 páginas protegidas llaman `requireAdminPage()` como primera línea**; `/admin/login` usa `getAdminFromCookies` para redirigir si ya hay sesión |
| Autorización de las 9 rutas API | ✅ GET → `getAdminFromRequest`; mutaciones → `requireAdminMutation` (sesión **+ CSRF**) |
| Emails de admin hardcodeados | ❌ No existen |
| Comprobación sólo en frontend | ❌ No: la comprobación es server-side y el `csrf` que se pasa al cliente es un token de sesión, no un permiso |
| Rol en `localStorage` | ❌ No hay `localStorage` en todo el proyecto |
| Manipulación de cookie | ❌ No: payload firmado HMAC-SHA256 con `timingSafeEqual`, `v`, `exp` y `sid` validados |
| Manipulación de rol en JWT | N/A: no hay JWT de rol |
| Revocación de sesión | ✅ `admin_sessions` en base; el logout borra la fila |
| Secreto débil | ✅ fail-safe: `< 32` caracteres ⇒ panel bloqueado |
| **Fuerza bruta** | ❌→✅ **ML-01, ver abajo** |
| Segundo factor | ❌ **No existe** — es la debilidad estructural del panel |
| `noindex` en las páginas | ✅ todas |

### ML-01 · Fuerza bruta del panel viable — **CONFIRMADO, CORREGIDO**

Dos defectos que por separado son menores y juntos anulan el control:

**(a) La clave del contador la escribía el atacante.**

```ts
// ANTES — src/lib/security/rate-limit.ts:68
const fwd = request.headers.get("x-forwarded-for");
if (fwd) return fwd.split(",")[0]!.trim().slice(0, 64);   // ← primer elemento
```

`x-forwarded-for` es una lista que **crece por la izquierda con lo que envió el
cliente**. El primer elemento es literalmente texto del atacante. Enviando
`X-Forwarded-For: 1.2.3.<n>` distinto en cada intento, cada petición cae en un
bucket nuevo y el límite de 5 intentos nunca se alcanza.

**(b) El contador vive en memoria del proceso.**

```ts
// src/lib/security/rate-limit.ts:16
const buckets = new Map<string, Bucket>();
```

En Vercel cada invocación puede atenderse en una instancia serverless distinta,
y las instancias se reciclan constantemente. Aunque (a) estuviera arreglado, el
contador se reinicia solo. El propio archivo lo advertía en un comentario
(«PRODUCCIÓN MULTI-INSTANCIA: sustituir por Redis/Upstash»), pero la
advertencia nunca se materializó y el panel quedó dependiendo de ella.

**Impacto:** detrás de ese freno hay **una sola contraseña compartida** (mínimo
técnico: 8 caracteres), sin segundo factor, que da acceso a todos los pedidos
con nombre, teléfono, correo y dirección de todos los clientes, a los diseños
subidos, y a la edición de precios e inventario. **Es la ruta más corta a un
compromiso total del negocio.**

**Corrección aplicada:**
1. `getClientIp` prefiere `x-real-ip` (lo escribe el edge de Vercel, no
   concatenable) y, en su defecto, toma el **último** elemento de
   `x-forwarded-for` — el que añade el proxy más cercano al servidor.
2. Nuevo freno **durable en Postgres** (`admin_login_attempts` + 3 funciones
   `SECURITY DEFINER` atómicas, migración `0006`): 5 fallos por IP en 15 min ⇒
   **30 minutos de bloqueo**, compartido por todas las instancias. El
   `insert … on conflict do update … returning` es atómico, así que las
   peticiones concurrentes —el escenario real del ataque— no se pisan.
3. El bloqueo se comprueba **antes** de tocar la contraseña, para no dar ni la
   señal temporal del compare.
4. Si la base falla, las funciones son no-op: un incidente de infraestructura
   nunca deja al dueño fuera de su panel.

**Lo que sigue siendo responsabilidad del propietario:** poner una frase de
**24+ caracteres** en `ADMIN_ACCESS_PASSWORD`. Un atacante que reparta el
ataque entre miles de IPs sortea cualquier bloqueo por IP; contra eso sólo
protege la entropía de la contraseña. Por debajo de 20 caracteres el servidor
ahora registra `weakPassword: true` en `audit_logs` en cada login correcto (sin
el valor). No subí el mínimo duro de 8 porque eso **bloquearía el panel en
producción** si la contraseña actual es más corta — un fail-safe que se
convierte en denegación de servicio contra el dueño.

---

## 10. FASES 10 y 11 — HTTP y CSP

> **Nota de alcance:** la política de egress de esta sesión **bloquea
> `www.matrixlabintelligence.com`** (`CONNECT` rechazado con 403 por el proxy
> corporativo). No pude hacer ni un `HEAD` pasivo contra producción. Todo lo de
> esta sección se verificó **ejecutando la aplicación**: `next build` +
> `next start` + peticiones reales a `127.0.0.1:3111`. Como no hay `vercel.json`,
> `next.config.ts` + `middleware.ts` son la única fuente de cabeceras, así que
> lo verificado en local es lo que sirve producción. **Confirma con
> `curl -I https://www.matrixlabintelligence.com/` tras desplegar.**

### 10.1 Antes

| Cabecera | Estado previo |
|---|---|
| `Content-Security-Policy` | Presente pero con **`script-src 'self' 'unsafe-inline'`** |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (sin `preload`) |
| `X-Content-Type-Options` | ✅ `nosniff` |
| `X-Frame-Options` / `frame-ancestors` | ✅ `DENY` / `'none'` |
| `Referrer-Policy` | ✅ |
| `Permissions-Policy` | ✅ básica |
| `Cross-Origin-Opener-Policy` | ❌ ausente |
| `Cross-Origin-Resource-Policy` | ❌ ausente |
| `frame-src` | ❌ ausente (heredaba `default-src 'self'`) |
| Cookies | ✅ `httpOnly`, `SameSite=Lax`, `Secure` en producción, sin `domain` (host-only) |
| CORS | ✅ **No hay `Access-Control-Allow-Origin` en ninguna ruta** — las APIs son same-origin puras. Correcto |

### 10.2 El problema real de quitar `unsafe-inline`, y cómo se resolvió

El objetivo era eliminar `'unsafe-inline'` de `script-src` con nonces. Lo
implementé, hice un build real… **y descubrí que tumbaba el landing**:

```
página                    scripts   inline sin nonce   con CSP de nonce
/                            37            25          ← TODOS bloqueados
/tienda                      37            23          ← TODOS bloqueados
/tienda/disenador            31            19          ← TODOS bloqueados
/tienda/carrito              26             0          ✅
```

La causa: Next estampa el nonce **al renderizar en la petición**. Esas tres
páginas se **prerenderizan en el build**, salen del caché con sus scripts en
línea ya escritos y sin nonce, y como `'strict-dynamic'` hace que el navegador
ignore `'self'`, quedarían sin ejecutar un solo script. Aplicar la política
estricta a todo habría dejado la home en blanco.

**Solución: CSP en dos niveles, por ruta** (`src/middleware.ts`):

- **Rutas dinámicas** (panel admin, carrito, checkout, fichas de producto,
  categorías, diseñadores con parámetro, `/api/*`) → **política estricta**:
  `script-src 'self' 'nonce-<aleatorio>' 'strict-dynamic'`, **sin
  `unsafe-inline`**. Es exactamente donde viven la sesión, los datos personales
  y el dinero.
- **Las 3 rutas prerenderizadas** (`/`, `/tienda`, `/tienda/disenador`) →
  política compatible con `'unsafe-inline'`. Son catálogo y marketing: sin
  sesión, sin formularios, sin datos de cliente.

Ese reparto **no queda a la deriva**: `scripts/qa/security-headers.test.ts`
verifica que toda página fuera de la lista estática declare `force-dynamic`. Si
alguien lo quita, el QA falla antes de que la página se quede sin scripts en
producción.

### 10.3 CSP final (FASE 11)

Dominios que la aplicación **realmente** necesita, verificados con
`grep -rhoE 'https?://[a-zA-Z0-9._-]+' src/` → sólo `fonts.googleapis.com`,
`fonts.gstatic.com`, `wa.me` y el propio dominio.

```
default-src 'self';
script-src 'self' 'nonce-<por-petición>' 'strict-dynamic';   ← rutas dinámicas
script-src 'self' 'unsafe-inline';                            ← 3 rutas estáticas
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in;
font-src 'self' data: https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co https://*.supabase.in;
worker-src 'self' blob:;
object-src 'none'; base-uri 'self'; form-action 'self';
frame-src 'none'; frame-ancestors 'none'; manifest-src 'self';
upgrade-insecure-requests
```

Justificación de cada concesión:

- **`style-src 'unsafe-inline'`** — inevitable hoy: Framer Motion y Sonner
  escriben estilos en línea en runtime, y `app/layout.tsx:33` lleva un `<style>`
  dentro de `<noscript>` sin el cual las secciones animadas quedan invisibles sin
  JS. Un nonce no sirve: esos estilos los inyecta el navegador, no el servidor.
- **`data:` y `blob:` en `img-src`** — el lienzo de Konva exporta las previews.
- **Supabase** — URLs firmadas del storage privado e imágenes públicas.
- **Google Fonts** — galería de tipografías de Etiquetas Escolares (54 fuentes).
  Sin ellas, la galería degrada a fuentes del sistema.
- **Mercado Pago NO aparece, y es correcto.** Checkout Pro es una
  **redirección**, no un SDK ni un iframe; una navegación de página completa no
  la restringe la CSP del origen. Añadir sus dominios ampliaría la superficie
  sin habilitar nada.
- **Sin `unsafe-eval` en producción** (sólo en desarrollo, lo exige el HMR).
- **Sin comodines.**

### 10.4 Cabeceras estáticas finales (verificadas en vivo)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
X-Permitted-Cross-Domain-Policies: none
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(),
                    magnetometer=(), gyroscope=(), interest-cohort=()
Content-Security-Policy: <una sola cabecera, por ruta>
```

Se comprobó que sólo se emite **una** cabecera CSP (dos se intersecan y rompen
la página en silencio, que es exactamente por qué la CSP salió de
`next.config.ts`). **`Cross-Origin-Embedder-Policy` se omite deliberadamente**:
`require-corp` rompería la carga de imágenes de Supabase y de Google Fonts.

---

## 11. FASE 12 — Vercel

| Elemento | Hallazgo |
|---|---|
| `vercel.json` | **No existe.** Toda la configuración vive en `next.config.ts` |
| Cron jobs | **Ninguno** |
| Edge Functions | Ninguna antes; ahora sólo el middleware de CSP |
| Runtime de las 17 rutas API | `nodejs` en todas (declarado explícitamente) |
| Source maps en producción | **No se generan** (`productionBrowserSourceMaps` no está activado; verificado: 0 archivos `.map`) |
| `poweredByHeader` | ✅ desactivado |
| Secretos en el bundle | **Ninguno** (verificado) |
| `.vercel/` en el repo | No (y está en `.gitignore`) |

**Pendientes que sólo se pueden comprobar desde el panel de Vercel** (no tengo
—ni debo tener— acceso):

1. **Deployment Protection en Preview.** Sin ella, cada rama abierta despliega
   una copia pública de la tienda. Si un preview apunta a la base de datos de
   producción, es una puerta trasera a los datos reales sin pasar por el dominio
   principal. **Con 19 ramas en el repositorio esto merece revisión inmediata.**
   Vercel → Settings → Deployment Protection → *Standard Protection* o *Vercel
   Authentication* para Preview.
2. **Ámbito de las variables de entorno.** Confirmar que
   `SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_ACCESS_TOKEN`,
   `MERCADOPAGO_WEBHOOK_SECRET`, `ADMIN_ACCESS_PASSWORD` y
   `ADMIN_SESSION_SECRET` **no** están marcadas para *Preview* y *Development*
   con los valores de producción. Lo ideal: credenciales de prueba de Mercado
   Pago y un proyecto Supabase distinto para preview.
3. **`NEXT_PUBLIC_SITE_URL`** debe ser `https://` en producción — si no,
   `isCheckoutConfigured()` apaga el checkout como fail-safe (comportamiento
   correcto, pero deja la tienda sin pagos).
4. **Build logs y runtime logs.** El código no imprime secretos (4
   `console.*` inocuos), pero conviene confirmar que ninguna integración de
   terceros los reenvía a un destino externo.

---

## 12. FASE 13 — Dependencias

`npm audit --package-lock-only`: **6 vulnerabilidades (5 high, 1 moderate,
0 critical)** sobre 454 dependencias.

| Paquete | Instalada | Directa | Sev. | Advisory | Alcanzable en MatrixLab | Riesgo real | Ruptura al actualizar |
|---|---|---|---|---|---|---|---|
| **sharp** | **0.34.5** | Sí | **HIGH** | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) — CVEs heredados de libvips: CVE-2026-33327/33328/35590/35591 | **SÍ, sin autenticarse.** `/api/uploads/design-assets` decodifica el archivo del usuario con `sharp()` antes de cualquier otra cosa | **El más alto del proyecto.** Un archivo manipulado llega al decodificador nativo desde Internet | **Semver-major** (0.34→0.35). La app sólo usa `.metadata()`, `.resize()`, `.webp()` — API estable. 0.35 sube el mínimo de Node a 18.17 (Vercel ya usa 20/22) |
| **next** | **15.5.20** | Sí | **HIGH** | 8 advisories: cache confusion en cuerpos de petición ([GHSA-68g3-v927-f742](https://github.com/advisories/GHSA-68g3-v927-f742), [GHSA-4633-3j49-mh5q](https://github.com/advisories/GHSA-4633-3j49-mh5q)), SSRF en rewrites ([GHSA-p9j2-gv94-2wf4](https://github.com/advisories/GHSA-p9j2-gv94-2wf4)), DoS en Image Optimization con SVG ([GHSA-q8wf-6r8g-63ch](https://github.com/advisories/GHSA-q8wf-6r8g-63ch)), exposición de endpoints de Server Functions ([GHSA-955p-x3mx-jcvp](https://github.com/advisories/GHSA-955p-x3mx-jcvp)), DoS y SSRF en Server Actions | **Parcialmente.** No hay Server Actions ni rewrites, lo que descarta 4 de los 8. La *cache confusion* sí aplica: hay rutas POST con cuerpo | Medio-alto | Parche dentro de 15.x. Bajo riesgo |
| nanoid | 5.1.11 | Sí | HIGH | [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv), [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) — bucle infinito con `size` negativo o cero | **No.** Los 3 usos pasan literales fijos: `nanoid(14)`, `nanoid(8)`, `nanoid(16)` | **Nulo hoy** | Parche menor |
| postcss | 8.5.19 | Transitiva (build) | MODERATE | [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) — lectura de `.map` arbitrarios vía `sourceMappingURL` | **No.** Sólo en build, sobre CSS propio | Nulo | Parche menor |
| js-yaml | 4.2.0 | Transitiva (dev) | HIGH | [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m), [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) — DoS por CPU | **No.** Herramienta de desarrollo, no llega a runtime | Nulo | Parche menor |
| brace-expansion | 1.1.15 / 5.0.6 | Transitiva (dev) | HIGH | [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp), [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg), [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) — DoS por expansión | **No.** Sólo glob en desarrollo | Nulo | Parche menor |

**No actualicé nada**, siguiendo tu indicación de no tocar paquetes a ciegas.
Plan recomendado, en dos pasos separados para poder revertir con precisión:

```bash
# Paso 1 — sin rupturas (nanoid, postcss, js-yaml, brace-expansion, next 15.x)
npm audit fix
npm run type-check && npm run build
npx tsx scripts/qa/security-payments.test.ts
npx tsx scripts/qa/security-contracts.test.ts
npx tsx scripts/qa/security-headers.test.ts

# Paso 2 — sharp, aparte (semver-major; es el que realmente importa)
npm install sharp@^0.35.4
npm run build
# Prueba manual obligatoria: subir un PNG, un JPG y un WEBP en el diseñador;
# confirmar preview y descarga desde /admin/disenos.
```

**Mitigación ya aplicada mientras tanto:** ambos endpoints que llaman a `sharp`
ahora pasan `limitInputPixels` (techo de 64 MP) y `failOn: "warning"`, lo que
cierra la clase de bomba de descompresión y rechaza archivos truncados antes de
que el decodificador nativo trabaje de más. **No sustituye a la actualización.**

**Cadena de suministro:** sólo 2 paquetes declaran scripts de instalación
(`sharp` y `unrs-resolver`, ambos legítimos y de uso extendido). No se detectó
typosquatting: todas las dependencias directas son paquetes conocidos con el
nombre correcto. No hay librerías abandonadas en la ruta de ejecución.

---

## 13. FASE 15 — Registro y privacidad operativa

| Riesgo | Estado |
|---|---|
| Nombre / correo / teléfono / dirección en logs | ✅ **No.** Las 4 llamadas a `console.*` registran handles de producto y booleanos |
| Access Token / JWT / `Authorization` en logs | ✅ No |
| Payload completo de Mercado Pago | ✅ No: `payment_events.raw_event_safe` guarda sólo `{topic, action, live_mode, external_reference}` |
| Tokens de Supabase | ✅ No |
| Archivos de clientes en logs | ✅ No |
| Datos de pago (tarjeta) | ✅ **Nunca tocan el sistema**: Checkout Pro es por redirección; MatrixLab no ve, transmite ni almacena datos de tarjeta. Esto reduce enormemente el alcance PCI |
| Errores del SDK propagados | ✅ Descartados deliberadamente (`catch {}` en `createCheckoutPreference`) porque pueden contener cabeceras con el token |
| `audit_logs` | ✅ Sólo ids, acciones y metadata controlada. La entrada nueva de rechazo de pago registra importes y moneda, **nunca datos del pagador** |
| IP en la nueva tabla de intentos | ✅ Se guarda `sha256("admin-login:" + ip)`, **nunca la IP** |

---

## 14. FASE 16 — Protección de datos (LFPDPPP) · **ML-09**

> Esto es una revisión **técnica** de privacidad, no asesoría legal. Un abogado
> debe redactar y validar los textos.

### 14.1 Data flow map

```
DATO                          SE RECOGE EN                    SE GUARDA EN                        LO RECIBE
─────────────────────────────────────────────────────────────────────────────────────────────────────────────
Nombre completo               /tienda/checkout                orders.customer_name                Supabase, Vercel, Mercado Pago (payer.name)
Correo electrónico            /tienda/checkout (opcional)     orders.customer_email               Supabase, Vercel, Mercado Pago (payer.email)
Teléfono                      /tienda/checkout                orders.customer_phone               Supabase, Vercel
Dirección de envío            (esquema listo, HOY NO SE PIDE) orders.shipping_address (jsonb)     Supabase, Vercel
Notas del pedido              /tienda/checkout                orders.notes                        Supabase, Vercel
─────────────────────────────────────────────────────────────────────────────────────────────────────────────
NOMBRE Y APELLIDOS DE         /tienda/disenador/              design_projects.design_json         Supabase, Vercel
  UN MENOR DE EDAD              etiquetas-escolares             {student:{firstName,lastNames}}
Escuela / temática / notas    idem                            design_json                         Supabase, Vercel
─────────────────────────────────────────────────────────────────────────────────────────────────────────────
Imágenes subidas              todos los diseñadores           Storage design-assets (privado)     Supabase
  (+ EXIF: puede incluir                                      + uploaded_assets (metadata)
   geolocalización)
Previews compuestas           diseñadores                     Storage design-previews (privado)   Supabase
─────────────────────────────────────────────────────────────────────────────────────────────────────────────
Cookie de sesión              toda la tienda                  navegador (httpOnly, 1 AÑO)         —
Hash de sesión                checkout                        metadata de la preferencia MP       Mercado Pago
Hash de IP                    login admin fallido             admin_login_attempts (nuevo)        Supabase
Datos de tarjeta              NUNCA                           —                                   Sólo Mercado Pago
─────────────────────────────────────────────────────────────────────────────────────────────────────────────
Encargados: Supabase (BD + archivos) · Vercel (hosting, logs) · Mercado Pago (pagos)
Transferencia internacional: los tres pueden alojar fuera de México → debe declararse en el aviso
```

### 14.2 Hallazgos técnicos

| Requisito | Estado |
|---|---|
| **Aviso de privacidad en los puntos de recolección** | ❌ **No existe ninguno.** `grep -rin "privacidad\|aviso\|ARCO\|LFPDPPP" src/` no devuelve una sola coincidencia real. Ni en el checkout, ni en el Laboratorio, ni en el pie de página |
| Consentimiento antes de enviar | ❌ `CheckoutForm.tsx` no tiene casilla ni enlace |
| **Datos de menores** | ❌ **Agravante.** Etiquetas Escolares recoge nombre y apellidos de un menor sin aviso ni consentimiento verificable del tutor |
| Mecanismo de derechos ARCO | ❌ No existe (ni correo, ni formulario, ni procedimiento) |
| Plazo de conservación | ❌ No definido. Nada se borra nunca |
| Retención efectiva | ⚠️ Cookie de sesión de **1 año**; carritos, diseños y archivos abandonados se acumulan indefinidamente; no hay purga |
| Minimización | ✅ Bien: sólo se pide lo necesario; el correo es opcional; no se piden datos de tarjeta |
| Seguridad de los datos | ✅ Buena: RLS deny-by-default, storage privado, URLs firmadas de 1 h, TLS forzado |
| Transferencias a terceros | ⚠️ Reales (Supabase, Vercel, Mercado Pago), **no declaradas** |
| Bitácora de accesos | ✅ `audit_logs` |

### 14.3 Qué hacer (mínimo técnico)

1. Publicar `/aviso-de-privacidad` con: identidad y domicilio del responsable,
   datos que se recaban, finalidades, transferencias (Supabase / Vercel /
   Mercado Pago, con mención de tratamiento fuera de México), plazo de
   conservación, y el medio para ejercer derechos ARCO.
2. Enlazarlo **en el punto de recolección**, no sólo en el pie:
   - `CheckoutForm.tsx`, junto al botón de pago.
   - `SchoolLabelsLab.tsx`, en el paso donde se pide el nombre del estudiante,
     con una mención explícita al tratamiento de datos de menores y a la
     autorización del padre/madre/tutor.
3. Definir plazo de conservación y automatizar la purga (una tarea programada
   que borre carritos y diseños en `draft` sin actividad en N días, junto con sus
   archivos en Storage). Hoy no existe ninguna tarea programada en el proyecto.
4. Reducir la cookie de sesión de 1 año a un plazo justificable (30–90 días).
5. Definir el procedimiento operativo de borrado a solicitud (qué se borra en
   `orders`, `design_projects`, `uploaded_assets` y Storage, y qué se conserva por
   obligación fiscal).

---

## 15. FASE 18 — Threat model

| Actor | Objetivo | ¿Puede hoy? | Barrera |
|---|---|---|---|
| Anónimo de Internet | Leer pedidos ajenos | **No** | RLS deny-by-default + filtro por `session_id` |
| | Leer diseños ajenos | **No** | Buckets privados sin policies + rutas con hash de sesión |
| | Obtener secretos del bundle | **No** | Verificado: 0 coincidencias en `.next/static` |
| | Enmarcar el sitio (clickjacking) | **No** | `frame-ancestors 'none'` + XFO |
| Cliente malicioso | Alterar precios | **No** | Recálculo en servidor; Zod `.strict()` |
| | Comprar gratis | **No** | El pedido sólo pasa a `pagado` desde el webhook firmado |
| | Marcar su pedido pagado | **No** | Requiere el webhook secret + firma HMAC + reconsulta a MP |
| | **Pagar de menos y liberar producción** | **Antes SÍ*** → ahora no | Verificación de monto/moneda/live_mode |
| | Consumir el almacenamiento | Antes sí → **acotado** | Cuotas por sesión |
| | Stored XSS vía archivo | **No** | Sin SVG, magic bytes, descarga forzada, origen distinto |
| | Sobrevender la última unidad | **SÍ** (ML-10) | Decisión de negocio pendiente |
| Competidor | Enumerar catálogo oculto | **No** | `status='oculto'` filtrado en RLS y en la app |
| Bot automatizado | **Fuerza bruta del panel** | **Antes SÍ** → ahora no | Bloqueo durable en base + IP no falsificable |
| | Saturar endpoints | Parcial | Rate limit en memoria (mitiga ráfagas, no ataques distribuidos) |
| Atacante con la anon key filtrada | Leer datos de clientes | **No** | RLS: sólo catálogo visible |
| Atacante con la **service_role key** filtrada | **Todo** | Sí — compromiso total | Sólo en servidor; nunca en Git ni en el bundle |
| Atacante con sesión de cliente robada | Ver los pedidos de esa sesión | Sí (por diseño) | Cookie `httpOnly`+`Secure`+`SameSite=Lax` |
| Atacante con token de desarrollador (Vercel/GitHub) | Desplegar código malicioso | Sí | Fuera del código: exige 2FA y revisión de accesos |
| Archivo subido malicioso | Ejecución en el servidor | **No** | Sólo se decodifica como imagen; ahora con techo de píxeles |

\* Ver §6.4 y ML-04: no encontré una cadena de explotación completa (haría falta
influir en el `external_reference` de un pago, lo que exige el Access Token),
pero el control de integridad faltaba y los modos de fallo reales existen
(pago dividido en dos tarjetas, credencial de prueba en producción).

---

## 16. FASE 19 — Matriz de hallazgos

Clasificación: **[C]** confirmado · **[L]** probable · **[H]** endurecimiento.

| ID | Sev | CVSS ≈ | OWASP 2021 | ASVS 5.0 | Archivo:línea | Vulnerabilidad | Explotabilidad | Impacto de negocio | Corrección |
|---|---|---|---|---|---|---|---|---|---|
| **ML-01** | **HIGH** [C] | 8.1 | A07 Auth Failures | V2.2.1, V2.2.4, V7.2.2 | `src/lib/security/rate-limit.ts:68` + `:16` | Clave del rate limit tomada del `x-forwarded-for` del cliente + contador en memoria por instancia ⇒ fuerza bruta del panel sin freno | **Alta.** Sólo hace falta variar una cabecera. Sin herramientas especiales | **Compromiso total**: todos los pedidos con datos personales, diseños, precios e inventario | ✅ **Corregido** (IP no falsificable + bloqueo durable en Postgres) |
| **ML-02** | **HIGH** [C] | 7.5 | A06 Vulnerable Components | V1.14.6, V14.2.1 | `package-lock.json` → `sharp@0.34.5` | CVEs de libvips alcanzables **sin autenticarse** desde el endpoint de subida | Media-alta: requiere un archivo manipulado que llegue al decodificador (llega) | Ejecución/DoS en el runtime que sostiene la tienda | ⚠️ **Mitigado** (`limitInputPixels`, `failOn`). **Requiere `npm i sharp@^0.35.4`** |
| **ML-03** | **HIGH** [C] | 7.5 | A06 | V1.14.6 | `package-lock.json` → `next@15.5.20` | 8 advisories; 4 aplican (cache confusion, DoS de imagen, exposición de endpoints) | Media | Envenenamiento de caché, DoS | ⚠️ **Requiere `npm audit fix`** |
| **ML-04** | **HIGH** [L] | 7.1 | A04 Insecure Design | V13.4.1, V4.2.1 | `src/lib/payments/mercadopago.ts:134` (antes) | El webhook marcaba pagado sin comprobar `transaction_amount`, `currency_id` ni `live_mode` | Baja-media: requiere influir en el `external_reference` de un pago, o un pago parcial/credencial de prueba | **Fraude**: producción liberada e inventario descontado sin cobro completo | ✅ **Corregido** |
| **ML-05** | MEDIUM [C] | 5.3 | A08 Data Integrity | V13.4.2 | `mercadopago.ts:176` (antes) | Sin ventana de frescura del `ts` ⇒ una notificación firmada se reenvía indefinidamente | Baja: exige capturar una notificación válida | Mitigado por idempotencia; ventana de replay abierta | ✅ **Corregido** (15 min) |
| **ML-06** | MEDIUM [C] | 5.4 | A03 Injection (XSS almacenado) | V1.12.2, V5.5.1 | `api/uploads/design-assets/route.ts:150` | El binario original se guarda sin re-codificar; el enlace del panel lo servía **inline** | Baja: exige que un admin abra el archivo | Stored XSS en el origen de Supabase; políglotas persistidos | ✅ **Corregido** (descarga forzada) |
| **ML-07** | MEDIUM [C] | 5.3 | A04 Insecure Design | V11.1.1 | `api/designs/route.ts`, `api/uploads/design-assets/route.ts` | Sin cuota por sesión: el flujo normal permite crear diseños y subir archivos sin techo | Alta (trivial), aunque el rate limit por IP frena el ritmo | Agotamiento de storage y factura de Supabase | ✅ **Corregido** (60/15/150) |
| **ML-08** | MEDIUM [C] | 5.3 | A05 Misconfiguration | V3.4.1, V3.4.5, V50.x | `next.config.ts` (antes) | `script-src 'unsafe-inline'`; sin COOP/CORP/`frame-src`; HSTS sin `preload` | N/A (defensa en profundidad) | Un XSS futuro no encontraría contención | ✅ **Corregido** (CSP con nonce en las rutas sensibles) |
| **ML-09** | MEDIUM [C] | — (regulatorio) | A04 | V8.1.1, V8.3.1 | Toda la app | Sin aviso de privacidad ni consentimiento en ningún punto de recolección; **incluye datos de menores** | N/A | Sanción LFPDPPP; daño reputacional | ❌ **Pendiente** (requiere texto legal) |
| **ML-10** | MEDIUM [C] | 4.3 | A04 Insecure Design | V11.1.4 | `supabase/migrations/0001_schema.sql:353` | `greatest(stock - q, 0)` sin `where stock >= q`: dos pagos simultáneos sobrevenden | Media: exige concurrencia real | Sobreventa, incumplimiento con clientes | ❌ **Decisión de negocio** (§8) |
| **ML-11** | LOW [C] | 3.7 | A05 | V13.4.1 | `mercadopago.ts:158` (antes) | `!isProduction()` permitía webhooks sin firma aunque el despliegue usara credenciales reales | Baja | Staging con cuenta real aceptaba notificaciones sin firmar | ✅ **Corregido** |
| **ML-12** | LOW [C] | 3.1 | A05 | V14.1.1 | `security/env.ts:142` | `assertNoLeakedSecrets()` sólo se invoca en `/api/checkout` | N/A | Un `NEXT_PUBLIC_` mal puesto no se detecta por otras rutas | ❌ Pendiente (§17, P2) |
| **ML-13** | LOW [C] | 2.7 | A05 | V1.3.2 | `0001_schema.sql:10` | `set_updated_at()` con `search_path` mutable (`function_search_path_mutable` de Supabase) | Muy baja (es SECURITY INVOKER) | Resolución de objetos desde un esquema inesperado | ✅ **Corregido** (0006) |
| **ML-14** | LOW [C] | 3.1 | A07 | V3.2.1 | `security/session.ts:72` | El servidor acepta como sesión cualquier id del cliente que cumpla el patrón; no la reemite | Muy baja: 24 bytes de entropía, cookie host-only, `Secure`, `httpOnly` | Fijación de sesión teórica | ❌ Pendiente (§17, P2) |
| ML-15 | INFO | — | — | — | `store/inventory.ts:50` | Productos sin variantes no tienen control de stock | — | Por diseño | Documentado |
| ML-16 | INFO | — | — | — | — | Sin `robots.txt` (las páginas admin ya llevan `noindex`) | — | Nulo | Documentado |
| ML-17 | INFO | — | — | — | `security/session.ts:30` | Cookie de sesión de 1 año; sin purga de carritos/diseños/archivos abandonados | — | Acumulación de datos personales | Ver §14.3 |
| ML-18 | INFO | — | — | — | Vercel | No pude verificar Deployment Protection en Preview (19 ramas) | — | Posible copia pública de la tienda | Ver §11 |

### Verificado y **descartado** como vulnerabilidad

Para que quede constancia de lo que se revisó y salió limpio: secretos en Git
(88 commits, 19 ramas) · secretos en el bundle · source maps en producción ·
manipulación de precio · SQL injection · inyección de comandos · path traversal ·
SSRF · open redirect · prototype pollution · mass assignment · XSS reflejado y
DOM · CSRF en el panel · CORS permisivo · IDOR/BOLA en carrito, pedidos y
diseños · RLS ausente o permisiva · funciones `SECURITY DEFINER` expuestas a
`anon` · enumeración de diseños en Storage · subida de SVG · confirmación de pago
por la URL de retorno · duplicación de efectos por webhook repetido · rol de
admin manipulable desde el cliente.

**La anon key / publishable key de Supabase no se marca como vulnerabilidad**:
está diseñada para ser pública, RLS la acota a catálogo visible, y en este
proyecto ni siquiera llega al navegador.

---

## 17. FASE 20 — Plan de remediación

### P0 — AHORA

| # | Acción | Responsable | Estado |
|---|---|---|---|
| 1 | **Aplicar `supabase/migrations/0007_security_hardening.sql`** en producción. Sin ella el freno de fuerza bruta no existe | Propietario | ⚠️ Requiere ejecución |
| 2 | **Rotar `ADMIN_ACCESS_PASSWORD`** a una frase de 24+ caracteres (`openssl rand -base64 32`) | Propietario | ⚠️ |
| 3 | Desplegar los parches de esta rama (webhook, rate limit, CSP, cuotas, uploads) | Propietario | ✅ Código listo |
| 4 | **`npm install sharp@^0.35.4`** + `npm audit fix` (ML-02, ML-03) | Propietario | ⚠️ |
| 5 | Confirmar en Vercel: **Deployment Protection en Preview** y que los secretos de producción no estén en el scope Preview/Development | Propietario | ⚠️ |
| 6 | Confirmar `MERCADOPAGO_WEBHOOK_SECRET` configurado en producción (sin él, con el nuevo código el webhook rechaza todo y **ningún pago se aplica**) | Propietario | ⚠️ |
| 7 | Ejecutar las 4 consultas SQL de §5.1 en el Supabase productivo y confirmar que RLS está realmente aplicado | Propietario | ⚠️ |

### P1 — Antes del siguiente release

| # | Acción |
|---|---|
| 8 | **Publicar el aviso de privacidad** y enlazarlo en checkout y en Etiquetas Escolares, con mención explícita a datos de menores (ML-09) |
| 9 | Definir y automatizar el plazo de conservación; purga de carritos/diseños/archivos abandonados |
| 10 | Reducir la cookie de sesión de 1 año a 30–90 días (ML-17) |
| 11 | Decidir la política de sobreventa e implementarla (ML-10, §8) |
| 12 | Verificar con `curl -I https://www.matrixlabintelligence.com/` que las cabeceras nuevas llegan en producción (yo no pude: egress bloqueado) |
| 13 | Activar **GitHub Secret Scanning + Push Protection** en el repositorio |
| 14 | Añadir las 3 pruebas de seguridad al CI para que un PR que rompa una invariante no llegue a `main` |

### P2 — Endurecimiento de arquitectura

| # | Acción |
|---|---|
| 15 | Rate limiting distribuido (Upstash Redis) con la misma firma de `checkRateLimit`; el `scripts/install-deps.sh` ya lo contempla comentado |
| 16 | **Segundo factor (TOTP) en el panel admin.** Es la mejora estructural con mayor retorno: hoy todo depende de una contraseña |
| 17 | Reemitir el id de sesión al pasar por el checkout (ML-14) |
| 18 | Invocar `assertNoLeakedSecrets()` en un punto de arranque común, no sólo en checkout (ML-12) |
| 19 | Re-codificar el original con conversión sin pérdida para eliminar EXIF (§7) |
| 20 | Modelo de usuarios admin con roles, en lugar de una contraseña compartida |
| 21 | Alerta operativa cuando `audit_logs` registre `admin.login_failed` de forma sostenida o `payment.rejected_mismatch` |

---

## 18. FASE 23 — Plan de rotación de secretos

**No se encontró ningún secreto en el historial de Git.** La tabla siguiente
recoge rotaciones por motivos **operativos**, no por exposición detectada.

| Secreto | Ubicación | Commit | Exposición detectada | ¿Rotar? | ¿Revocar? | Dependencias al rotar |
|---|---|---|---|---|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | Sólo variables de entorno de Vercel | — | **Ninguna** | Sólo si estuvo fuera de un gestor de secretos (chat, correo, captura) | No | Checkout y webhook dejan de funcionar hasta actualizar la variable |
| `MERCADOPAGO_WEBHOOK_SECRET` | Vercel | — | **Ninguna** | Igual que arriba | No | Debe cambiarse **a la vez** en el panel de MP y en Vercel; entre ambos cambios los webhooks se rechazan |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel | — | **Ninguna** | Sólo si salió de un gestor de secretos | No | Rotarla invalida el cliente de servicio: toda la tienda depende de ella. Desplegar y verificar de inmediato |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | — | Pública por diseño (y ni siquiera llega al navegador) | No | No | — |
| `ADMIN_ACCESS_PASSWORD` | Vercel | — | **Ninguna** | **SÍ, ahora (P0-2)** — no por exposición, sino porque el freno que la protegía no funcionaba y su longitud mínima permitida era baja | — | Cierra sesiones nuevas; las activas siguen hasta expirar (8 h) o hasta borrar `admin_sessions` |
| `ADMIN_SESSION_SECRET` | Vercel | — | **Ninguna** | Recomendado junto con la contraseña | — | **Invalida todas las sesiones admin** (`ml_admin`). Hay que volver a entrar |
| `DATABASE_URL` | Local / Vercel | — | **Ninguna** | Sólo si se compartió | No | Sólo se usa para aplicar migraciones con psql |
| `VERCEL_TOKEN` | No existe en el repo | — | **Ninguna** | — | — | — |

**Principio aplicado:** un secreto que estuvo alguna vez en Git debe tratarse
como comprometido aunque se haya borrado después. **Aquí ninguno lo estuvo**, lo
que es un resultado excelente y poco común.

---

## 19. FASE 22 — Pruebas de seguridad añadidas

Tres suites nuevas, sin dependencias externas (no necesitan base de datos ni
credenciales), en el mismo estilo del QA existente:

```bash
npx tsx scripts/qa/security-payments.test.ts    # 24 verificaciones
npx tsx scripts/qa/security-contracts.test.ts   # 90+ verificaciones
npx tsx scripts/qa/security-headers.test.ts     # 50+ verificaciones
```

| Requisito que pediste | Prueba |
|---|---|
| El cliente no controla el precio | `security-contracts` A — rechaza `price`, `unitPrice`, `total`, `discount`, `shipping` en carrito y checkout |
| Webhook inválido rechazado | `security-payments` — firma caducada, `ts` manipulado, montos y monedas que no cuadran |
| Webhook duplicado idempotente | `mercadopago-webhook` (existente) + `security-contracts` B6 verifica que el código conserva `payment_events` + `processed_at` + `process_paid_order` |
| Pedido ajeno inaccesible | `security-contracts` B3 — verifica el filtro por `session_id` en carrito, pedidos, diseños y subidas |
| RLS de Supabase | Cubierto por las consultas de §5.1 (requiere la base productiva; no automatizable sin credenciales) |
| Subida inválida rechazada | `security-contracts` B4 — magic bytes, SVG ausente, techo de píxeles, nombre generado en servidor |
| Subida sobredimensionada rechazada | `security-contracts` B4 + límites de `designer.ts` |
| Autorización de rutas admin | `security-contracts` B — **recorre el directorio**: cada handler nuevo debe traer su guard o el QA falla |
| Cantidades inválidas | `security-contracts` A2 — 0, negativa, decimal, gigante, texto, NaN, Infinity, null |
| IDs de producto inválidos | `security-contracts` A3 — no-uuid, vacío, numérico, inyección SQL, traversal, null |

Las suites de contratos son deliberadamente **estructurales**: recorren
`src/app/api/admin/` y `src/app/admin/` y exigen el guard en cada handler y
página que encuentren. Una ruta nueva sin protección **rompe el QA**, en vez de
descubrirse en producción.

### Verificación ejecutada en esta auditoría

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run build` | ✅ compila; middleware registrado (34.7 kB) |
| `next start` + peticiones reales a 7 rutas | ✅ todas 200; **0 scripts bloqueados**; 1 sola cabecera CSP |
| Las 10 suites de QA preexistentes | ✅ todas en verde (nada regresó) |
| Las 3 suites nuevas | ✅ todas en verde |

---

## 20. FASE 17 — Mapeo ASVS 5.0 (controles aplicables)

| Capítulo ASVS | Control | Estado |
|---|---|---|
| V1.3 Arquitectura de BD | Funciones con `search_path` fijo | ✅ (0006) |
| V1.12 / V5.5 Archivos | Validación de contenido, sin ejecución, descarga forzada | ✅ |
| V1.14 Dependencias | Inventario y audit de dependencias | ⚠️ ML-02/03 pendientes |
| V2.2 Autenticación general | Anti-automatización en el login | ✅ (ML-01) |
| V2.2.4 | Resistencia a fuerza bruta | ⚠️ Falta MFA (P2-16) |
| V3.2 Sesiones | Id de sesión generado por el servidor | ⚠️ ML-14 |
| V3.4 Cookies | `httpOnly`, `Secure`, `SameSite`, host-only | ✅ |
| V4.1/4.2 Control de acceso | Server-side en toda ruta y página | ✅ |
| V4.2.1 | Referencias directas a objetos verificadas | ✅ |
| V5.1 Validación de entrada | Zod `.strict()` en el 100% de las entradas | ✅ |
| V5.3 Codificación de salida | React escapa; cero sumideros de HTML crudo | ✅ |
| V7.2 Registro de eventos de seguridad | `audit_logs` de login, pagos y cambios | ✅ |
| V7.3 Protección de logs | Sin secretos ni PII | ✅ |
| V8.1/8.3 Protección de datos | Minimización sí; aviso y ARCO **no** | ❌ ML-09 |
| V11.1 Lógica de negocio | Límites y secuencia | ⚠️ ML-10 |
| V13.4 Webhooks / callbacks | Firma, frescura, integridad del importe | ✅ |
| V14.1/14.2 Configuración | Cabeceras, secretos, build | ✅ |
| V50 Cabeceras HTTP | CSP, HSTS, COOP/CORP, sniffing, framing | ✅ |

---

## 21. Limitaciones honestas de esta auditoría

1. **No pude tocar producción.** La política de egress de la sesión bloquea
   `www.matrixlabintelligence.com` (403 al `CONNECT`). Las conclusiones sobre
   cabeceras HTTP y ausencia de artefactos se basan en un build y una ejecución
   reales en local, que —al no existir `vercel.json`— reflejan lo que sirve
   producción. **Confirmar con `curl -I` tras desplegar.**
2. **No verifiqué el estado real de Supabase.** La auditoría de RLS es sobre las
   migraciones del repositorio. Que estén *aplicadas* debe confirmarse con las
   consultas de §5.1. Es la brecha más importante entre este informe y la
   realidad.
3. **No verifiqué la configuración de Vercel** (variables por scope, Deployment
   Protection, logs). Requiere acceso al panel.
4. **No ejecuté gitleaks/trufflehog/semgrep**: no están instalados y no se
   pueden descargar bajo la política de egress. Se sustituyeron por expresiones
   equivalentes de alta señal sobre los 88 commits.
5. **ML-04 se marca como *probable*, no confirmado**: la ausencia del control es
   un hecho verificable en el código, pero no construí una cadena de explotación
   completa (haría falta influir en el `external_reference` de un pago, lo que
   exige el Access Token). Los modos de fallo que sí son reales —pago dividido en
   dos tarjetas, credencial de prueba en producción— justifican la corrección.
6. **No probé la migración `0006` contra un Postgres real** (no hay base en este
   entorno). Su SQL es estándar y aditivo, pero **aplícala primero en un
   proyecto de staging**.
