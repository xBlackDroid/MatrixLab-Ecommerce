-- ============================================================================
-- MatrixLab Wear — 100 diseños de playera — Seed aditivo e IDEMPOTENTE
--
-- ***  BLOQUEADO: NO EJECUTAR TODAVÍA  ***
--
-- Este archivo está COMPLETO pero se detiene a propósito en su primera
-- instrucción: faltan precios Y falta la decisión de modelo (ver abajo).
--
-- FUENTE DE VERDAD: Inventario_MatrixLab_Wear.xlsx (hoja "Inventario Wear"),
-- leído por scripts/data/build-matrixlab-catalogs.py
--   columna B -> código (GE001…MU010)  |  columna C -> nombre
--   columna D -> categoría temática    |  columna F -> descripción
--   columna G -> tipo de prenda        |  columna H -> COLOR ("Por definir")
--   columna I -> TALLA ("Por definir") |  columna J -> unidades (99)
--   columna K -> SKU (WEAR-<código>)   |  columna L -> PRECIO (VACÍO)
-- La columna M ("Valor total") NO se usa.
--
-- AUDITORÍA DE RUTA: la categoría `playeras-prendas` YA EXISTE
-- (supabase/seed.sql y seed_designer_base_v2.sql). Este seed NO crea una
-- categoría nueva y NO cambia el handle público
-- /tienda/categoria/playeras-prendas.
--
-- ---------------------------------------------------------------------------
-- QUÉ MODELA ESTE SEED — LECTURA DEL MODELO ACTUAL
-- ---------------------------------------------------------------------------
-- Cada fila del Excel es un DISEÑO, no una prenda física con talla y color.
-- El propio Excel lo dice: Color = "Por definir" y Talla / Edad = "Por
-- definir" en los 100 registros.
--
-- La tienda YA modela talla y color, y no aquí:
--   * `playera-personalizada` tiene variantes reales de talla/color
--     (Blanco/Negro x CH/M/G/XG), cada una con su SKU, precio y stock;
--   * el Laboratorio (/tienda/disenador/playera) usa `usesProfileSize: true`
--     y las tallas CH/M/G/XG de lib/designer/printAreas.ts, y cobra contra ese
--     producto base.
--
-- Por eso este seed crea UN producto por DISEÑO con UNA variante de
-- referencia, y NO crea 100 x 2 colores x 4 tallas = 800 variantes falsas.
-- Las 99 unidades del Excel son la capacidad declarada del DISEÑO, no 99
-- playeras físicas por cada combinación de talla y color.
--
-- GARANTÍAS
--   * Re-ejecutable: upsert por `handle` (producto) y por `sku` (variante).
--   * NO borra nada: sin DELETE, sin TRUNCATE, sin DROP.
--   * NO toca `playera-personalizada`, `sudadera-personalizada`,
--     `tote-bag-personalizada` ni sus variantes de talla/color: siguen vivos
--     en la base, en el admin y en el Laboratorio.
--   * NO toca Tumbler, pedidos, diseños, usuarios ni Mercado Pago.
-- ============================================================================

-- Todo el seed corre en UNA transacción: si cualquier guardia falla, no queda
-- nada a medias. Sin esto, `psql -f` autocommitea sentencia por sentencia y
-- seguiria adelante tras un error (docs/TIENDA.md documenta ese modo de uso).
begin;

-- ---------------------------------------------------------------------------
-- BLOQUEO DE PRECIO Y DE MODELO — falla ANTES de cualquier escritura
-- ---------------------------------------------------------------------------
-- Faltan TRES datos que no se pueden inventar:
--   * PRECIO: las 100 celdas de la columna L llegaron vacías;
--   * COLOR: las 100 filas dicen "Por definir";
--   * TALLA: las 100 filas dicen "Por definir".
--
-- PARA DESBLOQUEAR, en este orden:
--   1. decidir si estos 100 diseños se venden como producto propio o
--      únicamente como catálogo que alimenta al Laboratorio (hoy el catálogo
--      usa el CTA "Personalizar" y NO agrega al carrito);
--   2. si se venden como producto propio: confirmar precio, y confirmar si la
--      talla/color se resuelven por variante o en el Laboratorio;
--   3. capturar el precio en la columna L del Excel y regenerar el módulo con
--      `python scripts/data/build-matrixlab-catalogs.py <carpeta>`;
--   4. sustituir la lista `designs` por la lista con precios;
--   5. borrar ESTE bloque `do $$ ... $$;` y volver a ejecutar.
do $$
begin
  raise exception
    'SEED BLOQUEADO: MatrixLab Wear tiene 100 precios pendientes (columna L vacía) y color/talla como "Por definir". No se escribió nada. Ver el encabezado de supabase/seed_matrixlab_wear.sql para desbloquear.';
end $$;

-- ---------------------------------------------------------------------------
-- La categoría debe existir: este seed NUNCA crea una segunda categoría.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from public.categories where handle = 'playeras-prendas'
  ) then
    raise exception
      'Falta la categoría playeras-prendas. Ejecuta supabase/seed.sql primero.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Catálogo de DISEÑOS. Una variante de referencia por diseño; la talla y el
-- color NO se materializan aquí (ver "QUÉ MODELA ESTE SEED" arriba).
-- ---------------------------------------------------------------------------
with designs(handle, code, title, description, garment_type, stock, sku, price) as (
  values
    -- (handle, código, nombre, descripción, prenda, unidades, SKU, precio)
    -- Las 100 filas se generan desde el Excel al desbloquear. Se dejan fuera
    -- a propósito: un seed a medio llenar es peor que un seed bloqueado.
    (null::text, null::text, null::text, null::text, null::text, null::int, null::text, null::numeric)
),
upserted as (
  insert into public.products (
    category_id, title, handle, description, base_price, status,
    is_customizable, production_time, min_quantity, max_quantity, tags
  )
  select
    (select id from public.categories where handle = 'playeras-prendas'),
    d.title,
    d.handle,
    d.description,
    d.price,
    'sobre_pedido',
    true,
    '3 a 5 días hábiles',
    1,
    d.stock,
    array['matrixlab-wear', 'diseno', d.code]
  from designs d
  where d.handle is not null
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
  'Diseño',
  d.sku,
  d.price,
  d.stock,
  d.garment_type,
  'sobre_pedido'
from designs d
join upserted u on u.handle = d.handle
on conflict (sku) do update set
  product_id = excluded.product_id,
  title = excluded.title,
  price = excluded.price,
  stock = excluded.stock,
  option_label = excluded.option_label,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Verificación al desbloquear (debe devolver 100 / 100 / 9900).
-- ---------------------------------------------------------------------------
-- select
--   (select count(*) from public.products p
--      join public.categories c on c.id = p.category_id
--     where c.handle = 'playeras-prendas' and 'matrixlab-wear' = any(p.tags)) as productos,
--   (select count(*) from public.product_variants where sku like 'WEAR-%') as variantes,
--   (select coalesce(sum(stock), 0) from public.product_variants
--     where sku like 'WEAR-%') as unidades;

commit;
