begin;
set local lock_timeout='10s';
insert into public.products(handle,title,description,category_id,base_price,images,tags,status,is_customizable,min_quantity,max_quantity)
select x.handle,x.title,x.description,c.id,x.price,jsonb_build_array(x.image),x.tags,'disponible',false,1,1
from (values
 ('wear-gorra-go001','Gorra Padel Queen','Gorra con diseño Padel Queen, lista para llevar.',279,'/images/matrixlab-wear/gorras/go001.webp',array['matrixlab-wear','prenda-lista','tipo:gorras','GO001'],'gorras'),
 ('wear-tote-to004','Tote bag Tennis Player','Tote bag con diseño Tennis Player, lista para llevar.',170,'/images/matrixlab-wear/totes/to004.webp',array['matrixlab-wear','prenda-lista','tipo:totes','coleccion:totes','TO004'],'wear-totes')
) x(handle,title,description,price,image,tags,category) join public.categories c on c.handle=x.category
on conflict(handle) do update set title=excluded.title,description=excluded.description,base_price=excluded.base_price,images=excluded.images,tags=excluded.tags;
with added as (
 insert into public.product_variants(product_id,title,sku,price,stock,status)
 select p.id,'Pieza',x.sku,x.price,1,'disponible' from (values
 ('wear-gorra-go001','WEAR-GO001',279),('wear-tote-to004','WEAR-TO004',170)
 ) x(handle,sku,price) join public.products p on p.handle=x.handle
 on conflict(sku) do nothing returning id,stock
)
insert into public.inventory_movements(product_variant_id,movement_type,quantity,reason)
select id,'reposicion',stock,'Alta autorizada Padel Queen $279 / Tennis Player $170 MXN, 1 existencia. 2026-10-28' from added;
commit;
