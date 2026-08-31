-- ============================================================================
-- MatrixLab Stickers — 110 diseños — Seed aditivo e IDEMPOTENTE
--
-- ***  BLOQUEADO: NO EJECUTAR TODAVÍA  ***
--
-- Este archivo está COMPLETO pero se detiene a propósito en su primera
-- instrucción mientras los precios no estén confirmados. Ver el bloque
-- "BLOQUEO DE PRECIO" más abajo.
--
-- FUENTE DE VERDAD: Inventario_MatrixLab_Stickers.xlsx (hoja "Inventario
-- Stickers"), leído por scripts/data/build-matrixlab-catalogs.py
--   columna B -> código (GE001…LE010)  |  columna C -> nombre
--   columna D -> categoría temática    |  columna F -> descripción
--   columna G -> acabado / tamaño      |  columna H -> unidades (99)
--   columna I -> SKU (STK-<código>)    |  columna J -> PRECIO (VACÍO)
--   columna L -> handle (ya definido en el Excel)
-- La columna K ("Valor total") NO se usa.
--
-- AUDITORÍA DE RUTA: la categoría `stickers` YA EXISTE (supabase/seed.sql y
-- seed_designer_base_v2.sql). Este seed NO crea una categoría nueva y NO
-- cambia el handle público /tienda/categoria/stickers.
--
-- ESTA LÍNEA NO ES MatrixLab Tumbler: los 209 UV Stickers de Tumbler viven en
-- la categoría `wraps-glow-finish` con SKU propios y NO se tocan aquí.
--
-- GARANTÍAS
--   * Re-ejecutable: upsert por `handle` (producto) y por `sku` (variante).
--     Si el producto ya existe, CONSERVA su id — no se reasignan ids.
--   * NO borra nada: sin DELETE, sin TRUNCATE, sin DROP.
--   * NO toca Tumbler (Sparkles, UV Stickers de Tumbler, Vasos), ni pedidos,
--     ni diseños, ni usuarios, ni Mercado Pago.
--   * NO toca los productos genéricos previos de la categoría ("Sticker
--     personalizado", "Planilla de stickers"): siguen vivos en la base y en el
--     admin; el catálogo sólo los separa de ESTA presentación pública.
--   * NO toca `images`: la foto se resuelve por código desde
--     public/images/matrixlab-stickers/<codigo>.webp y el admin puede curar
--     imágenes sin que el seed las pise.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- BLOQUEO DE PRECIO — falla ANTES de cualquier escritura
-- ---------------------------------------------------------------------------
-- El Excel entregó las 110 celdas de Precio VACÍAS. Un catálogo vendible sin
-- precio sólo puede terminar en un precio inventado (0, 1, o un precio
-- histórico de otra línea), así que el seed se niega a correr.
--
-- PARA DESBLOQUEAR, en este orden:
--   1. confirmar el precio unitario de los 110 diseños (o la regla de precio
--      única que aplique a la línea);
--   2. capturarlo en la columna J del Excel y regenerar el módulo con
--      `python scripts/data/build-matrixlab-catalogs.py <carpeta>`;
--   3. sustituir la lista `stickers` de este archivo por la lista con precios;
--   4. borrar ESTE bloque `do $$ ... $$;` y volver a ejecutar.
do $$
begin
  raise exception
    'SEED BLOQUEADO: MatrixLab Stickers tiene 110 precios pendientes (columna J del Excel vacía). No se escribió nada. Ver el encabezado de supabase/seed_matrixlab_stickers.sql para desbloquear.';
end $$;

-- ---------------------------------------------------------------------------
-- La categoría debe existir: este seed NUNCA crea una segunda categoría ni
-- cambia el handle público /tienda/categoria/stickers.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from public.categories where handle = 'stickers'
  ) then
    raise exception
      'Falta la categoría stickers. Ejecuta supabase/seed.sql primero.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Catálogo. `price` queda como NULL a propósito: la columna se rellena en el
-- paso 3 del desbloqueo. Mientras siga en NULL el bloque de arriba impide que
-- este INSERT llegue a ejecutarse.
-- ---------------------------------------------------------------------------
with stickers(handle, code, title, description, finish_label, stock, sku, price) as (
  values
    -- (handle, código, nombre, descripción, acabado, unidades, SKU, precio)
    -- Las 110 filas se generan desde el Excel al desbloquear. Se dejan fuera
    -- a propósito: un seed a medio llenar es peor que un seed bloqueado.
    (null::text, null::text, null::text, null::text, null::text, null::int, null::text, null::numeric)
),
upserted as (
  insert into public.products (
    category_id, title, handle, description, base_price, status,
    is_customizable, production_time, min_quantity, max_quantity, tags
  )
  select
    (select id from public.categories where handle = 'stickers'),
    s.title,
    s.handle,
    s.description,
    s.price,
    case when s.stock > 0 then 'disponible' else 'agotado' end,
    false,
    '2 a 3 días hábiles',
    1,
    s.stock,
    array['matrixlab-stickers', 'sticker', s.code]
  from stickers s
  where s.handle is not null
  on conflict (handle) do update set
    title = excluded.title,
    description = excluded.description,
    base_price = excluded.base_price,
    status = excluded.status,
    max_quantity = excluded.max_quantity,
    tags = excluded.tags
  returning id, handle
)
insert into public.product_variants (
  product_id, title, sku, price, stock, option_label, status
)
select
  u.id,
  'Pieza',
  s.sku,
  s.price,
  s.stock,
  s.finish_label,
  case when s.stock > 0 then 'disponible' else 'agotado' end
from stickers s
join upserted u on u.handle = s.handle
on conflict (sku) do update set
  product_id = excluded.product_id,
  title = excluded.title,
  price = excluded.price,
  stock = excluded.stock,
  option_label = excluded.option_label,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Verificación al desbloquear (debe devolver 110 / 110 / 10890).
-- ---------------------------------------------------------------------------
-- select
--   (select count(*) from public.products p
--      join public.categories c on c.id = p.category_id
--     where c.handle = 'stickers' and 'matrixlab-stickers' = any(p.tags)) as productos,
--   (select count(*) from public.product_variants where sku like 'STK-%'
--      and sku !~ '^STK-A[0-9]+$') as variantes,
--   (select coalesce(sum(stock), 0) from public.product_variants
--     where sku like 'STK-%' and sku !~ '^STK-A[0-9]+$') as piezas;
