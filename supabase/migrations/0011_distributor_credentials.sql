-- Acceso privado por usuario/contraseña, sin correo ni alta pública.
-- Los UUID auth_user_id existentes quedan como identificadores internos del actor.
alter table public.distributor_memberships alter column email drop not null;

create table public.distributor_credentials (
  membership_id uuid primary key references public.distributor_memberships(id) on delete restrict,
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9._-]{2,63}$'),
  password_digest text not null check (password_digest ~ '^scrypt-v1\$[a-f0-9]{32}\$[a-f0-9]{128}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_distributor_credentials_distributor on public.distributor_credentials(distributor_id);
create trigger trg_distributor_credentials_scope before insert or update on public.distributor_credentials
  for each row execute function public.consignment_check_scope();
create trigger trg_distributor_credentials_updated_at before update on public.distributor_credentials
  for each row execute function public.set_updated_at();

create table public.consignment_access_intents (
  distributor_id uuid not null references public.distributors(id) on delete restrict,
  actor text not null,
  intent_key text not null,
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key(distributor_id,actor,intent_key)
);
create trigger trg_consignment_access_intents_immutable before update or delete on public.consignment_access_intents
  for each row execute function public.consignment_immutable();

alter table public.distributor_credentials enable row level security;
alter table public.consignment_access_intents enable row level security;
revoke all on public.distributor_credentials,public.consignment_access_intents from public,anon,authenticated;
grant all on public.distributor_credentials,public.consignment_access_intents to service_role;

-- Las sesiones del esquema anterior requieren volver a entrar con cuenta nativa.
update public.consignment_sessions set revoked_at=now() where revoked_at is null;

create function public.consignment_access_command(p_distributor uuid,p_actor text,p_key text,
  p_action text,p_username text,p_password_digest text,p_fingerprint text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  account_row public.distributor_credentials%rowtype;
  cached public.consignment_access_intents%rowtype;
  member_id uuid; principal_id uuid; result_value jsonb; active_dist boolean;
begin
  if p_actor is null or p_actor !~ '^(admin|setup):[A-Za-z0-9:_-]{3,120}$'
    or p_key is null or p_key !~ '^[A-Za-z0-9_-]{8,120}$'
    or p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$'
    or p_username is null or p_username !~ '^[a-z0-9][a-z0-9._-]{2,63}$'
    or p_action is null or p_action not in ('create','reset','disable','enable') then
    raise exception 'CONS_INVALID';
  end if;
  select is_active into active_dist from public.distributors where id=p_distributor for update;
  if not found then raise exception 'CONS_NOT_FOUND'; end if;
  if not active_dist and p_action in ('create','enable') then raise exception 'CONS_STATE'; end if;
  select * into cached from public.consignment_access_intents
    where distributor_id=p_distributor and actor=p_actor and intent_key=p_key;
  if found then
    if cached.fingerprint<>p_fingerprint then raise exception 'CONS_IDEMPOTENCY'; end if;
    return cached.result;
  end if;
  if p_action in ('create','reset') and (p_password_digest is null or
    p_password_digest !~ '^scrypt-v1\$[a-f0-9]{32}\$[a-f0-9]{128}$') then raise exception 'CONS_INVALID'; end if;
  if p_action in ('enable','disable') and p_password_digest is not null then raise exception 'CONS_INVALID'; end if;
  select * into account_row from public.distributor_credentials where username=p_username;
  if p_action='create' then
    if found then raise exception 'CONS_STATE'; end if;
    member_id:=gen_random_uuid(); principal_id:=gen_random_uuid();
    insert into public.distributor_memberships(id,distributor_id,auth_user_id,email,invited_by)
      values(member_id,p_distributor,principal_id,null,p_actor);
    insert into public.distributor_credentials(membership_id,distributor_id,username,password_digest)
      values(member_id,p_distributor,p_username,p_password_digest);
  else
    if not found or account_row.distributor_id<>p_distributor then raise exception 'CONS_NOT_FOUND'; end if;
    member_id:=account_row.membership_id;
    if p_action='reset' then
      update public.distributor_credentials set password_digest=p_password_digest where membership_id=member_id;
    else
      update public.distributor_credentials set is_active=(p_action='enable') where membership_id=member_id;
      update public.distributor_memberships set status=case when p_action='enable' then 'activa' else 'inactiva' end where id=member_id;
    end if;
    update public.consignment_sessions set revoked_at=now() where membership_id=member_id and revoked_at is null;
  end if;
  result_value:=jsonb_build_object('username',p_username,'membershipId',member_id,'action',p_action);
  insert into public.consignment_access_intents(distributor_id,actor,intent_key,fingerprint,result)
    values(p_distributor,p_actor,p_key,p_fingerprint,result_value);
  -- Sin contraseñas ni hashes de contraseña en la bitácora.
  insert into public.consignment_audit_events(distributor_id,actor,actor_type,action,entity_type,entity_id,metadata)
    values(p_distributor,p_actor,'matrixlab_admin','access_'||p_action,'distributor_membership',member_id,result_value);
  return result_value;
end;
$$;
revoke all on function public.consignment_access_command(uuid,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.consignment_access_command(uuid,text,text,text,text,text,text) to service_role;

create function public.consignment_open_session(p_membership uuid,p_password_digest text,
  p_token_hash text,p_expires_at timestamptz) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare member_row public.distributor_memberships%rowtype; active_dist boolean;
begin
  select * into member_row from public.distributor_memberships where id=p_membership;
  if not found then return false; end if;
  select is_active into active_dist from public.distributors where id=member_row.distributor_id for update;
  if not active_dist or not exists(select 1 from public.distributor_memberships m
    join public.distributor_credentials c on c.membership_id=m.id and c.distributor_id=m.distributor_id
    where m.id=p_membership and m.status='activa' and c.is_active and c.password_digest=p_password_digest) then return false; end if;
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' or p_expires_at is null
    or p_expires_at<=now() or p_expires_at>now()+interval '8 hours 1 minute' then raise exception 'CONS_INVALID'; end if;
  insert into public.consignment_sessions(token_hash,membership_id,distributor_id,auth_user_id,expires_at)
    values(p_token_hash,p_membership,member_row.distributor_id,member_row.auth_user_id,p_expires_at);
  return true;
end;
$$;
revoke all on function public.consignment_open_session(uuid,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.consignment_open_session(uuid,text,text,timestamptz) to service_role;
