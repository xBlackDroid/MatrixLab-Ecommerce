-- ============================================================================
-- MatrixLab Tumbler — Vasos listos — Seed aditivo e idempotente
--
-- Habilita la compra directa de VL001–VL003. La vitrina conserva sus fotos
-- locales; aquí sólo se crean los productos y variantes que el carrito valida.
-- Los tres se alojan en la categoría existente `snowglobe`, igual que los
-- vasos base, para no crear otra categoría ni alterar la navegación pública.
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from public.categories where handle = 'snowglobe'
  ) then
    raise exception
      'Falta la categoría snowglobe. Ejecuta supabase/seed_etapa2.sql primero.';
  end if;
end $$;

with ready (
  product_id, variant_id, code, name, handle, sku, description, price, stock, position
) as (
  values
    (
      'f7000000-0000-4000-8000-000000000001'::uuid,
      'f8000000-0000-4000-8000-000000000001'::uuid,
      'VL001',
      'Vaso ToyStory Marcianitos',
      'vaso-listo-vl001',
      'TML-VL001',
      'Vaso inspirado en los marcianitos de Toy Story, con detalles coloridos y un acabado que convierte cada sorbo en una pequeña aventura. Una pieza lista para regalar o presumir tu fandom.',
      750::numeric,
      5::int,
      1::int
    ),
    (
      'f7000000-0000-4000-8000-000000000002'::uuid,
      'f8000000-0000-4000-8000-000000000002'::uuid,
      'VL002',
      'Vaso Halloween Fantasmas',
      'vaso-listo-vl002',
      'TML-VL002',
      'Vaso de Halloween con fantasmas juguetones y brillo iridiscente. Un diseño misterioso y divertido para darle personalidad a tus bebidas durante la temporada y todo el año.',
      380::numeric,
      5::int,
      2::int
    ),
    (
      'f7000000-0000-4000-8000-000000000003'::uuid,
      'f8000000-0000-4000-8000-000000000003'::uuid,
      'VL003',
      'Vaso Winnie Pooh Efecto Miel',
      'vaso-listo-vl003',
      'TML-VL003',
      'Vaso de Winnie Pooh con efecto miel, glitter dorado y detalles de sus personajes favoritos. Cálido, brillante y perfecto para un regalo que se disfruta todos los días.',
      420::numeric,
      5::int,
      3::int
    )
),
category as (
  select id from public.categories where handle = 'snowglobe'
),
upserted as (
  insert into public.products (
    id, category_id, title, handle, description, base_price, status,
    is_customizable, min_quantity, max_quantity, tags
  )
  select
    r.product_id,
    category.id,
    r.name,
    r.handle,
    r.description,
    r.price,
    case when r.stock > 0 then 'disponible' else 'agotado' end,
    false,
    1,
    greatest(r.stock, 1),
    array['vasos-listos', 'vasos', 'matrixlab-tumbler']
  from ready r cross join category
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
  r.variant_id,
  u.id,
  'Pieza',
  r.sku,
  r.price,
  r.stock,
  'Pieza',
  case when r.stock > 0 then 'disponible' else 'agotado' end
from ready r
join upserted u on u.handle = r.handle
on conflict (sku) do update set
  product_id = excluded.product_id,
  title = excluded.title,
  price = excluded.price,
  stock = excluded.stock,
  option_label = excluded.option_label,
  status = excluded.status;

-- Verificación opcional: debe devolver 3 productos, 3 variantes y 15 piezas.
-- select
--   (select count(*) from public.products where handle like 'vaso-listo-vl%') as productos,
--   (select count(*) from public.product_variants where sku like 'TML-VL%') as variantes,
--   (select coalesce(sum(stock), 0) from public.product_variants where sku like 'TML-VL%') as piezas;
