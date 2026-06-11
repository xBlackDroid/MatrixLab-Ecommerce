-- ============================================================================
-- MatrixLab Store Core — Seed inicial de desarrollo
-- Idempotente: usa upsert por id/handle. Ejecutar después de las migraciones.
-- Los textos públicos usan únicamente vocabulario comercial aprobado.
-- ============================================================================

-- Categorías -----------------------------------------------------------------
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
  ('c0000000-0000-4000-8000-000000000006', 'Impresión 3D', 'impresion-3d',
   'Piezas únicas, prototipos, decoración, accesorios y objetos personalizados capa por capa.', 6, 'activa'),
  ('c0000000-0000-4000-8000-000000000007', 'Diseñador T-Shirt Lab', 'disenador-tshirt-lab',
   'Crea prendas y accesorios textiles personalizados desde el laboratorio interactivo.', 7, 'activa')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  status = excluded.status;

-- Productos demo ---------------------------------------------------------------
insert into public.products
  (id, category_id, title, handle, description, base_price, compare_at_price,
   status, is_customizable, production_time, min_quantity, max_quantity, tags) values
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'Sticker personalizado', 'sticker-personalizado',
   'Stickers con tu diseño, logotipo o ilustración favorita. Acabados profesionales resistentes al agua, ideales para empaques, laptops, botellas, campañas y colecciones. Desde una pieza hasta miles.',
   99, null, 'disponible', true, '2 a 3 días hábiles', 1, 999, array['personalizable','volumen']),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002',
   'Imán personalizado', 'iman-personalizado',
   'Imanes personalizados con acabado premium para refrigerador, recuerdos de eventos, regalos y promociones de marca. Perfectos para bodas, cumpleaños y activaciones.',
   129, null, 'disponible', true, '2 a 3 días hábiles', 1, 999, array['personalizable','eventos']),
  ('d0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003',
   'Playera personalizada', 'playera-personalizada',
   'Playera de algodón suave con personalización premium. Sube tu diseño en el laboratorio interactivo, elige color y talla, y recibe una prenda lista para presumir. Ideal para personas, equipos, escuelas y empresas.',
   349, 399, 'disponible', true, '3 a 5 días hábiles', 1, 500, array['personalizable','laboratorio','volumen']),
  ('d0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004',
   'Gorra personalizada', 'gorra-personalizada',
   'Gorra estructurada con acabado premium y tu diseño al frente. Perfecta para marcas, eventos, equipos deportivos y regalos especiales.',
   279, null, 'disponible', true, '3 a 5 días hábiles', 1, 500, array['personalizable','laboratorio']),
  ('d0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000003',
   'Tote bag personalizada', 'tote-bag-personalizada',
   'Bolsa de tela resistente con personalización textil premium. Diseña la tuya en el laboratorio: regalos, eventos, librerías, marcas y uso diario con estilo.',
   249, null, 'disponible', true, '3 a 5 días hábiles', 1, 500, array['personalizable','laboratorio','eco']),
  ('d0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000005',
   'Grabado láser personalizado', 'grabado-laser-personalizado',
   'Piezas únicas grabadas en madera, acrílico o metal: placas, llaveros, reconocimientos, señalética y regalos corporativos. Este producto se prepara sobre pedido con acabados profesionales.',
   399, null, 'sobre_pedido', true, '5 a 7 días hábiles', 1, 200, array['personalizable','sobre-pedido','empresas']),
  ('d0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000006',
   'Pieza 3D personalizada', 'pieza-3d-personalizada',
   'Objetos impresos capa por capa: prototipos, figuras, decoración, accesorios y refacciones creativas. Cuéntanos tu idea y la hacemos realidad sobre pedido.',
   299, null, 'sobre_pedido', true, '5 a 7 días hábiles', 1, 100, array['personalizable','sobre-pedido','prototipos'])
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  base_price = excluded.base_price,
  compare_at_price = excluded.compare_at_price,
  status = excluded.status,
  is_customizable = excluded.is_customizable,
  production_time = excluded.production_time,
  tags = excluded.tags;

-- Variantes ---------------------------------------------------------------------
insert into public.product_variants
  (id, product_id, title, sku, price, stock, color, size, option_label, status) values
  -- Sticker: tamaños (paquete de 10)
  ('e0000000-0000-4000-8000-000000000101', 'd0000000-0000-4000-8000-000000000001',
   'Paquete 10 — 5 cm', 'STK-5CM', 99, 120, null, null, 'Tamaño 5 cm', 'disponible'),
  ('e0000000-0000-4000-8000-000000000102', 'd0000000-0000-4000-8000-000000000001',
   'Paquete 10 — 8 cm', 'STK-8CM', 149, 90, null, null, 'Tamaño 8 cm', 'disponible'),
  ('e0000000-0000-4000-8000-000000000103', 'd0000000-0000-4000-8000-000000000001',
   'Paquete 10 — 10 cm', 'STK-10CM', 199, 60, null, null, 'Tamaño 10 cm', 'disponible'),

  -- Imán: tamaños (uno agotado para demo de badges)
  ('e0000000-0000-4000-8000-000000000201', 'd0000000-0000-4000-8000-000000000002',
   'Imán 5x5 cm', 'IMN-5X5', 129, 80, null, null, 'Tamaño 5x5 cm', 'disponible'),
  ('e0000000-0000-4000-8000-000000000202', 'd0000000-0000-4000-8000-000000000002',
   'Imán 7x7 cm', 'IMN-7X7', 169, 0, null, null, 'Tamaño 7x7 cm', 'agotado'),

  -- Playera: color x talla
  ('e0000000-0000-4000-8000-000000000301', 'd0000000-0000-4000-8000-000000000003',
   'Blanco / CH', 'PLY-BL-CH', 349, 25, 'Blanco', 'CH', null, 'disponible'),
  ('e0000000-0000-4000-8000-000000000302', 'd0000000-0000-4000-8000-000000000003',
   'Blanco / M', 'PLY-BL-M', 349, 25, 'Blanco', 'M', null, 'disponible'),
  ('e0000000-0000-4000-8000-000000000303', 'd0000000-0000-4000-8000-000000000003',
   'Blanco / G', 'PLY-BL-G', 349, 25, 'Blanco', 'G', null, 'disponible'),
  ('e0000000-0000-4000-8000-000000000304', 'd0000000-0000-4000-8000-000000000003',
   'Blanco / XG', 'PLY-BL-XG', 349, 15, 'Blanco', 'XG', null, 'disponible'),
  ('e0000000-0000-4000-8000-000000000305', 'd0000000-0000-4000-8000-000000000003',
   'Negro / CH', 'PLY-NG-CH', 349, 25, 'Negro', 'CH', null, 'disponible'),
  ('e0000000-0000-4000-8000-000000000306', 'd0000000-0000-4000-8000-000000000003',
   'Negro / M', 'PLY-NG-M', 349, 25, 'Negro', 'M', null, 'disponible'),
  ('e0000000-0000-4000-8000-000000000307', 'd0000000-0000-4000-8000-000000000003',
   'Negro / G', 'PLY-NG-G', 349, 25, 'Negro', 'G', null, 'disponible'),
  ('e0000000-0000-4000-8000-000000000308', 'd0000000-0000-4000-8000-000000000003',
   'Negro / XG', 'PLY-NG-XG', 349, 15, 'Negro', 'XG', null, 'disponible'),

  -- Gorra: colores
  ('e0000000-0000-4000-8000-000000000401', 'd0000000-0000-4000-8000-000000000004',
   'Negro', 'GRR-NG', 279, 20, 'Negro', null, null, 'disponible'),
  ('e0000000-0000-4000-8000-000000000402', 'd0000000-0000-4000-8000-000000000004',
   'Azul marino', 'GRR-AZ', 279, 15, 'Azul marino', null, null, 'disponible'),
  ('e0000000-0000-4000-8000-000000000403', 'd0000000-0000-4000-8000-000000000004',
   'Beige', 'GRR-BG', 279, 12, 'Beige', null, null, 'disponible'),

  -- Tote: colores
  ('e0000000-0000-4000-8000-000000000501', 'd0000000-0000-4000-8000-000000000005',
   'Natural', 'TTE-NAT', 249, 30, 'Natural', null, null, 'disponible'),
  ('e0000000-0000-4000-8000-000000000502', 'd0000000-0000-4000-8000-000000000005',
   'Negro', 'TTE-NG', 249, 20, 'Negro', null, null, 'disponible'),

  -- Grabado láser: materiales (sobre pedido)
  ('e0000000-0000-4000-8000-000000000601', 'd0000000-0000-4000-8000-000000000006',
   'Madera', 'LSR-MAD', 399, 0, null, null, 'Material: madera', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000602', 'd0000000-0000-4000-8000-000000000006',
   'Acrílico', 'LSR-ACR', 449, 0, null, null, 'Material: acrílico', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000603', 'd0000000-0000-4000-8000-000000000006',
   'Metal', 'LSR-MET', 549, 0, null, null, 'Material: metal', 'sobre_pedido'),

  -- Pieza 3D: tamaños (sobre pedido)
  ('e0000000-0000-4000-8000-000000000701', 'd0000000-0000-4000-8000-000000000007',
   'Chica (hasta 8 cm)', '3DP-CH', 299, 0, null, null, 'Tamaño chico', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000702', 'd0000000-0000-4000-8000-000000000007',
   'Mediana (hasta 15 cm)', '3DP-MD', 499, 0, null, null, 'Tamaño mediano', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000703', 'd0000000-0000-4000-8000-000000000007',
   'Grande (hasta 25 cm)', '3DP-GR', 899, 0, null, null, 'Tamaño grande', 'sobre_pedido')
on conflict (id) do update set
  title = excluded.title,
  price = excluded.price,
  stock = excluded.stock,
  color = excluded.color,
  size = excluded.size,
  option_label = excluded.option_label,
  status = excluded.status;
