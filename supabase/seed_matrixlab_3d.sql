-- ============================================================================
-- MatrixLab 3D — 7 piezas — Seed aditivo e IDEMPOTENTE
--
-- ***  BLOQUEADO: NO EJECUTAR TODAVÍA  ***
--
-- Este archivo está COMPLETO pero se detiene a propósito en su primera
-- instrucción mientras los precios no estén confirmados.
--
-- FUENTE DE VERDAD: Inventario_MatrixLab_3D.xlsx (hoja "Inventario 3D"),
-- leído por scripts/data/build-matrixlab-catalogs.py
--   columna B -> código (3D001…3D007)  |  columna C -> nombre
--   columna D -> categoría             |  columna F -> descripción
--   columna G -> tipo / uso            |  columna H -> color / acabado
--   columna I -> unidades (99)         |  columna J -> SKU (ML3D-<código>)
--   columna K -> PRECIO (VACÍO)        |  columna M -> personalizable
-- La columna L ("Valor total") NO se usa.
--
-- AUDITORÍA DE RUTA: la categoría `impresion-3d` YA EXISTE (supabase/seed.sql
-- y seed_designer_base_v2.sql). Este seed NO crea una categoría nueva y NO
-- cambia el handle público /tienda/categoria/impresion-3d.
--
-- CATÁLOGO (7 piezas, 99 unidades cada una, 693 en total)
--   3D001  Dragón Fuego Vivo — Lámpara RGB 3D          Lámparas RGB
--   3D002  Calendario Fórmula 1 2026                   Calendarios
--   3D003  Lápiz Gigante Pastel                        Decoración escolar
--   3D004  Porta Lápices Playera Fútbol                Organizadores   (pers.)
--   3D005  Porta Lápices Unicornio Bicolor             Organizadores   (pers.)
--   3D006  Pokébola Motion                             Coleccionables
--   3D007  Tag Nombre 3D para Lápiz                    Personalizados  (pers.)
--
-- PERSONALIZACIÓN: 3D004, 3D005 y 3D007 llegan marcadas como personalizables.
-- El Laboratorio NO tiene editor de piezas 3D, así que se marcan con
-- `is_customizable = true` para el admin y el catálogo las cotiza por
-- WhatsApp. NO se inventa un configurador nuevo.
--
-- GARANTÍAS
--   * Re-ejecutable: upsert por `handle` (producto) y por `sku` (variante).
--   * NO borra nada: sin DELETE, sin TRUNCATE, sin DROP.
--   * NO toca el producto genérico previo "Pieza 3D personalizada": sigue vivo
--     en la base y en el admin; el catálogo sólo lo separa de ESTA vista.
--   * NO toca Tumbler, pedidos, diseños, usuarios ni Mercado Pago.
-- ============================================================================

-- Todo el seed corre en UNA transacción: si cualquier guardia falla, no queda
-- nada a medias. Sin esto, `psql -f` autocommitea sentencia por sentencia y
-- seguiria adelante tras un error (docs/TIENDA.md documenta ese modo de uso).
begin;

-- ---------------------------------------------------------------------------
-- BLOQUEO DE PRECIO — falla ANTES de cualquier escritura
-- ---------------------------------------------------------------------------
-- El Excel entregó las 7 celdas de Precio VACÍAS. Estas 7 piezas son muy
-- distintas entre sí (una lámpara RGB no cuesta lo que un tag de lápiz), así
-- que NO existe un precio único que se pueda deducir.
--
-- PARA DESBLOQUEAR, en este orden:
--   1. confirmar el precio unitario de cada una de las 7 piezas;
--   2. capturarlo en la columna K del Excel y regenerar el módulo con
--      `python scripts/data/build-matrixlab-catalogs.py <carpeta>`;
--   3. sustituir la lista `pieces` de este archivo por la lista con precios;
--   4. borrar ESTE bloque `do $$ ... $$;` y volver a ejecutar.
do $$
begin
  raise exception
    'SEED BLOQUEADO: MatrixLab 3D tiene 7 precios pendientes (columna K del Excel vacía). No se escribió nada. Ver el encabezado de supabase/seed_matrixlab_3d.sql para desbloquear.';
end $$;

-- ---------------------------------------------------------------------------
-- La categoría debe existir: este seed NUNCA crea una segunda categoría.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from public.categories where handle = 'impresion-3d'
  ) then
    raise exception
      'Falta la categoría impresion-3d. Ejecuta supabase/seed.sql primero.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Catálogo. `price` queda como NULL a propósito hasta el desbloqueo.
-- ---------------------------------------------------------------------------
with pieces(handle, code, title, description, usage_label, stock, sku, price, customizable) as (
  values
    -- (handle, código, nombre, descripción, uso, unidades, SKU, precio, pers.)
    -- Las 7 filas se generan desde el Excel al desbloquear. Se dejan fuera a
    -- propósito: un seed a medio llenar es peor que un seed bloqueado.
    (null::text, null::text, null::text, null::text, null::text, null::int, null::text, null::numeric, null::boolean)
),
upserted as (
  insert into public.products (
    category_id, title, handle, description, base_price, status,
    is_customizable, production_time, min_quantity, max_quantity, tags
  )
  select
    (select id from public.categories where handle = 'impresion-3d'),
    p.title,
    p.handle,
    p.description,
    p.price,
    case when p.stock > 0 then 'disponible' else 'agotado' end,
    p.customizable,
    '3 a 7 días hábiles',
    1,
    p.stock,
    array['matrixlab-3d', 'impresion-3d', p.code]
  from pieces p
  where p.handle is not null
  on conflict (handle) do update set
    title = excluded.title,
    description = excluded.description,
    base_price = excluded.base_price,
    status = excluded.status,
    is_customizable = excluded.is_customizable,
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
  p.sku,
  p.price,
  p.stock,
  p.usage_label,
  case when p.stock > 0 then 'disponible' else 'agotado' end
from pieces p
join upserted u on u.handle = p.handle
on conflict (sku) do update set
  product_id = excluded.product_id,
  title = excluded.title,
  price = excluded.price,
  stock = excluded.stock,
  option_label = excluded.option_label,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Verificación al desbloquear (debe devolver 7 / 7 / 693).
-- ---------------------------------------------------------------------------
-- select
--   (select count(*) from public.products p
--      join public.categories c on c.id = p.category_id
--     where c.handle = 'impresion-3d' and 'matrixlab-3d' = any(p.tags)) as productos,
--   (select count(*) from public.product_variants where sku like 'ML3D-%') as variantes,
--   (select coalesce(sum(stock), 0) from public.product_variants
--     where sku like 'ML3D-%') as piezas;

commit;
