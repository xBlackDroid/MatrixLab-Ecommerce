-- ============================================================================
-- MatrixLab Store Core — Etapa 1 — Esquema base
-- Ejecutar en Supabase (SQL Editor) o psql $DATABASE_URL, en orden:
--   0001_schema.sql → 0002_rls.sql → 0003_storage.sql → seed.sql (opcional)
-- ============================================================================

create extension if not exists pgcrypto;

-- Trigger genérico para updated_at -------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- categories
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  handle text not null unique check (handle ~ '^[a-z0-9-]+$'),
  description text,
  image_url text,
  sort_order int not null default 0,
  status text not null default 'activa' check (status in ('activa', 'oculta')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  handle text not null unique check (handle ~ '^[a-z0-9-]+$'),
  description text,
  base_price numeric(12,2) not null check (base_price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price >= 0),
  images jsonb not null default '[]'::jsonb,
  status text not null default 'oculto'
    check (status in ('disponible', 'agotado', 'sobre_pedido', 'oculto', 'proximamente')),
  is_customizable boolean not null default false,
  production_time text,
  min_quantity int not null default 1 check (min_quantity >= 1),
  max_quantity int not null default 999 check (max_quantity >= 1),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_quantity >= min_quantity)
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_status on public.products(status);

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- product_variants
-- ----------------------------------------------------------------------------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  sku text unique,
  price numeric(12,2) check (price >= 0),
  stock int not null default 0 check (stock >= 0),
  color text,
  size text,
  option_label text,
  status text not null default 'disponible'
    check (status in ('disponible', 'agotado', 'sobre_pedido', 'oculto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_variants_product on public.product_variants(product_id);

create trigger trg_variants_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- carts
-- ----------------------------------------------------------------------------
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  status text not null default 'active'
    check (status in ('active', 'checked_out', 'converted', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_carts_session on public.carts(session_id);

create trigger trg_carts_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- orders
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  session_id text,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  shipping_address jsonb,
  payment_provider text not null default 'mercadopago',
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'in_process', 'approved', 'rejected', 'cancelled', 'refunded')),
  payment_reference text,
  payment_preference_id text,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  shipping numeric(12,2) not null default 0 check (shipping >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  status text not null default 'pendiente_pago'
    check (status in (
      'pendiente_pago', 'pagado', 'pago_rechazado', 'revisando_diseno',
      'en_produccion', 'listo', 'enviado', 'entregado', 'cancelado'
    )),
  notes text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_session on public.orders(session_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- design_projects (antes que cart_items/order_items por las FKs)
-- ----------------------------------------------------------------------------
create table if not exists public.design_projects (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  product_type text not null check (product_type in ('playera', 'gorra', 'tote')),
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  base_color text,
  selected_size text,
  uploaded_asset_url text,
  preview_url text,
  design_json jsonb,
  print_zone text not null default 'front' check (print_zone in ('front', 'back', 'center')),
  position_x numeric not null default 0,
  position_y numeric not null default 0,
  scale numeric not null default 1 check (scale > 0 and scale <= 10),
  rotation numeric not null default 0 check (rotation >= -180 and rotation <= 180),
  customer_notes text,
  status text not null default 'draft'
    check (status in (
      'draft', 'added_to_cart', 'ordered', 'production_ready',
      'in_review', 'in_production', 'completed'
    )),
  cart_id uuid references public.carts(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_designs_session on public.design_projects(session_id);
create index if not exists idx_designs_status on public.design_projects(status);
create index if not exists idx_designs_order on public.design_projects(order_id);

create trigger trg_designs_updated_at
  before update on public.design_projects
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- cart_items
-- ----------------------------------------------------------------------------
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity int not null check (quantity > 0 and quantity <= 999),
  unit_price_snapshot numeric(12,2) not null check (unit_price_snapshot >= 0),
  is_custom boolean not null default false,
  design_project_id uuid references public.design_projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cart_items_cart on public.cart_items(cart_id);

create trigger trg_cart_items_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- order_items
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  title_snapshot text not null,
  variant_snapshot text,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total numeric(12,2) not null check (total >= 0),
  is_custom boolean not null default false,
  design_project_id uuid references public.design_projects(id) on delete set null,
  production_notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order on public.order_items(order_id);

-- ----------------------------------------------------------------------------
-- uploaded_assets
-- ----------------------------------------------------------------------------
create table if not exists public.uploaded_assets (
  id uuid primary key default gen_random_uuid(),
  design_project_id uuid not null references public.design_projects(id) on delete cascade,
  original_file_url text not null,
  preview_url text,
  file_name_safe text not null,
  original_file_name text not null,
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  width int not null check (width > 0),
  height int not null check (height > 0),
  size_bytes int not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_assets_design on public.uploaded_assets(design_project_id);

-- ----------------------------------------------------------------------------
-- payment_events (idempotencia de webhooks)
-- ----------------------------------------------------------------------------
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mercadopago',
  event_id text not null unique,
  order_id uuid references public.orders(id) on delete set null,
  payment_reference text,
  status text not null,
  processed_at timestamptz,
  raw_event_safe jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_events_order on public.payment_events(order_id);

-- ----------------------------------------------------------------------------
-- inventory_movements
-- ----------------------------------------------------------------------------
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  movement_type text not null
    check (movement_type in ('venta', 'ajuste', 'reposicion', 'cancelacion')),
  quantity int not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_variant on public.inventory_movements(product_variant_id);

-- ----------------------------------------------------------------------------
-- admin_sessions (revocación de sesiones del panel)
-- ----------------------------------------------------------------------------
create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- audit_logs
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- process_paid_order: transición transaccional e idempotente a "pagado".
-- La llama SOLO el backend (service role) desde el webhook de Mercado Pago.
--   * Marca el pedido como pagado (una sola vez, con lock de fila).
--   * Descuenta inventario por variante y registra movimientos.
--   * Marca variantes que llegaron a 0 como agotadas.
--   * Pasa los diseños del pedido a production_ready.
--   * Convierte el carrito activo de esa sesión.
-- ============================================================================
create or replace function public.process_paid_order(
  p_order_id uuid,
  p_payment_reference text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return false;
  end if;

  -- Idempotencia: si ya se procesó el pago, no repetir efectos.
  if v_order.paid_at is not null then
    return true;
  end if;

  update public.orders
     set status = 'pagado',
         payment_status = 'approved',
         payment_reference = coalesce(p_payment_reference, payment_reference),
         paid_at = now()
   where id = p_order_id;

  for v_item in
    select oi.variant_id, oi.quantity
      from public.order_items oi
     where oi.order_id = p_order_id
       and oi.variant_id is not null
  loop
    update public.product_variants
       set stock = greatest(stock - v_item.quantity, 0)
     where id = v_item.variant_id;

    insert into public.inventory_movements
      (product_variant_id, order_id, movement_type, quantity, reason)
    values
      (v_item.variant_id, p_order_id, 'venta', -v_item.quantity, 'Pago aprobado');
  end loop;

  update public.product_variants pv
     set status = 'agotado'
   where pv.status = 'disponible'
     and pv.stock = 0
     and pv.id in (
       select variant_id from public.order_items
        where order_id = p_order_id and variant_id is not null
     );

  update public.design_projects
     set status = 'production_ready'
   where order_id = p_order_id
     and status in ('ordered', 'added_to_cart', 'draft');

  update public.carts
     set status = 'converted'
   where session_id = v_order.session_id
     and status = 'active';

  return true;
end;
$$;

-- Solo el backend puede ejecutar la función.
revoke all on function public.process_paid_order(uuid, text) from public;
revoke all on function public.process_paid_order(uuid, text) from anon;
revoke all on function public.process_paid_order(uuid, text) from authenticated;
grant execute on function public.process_paid_order(uuid, text) to service_role;
