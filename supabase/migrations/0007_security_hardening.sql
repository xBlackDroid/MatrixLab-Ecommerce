-- ============================================================================
-- MatrixLab Store Core — Endurecimiento de seguridad (ADITIVA)
--
-- 100% aditiva y no destructiva. NO borra tablas, columnas, políticas ni
-- datos. Ejecutar después de 0001/0002/0003/0004/0005/0006.
--
-- Qué agrega:
--   1. admin_login_attempts — bloqueo de fuerza bruta DURABLE para el panel.
--      El rate limit en memoria (src/lib/security/rate-limit.ts) vive en el
--      proceso: en Vercel cada invocación serverless puede ser una instancia
--      nueva con su Map vacío, así que el contador se reinicia solo y no
--      constituye un control real contra fuerza bruta. Este contador vive en
--      la base y lo comparten TODAS las instancias.
--   2. Funciones SECURITY DEFINER atómicas para leer/registrar intentos (un
--      read-modify-write desde la app tendría carrera con peticiones
--      concurrentes, que es justo el escenario de un ataque).
--   3. search_path fijo en el trigger set_updated_at (endurecimiento estándar
--      de Supabase: `function_search_path_mutable`).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Intentos de acceso al panel admin
--
-- Se guarda un HASH de la IP, nunca la IP: sirve igual como clave de conteo y
-- deja de ser un dato personal identificable en reposo.
-- ----------------------------------------------------------------------------
create table if not exists public.admin_login_attempts (
  ip_hash text primary key,
  attempts int not null default 0 check (attempts >= 0),
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_login_attempts_locked
  on public.admin_login_attempts(locked_until);

alter table public.admin_login_attempts enable row level security;
revoke all on public.admin_login_attempts from anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2) Estado del bloqueo (lectura). Devuelve el instante hasta el que la IP
--    está bloqueada, o null si puede intentar.
-- ----------------------------------------------------------------------------
create or replace function public.admin_login_lock_state(p_ip_hash text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locked timestamptz;
begin
  select locked_until into v_locked
    from public.admin_login_attempts
   where ip_hash = p_ip_hash;

  if v_locked is null or v_locked <= now() then
    return null;
  end if;
  return v_locked;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3) Registro ATÓMICO de un intento fallido.
--
-- Un `insert … on conflict do update` resuelve la carrera entre peticiones
-- concurrentes (el caso real de un ataque) sin necesidad de lock explícito.
-- La ventana se reinicia sola cuando expira, de modo que fallos legítimos
-- espaciados nunca acumulan hasta el bloqueo.
--
-- Devuelve `locked_until` cuando el intento agotó la cuota, o null.
-- ----------------------------------------------------------------------------
create or replace function public.register_admin_login_failure(
  p_ip_hash text,
  p_max_attempts int,
  p_window_seconds int,
  p_lock_seconds int
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts int;
  v_locked timestamptz;
begin
  insert into public.admin_login_attempts (ip_hash, attempts, window_started_at, updated_at)
  values (p_ip_hash, 1, now(), now())
  on conflict (ip_hash) do update
    set attempts = case
          when public.admin_login_attempts.window_started_at
               < now() - make_interval(secs => p_window_seconds)
          then 1
          else public.admin_login_attempts.attempts + 1
        end,
        window_started_at = case
          when public.admin_login_attempts.window_started_at
               < now() - make_interval(secs => p_window_seconds)
          then now()
          else public.admin_login_attempts.window_started_at
        end,
        updated_at = now()
  returning attempts into v_attempts;

  if v_attempts >= p_max_attempts then
    v_locked := now() + make_interval(secs => p_lock_seconds);
    update public.admin_login_attempts
       set locked_until = v_locked,
           attempts = 0,
           window_started_at = now(),
           updated_at = now()
     where ip_hash = p_ip_hash;
    return v_locked;
  end if;

  return null;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4) Limpieza tras un acceso correcto + higiene de filas viejas.
-- ----------------------------------------------------------------------------
create or replace function public.clear_admin_login_attempts(p_ip_hash text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.admin_login_attempts where ip_hash = p_ip_hash;
  -- Higiene oportunista: filas sin bloqueo vigente y sin actividad reciente.
  delete from public.admin_login_attempts
   where updated_at < now() - interval '7 days'
     and (locked_until is null or locked_until < now());
end;
$$;

-- Solo el backend (service role) puede ejecutar estas funciones.
revoke all on function public.admin_login_lock_state(text) from public, anon, authenticated;
revoke all on function public.register_admin_login_failure(text, int, int, int) from public, anon, authenticated;
revoke all on function public.clear_admin_login_attempts(text) from public, anon, authenticated;
grant execute on function public.admin_login_lock_state(text) to service_role;
grant execute on function public.register_admin_login_failure(text, int, int, int) to service_role;
grant execute on function public.clear_admin_login_attempts(text) to service_role;

-- ----------------------------------------------------------------------------
-- 5) search_path fijo en el trigger genérico de updated_at.
--
-- La función es SECURITY INVOKER, así que el riesgo es bajo, pero un
-- search_path mutable es un patrón que Supabase marca (`function_search_path_
-- mutable`) porque permite resolver objetos desde un esquema inesperado. Fijarlo
-- es gratis y elimina la clase entera. El cuerpo NO cambia: los triggers ya
-- creados siguen funcionando igual.
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
