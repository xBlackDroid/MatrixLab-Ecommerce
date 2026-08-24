-- ============================================================================
-- MatrixLab Tumbler — Vasos — Seed aditivo e IDEMPOTENTE
--
-- Crea/actualiza los 5 vasos como PRODUCTOS INDIVIDUALES dentro de la
-- categoría existente `snowglobe` (SnowGlobe Bar), cada uno con UNA sola
-- variante ("Pieza") que lleva el SKU, el precio y el inventario.
--
-- AUDITORÍA DE RUTA: el catálogo no tenía una categoría de vasos base. La
-- única subcategoría de MatrixLab Tumbler que ya contenía vasos es
-- `snowglobe`, así que los 5 productos se publican ahí y NO se crea una
-- segunda categoría. El nombre visible "SnowGlobe Bar" NO se cambia.
--
-- FUENTE DE VERDAD: Catalogo_Vasos_MatrixLab.xlsx (hoja "Catalogo Vasos")
--   columna B -> código      |  columna C -> nombre
--   columna D -> colección   |  columna F -> descripción
--   columna G -> capacidad   |  columna H -> inventario (pz)
--   columna I -> SKU         |  columna J -> precio unitario
--   columna L -> handle
-- La columna K ("Total") NO se usa: es inventario x precio, no precio unitario.
--
-- CATÁLOGO
--   V001  24 oz Transparente    $155  24 oz - Transparente   5 pz
--   V002  24 oz Tapa de Color   $175  24 oz - Tapa de color  5 pz
--   V003  24 oz Slip            $165  24 oz - Slip           5 pz
--   V004  20 oz Slip            $155  20 oz - Slip           5 pz
--   V005  16 oz Can             $135  16 oz - Can            5 pz
--   Inventario total: 25 pz.
--
-- INVENTARIO: la columna H del Excel llegó vacía. El valor de 5 pz por SKU
-- está CONFIRMADO manualmente para este release; una celda vacía NO se
-- interpreta como 0. `max_quantity` queda alineado al stock real (5), de modo
-- que la base rechaza un sexto artículo aunque el frontend fallara.
--
-- GARANTÍAS
--   * Re-ejecutable: upsert por `handle` (producto) y por `sku` (variante).
--     Si el producto ya existe, CONSERVA su id — no se reasignan ids.
--   * NO borra productos, pedidos, diseños ni usuarios (sin DELETE/TRUNCATE/DROP).
--   * NO crea una segunda categoría ni cambia el handle público
--     /tienda/categoria/snowglobe.
--   * NO toca los productos SnowGlobe históricos (Kit base para vaso SnowGlobe,
--     Vaso SnowGlobe listo para rellenar, Vaso SnowGlobe de vidrio): siguen en
--     la base y en el admin; solo se separan de ESTA vista pública.
--   * NO toca Sparkles, UV Stickers, otras categorías, pedidos ni Mercado Pago.
--   * NO toca `images`: la foto se resuelve por código desde
--     public/images/tumbler/vasos/<codigo>.webp y el admin puede curar
--     imágenes manualmente sin que el seed las pise.
--   * NO toca `compare_at_price` ni `production_time` (curables desde admin).
--
-- Ejecutar después de supabase/seed_etapa2.sql (que crea la categoría).
-- ============================================================================

-- La categoría debe existir: este seed NUNCA crea una segunda categoría ni
-- cambia el handle público /tienda/categoria/snowglobe.
do $$
begin
  if not exists (
    select 1 from public.categories where handle = 'snowglobe'
  ) then
    raise exception
      'Falta la categoría snowglobe. Ejecuta supabase/seed_etapa2.sql primero.';
  end if;
end $$;

with cups (
  product_id, variant_id, code, name, handle, sku, description, price, stock, position
) as (
  values
    ('f5000000-0000-4000-8000-000000000001'::uuid, 'f6000000-0000-4000-8000-000000000001'::uuid, 'V001', '24 oz Transparente', 'vaso-v001', 'VAS-V001', 'Vaso clásico de 24 oz con diseño limpio y versátil. Su acabado completamente transparente permite que colores, glitters y efectos sean los protagonistas. Colección Colección Clásica. Ref. V001.', 155::numeric, 5::int, 1::int),
    ('f5000000-0000-4000-8000-000000000002'::uuid, 'f6000000-0000-4000-8000-000000000002'::uuid, 'V002', '24 oz Tapa de Color', 'vaso-v002', 'VAS-V002', 'Vaso de 24 oz con tapa de color. Mantiene la calidad de la colección clásica y permite crear combinaciones más originales. Colección Color Collection. Ref. V002.', 175::numeric, 5::int, 2::int),
    ('f5000000-0000-4000-8000-000000000003'::uuid, 'f6000000-0000-4000-8000-000000000003'::uuid, 'V003', '24 oz Slip', 'vaso-v003', 'VAS-V003', 'Vaso de 24 oz con tapa tipo Slip, diseño limpio y cómodo para uso diario. Estilo contemporáneo y funcional para personalización. Colección Slip Collection. Ref. V003.', 165::numeric, 5::int, 3::int),
    ('f5000000-0000-4000-8000-000000000004'::uuid, 'f6000000-0000-4000-8000-000000000004'::uuid, 'V004', '20 oz Slip', 'vaso-v004', 'VAS-V004', 'Vaso de 20 oz con tapa tipo Slip, diseño limpio y cómodo para uso diario. Estilo contemporáneo y funcional para personalización. Colección Slip Collection. Ref. V004.', 155::numeric, 5::int, 4::int),
    ('f5000000-0000-4000-8000-000000000005'::uuid, 'f6000000-0000-4000-8000-000000000005'::uuid, 'V005', '16 oz Can', 'vaso-v005', 'VAS-V005', 'Vaso de 16 oz inspirado en las clásicas latas de bebidas. Compacto, elegante y popular para personalizar con glitter, vinil y stickers UV DTF. Colección Can Collection. Ref. V005.', 135::numeric, 5::int, 5::int)
),
cat as (
  select id from public.categories where handle = 'snowglobe'
),
upserted as (
  insert into public.products (
    id, category_id, title, handle, description, base_price, status,
    is_customizable, min_quantity, max_quantity, tags
  )
  select
    c.product_id,
    cat.id,
    c.name,
    c.handle,
    c.description,
    c.price,
    -- Inventario real > 0 => disponible; si algún día llega en 0, el producto
    -- queda 'agotado' y deja de poder agregarse al carrito.
    case when c.stock > 0 then 'disponible' else 'agotado' end,
    false,
    1,
    -- Tope duro por línea: nunca más piezas que el inventario real.
    greatest(c.stock, 1),
    array['vasos', 'matrixlab-tumbler']
  from cups c cross join cat
  on conflict (handle) do update set
    category_id = excluded.category_id,
    title = excluded.title,
    description = excluded.description,
    base_price = excluded.base_price,
    status = excluded.status,
    is_customizable = excluded.is_customizable,
    min_quantity = excluded.min_quantity,
    max_quantity = excluded.max_quantity,
    tags = excluded.tags
  returning id, handle
)
insert into public.product_variants (
  id, product_id, title, sku, price, stock, option_label, status
)
select
  c.variant_id,
  u.id,
  'Pieza',
  c.sku,
  c.price,
  c.stock,
  'Pieza',
  case when c.stock > 0 then 'disponible' else 'agotado' end
from cups c
join upserted u on u.handle = c.handle
on conflict (sku) do update set
  product_id = excluded.product_id,
  title = excluded.title,
  price = excluded.price,
  stock = excluded.stock,
  option_label = excluded.option_label,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Verificación rápida (debe devolver 5 / 5 / 25).
-- ---------------------------------------------------------------------------
-- select
--   (select count(*) from public.products p
--      join public.categories c on c.id = p.category_id
--     where c.handle = 'snowglobe' and p.handle like 'vaso-v%') as productos,
--   (select count(*) from public.product_variants where sku like 'VAS-V%') as variantes,
--   (select coalesce(sum(stock), 0) from public.product_variants
--     where sku like 'VAS-V%') as piezas;
