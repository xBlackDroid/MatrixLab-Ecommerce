# MatrixLab Intelligence — E-commerce

**MatrixLab Store Core (Etapa 1):** tienda online propia con catálogo,
carrito, checkout vía **Mercado Pago Checkout Pro**, diseñador interactivo de
prendas (T-Shirt Lab) y panel interno de administración.

> Desde una pieza hasta miles. Desde personas hasta empresas.
> Un solo ecosistema creativo. Infinitas posibilidades.

## Stack

- Next.js 15 (App Router) + TypeScript + TailwindCSS v4
- Supabase/Postgres con **RLS activado** + Storage privado
- Mercado Pago Checkout Pro (preferencias desde backend + webhook idempotente)
- Zod (validación), Konva (diseñador 2D "3D-like"), sharp (procesado de imágenes)

## Inicio rápido

```bash
cp .env.example .env.local   # completar credenciales (ver docs/TIENDA.md)
npm install
npm run dev
```

- Tienda: `http://localhost:3000/tienda`
- Diseñador: `http://localhost:3000/tienda/disenador`
- Admin: `http://localhost:3000/admin`

Sin Supabase configurado, el catálogo usa datos mock (solo navegación);
carrito, checkout, diseñador y admin requieren base de datos.

## Documentación completa

**[docs/TIENDA.md](docs/TIENDA.md)** — setup de Supabase (migraciones + RLS +
storage + seed), configuración de Mercado Pago (test y producción), pruebas de
carrito/checkout/webhook, guía del panel admin, modelo de seguridad y
pendientes de Etapa 2.

## Estructura

```
src/app/tienda      → tienda pública (catálogo, producto, carrito, checkout, diseñador)
src/app/admin       → panel interno (login + productos/categorías/inventario/pedidos/diseños)
src/app/api         → route handlers (cart, checkout, webhooks, designs, uploads, admin)
src/lib             → seguridad, validación, db, pagos, diseñador, lógica de tienda
src/components      → store / designer / admin
supabase/           → migraciones SQL, RLS, storage y seed
scripts/qa          → QA ejecutable (incluye las pruebas de seguridad)
```

## Seguridad

Las migraciones se aplican en orden: `0001` → `0002` (RLS) → `0003` (storage)
→ `0004` → `0005` → **`0006` (endurecimiento)**. La `0006` es aditiva y crea
el freno durable de fuerza bruta del panel; sin ella el login sólo cuenta con
el límite en memoria, que en serverless se reinicia con cada instancia.

QA de seguridad (no necesita base de datos ni credenciales):

```bash
npx tsx scripts/qa/security-payments.test.ts    # integridad del cobro y anti-replay
npx tsx scripts/qa/security-contracts.test.ts   # precio server-side, authz, uploads
npx tsx scripts/qa/security-headers.test.ts     # CSP con nonce y cabeceras
npx tsx scripts/qa/mercadopago-webhook.test.ts  # firma y mapeo de estados
```

Informe completo de la auditoría de caja blanca:
**[docs/SECURITY_AUDIT_WHITEBOX_2026-08.md](docs/SECURITY_AUDIT_WHITEBOX_2026-08.md)**.

> La landing real de MatrixLab aún no vive en este repo: `src/app/page.tsx`
> es un placeholder con branding que enlaza a `/tienda`. Reemplazar solo ese
> archivo al integrar la landing definitiva.
