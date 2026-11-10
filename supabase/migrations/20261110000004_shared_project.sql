-- Sharing a Supabase project with other apps: sign-in accounts (auth.users) are shared,
-- so only accounts created from this website's sign-up page get a dashboard profile.
-- Someone who already has an account from another app can sign in here and join the team
-- with join_team(), which creates an inactive staff profile for them (or the owner profile
-- if the team is still empty).

create or replace function imhcc.handle_new_user()
returns trigger language plpgsql security definer set search_path = imhcc, public as $$
declare
  v_first boolean;
begin
  if coalesce(new.raw_user_meta_data->>'app', '') <> 'imhcc' then
    return new;
  end if;
  v_first := not exists (select 1 from imhcc.profiles);
  insert into imhcc.profiles (id, full_name, email, role, is_active)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), new.email),
    new.email,
    case when v_first then 'owner'::imhcc.app_role else 'staff'::imhcc.app_role end,
    v_first
  )
  on conflict (id) do nothing;
  return new;
end $$;

create or replace function imhcc.join_team(full_name text default null)
returns void language plpgsql security definer set search_path = imhcc, public as $$
declare
  v_uid uuid := auth.uid();
  v_first boolean;
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
  v_first := not exists (select 1 from imhcc.profiles);
  select email into v_email from auth.users where id = v_uid;
  insert into imhcc.profiles (id, full_name, email, role, is_active)
  values (
    v_uid,
    coalesce(nullif(trim(full_name), ''), v_email),
    v_email,
    case when v_first then 'owner'::imhcc.app_role else 'staff'::imhcc.app_role end,
    v_first
  )
  on conflict (id) do nothing;
end $$;

revoke all on function imhcc.join_team(text) from public, anon;
grant execute on function imhcc.join_team(text) to authenticated;
