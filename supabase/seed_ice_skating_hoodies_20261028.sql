begin;
set local lock_timeout='10s';
create temporary table ice_hoodies(code text,handle text,title text,name text) on commit drop;
insert into ice_hoodies values ('SU006','wear-sudadera-su006','Sudadera para adulto IceSkating Coach','IceSkating Coach'),
('SU007','wear-sudadera-su007','Sudadera para adulto IceSkating Dad','IceSkating Dad'),
('SU008','wear-sudadera-su008','Sudadera para adulto IceSkating','IceSkating'),
('SU009','wear-sudadera-su009','Sudadera para adulto IceSkating Mom','IceSkating Mom');
insert into public.products(handle,title,description,category_id,base_price,images,tags,status,is_customizable,min_quantity,max_quantity)
select h.handle,h.title,'Sudadera para adulto con diseño '||h.name||'. Elige uno de nueve colores, corte Hombre o Mujer y talla Chica, Mediana o Grande. Precio por pieza.',c.id,645,jsonb_build_array('/images/matrixlab-wear/hoodies/'||lower(h.code)||'-lila.webp'),array['matrixlab-wear','prenda-lista','tipo:sudaderas','adulto','coleccion:sudaderas','coleccion:ice-skating',h.code],'disponible',false,1,5
from ice_hoodies h join public.categories c on c.handle='wear-sudaderas'
on conflict(handle) do update set title=excluded.title,description=excluded.description,base_price=excluded.base_price,images=excluded.images,tags=excluded.tags;
with added as (
insert into public.product_variants(product_id,title,sku,price,stock,color,size,option_label,status)
select p.id,g.label||' / '||s.label||' / '||color.label,'WEAR-'||h.code||'-'||g.code||'-'||s.code||'-'||color.code,645,5,color.label,s.label,g.label,'disponible'
from ice_hoodies h join public.products p on p.handle=h.handle
cross join(values('Lila','LIL'),('Negro','NEG'),('Blanco','BLA'),('Negro jaspe','NJA'),('Gris jaspe','GJA'),('Rojo','ROJ'),('Azul marino','AMA'),('Azul royal','ARO'),('Rosa pastel','RPA'))color(label,code)
cross join(values('Hombre','H'),('Mujer','M'))g(label,code)
cross join(values('Chica','CH'),('Mediana','M'),('Grande','G'))s(label,code)
on conflict(sku) do nothing returning id,stock
)
insert into public.inventory_movements(product_variant_id,movement_type,quantity,reason)
select id,'reposicion',stock,'Alta autorizada IceSkating adulto: $645 MXN y 5 por color, corte y talla. 2026-10-28' from added;
do $$ begin
if(select count(*) from ice_hoodies h join public.products p using(handle) join public.product_variants v on v.product_id=p.id)<>216 then raise exception 'Expected 216 IceSkating variants';end if;
end $$;
commit;
select count(distinct p.id) products,count(v.id) variants,sum(v.stock) stock from products p join product_variants v on v.product_id=p.id where p.handle ~ '^wear-sudadera-su00[6-9]$';
