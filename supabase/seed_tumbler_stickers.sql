-- ============================================================================
-- MatrixLab Tumbler — UV Stickers — Seed aditivo e IDEMPOTENTE
--
-- ARCHIVO GENERADO. No editar a mano:
--   npx tsx scripts/data/build-tumbler-stickers.ts
--
-- Crea/actualiza los 209 UV Stickers como PRODUCTOS INDIVIDUALES dentro de la
-- categoría existente `wraps-glow-finish` (Wraps & Glow Finish), cada uno con
-- UNA sola variante ("Pieza") que lleva el SKU, el precio y el inventario.
--
-- FUENTE DE VERDAD: Catalogo_Stickers_MatrixLab.xlsx (hoja "Catalogo Stickers")
--   columna B -> código      |  columna C -> nombre
--   columna G -> acabado     |  columna H -> inventario (pz)
--   columna I -> SKU         |  columna J -> precio unitario
--   columna L -> handle
-- La columna K ("Total") NO se usa: es inventario x precio, no precio unitario.
--
-- DISTRIBUCIÓN
--   A001-A186  186 productos  $85  24 oz
--   A187-A188    2 productos  $95  Holográfico 16 oz
--   A189-A196    8 productos  $85  Glitter 16 oz
--   A197-A209   13 productos  $45  Mini individual
--   Inventario: 3 pz por SKU — total 627 pz.
--
-- GARANTÍAS
--   * Re-ejecutable: upsert por `handle` (producto) y por `sku` (variante).
--     Si el producto ya existe, CONSERVA su id — no se reasignan ids.
--   * NO borra productos, pedidos, diseños ni usuarios (sin DELETE/TRUNCATE/DROP).
--   * NO crea una segunda categoría ni cambia el handle público
--     /tienda/categoria/wraps-glow-finish.
--   * NO toca los productos genéricos históricos de la categoría (Wrap UV
--     decorativo, Lámina decorativa para vaso, Resina UV): siguen en la base y
--     en el admin; solo se separan de ESTA vista pública.
--   * NO toca Sparkles, otras categorías, pedidos ni Mercado Pago.
--   * NO toca `images`: la foto se resuelve por código desde
--     public/images/tumbler/stickers/<codigo>.webp y el admin puede curar
--     imágenes manualmente sin que el seed las pise.
--   * NO toca `compare_at_price` ni `production_time` (curables desde admin).
--
-- Ejecutar después de supabase/seed_etapa2.sql (que crea la categoría).
-- ============================================================================

-- La categoría debe existir: este seed NUNCA crea una segunda categoría ni
-- cambia el handle público /tienda/categoria/wraps-glow-finish.
do $$
begin
  if not exists (
    select 1 from public.categories where handle = 'wraps-glow-finish'
  ) then
    raise exception
      'Falta la categoría wraps-glow-finish. Ejecuta supabase/seed_etapa2.sql primero.';
  end if;
end $$;

with stickers (
  product_id, variant_id, code, name, handle, sku, description, price, stock, position
) as (
  values
    ('f3000000-0000-4000-8000-000000000001'::uuid, 'f4000000-0000-4000-8000-000000000001'::uuid, 'A001', 'UV Sticker 24oz A001', 'sticker-a001', 'STK-A001', 'UV Sticker 24oz A001 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A001.', 85::numeric, 3::int, 1::int),
    ('f3000000-0000-4000-8000-000000000002'::uuid, 'f4000000-0000-4000-8000-000000000002'::uuid, 'A002', 'UV Sticker 24oz A002', 'sticker-a002', 'STK-A002', 'UV Sticker 24oz A002 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A002.', 85::numeric, 3::int, 2::int),
    ('f3000000-0000-4000-8000-000000000003'::uuid, 'f4000000-0000-4000-8000-000000000003'::uuid, 'A003', 'UV Sticker 24oz A003', 'sticker-a003', 'STK-A003', 'UV Sticker 24oz A003 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A003.', 85::numeric, 3::int, 3::int),
    ('f3000000-0000-4000-8000-000000000004'::uuid, 'f4000000-0000-4000-8000-000000000004'::uuid, 'A004', 'UV Sticker 24oz A004', 'sticker-a004', 'STK-A004', 'UV Sticker 24oz A004 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A004.', 85::numeric, 3::int, 4::int),
    ('f3000000-0000-4000-8000-000000000005'::uuid, 'f4000000-0000-4000-8000-000000000005'::uuid, 'A005', 'UV Sticker 24oz A005', 'sticker-a005', 'STK-A005', 'UV Sticker 24oz A005 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A005.', 85::numeric, 3::int, 5::int),
    ('f3000000-0000-4000-8000-000000000006'::uuid, 'f4000000-0000-4000-8000-000000000006'::uuid, 'A006', 'UV Sticker 24oz A006', 'sticker-a006', 'STK-A006', 'UV Sticker 24oz A006 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A006.', 85::numeric, 3::int, 6::int),
    ('f3000000-0000-4000-8000-000000000007'::uuid, 'f4000000-0000-4000-8000-000000000007'::uuid, 'A007', 'UV Sticker 24oz A007', 'sticker-a007', 'STK-A007', 'UV Sticker 24oz A007 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A007.', 85::numeric, 3::int, 7::int),
    ('f3000000-0000-4000-8000-000000000008'::uuid, 'f4000000-0000-4000-8000-000000000008'::uuid, 'A008', 'UV Sticker 24oz A008', 'sticker-a008', 'STK-A008', 'UV Sticker 24oz A008 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A008.', 85::numeric, 3::int, 8::int),
    ('f3000000-0000-4000-8000-000000000009'::uuid, 'f4000000-0000-4000-8000-000000000009'::uuid, 'A009', 'UV Sticker 24oz A009', 'sticker-a009', 'STK-A009', 'UV Sticker 24oz A009 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A009.', 85::numeric, 3::int, 9::int),
    ('f3000000-0000-4000-8000-000000000010'::uuid, 'f4000000-0000-4000-8000-000000000010'::uuid, 'A010', 'UV Sticker 24oz A010', 'sticker-a010', 'STK-A010', 'UV Sticker 24oz A010 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A010.', 85::numeric, 3::int, 10::int),
    ('f3000000-0000-4000-8000-000000000011'::uuid, 'f4000000-0000-4000-8000-000000000011'::uuid, 'A011', 'UV Sticker 24oz A011', 'sticker-a011', 'STK-A011', 'UV Sticker 24oz A011 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A011.', 85::numeric, 3::int, 11::int),
    ('f3000000-0000-4000-8000-000000000012'::uuid, 'f4000000-0000-4000-8000-000000000012'::uuid, 'A012', 'UV Sticker 24oz A012', 'sticker-a012', 'STK-A012', 'UV Sticker 24oz A012 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A012.', 85::numeric, 3::int, 12::int),
    ('f3000000-0000-4000-8000-000000000013'::uuid, 'f4000000-0000-4000-8000-000000000013'::uuid, 'A013', 'UV Sticker 24oz A013', 'sticker-a013', 'STK-A013', 'UV Sticker 24oz A013 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A013.', 85::numeric, 3::int, 13::int),
    ('f3000000-0000-4000-8000-000000000014'::uuid, 'f4000000-0000-4000-8000-000000000014'::uuid, 'A014', 'UV Sticker 24oz A014', 'sticker-a014', 'STK-A014', 'UV Sticker 24oz A014 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A014.', 85::numeric, 3::int, 14::int),
    ('f3000000-0000-4000-8000-000000000015'::uuid, 'f4000000-0000-4000-8000-000000000015'::uuid, 'A015', 'UV Sticker 24oz A015', 'sticker-a015', 'STK-A015', 'UV Sticker 24oz A015 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A015.', 85::numeric, 3::int, 15::int),
    ('f3000000-0000-4000-8000-000000000016'::uuid, 'f4000000-0000-4000-8000-000000000016'::uuid, 'A016', 'UV Sticker 24oz A016', 'sticker-a016', 'STK-A016', 'UV Sticker 24oz A016 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A016.', 85::numeric, 3::int, 16::int),
    ('f3000000-0000-4000-8000-000000000017'::uuid, 'f4000000-0000-4000-8000-000000000017'::uuid, 'A017', 'UV Sticker 24oz A017', 'sticker-a017', 'STK-A017', 'UV Sticker 24oz A017 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A017.', 85::numeric, 3::int, 17::int),
    ('f3000000-0000-4000-8000-000000000018'::uuid, 'f4000000-0000-4000-8000-000000000018'::uuid, 'A018', 'UV Sticker 24oz A018', 'sticker-a018', 'STK-A018', 'UV Sticker 24oz A018 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A018.', 85::numeric, 3::int, 18::int),
    ('f3000000-0000-4000-8000-000000000019'::uuid, 'f4000000-0000-4000-8000-000000000019'::uuid, 'A019', 'UV Sticker 24oz A019', 'sticker-a019', 'STK-A019', 'UV Sticker 24oz A019 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A019.', 85::numeric, 3::int, 19::int),
    ('f3000000-0000-4000-8000-000000000020'::uuid, 'f4000000-0000-4000-8000-000000000020'::uuid, 'A020', 'UV Sticker 24oz A020', 'sticker-a020', 'STK-A020', 'UV Sticker 24oz A020 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A020.', 85::numeric, 3::int, 20::int),
    ('f3000000-0000-4000-8000-000000000021'::uuid, 'f4000000-0000-4000-8000-000000000021'::uuid, 'A021', 'UV Sticker 24oz A021', 'sticker-a021', 'STK-A021', 'UV Sticker 24oz A021 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A021.', 85::numeric, 3::int, 21::int),
    ('f3000000-0000-4000-8000-000000000022'::uuid, 'f4000000-0000-4000-8000-000000000022'::uuid, 'A022', 'UV Sticker 24oz A022', 'sticker-a022', 'STK-A022', 'UV Sticker 24oz A022 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A022.', 85::numeric, 3::int, 22::int),
    ('f3000000-0000-4000-8000-000000000023'::uuid, 'f4000000-0000-4000-8000-000000000023'::uuid, 'A023', 'UV Sticker 24oz A023', 'sticker-a023', 'STK-A023', 'UV Sticker 24oz A023 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A023.', 85::numeric, 3::int, 23::int),
    ('f3000000-0000-4000-8000-000000000024'::uuid, 'f4000000-0000-4000-8000-000000000024'::uuid, 'A024', 'UV Sticker 24oz A024', 'sticker-a024', 'STK-A024', 'UV Sticker 24oz A024 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A024.', 85::numeric, 3::int, 24::int),
    ('f3000000-0000-4000-8000-000000000025'::uuid, 'f4000000-0000-4000-8000-000000000025'::uuid, 'A025', 'UV Sticker 24oz A025', 'sticker-a025', 'STK-A025', 'UV Sticker 24oz A025 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A025.', 85::numeric, 3::int, 25::int),
    ('f3000000-0000-4000-8000-000000000026'::uuid, 'f4000000-0000-4000-8000-000000000026'::uuid, 'A026', 'UV Sticker 24oz A026', 'sticker-a026', 'STK-A026', 'UV Sticker 24oz A026 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A026.', 85::numeric, 3::int, 26::int),
    ('f3000000-0000-4000-8000-000000000027'::uuid, 'f4000000-0000-4000-8000-000000000027'::uuid, 'A027', 'UV Sticker 24oz A027', 'sticker-a027', 'STK-A027', 'UV Sticker 24oz A027 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A027.', 85::numeric, 3::int, 27::int),
    ('f3000000-0000-4000-8000-000000000028'::uuid, 'f4000000-0000-4000-8000-000000000028'::uuid, 'A028', 'UV Sticker 24oz A028', 'sticker-a028', 'STK-A028', 'UV Sticker 24oz A028 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A028.', 85::numeric, 3::int, 28::int),
    ('f3000000-0000-4000-8000-000000000029'::uuid, 'f4000000-0000-4000-8000-000000000029'::uuid, 'A029', 'UV Sticker 24oz A029', 'sticker-a029', 'STK-A029', 'UV Sticker 24oz A029 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A029.', 85::numeric, 3::int, 29::int),
    ('f3000000-0000-4000-8000-000000000030'::uuid, 'f4000000-0000-4000-8000-000000000030'::uuid, 'A030', 'UV Sticker 24oz A030', 'sticker-a030', 'STK-A030', 'UV Sticker 24oz A030 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A030.', 85::numeric, 3::int, 30::int),
    ('f3000000-0000-4000-8000-000000000031'::uuid, 'f4000000-0000-4000-8000-000000000031'::uuid, 'A031', 'UV Sticker 24oz A031', 'sticker-a031', 'STK-A031', 'UV Sticker 24oz A031 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A031.', 85::numeric, 3::int, 31::int),
    ('f3000000-0000-4000-8000-000000000032'::uuid, 'f4000000-0000-4000-8000-000000000032'::uuid, 'A032', 'UV Sticker 24oz A032', 'sticker-a032', 'STK-A032', 'UV Sticker 24oz A032 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A032.', 85::numeric, 3::int, 32::int),
    ('f3000000-0000-4000-8000-000000000033'::uuid, 'f4000000-0000-4000-8000-000000000033'::uuid, 'A033', 'UV Sticker 24oz A033', 'sticker-a033', 'STK-A033', 'UV Sticker 24oz A033 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A033.', 85::numeric, 3::int, 33::int),
    ('f3000000-0000-4000-8000-000000000034'::uuid, 'f4000000-0000-4000-8000-000000000034'::uuid, 'A034', 'UV Sticker 24oz A034', 'sticker-a034', 'STK-A034', 'UV Sticker 24oz A034 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A034.', 85::numeric, 3::int, 34::int),
    ('f3000000-0000-4000-8000-000000000035'::uuid, 'f4000000-0000-4000-8000-000000000035'::uuid, 'A035', 'UV Sticker 24oz A035', 'sticker-a035', 'STK-A035', 'UV Sticker 24oz A035 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A035.', 85::numeric, 3::int, 35::int),
    ('f3000000-0000-4000-8000-000000000036'::uuid, 'f4000000-0000-4000-8000-000000000036'::uuid, 'A036', 'UV Sticker 24oz A036', 'sticker-a036', 'STK-A036', 'UV Sticker 24oz A036 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A036.', 85::numeric, 3::int, 36::int),
    ('f3000000-0000-4000-8000-000000000037'::uuid, 'f4000000-0000-4000-8000-000000000037'::uuid, 'A037', 'UV Sticker 24oz A037', 'sticker-a037', 'STK-A037', 'UV Sticker 24oz A037 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A037.', 85::numeric, 3::int, 37::int),
    ('f3000000-0000-4000-8000-000000000038'::uuid, 'f4000000-0000-4000-8000-000000000038'::uuid, 'A038', 'UV Sticker 24oz A038', 'sticker-a038', 'STK-A038', 'UV Sticker 24oz A038 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A038.', 85::numeric, 3::int, 38::int),
    ('f3000000-0000-4000-8000-000000000039'::uuid, 'f4000000-0000-4000-8000-000000000039'::uuid, 'A039', 'UV Sticker 24oz A039', 'sticker-a039', 'STK-A039', 'UV Sticker 24oz A039 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A039.', 85::numeric, 3::int, 39::int),
    ('f3000000-0000-4000-8000-000000000040'::uuid, 'f4000000-0000-4000-8000-000000000040'::uuid, 'A040', 'UV Sticker 24oz A040', 'sticker-a040', 'STK-A040', 'UV Sticker 24oz A040 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A040.', 85::numeric, 3::int, 40::int),
    ('f3000000-0000-4000-8000-000000000041'::uuid, 'f4000000-0000-4000-8000-000000000041'::uuid, 'A041', 'UV Sticker 24oz A041', 'sticker-a041', 'STK-A041', 'UV Sticker 24oz A041 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A041.', 85::numeric, 3::int, 41::int),
    ('f3000000-0000-4000-8000-000000000042'::uuid, 'f4000000-0000-4000-8000-000000000042'::uuid, 'A042', 'UV Sticker 24oz A042', 'sticker-a042', 'STK-A042', 'UV Sticker 24oz A042 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A042.', 85::numeric, 3::int, 42::int),
    ('f3000000-0000-4000-8000-000000000043'::uuid, 'f4000000-0000-4000-8000-000000000043'::uuid, 'A043', 'UV Sticker 24oz A043', 'sticker-a043', 'STK-A043', 'UV Sticker 24oz A043 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A043.', 85::numeric, 3::int, 43::int),
    ('f3000000-0000-4000-8000-000000000044'::uuid, 'f4000000-0000-4000-8000-000000000044'::uuid, 'A044', 'UV Sticker 24oz A044', 'sticker-a044', 'STK-A044', 'UV Sticker 24oz A044 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A044.', 85::numeric, 3::int, 44::int),
    ('f3000000-0000-4000-8000-000000000045'::uuid, 'f4000000-0000-4000-8000-000000000045'::uuid, 'A045', 'UV Sticker 24oz A045', 'sticker-a045', 'STK-A045', 'UV Sticker 24oz A045 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A045.', 85::numeric, 3::int, 45::int),
    ('f3000000-0000-4000-8000-000000000046'::uuid, 'f4000000-0000-4000-8000-000000000046'::uuid, 'A046', 'UV Sticker 24oz A046', 'sticker-a046', 'STK-A046', 'UV Sticker 24oz A046 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A046.', 85::numeric, 3::int, 46::int),
    ('f3000000-0000-4000-8000-000000000047'::uuid, 'f4000000-0000-4000-8000-000000000047'::uuid, 'A047', 'UV Sticker 24oz A047', 'sticker-a047', 'STK-A047', 'UV Sticker 24oz A047 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A047.', 85::numeric, 3::int, 47::int),
    ('f3000000-0000-4000-8000-000000000048'::uuid, 'f4000000-0000-4000-8000-000000000048'::uuid, 'A048', 'UV Sticker 24oz A048', 'sticker-a048', 'STK-A048', 'UV Sticker 24oz A048 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A048.', 85::numeric, 3::int, 48::int),
    ('f3000000-0000-4000-8000-000000000049'::uuid, 'f4000000-0000-4000-8000-000000000049'::uuid, 'A049', 'UV Sticker 24oz A049', 'sticker-a049', 'STK-A049', 'UV Sticker 24oz A049 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A049.', 85::numeric, 3::int, 49::int),
    ('f3000000-0000-4000-8000-000000000050'::uuid, 'f4000000-0000-4000-8000-000000000050'::uuid, 'A050', 'UV Sticker 24oz A050', 'sticker-a050', 'STK-A050', 'UV Sticker 24oz A050 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A050.', 85::numeric, 3::int, 50::int),
    ('f3000000-0000-4000-8000-000000000051'::uuid, 'f4000000-0000-4000-8000-000000000051'::uuid, 'A051', 'UV Sticker 24oz A051', 'sticker-a051', 'STK-A051', 'UV Sticker 24oz A051 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A051.', 85::numeric, 3::int, 51::int),
    ('f3000000-0000-4000-8000-000000000052'::uuid, 'f4000000-0000-4000-8000-000000000052'::uuid, 'A052', 'UV Sticker 24oz A052', 'sticker-a052', 'STK-A052', 'UV Sticker 24oz A052 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A052.', 85::numeric, 3::int, 52::int),
    ('f3000000-0000-4000-8000-000000000053'::uuid, 'f4000000-0000-4000-8000-000000000053'::uuid, 'A053', 'UV Sticker 24oz A053', 'sticker-a053', 'STK-A053', 'UV Sticker 24oz A053 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A053.', 85::numeric, 3::int, 53::int),
    ('f3000000-0000-4000-8000-000000000054'::uuid, 'f4000000-0000-4000-8000-000000000054'::uuid, 'A054', 'UV Sticker 24oz A054', 'sticker-a054', 'STK-A054', 'UV Sticker 24oz A054 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A054.', 85::numeric, 3::int, 54::int),
    ('f3000000-0000-4000-8000-000000000055'::uuid, 'f4000000-0000-4000-8000-000000000055'::uuid, 'A055', 'UV Sticker 24oz A055', 'sticker-a055', 'STK-A055', 'UV Sticker 24oz A055 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A055.', 85::numeric, 3::int, 55::int),
    ('f3000000-0000-4000-8000-000000000056'::uuid, 'f4000000-0000-4000-8000-000000000056'::uuid, 'A056', 'UV Sticker 24oz A056', 'sticker-a056', 'STK-A056', 'UV Sticker 24oz A056 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A056.', 85::numeric, 3::int, 56::int),
    ('f3000000-0000-4000-8000-000000000057'::uuid, 'f4000000-0000-4000-8000-000000000057'::uuid, 'A057', 'UV Sticker 24oz A057', 'sticker-a057', 'STK-A057', 'UV Sticker 24oz A057 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A057.', 85::numeric, 3::int, 57::int),
    ('f3000000-0000-4000-8000-000000000058'::uuid, 'f4000000-0000-4000-8000-000000000058'::uuid, 'A058', 'UV Sticker 24oz A058', 'sticker-a058', 'STK-A058', 'UV Sticker 24oz A058 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A058.', 85::numeric, 3::int, 58::int),
    ('f3000000-0000-4000-8000-000000000059'::uuid, 'f4000000-0000-4000-8000-000000000059'::uuid, 'A059', 'UV Sticker 24oz A059', 'sticker-a059', 'STK-A059', 'UV Sticker 24oz A059 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A059.', 85::numeric, 3::int, 59::int),
    ('f3000000-0000-4000-8000-000000000060'::uuid, 'f4000000-0000-4000-8000-000000000060'::uuid, 'A060', 'UV Sticker 24oz A060', 'sticker-a060', 'STK-A060', 'UV Sticker 24oz A060 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A060.', 85::numeric, 3::int, 60::int),
    ('f3000000-0000-4000-8000-000000000061'::uuid, 'f4000000-0000-4000-8000-000000000061'::uuid, 'A061', 'UV Sticker 24oz A061', 'sticker-a061', 'STK-A061', 'UV Sticker 24oz A061 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A061.', 85::numeric, 3::int, 61::int),
    ('f3000000-0000-4000-8000-000000000062'::uuid, 'f4000000-0000-4000-8000-000000000062'::uuid, 'A062', 'UV Sticker 24oz A062', 'sticker-a062', 'STK-A062', 'UV Sticker 24oz A062 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A062.', 85::numeric, 3::int, 62::int),
    ('f3000000-0000-4000-8000-000000000063'::uuid, 'f4000000-0000-4000-8000-000000000063'::uuid, 'A063', 'UV Sticker 24oz A063', 'sticker-a063', 'STK-A063', 'UV Sticker 24oz A063 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A063.', 85::numeric, 3::int, 63::int),
    ('f3000000-0000-4000-8000-000000000064'::uuid, 'f4000000-0000-4000-8000-000000000064'::uuid, 'A064', 'UV Sticker 24oz A064', 'sticker-a064', 'STK-A064', 'UV Sticker 24oz A064 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A064.', 85::numeric, 3::int, 64::int),
    ('f3000000-0000-4000-8000-000000000065'::uuid, 'f4000000-0000-4000-8000-000000000065'::uuid, 'A065', 'UV Sticker 24oz A065', 'sticker-a065', 'STK-A065', 'UV Sticker 24oz A065 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A065.', 85::numeric, 3::int, 65::int),
    ('f3000000-0000-4000-8000-000000000066'::uuid, 'f4000000-0000-4000-8000-000000000066'::uuid, 'A066', 'UV Sticker 24oz A066', 'sticker-a066', 'STK-A066', 'UV Sticker 24oz A066 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A066.', 85::numeric, 3::int, 66::int),
    ('f3000000-0000-4000-8000-000000000067'::uuid, 'f4000000-0000-4000-8000-000000000067'::uuid, 'A067', 'UV Sticker 24oz A067', 'sticker-a067', 'STK-A067', 'UV Sticker 24oz A067 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A067.', 85::numeric, 3::int, 67::int),
    ('f3000000-0000-4000-8000-000000000068'::uuid, 'f4000000-0000-4000-8000-000000000068'::uuid, 'A068', 'UV Sticker 24oz A068', 'sticker-a068', 'STK-A068', 'UV Sticker 24oz A068 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A068.', 85::numeric, 3::int, 68::int),
    ('f3000000-0000-4000-8000-000000000069'::uuid, 'f4000000-0000-4000-8000-000000000069'::uuid, 'A069', 'UV Sticker 24oz A069', 'sticker-a069', 'STK-A069', 'UV Sticker 24oz A069 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A069.', 85::numeric, 3::int, 69::int),
    ('f3000000-0000-4000-8000-000000000070'::uuid, 'f4000000-0000-4000-8000-000000000070'::uuid, 'A070', 'UV Sticker 24oz A070', 'sticker-a070', 'STK-A070', 'UV Sticker 24oz A070 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A070.', 85::numeric, 3::int, 70::int),
    ('f3000000-0000-4000-8000-000000000071'::uuid, 'f4000000-0000-4000-8000-000000000071'::uuid, 'A071', 'UV Sticker 24oz A071', 'sticker-a071', 'STK-A071', 'UV Sticker 24oz A071 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A071.', 85::numeric, 3::int, 71::int),
    ('f3000000-0000-4000-8000-000000000072'::uuid, 'f4000000-0000-4000-8000-000000000072'::uuid, 'A072', 'UV Sticker 24oz A072', 'sticker-a072', 'STK-A072', 'UV Sticker 24oz A072 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A072.', 85::numeric, 3::int, 72::int),
    ('f3000000-0000-4000-8000-000000000073'::uuid, 'f4000000-0000-4000-8000-000000000073'::uuid, 'A073', 'UV Sticker 24oz A073', 'sticker-a073', 'STK-A073', 'UV Sticker 24oz A073 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A073.', 85::numeric, 3::int, 73::int),
    ('f3000000-0000-4000-8000-000000000074'::uuid, 'f4000000-0000-4000-8000-000000000074'::uuid, 'A074', 'UV Sticker 24oz A074', 'sticker-a074', 'STK-A074', 'UV Sticker 24oz A074 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A074.', 85::numeric, 3::int, 74::int),
    ('f3000000-0000-4000-8000-000000000075'::uuid, 'f4000000-0000-4000-8000-000000000075'::uuid, 'A075', 'UV Sticker 24oz A075', 'sticker-a075', 'STK-A075', 'UV Sticker 24oz A075 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A075.', 85::numeric, 3::int, 75::int),
    ('f3000000-0000-4000-8000-000000000076'::uuid, 'f4000000-0000-4000-8000-000000000076'::uuid, 'A076', 'UV Sticker 24oz A076', 'sticker-a076', 'STK-A076', 'UV Sticker 24oz A076 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A076.', 85::numeric, 3::int, 76::int),
    ('f3000000-0000-4000-8000-000000000077'::uuid, 'f4000000-0000-4000-8000-000000000077'::uuid, 'A077', 'UV Sticker 24oz A077', 'sticker-a077', 'STK-A077', 'UV Sticker 24oz A077 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A077.', 85::numeric, 3::int, 77::int),
    ('f3000000-0000-4000-8000-000000000078'::uuid, 'f4000000-0000-4000-8000-000000000078'::uuid, 'A078', 'UV Sticker 24oz A078', 'sticker-a078', 'STK-A078', 'UV Sticker 24oz A078 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A078.', 85::numeric, 3::int, 78::int),
    ('f3000000-0000-4000-8000-000000000079'::uuid, 'f4000000-0000-4000-8000-000000000079'::uuid, 'A079', 'UV Sticker 24oz A079', 'sticker-a079', 'STK-A079', 'UV Sticker 24oz A079 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A079.', 85::numeric, 3::int, 79::int),
    ('f3000000-0000-4000-8000-000000000080'::uuid, 'f4000000-0000-4000-8000-000000000080'::uuid, 'A080', 'UV Sticker 24oz A080', 'sticker-a080', 'STK-A080', 'UV Sticker 24oz A080 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A080.', 85::numeric, 3::int, 80::int),
    ('f3000000-0000-4000-8000-000000000081'::uuid, 'f4000000-0000-4000-8000-000000000081'::uuid, 'A081', 'UV Sticker 24oz A081', 'sticker-a081', 'STK-A081', 'UV Sticker 24oz A081 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A081.', 85::numeric, 3::int, 81::int),
    ('f3000000-0000-4000-8000-000000000082'::uuid, 'f4000000-0000-4000-8000-000000000082'::uuid, 'A082', 'UV Sticker 24oz A082', 'sticker-a082', 'STK-A082', 'UV Sticker 24oz A082 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A082.', 85::numeric, 3::int, 82::int),
    ('f3000000-0000-4000-8000-000000000083'::uuid, 'f4000000-0000-4000-8000-000000000083'::uuid, 'A083', 'UV Sticker 24oz A083', 'sticker-a083', 'STK-A083', 'UV Sticker 24oz A083 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A083.', 85::numeric, 3::int, 83::int),
    ('f3000000-0000-4000-8000-000000000084'::uuid, 'f4000000-0000-4000-8000-000000000084'::uuid, 'A084', 'UV Sticker 24oz A084', 'sticker-a084', 'STK-A084', 'UV Sticker 24oz A084 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A084.', 85::numeric, 3::int, 84::int),
    ('f3000000-0000-4000-8000-000000000085'::uuid, 'f4000000-0000-4000-8000-000000000085'::uuid, 'A085', 'UV Sticker 24oz A085', 'sticker-a085', 'STK-A085', 'UV Sticker 24oz A085 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A085.', 85::numeric, 3::int, 85::int),
    ('f3000000-0000-4000-8000-000000000086'::uuid, 'f4000000-0000-4000-8000-000000000086'::uuid, 'A086', 'UV Sticker 24oz A086', 'sticker-a086', 'STK-A086', 'UV Sticker 24oz A086 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A086.', 85::numeric, 3::int, 86::int),
    ('f3000000-0000-4000-8000-000000000087'::uuid, 'f4000000-0000-4000-8000-000000000087'::uuid, 'A087', 'UV Sticker 24oz A087', 'sticker-a087', 'STK-A087', 'UV Sticker 24oz A087 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A087.', 85::numeric, 3::int, 87::int),
    ('f3000000-0000-4000-8000-000000000088'::uuid, 'f4000000-0000-4000-8000-000000000088'::uuid, 'A088', 'UV Sticker 24oz A088', 'sticker-a088', 'STK-A088', 'UV Sticker 24oz A088 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A088.', 85::numeric, 3::int, 88::int),
    ('f3000000-0000-4000-8000-000000000089'::uuid, 'f4000000-0000-4000-8000-000000000089'::uuid, 'A089', 'UV Sticker 24oz A089', 'sticker-a089', 'STK-A089', 'UV Sticker 24oz A089 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A089.', 85::numeric, 3::int, 89::int),
    ('f3000000-0000-4000-8000-000000000090'::uuid, 'f4000000-0000-4000-8000-000000000090'::uuid, 'A090', 'UV Sticker 24oz A090', 'sticker-a090', 'STK-A090', 'UV Sticker 24oz A090 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A090.', 85::numeric, 3::int, 90::int),
    ('f3000000-0000-4000-8000-000000000091'::uuid, 'f4000000-0000-4000-8000-000000000091'::uuid, 'A091', 'UV Sticker 24oz A091', 'sticker-a091', 'STK-A091', 'UV Sticker 24oz A091 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A091.', 85::numeric, 3::int, 91::int),
    ('f3000000-0000-4000-8000-000000000092'::uuid, 'f4000000-0000-4000-8000-000000000092'::uuid, 'A092', 'UV Sticker 24oz A092', 'sticker-a092', 'STK-A092', 'UV Sticker 24oz A092 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A092.', 85::numeric, 3::int, 92::int),
    ('f3000000-0000-4000-8000-000000000093'::uuid, 'f4000000-0000-4000-8000-000000000093'::uuid, 'A093', 'UV Sticker 24oz A093', 'sticker-a093', 'STK-A093', 'UV Sticker 24oz A093 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A093.', 85::numeric, 3::int, 93::int),
    ('f3000000-0000-4000-8000-000000000094'::uuid, 'f4000000-0000-4000-8000-000000000094'::uuid, 'A094', 'UV Sticker 24oz A094', 'sticker-a094', 'STK-A094', 'UV Sticker 24oz A094 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A094.', 85::numeric, 3::int, 94::int),
    ('f3000000-0000-4000-8000-000000000095'::uuid, 'f4000000-0000-4000-8000-000000000095'::uuid, 'A095', 'UV Sticker 24oz A095', 'sticker-a095', 'STK-A095', 'UV Sticker 24oz A095 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A095.', 85::numeric, 3::int, 95::int),
    ('f3000000-0000-4000-8000-000000000096'::uuid, 'f4000000-0000-4000-8000-000000000096'::uuid, 'A096', 'UV Sticker 24oz A096', 'sticker-a096', 'STK-A096', 'UV Sticker 24oz A096 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A096.', 85::numeric, 3::int, 96::int),
    ('f3000000-0000-4000-8000-000000000097'::uuid, 'f4000000-0000-4000-8000-000000000097'::uuid, 'A097', 'UV Sticker 24oz A097', 'sticker-a097', 'STK-A097', 'UV Sticker 24oz A097 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A097.', 85::numeric, 3::int, 97::int),
    ('f3000000-0000-4000-8000-000000000098'::uuid, 'f4000000-0000-4000-8000-000000000098'::uuid, 'A098', 'UV Sticker 24oz A098', 'sticker-a098', 'STK-A098', 'UV Sticker 24oz A098 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A098.', 85::numeric, 3::int, 98::int),
    ('f3000000-0000-4000-8000-000000000099'::uuid, 'f4000000-0000-4000-8000-000000000099'::uuid, 'A099', 'UV Sticker 24oz A099', 'sticker-a099', 'STK-A099', 'UV Sticker 24oz A099 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A099.', 85::numeric, 3::int, 99::int),
    ('f3000000-0000-4000-8000-000000000100'::uuid, 'f4000000-0000-4000-8000-000000000100'::uuid, 'A100', 'UV Sticker 24oz A100', 'sticker-a100', 'STK-A100', 'UV Sticker 24oz A100 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A100.', 85::numeric, 3::int, 100::int),
    ('f3000000-0000-4000-8000-000000000101'::uuid, 'f4000000-0000-4000-8000-000000000101'::uuid, 'A101', 'UV Sticker 24oz A101', 'sticker-a101', 'STK-A101', 'UV Sticker 24oz A101 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A101.', 85::numeric, 3::int, 101::int),
    ('f3000000-0000-4000-8000-000000000102'::uuid, 'f4000000-0000-4000-8000-000000000102'::uuid, 'A102', 'UV Sticker 24oz A102', 'sticker-a102', 'STK-A102', 'UV Sticker 24oz A102 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A102.', 85::numeric, 3::int, 102::int),
    ('f3000000-0000-4000-8000-000000000103'::uuid, 'f4000000-0000-4000-8000-000000000103'::uuid, 'A103', 'UV Sticker 24oz A103', 'sticker-a103', 'STK-A103', 'UV Sticker 24oz A103 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A103.', 85::numeric, 3::int, 103::int),
    ('f3000000-0000-4000-8000-000000000104'::uuid, 'f4000000-0000-4000-8000-000000000104'::uuid, 'A104', 'UV Sticker 24oz A104', 'sticker-a104', 'STK-A104', 'UV Sticker 24oz A104 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A104.', 85::numeric, 3::int, 104::int),
    ('f3000000-0000-4000-8000-000000000105'::uuid, 'f4000000-0000-4000-8000-000000000105'::uuid, 'A105', 'UV Sticker 24oz A105', 'sticker-a105', 'STK-A105', 'UV Sticker 24oz A105 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A105.', 85::numeric, 3::int, 105::int),
    ('f3000000-0000-4000-8000-000000000106'::uuid, 'f4000000-0000-4000-8000-000000000106'::uuid, 'A106', 'UV Sticker 24oz A106', 'sticker-a106', 'STK-A106', 'UV Sticker 24oz A106 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A106.', 85::numeric, 3::int, 106::int),
    ('f3000000-0000-4000-8000-000000000107'::uuid, 'f4000000-0000-4000-8000-000000000107'::uuid, 'A107', 'UV Sticker 24oz A107', 'sticker-a107', 'STK-A107', 'UV Sticker 24oz A107 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A107.', 85::numeric, 3::int, 107::int),
    ('f3000000-0000-4000-8000-000000000108'::uuid, 'f4000000-0000-4000-8000-000000000108'::uuid, 'A108', 'UV Sticker 24oz A108', 'sticker-a108', 'STK-A108', 'UV Sticker 24oz A108 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A108.', 85::numeric, 3::int, 108::int),
    ('f3000000-0000-4000-8000-000000000109'::uuid, 'f4000000-0000-4000-8000-000000000109'::uuid, 'A109', 'UV Sticker 24oz A109', 'sticker-a109', 'STK-A109', 'UV Sticker 24oz A109 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A109.', 85::numeric, 3::int, 109::int),
    ('f3000000-0000-4000-8000-000000000110'::uuid, 'f4000000-0000-4000-8000-000000000110'::uuid, 'A110', 'UV Sticker 24oz A110', 'sticker-a110', 'STK-A110', 'UV Sticker 24oz A110 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A110.', 85::numeric, 3::int, 110::int),
    ('f3000000-0000-4000-8000-000000000111'::uuid, 'f4000000-0000-4000-8000-000000000111'::uuid, 'A111', 'UV Sticker 24oz A111', 'sticker-a111', 'STK-A111', 'UV Sticker 24oz A111 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A111.', 85::numeric, 3::int, 111::int),
    ('f3000000-0000-4000-8000-000000000112'::uuid, 'f4000000-0000-4000-8000-000000000112'::uuid, 'A112', 'UV Sticker 24oz A112', 'sticker-a112', 'STK-A112', 'UV Sticker 24oz A112 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A112.', 85::numeric, 3::int, 112::int),
    ('f3000000-0000-4000-8000-000000000113'::uuid, 'f4000000-0000-4000-8000-000000000113'::uuid, 'A113', 'UV Sticker 24oz A113', 'sticker-a113', 'STK-A113', 'UV Sticker 24oz A113 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A113.', 85::numeric, 3::int, 113::int),
    ('f3000000-0000-4000-8000-000000000114'::uuid, 'f4000000-0000-4000-8000-000000000114'::uuid, 'A114', 'UV Sticker 24oz A114', 'sticker-a114', 'STK-A114', 'UV Sticker 24oz A114 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A114.', 85::numeric, 3::int, 114::int),
    ('f3000000-0000-4000-8000-000000000115'::uuid, 'f4000000-0000-4000-8000-000000000115'::uuid, 'A115', 'UV Sticker 24oz A115', 'sticker-a115', 'STK-A115', 'UV Sticker 24oz A115 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A115.', 85::numeric, 3::int, 115::int),
    ('f3000000-0000-4000-8000-000000000116'::uuid, 'f4000000-0000-4000-8000-000000000116'::uuid, 'A116', 'UV Sticker 24oz A116', 'sticker-a116', 'STK-A116', 'UV Sticker 24oz A116 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A116.', 85::numeric, 3::int, 116::int),
    ('f3000000-0000-4000-8000-000000000117'::uuid, 'f4000000-0000-4000-8000-000000000117'::uuid, 'A117', 'UV Sticker 24oz A117', 'sticker-a117', 'STK-A117', 'UV Sticker 24oz A117 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A117.', 85::numeric, 3::int, 117::int),
    ('f3000000-0000-4000-8000-000000000118'::uuid, 'f4000000-0000-4000-8000-000000000118'::uuid, 'A118', 'UV Sticker 24oz A118', 'sticker-a118', 'STK-A118', 'UV Sticker 24oz A118 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A118.', 85::numeric, 3::int, 118::int),
    ('f3000000-0000-4000-8000-000000000119'::uuid, 'f4000000-0000-4000-8000-000000000119'::uuid, 'A119', 'UV Sticker 24oz A119', 'sticker-a119', 'STK-A119', 'UV Sticker 24oz A119 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A119.', 85::numeric, 3::int, 119::int),
    ('f3000000-0000-4000-8000-000000000120'::uuid, 'f4000000-0000-4000-8000-000000000120'::uuid, 'A120', 'UV Sticker 24oz A120', 'sticker-a120', 'STK-A120', 'UV Sticker 24oz A120 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A120.', 85::numeric, 3::int, 120::int),
    ('f3000000-0000-4000-8000-000000000121'::uuid, 'f4000000-0000-4000-8000-000000000121'::uuid, 'A121', 'UV Sticker 24oz A121', 'sticker-a121', 'STK-A121', 'UV Sticker 24oz A121 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A121.', 85::numeric, 3::int, 121::int),
    ('f3000000-0000-4000-8000-000000000122'::uuid, 'f4000000-0000-4000-8000-000000000122'::uuid, 'A122', 'UV Sticker 24oz A122', 'sticker-a122', 'STK-A122', 'UV Sticker 24oz A122 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A122.', 85::numeric, 3::int, 122::int),
    ('f3000000-0000-4000-8000-000000000123'::uuid, 'f4000000-0000-4000-8000-000000000123'::uuid, 'A123', 'UV Sticker 24oz A123', 'sticker-a123', 'STK-A123', 'UV Sticker 24oz A123 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A123.', 85::numeric, 3::int, 123::int),
    ('f3000000-0000-4000-8000-000000000124'::uuid, 'f4000000-0000-4000-8000-000000000124'::uuid, 'A124', 'UV Sticker 24oz A124', 'sticker-a124', 'STK-A124', 'UV Sticker 24oz A124 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A124.', 85::numeric, 3::int, 124::int),
    ('f3000000-0000-4000-8000-000000000125'::uuid, 'f4000000-0000-4000-8000-000000000125'::uuid, 'A125', 'UV Sticker 24oz A125', 'sticker-a125', 'STK-A125', 'UV Sticker 24oz A125 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A125.', 85::numeric, 3::int, 125::int),
    ('f3000000-0000-4000-8000-000000000126'::uuid, 'f4000000-0000-4000-8000-000000000126'::uuid, 'A126', 'UV Sticker 24oz A126', 'sticker-a126', 'STK-A126', 'UV Sticker 24oz A126 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A126.', 85::numeric, 3::int, 126::int),
    ('f3000000-0000-4000-8000-000000000127'::uuid, 'f4000000-0000-4000-8000-000000000127'::uuid, 'A127', 'UV Sticker 24oz A127', 'sticker-a127', 'STK-A127', 'UV Sticker 24oz A127 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A127.', 85::numeric, 3::int, 127::int),
    ('f3000000-0000-4000-8000-000000000128'::uuid, 'f4000000-0000-4000-8000-000000000128'::uuid, 'A128', 'UV Sticker 24oz A128', 'sticker-a128', 'STK-A128', 'UV Sticker 24oz A128 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A128.', 85::numeric, 3::int, 128::int),
    ('f3000000-0000-4000-8000-000000000129'::uuid, 'f4000000-0000-4000-8000-000000000129'::uuid, 'A129', 'UV Sticker 24oz A129', 'sticker-a129', 'STK-A129', 'UV Sticker 24oz A129 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A129.', 85::numeric, 3::int, 129::int),
    ('f3000000-0000-4000-8000-000000000130'::uuid, 'f4000000-0000-4000-8000-000000000130'::uuid, 'A130', 'UV Sticker 24oz A130', 'sticker-a130', 'STK-A130', 'UV Sticker 24oz A130 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A130.', 85::numeric, 3::int, 130::int),
    ('f3000000-0000-4000-8000-000000000131'::uuid, 'f4000000-0000-4000-8000-000000000131'::uuid, 'A131', 'UV Sticker 24oz A131', 'sticker-a131', 'STK-A131', 'UV Sticker 24oz A131 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A131.', 85::numeric, 3::int, 131::int),
    ('f3000000-0000-4000-8000-000000000132'::uuid, 'f4000000-0000-4000-8000-000000000132'::uuid, 'A132', 'UV Sticker 24oz A132', 'sticker-a132', 'STK-A132', 'UV Sticker 24oz A132 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A132.', 85::numeric, 3::int, 132::int),
    ('f3000000-0000-4000-8000-000000000133'::uuid, 'f4000000-0000-4000-8000-000000000133'::uuid, 'A133', 'UV Sticker 24oz A133', 'sticker-a133', 'STK-A133', 'UV Sticker 24oz A133 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A133.', 85::numeric, 3::int, 133::int),
    ('f3000000-0000-4000-8000-000000000134'::uuid, 'f4000000-0000-4000-8000-000000000134'::uuid, 'A134', 'UV Sticker 24oz A134', 'sticker-a134', 'STK-A134', 'UV Sticker 24oz A134 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A134.', 85::numeric, 3::int, 134::int),
    ('f3000000-0000-4000-8000-000000000135'::uuid, 'f4000000-0000-4000-8000-000000000135'::uuid, 'A135', 'UV Sticker 24oz A135', 'sticker-a135', 'STK-A135', 'UV Sticker 24oz A135 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A135.', 85::numeric, 3::int, 135::int),
    ('f3000000-0000-4000-8000-000000000136'::uuid, 'f4000000-0000-4000-8000-000000000136'::uuid, 'A136', 'UV Sticker 24oz A136', 'sticker-a136', 'STK-A136', 'UV Sticker 24oz A136 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A136.', 85::numeric, 3::int, 136::int),
    ('f3000000-0000-4000-8000-000000000137'::uuid, 'f4000000-0000-4000-8000-000000000137'::uuid, 'A137', 'UV Sticker 24oz A137', 'sticker-a137', 'STK-A137', 'UV Sticker 24oz A137 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A137.', 85::numeric, 3::int, 137::int),
    ('f3000000-0000-4000-8000-000000000138'::uuid, 'f4000000-0000-4000-8000-000000000138'::uuid, 'A138', 'UV Sticker 24oz A138', 'sticker-a138', 'STK-A138', 'UV Sticker 24oz A138 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A138.', 85::numeric, 3::int, 138::int),
    ('f3000000-0000-4000-8000-000000000139'::uuid, 'f4000000-0000-4000-8000-000000000139'::uuid, 'A139', 'UV Sticker 24oz A139', 'sticker-a139', 'STK-A139', 'UV Sticker 24oz A139 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A139.', 85::numeric, 3::int, 139::int),
    ('f3000000-0000-4000-8000-000000000140'::uuid, 'f4000000-0000-4000-8000-000000000140'::uuid, 'A140', 'UV Sticker 24oz A140', 'sticker-a140', 'STK-A140', 'UV Sticker 24oz A140 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A140.', 85::numeric, 3::int, 140::int),
    ('f3000000-0000-4000-8000-000000000141'::uuid, 'f4000000-0000-4000-8000-000000000141'::uuid, 'A141', 'UV Sticker 24oz A141', 'sticker-a141', 'STK-A141', 'UV Sticker 24oz A141 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A141.', 85::numeric, 3::int, 141::int),
    ('f3000000-0000-4000-8000-000000000142'::uuid, 'f4000000-0000-4000-8000-000000000142'::uuid, 'A142', 'UV Sticker 24oz A142', 'sticker-a142', 'STK-A142', 'UV Sticker 24oz A142 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A142.', 85::numeric, 3::int, 142::int),
    ('f3000000-0000-4000-8000-000000000143'::uuid, 'f4000000-0000-4000-8000-000000000143'::uuid, 'A143', 'UV Sticker 24oz A143', 'sticker-a143', 'STK-A143', 'UV Sticker 24oz A143 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A143.', 85::numeric, 3::int, 143::int),
    ('f3000000-0000-4000-8000-000000000144'::uuid, 'f4000000-0000-4000-8000-000000000144'::uuid, 'A144', 'UV Sticker 24oz A144', 'sticker-a144', 'STK-A144', 'UV Sticker 24oz A144 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A144.', 85::numeric, 3::int, 144::int),
    ('f3000000-0000-4000-8000-000000000145'::uuid, 'f4000000-0000-4000-8000-000000000145'::uuid, 'A145', 'UV Sticker 24oz A145', 'sticker-a145', 'STK-A145', 'UV Sticker 24oz A145 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A145.', 85::numeric, 3::int, 145::int),
    ('f3000000-0000-4000-8000-000000000146'::uuid, 'f4000000-0000-4000-8000-000000000146'::uuid, 'A146', 'UV Sticker 24oz A146', 'sticker-a146', 'STK-A146', 'UV Sticker 24oz A146 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A146.', 85::numeric, 3::int, 146::int),
    ('f3000000-0000-4000-8000-000000000147'::uuid, 'f4000000-0000-4000-8000-000000000147'::uuid, 'A147', 'UV Sticker 24oz A147', 'sticker-a147', 'STK-A147', 'UV Sticker 24oz A147 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A147.', 85::numeric, 3::int, 147::int),
    ('f3000000-0000-4000-8000-000000000148'::uuid, 'f4000000-0000-4000-8000-000000000148'::uuid, 'A148', 'UV Sticker 24oz A148', 'sticker-a148', 'STK-A148', 'UV Sticker 24oz A148 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A148.', 85::numeric, 3::int, 148::int),
    ('f3000000-0000-4000-8000-000000000149'::uuid, 'f4000000-0000-4000-8000-000000000149'::uuid, 'A149', 'UV Sticker 24oz A149', 'sticker-a149', 'STK-A149', 'UV Sticker 24oz A149 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A149.', 85::numeric, 3::int, 149::int),
    ('f3000000-0000-4000-8000-000000000150'::uuid, 'f4000000-0000-4000-8000-000000000150'::uuid, 'A150', 'UV Sticker 24oz A150', 'sticker-a150', 'STK-A150', 'UV Sticker 24oz A150 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A150.', 85::numeric, 3::int, 150::int),
    ('f3000000-0000-4000-8000-000000000151'::uuid, 'f4000000-0000-4000-8000-000000000151'::uuid, 'A151', 'UV Sticker 24oz A151', 'sticker-a151', 'STK-A151', 'UV Sticker 24oz A151 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A151.', 85::numeric, 3::int, 151::int),
    ('f3000000-0000-4000-8000-000000000152'::uuid, 'f4000000-0000-4000-8000-000000000152'::uuid, 'A152', 'UV Sticker 24oz A152', 'sticker-a152', 'STK-A152', 'UV Sticker 24oz A152 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A152.', 85::numeric, 3::int, 152::int),
    ('f3000000-0000-4000-8000-000000000153'::uuid, 'f4000000-0000-4000-8000-000000000153'::uuid, 'A153', 'UV Sticker 24oz A153', 'sticker-a153', 'STK-A153', 'UV Sticker 24oz A153 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A153.', 85::numeric, 3::int, 153::int),
    ('f3000000-0000-4000-8000-000000000154'::uuid, 'f4000000-0000-4000-8000-000000000154'::uuid, 'A154', 'UV Sticker 24oz A154', 'sticker-a154', 'STK-A154', 'UV Sticker 24oz A154 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A154.', 85::numeric, 3::int, 154::int),
    ('f3000000-0000-4000-8000-000000000155'::uuid, 'f4000000-0000-4000-8000-000000000155'::uuid, 'A155', 'UV Sticker 24oz A155', 'sticker-a155', 'STK-A155', 'UV Sticker 24oz A155 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A155.', 85::numeric, 3::int, 155::int),
    ('f3000000-0000-4000-8000-000000000156'::uuid, 'f4000000-0000-4000-8000-000000000156'::uuid, 'A156', 'UV Sticker 24oz A156', 'sticker-a156', 'STK-A156', 'UV Sticker 24oz A156 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A156.', 85::numeric, 3::int, 156::int),
    ('f3000000-0000-4000-8000-000000000157'::uuid, 'f4000000-0000-4000-8000-000000000157'::uuid, 'A157', 'UV Sticker 24oz A157', 'sticker-a157', 'STK-A157', 'UV Sticker 24oz A157 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A157.', 85::numeric, 3::int, 157::int),
    ('f3000000-0000-4000-8000-000000000158'::uuid, 'f4000000-0000-4000-8000-000000000158'::uuid, 'A158', 'UV Sticker 24oz A158', 'sticker-a158', 'STK-A158', 'UV Sticker 24oz A158 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A158.', 85::numeric, 3::int, 158::int),
    ('f3000000-0000-4000-8000-000000000159'::uuid, 'f4000000-0000-4000-8000-000000000159'::uuid, 'A159', 'UV Sticker 24oz A159', 'sticker-a159', 'STK-A159', 'UV Sticker 24oz A159 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A159.', 85::numeric, 3::int, 159::int),
    ('f3000000-0000-4000-8000-000000000160'::uuid, 'f4000000-0000-4000-8000-000000000160'::uuid, 'A160', 'UV Sticker 24oz A160', 'sticker-a160', 'STK-A160', 'UV Sticker 24oz A160 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A160.', 85::numeric, 3::int, 160::int),
    ('f3000000-0000-4000-8000-000000000161'::uuid, 'f4000000-0000-4000-8000-000000000161'::uuid, 'A161', 'UV Sticker 24oz A161', 'sticker-a161', 'STK-A161', 'UV Sticker 24oz A161 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A161.', 85::numeric, 3::int, 161::int),
    ('f3000000-0000-4000-8000-000000000162'::uuid, 'f4000000-0000-4000-8000-000000000162'::uuid, 'A162', 'UV Sticker 24oz A162', 'sticker-a162', 'STK-A162', 'UV Sticker 24oz A162 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A162.', 85::numeric, 3::int, 162::int),
    ('f3000000-0000-4000-8000-000000000163'::uuid, 'f4000000-0000-4000-8000-000000000163'::uuid, 'A163', 'UV Sticker 24oz A163', 'sticker-a163', 'STK-A163', 'UV Sticker 24oz A163 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A163.', 85::numeric, 3::int, 163::int),
    ('f3000000-0000-4000-8000-000000000164'::uuid, 'f4000000-0000-4000-8000-000000000164'::uuid, 'A164', 'UV Sticker 24oz A164', 'sticker-a164', 'STK-A164', 'UV Sticker 24oz A164 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A164.', 85::numeric, 3::int, 164::int),
    ('f3000000-0000-4000-8000-000000000165'::uuid, 'f4000000-0000-4000-8000-000000000165'::uuid, 'A165', 'UV Sticker 24oz A165', 'sticker-a165', 'STK-A165', 'UV Sticker 24oz A165 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A165.', 85::numeric, 3::int, 165::int),
    ('f3000000-0000-4000-8000-000000000166'::uuid, 'f4000000-0000-4000-8000-000000000166'::uuid, 'A166', 'UV Sticker 24oz A166', 'sticker-a166', 'STK-A166', 'UV Sticker 24oz A166 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A166.', 85::numeric, 3::int, 166::int),
    ('f3000000-0000-4000-8000-000000000167'::uuid, 'f4000000-0000-4000-8000-000000000167'::uuid, 'A167', 'UV Sticker 24oz A167', 'sticker-a167', 'STK-A167', 'UV Sticker 24oz A167 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A167.', 85::numeric, 3::int, 167::int),
    ('f3000000-0000-4000-8000-000000000168'::uuid, 'f4000000-0000-4000-8000-000000000168'::uuid, 'A168', 'UV Sticker 24oz A168', 'sticker-a168', 'STK-A168', 'UV Sticker 24oz A168 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A168.', 85::numeric, 3::int, 168::int),
    ('f3000000-0000-4000-8000-000000000169'::uuid, 'f4000000-0000-4000-8000-000000000169'::uuid, 'A169', 'UV Sticker 24oz A169', 'sticker-a169', 'STK-A169', 'UV Sticker 24oz A169 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A169.', 85::numeric, 3::int, 169::int),
    ('f3000000-0000-4000-8000-000000000170'::uuid, 'f4000000-0000-4000-8000-000000000170'::uuid, 'A170', 'UV Sticker 24oz A170', 'sticker-a170', 'STK-A170', 'UV Sticker 24oz A170 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A170.', 85::numeric, 3::int, 170::int),
    ('f3000000-0000-4000-8000-000000000171'::uuid, 'f4000000-0000-4000-8000-000000000171'::uuid, 'A171', 'UV Sticker 24oz A171', 'sticker-a171', 'STK-A171', 'UV Sticker 24oz A171 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A171.', 85::numeric, 3::int, 171::int),
    ('f3000000-0000-4000-8000-000000000172'::uuid, 'f4000000-0000-4000-8000-000000000172'::uuid, 'A172', 'UV Sticker 24oz A172', 'sticker-a172', 'STK-A172', 'UV Sticker 24oz A172 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A172.', 85::numeric, 3::int, 172::int),
    ('f3000000-0000-4000-8000-000000000173'::uuid, 'f4000000-0000-4000-8000-000000000173'::uuid, 'A173', 'UV Sticker 24oz A173', 'sticker-a173', 'STK-A173', 'UV Sticker 24oz A173 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A173.', 85::numeric, 3::int, 173::int),
    ('f3000000-0000-4000-8000-000000000174'::uuid, 'f4000000-0000-4000-8000-000000000174'::uuid, 'A174', 'UV Sticker 24oz A174', 'sticker-a174', 'STK-A174', 'UV Sticker 24oz A174 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A174.', 85::numeric, 3::int, 174::int),
    ('f3000000-0000-4000-8000-000000000175'::uuid, 'f4000000-0000-4000-8000-000000000175'::uuid, 'A175', 'UV Sticker 24oz A175', 'sticker-a175', 'STK-A175', 'UV Sticker 24oz A175 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A175.', 85::numeric, 3::int, 175::int),
    ('f3000000-0000-4000-8000-000000000176'::uuid, 'f4000000-0000-4000-8000-000000000176'::uuid, 'A176', 'UV Sticker 24oz A176', 'sticker-a176', 'STK-A176', 'UV Sticker 24oz A176 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A176.', 85::numeric, 3::int, 176::int),
    ('f3000000-0000-4000-8000-000000000177'::uuid, 'f4000000-0000-4000-8000-000000000177'::uuid, 'A177', 'UV Sticker 24oz A177', 'sticker-a177', 'STK-A177', 'UV Sticker 24oz A177 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A177.', 85::numeric, 3::int, 177::int),
    ('f3000000-0000-4000-8000-000000000178'::uuid, 'f4000000-0000-4000-8000-000000000178'::uuid, 'A178', 'UV Sticker 24oz A178', 'sticker-a178', 'STK-A178', 'UV Sticker 24oz A178 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A178.', 85::numeric, 3::int, 178::int),
    ('f3000000-0000-4000-8000-000000000179'::uuid, 'f4000000-0000-4000-8000-000000000179'::uuid, 'A179', 'UV Sticker 24oz A179', 'sticker-a179', 'STK-A179', 'UV Sticker 24oz A179 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A179.', 85::numeric, 3::int, 179::int),
    ('f3000000-0000-4000-8000-000000000180'::uuid, 'f4000000-0000-4000-8000-000000000180'::uuid, 'A180', 'UV Sticker 24oz A180', 'sticker-a180', 'STK-A180', 'UV Sticker 24oz A180 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A180.', 85::numeric, 3::int, 180::int),
    ('f3000000-0000-4000-8000-000000000181'::uuid, 'f4000000-0000-4000-8000-000000000181'::uuid, 'A181', 'UV Sticker 24oz A181', 'sticker-a181', 'STK-A181', 'UV Sticker 24oz A181 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A181.', 85::numeric, 3::int, 181::int),
    ('f3000000-0000-4000-8000-000000000182'::uuid, 'f4000000-0000-4000-8000-000000000182'::uuid, 'A182', 'UV Sticker 24oz A182', 'sticker-a182', 'STK-A182', 'UV Sticker 24oz A182 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A182.', 85::numeric, 3::int, 182::int),
    ('f3000000-0000-4000-8000-000000000183'::uuid, 'f4000000-0000-4000-8000-000000000183'::uuid, 'A183', 'UV Sticker 24oz A183', 'sticker-a183', 'STK-A183', 'UV Sticker 24oz A183 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A183.', 85::numeric, 3::int, 183::int),
    ('f3000000-0000-4000-8000-000000000184'::uuid, 'f4000000-0000-4000-8000-000000000184'::uuid, 'A184', 'UV Sticker 24oz A184', 'sticker-a184', 'STK-A184', 'UV Sticker 24oz A184 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A184.', 85::numeric, 3::int, 184::int),
    ('f3000000-0000-4000-8000-000000000185'::uuid, 'f4000000-0000-4000-8000-000000000185'::uuid, 'A185', 'UV Sticker 24oz A185', 'sticker-a185', 'STK-A185', 'UV Sticker 24oz A185 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A185.', 85::numeric, 3::int, 185::int),
    ('f3000000-0000-4000-8000-000000000186'::uuid, 'f4000000-0000-4000-8000-000000000186'::uuid, 'A186', 'UV Sticker 24oz A186', 'sticker-a186', 'STK-A186', 'UV Sticker 24oz A186 — sticker UV de MatrixLab Tumbler. Acabado 24 oz. Se vende por pieza. Ref. A186.', 85::numeric, 3::int, 186::int),
    ('f3000000-0000-4000-8000-000000000187'::uuid, 'f4000000-0000-4000-8000-000000000187'::uuid, 'A187', 'UV Sticker Holográfico A187', 'sticker-a187', 'STK-A187', 'UV Sticker Holográfico A187 — sticker UV de MatrixLab Tumbler. Acabado Holográfico 16 oz. Se vende por pieza. Ref. A187.', 95::numeric, 3::int, 187::int),
    ('f3000000-0000-4000-8000-000000000188'::uuid, 'f4000000-0000-4000-8000-000000000188'::uuid, 'A188', 'UV Sticker Holográfico A188', 'sticker-a188', 'STK-A188', 'UV Sticker Holográfico A188 — sticker UV de MatrixLab Tumbler. Acabado Holográfico 16 oz. Se vende por pieza. Ref. A188.', 95::numeric, 3::int, 188::int),
    ('f3000000-0000-4000-8000-000000000189'::uuid, 'f4000000-0000-4000-8000-000000000189'::uuid, 'A189', 'UV Sticker Glitter A189', 'sticker-a189', 'STK-A189', 'UV Sticker Glitter A189 — sticker UV de MatrixLab Tumbler. Acabado Glitter 16 oz. Se vende por pieza. Ref. A189.', 85::numeric, 3::int, 189::int),
    ('f3000000-0000-4000-8000-000000000190'::uuid, 'f4000000-0000-4000-8000-000000000190'::uuid, 'A190', 'UV Sticker Glitter A190', 'sticker-a190', 'STK-A190', 'UV Sticker Glitter A190 — sticker UV de MatrixLab Tumbler. Acabado Glitter 16 oz. Se vende por pieza. Ref. A190.', 85::numeric, 3::int, 190::int),
    ('f3000000-0000-4000-8000-000000000191'::uuid, 'f4000000-0000-4000-8000-000000000191'::uuid, 'A191', 'UV Sticker Glitter A191', 'sticker-a191', 'STK-A191', 'UV Sticker Glitter A191 — sticker UV de MatrixLab Tumbler. Acabado Glitter 16 oz. Se vende por pieza. Ref. A191.', 85::numeric, 3::int, 191::int),
    ('f3000000-0000-4000-8000-000000000192'::uuid, 'f4000000-0000-4000-8000-000000000192'::uuid, 'A192', 'UV Sticker Glitter A192', 'sticker-a192', 'STK-A192', 'UV Sticker Glitter A192 — sticker UV de MatrixLab Tumbler. Acabado Glitter 16 oz. Se vende por pieza. Ref. A192.', 85::numeric, 3::int, 192::int),
    ('f3000000-0000-4000-8000-000000000193'::uuid, 'f4000000-0000-4000-8000-000000000193'::uuid, 'A193', 'UV Sticker Glitter A193', 'sticker-a193', 'STK-A193', 'UV Sticker Glitter A193 — sticker UV de MatrixLab Tumbler. Acabado Glitter 16 oz. Se vende por pieza. Ref. A193.', 85::numeric, 3::int, 193::int),
    ('f3000000-0000-4000-8000-000000000194'::uuid, 'f4000000-0000-4000-8000-000000000194'::uuid, 'A194', 'UV Sticker Glitter A194', 'sticker-a194', 'STK-A194', 'UV Sticker Glitter A194 — sticker UV de MatrixLab Tumbler. Acabado Glitter 16 oz. Se vende por pieza. Ref. A194.', 85::numeric, 3::int, 194::int),
    ('f3000000-0000-4000-8000-000000000195'::uuid, 'f4000000-0000-4000-8000-000000000195'::uuid, 'A195', 'UV Sticker Glitter A195', 'sticker-a195', 'STK-A195', 'UV Sticker Glitter A195 — sticker UV de MatrixLab Tumbler. Acabado Glitter 16 oz. Se vende por pieza. Ref. A195.', 85::numeric, 3::int, 195::int),
    ('f3000000-0000-4000-8000-000000000196'::uuid, 'f4000000-0000-4000-8000-000000000196'::uuid, 'A196', 'UV Sticker Glitter A196', 'sticker-a196', 'STK-A196', 'UV Sticker Glitter A196 — sticker UV de MatrixLab Tumbler. Acabado Glitter 16 oz. Se vende por pieza. Ref. A196.', 85::numeric, 3::int, 196::int),
    ('f3000000-0000-4000-8000-000000000197'::uuid, 'f4000000-0000-4000-8000-000000000197'::uuid, 'A197', 'UV Sticker Mini A197', 'sticker-a197', 'STK-A197', 'UV Sticker Mini A197 — sticker UV de MatrixLab Tumbler. Acabado Mini individual. Se vende por pieza. Ref. A197.', 45::numeric, 3::int, 197::int),
    ('f3000000-0000-4000-8000-000000000198'::uuid, 'f4000000-0000-4000-8000-000000000198'::uuid, 'A198', 'UV Sticker Mini A198', 'sticker-a198', 'STK-A198', 'UV Sticker Mini A198 — sticker UV de MatrixLab Tumbler. Acabado Mini individual. Se vende por pieza. Ref. A198.', 45::numeric, 3::int, 198::int),
    ('f3000000-0000-4000-8000-000000000199'::uuid, 'f4000000-0000-4000-8000-000000000199'::uuid, 'A199', 'UV Sticker Mini A199', 'sticker-a199', 'STK-A199', 'UV Sticker Mini A199 — sticker UV de MatrixLab Tumbler. Acabado Mini individual. Se vende por pieza. Ref. A199.', 45::numeric, 3::int, 199::int),
    ('f3000000-0000-4000-8000-000000000200'::uuid, 'f4000000-0000-4000-8000-000000000200'::uuid, 'A200', 'UV Sticker Mini A200', 'sticker-a200', 'STK-A200', 'UV Sticker Mini A200 — sticker UV de MatrixLab Tumbler. Acabado Mini individual. Se vende por pieza. Ref. A200.', 45::numeric, 3::int, 200::int),
    ('f3000000-0000-4000-8000-000000000201'::uuid, 'f4000000-0000-4000-8000-000000000201'::uuid, 'A201', 'UV Sticker Mini A201', 'sticker-a201', 'STK-A201', 'UV Sticker Mini A201 — sticker UV de MatrixLab Tumbler. Acabado Mini individual. Se vende por pieza. Ref. A201.', 45::numeric, 3::int, 201::int),
    ('f3000000-0000-4000-8000-000000000202'::uuid, 'f4000000-0000-4000-8000-000000000202'::uuid, 'A202', 'UV Sticker Mini A202', 'sticker-a202', 'STK-A202', 'UV Sticker Mini A202 — sticker UV de MatrixLab Tumbler. Acabado Mini individual. Se vende por pieza. Ref. A202.', 45::numeric, 3::int, 202::int),
    ('f3000000-0000-4000-8000-000000000203'::uuid, 'f4000000-0000-4000-8000-000000000203'::uuid, 'A203', 'UV Sticker Mini A203', 'sticker-a203', 'STK-A203', 'UV Sticker Mini A203 — sticker UV de MatrixLab Tumbler. Acabado Mini individual. Se vende por pieza. Ref. A203.', 45::numeric, 3::int, 203::int),
    ('f3000000-0000-4000-8000-000000000204'::uuid, 'f4000000-0000-4000-8000-000000000204'::uuid, 'A204', 'UV Sticker Mini A204', 'sticker-a204', 'STK-A204', 'UV Sticker Mini A204 — sticker UV de MatrixLab Tumbler. Acabado Mini individual. Se vende por pieza. Ref. A204.', 45::numeric, 3::int, 204::int),
    ('f3000000-0000-4000-8000-000000000205'::uuid, 'f4000000-0000-4000-8000-000000000205'::uuid, 'A205', 'UV Sticker Mini A205', 'sticker-a205', 'STK-A205', 'UV Sticker Mini A205 — sticker UV de MatrixLab Tumbler. Acabado Mini individual. Se vende por pieza. Ref. A205.', 45::numeric, 3::int, 205::int),
    ('f3000000-0000-4000-8000-000000000206'::uuid, 'f4000000-0000-4000-8000-000000000206'::uuid, 'A206', 'UV Sticker Mini A206', 'sticker-a206', 'STK-A206', 'UV Sticker Mini A206 — sticker UV de MatrixLab Tumbler. Acabado Mini individual. Se vende por pieza. Ref. A206.', 45::numeric, 3::int, 206::int),
    ('f3000000-0000-4000-8000-000000000207'::uuid, 'f4000000-0000-4000-8000-000000000207'::uuid, 'A207', 'UV Sticker Mini A207', 'sticker-a207', 'STK-A207', 'UV Sticker Mini A207 — sticker UV de MatrixLab Tumbler. Acabado Mini individual. Se vende por pieza. Ref. A207.', 45::numeric, 3::int, 207::int),
    ('f3000000-0000-4000-8000-000000000208'::uuid, 'f4000000-0000-4000-8000-000000000208'::uuid, 'A208', 'UV Sticker Mini A208', 'sticker-a208', 'STK-A208', 'UV Sticker Mini A208 — sticker UV de MatrixLab Tumbler. Acabado Mini individual. Se vende por pieza. Ref. A208.', 45::numeric, 3::int, 208::int),
    ('f3000000-0000-4000-8000-000000000209'::uuid, 'f4000000-0000-4000-8000-000000000209'::uuid, 'A209', 'UV Sticker Mini A209', 'sticker-a209', 'STK-A209', 'UV Sticker Mini A209 — sticker UV de MatrixLab Tumbler. Acabado Mini individual. Se vende por pieza. Ref. A209.', 45::numeric, 3::int, 209::int)
),
cat as (
  select id from public.categories where handle = 'wraps-glow-finish'
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
    greatest(s.stock, 1),
    array['uv-stickers', 'stickers', 'matrixlab-tumbler']
  from stickers s cross join cat
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
  'Pieza',
  s.sku,
  s.price,
  s.stock,
  'Pieza',
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
-- Verificación rápida (debe devolver 209 / 209 / 627).
-- ---------------------------------------------------------------------------
-- select
--   (select count(*) from public.products p
--      join public.categories c on c.id = p.category_id
--     where c.handle = 'wraps-glow-finish' and p.handle like 'sticker-%') as productos,
--   (select count(*) from public.product_variants where sku like 'STK-A%') as variantes,
--   (select coalesce(sum(stock), 0) from public.product_variants
--     where sku like 'STK-A%') as piezas;
