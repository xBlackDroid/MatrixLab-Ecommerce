begin;
set local lock_timeout='10s';
insert into public.categories(handle,title,description,sort_order,status)
values('wear-sudaderas','Sudaderas para adulto','Sudaderas listas con diseños, nueve colores y tallas de adulto.',38,'activa')
on conflict(handle) do update set title=excluded.title,description=excluded.description;
create temporary table new_hoodies(code text,handle text,title text,description text) on commit drop;
insert into new_hoodies values
('SU001','wear-sudadera-su001','Sudadera para adulto Architect','Sudadera para adulto con diseño Architect. Elige tu color, corte Hombre o Mujer y talla Chica, Mediana o Grande. Precio por pieza.'),
('SU002','wear-sudadera-su002','Sudadera para adulto Barista','Sudadera para adulto con diseño Barista. Elige tu color, corte Hombre o Mujer y talla Chica, Mediana o Grande. Precio por pieza.'),
('SU003','wear-sudadera-su003','Sudadera para adulto Dance Teacher','Sudadera para adulto con diseño Dance Teacher. Elige tu color, corte Hombre o Mujer y talla Chica, Mediana o Grande. Precio por pieza.'),
('SU004','wear-sudadera-su004','Sudadera para adulto Coach','Sudadera para adulto con diseño Coach. Elige tu color, corte Hombre o Mujer y talla Chica, Mediana o Grande. Precio por pieza.'),
('SU005','wear-sudadera-su005','Sudadera para adulto Wife','Sudadera para adulto con diseño Wife. Elige tu color, corte Hombre o Mujer y talla Chica, Mediana o Grande. Precio por pieza.');
insert into public.products(handle,title,description,category_id,base_price,images,tags,status,is_customizable,min_quantity,max_quantity)
select h.handle,h.title,h.description,c.id,645,jsonb_build_array('/images/matrixlab-wear/hoodies/'||lower(h.code)||'-lila.webp'),
array['matrixlab-wear','prenda-lista','tipo:sudaderas','adulto','coleccion:sudaderas',h.code],
'disponible',false,1,5 from new_hoodies h join public.categories c on c.handle='wear-sudaderas'
on conflict(handle) do update set title=excluded.title,description=excluded.description,base_price=excluded.base_price,images=excluded.images,tags=excluded.tags,category_id=excluded.category_id;
with added as (
 insert into public.product_variants(product_id,title,sku,price,stock,color,size,option_label,status)
 select p.id,g.label||' / '||s.label||' / '||c.label,'WEAR-'||h.code||'-'||g.code||'-'||s.code||'-'||c.code,
 645,5,c.label,s.label,g.label,'disponible'
 from new_hoodies h join public.products p on p.handle=h.handle
 cross join (values ('Lila','LIL'),('Negro','NEG'),('Blanco','BLA'),('Negro jaspe','NJA'),('Gris jaspe','GJA'),('Rojo','ROJ'),('Azul marino','AMA'),('Azul royal','ARO'),('Rosa pastel','RPA')) c(label,code)
 cross join (values ('Hombre','H'),('Mujer','M')) g(label,code)
 cross join (values ('Chica','CH'),('Mediana','M'),('Grande','G')) s(label,code)
 on conflict(sku) do nothing returning id,stock
)
insert into public.inventory_movements(product_variant_id,movement_type,quantity,reason)
select id,'reposicion',stock,'Alta autorizada sudaderas adulto: 5 por color, corte y talla; $645 MXN. 2026-10-27' from added;
do $$ begin
 if (select count(*) from new_hoodies h join public.products p using(handle) join public.product_variants v on v.product_id=p.id) <> 270 then raise exception 'Expected 270 hoodie variants'; end if;
end $$;
commit;
select count(distinct p.id) products,count(v.id) variants,sum(v.stock) stock from products p join product_variants v on v.product_id=p.id where p.handle ~ '^wear-sudadera-su00[1-5]$';
