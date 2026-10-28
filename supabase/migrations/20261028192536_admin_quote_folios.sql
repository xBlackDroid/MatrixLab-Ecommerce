-- ============================================================================
-- Folios consecutivos de COTIZACIÓN (COT-xxx) — migración ADITIVA y forward-only
--
-- Ejecutar después de 20261027185726_admin_quote_workspace.sql. Archivo creado
-- con `supabase migration new admin_quote_folios`.
--
-- PROBLEMA
--   El cotizador original numeraba COT-xxx con un contador del navegador
--   (localStorage) y con flechas/campo manual: dos dispositivos, un caché
--   restaurado o un PDF repetido podían emitir el mismo folio. La última
--   cotización emitida a mano es la COT-038; la siguiente DEBE ser COT-039.
--
-- QUÉ AGREGA (sólo objetos nuevos)
--   * `admin_quote_folio_counter`: UNA fila (`id = 'cot'`) con el último folio
--     emitido. Semilla 38 → el siguiente es 39. Nunca baja (CHECK >= 38 y
--     trigger que rechaza cualquier decremento).
--   * `admin_quote_folio_reservations`: una fila por solicitud (UUID de
--     idempotencia) con el rango reservado y la huella SHA-256 del contenido.
--     NO guarda cliente, montos ni costos: sólo números y la huella.
--     Una restricción EXCLUDE impide que dos reservas compartan un folio.
--   * `admin_quote_reserve_folios(uuid, int, text)`: reserva atómica de
--     1..200 folios contiguos. Transacción corta: bloquea la fila singleton
--     (SELECT … FOR UPDATE), y DESPUÉS del bloqueo comprueba la idempotencia:
--       - misma solicitud + misma cantidad + misma huella → el MISMO rango,
--         sin consumir folios (reintento tras respuesta perdida);
--       - misma solicitud con otro contenido → error MLQ09 (nunca comparte
--         un folio entre contenidos distintos);
--       - solicitud nueva → avanza el contador y guarda la reserva.
--     Sin llamadas externas dentro del bloqueo.
--
-- PERMISOS (deny-all salvo service_role, igual que admin_quote_workspace)
--   * RLS habilitada y FORZADA en ambas tablas, sin policies.
--   * `revoke all` a public, anon y authenticated (y se reinician los de
--     service_role) en tablas y función. Sólo service_role recibe lo mínimo:
--       counter       → select, update   (la función corre como el invocador)
--       reservations  → select, insert   (sin update ni delete: inmutables)
--       función       → execute
--   * La función es SECURITY INVOKER (nada de SECURITY DEFINER) con
--     `search_path` vacío y nombres totalmente calificados.
--
-- GARANTÍAS
--   * 100 % aditiva e idempotente: if not exists, create or replace, triggers
--     dentro de un guard, semilla con ON CONFLICT DO NOTHING (si el contador
--     ya existe con un valor mayor, NO se toca). Sin DROP, DELETE, TRUNCATE
--     ni ALTER de tablas existentes.
--   * Aplicarla NO consume folios: después de aplicarla el siguiente es 39.
-- ============================================================================

create table if not exists public.admin_quote_folio_counter (
  id text primary key default 'cot'
    constraint admin_quote_folio_counter_singleton check (id = 'cot'),
  last_issued integer not null
    constraint admin_quote_folio_counter_floor check (last_issued >= 38)
    constraint admin_quote_folio_counter_ceiling check (last_issued <= 999999999),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_quote_folio_reservations (
  request_id uuid primary key,
  first_folio integer not null
    constraint admin_quote_folio_reservations_first check (first_folio >= 39),
  folio_count integer not null
    constraint admin_quote_folio_reservations_count check (folio_count between 1 and 200),
  fingerprint text not null
    constraint admin_quote_folio_reservations_fingerprint check (fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  constraint admin_quote_folio_reservations_last
    check (first_folio::bigint + folio_count - 1 <= 999999999),
  -- Red de seguridad: dos reservas jamás comparten un folio.
  constraint admin_quote_folio_reservations_no_overlap
    exclude using gist (int4range(first_folio, first_folio + folio_count) with &&)
);

-- El contador sólo sube (ni siquiera service_role puede bajarlo).
create or replace function public.admin_quote_folio_counter_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.id is distinct from old.id or new.last_issued < old.last_issued then
    raise exception using errcode = 'MLQ08', message = 'ADMIN_QUOTE_FOLIO_NO_DECREMENT';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
     where tgname = 'trg_admin_quote_folio_counter_guard'
       and tgrelid = 'public.admin_quote_folio_counter'::regclass
  ) then
    create trigger trg_admin_quote_folio_counter_guard
      before update on public.admin_quote_folio_counter
      for each row execute function public.admin_quote_folio_counter_guard();
  end if;
end;
$$;

create or replace function public.admin_quote_reserve_folios(
  p_request_id uuid,
  p_count integer,
  p_fingerprint text
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_last integer;
  v_first integer;
  v_existing_first integer;
  v_existing_count integer;
  v_existing_fingerprint text;
begin
  if p_request_id is null then
    raise exception using errcode = 'MLQ01', message = 'ADMIN_QUOTE_FOLIO_INVALID_REQUEST';
  end if;
  if p_count is null or p_count < 1 or p_count > 200 then
    raise exception using errcode = 'MLQ02', message = 'ADMIN_QUOTE_FOLIO_INVALID_COUNT';
  end if;
  if p_fingerprint is null or p_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'MLQ03', message = 'ADMIN_QUOTE_FOLIO_INVALID_FINGERPRINT';
  end if;

  -- Serializa TODAS las reservas sobre la fila singleton.
  select c.last_issued
    into v_last
    from public.admin_quote_folio_counter c
   where c.id = 'cot'
     for update;
  if not found then
    raise exception using errcode = 'MLQ04', message = 'ADMIN_QUOTE_FOLIO_COUNTER_MISSING';
  end if;

  -- Idempotencia, comprobada con el bloqueo ya tomado: una solicitud
  -- concurrente con el mismo UUID ve aquí la reserva ya confirmada.
  select r.first_folio, r.folio_count, r.fingerprint
    into v_existing_first, v_existing_count, v_existing_fingerprint
    from public.admin_quote_folio_reservations r
   where r.request_id = p_request_id;
  if found then
    if v_existing_count = p_count and v_existing_fingerprint = p_fingerprint then
      return jsonb_build_object(
        'first', v_existing_first,
        'count', v_existing_count,
        'last_issued', v_last,
        'replayed', true
      );
    end if;
    raise exception using errcode = 'MLQ09', message = 'ADMIN_QUOTE_FOLIO_REQUEST_CONFLICT';
  end if;

  if v_last::bigint + p_count > 999999999 then
    raise exception using errcode = 'MLQ05', message = 'ADMIN_QUOTE_FOLIO_EXHAUSTED';
  end if;

  v_first := v_last + 1;
  update public.admin_quote_folio_counter
     set last_issued = v_last + p_count
   where id = 'cot';
  insert into public.admin_quote_folio_reservations (request_id, first_folio, folio_count, fingerprint)
  values (p_request_id, v_first, p_count, p_fingerprint);

  return jsonb_build_object(
    'first', v_first,
    'count', p_count,
    'last_issued', v_last + p_count,
    'replayed', false
  );
end;
$$;

alter table public.admin_quote_folio_counter enable row level security;
alter table public.admin_quote_folio_counter force row level security;
alter table public.admin_quote_folio_reservations enable row level security;
alter table public.admin_quote_folio_reservations force row level security;

revoke all on table public.admin_quote_folio_counter from public;
revoke all on table public.admin_quote_folio_counter from anon;
revoke all on table public.admin_quote_folio_counter from authenticated;
revoke all on table public.admin_quote_folio_counter from service_role;
grant select, update on table public.admin_quote_folio_counter to service_role;

revoke all on table public.admin_quote_folio_reservations from public;
revoke all on table public.admin_quote_folio_reservations from anon;
revoke all on table public.admin_quote_folio_reservations from authenticated;
revoke all on table public.admin_quote_folio_reservations from service_role;
grant select, insert on table public.admin_quote_folio_reservations to service_role;

revoke all on function public.admin_quote_reserve_folios(uuid, integer, text) from public;
revoke all on function public.admin_quote_reserve_folios(uuid, integer, text) from anon;
revoke all on function public.admin_quote_reserve_folios(uuid, integer, text) from authenticated;
revoke all on function public.admin_quote_reserve_folios(uuid, integer, text) from service_role;
grant execute on function public.admin_quote_reserve_folios(uuid, integer, text) to service_role;

-- La función del trigger no se invoca directamente: nadie recibe EXECUTE.
revoke all on function public.admin_quote_folio_counter_guard() from public;
revoke all on function public.admin_quote_folio_counter_guard() from anon;
revoke all on function public.admin_quote_folio_counter_guard() from authenticated;
revoke all on function public.admin_quote_folio_counter_guard() from service_role;

-- Última emitida: COT-038 → la siguiente es COT-039. Si la fila ya existe
-- (re-ejecución o contador más avanzado) NO se toca: nunca retrocede.
insert into public.admin_quote_folio_counter (id, last_issued)
values ('cot', 38)
on conflict (id) do nothing;
