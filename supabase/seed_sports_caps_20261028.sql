begin;
set local lock_timeout='10s';
create temporary table sports_caps(code text,handle text,title text) on commit drop;
insert into sports_caps values ('GO001','wear-gorra-go001','Gorra Padel Queen'),
('GO002','wear-gorra-go002','Gorra Marathon Runner'),
('GO003','wear-gorra-go003','Gorra Crossfit'),
('GO004','wear-gorra-go004','Gorra Gym Rat'),
('GO005','wear-gorra-go005','Gorra Gym Addict'),
('GO006','wear-gorra-go006','Gorra Padel Player');
insert into public.products(handle,title,description,category_id,base_price,images,tags,status,is_customizable,min_quantity,max_quantity)
select c.handle,c.title,'Gorra deportiva con diseño '||replace(c.title,'Gorra ','')||'. Elige Rosa, Negro, Blanco o Rosa pastel. Precio por pieza.',cat.id,279,jsonb_build_array('/images/matrixlab-wear/gorras/colors/'||lower(c.code)||'-rosa.webp'),array['matrixlab-wear','prenda-lista','tipo:gorras','coleccion:gorras',c.code],'disponible',false,1,1
from sports_caps c join public.categories cat on cat.handle='gorras'
on conflict(handle) do update set title=excluded.title,description=excluded.description,base_price=excluded.base_price,images=excluded.images,tags=excluded.tags;
-- Conservar el ID y las existencias de Padel Queen existentes: su pieza pasa a ser Rosa.
update public.product_variants v set color='Rosa',title='Rosa'
from public.products p where v.product_id=p.id and p.handle='wear-gorra-go001' and v.sku='WEAR-GO001' and v.color is null;
with added as (
insert into public.product_variants(product_id,title,sku,price,stock,color,status)
select p.id,color.label,'WEAR-'||c.code||'-'||color.code,279,1,color.label,'disponible'
from sports_caps c join public.products p on p.handle=c.handle
cross join (values('Rosa','ROS'),('Negro','NEG'),('Blanco','BLA'),('Rosa pastel','RPA')) color(label,code)
where not exists (select 1 from public.product_variants old where old.product_id=p.id and old.color=color.label)
on conflict(sku) do nothing returning id,stock
)
insert into public.inventory_movements(product_variant_id,movement_type,quantity,reason)
select id,'reposicion',stock,'Alta autorizada gorras deportivas: $279 MXN, una por color. 2026-10-28' from added;
do $$ begin
if (select count(*) from sports_caps c join public.products p using(handle) join public.product_variants v on v.product_id=p.id) <>24 then raise exception 'Expected 24 cap variants';end if;
end $$;
commit;
select count(distinct p.id) products,count(v.id) variants,sum(v.stock) stock from products p join product_variants v on v.product_id=p.id where p.handle ~ '^wear-gorra-go00[1-6]$';
