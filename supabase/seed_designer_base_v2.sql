-- ============================================================================
-- MatrixLab Store Core — seed_designer_base_v2.sql
-- Seed de reparación de PRODUCCIÓN para los productos base del Laboratorio.
--
-- QA productivo detectó que en Supabase producción solo existe el producto
-- base `etiquetas-escolares-personalizadas`. Este script garantiza TODOS los
-- productos base que usan los diseñadores:
--
--   Diseñador                → handle del producto base
--   ------------------------  ---------------------------------------
--   playera                  → playera-personalizada
--   sudadera                 → sudadera-personalizada
--   gorra-trucker            → gorra-trucker-personalizada
--   gorra-clasica            → gorra-clasica-personalizada
--   gorra (alias legado)     → gorra-personalizada
--   tote                     → tote-bag-personalizada
--   stickers-planilla        → planilla-stickers
--   stickers-repeticion      → planilla-stickers (compartido)
--   imanes-* (legado)        → planilla-imanes
--   laser                    → grabado-laser-personalizado
--   etiquetas-escolares      → etiquetas-escolares-personalizadas
--
-- Además asegura la categoría/producto de "Impresión 3D" para que el CTA de
-- la home (/tienda/categoria/impresion-3d) sea una ruta real (Prioridad 4).
--
-- GARANTÍAS (verificadas contra el esquema real de 0001_schema.sql +
-- 0004_designer_expansion.sql + 0005_school_labels.sql):
--   * TRANSACCIONAL: todo corre dentro de un único bloque DO (atómico) más
--     begin/commit explícitos. Si algo falla, no queda estado a medias.
--   * IDEMPOTENTE: se puede ejecutar N veces. Los upserts son por `handle`
--     (categories/products) y por `sku` (product_variants), que son UNIQUE.
--   * NO DESTRUCTIVO: no borra filas, no reemplaza ids existentes, no pisa
--     títulos/descripciones/precios curados. En filas existentes solo repara
--     lo mínimo para que el flujo del diseñador funcione:
--       - producto: is_customizable = true; si estaba 'oculto' lo saca al
--         status canónico; si no tiene categoría, le asigna la canónica;
--         si base_price quedó en 0, restaura el precio canónico;
--         si min_quantity > 1, lo baja a 1 (el diseñador agrega quantity=1).
--       - variante: si estaba 'oculto' o 'agotado' la reactiva al status
--         canónico ('sobre_pedido': vendible sin stock); si price quedó en 0,
--         restaura el precio canónico.
--   * A PRUEBA DE IDS RECICLADOS: si un id canónico (d0…/e0…/c0…) ya está
--     ocupado por OTRA fila, la inserción usa gen_random_uuid() en su lugar
--     (nunca falla por PK, nunca re-apunta ids ajenos).
--   * VARIANTE GARANTIZADA: al final, cualquier producto base que quede sin
--     variante visible recibe una variante de reparación (sku sufijo -R).
--
-- Estados elegidos (compatibles con el catálogo público y con el carrito):
--   * Productos de prendas (playera/sudadera/gorras/tote): 'disponible'.
--   * Planillas / láser / etiquetas / pieza 3D: 'sobre_pedido' (visible en
--     catálogo y vendible sin stock; checkAvailability lo acepta).
--   * Variantes del diseñador: 'sobre_pedido' con stock 0 (personalizados se
--     producen bajo pedido; el carrito NO exige stock en 'sobre_pedido').
--
-- CÓMO EJECUTAR: copiar y pegar TODO el archivo en el SQL Editor de Supabase
-- (proyecto de producción) y correr. Requiere migraciones 0001+ aplicadas.
-- La última consulta es la validación: debe devolver una fila por handle con
-- ok = true en todas.
-- ============================================================================

begin;

do $$
declare
  rec record;
  v_category_id uuid;
  v_product_id uuid;
  v_insert_id uuid;
begin
  -- -------------------------------------------------------------------------
  -- 1) CATEGORÍAS requeridas (upsert por handle; solo se repara status).
  -- -------------------------------------------------------------------------
  for rec in
    select * from (values
      ('c0000000-0000-4000-8000-000000000001'::uuid, 'Stickers', 'stickers',
       'Stickers personalizados para marcas, eventos, regalos, campañas, empaques y colecciones.', 1),
      ('c0000000-0000-4000-8000-000000000002'::uuid, 'Imanes', 'imanes',
       'Imanes personalizados para refrigerador, eventos, recuerdos, marcas y promociones.', 2),
      ('c0000000-0000-4000-8000-000000000003'::uuid, 'Playeras y prendas', 'playeras-prendas',
       'Prendas personalizadas con acabado premium para personas, eventos, equipos, escuelas y empresas.', 3),
      ('c0000000-0000-4000-8000-000000000004'::uuid, 'Gorras', 'gorras',
       'Gorras personalizadas para eventos, marcas, equipos y activaciones especiales.', 4),
      ('c0000000-0000-4000-8000-000000000005'::uuid, 'Grabado láser', 'grabado-laser',
       'Piezas personalizadas en madera, acrílico, metal y materiales especiales.', 5),
      ('c0000000-0000-4000-8000-000000000006'::uuid, 'Impresión 3D', 'impresion-3d',
       'Piezas únicas, prototipos, decoración, accesorios y objetos personalizados capa por capa.', 6),
      ('c0000000-0000-4000-8000-000000000011'::uuid, 'Etiquetas escolares', 'etiquetas-escolares',
       'Packs personalizados para útiles, loncheras, termos, cuadernos y regreso a clases.', 17)
    ) as t(id, title, handle, description, sort_order)
  loop
    if exists (select 1 from public.categories c where c.handle = rec.handle) then
      -- Fila existente: solo garantizamos que esté activa. Nada más se toca.
      update public.categories
         set status = 'activa'
       where handle = rec.handle
         and status <> 'activa';
    else
      -- Fila nueva: usa el id canónico salvo que otra fila ya lo ocupe.
      v_insert_id := case
        when exists (select 1 from public.categories c where c.id = rec.id)
          then gen_random_uuid()
        else rec.id
      end;
      insert into public.categories (id, title, handle, description, sort_order, status)
      values (v_insert_id, rec.title, rec.handle, rec.description, rec.sort_order, 'activa');
    end if;
  end loop;

  -- -------------------------------------------------------------------------
  -- 2) PRODUCTOS base del laboratorio (upsert por handle).
  --    En filas existentes NO se pisa título/descripción/precio curado.
  -- -------------------------------------------------------------------------
  for rec in
    select * from (values
      ('d0000000-0000-4000-8000-000000000003'::uuid, 'playeras-prendas',
       'Playera personalizada', 'playera-personalizada',
       'Playera de algodón suave con personalización premium. Sube tu diseño en el laboratorio interactivo, elige color y talla, y recibe una prenda lista para presumir. Ideal para personas, equipos, escuelas y empresas.',
       349.00, 399.00, 'disponible', '3 a 5 días hábiles', 500,
       array['personalizable','laboratorio','volumen']),
      ('d0000000-0000-4000-8000-000000000008'::uuid, 'playeras-prendas',
       'Sudadera personalizada', 'sudadera-personalizada',
       'Sudadera personalizada con acabado premium para eventos, marcas, regalos y equipos. Diseña la tuya en el laboratorio interactivo.',
       549.00, null, 'disponible', '4 a 6 días hábiles', 500,
       array['personalizable','laboratorio','volumen']),
      ('d0000000-0000-4000-8000-000000000009'::uuid, 'gorras',
       'Gorra trucker personalizada', 'gorra-trucker-personalizada',
       'Gorra trucker personalizada para eventos, marcas, equipos y activaciones. Diseña tu frente en el laboratorio.',
       289.00, null, 'disponible', '3 a 5 días hábiles', 500,
       array['personalizable','laboratorio']),
      ('d0000000-0000-4000-8000-00000000000a'::uuid, 'gorras',
       'Gorra clásica ajustable', 'gorra-clasica-personalizada',
       'Gorra clásica ajustable con personalización premium para destacar tu marca o evento.',
       279.00, null, 'disponible', '3 a 5 días hábiles', 500,
       array['personalizable','laboratorio']),
      ('d0000000-0000-4000-8000-000000000004'::uuid, 'gorras',
       'Gorra personalizada', 'gorra-personalizada',
       'Gorra estructurada con acabado premium y tu diseño al frente. Perfecta para marcas, eventos, equipos deportivos y regalos especiales.',
       279.00, null, 'disponible', '3 a 5 días hábiles', 500,
       array['personalizable','laboratorio']),
      ('d0000000-0000-4000-8000-000000000005'::uuid, 'playeras-prendas',
       'Tote bag personalizada', 'tote-bag-personalizada',
       'Bolsa de tela resistente con personalización textil premium. Diseña la tuya en el laboratorio: regalos, eventos, librerías, marcas y uso diario con estilo.',
       249.00, null, 'disponible', '3 a 5 días hábiles', 500,
       array['personalizable','laboratorio','eco']),
      ('d0000000-0000-4000-8000-00000000000b'::uuid, 'stickers',
       'Planilla de stickers', 'planilla-stickers',
       'Arma tu planilla de stickers personalizados en hoja tamaño carta. Sube tus imágenes o repite un diseño y nosotros producimos.',
       199.00, null, 'sobre_pedido', '3 a 5 días hábiles', 999,
       array['personalizable','laboratorio','planilla']),
      ('d0000000-0000-4000-8000-00000000000c'::uuid, 'imanes',
       'Planilla de imanes', 'planilla-imanes',
       'Crea una planilla de imanes personalizados en hoja tamaño carta con tus imágenes favoritas.',
       249.00, null, 'sobre_pedido', '3 a 5 días hábiles', 999,
       array['personalizable','laboratorio','planilla']),
      ('d0000000-0000-4000-8000-000000000006'::uuid, 'grabado-laser',
       'Grabado láser personalizado', 'grabado-laser-personalizado',
       'Piezas únicas grabadas en madera, acrílico o metal: placas, llaveros, reconocimientos, señalética y regalos corporativos. Este producto se prepara sobre pedido con acabados profesionales.',
       399.00, null, 'sobre_pedido', '5 a 7 días hábiles', 200,
       array['personalizable','sobre-pedido','empresas']),
      ('d0000000-0000-4000-8000-000000000030'::uuid, 'etiquetas-escolares',
       'Etiquetas escolares personalizadas', 'etiquetas-escolares-personalizadas',
       'Pack de etiquetas escolares personalizadas con nombre, tipografía, combinación de colores y temática. Diseña tu pedido en el laboratorio y elige Elementary o Ultra. El precio final lo confirma MatrixLab.',
       199.00, null, 'sobre_pedido', '5 días hábiles (a convenir)', 500,
       array['school-labels','regreso-a-clases','etiquetas','stickers']),
      -- Prioridad 4: la card "Impresión 3D" de la home apunta a una categoría
      -- real con al menos un producto cotizable.
      ('d0000000-0000-4000-8000-000000000007'::uuid, 'impresion-3d',
       'Pieza 3D personalizada', 'pieza-3d-personalizada',
       'Objetos impresos capa por capa: prototipos, figuras, decoración, accesorios y refacciones creativas. Cuéntanos tu idea y la hacemos realidad sobre pedido.',
       299.00, null, 'sobre_pedido', '5 a 7 días hábiles', 100,
       array['personalizable','sobre-pedido','prototipos'])
    ) as t(id, category_handle, title, handle, description, base_price,
           compare_at_price, status, production_time, max_quantity, tags)
  loop
    select c.id into v_category_id
      from public.categories c
     where c.handle = rec.category_handle;

    if exists (select 1 from public.products p where p.handle = rec.handle) then
      -- Reparación mínima de la fila existente (datos curados intactos).
      update public.products p
         set is_customizable = true,
             status = case when p.status = 'oculto' then rec.status else p.status end,
             category_id = coalesce(p.category_id, v_category_id),
             base_price = case when p.base_price <= 0 then rec.base_price else p.base_price end,
             min_quantity = case when p.min_quantity > 1 then 1 else p.min_quantity end
       where p.handle = rec.handle;
    else
      v_insert_id := case
        when exists (select 1 from public.products p where p.id = rec.id)
          then gen_random_uuid()
        else rec.id
      end;
      insert into public.products
        (id, category_id, title, handle, description, base_price,
         compare_at_price, status, is_customizable, production_time,
         min_quantity, max_quantity, tags)
      values
        (v_insert_id, v_category_id, rec.title, rec.handle, rec.description,
         rec.base_price, rec.compare_at_price, rec.status, true,
         rec.production_time, 1, rec.max_quantity, rec.tags);
    end if;
  end loop;

  -- -------------------------------------------------------------------------
  -- 3) VARIANTES del diseñador (upsert por sku).
  --    El diseñador busca la variante "-CUSTOM" (o la primera visible);
  --    etiquetas escolares busca por option_label Elementary / Ultra.
  -- -------------------------------------------------------------------------
  for rec in
    select * from (values
      ('e0000000-0000-4000-8000-000000000901'::uuid, 'playera-personalizada',
       'Personalizado', 'PLY-CUSTOM', 349.00, 'Personalizado'),
      ('e0000000-0000-4000-8000-000000000801'::uuid, 'sudadera-personalizada',
       'Personalizado', 'SUD-CUSTOM', 549.00, 'Personalizado'),
      ('e0000000-0000-4000-8000-000000000802'::uuid, 'gorra-trucker-personalizada',
       'Personalizado', 'GTR-CUSTOM', 289.00, 'Personalizado'),
      ('e0000000-0000-4000-8000-000000000803'::uuid, 'gorra-clasica-personalizada',
       'Personalizado', 'GCL-CUSTOM', 279.00, 'Personalizado'),
      ('e0000000-0000-4000-8000-000000000902'::uuid, 'gorra-personalizada',
       'Personalizado', 'GRR-CUSTOM', 279.00, 'Personalizado'),
      ('e0000000-0000-4000-8000-000000000903'::uuid, 'tote-bag-personalizada',
       'Personalizado', 'TTE-CUSTOM', 249.00, 'Personalizado'),
      ('e0000000-0000-4000-8000-000000000804'::uuid, 'planilla-stickers',
       'Personalizado', 'PLS-CUSTOM', 199.00, 'Hoja carta'),
      ('e0000000-0000-4000-8000-000000000805'::uuid, 'planilla-imanes',
       'Personalizado', 'PLM-CUSTOM', 249.00, 'Hoja carta'),
      ('e0000000-0000-4000-8000-000000000904'::uuid, 'grabado-laser-personalizado',
       'Personalizado', 'LSR-CUSTOM', 399.00, 'Personalizado'),
      ('e0000000-0000-4000-8000-000000000b01'::uuid, 'etiquetas-escolares-personalizadas',
       'Elementary', 'ESC-ELEM', 199.00, 'Elementary'),
      ('e0000000-0000-4000-8000-000000000b02'::uuid, 'etiquetas-escolares-personalizadas',
       'Ultra', 'ESC-ULTRA', 299.00, 'Ultra'),
      ('e0000000-0000-4000-8000-000000000701'::uuid, 'pieza-3d-personalizada',
       'Chica (hasta 8 cm)', '3DP-CH', 299.00, 'Tamaño chico')
    ) as t(id, product_handle, title, sku, price, option_label)
  loop
    select p.id into v_product_id
      from public.products p
     where p.handle = rec.product_handle;
    if v_product_id is null then
      continue; -- no debería pasar: el paso 2 garantiza el producto
    end if;

    if exists (select 1 from public.product_variants v where v.sku = rec.sku) then
      -- Reparación mínima: reactivar y garantizar precio > 0. No se re-apunta
      -- la variante a otro producto ni se pisa un precio curado válido.
      update public.product_variants v
         set status = case when v.status in ('oculto', 'agotado') then 'sobre_pedido' else v.status end,
             price = case when v.price is not null and v.price <= 0 then rec.price else v.price end
       where v.sku = rec.sku;
    else
      v_insert_id := case
        when exists (select 1 from public.product_variants v where v.id = rec.id)
          then gen_random_uuid()
        else rec.id
      end;
      insert into public.product_variants
        (id, product_id, title, sku, price, stock, color, size, option_label, status)
      values
        (v_insert_id, v_product_id, rec.title, rec.sku, rec.price, 0,
         null, null, rec.option_label, 'sobre_pedido');
    end if;
  end loop;

  -- -------------------------------------------------------------------------
  -- 4) GARANTÍA FINAL: todo producto base debe tener AL MENOS una variante
  --    visible. Cubre el caso anómalo de un sku canónico ligado a otro
  --    producto o variantes curadas dejadas en 'oculto'/'agotado'.
  -- -------------------------------------------------------------------------
  for rec in
    select p.id as product_id, p.handle, p.base_price
      from public.products p
     where p.handle in (
        'playera-personalizada','sudadera-personalizada',
        'gorra-trucker-personalizada','gorra-clasica-personalizada',
        'gorra-personalizada','tote-bag-personalizada',
        'planilla-stickers','planilla-imanes',
        'grabado-laser-personalizado','etiquetas-escolares-personalizadas',
        'pieza-3d-personalizada')
       and not exists (
         select 1 from public.product_variants v
          where v.product_id = p.id
            and v.status not in ('oculto', 'agotado')
       )
  loop
    insert into public.product_variants
      (id, product_id, title, sku, price, stock, option_label, status)
    values
      (gen_random_uuid(), rec.product_id, 'Personalizado',
       upper(replace(rec.handle, '-', '')) || '-R', rec.base_price, 0,
       'Personalizado', 'sobre_pedido');
  end loop;
end;
$$;

commit;

-- ============================================================================
-- VALIDACIÓN (correr después del bloque anterior; también es seguro sola).
-- Debe devolver una fila por handle con:
--   status ∈ {disponible, sobre_pedido}, is_customizable = true,
--   variantes_visibles >= 1, sku de variante y precio > 0.
-- ============================================================================
with base(handle) as (
  values
    ('playera-personalizada'),
    ('sudadera-personalizada'),
    ('gorra-trucker-personalizada'),
    ('gorra-clasica-personalizada'),
    ('gorra-personalizada'),
    ('tote-bag-personalizada'),
    ('planilla-stickers'),
    ('planilla-imanes'),
    ('grabado-laser-personalizado'),
    ('etiquetas-escolares-personalizadas'),
    ('pieza-3d-personalizada')
)
select
  b.handle,
  p.status,
  p.is_customizable,
  count(v.id) filter (where v.status not in ('oculto', 'agotado'))
    as variantes_visibles,
  string_agg(v.sku, ', ' order by v.sku)
    filter (where v.status not in ('oculto', 'agotado'))
    as sku_variantes,
  min(coalesce(v.price, p.base_price))
    filter (where v.status not in ('oculto', 'agotado'))
    as precio,
  (
    p.id is not null
    and p.status in ('disponible', 'agotado', 'sobre_pedido', 'proximamente')
    and p.status <> 'oculto'
    and p.is_customizable
    and count(v.id) filter (where v.status not in ('oculto', 'agotado')) >= 1
    and min(coalesce(v.price, p.base_price))
          filter (where v.status not in ('oculto', 'agotado')) > 0
  ) as ok
from base b
left join public.products p on p.handle = b.handle
left join public.product_variants v on v.product_id = p.id
group by b.handle, p.id, p.status, p.is_customizable
order by b.handle;
