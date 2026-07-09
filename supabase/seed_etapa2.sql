-- ============================================================================
-- MatrixLab Store Core — Etapa 2 — Seed aditivo (idempotente)
--
-- Agrega, sin borrar nada de Etapa 1:
--   * Categoría MatrixLab Tumbler (madre de la línea de vasos/insumos) y sus
--     subcategorías internas (como handles propios).
--   * Productos base de los nuevos diseñadores (sudadera, gorras, planillas)
--     con una variante "Personalizado" (sobre pedido) para el carrito.
--   * Variante "Personalizado" para los productos base existentes.
--   * Productos demo de la línea Tumbler con inventario.
--
-- Ejecutar después de supabase/seed.sql. Re-ejecutable (upsert por id).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Categorías: MatrixLab Tumbler (madre) + subcategorías (modelo plano por handle)
-- La madre se renombró de "Insumos creativos" (handle `insumos`) a
-- "MatrixLab Tumbler" (handle `matrixlab-tumbler`) conservando el MISMO id:
-- re-ejecutar este seed sobre una base existente renombra la fila in-place sin
-- borrar productos ni relaciones. Las subcategorías conservan sus handles
-- internos y NO se muestran como tarjetas principales en /tienda.
-- ---------------------------------------------------------------------------
insert into public.categories (id, title, handle, description, sort_order, status) values
  ('c0000000-0000-4000-8000-000000000008', 'MatrixLab Tumbler', 'matrixlab-tumbler',
   'Insumos, accesorios y materiales para vasos, termos y proyectos snow globe.', 8, 'activa'),
  ('c0000000-0000-4000-8000-000000000009', 'SnowGlobe Bar', 'snowglobe',
   'Todo para crear vasos con movimiento, brillo y efecto mágico.', 9, 'activa'),
  ('c0000000-0000-4000-8000-00000000000a', 'Llaveros creativos', 'llaveros',
   'Bases y accesorios para crear llaveros personalizados.', 10, 'activa'),
  ('c0000000-0000-4000-8000-00000000000b', 'Tags de acrílico', 'tags-acrilico',
   'Tags listos para personalizar, regalar o vender.', 11, 'activa'),
  ('c0000000-0000-4000-8000-00000000000c', 'Acrylab', 'acrilicos',
   'Piezas de acrílico listas para convertir en productos personalizados.', 12, 'activa'),
  ('c0000000-0000-4000-8000-00000000000d', 'Creator Tools', 'accesorios-personalizacion',
   'Herramientas, repuestos y consumibles para tu estación creativa.', 13, 'activa'),
  ('c0000000-0000-4000-8000-00000000000e', 'Sparkle Mix', 'repuestos-consumibles',
   'Brillos, colores y decoraciones para darle personalidad a tus piezas.', 14, 'activa'),
  ('c0000000-0000-4000-8000-00000000000f', 'Magic Flow', 'magic-flow',
   'Líquidos y mezclas para lograr movimiento, caída lenta y efectos visuales.', 15, 'activa'),
  ('c0000000-0000-4000-8000-000000000010', 'Wraps & Glow Finish', 'wraps-glow-finish',
   'Láminas, wraps y acabados para transformar vasos, acrílicos y piezas personalizadas.', 16, 'activa')
on conflict (id) do update set
  title = excluded.title,
  handle = excluded.handle,
  description = excluded.description,
  sort_order = excluded.sort_order,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Productos base de los nuevos diseñadores
-- ---------------------------------------------------------------------------
insert into public.products
  (id, category_id, title, handle, description, base_price, compare_at_price,
   status, is_customizable, production_time, min_quantity, max_quantity, tags) values
  ('d0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000003',
   'Sudadera personalizada', 'sudadera-personalizada',
   'Sudadera personalizada con acabado premium para eventos, marcas, regalos y equipos. Diseña la tuya en el laboratorio interactivo.',
   549, null, 'disponible', true, '4 a 6 días hábiles', 1, 500, array['personalizable','laboratorio','volumen']),
  ('d0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000004',
   'Gorra trucker personalizada', 'gorra-trucker-personalizada',
   'Gorra trucker personalizada para eventos, marcas, equipos y activaciones. Diseña tu frente en el laboratorio.',
   289, null, 'disponible', true, '3 a 5 días hábiles', 1, 500, array['personalizable','laboratorio']),
  ('d0000000-0000-4000-8000-00000000000a', 'c0000000-0000-4000-8000-000000000004',
   'Gorra clásica ajustable', 'gorra-clasica-personalizada',
   'Gorra clásica ajustable con personalización premium para destacar tu marca o evento.',
   279, null, 'disponible', true, '3 a 5 días hábiles', 1, 500, array['personalizable','laboratorio']),
  ('d0000000-0000-4000-8000-00000000000b', 'c0000000-0000-4000-8000-000000000001',
   'Planilla de stickers', 'planilla-stickers',
   'Arma tu planilla de stickers personalizados en hoja tamaño carta. Sube tus imágenes o repite un diseño y nosotros producimos.',
   199, null, 'sobre_pedido', true, '3 a 5 días hábiles', 1, 999, array['personalizable','laboratorio','planilla']),
  ('d0000000-0000-4000-8000-00000000000c', 'c0000000-0000-4000-8000-000000000002',
   'Planilla de imanes', 'planilla-imanes',
   'Crea una planilla de imanes personalizados en hoja tamaño carta con tus imágenes favoritas.',
   249, null, 'sobre_pedido', true, '3 a 5 días hábiles', 1, 999, array['personalizable','laboratorio','planilla'])
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  base_price = excluded.base_price,
  status = excluded.status,
  is_customizable = excluded.is_customizable,
  production_time = excluded.production_time,
  tags = excluded.tags;

-- ---------------------------------------------------------------------------
-- Variante "Personalizado" (sobre pedido) para cada producto del diseñador.
-- El diseñador usa esta variante: el color/talla/perfil real viaja en el
-- design_json y en las notas de producción.
-- ---------------------------------------------------------------------------
insert into public.product_variants
  (id, product_id, title, sku, price, stock, color, size, option_label, status) values
  -- Nuevos productos base
  ('e0000000-0000-4000-8000-000000000801', 'd0000000-0000-4000-8000-000000000008',
   'Personalizado', 'SUD-CUSTOM', 549, 0, null, null, 'Personalizado', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000802', 'd0000000-0000-4000-8000-000000000009',
   'Personalizado', 'GTR-CUSTOM', 289, 0, null, null, 'Personalizado', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000803', 'd0000000-0000-4000-8000-00000000000a',
   'Personalizado', 'GCL-CUSTOM', 279, 0, null, null, 'Personalizado', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000804', 'd0000000-0000-4000-8000-00000000000b',
   'Personalizado', 'PLS-CUSTOM', 199, 0, null, null, 'Hoja carta', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000805', 'd0000000-0000-4000-8000-00000000000c',
   'Personalizado', 'PLM-CUSTOM', 249, 0, null, null, 'Hoja carta', 'sobre_pedido'),
  -- Productos base existentes (Etapa 1): variante personalizada para el
  -- diseñador v2 (no afecta las variantes de color/talla del catálogo).
  ('e0000000-0000-4000-8000-000000000901', 'd0000000-0000-4000-8000-000000000003',
   'Personalizado', 'PLY-CUSTOM', 349, 0, null, null, 'Personalizado', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000902', 'd0000000-0000-4000-8000-000000000004',
   'Personalizado', 'GRR-CUSTOM', 279, 0, null, null, 'Personalizado', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000903', 'd0000000-0000-4000-8000-000000000005',
   'Personalizado', 'TTE-CUSTOM', 249, 0, null, null, 'Personalizado', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000904', 'd0000000-0000-4000-8000-000000000006',
   'Personalizado', 'LSR-CUSTOM', 399, 0, null, null, 'Personalizado', 'sobre_pedido')
on conflict (id) do update set
  title = excluded.title,
  price = excluded.price,
  option_label = excluded.option_label,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Productos demo de Insumos (productos normales, con inventario, sin diseñador)
-- ---------------------------------------------------------------------------
insert into public.products
  (id, category_id, title, handle, description, base_price, compare_at_price,
   status, is_customizable, production_time, min_quantity, max_quantity, tags) values
  ('d0000000-0000-4000-8000-000000000020', 'c0000000-0000-4000-8000-000000000009',
   'Kit base para vaso SnowGlobe', 'kit-vaso-snowglobe',
   'Todo lo esencial para empezar tu vaso SnowGlobe con movimiento y brillo.',
   189, null, 'disponible', false, null, 1, 99, array['insumos','snowglobe-bar']),
  ('d0000000-0000-4000-8000-000000000021', 'c0000000-0000-4000-8000-00000000000a',
   'Llavero acrílico listo para personalizar', 'llavero-acrilico-blanco',
   'Llavero de acrílico listo para personalizar, con argolla incluida.',
   29, null, 'disponible', false, null, 1, 999, array['insumos','acrylab','llaveros']),
  ('d0000000-0000-4000-8000-000000000022', 'c0000000-0000-4000-8000-00000000000b',
   'Tag acrílico para personalizar', 'tag-acrilico-personalizar',
   'Tag de acrílico en distintas formas para etiquetas, regalos y detalles de marca.',
   25, null, 'disponible', false, null, 1, 999, array['insumos','acrylab']),
  ('d0000000-0000-4000-8000-000000000023', 'c0000000-0000-4000-8000-00000000000c',
   'Placa acrílica para diseño', 'lamina-acrilico',
   'Placa de acrílico para tus proyectos creativos: corta, graba y personaliza.',
   149, null, 'disponible', false, null, 1, 99, array['insumos','acrylab']),
  ('d0000000-0000-4000-8000-000000000024', 'c0000000-0000-4000-8000-00000000000d',
   'Accesorios para personalización', 'argollas-llavero-paquete',
   'Argollas y complementos para terminar tus llaveros y piezas creativas.',
   39, null, 'disponible', false, null, 1, 999, array['insumos','creator-tools']),
  ('d0000000-0000-4000-8000-000000000025', 'c0000000-0000-4000-8000-00000000000e',
   'Glitter chunky para vasos', 'glitter-fino-snowglobe',
   'Brillos decorativos para darle textura, color y personalidad a tus vasos y piezas.',
   45, null, 'disponible', false, null, 1, 999, array['insumos','sparkle-mix']),
  ('d0000000-0000-4000-8000-000000000026', 'c0000000-0000-4000-8000-00000000000f',
   'Líquido para efecto SnowGlobe', 'liquido-efecto-snowglobe',
   'Líquido para lograr movimiento y caída lenta dentro de tus vasos decorativos.',
   79, null, 'disponible', false, null, 1, 999, array['insumos','magic-flow']),
  ('d0000000-0000-4000-8000-000000000027', 'c0000000-0000-4000-8000-000000000010',
   'Wrap UV decorativo', 'wrap-uv-decorativo',
   'Lámina/wrap decorativo para transformar vasos, acrílicos y piezas con un acabado premium.',
   99, null, 'disponible', false, null, 1, 999, array['insumos','wraps-glow-finish']),
  ('d0000000-0000-4000-8000-000000000028', 'c0000000-0000-4000-8000-000000000009',
   'Vaso SnowGlobe listo para rellenar', 'vaso-snowglobe-rellenar',
   'Vaso listo para rellenar y crear tu efecto SnowGlobe con brillo y movimiento.',
   149, null, 'disponible', false, null, 1, 999, array['insumos','snowglobe-bar']),
  ('d0000000-0000-4000-8000-000000000029', 'c0000000-0000-4000-8000-000000000009',
   'Vaso SnowGlobe de vidrio', 'vaso-snowglobe-vidrio',
   'Vaso de vidrio para un acabado premium en tus piezas SnowGlobe.',
   189, null, 'disponible', false, null, 1, 999, array['insumos','snowglobe-bar']),
  ('d0000000-0000-4000-8000-00000000002a', 'c0000000-0000-4000-8000-00000000000e',
   'Mezcla de brillos decorativos', 'mezcla-brillos-decorativos',
   'Mezcla de brillos para dar textura, color y movimiento a tus piezas.',
   55, null, 'disponible', false, null, 1, 999, array['insumos','sparkle-mix']),
  ('d0000000-0000-4000-8000-00000000002b', 'c0000000-0000-4000-8000-00000000000e',
   'Mica efecto brillo', 'mica-efecto-brillo',
   'Mica decorativa para un efecto de brillo sutil en tus proyectos creativos.',
   49, null, 'disponible', false, null, 1, 999, array['insumos','sparkle-mix']),
  ('d0000000-0000-4000-8000-00000000002c', 'c0000000-0000-4000-8000-00000000000f',
   'Mezcla efecto lava', 'mezcla-efecto-lava',
   'Mezcla para lograr el efecto lava con caída lenta dentro de tus vasos.',
   89, null, 'disponible', false, null, 1, 999, array['insumos','magic-flow']),
  ('d0000000-0000-4000-8000-00000000002d', 'c0000000-0000-4000-8000-00000000000f',
   'Glicerina para movimiento lento', 'glicerina-movimiento-lento',
   'Glicerina para lograr movimiento lento y efecto visual en tus mezclas decorativas.',
   69, null, 'disponible', false, null, 1, 999, array['insumos','magic-flow']),
  ('d0000000-0000-4000-8000-00000000002e', 'c0000000-0000-4000-8000-000000000010',
   'Lámina decorativa para vaso', 'lamina-decorativa-vaso',
   'Lámina decorativa para transformar vasos y piezas con un acabado único.',
   59, null, 'disponible', false, null, 1, 999, array['insumos','wraps-glow-finish']),
  ('d0000000-0000-4000-8000-00000000002f', 'c0000000-0000-4000-8000-000000000010',
   'Resina UV para acabado brillante', 'resina-uv-acabado',
   'Resina UV para sellar y dar un acabado brillante a tus piezas creativas.',
   119, null, 'disponible', false, null, 1, 999, array['insumos','wraps-glow-finish'])
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  base_price = excluded.base_price,
  status = excluded.status,
  tags = excluded.tags;

-- Variante única con inventario para cada insumo (productos normales).
insert into public.product_variants
  (id, product_id, title, sku, price, stock, color, size, option_label, status) values
  ('e0000000-0000-4000-8000-000000000a01', 'd0000000-0000-4000-8000-000000000020',
   'Kit estándar', 'INS-SNOW-KIT', 189, 40, null, null, 'Kit estándar', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a02', 'd0000000-0000-4000-8000-000000000021',
   'Pieza', 'INS-LLV-BLN', 29, 200, null, null, 'Pieza', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a03', 'd0000000-0000-4000-8000-000000000022',
   'Pieza', 'INS-TAG-ACR', 25, 200, null, null, 'Pieza', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a04', 'd0000000-0000-4000-8000-000000000023',
   'Lámina', 'INS-LAM-ACR', 149, 60, null, null, 'Lámina', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a05', 'd0000000-0000-4000-8000-000000000024',
   'Paquete', 'INS-ARG-PKG', 39, 150, null, null, 'Paquete', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a06', 'd0000000-0000-4000-8000-000000000025',
   'Bote', 'INS-GLT-FIN', 45, 120, null, null, 'Bote', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a07', 'd0000000-0000-4000-8000-000000000026',
   'Botella', 'INS-MGF-LIQ', 79, 80, null, null, 'Botella', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a08', 'd0000000-0000-4000-8000-000000000027',
   'Hoja', 'INS-WRP-UV', 99, 100, null, null, 'Hoja', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a09', 'd0000000-0000-4000-8000-000000000028',
   'Pieza', 'INS-SNW-RLL', 149, 60, null, null, 'Pieza', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a0a', 'd0000000-0000-4000-8000-000000000029',
   'Pieza', 'INS-SNW-VID', 189, 40, null, null, 'Pieza', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a0b', 'd0000000-0000-4000-8000-00000000002a',
   'Bolsa', 'INS-SPK-MIX', 55, 100, null, null, 'Bolsa', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a0c', 'd0000000-0000-4000-8000-00000000002b',
   'Bote', 'INS-SPK-MICA', 49, 90, null, null, 'Bote', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a0d', 'd0000000-0000-4000-8000-00000000002c',
   'Botella', 'INS-MGF-LAVA', 89, 70, null, null, 'Botella', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a0e', 'd0000000-0000-4000-8000-00000000002d',
   'Botella', 'INS-MGF-GLI', 69, 80, null, null, 'Botella', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a0f', 'd0000000-0000-4000-8000-00000000002e',
   'Hoja', 'INS-WRP-LAM', 59, 100, null, null, 'Hoja', 'disponible'),
  ('e0000000-0000-4000-8000-000000000a10', 'd0000000-0000-4000-8000-00000000002f',
   'Bote', 'INS-WRP-RES', 119, 50, null, null, 'Bote', 'disponible')
on conflict (id) do update set
  title = excluded.title,
  price = excluded.price,
  stock = excluded.stock,
  status = excluded.status;
