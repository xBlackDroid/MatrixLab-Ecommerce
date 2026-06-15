-- ============================================================================
-- MatrixLab Store Core — Etapa 2 — Seed aditivo (idempotente)
--
-- Agrega, sin borrar nada de Etapa 1:
--   * Categoría Insumos y sus subcategorías (como handles propios).
--   * Productos base de los nuevos diseñadores (sudadera, gorras, planillas)
--     con una variante "Personalizado" (sobre pedido) para el carrito.
--   * Variante "Personalizado" para los productos base existentes.
--   * Productos demo de Insumos con inventario.
--
-- Ejecutar después de supabase/seed.sql. Re-ejecutable (upsert por id).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Categorías: Insumos + subcategorías (modelo plano por handle)
-- ---------------------------------------------------------------------------
insert into public.categories (id, title, handle, description, sort_order, status) values
  ('c0000000-0000-4000-8000-000000000008', 'Insumos', 'insumos',
   'Materiales, accesorios y piezas listas para tus propios proyectos creativos.', 8, 'activa'),
  ('c0000000-0000-4000-8000-000000000009', 'Todo para tus Vasos SnowGlobe', 'snowglobe',
   'Bases, accesorios y consumibles para crear tus Vasos SnowGlobe.', 9, 'activa'),
  ('c0000000-0000-4000-8000-00000000000a', 'Llaveros', 'llaveros',
   'Llaveros en blanco y accesorios listos para personalizar.', 10, 'activa'),
  ('c0000000-0000-4000-8000-00000000000b', 'Tags personalizados de acrílico', 'tags-acrilico',
   'Tags de acrílico en distintas formas para tus proyectos y marcas.', 11, 'activa'),
  ('c0000000-0000-4000-8000-00000000000c', 'Acrílicos', 'acrilicos',
   'Láminas y piezas de acrílico para personalización y producción.', 12, 'activa'),
  ('c0000000-0000-4000-8000-00000000000d', 'Accesorios para personalización', 'accesorios-personalizacion',
   'Herrajes, argollas y complementos para terminar tus piezas.', 13, 'activa'),
  ('c0000000-0000-4000-8000-00000000000e', 'Repuestos y consumibles', 'repuestos-consumibles',
   'Consumibles y repuestos para mantener tu producción al día.', 14, 'activa')
on conflict (id) do update set
  title = excluded.title,
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
   'Kit base para Vaso SnowGlobe', 'kit-vaso-snowglobe',
   'Kit base para crear tus Vasos SnowGlobe: incluye los componentes esenciales para empezar tu proyecto.',
   189, null, 'disponible', false, null, 1, 99, array['insumos','snowglobe']),
  ('d0000000-0000-4000-8000-000000000021', 'c0000000-0000-4000-8000-00000000000a',
   'Llavero acrílico en blanco', 'llavero-acrilico-blanco',
   'Llavero de acrílico en blanco listo para personalizar, con argolla incluida.',
   29, null, 'disponible', false, null, 1, 999, array['insumos','llaveros']),
  ('d0000000-0000-4000-8000-000000000022', 'c0000000-0000-4000-8000-00000000000b',
   'Tag de acrílico para personalizar', 'tag-acrilico-personalizar',
   'Tag de acrílico transparente para etiquetas, regalos y detalles de marca.',
   25, null, 'disponible', false, null, 1, 999, array['insumos','acrilico']),
  ('d0000000-0000-4000-8000-000000000023', 'c0000000-0000-4000-8000-00000000000c',
   'Lámina de acrílico', 'lamina-acrilico',
   'Lámina de acrílico para corte y producción de piezas personalizadas.',
   149, null, 'disponible', false, null, 1, 99, array['insumos','acrilico']),
  ('d0000000-0000-4000-8000-000000000024', 'c0000000-0000-4000-8000-00000000000d',
   'Argollas para llavero (paquete)', 'argollas-llavero-paquete',
   'Paquete de argollas metálicas para terminar tus llaveros y accesorios.',
   39, null, 'disponible', false, null, 1, 999, array['insumos','accesorios']),
  ('d0000000-0000-4000-8000-000000000025', 'c0000000-0000-4000-8000-00000000000e',
   'Glitter fino para SnowGlobe', 'glitter-fino-snowglobe',
   'Glitter fino para dar brillo a tus Vasos SnowGlobe y proyectos creativos.',
   45, null, 'disponible', false, null, 1, 999, array['insumos','consumibles','snowglobe'])
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
   'Bote', 'INS-GLT-FIN', 45, 120, null, null, 'Bote', 'disponible')
on conflict (id) do update set
  title = excluded.title,
  price = excluded.price,
  stock = excluded.stock,
  status = excluded.status;
