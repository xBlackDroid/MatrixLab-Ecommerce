# MatrixLab Store Core — Etapa 1

Tienda online propia de MatrixLab Intelligence: catálogo, carrito, checkout
con Mercado Pago Checkout Pro, diseñador interactivo de prendas y panel admin.
Vive en `/tienda` como experiencia separada de la landing.

> **Nota:** este repositorio llegó vacío. `src/app/page.tsx` es una landing
> *placeholder* mínima con branding MatrixLab que enlaza a `/tienda`. Al
> integrar la landing real, reemplazar SOLO ese archivo y apuntar sus botones
> de tienda hacia `/tienda`.

---

## 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta EN ORDEN:
   1. `supabase/migrations/0001_schema.sql` — tablas, triggers y la función
      transaccional `process_paid_order`.
   2. `supabase/migrations/0002_rls.sql` — activa RLS en TODAS las tablas
      (catálogo visible en lectura pública; el resto deny-by-default).
   3. `supabase/migrations/0003_storage.sql` — buckets `design-assets` y
      `design-previews` (privados) y `product-images` (lectura pública).
   4. `supabase/seed.sql` — seed inicial (opcional, recomendado).

   Alternativa por terminal: `psql "$DATABASE_URL" -f supabase/migrations/0001_schema.sql` (etc.).
3. En **Project Settings → API** copia:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ solo backend)

### RLS (resumen de policies)

| Tabla | anon/authenticated | Backend (service role) |
|---|---|---|
| categories | SELECT si `status='activa'` | todo |
| products | SELECT si `status<>'oculto'` | todo |
| product_variants | SELECT si variante y producto visibles | todo |
| carts, cart_items | sin acceso | todo (validando session_id de cookie) |
| orders, order_items | sin acceso | todo (cliente ve su pedido vía endpoint que compara session_id) |
| design_projects, uploaded_assets | sin acceso | todo (propiedad por session_id; sin edición tras `ordered`) |
| payment_events, inventory_movements, admin_sessions, audit_logs | sin acceso | todo |
| storage `product-images` | SELECT público | escritura solo backend |
| storage `design-assets`, `design-previews` | sin acceso (URLs firmadas) | todo |

El navegador nunca habla directo con Postgres en esta etapa: todo pasa por
route handlers que validan sesión/inputs. El service role jamás se envía al
cliente (`import "server-only"` lo garantiza en build).

## 2. Configurar Mercado Pago

1. Crea una aplicación en <https://www.mercadopago.com.mx/developers/panel>.
2. **Modo prueba:** copia el `Access Token` de *credenciales de prueba*
   (`TEST-…`) a `MERCADOPAGO_ACCESS_TOKEN`.
3. Define `NEXT_PUBLIC_SITE_URL` (en local con webhook usa un túnel HTTPS,
   ej. `ngrok http 3000`, y pon esa URL).
4. Webhook: en el panel de la app → **Webhooks** registra
   `https://TU-DOMINIO/api/webhooks/mercadopago` (evento *Pagos*), copia el
   secreto a `MERCADOPAGO_WEBHOOK_SECRET`. La preferencia también manda
   `notification_url`, así que en sandbox funciona sin registrar el webhook.
5. **Producción:** repite con credenciales productivas. Sin
   `MERCADOPAGO_WEBHOOK_SECRET` en producción el webhook se rechaza (estricto).

Flujo: `POST /api/checkout/mercadopago` valida sesión + carrito, **recalcula
precios e inventario en backend**, crea el pedido (`pendiente_pago`), crea la
preferencia (`external_reference = orderId`) y devuelve solo
`{ redirectUrl, orderId }`. El webhook re-consulta el pago a Mercado Pago con
el Access Token, registra el evento en `payment_events` (idempotente por
`event_id` único) y, si está aprobado, ejecuta `process_paid_order`
(transaccional: marca pagado, descuenta stock, registra movimientos, pasa
diseños a `production_ready` y convierte el carrito).

## 3. Correr el proyecto

```bash
cp .env.example .env.local   # completar valores
npm install                  # o ./scripts/install-deps.sh
npm run dev                  # http://localhost:3000/tienda
```

Sin Supabase configurado el catálogo se sirve con datos mock (solo lectura);
carrito, checkout, diseñador y admin responden 503 con mensaje claro.

## 4. Cómo correr el seed

- SQL Editor de Supabase → pegar `supabase/seed.sql` → Run; o
- `psql "$DATABASE_URL" -f supabase/seed.sql`

Es idempotente (upsert por id): puedes re-ejecutarlo.

## 5. Probar el carrito

1. `npm run dev` → `http://localhost:3000/tienda`.
2. Entra a un producto (ej. *Playera personalizada*), elige color/talla y
   cantidad → **Agregar al carrito** (se crea la cookie httpOnly `ml_session`
   y el carrito en DB).
3. `/tienda/carrito`: cambia cantidades, elimina, verifica subtotal (se
   recalcula en servidor en cada operación).
4. Producto *Imán personalizado* variante 7x7 está agotado (demo de badges y
   bloqueo de compra).

## 6. Probar checkout con Mercado Pago (modo test)

1. Configura credenciales TEST + `NEXT_PUBLIC_SITE_URL`.
2. Carrito → **Finalizar compra** → llena el formulario → **Pagar con
   Mercado Pago** → te redirige a `init_point`.
3. Paga con [tarjetas de prueba](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards)
   (ej. Mastercard `5474 9254 3267 0366`, aprobada: titular `APRO`).
4. Vuelves a `/tienda/checkout/success|failure|pending?orderId=…`.
5. Con webhook accesible (túnel), el pedido pasa a `pagado`, el stock baja y
   el diseño queda `production_ready`. Verifica en `/admin/pedidos`,
   `/admin/inventario` (movimiento `venta`) y `payment_events` en Supabase.

## 7. Panel admin

1. Define `ADMIN_ACCESS_PASSWORD` y `ADMIN_SESSION_SECRET`
   (`openssl rand -base64 32`).
2. `/admin/login` → contraseña → cookie httpOnly firmada (8 h, revocable en
   `admin_sessions`; login con rate limit 5/5min).
3. Módulos: **Resumen**, **Productos** (crear/editar, precios, estados,
   imágenes por URL o subida, variantes), **Categorías**, **Inventario**
   (stock ±, estados, movimientos), **Pedidos** (filtro por estado, detalle,
   pago, contacto, cambio de estado de producción), **Diseños** (preview,
   descarga del original vía URL firmada, coordenadas, notas, estados
   revisando/producción/listo).
4. Toda mutación admin exige sesión + header CSRF `x-ml-csrf` ligado a la
   sesión firmada.

## 8. Cómo agregar productos

Admin → Productos → **Nuevo producto**: título (handle se genera solo),
categoría, precio base, estado (`disponible|agotado|sobre_pedido|oculto|proximamente`),
personalizable, tiempo de producción, min/max, tags, descripción e imágenes
(pegar URL o **Subir** → bucket público `product-images`, re-encodeada a webp).
Después de crear, edítalo para agregar variantes (color/talla/precio/stock).

## 9. Diseñador y assets

`/tienda/disenador` → playera/gorra/tote → elegir color/talla → subir PNG/JPG/WEBP
(PNG recomendado; SVG y ejecutables rechazados) → mover/escalar/rotar/centrar
dentro del área segura → notas → **Guardar diseño** o **Agregar diseño al
carrito** (guarda primero automáticamente).

Persistencia: archivo ORIGINAL en `design-assets` (privado), preview optimizada
+ preview compuesta del canvas en `design-previews` (privado), y JSON de
coordenadas (`design_json`) + transform en `design_projects`. La preview NUNCA
sustituye al original. Subidas: MIME real verificado con sharp, renombrado en
servidor, ruta con hash de sesión, máx `UPLOAD_MAX_MB`, dimensiones 100–8000px,
rate limit 10/5min. Lectura solo con URLs firmadas (1 h).

## 10. Seguridad implementada

- Zod en todos los endpoints (`.strict()`, whitelists para sort/status/tipo/zona).
- Sin SQL crudo: query builder de Supabase + función SQL parametrizada.
- Precios/totales/stock SIEMPRE recalculados en backend; los del cliente se ignoran.
- Rate limiting en checkout, cart, designs, uploads, webhook, admin login/API
  (in-memory; para producción multi-instancia migrar a Upstash/Redis — la
  firma de `checkRateLimit` ya lo permite).
- Webhook idempotente (`payment_events.event_id` único) + verificación de firma
  + re-consulta del pago real.
- Cookies httpOnly SameSite=Lax (Secure en producción) para sesión y admin;
  CSRF token en mutaciones admin; password comparado en tiempo constante.
- `import "server-only"` en módulos con secretos; guardia
  `assertNoLeakedSecrets()` detecta secretos con prefijo `NEXT_PUBLIC`.
- Logs sin tokens ni datos sensibles; errores públicos genéricos;
  `audit_logs` para acciones admin/webhook.

## 11. Pendientes claros para Etapa 2

- Configurador de grabado láser (la arquitectura del diseñador ya es
  extensible: agregar config en `src/lib/designer/printAreas.ts`).
- Usuarios/clientes con login (Supabase Auth) y policies RLS por `auth.uid()`.
- Integración de paqueterías (cotización y guías; hoy envío = $0 y se
  coordina post-compra).
- Facturación (CFDI).
- Cupones y descuentos.
- Reportes y métricas.
- Automatizaciones de producción (notificaciones, colas de trabajo).
- Rate limit distribuido (Upstash) y CDN para assets.
- Migrar el mockup 2D a React Three Fiber si se requiere 3D real.
