-- ============================================================================
-- MatrixLab Store Core — Etapa 1 — Row Level Security
--
-- Modelo de acceso:
--   * El navegador NUNCA habla directo con Postgres. Todas las operaciones
--     pasan por route handlers de Next.js.
--   * service_role (solo backend) salta RLS; cada handler valida sesión y
--     propiedad (session_id de cookie httpOnly) a nivel de aplicación.
--   * anon/authenticated SOLO pueden leer catálogo visible. Para el resto de
--     tablas no existe ninguna policy => deny-by-default total.
--
-- Documentación de policies por tabla:
--   categories         → SELECT público si status='activa'. Sin escritura.
--   products           → SELECT público si status<>'oculto'. Sin escritura.
--   product_variants   → SELECT público si variante y producto visibles.
--   carts/cart_items   → Sin policies: solo backend (la sesión dueña se
--                        verifica en el servidor contra la cookie httpOnly).
--   orders/order_items → Sin policies: el cliente consulta su pedido vía
--                        endpoint que compara session_id en servidor.
--   design_projects    → Sin policies: propiedad por session_id en servidor;
--                        cliente no puede editar tras 'ordered'.
--   uploaded_assets    → Sin policies: lectura vía URLs firmadas de corta
--                        duración generadas en backend.
--   payment_events     → Sin policies: exclusivo del webhook (backend).
--   inventory_movements→ Sin policies: solo admin/backend.
--   admin_sessions     → Sin policies: solo backend.
--   audit_logs         → Sin policies: solo backend.
-- ============================================================================

alter table public.categories          enable row level security;
alter table public.products            enable row level security;
alter table public.product_variants    enable row level security;
alter table public.carts               enable row level security;
alter table public.cart_items          enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.design_projects     enable row level security;
alter table public.uploaded_assets     enable row level security;
alter table public.payment_events      enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.admin_sessions      enable row level security;
alter table public.audit_logs          enable row level security;

-- Catálogo público (lectura) --------------------------------------------------

drop policy if exists "categorias_visibles_lectura_publica" on public.categories;
create policy "categorias_visibles_lectura_publica"
  on public.categories
  for select
  to anon, authenticated
  using (status = 'activa');

drop policy if exists "productos_visibles_lectura_publica" on public.products;
create policy "productos_visibles_lectura_publica"
  on public.products
  for select
  to anon, authenticated
  using (status <> 'oculto');

drop policy if exists "variantes_visibles_lectura_publica" on public.product_variants;
create policy "variantes_visibles_lectura_publica"
  on public.product_variants
  for select
  to anon, authenticated
  using (
    status <> 'oculto'
    and exists (
      select 1
        from public.products p
       where p.id = product_variants.product_id
         and p.status <> 'oculto'
    )
  );

-- Defensa extra: aunque RLS ya niega por defecto, revocamos privilegios de
-- escritura del catálogo para anon/authenticated a nivel de GRANT.
revoke insert, update, delete on public.categories       from anon, authenticated;
revoke insert, update, delete on public.products         from anon, authenticated;
revoke insert, update, delete on public.product_variants from anon, authenticated;

-- Tablas privadas: sin policies para anon/authenticated (deny-by-default) y
-- sin privilegios directos. Todo acceso es vía service_role en backend.
revoke all on public.carts               from anon, authenticated;
revoke all on public.cart_items          from anon, authenticated;
revoke all on public.orders              from anon, authenticated;
revoke all on public.order_items         from anon, authenticated;
revoke all on public.design_projects     from anon, authenticated;
revoke all on public.uploaded_assets     from anon, authenticated;
revoke all on public.payment_events      from anon, authenticated;
revoke all on public.inventory_movements from anon, authenticated;
revoke all on public.admin_sessions      from anon, authenticated;
revoke all on public.audit_logs          from anon, authenticated;
