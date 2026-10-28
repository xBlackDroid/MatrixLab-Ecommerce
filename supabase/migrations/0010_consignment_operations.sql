-- Consignaciones: operaciones atómicas. Aplicar después de 0009.
-- No modifica inventario, precios ni documentos de la tienda.
-- Cada distribuidor es un mutex transaccional: orden único de bloqueos.

create or replace function public.consignment_check_scope() returns trigger
language plpgsql set search_path = pg_catalog, public as $$
declare j jsonb := to_jsonb(new); k text; target text; found_id uuid;
begin
  for k,target in select * from (values
    ('item_id','consignment_items'),('delivery_id','consignment_deliveries'),
    ('delivery_line_id','consignment_delivery_lines'),('lot_id','consignment_lots'),
    ('sale_id','consignment_sales'),('sale_line_id','consignment_sale_lines'),
    ('allocation_id','consignment_sale_allocations'),('payment_id','consignment_payments'),
    ('return_id','consignment_returns'),('adjustment_id','consignment_adjustments'),
    ('membership_id','distributor_memberships')) refs(k,t)
  loop
    if j->>k is not null then
      execute format('select distributor_id from public.%I where id=$1',target)
        into found_id using (j->>k)::uuid;
      if found_id is distinct from new.distributor_id then raise exception 'CONS_NOT_FOUND'; end if;
    end if;
  end loop;
  if j->>'lot_id' is not null and j->>'item_id' is not null then
    if not exists(select 1 from public.consignment_lots l where l.id=(j->>'lot_id')::uuid
      and l.item_id=(j->>'item_id')::uuid) then raise exception 'CONS_SCOPE'; end if;
  end if;
  if tg_table_name='consignment_lots' then
    if new.source_type='entrega' then
      if not exists(select 1 from public.consignment_delivery_lines dl where dl.id=new.delivery_line_id
        and dl.item_id=new.item_id and dl.unit_cost_cents=new.unit_cost_cents) then raise exception 'CONS_SCOPE'; end if;
    end if;
  end if;
  if tg_table_name='consignment_sale_allocations' then
    if not exists(select 1 from public.consignment_sale_lines s join public.consignment_lots l
      on l.id=new.lot_id where s.id=new.sale_line_id and s.sale_id=new.sale_id
      and s.item_id=new.item_id and l.item_id=new.item_id and l.unit_cost_cents=new.unit_cost_cents)
    then raise exception 'CONS_SCOPE'; end if;
  elsif tg_table_name='consignment_return_lines' then
    if not exists(select 1 from public.consignment_sale_allocations a where a.id=new.allocation_id
      and a.sale_line_id=new.sale_line_id and a.lot_id=new.lot_id and a.item_id=new.item_id
      and a.unit_cost_cents=new.unit_cost_cents) then raise exception 'CONS_SCOPE'; end if;
  elsif tg_table_name='consignment_sessions' then
    if not exists(select 1 from public.distributor_memberships m where m.id=new.membership_id
      and m.auth_user_id=new.auth_user_id) then raise exception 'CONS_SCOPE'; end if;
  end if;
  return new;
end $$;
do $$ declare t text; begin
  foreach t in array array['consignment_sessions','consignment_delivery_lines','consignment_lots',
    'consignment_sales','consignment_sale_lines','consignment_sale_allocations','consignment_returns',
    'consignment_return_lines','consignment_adjustments','consignment_payment_applications','consignment_movements']
  loop
    execute format('create trigger consignment_scope before insert or update on public.%I for each row execute function public.consignment_check_scope()',t);
  end loop;
end $$;

create or replace function public.consignment_immutable() returns trigger
language plpgsql set search_path=pg_catalog,public as $$ begin
  if tg_op='DELETE' or tg_table_name in ('consignment_movements','consignment_audit_events') then
    raise exception 'CONS_IMMUTABLE';
  end if;
  if (to_jsonb(new)-'available_quantity') is distinct from (to_jsonb(old)-'available_quantity') then
    raise exception 'CONS_IMMUTABLE';
  end if;
  return new;
end $$;
create trigger consignment_lot_immutable before update or delete on public.consignment_lots
  for each row execute function public.consignment_immutable();
create trigger consignment_ledger_immutable before update or delete on public.consignment_movements
  for each row execute function public.consignment_immutable();
create trigger consignment_audit_immutable before update or delete on public.consignment_audit_events
  for each row execute function public.consignment_immutable();

create view public.consignment_sale_balances with (security_invoker=true) as
select s.*, s.debt_cents-s.debt_reverted_cents as net_debt_cents,
  coalesce(a.applied,0)::bigint as applied_cents,
  (s.debt_cents-s.debt_reverted_cents-coalesce(a.applied,0))::bigint as pending_cents
from public.consignment_sales s left join lateral
  (select sum(amount_cents) applied from public.consignment_payment_applications
   where sale_id=s.id and status='activa') a on true;
create view public.consignment_payment_balances with (security_invoker=true) as
select p.*,coalesce(a.applied,0)::bigint as applied_cents,
  (case when p.status='activo' then p.amount_cents else 0 end-coalesce(a.applied,0))::bigint as available_cents
from public.consignment_payments p left join lateral
  (select sum(amount_cents) applied from public.consignment_payment_applications
   where payment_id=p.id and status='activa') a on true;
create view public.consignment_reconciliation with (security_invoker=true) as
select l.id,l.distributor_id,l.available_quantity,coalesce(sum(m.delta),0)::bigint ledger_quantity
from public.consignment_lots l left join public.consignment_movements m on m.lot_id=l.id
group by l.id;
revoke all on public.consignment_sale_balances, public.consignment_payment_balances,
  public.consignment_reconciliation from public,anon,authenticated;
grant select on public.consignment_sale_balances, public.consignment_payment_balances,
  public.consignment_reconciliation to service_role;

create or replace function public.consignment_preview(p_distributor uuid,p_lines jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare x jsonb; i public.consignment_items; l public.consignment_lots; needed int; take int;
  debt bigint:=0; line_debt bigint; public_total bigint:=0; allocations jsonb; lines jsonb:='[]';
  result jsonb; q int; price bigint;
begin
  if p_lines is null or jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines) not between 1 and 50 then
    raise exception 'CONS_INVALID'; end if;
  if (select count(distinct a->>'itemId') from jsonb_array_elements(p_lines) a)<>jsonb_array_length(p_lines)
    then raise exception 'CONS_INVALID'; end if;
  for x in select value from jsonb_array_elements(p_lines) order by value->>'itemId' loop
    q:=(x->>'quantity')::int; price:=(x->>'priceCents')::bigint;
    if not public.consignment_qty_ok(q) or not public.consignment_money_ok(price)
      or (price=0 and length(btrim(coalesce(x->>'zeroReason',''))) < 3) then raise exception 'CONS_INVALID'; end if;
    select * into i from public.consignment_items where id=(x->>'itemId')::uuid
      and distributor_id=p_distributor and status='activa';
    if not found then raise exception 'CONS_NOT_FOUND'; end if;
    needed:=q; line_debt:=0; allocations:='[]';
    for l in select * from public.consignment_lots where item_id=i.id and distributor_id=p_distributor
      and available_quantity>0 order by received_at,fifo_seq loop
      take:=least(needed,l.available_quantity); if take=0 then exit; end if;
      allocations:=allocations || jsonb_build_array(jsonb_build_object('lotId',l.id,'quantity',take,'costCents',l.unit_cost_cents));
      line_debt:=line_debt+take::bigint*l.unit_cost_cents; needed:=needed-take;
    end loop;
    if needed>0 then raise exception 'CONS_STOCK'; end if;
    lines:=lines || jsonb_build_array(jsonb_build_object('itemId',i.id,'name',i.name,'sku',i.sku,
      'quantity',q,'priceCents',price,'suggestedCents',i.suggested_price_cents,'debtCents',line_debt,'allocations',allocations));
    debt:=debt+line_debt; public_total:=public_total+q::bigint*price;
  end loop;
  if not public.consignment_money_ok(debt) or not public.consignment_money_ok(public_total) then raise exception 'CONS_INVALID'; end if;
  result:=jsonb_build_object('lines',lines,'debtCents',debt,'publicCents',public_total);
  return result || jsonb_build_object('fingerprint',encode(sha256(convert_to(result::text,'UTF8')),'hex'));
end $$;

-- Liberar aplicaciones excedentes tras devolver/anular una venta.
create or replace function public.consignment_release(p_sale uuid,p_return uuid,p_actor text,p_reason text)
returns bigint language plpgsql set search_path=pg_catalog,public as $$
declare b record; a record; excess bigint; release bigint; total bigint:=0;
begin
  select * into b from public.consignment_sale_balances where id=p_sale;
  excess:=greatest(0,-b.pending_cents);
  for a in select * from public.consignment_payment_applications where sale_id=p_sale and status='activa'
    order by created_at desc,id desc loop
    if excess=0 then exit; end if;
    release:=least(excess,a.amount_cents);
    update public.consignment_payment_applications set status='revertida',reverted_at=now(),
      revert_reason=p_reason,reverted_by_return_id=p_return where id=a.id;
    if release<a.amount_cents then
      insert into public.consignment_payment_applications(distributor_id,payment_id,sale_id,amount_cents,
        source,replaced_application_id,actor) values(a.distributor_id,a.payment_id,a.sale_id,
        a.amount_cents-release,a.source,a.id,p_actor);
    end if;
    excess:=excess-release; total:=total+release;
  end loop;
  return total;
end $$;

create or replace function public.consignment_apply(p_dist uuid,p_payment uuid,p_actor text,p_source text,p_targets jsonb)
returns void language plpgsql set search_path=pg_catalog,public as $$
declare p record; s record; target jsonb; remaining bigint; amount bigint;
begin
  select * into p from public.consignment_payment_balances where id=p_payment and distributor_id=p_dist and status='activo';
  if not found then raise exception 'CONS_NOT_FOUND'; end if;
  remaining:=p.available_cents;
  if p_targets is null then
    for s in select * from public.consignment_sale_balances where distributor_id=p_dist and pending_cents>0
      order by effective_date,sold_at,id loop
      amount:=least(remaining,s.pending_cents); if amount=0 then exit; end if;
      insert into public.consignment_payment_applications(distributor_id,payment_id,sale_id,amount_cents,source,actor)
        values(p_dist,p_payment,s.id,amount,p_source,p_actor);
      remaining:=remaining-amount;
    end loop;
  else
    for target in select value from jsonb_array_elements(p_targets) loop
      amount:=(target->>'amountCents')::bigint;
      select * into s from public.consignment_sale_balances where id=(target->>'saleId')::uuid and distributor_id=p_dist;
      if not found then raise exception 'CONS_NOT_FOUND'; end if;
      if amount<=0 or amount>remaining or amount>s.pending_cents then raise exception 'CONS_BALANCE'; end if;
      insert into public.consignment_payment_applications(distributor_id,payment_id,sale_id,amount_cents,source,actor)
        values(p_dist,p_payment,s.id,amount,p_source,p_actor);
      remaining:=remaining-amount;
    end loop;
  end if;
end $$;

create or replace function public.consignment_command(p_distributor uuid,p_actor text,p_actor_type text,
  p_membership uuid,p_key text,p_action text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
#variable_conflict use_column
<<op>>
declare d public.distributors; cached public.consignment_idempotency; hash text;
  id uuid:=gen_random_uuid(); line_id uuid; lot_id uuid; result jsonb; x jsonb; z jsonb; quote jsonb;
  i public.consignment_items; l public.consignment_lots; a public.consignment_sale_allocations;
  s public.consignment_sales; pay public.consignment_payments; delivery public.consignment_deliveries;
  q int; amount bigint; debt bigint:=0; release bigint; fid text; targets jsonb; actor_key text;
  date_value date:=coalesce((p_payload->>'date')::date,(now() at time zone 'America/Mexico_City')::date);
begin
  if p_actor_type not in ('matrixlab_admin','distribuidor') or length(p_actor) not between 1 and 160
    or length(p_key) not between 8 and 120 or p_payload is null then raise exception 'CONS_INVALID'; end if;
  if p_actor_type='distribuidor' and p_action<>'sale' then raise exception 'CONS_FORBIDDEN'; end if;
  if p_action='distributor_create' then
    insert into public.distributors(id,name,slug) values(p_distributor,p_payload->>'name',p_payload->>'slug') on conflict(id) do nothing;
  end if;
  select * into d from public.distributors where id=p_distributor for update;
  if not found then raise exception 'CONS_NOT_FOUND'; end if;
  if not d.is_active and (p_actor_type='distribuidor' or p_action in ('sale','delivery','item')
    or (p_action='adjustment' and p_payload->>'kind'='alta')) then raise exception 'CONS_FORBIDDEN'; end if;
  if p_actor_type='distribuidor' and not exists(select 1 from public.distributor_memberships
    where id=p_membership and distributor_id=p_distributor and auth_user_id::text=p_actor and status='activa')
    then raise exception 'CONS_FORBIDDEN'; end if;
  actor_key:=encode(sha256(convert_to(p_actor_type||':'||p_actor,'UTF8')),'hex');
  hash:=encode(sha256(convert_to(p_payload::text,'UTF8')),'hex');
  select * into cached from public.consignment_idempotency where distributor_id=p_distributor
    and actor_key=op.actor_key and operation=p_action and idempotency_key=p_key;
  if found then
    if cached.payload_hash<>hash then raise exception 'CONS_IDEMPOTENCY'; end if;
    return cached.result;
  end if;

  case p_action
  when 'distributor_create' then id:=p_distributor;
  when 'distributor_update' then
    update public.distributors set name=coalesce(p_payload->>'name',name),
      is_active=coalesce((p_payload->>'active')::boolean,is_active) where id=p_distributor;
    id:=p_distributor;
  when 'membership' then
    insert into public.distributor_memberships(distributor_id,auth_user_id,email,status,invited_by)
      values(p_distributor,(p_payload->>'userId')::uuid,p_payload->>'email',p_payload->>'status',p_actor)
      on conflict(distributor_id,auth_user_id) do update set status=excluded.status,email=excluded.email returning distributor_memberships.id into id;
    if p_payload->>'status'<>'activa' then
      update public.consignment_sessions set revoked_at=now() where membership_id=op.id and revoked_at is null;
    end if;
  when 'item' then
    if p_payload->>'id' is not null then
      id:=(p_payload->>'id')::uuid;
      if not exists(select 1 from public.consignment_items where consignment_items.id=op.id and distributor_id=p_distributor)
        then raise exception 'CONS_NOT_FOUND'; end if;
      update public.consignment_items set name=p_payload->>'name',sku=p_payload->>'sku',
        description=p_payload->>'description',variant_label=p_payload->>'variant',image_url=p_payload->>'image',
        commercial_unit=p_payload->>'unit',suggested_price_cents=(p_payload->>'suggestedCents')::bigint,
        status=case when p_payload->>'status'='inactiva' then 'inactiva'
          when exists(select 1 from public.consignment_lots where item_id=op.id) then 'activa' else 'borrador' end
        where consignment_items.id=op.id;
    else
      if p_payload->>'variantId' is not null and not exists(select 1 from public.product_variants where product_variants.id=(p_payload->>'variantId')::uuid)
        then raise exception 'CONS_NOT_FOUND'; end if;
      insert into public.consignment_items(id,distributor_id,name,sku,description,variant_label,image_url,commercial_unit,
        product_variant_id,scan_code,suggested_price_cents,created_by)
      values(id,p_distributor,p_payload->>'name',p_payload->>'sku',p_payload->>'description',p_payload->>'variant',
        p_payload->>'image',p_payload->>'unit',(p_payload->>'variantId')::uuid,
        'MLC'||replace(gen_random_uuid()::text,'-',''),(p_payload->>'suggestedCents')::bigint,p_actor);
    end if;
  when 'delivery' then
    if p_payload->'lines' is null or jsonb_typeof(p_payload->'lines')<>'array' or jsonb_array_length(p_payload->'lines') not between 1 and 50 then raise exception 'CONS_INVALID'; end if;
    fid:='ENT-'||nextval('public.consignment_delivery_folio_seq');
    insert into public.consignment_deliveries(id,distributor_id,folio,kind,status,effective_date,reference,notes,actor,confirmed_at)
      values(id,p_distributor,fid,p_payload->>'kind','confirmada',date_value,p_payload->>'reference',p_payload->>'notes',p_actor,now());
    for x in select value from jsonb_array_elements(p_payload->'lines') loop
      select * into i from public.consignment_items where consignment_items.id=(x->>'itemId')::uuid and distributor_id=p_distributor;
      if not found then raise exception 'CONS_NOT_FOUND'; end if;
      line_id:=gen_random_uuid(); lot_id:=gen_random_uuid(); q:=(x->>'quantity')::int;
      insert into public.consignment_delivery_lines(id,delivery_id,distributor_id,item_id,quantity,unit_cost_cents,suggested_price_cents,
        item_name_snapshot,item_variant_snapshot,item_sku_snapshot,commercial_unit_snapshot)
        values(line_id,id,p_distributor,i.id,q,(x->>'costCents')::bigint,(x->>'suggestedCents')::bigint,i.name,i.variant_label,i.sku,i.commercial_unit);
      insert into public.consignment_lots(id,distributor_id,item_id,source_type,delivery_line_id,unit_cost_cents,received_quantity,available_quantity)
        values(lot_id,p_distributor,i.id,'entrega',line_id,(x->>'costCents')::bigint,q,q);
      insert into public.consignment_movements(distributor_id,item_id,lot_id,delta,movement_type,document_type,document_id,actor)
        values(p_distributor,i.id,lot_id,q,'entrega','entrega',id,p_actor);
      update public.consignment_items set status='activa',suggested_price_cents=(x->>'suggestedCents')::bigint where consignment_items.id=i.id;
    end loop;
  when 'sale' then
    quote:=public.consignment_preview(p_distributor,p_payload->'lines');
    if quote->>'fingerprint' is distinct from p_payload->>'fingerprint' then raise exception 'CONS_PREVIEW_CHANGED'; end if;
    fid:='VTA-'||nextval('public.consignment_sale_folio_seq');
    insert into public.consignment_sales(id,distributor_id,folio,effective_date,actor,actor_type,membership_id,public_total_cents,debt_cents,notes)
      values(id,p_distributor,fid,date_value,p_actor,p_actor_type,p_membership,(quote->>'publicCents')::bigint,
        (quote->>'debtCents')::bigint,p_payload->>'notes');
    for x in select value from jsonb_array_elements(quote->'lines') loop
      select * into i from public.consignment_items where consignment_items.id=(x->>'itemId')::uuid;
      line_id:=gen_random_uuid();
      insert into public.consignment_sale_lines(id,sale_id,distributor_id,item_id,quantity,unit_public_price_cents,line_debt_cents,
        item_name_snapshot,item_variant_snapshot,item_sku_snapshot,commercial_unit_snapshot,suggested_price_snapshot_cents,product_variant_id_snapshot,zero_price_reason)
        values(line_id,id,p_distributor,i.id,(x->>'quantity')::int,(x->>'priceCents')::bigint,(x->>'debtCents')::bigint,
        i.name,i.variant_label,i.sku,i.commercial_unit,i.suggested_price_cents,i.product_variant_id,
        (select value->>'zeroReason' from jsonb_array_elements(p_payload->'lines') where value->>'itemId'=i.id::text));
      for z in select value from jsonb_array_elements(x->'allocations') loop
        q:=(z->>'quantity')::int; lot_id:=(z->>'lotId')::uuid;
        insert into public.consignment_sale_allocations(sale_id,sale_line_id,distributor_id,lot_id,item_id,quantity,unit_cost_cents)
          values(id,line_id,p_distributor,lot_id,i.id,q,(z->>'costCents')::bigint);
        update public.consignment_lots set available_quantity=available_quantity-q where consignment_lots.id=lot_id;
        insert into public.consignment_movements(distributor_id,item_id,lot_id,delta,movement_type,document_type,document_id,actor)
          values(p_distributor,i.id,lot_id,-q,'venta','venta',id,p_actor);
      end loop;
    end loop;
  when 'payment' then
    fid:='PAG-'||nextval('public.consignment_payment_folio_seq');
    insert into public.consignment_payments(id,distributor_id,folio,amount_cents,method,reference,notes,effective_date,actor)
      values(id,p_distributor,fid,(p_payload->>'amountCents')::bigint,p_payload->>'method',p_payload->>'reference',p_payload->>'notes',date_value,p_actor);
    perform public.consignment_apply(p_distributor,id,p_actor,'pago',p_payload->'targets');
  when 'apply_credit' then
    id:=(p_payload->>'paymentId')::uuid;
    perform public.consignment_apply(p_distributor,id,p_actor,'credito',p_payload->'targets');
  when 'void_payment' then
    id:=(p_payload->>'paymentId')::uuid;
    select * into pay from public.consignment_payments where consignment_payments.id=op.id and distributor_id=p_distributor;
    if not found then raise exception 'CONS_NOT_FOUND'; end if;
    if pay.status<>'activo' then raise exception 'CONS_STATE'; end if;
    update public.consignment_payment_applications set status='revertida',reverted_at=now(),revert_reason=p_payload->>'reason'
      where payment_id=op.id and status='activa';
    update public.consignment_payments set status='anulado',voided_at=now(),void_reason=p_payload->>'reason',voided_by=p_actor
      where consignment_payments.id=op.id;
  when 'return' then
    select * into s from public.consignment_sales where consignment_sales.id=(p_payload->>'saleId')::uuid and distributor_id=p_distributor;
    if not found then raise exception 'CONS_NOT_FOUND'; end if;
    if s.status<>'confirmada' then raise exception 'CONS_STATE'; end if;
    fid:='DEV-'||nextval('public.consignment_return_folio_seq');
    insert into public.consignment_returns(id,distributor_id,folio,kind,sale_id,reason,effective_date,actor)
      values(id,p_distributor,fid,case when (p_payload->>'void')::boolean then 'anulacion_venta' else 'cliente' end,s.id,p_payload->>'reason',date_value,p_actor);
    targets:=p_payload->'allocations';
    if (p_payload->>'void')::boolean then
      select coalesce(jsonb_agg(jsonb_build_object('allocationId',sa.id,'quantity',sa.quantity-sa.returned_quantity,'restock',true)),'[]')
        into targets from public.consignment_sale_allocations sa where sale_id=s.id and quantity>returned_quantity;
    end if;
    for x in select value from jsonb_array_elements(targets) loop
      select * into a from public.consignment_sale_allocations where consignment_sale_allocations.id=(x->>'allocationId')::uuid
        and sale_id=s.id and distributor_id=p_distributor;
      if not found then raise exception 'CONS_NOT_FOUND'; end if;
      q:=(x->>'quantity')::int; amount:=q::bigint*a.unit_cost_cents;
      if not public.consignment_qty_ok(q) or q>a.quantity-a.returned_quantity then raise exception 'CONS_QUANTITY'; end if;
      insert into public.consignment_return_lines(return_id,distributor_id,sale_line_id,allocation_id,lot_id,item_id,quantity,restock,
        disposal,unit_cost_cents,debt_reverted_cents) values(id,p_distributor,a.sale_line_id,a.id,a.lot_id,a.item_id,q,
        (x->>'restock')::boolean,x->>'disposal',a.unit_cost_cents,amount);
      update public.consignment_sale_allocations set returned_quantity=returned_quantity+q where consignment_sale_allocations.id=a.id;
      update public.consignment_sale_lines set returned_quantity=returned_quantity+q,line_debt_reverted_cents=line_debt_reverted_cents+amount where consignment_sale_lines.id=a.sale_line_id;
      if (x->>'restock')::boolean then
        update public.consignment_lots set available_quantity=available_quantity+q where consignment_lots.id=a.lot_id;
        insert into public.consignment_movements(distributor_id,item_id,lot_id,delta,movement_type,document_type,document_id,actor,reason)
          values(p_distributor,a.item_id,a.lot_id,q,case when (p_payload->>'void')::boolean then 'anulacion_venta' else 'devolucion_cliente' end,'devolucion',id,p_actor,p_payload->>'reason');
      end if;
      debt:=debt+amount;
    end loop;
    update public.consignment_sales set debt_reverted_cents=debt_reverted_cents+debt,
      status=case when (p_payload->>'void')::boolean then 'anulada' else status end,
      voided_at=case when (p_payload->>'void')::boolean then now() else voided_at end,
      void_reason=case when (p_payload->>'void')::boolean then p_payload->>'reason' else void_reason end where consignment_sales.id=s.id;
    release:=public.consignment_release(s.id,id,p_actor,p_payload->>'reason');
    update public.consignment_returns set debt_reverted_cents=debt,credit_released_cents=release where consignment_returns.id=op.id;
  when 'adjustment' then
    q:=(p_payload->>'quantity')::int;
    select * into i from public.consignment_items where consignment_items.id=(p_payload->>'itemId')::uuid and distributor_id=p_distributor;
    if not found then raise exception 'CONS_NOT_FOUND'; end if;
    lot_id:=(p_payload->>'lotId')::uuid;
    if p_payload->>'kind'<>'alta' then
      select * into l from public.consignment_lots where consignment_lots.id=lot_id and item_id=i.id and distributor_id=p_distributor;
      if not found then raise exception 'CONS_NOT_FOUND'; end if;
      if q>l.available_quantity then raise exception 'CONS_STOCK'; end if;
    end if;
    fid:='AJU-'||nextval('public.consignment_adjustment_folio_seq');
    insert into public.consignment_adjustments(id,distributor_id,folio,kind,item_id,lot_id,quantity,unit_cost_cents,reason,effective_date,actor)
      values(id,p_distributor,fid,p_payload->>'kind',i.id,lot_id,q,(p_payload->>'costCents')::bigint,p_payload->>'reason',date_value,p_actor);
    if p_payload->>'kind'='alta' then
      lot_id:=gen_random_uuid();
      insert into public.consignment_lots(id,distributor_id,item_id,source_type,adjustment_id,unit_cost_cents,received_quantity,available_quantity)
        values(lot_id,p_distributor,i.id,'ajuste',id,(p_payload->>'costCents')::bigint,q,q);
      update public.consignment_items set status='activa' where consignment_items.id=i.id;
    else
      update public.consignment_lots set available_quantity=available_quantity-q where consignment_lots.id=lot_id;
      q:=-q;
    end if;
    insert into public.consignment_movements(distributor_id,item_id,lot_id,delta,movement_type,document_type,document_id,actor,reason)
      values(p_distributor,i.id,lot_id,q,case p_payload->>'kind' when 'alta' then 'ajuste_alta' when 'merma' then 'merma' else 'retorno_matrixlab' end,'ajuste',id,p_actor,p_payload->>'reason');
  when 'reverse_delivery' then
    id:=(p_payload->>'deliveryId')::uuid;
    select * into delivery from public.consignment_deliveries where consignment_deliveries.id=op.id and distributor_id=p_distributor;
    if not found then raise exception 'CONS_NOT_FOUND'; end if;
    if delivery.status<>'confirmada' then raise exception 'CONS_STATE'; end if;
    for l in select lots.* from public.consignment_lots lots join public.consignment_delivery_lines dl on dl.id=lots.delivery_line_id where dl.delivery_id=op.id loop
      if exists(select 1 from public.consignment_movements where consignment_movements.lot_id=l.id and movement_type<>'entrega') then raise exception 'CONS_STATE'; end if;
      update public.consignment_lots set available_quantity=0 where consignment_lots.id=l.id;
      insert into public.consignment_movements(distributor_id,item_id,lot_id,delta,movement_type,document_type,document_id,actor,reason)
        values(p_distributor,l.item_id,l.id,-l.available_quantity,'reversion_entrega','entrega',id,p_actor,p_payload->>'reason');
    end loop;
    update public.consignment_deliveries set status='revertida',reverted_at=now(),revert_reason=p_payload->>'reason' where consignment_deliveries.id=op.id;
  else raise exception 'CONS_INVALID'; end case;

  if exists(select 1 from public.consignment_sale_balances where distributor_id=p_distributor and pending_cents<0)
    or exists(select 1 from public.consignment_payment_balances where distributor_id=p_distributor and available_cents<0)
    then raise exception 'CONS_BALANCE'; end if;
  result:=jsonb_build_object('id',id,'folio',fid,'action',p_action);
  insert into public.consignment_audit_events(distributor_id,action,actor,actor_type,entity_type,entity_id,reason)
    values(p_distributor,p_action,p_actor,p_actor_type,p_action,id,p_payload->>'reason');
  insert into public.consignment_idempotency(actor_key,distributor_id,operation,idempotency_key,payload_hash,result,document_type,document_id)
    values(actor_key,p_distributor,p_action,p_key,hash,result,p_action,id);
  return result;
end $$;

-- Lectura consistente de cuenta e inventario bajo el mismo mutex.
create or replace function public.consignment_snapshot(p_distributor uuid,p_admin boolean default false) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare result jsonb;
begin
  perform 1 from public.distributors where id=p_distributor for share;
  if not found then raise exception 'CONS_NOT_FOUND'; end if;
  select jsonb_build_object(
    'distributor',(select to_jsonb(d) from public.distributors d where id=p_distributor),
    'items',(select coalesce(jsonb_agg(to_jsonb(i)||jsonb_build_object('stock',coalesce(l.stock,0))), '[]')
      from public.consignment_items i left join lateral(select sum(available_quantity) stock from public.consignment_lots where item_id=i.id) l on true
      where i.distributor_id=p_distributor and (p_admin or exists(select 1 from public.consignment_lots where item_id=i.id))),
    'lots',(select coalesce(jsonb_agg(to_jsonb(l) order by received_at,fifo_seq),'[]') from public.consignment_lots l where distributor_id=p_distributor),
    'sales',(select coalesce(jsonb_agg(to_jsonb(s) order by sold_at desc),'[]') from public.consignment_sale_balances s where distributor_id=p_distributor),
    'saleLines',(select coalesce(jsonb_agg(to_jsonb(l)),'[]') from public.consignment_sale_lines l where distributor_id=p_distributor),
    'allocations',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from public.consignment_sale_allocations a where distributor_id=p_distributor),
    'payments',(select coalesce(jsonb_agg(to_jsonb(p) order by received_at desc),'[]') from public.consignment_payment_balances p where distributor_id=p_distributor),
    'applications',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from public.consignment_payment_applications a where distributor_id=p_distributor),
    'deliveries',(select coalesce(jsonb_agg(to_jsonb(d) order by created_at desc),'[]') from public.consignment_deliveries d where distributor_id=p_distributor),
    'returns',(select coalesce(jsonb_agg(to_jsonb(r)),'[]') from public.consignment_returns r where distributor_id=p_distributor),
    'adjustments',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from public.consignment_adjustments a where distributor_id=p_distributor),
    'memberships',case when p_admin then (select coalesce(jsonb_agg(to_jsonb(m)),'[]') from public.distributor_memberships m where distributor_id=p_distributor) else '[]'::jsonb end
  ) into result;
  return result;
end $$;

-- Incluye funciones auxiliares: PUBLIC no debe heredar EXECUTE.
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'consignment_%' loop
    execute format('revoke all on function %s from public,anon,authenticated',f.sig);
    execute format('grant execute on function %s to service_role',f.sig);
  end loop;
end $$;
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='public'
    and (tablename like 'consignment_%' or tablename in ('distributors','distributor_memberships')) loop
    execute format('grant all on public.%I to service_role',t.tablename);
  end loop;
  for t in select sequencename from pg_sequences where schemaname='public' and sequencename like 'consignment_%' loop
    execute format('grant usage,select on sequence public.%I to service_role',t.sequencename);
  end loop;
end $$;
