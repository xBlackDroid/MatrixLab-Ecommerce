-- SOLO lectura; esperado: cero filas en las consultas de inconsistencias.
select * from public.consignment_reconciliation where available_quantity<>ledger_quantity;
select id,distributor_id,net_debt_cents,applied_cents,pending_cents
  from public.consignment_sale_balances where pending_cents<0;
select id,distributor_id,amount_cents,applied_cents,available_cents
  from public.consignment_payment_balances where available_cents<0;
select s.id,s.distributor_id,s.debt_cents,coalesce(a.original,0) original_from_lots,
  s.debt_reverted_cents,coalesce(a.reverted,0) reverted_from_lots
from public.consignment_sales s left join lateral (
  select sum(quantity::bigint*unit_cost_cents) original,
    sum(returned_quantity::bigint*unit_cost_cents) reverted
  from public.consignment_sale_allocations where sale_id=s.id
) a on true where s.debt_cents<>coalesce(a.original,0) or s.debt_reverted_cents<>coalesce(a.reverted,0);
select s.id,s.distributor_id from public.consignment_sales s
  where not exists(select 1 from public.consignment_sale_lines where sale_id=s.id);
select a.id,a.distributor_id from public.consignment_payment_applications a
  join public.consignment_payments p on p.id=a.payment_id
  where a.status='activa' and p.status<>'activo';

-- Revisión de privilegios privados: anon/authenticated no deben obtener true.
select r.rolname,t.tablename,has_table_privilege(r.rolname,'public.'||t.tablename,'SELECT') can_select
from pg_roles r cross join pg_tables t where r.rolname in ('anon','authenticated')
  and t.schemaname='public' and (t.tablename like 'consignment_%' or t.tablename in ('distributors','distributor_memberships','distributor_credentials'));
