-- ============================================================================
-- MatrixLab Store Core — Productos base del LABORATORIO (seed de reparación)
--
-- Garantiza que TODOS los productos base que usan los diseñadores existan y
-- sean utilizables:
--   * playera-personalizada, sudadera-personalizada, gorra-personalizada,
--     gorra-trucker-personalizada, gorra-clasica-personalizada,
--     tote-bag-personalizada, planilla-stickers, planilla-imanes,
--     grabado-laser-personalizado, etiquetas-escolares-personalizadas.
--   * is_customizable = true y status visible (nunca 'oculto').
--   * Al menos una variante activa (la variante "-CUSTOM" del diseñador; para
--     etiquetas escolares, Elementary y Ultra).
--
-- IDEMPOTENTE Y SEGURO PARA PRODUCCIÓN:
--   * No borra nada.
--   * Upsert por `handle` (productos/categorías) y `sku` (variantes), que son
--     UNIQUE en el esquema: si la fila ya existe con OTRO id (creada desde el
--     admin), se conserva su id y solo se repara lo mínimo.
--   * En filas existentes NO pisa título, descripción ni precios curados:
--     solo asegura is_customizable = true y saca de 'oculto' si aplica.
--
-- Ejecutar en el SQL Editor de Supabase (o supabase db execute). Se puede
-- correr las veces que haga falta. Requiere migraciones 0001+ aplicadas.
--
-- Nota: si alguna fila reutilizara un id canónico d0/e0… con un handle/sku
-- distinto (caso anómalo), el insert fallaría por PK; en ese caso revisar la
-- fila manualmente en el admin antes de re-ejecutar.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Categorías requeridas por los productos base (upsert por handle).
--    En filas existentes solo se garantiza status = 'activa'.
-- ---------------------------------------------------------------------------
insert into public.categories (id, title, handle, description, sort_order, status) values
  ('c0000000-0000-4000-8000-000000000001', 'Stickers', 'stickers',
   'Stickers personalizados para marcas, eventos, regalos, campañas, empaques y colecciones.', 1, 'activa'),
  ('c0000000-0000-4000-8000-000000000002', 'Imanes', 'imanes',
   'Imanes personalizados para refrigerador, eventos, recuerdos, marcas y promociones.', 2, 'activa'),
  ('c0000000-0000-4000-8000-000000000003', 'Playeras y prendas', 'playeras-prendas',
   'Prendas personalizadas con acabado premium para personas, eventos, equipos, escuelas y empresas.', 3, 'activa'),
  ('c0000000-0000-4000-8000-000000000004', 'Gorras', 'gorras',
   'Gorras personalizadas para eventos, marcas, equipos y activaciones especiales.', 4, 'activa'),
  ('c0000000-0000-4000-8000-000000000005', 'Grabado láser', 'grabado-laser',
   'Piezas personalizadas en madera, acrílico, metal y materiales especiales.', 5, 'activa'),
  ('c0000000-0000-4000-8000-000000000011', 'Etiquetas escolares', 'etiquetas-escolares',
   'Packs personalizados para útiles, loncheras, termos, cuadernos y regreso a clases.', 17, 'activa')
on conflict (handle) do update set
  status = 'activa';

-- ---------------------------------------------------------------------------
-- 2) Productos base del laboratorio (upsert por handle).
--    En filas existentes: is_customizable = true y, si estaba 'oculto', se
--    restaura el status canónico. Título/descripción/precio no se tocan.
-- ---------------------------------------------------------------------------
insert into public.products
  (id, category_id, title, handle, description, base_price, compare_at_price,
   status, is_customizable, production_time, min_quantity, max_quantity, tags)
select
  v.id::uuid,
  c.id,
  v.title,
  v.handle,
  v.description,
  v.base_price::numeric,
  v.compare_at_price::numeric,
  v.status,
  true,
  v.production_time,
  1,
  v.max_quantity::int,
  v.tags::text[]
from (values
  ('d0000000-0000-4000-8000-000000000003', 'playeras-prendas',
   'Playera personalizada', 'playera-personalizada',
   'Playera de algodón suave con personalización premium. Sube tu diseño en el laboratorio interactivo, elige color y talla, y recibe una prenda lista para presumir. Ideal para personas, equipos, escuelas y empresas.',
   '349', '399', 'disponible', '3 a 5 días hábiles', '500',
   '{personalizable,laboratorio,volumen}'),
  ('d0000000-0000-4000-8000-000000000004', 'gorras',
   'Gorra personalizada', 'gorra-personalizada',
   'Gorra estructurada con acabado premium y tu diseño al frente. Perfecta para marcas, eventos, equipos deportivos y regalos especiales.',
   '279', null, 'disponible', '3 a 5 días hábiles', '500',
   '{personalizable,laboratorio}'),
  ('d0000000-0000-4000-8000-000000000005', 'playeras-prendas',
   'Tote bag personalizada', 'tote-bag-personalizada',
   'Bolsa de tela resistente con personalización textil premium. Diseña la tuya en el laboratorio: regalos, eventos, librerías, marcas y uso diario con estilo.',
   '249', null, 'disponible', '3 a 5 días hábiles', '500',
   '{personalizable,laboratorio,eco}'),
  ('d0000000-0000-4000-8000-000000000006', 'grabado-laser',
   'Grabado láser personalizado', 'grabado-laser-personalizado',
   'Piezas únicas grabadas en madera, acrílico o metal: placas, llaveros, reconocimientos, señalética y regalos corporativos. Este producto se prepara sobre pedido con acabados profesionales.',
   '399', null, 'sobre_pedido', '5 a 7 días hábiles', '200',
   '{personalizable,sobre-pedido,empresas}'),
  ('d0000000-0000-4000-8000-000000000008', 'playeras-prendas',
   'Sudadera personalizada', 'sudadera-personalizada',
   'Sudadera personalizada con acabado premium para eventos, marcas, regalos y equipos. Diseña la tuya en el laboratorio interactivo.',
   '549', null, 'disponible', '4 a 6 días hábiles', '500',
   '{personalizable,laboratorio,volumen}'),
  ('d0000000-0000-4000-8000-000000000009', 'gorras',
   'Gorra trucker personalizada', 'gorra-trucker-personalizada',
   'Gorra trucker personalizada para eventos, marcas, equipos y activaciones. Diseña tu frente en el laboratorio.',
   '289', null, 'disponible', '3 a 5 días hábiles', '500',
   '{personalizable,laboratorio}'),
  ('d0000000-0000-4000-8000-00000000000a', 'gorras',
   'Gorra clásica ajustable', 'gorra-clasica-personalizada',
   'Gorra clásica ajustable con personalización premium para destacar tu marca o evento.',
   '279', null, 'disponible', '3 a 5 días hábiles', '500',
   '{personalizable,laboratorio}'),
  ('d0000000-0000-4000-8000-00000000000b', 'stickers',
   'Planilla de stickers', 'planilla-stickers',
   'Arma tu planilla de stickers personalizados en hoja tamaño carta. Sube tus imágenes o repite un diseño y nosotros producimos.',
   '199', null, 'sobre_pedido', '3 a 5 días hábiles', '999',
   '{personalizable,laboratorio,planilla}'),
  ('d0000000-0000-4000-8000-00000000000c', 'imanes',
   'Planilla de imanes', 'planilla-imanes',
   'Crea una planilla de imanes personalizados en hoja tamaño carta con tus imágenes favoritas.',
   '249', null, 'sobre_pedido', '3 a 5 días hábiles', '999',
   '{personalizable,laboratorio,planilla}'),
  ('d0000000-0000-4000-8000-000000000030', 'etiquetas-escolares',
   'Etiquetas escolares personalizadas', 'etiquetas-escolares-personalizadas',
   'Pack de etiquetas escolares personalizadas con nombre, tipografía, combinación de colores y temática. Diseña tu pedido en el laboratorio y elige Elementary o Ultra. El precio final lo confirma MatrixLab.',
   '199', null, 'sobre_pedido', '5 días hábiles (a convenir)', '500',
   '{school-labels,regreso-a-clases,etiquetas,stickers}')
) as v(id, category_handle, title, handle, description, base_price,
       compare_at_price, status, production_time, max_quantity, tags)
join public.categories c on c.handle = v.category_handle
on conflict (handle) do update set
  is_customizable = true,
  status = case
    when products.status = 'oculto' then excluded.status
    else products.status
  end;

-- ---------------------------------------------------------------------------
-- 3) Variantes que usan los diseñadores (upsert por sku).
--    El diseñador busca la variante con SKU "-CUSTOM" (o la primera activa);
--    etiquetas escolares usa Elementary / Ultra por option_label.
--    En filas existentes solo se saca de 'oculto' (precio curado no se pisa).
-- ---------------------------------------------------------------------------
insert into public.product_variants
  (id, product_id, title, sku, price, stock, color, size, option_label, status)
select
  v.id::uuid,
  p.id,
  v.title,
  v.sku,
  v.price::numeric,
  0,
  null,
  null,
  v.option_label,
  v.status
from (values
  ('e0000000-0000-4000-8000-000000000901', 'playera-personalizada',
   'Personalizado', 'PLY-CUSTOM', '349', 'Personalizado', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000902', 'gorra-personalizada',
   'Personalizado', 'GRR-CUSTOM', '279', 'Personalizado', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000903', 'tote-bag-personalizada',
   'Personalizado', 'TTE-CUSTOM', '249', 'Personalizado', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000904', 'grabado-laser-personalizado',
   'Personalizado', 'LSR-CUSTOM', '399', 'Personalizado', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000801', 'sudadera-personalizada',
   'Personalizado', 'SUD-CUSTOM', '549', 'Personalizado', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000802', 'gorra-trucker-personalizada',
   'Personalizado', 'GTR-CUSTOM', '289', 'Personalizado', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000803', 'gorra-clasica-personalizada',
   'Personalizado', 'GCL-CUSTOM', '279', 'Personalizado', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000804', 'planilla-stickers',
   'Personalizado', 'PLS-CUSTOM', '199', 'Hoja carta', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000805', 'planilla-imanes',
   'Personalizado', 'PLM-CUSTOM', '249', 'Hoja carta', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000b01', 'etiquetas-escolares-personalizadas',
   'Elementary', 'ESC-ELEM', '199', 'Elementary', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000b02', 'etiquetas-escolares-personalizadas',
   'Ultra', 'ESC-ULTRA', '299', 'Ultra', 'sobre_pedido')
) as v(id, product_handle, title, sku, price, option_label, status)
join public.products p on p.handle = v.product_handle
on conflict (sku) do update set
  status = case
    when product_variants.status = 'oculto' then excluded.status
    else product_variants.status
  end;

-- ---------------------------------------------------------------------------
-- Verificación rápida (opcional): debe devolver 10 filas, todas customizable,
-- ninguna oculta y con al menos 1 variante visible.
-- ---------------------------------------------------------------------------
-- select p.handle, p.status, p.is_customizable,
--        count(v.id) filter (where v.status <> 'oculto') as variantes_visibles
-- from public.products p
-- left join public.product_variants v on v.product_id = p.id
-- where p.handle in (
--   'playera-personalizada','sudadera-personalizada','gorra-personalizada',
--   'gorra-trucker-personalizada','gorra-clasica-personalizada',
--   'tote-bag-personalizada','planilla-stickers','planilla-imanes',
--   'grabado-laser-personalizado','etiquetas-escolares-personalizadas')
-- group by p.handle, p.status, p.is_customizable
-- order by p.handle;
