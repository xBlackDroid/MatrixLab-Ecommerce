-- ============================================================================
-- MatrixLab Store Core — Etiquetas Escolares Lab — Seed aditivo (idempotente)
--
-- Agrega, sin borrar nada:
--   * Categoría pública "Etiquetas escolares" (handle etiquetas-escolares).
--   * Producto base "Etiquetas escolares personalizadas" (personalizable).
--   * Variantes Elementary y Ultra para el carrito.
--
-- Ejecutar después de supabase/seed.sql, seed_etapa2.sql y la migración
-- 0005_school_labels.sql. Re-ejecutable (upsert por id).
--
-- PRECIOS: son PLACEHOLDERS claramente editables. Rafa debe ajustar el precio
-- final de Elementary y Ultra desde /admin/productos (o aquí) antes de vender.
-- El laboratorio NO inventa precios: usa el del producto base / variantes.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Categoría pública
-- ---------------------------------------------------------------------------
insert into public.categories (id, title, handle, description, sort_order, status) values
  ('c0000000-0000-4000-8000-000000000011', 'Etiquetas escolares', 'etiquetas-escolares',
   'Packs personalizados para útiles, loncheras, termos, cuadernos y regreso a clases.',
   17, 'activa')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Producto base (personalizable, sobre pedido)
-- base_price es un PLACEHOLDER editable desde admin.
-- ---------------------------------------------------------------------------
insert into public.products
  (id, category_id, title, handle, description, base_price, compare_at_price,
   status, is_customizable, production_time, min_quantity, max_quantity, tags) values
  ('d0000000-0000-4000-8000-000000000030', 'c0000000-0000-4000-8000-000000000011',
   'Etiquetas escolares personalizadas', 'etiquetas-escolares-personalizadas',
   'Pack de etiquetas escolares personalizadas con nombre, tipografía, combinación de colores y temática. Diseña tu pedido en el laboratorio y elige Elementary o Ultra. El precio final lo confirma MatrixLab.',
   199, null, 'sobre_pedido', true, '5 días hábiles (a convenir)', 1, 500,
   array['school-labels','regreso-a-clases','etiquetas','stickers'])
on conflict (id) do update set
  title = excluded.title,
  category_id = excluded.category_id,
  description = excluded.description,
  status = excluded.status,
  is_customizable = excluded.is_customizable,
  production_time = excluded.production_time,
  tags = excluded.tags;

-- ---------------------------------------------------------------------------
-- Variantes Elementary y Ultra (PRECIOS PLACEHOLDER, editar en admin).
-- option_label debe coincidir con SCHOOL_PACKAGES[].variantLabel del front
-- (src/lib/designer/school-labels/config.ts): "Elementary" / "Ultra".
-- ---------------------------------------------------------------------------
insert into public.product_variants
  (id, product_id, title, sku, price, stock, color, size, option_label, status) values
  ('e0000000-0000-4000-8000-000000000b01', 'd0000000-0000-4000-8000-000000000030',
   'Elementary', 'ESC-ELEM', 199, 0, null, null, 'Elementary', 'sobre_pedido'),
  ('e0000000-0000-4000-8000-000000000b02', 'd0000000-0000-4000-8000-000000000030',
   'Ultra', 'ESC-ULTRA', 299, 0, null, null, 'Ultra', 'sobre_pedido')
on conflict (id) do update set
  title = excluded.title,
  option_label = excluded.option_label,
  status = excluded.status;
  -- Nota: el precio NO se sobreescribe en re-ejecución para no pisar el precio
  -- final que el admin haya configurado. Ajusta el precio en /admin/productos.
