-- ============================================================================
-- MatrixLab Store Core — Consignaciones y distribuidores (ADITIVA)
--
-- 100% aditiva: no borra ni modifica tablas, columnas, políticas ni datos
-- existentes. Ejecutar después de 0001..0008.
--
-- Modelo de negocio (ver docs/ORIGAMI_IMPLEMENTACION.md):
--   * MatrixLab deja piezas EN CONSIGNACIÓN a un distribuidor (Origami).
--     Dejar piezas NO genera deuda; la deuda nace al confirmar la venta.
--   * El inventario del distribuidor es INDEPENDIENTE de product_variants:
--     estas tablas nunca tocan el stock de la tienda.
--   * El inventario de un distribuidor empieza VACÍO y crece sólo con las
--     fichas y entregas que MatrixLab confirma para él. No hay importación
--     automática del catálogo.
--   * Todo el dinero se guarda en CENTAVOS ENTEROS (bigint). Nunca float.
--
-- Aislamiento: todas las tablas llevan `distributor_id` y las claves
-- compuestas impiden que un documento mezcle dos distribuidores. RLS queda
-- activo sin policies para anon/authenticated (deny-by-default) y además se
-- revocan los privilegios directos: el único camino es el backend.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Límites de dinero y cantidad
--
-- El techo de dinero (1e12 centavos = $10,000,000,000.00) queda MUY por debajo
-- de 2^53, así que un bigint de estas tablas siempre viaja exacto a JavaScript
-- aunque PostgREST lo serialice como número JSON. La capa TS vuelve a validar
-- el rango (src/lib/consignments/money.ts) y rechaza lo que no sea entero.
-- ----------------------------------------------------------------------------
create or replace function public.consignment_money_ok(p_value bigint)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select p_value is not null and p_value >= 0 and p_value <= 1000000000000;
$$;

create or replace function public.consignment_qty_ok(p_value int)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select p_value is not null and p_value > 0 and p_value <= 1000000;
$$;

-- ----------------------------------------------------------------------------
-- distributors — Origami es un REGISTRO, no una condición en el código.
-- ----------------------------------------------------------------------------
create table if not exists public.distributors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$' and char_length(slug) <= 60),
  contact_name text check (char_length(contact_name) <= 120),
  contact_phone text check (char_length(contact_phone) <= 40),
  contact_email text check (char_length(contact_email) <= 160),
  notes text check (char_length(notes) <= 2000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_distributors_updated_at on public.distributors;
create trigger trg_distributors_updated_at
  before update on public.distributors
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- distributor_memberships — vincula una cuenta autenticada del proveedor
-- (Supabase Auth) con un distribuidor. La resolución de permisos ocurre en el
-- servidor consultando esta tabla EN CADA REQUEST: desactivar una membresía
-- bloquea la siguiente petición aunque el proveedor siga teniendo sesión.
--
-- No hay FK a auth.users a propósito: el módulo debe seguir operando (y
-- conservando su histórico) si esa cuenta se elimina del proveedor.
-- ----------------------------------------------------------------------------
create table if not exists public.distributor_memberships (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  auth_user_id uuid not null,
  email text not null check (char_length(email) between 3 and 160),
  role text not null default 'operador' check (role in ('operador', 'gerente')),
  status text not null default 'activa' check (status in ('activa', 'inactiva', 'revocada')),
  invited_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (distributor_id, auth_user_id)
);

-- Una cuenta no puede estar ACTIVA en dos distribuidores a la vez: es la
-- barrera de base que acompaña al guard HTTP de propiedad.
create unique index if not exists uq_distributor_memberships_active_user
  on public.distributor_memberships(auth_user_id)
  where status = 'activa';

create index if not exists idx_distributor_memberships_distributor
  on public.distributor_memberships(distributor_id, status);

drop trigger if exists trg_distributor_memberships_updated_at on public.distributor_memberships;
create trigger trg_distributor_memberships_updated_at
  before update on public.distributor_memberships
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- consignment_sessions — sesión propia del distribuidor, revocable.
--
-- El proveedor de identidad (Supabase Auth) sólo verifica la contraseña UNA
-- vez, en el login. A partir de ahí la sesión es nuestra: cookie httpOnly con
-- payload firmado + esta fila. Así se puede revocar desde MatrixLab sin
-- depender del proveedor, y la membresía se vuelve a leer en cada request.
-- ----------------------------------------------------------------------------
create table if not exists public.consignment_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  membership_id uuid not null references public.distributor_memberships(id) on delete restrict,
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  auth_user_id uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists idx_consignment_sessions_expires
  on public.consignment_sessions(expires_at);
create index if not exists idx_consignment_sessions_membership
  on public.consignment_sessions(membership_id);

-- ----------------------------------------------------------------------------
-- consignment_items — FICHA PRIVADA de pieza del distribuidor.
--
-- Es la entidad obligatoria de ventas y lotes. El vínculo al catálogo
-- (`product_variant_id`) es OPCIONAL y sólo descriptivo: `on delete set null`
-- para que borrar un producto de la tienda no toque la ficha, sus snapshots
-- ni ningún documento de consignación. Crear una ficha NO publica nada en la
-- tienda ni copia su stock.
-- ----------------------------------------------------------------------------
create table if not exists public.consignment_items (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  name text not null check (char_length(btrim(name)) between 2 and 160),
  variant_label text check (char_length(variant_label) <= 120),
  description text check (char_length(description) <= 1000),
  image_url text check (char_length(image_url) <= 600),
  commercial_unit text not null default 'pieza'
    check (commercial_unit in ('pieza', 'paquete', 'juego', 'par', 'kit')),
  sku text not null check (sku ~ '^[A-Za-z0-9][A-Za-z0-9._-]{1,59}$'),
  scan_code text not null unique check (scan_code ~ '^MLC[A-Za-z0-9_-]{10,40}$'),
  suggested_price_cents bigint not null default 0
    check (public.consignment_money_ok(suggested_price_cents)),
  status text not null default 'borrador'
    check (status in ('borrador', 'activa', 'inactiva')),
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- El SKU es único DENTRO del distribuidor: MatrixLab puede usar su propio
  -- código sin colisionar con el de otro distribuidor.
  unique (distributor_id, sku)
);

-- Un producto/variante de la tienda se vincula una sola vez por distribuidor
-- (evita dos fichas "de lo mismo" que se repondrían por separado).
create unique index if not exists uq_consignment_items_variant
  on public.consignment_items(distributor_id, product_variant_id)
  where product_variant_id is not null;

create index if not exists idx_consignment_items_distributor
  on public.consignment_items(distributor_id, status);

drop trigger if exists trg_consignment_items_updated_at on public.consignment_items;
create trigger trg_consignment_items_updated_at
  before update on public.consignment_items
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Folios legibles. Son SECUENCIAS: únicos y ordenables, sin prometer que no
-- haya huecos (una transacción abortada consume su número).
-- ----------------------------------------------------------------------------
create sequence if not exists public.consignment_delivery_folio_seq;
create sequence if not exists public.consignment_sale_folio_seq;
create sequence if not exists public.consignment_payment_folio_seq;
create sequence if not exists public.consignment_return_folio_seq;
create sequence if not exists public.consignment_adjustment_folio_seq;

-- ----------------------------------------------------------------------------
-- consignment_deliveries — documento de entrega física.
-- No genera saldo por pagar. Un borrador no mueve stock.
-- ----------------------------------------------------------------------------
create table if not exists public.consignment_deliveries (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  folio text unique,
  kind text not null default 'reposicion' check (kind in ('inicial', 'reposicion')),
  status text not null default 'borrador'
    check (status in ('borrador', 'confirmada', 'revertida')),
  effective_date date not null default (now() at time zone 'America/Mexico_City')::date,
  reference text check (char_length(reference) <= 120),
  notes text check (char_length(notes) <= 1000),
  actor text not null,
  actor_type text not null default 'matrixlab_admin'
    check (actor_type in ('matrixlab_admin', 'distribuidor')),
  actor_session_hash text check (char_length(actor_session_hash) <= 80),
  confirmed_at timestamptz,
  reverted_at timestamptz,
  revert_reason text check (char_length(revert_reason) <= 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Un documento confirmado SIEMPRE tiene folio y fecha de confirmación.
  check (status = 'borrador' or (folio is not null and confirmed_at is not null)),
  check (status <> 'revertida' or (reverted_at is not null and revert_reason is not null))
);

create index if not exists idx_consignment_deliveries_distributor
  on public.consignment_deliveries(distributor_id, status, effective_date desc);

drop trigger if exists trg_consignment_deliveries_updated_at on public.consignment_deliveries;
create trigger trg_consignment_deliveries_updated_at
  before update on public.consignment_deliveries
  for each row execute function public.set_updated_at();

create table if not exists public.consignment_delivery_lines (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.consignment_deliveries(id) on delete cascade,
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  item_id uuid not null references public.consignment_items(id) on delete restrict,
  quantity int not null check (public.consignment_qty_ok(quantity)),
  unit_cost_cents bigint not null
    check (unit_cost_cents > 0 and public.consignment_money_ok(unit_cost_cents)),
  suggested_price_cents bigint not null
    check (public.consignment_money_ok(suggested_price_cents)),
  item_name_snapshot text not null,
  item_variant_snapshot text,
  item_sku_snapshot text not null,
  commercial_unit_snapshot text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_consignment_delivery_lines_delivery
  on public.consignment_delivery_lines(delivery_id);
create index if not exists idx_consignment_delivery_lines_item
  on public.consignment_delivery_lines(distributor_id, item_id);

-- Un documento CONFIRMADO no se borra físicamente. El borrado de borradores
-- sí arrastra sus líneas (cascade de arriba), que es lo único reversible.
create or replace function public.consignment_block_confirmed_delete()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.status <> 'borrador' then
    raise exception 'CONS_DOCUMENTO_CONFIRMADO_NO_SE_BORRA'
      using errcode = 'P0001';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_consignment_deliveries_no_delete on public.consignment_deliveries;
create trigger trg_consignment_deliveries_no_delete
  before delete on public.consignment_deliveries
  for each row execute function public.consignment_block_confirmed_delete();

-- ----------------------------------------------------------------------------
-- consignment_adjustments — altas por ajuste, mermas y retorno de piezas no
-- vendidas a MatrixLab. Ninguno genera deuda ni toca una venta.
-- ----------------------------------------------------------------------------
create table if not exists public.consignment_adjustments (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  folio text not null unique,
  kind text not null check (kind in ('alta', 'merma', 'retorno_matrixlab')),
  item_id uuid not null references public.consignment_items(id) on delete restrict,
  lot_id uuid,
  quantity int not null check (public.consignment_qty_ok(quantity)),
  unit_cost_cents bigint
    check (unit_cost_cents is null or (unit_cost_cents > 0 and public.consignment_money_ok(unit_cost_cents))),
  reason text not null check (char_length(btrim(reason)) between 3 and 400),
  effective_date date not null default (now() at time zone 'America/Mexico_City')::date,
  actor text not null,
  actor_type text not null default 'matrixlab_admin'
    check (actor_type in ('matrixlab_admin', 'distribuidor')),
  actor_session_hash text,
  created_at timestamptz not null default now(),
  -- Un alta define el costo del lote que crea; una salida apunta a un lote.
  check (
    (kind = 'alta' and unit_cost_cents is not null)
    or (kind <> 'alta' and lot_id is not null)
  )
);

create index if not exists idx_consignment_adjustments_distributor
  on public.consignment_adjustments(distributor_id, effective_date desc);

-- ----------------------------------------------------------------------------
-- consignment_lots — existencias por LOTE con costo pactado FIJO.
--
-- El costo de un lote confirmado no se reescribe nunca: una corrección se
-- hace con reversión + nueva entrada. `received_quantity` también es
-- inmutable; sólo `available_quantity` se mueve, siempre acompañada de un
-- renglón en consignment_movements.
-- ----------------------------------------------------------------------------
create table if not exists public.consignment_lots (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  item_id uuid not null references public.consignment_items(id) on delete restrict,
  source_type text not null check (source_type in ('entrega', 'ajuste')),
  delivery_line_id uuid references public.consignment_delivery_lines(id) on delete restrict,
  adjustment_id uuid references public.consignment_adjustments(id) on delete restrict,
  unit_cost_cents bigint not null
    check (unit_cost_cents > 0 and public.consignment_money_ok(unit_cost_cents)),
  received_quantity int not null check (received_quantity >= 0),
  available_quantity int not null check (available_quantity >= 0),
  -- Orden FIFO estable: (received_at, fifo_seq). `fifo_seq` desempata dos
  -- lotes recibidos en el mismo instante de forma determinista.
  fifo_seq bigserial not null,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (available_quantity <= received_quantity),
  check (
    (source_type = 'entrega' and delivery_line_id is not null)
    or (source_type = 'ajuste' and adjustment_id is not null)
  )
);

alter table public.consignment_adjustments
  drop constraint if exists consignment_adjustments_lot_fk;
alter table public.consignment_adjustments
  add constraint consignment_adjustments_lot_fk
  foreign key (lot_id) references public.consignment_lots(id) on delete restrict;

create index if not exists idx_consignment_lots_fifo
  on public.consignment_lots(distributor_id, item_id, received_at, fifo_seq);
create index if not exists idx_consignment_lots_available
  on public.consignment_lots(distributor_id, item_id)
  where available_quantity > 0;

-- ----------------------------------------------------------------------------
-- consignment_sales — venta de existencias del distribuidor.
--
-- `debt_cents` es la deuda ORIGINAL (suma de cantidad × costo pactado del
-- lote consumido). `debt_reverted_cents` acumula lo revertido por
-- devoluciones/anulación. La deuda neta y el pendiente son DERIVADOS (ver
-- la vista consignment_sale_balances): nunca se marcan a mano.
-- ----------------------------------------------------------------------------
create table if not exists public.consignment_sales (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  folio text not null unique,
  status text not null default 'confirmada' check (status in ('confirmada', 'anulada')),
  sold_at timestamptz not null default now(),
  effective_date date not null default (now() at time zone 'America/Mexico_City')::date,
  actor text not null,
  actor_type text not null check (actor_type in ('matrixlab_admin', 'distribuidor')),
  actor_session_hash text,
  membership_id uuid references public.distributor_memberships(id) on delete set null,
  public_total_cents bigint not null default 0
    check (public.consignment_money_ok(public_total_cents)),
  debt_cents bigint not null default 0 check (public.consignment_money_ok(debt_cents)),
  debt_reverted_cents bigint not null default 0
    check (public.consignment_money_ok(debt_reverted_cents)),
  notes text check (char_length(notes) <= 1000),
  voided_at timestamptz,
  void_reason text check (char_length(void_reason) <= 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (debt_reverted_cents <= debt_cents),
  check (status <> 'anulada' or (voided_at is not null and void_reason is not null))
);

create index if not exists idx_consignment_sales_distributor
  on public.consignment_sales(distributor_id, sold_at desc);
create index if not exists idx_consignment_sales_pending
  on public.consignment_sales(distributor_id, status, sold_at);

drop trigger if exists trg_consignment_sales_updated_at on public.consignment_sales;
create trigger trg_consignment_sales_updated_at
  before update on public.consignment_sales
  for each row execute function public.set_updated_at();

create table if not exists public.consignment_sale_lines (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.consignment_sales(id) on delete restrict,
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  item_id uuid not null references public.consignment_items(id) on delete restrict,
  quantity int not null check (public.consignment_qty_ok(quantity)),
  returned_quantity int not null default 0 check (returned_quantity >= 0),
  unit_public_price_cents bigint not null
    check (public.consignment_money_ok(unit_public_price_cents)),
  line_debt_cents bigint not null check (public.consignment_money_ok(line_debt_cents)),
  line_debt_reverted_cents bigint not null default 0
    check (public.consignment_money_ok(line_debt_reverted_cents)),
  -- Snapshots: el histórico conserva nombre y precios originales aunque la
  -- ficha o el catálogo vinculado cambien después.
  item_name_snapshot text not null,
  item_variant_snapshot text,
  item_sku_snapshot text not null,
  commercial_unit_snapshot text not null,
  suggested_price_snapshot_cents bigint not null
    check (public.consignment_money_ok(suggested_price_snapshot_cents)),
  -- uuid PLANO, sin FK: si el producto de la tienda se elimina, el histórico
  -- de consignación no se toca.
  product_variant_id_snapshot uuid,
  zero_price_reason text check (char_length(zero_price_reason) <= 300),
  created_at timestamptz not null default now(),
  check (returned_quantity <= quantity),
  check (line_debt_reverted_cents <= line_debt_cents),
  -- Precio real 0 exige motivo visible (el costo sigue siendo exigible).
  check (unit_public_price_cents > 0 or zero_price_reason is not null)
);

create index if not exists idx_consignment_sale_lines_sale
  on public.consignment_sale_lines(sale_id);
create index if not exists idx_consignment_sale_lines_item
  on public.consignment_sale_lines(distributor_id, item_id);

-- Asignación venta↔lote con el costo CONGELADO del lote. Obligatoria: una
-- línea que consume varios lotes tiene varias filas aquí, y una devolución
-- parcial revierte contra la asignación original, nunca contra otro costo.
create table if not exists public.consignment_sale_allocations (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.consignment_sales(id) on delete restrict,
  sale_line_id uuid not null references public.consignment_sale_lines(id) on delete restrict,
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  lot_id uuid not null references public.consignment_lots(id) on delete restrict,
  item_id uuid not null references public.consignment_items(id) on delete restrict,
  quantity int not null check (public.consignment_qty_ok(quantity)),
  returned_quantity int not null default 0 check (returned_quantity >= 0),
  unit_cost_cents bigint not null
    check (unit_cost_cents > 0 and public.consignment_money_ok(unit_cost_cents)),
  fifo_rank int not null default 0,
  created_at timestamptz not null default now(),
  check (returned_quantity <= quantity)
);

create index if not exists idx_consignment_sale_allocations_sale
  on public.consignment_sale_allocations(sale_id);
create index if not exists idx_consignment_sale_allocations_lot
  on public.consignment_sale_allocations(lot_id);

-- ----------------------------------------------------------------------------
-- consignment_returns — devolución de cliente y anulación de venta.
-- ----------------------------------------------------------------------------
create table if not exists public.consignment_returns (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  folio text not null unique,
  kind text not null check (kind in ('cliente', 'anulacion_venta')),
  sale_id uuid not null references public.consignment_sales(id) on delete restrict,
  reason text not null check (char_length(btrim(reason)) between 3 and 400),
  effective_date date not null default (now() at time zone 'America/Mexico_City')::date,
  actor text not null,
  actor_type text not null default 'matrixlab_admin'
    check (actor_type in ('matrixlab_admin', 'distribuidor')),
  actor_session_hash text,
  debt_reverted_cents bigint not null default 0
    check (public.consignment_money_ok(debt_reverted_cents)),
  credit_released_cents bigint not null default 0
    check (public.consignment_money_ok(credit_released_cents)),
  created_at timestamptz not null default now()
);

create index if not exists idx_consignment_returns_distributor
  on public.consignment_returns(distributor_id, effective_date desc);
create index if not exists idx_consignment_returns_sale
  on public.consignment_returns(sale_id);

create table if not exists public.consignment_return_lines (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.consignment_returns(id) on delete restrict,
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  sale_line_id uuid not null references public.consignment_sale_lines(id) on delete restrict,
  allocation_id uuid not null references public.consignment_sale_allocations(id) on delete restrict,
  lot_id uuid not null references public.consignment_lots(id) on delete restrict,
  item_id uuid not null references public.consignment_items(id) on delete restrict,
  quantity int not null check (public.consignment_qty_ok(quantity)),
  -- `restock=false` significa que la pieza NO vuelve a estar disponible:
  -- exige destino/merma explícitos y no suma stock.
  restock boolean not null default true,
  disposal text check (char_length(disposal) <= 300),
  unit_cost_cents bigint not null check (unit_cost_cents > 0),
  debt_reverted_cents bigint not null check (public.consignment_money_ok(debt_reverted_cents)),
  created_at timestamptz not null default now(),
  check (restock or disposal is not null)
);

create index if not exists idx_consignment_return_lines_return
  on public.consignment_return_lines(return_id);
create index if not exists idx_consignment_return_lines_allocation
  on public.consignment_return_lines(allocation_id);

-- ----------------------------------------------------------------------------
-- consignment_payments — pago RECIBIDO por MatrixLab. Sólo MatrixLab los
-- registra o anula. No procesa transferencias ni verifica bancos.
-- ----------------------------------------------------------------------------
create table if not exists public.consignment_payments (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  folio text not null unique,
  amount_cents bigint not null
    check (amount_cents > 0 and public.consignment_money_ok(amount_cents)),
  method text not null check (method in ('transferencia', 'efectivo', 'otro')),
  reference text check (char_length(reference) <= 120),
  notes text check (char_length(notes) <= 1000),
  effective_date date not null default (now() at time zone 'America/Mexico_City')::date,
  received_at timestamptz not null default now(),
  actor text not null,
  actor_type text not null default 'matrixlab_admin'
    check (actor_type in ('matrixlab_admin', 'distribuidor')),
  actor_session_hash text,
  status text not null default 'activo' check (status in ('activo', 'anulado')),
  voided_at timestamptz,
  void_reason text check (char_length(void_reason) <= 400),
  voided_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'anulado' or (voided_at is not null and void_reason is not null))
);

create index if not exists idx_consignment_payments_distributor
  on public.consignment_payments(distributor_id, received_at desc);

drop trigger if exists trg_consignment_payments_updated_at on public.consignment_payments;
create trigger trg_consignment_payments_updated_at
  before update on public.consignment_payments
  for each row execute function public.set_updated_at();

-- Aplicación pago→venta. Una liberación PARCIAL no reescribe el importe:
-- revierte la fila y crea otra por el resto, enlazada con
-- `replaced_application_id`, de modo que el evento queda registrado.
create table if not exists public.consignment_payment_applications (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  payment_id uuid not null references public.consignment_payments(id) on delete restrict,
  sale_id uuid not null references public.consignment_sales(id) on delete restrict,
  amount_cents bigint not null
    check (amount_cents > 0 and public.consignment_money_ok(amount_cents)),
  status text not null default 'activa' check (status in ('activa', 'revertida')),
  -- 'pago': se aplicó al registrar el dinero. 'credito': MatrixLab aplicó
  -- después un crédito ya recibido (no es dinero nuevo).
  source text not null default 'pago' check (source in ('pago', 'credito')),
  replaced_application_id uuid references public.consignment_payment_applications(id) on delete set null,
  reverted_at timestamptz,
  revert_reason text check (char_length(revert_reason) <= 400),
  reverted_by_return_id uuid references public.consignment_returns(id) on delete set null,
  actor text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'revertida' or reverted_at is not null)
);

create index if not exists idx_consignment_applications_payment
  on public.consignment_payment_applications(payment_id, status);
create index if not exists idx_consignment_applications_sale
  on public.consignment_payment_applications(sale_id, status);
create index if not exists idx_consignment_applications_distributor
  on public.consignment_payment_applications(distributor_id, status);

drop trigger if exists trg_consignment_applications_updated_at on public.consignment_payment_applications;
create trigger trg_consignment_applications_updated_at
  before update on public.consignment_payment_applications
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- consignment_movements — LEDGER permanente de stock. Nunca se borra ni se
-- edita: cada cambio de `available_quantity` deja aquí su delta firmado.
-- La vista de reconciliación compara este ledger contra los lotes.
-- ----------------------------------------------------------------------------
create table if not exists public.consignment_movements (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  item_id uuid not null references public.consignment_items(id) on delete restrict,
  lot_id uuid not null references public.consignment_lots(id) on delete restrict,
  delta int not null check (delta <> 0),
  movement_type text not null check (movement_type in (
    'entrega',
    'reversion_entrega',
    'venta',
    'anulacion_venta',
    'devolucion_cliente',
    'retorno_matrixlab',
    'merma',
    'ajuste_alta'
  )),
  document_type text not null check (document_type in (
    'entrega', 'venta', 'devolucion', 'ajuste'
  )),
  document_id uuid not null,
  actor text not null,
  reason text check (char_length(reason) <= 400),
  created_at timestamptz not null default now()
);

create index if not exists idx_consignment_movements_lot
  on public.consignment_movements(lot_id, created_at);
create index if not exists idx_consignment_movements_distributor
  on public.consignment_movements(distributor_id, created_at desc);
create index if not exists idx_consignment_movements_document
  on public.consignment_movements(document_type, document_id);

-- ----------------------------------------------------------------------------
-- consignment_audit_events — quién hizo qué, con motivo. Se inserta DENTRO
-- de la misma transacción de negocio (no es "best effort").
-- ----------------------------------------------------------------------------
create table if not exists public.consignment_audit_events (
  id uuid primary key default gen_random_uuid(),
  distributor_id uuid references public.distributors(id) on delete set null,
  action text not null check (char_length(action) <= 80),
  actor text not null check (char_length(actor) <= 160),
  actor_type text not null check (actor_type in ('matrixlab_admin', 'distribuidor', 'sistema')),
  actor_session_hash text check (char_length(actor_session_hash) <= 80),
  entity_type text not null check (char_length(entity_type) <= 80),
  entity_id uuid,
  reason text check (char_length(reason) <= 400),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_consignment_audit_distributor
  on public.consignment_audit_events(distributor_id, created_at desc);

-- ----------------------------------------------------------------------------
-- consignment_idempotency — intención durable de cada mutación de negocio.
--
-- La unicidad vive en la BASE: dos peticiones concurrentes con la misma clave
-- no pueden crear dos documentos. Un reinicio del servidor no borra la
-- garantía porque la fila está en Postgres, no en memoria.
-- ----------------------------------------------------------------------------
create table if not exists public.consignment_idempotency (
  id uuid primary key default gen_random_uuid(),
  -- Hash de la identidad del actor: una clave de un actor no sirve a otro.
  actor_key text not null check (char_length(actor_key) <= 80),
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  operation text not null check (char_length(operation) <= 60),
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 120),
  -- Hash canónico del payload: misma clave con otro payload = conflicto.
  payload_hash text not null check (char_length(payload_hash) <= 80),
  result jsonb not null,
  document_type text check (char_length(document_type) <= 40),
  document_id uuid,
  created_at timestamptz not null default now(),
  unique (actor_key, distributor_id, operation, idempotency_key)
);

create index if not exists idx_consignment_idempotency_created
  on public.consignment_idempotency(created_at);

-- ============================================================================
-- RLS y privilegios: deny-by-default total.
--
-- Ninguna tabla de este módulo tiene policy para anon/authenticated, así que
-- RLS las niega por completo; además se revocan los privilegios directos para
-- que ni un GRANT futuro accidental las abra. El único camino es el backend
-- (service_role) con los guards de aplicación ya validados.
-- ============================================================================
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'distributors',
    'distributor_memberships',
    'consignment_sessions',
    'consignment_items',
    'consignment_deliveries',
    'consignment_delivery_lines',
    'consignment_adjustments',
    'consignment_lots',
    'consignment_sales',
    'consignment_sale_lines',
    'consignment_sale_allocations',
    'consignment_returns',
    'consignment_return_lines',
    'consignment_payments',
    'consignment_payment_applications',
    'consignment_movements',
    'consignment_audit_events',
    'consignment_idempotency'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format('revoke all on public.%I from anon', v_table);
    execute format('revoke all on public.%I from authenticated', v_table);
  end loop;
end;
$$;

-- Las secuencias de folio tampoco se tocan desde el cliente.
revoke all on sequence public.consignment_delivery_folio_seq from anon, authenticated;
revoke all on sequence public.consignment_sale_folio_seq from anon, authenticated;
revoke all on sequence public.consignment_payment_folio_seq from anon, authenticated;
revoke all on sequence public.consignment_return_folio_seq from anon, authenticated;
revoke all on sequence public.consignment_adjustment_folio_seq from anon, authenticated;
revoke all on sequence public.consignment_lots_fifo_seq_seq from anon, authenticated;

revoke all on function public.consignment_money_ok(bigint) from anon, authenticated;
revoke all on function public.consignment_qty_ok(int) from anon, authenticated;
