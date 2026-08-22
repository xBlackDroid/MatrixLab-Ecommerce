-- ============================================================================
-- MatrixLab Tumbler — Sparkles / Glitter Chunky — Seed aditivo e IDEMPOTENTE
--
-- Crea/actualiza los 46 Sparkles como PRODUCTOS INDIVIDUALES dentro de la
-- categoría existente `repuestos-consumibles` (Sparkle Mix), cada uno con UNA
-- sola variante ("Bote") que lleva el SKU, el precio y el inventario.
--
-- FUENTE DE VERDAD: Catalogo_Glitters_MatrixLab.xlsx
--   columna B -> código   |  columna C -> nombre
--   columna H -> inventario envasado (pz)  |  columna J -> precio por bote
-- El PDF solo se usa como referencia fotográfica; ante discrepancia gana el
-- Excel (por eso Limited Edition queda en 145).
--
-- GARANTÍAS
--   * Re-ejecutable: upsert por `handle` (producto) y por `sku` (variante).
--     Si el producto ya existe, CONSERVA su id — no se reasignan ids.
--   * NO borra productos, pedidos, diseños ni usuarios.
--   * NO toca otras categorías ni otros productos de MatrixLab Tumbler.
--   * NO toca `images`: la foto se resuelve por código desde
--     public/images/tumbler/sparkles/<codigo>.webp y el admin puede curar
--     imágenes manualmente sin que el seed las pise.
--   * NO toca `compare_at_price` ni `production_time` (curables desde admin).
--
-- Ejecutar después de supabase/seed_etapa2.sql (que crea la categoría).
-- ============================================================================

-- La categoría debe existir: este seed NUNCA crea una segunda categoría ni
-- cambia el handle público /tienda/categoria/repuestos-consumibles.
do $$
begin
  if not exists (
    select 1 from public.categories where handle = 'repuestos-consumibles'
  ) then
    raise exception
      'Falta la categoría repuestos-consumibles. Ejecuta supabase/seed_etapa2.sql primero.';
  end if;
end $$;

with sparkles (
  product_id, variant_id, code, name, handle, sku, description, price, stock, position
) as (
  values
    ('f1000000-0000-4000-8000-000000000001'::uuid, 'f2000000-0000-4000-8000-000000000001'::uuid, '2002', 'Fairy Byte', 'sparkle-2002', 'SPK-2002', 'Fairy Byte — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Fantasy. Se vende por bote. Ref. 2002.', 120::numeric, 2::int, 1::int),
    ('f1000000-0000-4000-8000-000000000002'::uuid, 'f2000000-0000-4000-8000-000000000002'::uuid, '2003', 'Ice Pixel', 'sparkle-2003', 'SPK-2003', 'Ice Pixel — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Se vende por bote. Ref. 2003.', 120::numeric, 2::int, 2::int),
    ('f1000000-0000-4000-8000-000000000003'::uuid, 'f2000000-0000-4000-8000-000000000003'::uuid, '2004', 'Neon Lime', 'sparkle-2004', 'SPK-2004', 'Neon Lime — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Neon. Se vende por bote. Ref. 2004.', 120::numeric, 2::int, 3::int),
    ('f1000000-0000-4000-8000-000000000004'::uuid, 'f2000000-0000-4000-8000-000000000004'::uuid, '2006', 'Lime Glitch', 'sparkle-2006', 'SPK-2006', 'Lime Glitch — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Neon. Se vende por bote. Ref. 2006.', 120::numeric, 2::int, 4::int),
    ('f1000000-0000-4000-8000-000000000005'::uuid, 'f2000000-0000-4000-8000-000000000005'::uuid, '2007', 'Purple Circuit', 'sparkle-2007', 'SPK-2007', 'Purple Circuit — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Galaxy. Se vende por bote. Ref. 2007.', 120::numeric, 2::int, 5::int),
    ('f1000000-0000-4000-8000-000000000006'::uuid, 'f2000000-0000-4000-8000-000000000006'::uuid, '2008', 'Cotton Byte', 'sparkle-2008', 'SPK-2008', 'Cotton Byte — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Candy. Se vende por bote. Ref. 2008.', 120::numeric, 2::int, 6::int),
    ('f1000000-0000-4000-8000-000000000007'::uuid, 'f2000000-0000-4000-8000-000000000007'::uuid, '2009', 'Neon Lava', 'sparkle-2009', 'SPK-2009', 'Neon Lava — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Neon. Se vende por bote. Ref. 2009.', 120::numeric, 2::int, 7::int),
    ('f1000000-0000-4000-8000-000000000008'::uuid, 'f2000000-0000-4000-8000-000000000008'::uuid, '2010', 'Berry Circuit', 'sparkle-2010', 'SPK-2010', 'Berry Circuit — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Candy. Se vende por bote. Ref. 2010.', 120::numeric, 2::int, 8::int),
    ('f1000000-0000-4000-8000-000000000009'::uuid, 'f2000000-0000-4000-8000-000000000009'::uuid, '2011', 'Pink Pixel Pop', 'sparkle-2011', 'SPK-2011', 'Pink Pixel Pop — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Candy. Se vende por bote. Ref. 2011.', 120::numeric, 2::int, 9::int),
    ('f1000000-0000-4000-8000-000000000010'::uuid, 'f2000000-0000-4000-8000-000000000010'::uuid, '2012', 'Aqua Circuit', 'sparkle-2012', 'SPK-2012', 'Aqua Circuit — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Ocean. Se vende por bote. Ref. 2012.', 120::numeric, 2::int, 10::int),
    ('f1000000-0000-4000-8000-000000000011'::uuid, 'f2000000-0000-4000-8000-000000000011'::uuid, 'C03R', 'Pixie Glow', 'sparkle-c03r', 'SPK-C03R', 'Pixie Glow — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Fantasy. Se vende por bote. Ref. C03R.', 120::numeric, 2::int, 11::int),
    ('f1000000-0000-4000-8000-000000000012'::uuid, 'f2000000-0000-4000-8000-000000000012'::uuid, 'C06R', 'Mermaid Glitch', 'sparkle-c06r', 'SPK-C06R', 'Mermaid Glitch — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Fantasy. Se vende por bote. Ref. C06R.', 120::numeric, 2::int, 12::int),
    ('f1000000-0000-4000-8000-000000000013'::uuid, 'f2000000-0000-4000-8000-000000000013'::uuid, 'C07R-A', 'Rosy Hologram', 'sparkle-c07r-a', 'SPK-C07R-A', 'Rosy Hologram — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Candy. Se vende por bote. Ref. C07R-A.', 120::numeric, 2::int, 13::int),
    ('f1000000-0000-4000-8000-000000000014'::uuid, 'f2000000-0000-4000-8000-000000000014'::uuid, 'C07R-B', 'Mint Circuit', 'sparkle-c07r-b', 'SPK-C07R-B', 'Mint Circuit — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Nature. Se vende por bote. Ref. C07R-B.', 120::numeric, 2::int, 14::int),
    ('f1000000-0000-4000-8000-000000000015'::uuid, 'f2000000-0000-4000-8000-000000000015'::uuid, 'C08R', 'Dragon Core', 'sparkle-c08r', 'SPK-C08R', 'Dragon Core — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Elements. Se vende por bote. Ref. C08R.', 120::numeric, 2::int, 15::int),
    ('f1000000-0000-4000-8000-000000000016'::uuid, 'f2000000-0000-4000-8000-000000000016'::uuid, 'C09R', 'Fuchsia Pop', 'sparkle-c09r', 'SPK-C09R', 'Fuchsia Pop — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Candy. Se vende por bote. Ref. C09R.', 120::numeric, 2::int, 16::int),
    ('f1000000-0000-4000-8000-000000000017'::uuid, 'f2000000-0000-4000-8000-000000000017'::uuid, 'C11R', 'Electric Wave', 'sparkle-c11r', 'SPK-C11R', 'Electric Wave — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Ocean. Se vende por bote. Ref. C11R.', 120::numeric, 2::int, 17::int),
    ('f1000000-0000-4000-8000-000000000018'::uuid, 'f2000000-0000-4000-8000-000000000018'::uuid, 'C13R', 'Emerald Glitch', 'sparkle-c13r', 'SPK-C13R', 'Emerald Glitch — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Nature. Se vende por bote. Ref. C13R.', 120::numeric, 2::int, 18::int),
    ('f1000000-0000-4000-8000-000000000019'::uuid, 'f2000000-0000-4000-8000-000000000019'::uuid, 'C14R', 'Aurora Pearl', 'sparkle-c14r', 'SPK-C14R', 'Aurora Pearl — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Fantasy. Se vende por bote. Ref. C14R.', 120::numeric, 3::int, 19::int),
    ('f1000000-0000-4000-8000-000000000020'::uuid, 'f2000000-0000-4000-8000-000000000020'::uuid, 'C18R', 'Bubblegum Glow', 'sparkle-c18r', 'SPK-C18R', 'Bubblegum Glow — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Candy. Se vende por bote. Ref. C18R.', 120::numeric, 2::int, 20::int),
    ('f1000000-0000-4000-8000-000000000021'::uuid, 'f2000000-0000-4000-8000-000000000021'::uuid, 'C21R', 'Ice Mermaid', 'sparkle-c21r', 'SPK-C21R', 'Ice Mermaid — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Fantasy. Se vende por bote. Ref. C21R.', 120::numeric, 2::int, 21::int),
    ('f1000000-0000-4000-8000-000000000022'::uuid, 'f2000000-0000-4000-8000-000000000022'::uuid, 'C31R', 'Pixie Lime', 'sparkle-c31r', 'SPK-C31R', 'Pixie Lime — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Se vende por bote. Ref. C31R.', 120::numeric, 2::int, 22::int),
    ('f1000000-0000-4000-8000-000000000023'::uuid, 'f2000000-0000-4000-8000-000000000023'::uuid, 'C32R', 'Coral Crush', 'sparkle-c32r', 'SPK-C32R', 'Coral Crush — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Tropical. Se vende por bote. Ref. C32R.', 120::numeric, 2::int, 23::int),
    ('f1000000-0000-4000-8000-000000000024'::uuid, 'f2000000-0000-4000-8000-000000000024'::uuid, 'C34R', 'Tangerine Glitch', 'sparkle-c34r', 'SPK-C34R', 'Tangerine Glitch — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Tropical. Se vende por bote. Ref. C34R.', 120::numeric, 2::int, 24::int),
    ('f1000000-0000-4000-8000-000000000025'::uuid, 'f2000000-0000-4000-8000-000000000025'::uuid, 'C50R', 'Solar Byte', 'sparkle-c50r', 'SPK-C50R', 'Solar Byte — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Neon. Se vende por bote. Ref. C50R.', 120::numeric, 2::int, 25::int),
    ('f1000000-0000-4000-8000-000000000026'::uuid, 'f2000000-0000-4000-8000-000000000026'::uuid, 'G001', 'Pink Afterglow', 'sparkle-g001', 'SPK-G001', 'Pink Afterglow — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Glow. Se vende por bote. Ref. G001.', 165::numeric, 4::int, 26::int),
    ('f1000000-0000-4000-8000-000000000027'::uuid, 'f2000000-0000-4000-8000-000000000027'::uuid, 'G002', 'Solar Flare', 'sparkle-g002', 'SPK-G002', 'Solar Flare — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Glow. Se vende por bote. Ref. G002.', 165::numeric, 4::int, 27::int),
    ('f1000000-0000-4000-8000-000000000028'::uuid, 'f2000000-0000-4000-8000-000000000028'::uuid, 'G003', 'Moonlight Glow', 'sparkle-g003', 'SPK-G003', 'Moonlight Glow — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Glow. Se vende por bote. Ref. G003.', 165::numeric, 4::int, 28::int),
    ('f1000000-0000-4000-8000-000000000029'::uuid, 'f2000000-0000-4000-8000-000000000029'::uuid, 'G004', 'Ghost Light', 'sparkle-g004', 'SPK-G004', 'Ghost Light — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Glow. Se vende por bote. Ref. G004.', 165::numeric, 4::int, 29::int),
    ('f1000000-0000-4000-8000-000000000030'::uuid, 'f2000000-0000-4000-8000-000000000030'::uuid, 'M001', 'Electric Voltage', 'sparkle-m001', 'SPK-M001', 'Electric Voltage — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Galaxy. Se vende por bote. Ref. M001.', 120::numeric, 4::int, 30::int),
    ('f1000000-0000-4000-8000-000000000031'::uuid, 'f2000000-0000-4000-8000-000000000031'::uuid, 'M002', 'Lavender Glitch', 'sparkle-m002', 'SPK-M002', 'Lavender Glitch — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Galaxy. Se vende por bote. Ref. M002.', 120::numeric, 5::int, 31::int),
    ('f1000000-0000-4000-8000-000000000032'::uuid, 'f2000000-0000-4000-8000-000000000032'::uuid, 'M003', 'Raspberry Pixel', 'sparkle-m003', 'SPK-M003', 'Raspberry Pixel — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Candy. Se vende por bote. Ref. M003.', 120::numeric, 4::int, 32::int),
    ('f1000000-0000-4000-8000-000000000033'::uuid, 'f2000000-0000-4000-8000-000000000033'::uuid, 'M004', 'Olive Moss', 'sparkle-m004', 'SPK-M004', 'Olive Moss — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Nature. Se vende por bote. Ref. M004.', 120::numeric, 4::int, 33::int),
    ('f1000000-0000-4000-8000-000000000034'::uuid, 'f2000000-0000-4000-8000-000000000034'::uuid, 'M005', 'Lagoon Matrix', 'sparkle-m005', 'SPK-M005', 'Lagoon Matrix — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Galaxy. Se vende por bote. Ref. M005.', 120::numeric, 4::int, 34::int),
    ('f1000000-0000-4000-8000-000000000035'::uuid, 'f2000000-0000-4000-8000-000000000035'::uuid, 'M006', 'Stardust', 'sparkle-m006', 'SPK-M006', 'Stardust — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Colección Galaxy. Se vende por bote. Ref. M006.', 120::numeric, 4::int, 35::int),
    ('f1000000-0000-4000-8000-000000000036'::uuid, 'f2000000-0000-4000-8000-000000000036'::uuid, 'M007', 'Cosmic Orchid', 'sparkle-m007', 'SPK-M007', 'Cosmic Orchid — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Se vende por bote. Ref. M007.', 120::numeric, 4::int, 36::int),
    ('f1000000-0000-4000-8000-000000000037'::uuid, 'f2000000-0000-4000-8000-000000000037'::uuid, 'LE01', 'Cherry Blossom', 'sparkle-le01', 'SPK-LE01', 'Cherry Blossom — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Se vende por bote. Ref. LE01.', 145::numeric, 1::int, 37::int),
    ('f1000000-0000-4000-8000-000000000038'::uuid, 'f2000000-0000-4000-8000-000000000038'::uuid, 'LE02', 'Cotton Candy', 'sparkle-le02', 'SPK-LE02', 'Cotton Candy — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Se vende por bote. Ref. LE02.', 145::numeric, 1::int, 38::int),
    ('f1000000-0000-4000-8000-000000000039'::uuid, 'f2000000-0000-4000-8000-000000000039'::uuid, 'LE03', 'Rose Quartz', 'sparkle-le03', 'SPK-LE03', 'Rose Quartz — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Se vende por bote. Ref. LE03.', 145::numeric, 1::int, 39::int),
    ('f1000000-0000-4000-8000-000000000040'::uuid, 'f2000000-0000-4000-8000-000000000040'::uuid, 'LE04', 'Royal Amethyst', 'sparkle-le04', 'SPK-LE04', 'Royal Amethyst — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Se vende por bote. Ref. LE04.', 145::numeric, 1::int, 40::int),
    ('f1000000-0000-4000-8000-000000000041'::uuid, 'f2000000-0000-4000-8000-000000000041'::uuid, 'LE05', 'Opal Dream', 'sparkle-le05', 'SPK-LE05', 'Opal Dream — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Se vende por bote. Ref. LE05.', 145::numeric, 1::int, 41::int),
    ('f1000000-0000-4000-8000-000000000042'::uuid, 'f2000000-0000-4000-8000-000000000042'::uuid, 'LE06', 'Pink Champagne', 'sparkle-le06', 'SPK-LE06', 'Pink Champagne — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Se vende por bote. Ref. LE06.', 145::numeric, 1::int, 42::int),
    ('f1000000-0000-4000-8000-000000000043'::uuid, 'f2000000-0000-4000-8000-000000000043'::uuid, 'LE07', 'Black Cherry', 'sparkle-le07', 'SPK-LE07', 'Black Cherry — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Se vende por bote. Ref. LE07.', 145::numeric, 2::int, 43::int),
    ('f1000000-0000-4000-8000-000000000044'::uuid, 'f2000000-0000-4000-8000-000000000044'::uuid, 'LE08', 'Moonstone', 'sparkle-le08', 'SPK-LE08', 'Moonstone — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Se vende por bote. Ref. LE08.', 145::numeric, 1::int, 44::int),
    ('f1000000-0000-4000-8000-000000000045'::uuid, 'f2000000-0000-4000-8000-000000000045'::uuid, 'LE09', 'Peacock Blue', 'sparkle-le09', 'SPK-LE09', 'Peacock Blue — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Se vende por bote. Ref. LE09.', 145::numeric, 1::int, 45::int),
    ('f1000000-0000-4000-8000-000000000046'::uuid, 'f2000000-0000-4000-8000-000000000046'::uuid, 'LE10', 'Royal Sapphire', 'sparkle-le10', 'SPK-LE10', 'Royal Sapphire — glitter chunky de la línea Sparkles de MatrixLab Tumbler. Se vende por bote. Ref. LE10.', 145::numeric, 1::int, 46::int)
),
cat as (
  select id from public.categories where handle = 'repuestos-consumibles'
),
upserted as (
  insert into public.products (
    id, category_id, title, handle, description, base_price, status,
    is_customizable, min_quantity, max_quantity, tags
  )
  select
    s.product_id,
    cat.id,
    s.name,
    s.handle,
    s.description,
    s.price,
    -- Inventario real > 0 en el Excel => disponible; si algún día llega en 0,
    -- el producto queda 'agotado' y deja de poder agregarse al carrito.
    case when s.stock > 0 then 'disponible' else 'agotado' end,
    false,
    1,
    50,
    array['sparkles', 'glitter-chunky', 'matrixlab-tumbler']
  from sparkles s cross join cat
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
  s.variant_id,
  u.id,
  'Bote',
  s.sku,
  s.price,
  s.stock,
  'Bote',
  case when s.stock > 0 then 'disponible' else 'agotado' end
from sparkles s
join upserted u on u.handle = s.handle
on conflict (sku) do update set
  product_id = excluded.product_id,
  title = excluded.title,
  price = excluded.price,
  stock = excluded.stock,
  option_label = excluded.option_label,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Verificación rápida (debe devolver 46 / 46).
-- ---------------------------------------------------------------------------
-- select
--   (select count(*) from public.products p
--      join public.categories c on c.id = p.category_id
--     where c.handle = 'repuestos-consumibles' and p.handle like 'sparkle-%') as productos,
--   (select count(*) from public.product_variants where sku like 'SPK-%') as variantes;
