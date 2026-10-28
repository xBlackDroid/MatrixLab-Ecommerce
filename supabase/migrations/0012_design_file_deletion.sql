-- Borrado confirmado: conservar el manifiesto hasta limpiar Storage y DB.
create table if not exists public.design_deletion_jobs (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null unique,
  asset_ids uuid[] not null default '{}',
  delete_project boolean not null,
  files jsonb not null default '[]',
  prefix text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.design_write_leases (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.design_projects(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '10 minutes'
);
create index if not exists design_write_leases_design on public.design_write_leases(design_id);
alter table public.design_deletion_jobs enable row level security;
alter table public.design_write_leases enable row level security;
revoke all on public.design_deletion_jobs, public.design_write_leases from public, anon, authenticated;
grant select, insert, update, delete on public.design_deletion_jobs, public.design_write_leases to service_role;

create or replace function public.design_write_begin(p_design uuid, p_session text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  perform 1 from design_projects where id=p_design and session_id=p_session for update;
  if not found then raise exception 'DESIGN_NOT_FOUND'; end if;
  if exists(select 1 from design_deletion_jobs where design_id=p_design) then raise exception 'DESIGN_DELETING'; end if;
  insert into design_write_leases(design_id) values(p_design) returning id into v_id;
  return v_id;
end $$;

create or replace function public.design_prune_assets(p_json jsonb, p_ids uuid[])
returns jsonb language plpgsql immutable set search_path = public, pg_temp as $$
declare v_result jsonb; v_key text; v_value jsonb; v_clean jsonb;
begin
  if p_json is null then return null; end if;
  if jsonb_typeof(p_json)='object' then
    if (p_json->>'assetId') = any(p_ids::text[]) or (p_json->>'baseAssetId') = any(p_ids::text[]) then return null; end if;
    v_result := '{}';
    for v_key, v_value in select * from jsonb_each(p_json) loop
      v_clean := design_prune_assets(v_value,p_ids);
      if v_clean is not null then v_result := v_result || jsonb_build_object(v_key,v_clean); end if;
    end loop;
    return v_result;
  elsif jsonb_typeof(p_json)='array' then
    v_result := '[]';
    for v_value in select * from jsonb_array_elements(p_json) loop
      v_clean := design_prune_assets(v_value,p_ids);
      if v_clean is not null then v_result := v_result || jsonb_build_array(v_clean); end if;
    end loop;
    return v_result;
  end if;
  return p_json;
end $$;

create or replace function public.design_delete_begin(p_design uuid, p_assets uuid[], p_project boolean, p_resume boolean default false)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare d design_projects; j design_deletion_jobs; v_files jsonb; v_ids uuid[];
begin
  select * into d from design_projects where id=p_design for update;
  if not found then return jsonb_build_object('alreadyDeleted',true); end if;
  select * into j from design_deletion_jobs where design_id=p_design;
  if found then
    if not p_resume and (j.delete_project<>p_project or (not p_project and j.asset_ids<>coalesce(p_assets,'{}'))) then raise exception 'DESIGN_DELETING'; end if;
    return to_jsonb(j);
  end if;
  if p_resume then raise exception 'NO_PENDING_DELETE'; end if;
  if d.order_id is not null or exists(select 1 from order_items where design_project_id=p_design)
     or exists(select 1 from cart_items where design_project_id=p_design) then raise exception 'DESIGN_LINKED'; end if;
  if exists(select 1 from design_write_leases where design_id=p_design and expires_at>now()) then raise exception 'DESIGN_WRITING'; end if;
  if not p_project and (coalesce(array_length(p_assets,1),0)=0 or
     (select count(*) from uploaded_assets where design_project_id=p_design and id=any(p_assets))<>array_length(p_assets,1)) then raise exception 'ASSET_NOT_FOUND'; end if;
  select coalesce(array_agg(id order by id),'{}') into v_ids from uploaded_assets where design_project_id=p_design and (p_project or id=any(p_assets));
  select coalesce(jsonb_agg(distinct jsonb_build_object('bucket',bucket,'path',path)),'[]') into v_files from (
    select 'design-assets' bucket, original_file_url path from uploaded_assets where design_project_id=p_design and (p_project or id=any(v_ids))
    union all select 'design-previews',preview_url from uploaded_assets where design_project_id=p_design and (p_project or id=any(v_ids))
    union all select 'design-assets',d.uploaded_asset_url where p_project
    union all select 'design-previews',d.preview_url where p_project or not exists(
      select 1 from uploaded_assets where design_project_id=p_design and not(id=any(v_ids)) and preview_url=d.preview_url)
  ) f where path is not null;
  insert into design_deletion_jobs(design_id,asset_ids,delete_project,files,prefix)
    values(p_design,v_ids,p_project,v_files,substr(encode(sha256(convert_to(d.session_id,'UTF8')),'hex'),1,16)||'/'||p_design::text||'/') returning * into j;
  return to_jsonb(j);
end $$;

create or replace function public.design_delete_finish(p_job uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare j design_deletion_jobs;
begin
  select * into j from design_deletion_jobs where id=p_job;
  if not found then return jsonb_build_object('alreadyDeleted',true); end if;
  perform 1 from design_projects where id=j.design_id for update;
  select * into j from design_deletion_jobs where id=p_job for update;
  if not found then return jsonb_build_object('alreadyDeleted',true); end if;
  delete from design_deletion_jobs where id=p_job;
  if j.delete_project then
    delete from design_projects where id=j.design_id;
  else
    delete from uploaded_assets where design_project_id=j.design_id and id=any(j.asset_ids);
    update design_projects set design_json=design_prune_assets(design_json,j.asset_ids),preview_url=null,
      uploaded_asset_url=(select original_file_url from uploaded_assets where design_project_id=j.design_id order by created_at limit 1),status='draft'
      where id=j.design_id;
  end if;
  return jsonb_build_object('deleted',true,'designId',j.design_id,'assets',array_length(j.asset_ids,1));
end $$;

create or replace function public.design_block_deleting()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if tg_table_name='design_projects' then v_id:=new.id; else v_id:=new.design_project_id; end if;
  if v_id is not null then
    perform 1 from design_projects where id=v_id for key share;
    if exists(select 1 from design_deletion_jobs where design_id=v_id) then raise exception 'DESIGN_DELETING'; end if;
  end if;
  return new;
end $$;
create trigger design_no_update_during_delete before update on public.design_projects for each row execute function public.design_block_deleting();
create trigger asset_no_write_during_delete before insert or update on public.uploaded_assets for each row execute function public.design_block_deleting();
create trigger cart_no_attach_during_delete before insert or update on public.cart_items for each row execute function public.design_block_deleting();
create trigger order_no_attach_during_delete before insert or update on public.order_items for each row execute function public.design_block_deleting();

revoke all on function public.design_write_begin(uuid,text),public.design_prune_assets(jsonb,uuid[]),
  public.design_delete_begin(uuid,uuid[],boolean,boolean),public.design_delete_finish(uuid),public.design_block_deleting() from public,anon,authenticated;
grant execute on function public.design_write_begin(uuid,text),public.design_delete_begin(uuid,uuid[],boolean,boolean),public.design_delete_finish(uuid) to service_role;
