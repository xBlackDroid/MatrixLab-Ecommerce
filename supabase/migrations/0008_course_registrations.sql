-- ============================================================================
-- Registros de interés a CURSOS / WORKSHOPS — migración ADITIVA y forward-only
--
-- Ejecutar después de 0001…0007.
--
-- QUÉ AGREGA
--   Una sola tabla nueva, `course_registrations`, más su índice, su trigger de
--   updated_at y sus permisos. Nada más.
--
-- GARANTÍAS
--   * 100 % aditiva: sólo `create table if not exists`, `create index if not
--     exists` y `grant/revoke`. Sin DROP, sin DELETE, sin TRUNCATE, sin ALTER
--     sobre tablas existentes, sin cambios de tipo.
--   * Idempotente: se puede correr dos veces sin error (el trigger se crea
--     dentro de un guard porque `create trigger` no admite IF NOT EXISTS en la
--     versión de Postgres de Supabase).
--   * No toca ninguna migración histórica.
--
-- AUDITORÍA PREVIA DEL ESQUEMA (por qué una tabla nueva y no reusar otra)
--   Las tablas existentes son categories, products, product_variants, carts,
--   cart_items, orders, order_items, design_projects, uploaded_assets,
--   payment_events, inventory_movements, admin_sessions, audit_logs y
--   admin_login_attempts. Ninguna modela una manifestación de interés a un
--   evento: `orders` exige carrito, importes y estado de pago —y este registro
--   NO cobra—, así que meterlo ahí contaminaría los reportes de venta con
--   filas de $0 que no son pedidos.
--
-- DATOS PERSONALES
--   Esta tabla guarda nombre, teléfono y (opcionalmente) correo. Es la única
--   de la base con PII de contacto además de `orders`. Por eso:
--     * RLS habilitada y NINGUNA policy: deny-by-default total.
--     * `revoke all … from anon, authenticated`: ni con la anon key filtrada
--       se puede leer una fila.
--     * Sólo el backend (service_role, que salta RLS) escribe y lee.
--   El endpoint que inserta (`/api/cursos/registro`) nunca escribe PII en
--   logs ni la devuelve en la respuesta.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- course_registrations
--
-- Un registro = una persona que quiere su lugar en UNA edición de UN curso.
--
-- `course_slug` + `edition` son texto/entero y NO una FK: el catálogo de
-- cursos vive en el código (src/lib/store/courses/), no en la base, porque es
-- contenido editorial —copy, temario, galería— y no inventario. La lista
-- cerrada de slugs válidos la aplica el servidor antes de insertar.
-- ---------------------------------------------------------------------------
create table if not exists public.course_registrations (
  id uuid primary key default gen_random_uuid(),

  -- A qué curso y edición apunta. Ej.: 'matrixlab-tumbler-workshop', 2.
  course_slug text not null check (course_slug ~ '^[a-z0-9-]+$'),
  edition int not null check (edition >= 1),

  -- Contacto. `name` y `phone` son obligatorios; `email` es opcional a
  -- propósito: el canal real de este taller es WhatsApp y pedir correo
  -- obligatorio sólo agrega fricción a un público que no lo usa.
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (phone ~ '^[0-9]{10}$'),
  email text check (email is null or char_length(email) <= 120),

  -- Preferencia del SONDEO de fecha ('viernes-2', 'sabado-3', 'cualquiera').
  -- Sin CHECK de valores: cada edición tiene sus propias fechas y un enum
  -- quemado aquí obligaría a una migración por edición. La lista válida la
  -- deriva el servidor de los datos de la edición (validation/courses.ts).
  preferred_date text not null check (char_length(preferred_date) between 1 and 40),

  -- Cuántos lugares aparta. El tope de la APP hoy es 6; aquí se deja en 20
  -- para que subirlo mañana sea un cambio de código y no una migración.
  party_size int not null default 1 check (party_size between 1 and 20),

  comment text check (comment is null or char_length(comment) <= 400),

  -- Estado operativo del registro. Arranca SIEMPRE en 'interested': esta
  -- página no cobra, así que ninguna fila puede nacer diciendo que el lugar
  -- está confirmado o pagado.
  status text not null default 'interested'
    check (status in ('interested', 'contacted', 'confirmed', 'cancelled')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bandeja de trabajo del taller: "los registros de esta edición, del más
-- reciente al más viejo". Es la única consulta que se hace en la práctica.
create index if not exists idx_course_registrations_edition
  on public.course_registrations (course_slug, edition, created_at desc);

-- Filtrar por estado dentro de una edición (pendientes por contactar).
create index if not exists idx_course_registrations_status
  on public.course_registrations (status, created_at desc);

-- updated_at automático (misma función genérica de 0001, con search_path
-- fijado en 0007). `create trigger` no admite IF NOT EXISTS: se comprueba.
do $$
begin
  if not exists (
    -- `tgname` no es único globalmente, sólo por tabla: hay que calificar por
    -- `tgrelid` o un trigger homónimo en otra tabla haría que esto se saltara
    -- en silencio.
    select 1 from pg_trigger
     where tgname = 'trg_course_registrations_updated_at'
       and tgrelid = 'public.course_registrations'::regclass
  ) then
    create trigger trg_course_registrations_updated_at
      before update on public.course_registrations
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Seguridad: deny-by-default total.
--
-- RLS habilitada y CERO policies => anon/authenticated no pueden leer ni
-- escribir nada. El `revoke` es defensa en profundidad a nivel de GRANT, el
-- mismo patrón que 0002 aplica a carts, orders y design_projects.
--
-- service_role (sólo backend) salta RLS: el endpoint valida el payload con Zod
-- y aplica rate limiting antes de insertar.
-- ---------------------------------------------------------------------------
alter table public.course_registrations enable row level security;
revoke all on public.course_registrations from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Documentación en la propia base.
-- ---------------------------------------------------------------------------
comment on table public.course_registrations is
  'Registros de INTERÉS a una edición de un curso/workshop. No implican pago '
  'ni lugar confirmado: el estado inicial es ''interested'' y la confirmación '
  'se hace por WhatsApp. Contiene datos personales de contacto: sólo '
  'service_role tiene acceso (RLS sin policies + revoke a anon/authenticated).';

comment on column public.course_registrations.course_slug is
  'Slug del curso en el código (src/lib/store/courses/). Ej.: '
  '''matrixlab-tumbler-workshop''. No es FK: el catálogo de cursos es '
  'contenido editorial, no inventario.';

comment on column public.course_registrations.preferred_date is
  'Valor de la opción del sondeo elegida por la persona (''viernes-2'', '
  '''sabado-3'', ''cualquiera''). Los valores válidos los define cada edición '
  'en el código y los valida el servidor.';

comment on column public.course_registrations.status is
  'interested (inicial, sin pago) → contacted → confirmed | cancelled.';

-- ---------------------------------------------------------------------------
-- Verificación manual (no altera nada):
-- ---------------------------------------------------------------------------
-- select course_slug,
--        edition,
--        status,
--        count(*)          as registros,
--        sum(party_size)   as lugares_solicitados,
--        max(created_at)   as ultimo
--   from public.course_registrations
--  group by course_slug, edition, status
--  order by ultimo desc;
