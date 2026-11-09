-- Owner dashboard support: team emails, and guard rails on who can change roles.

-- Show team members' sign-in email in the dashboard.
alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_first boolean := not exists (select 1 from public.profiles);
begin
  insert into public.profiles (id, full_name, email, role, is_active)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), new.email),
    new.email,
    case when v_first then 'owner'::public.app_role else 'staff'::public.app_role end,
    v_first
  );
  return new;
end $$;

-- Role guard rails, enforced in the database so the dashboard cannot be bypassed:
--   * only an owner can give or remove the owner role, or change an owner's account;
--   * nobody can change their own role or switch off their own access;
--   * the email column always mirrors the sign-in email.
-- Changes made with the service role or the SQL editor (no signed-in user) are allowed.
create or replace function public.guard_profile_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.email := old.email;
  if auth.uid() is null then
    return new;
  end if;
  if (old.role = 'owner' or new.role = 'owner')
     and (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and coalesce(public.current_role_name() <> 'owner', true) then
    raise exception 'Only an owner can change owner accounts' using errcode = '42501';
  end if;
  if old.id = auth.uid() and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
    raise exception 'You cannot change your own role or access' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_changes();

-- Team members can update their own display name.
drop policy if exists "users update own name" on public.profiles;
create policy "users update own name" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Managers should not delete profiles from the dashboard (deactivate instead).
drop policy if exists "managers manage profiles" on public.profiles;
create policy "managers update profiles" on public.profiles for update to authenticated
  using (public.is_manager()) with check (public.is_manager());
