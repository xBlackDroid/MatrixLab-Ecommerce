-- Private daily bazar workspace. All writes use version compare-and-swap.
create table public.bazar_days (
  date date primary key,
  document jsonb not null default '{"items":[],"sales":[],"requests":{}}'::jsonb,
  version integer not null default 0 check (version >= 0),
  updated_at timestamptz not null default now(),
  constraint bazar_document_shape check (
    jsonb_typeof(document) = 'object'
    and jsonb_typeof(document->'items') = 'array'
    and jsonb_typeof(document->'sales') = 'array'
    and jsonb_typeof(document->'requests') = 'object'
  )
);
alter table public.bazar_days enable row level security;
revoke all on table public.bazar_days from public, anon, authenticated;
grant select, insert, update on table public.bazar_days to service_role;
comment on table public.bazar_days is 'Admin-only bazar inventory and sales by Mexico City date. Independent of ecommerce stock.';
