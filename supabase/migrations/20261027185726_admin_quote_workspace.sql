-- ============================================================================
-- Espacio de trabajo del COTIZADOR admin — migración ADITIVA y forward-only
--
-- Ejecutar después de 0001…0008. Archivo creado con
-- `supabase migration new admin_quote_workspace`.
--
-- QUÉ AGREGA
--   Una sola tabla nueva, `admin_quote_workspace`, con UNA sola fila
--   (singleton `id = 'default'`). Guarda la "foto" del cotizador interno de
--   /admin/cotizador: cotización y recibo en curso (campos y líneas),
--   historial de cotizaciones generadas, folios siguientes, costos de
--   insumos personalizados y selecciones de cada módulo.
--
-- POR QUÉ UNA TABLA NUEVA
--   Ninguna tabla existente modela esto: `orders` son ventas reales con pago,
--   `audit_logs` es bitácora append-only y `admin_sessions` sólo revoca
--   sesiones. Meter la foto en cualquiera de ellas contaminaría datos reales.
--
-- CONCURRENCIA (sin "gana el último")
--   `version` es un contador optimista. El servidor sólo escribe con
--   `update … where id = 'default' and version = <versión que leyó el
--   cliente>` y sube la versión en 1. Si otra pestaña/dispositivo guardó
--   antes, el WHERE no encuentra fila, la API responde 409 y el cliente
--   decide qué conservar. Un UPDATE con ese WHERE es atómico en Postgres:
--   dos guardados simultáneos con la misma versión base nunca prosperan
--   ambos.
--
-- PERMISOS (deny-all salvo service_role)
--   El panel admin NO usa Supabase Auth (cookie firmada propia + registro
--   vivo en admin_sessions), así que `auth.uid()` no significa nada aquí.
--   Por eso:
--     * RLS habilitada y forzada, SIN ninguna policy: deny-by-default total.
--     * `revoke all` a public, anon y authenticated: ni con la anon key
--       filtrada se puede leer ni escribir.
--     * Sólo service_role (que vive exclusivamente en el servidor) recibe
--       select/insert/update. Sin delete: la fila no se borra desde la app.
--   Los costos internos y márgenes que contiene la foto son confidenciales.
--
-- GARANTÍAS
--   * 100 % aditiva e idempotente (if not exists / on conflict do nothing /
--     trigger dentro de un guard). Sin DROP, DELETE ni ALTER de tablas
--     existentes.
-- ============================================================================

create table if not exists public.admin_quote_workspace (
  id text primary key default 'default'
    constraint admin_quote_workspace_singleton check (id = 'default'),
  version integer not null default 0
    constraint admin_quote_workspace_version_nonneg check (version >= 0),
  snapshot jsonb not null default '{}'::jsonb
    constraint admin_quote_workspace_snapshot_object
      check (jsonb_typeof(snapshot) = 'object'),
  updated_by text
    constraint admin_quote_workspace_updated_by_len
      check (updated_by is null or char_length(updated_by) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Tope duro de tamaño (la API valida ~256 KB antes; esto es la red de
  -- seguridad si alguien escribiera directo con service_role).
  constraint admin_quote_workspace_snapshot_size
    check (pg_column_size(snapshot) <= 1048576)
);

do $$
begin
  if not exists (
    select 1 from pg_trigger
     where tgname = 'trg_admin_quote_workspace_updated_at'
       and tgrelid = 'public.admin_quote_workspace'::regclass
  ) then
    create trigger trg_admin_quote_workspace_updated_at
      before update on public.admin_quote_workspace
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.admin_quote_workspace enable row level security;
alter table public.admin_quote_workspace force row level security;

revoke all on table public.admin_quote_workspace from public;
revoke all on table public.admin_quote_workspace from anon;
revoke all on table public.admin_quote_workspace from authenticated;
revoke all on table public.admin_quote_workspace from service_role;
grant select, insert, update on table public.admin_quote_workspace to service_role;

-- Fila única en versión 0 ("todavía no se ha guardado nada").
insert into public.admin_quote_workspace (id, version, snapshot)
values ('default', 0, '{}'::jsonb)
on conflict (id) do nothing;
