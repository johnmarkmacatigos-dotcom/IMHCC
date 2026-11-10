-- Only the business owner's email can become the Owner.
-- Before this, whoever signed up first became the Owner. Now the Owner role goes
-- to the reserved address below (if there is no Owner yet). Every other new
-- account becomes inactive staff, which the Owner can switch on from Team.

create or replace function imhcc.owner_email()
returns text
language sql
immutable
as $$ select 'iloilomodernhomes20@gmail.com'::text $$;

create or replace function imhcc.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = imhcc, public
as $$
declare
  v_owner boolean;
begin
  if coalesce(new.raw_user_meta_data->>'app', '') <> 'imhcc' then
    return new;
  end if;
  v_owner := lower(new.email) = imhcc.owner_email()
    and not exists (select 1 from imhcc.profiles where role = 'owner');
  insert into imhcc.profiles (id, full_name, email, role, is_active)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), new.email),
    new.email,
    case when v_owner then 'owner'::imhcc.app_role else 'staff'::imhcc.app_role end,
    v_owner
  )
  on conflict (id) do nothing;
  return new;
end $$;

create or replace function imhcc.join_team(full_name text default null)
returns void
language plpgsql
security definer
set search_path = imhcc, public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner boolean;
  v_email text;
begin
  if v_uid is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  if exists (select 1 from imhcc.profiles where id = v_uid) then
    return;
  end if;
  -- Serialize so two people joining at once cannot both become the owner.
  lock table imhcc.profiles in share row exclusive mode;
  select email into v_email from auth.users where id = v_uid;
  v_owner := lower(v_email) = imhcc.owner_email()
    and not exists (select 1 from imhcc.profiles where role = 'owner');
  insert into imhcc.profiles (id, full_name, email, role, is_active)
  values (
    v_uid,
    coalesce(nullif(trim(full_name), ''), v_email),
    v_email,
    case when v_owner then 'owner'::imhcc.app_role else 'staff'::imhcc.app_role end,
    v_owner
  )
  on conflict (id) do nothing;
end $$;
