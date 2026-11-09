-- Iloilo Modern Homes Construction Co. — initial schema
-- Public website content, customer submissions, and the foundations for the admin dashboard.
-- Every table has Row Level Security enabled. The public (anon) role can only read published
-- content and submit inquiries through the submit_inquiry() function.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Roles and profiles
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('owner', 'admin', 'editor', 'staff');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.app_role not null default 'staff',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper: the current user's role, or null for visitors.
create or replace function public.current_role_name()
returns public.app_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.has_role(roles public.app_role[])
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(public.current_role_name() = any(roles), false)
$$;

-- Any signed-in team member (owner, admin, editor, staff)
create or replace function public.is_team()
returns boolean language sql stable as $$
  select public.has_role(array['owner','admin','editor','staff']::public.app_role[])
$$;

-- Content editors (owner, admin, editor)
create or replace function public.is_editor()
returns boolean language sql stable as $$
  select public.has_role(array['owner','admin','editor']::public.app_role[])
$$;

-- Managers (owner, admin)
create or replace function public.is_manager()
returns boolean language sql stable as $$
  select public.has_role(array['owner','admin']::public.app_role[])
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Website settings (single row)
-- ---------------------------------------------------------------------------
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  company_name text not null default 'Iloilo Modern Homes Construction Co.',
  tagline text,
  hero_title text,
  hero_subtitle text,
  phone_primary text,
  phone_secondary text,
  email text,
  address text,
  business_hours text,
  facebook_url text,
  messenger_url text,
  map_embed_url text,
  about_intro text,
  mission text,
  vision text,
  stats jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null default 'Residential',
  summary text,
  description text,
  scope text[] not null default '{}',
  cover_image text,
  sort_order int not null default 0,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Customers (private)
-- ---------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Projects and photos
-- ---------------------------------------------------------------------------
create type public.project_status as enum ('planning', 'ongoing', 'completed');
create type public.photo_phase as enum ('before', 'during', 'after');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  status public.project_status not null default 'completed',
  location text,
  summary text,
  story text,
  scope text[] not null default '{}',
  duration text,
  completed_on date,
  cover_image text,
  customer_id uuid references public.customers (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

create table public.project_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  image_url text not null,
  caption text,
  phase public.photo_phase not null default 'after',
  taken_on date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index project_photos_project_idx on public.project_photos (project_id, sort_order);

-- ---------------------------------------------------------------------------
-- Testimonials (published only with consent)
-- ---------------------------------------------------------------------------
create type public.moderation_status as enum ('pending', 'approved', 'hidden');

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_town text,
  service_label text,
  quote text not null,
  rating int check (rating between 1 and 5),
  photo_url text,
  project_id uuid references public.projects (id) on delete set null,
  customer_id uuid references public.customers (id) on delete set null,
  consent_given boolean not null default false,
  consent_date date,
  status public.moderation_status not null default 'pending',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonial_needs_consent check (status <> 'approved' or consent_given)
);
create trigger testimonials_touch before update on public.testimonials
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Hardware products
-- ---------------------------------------------------------------------------
create type public.stock_status as enum ('in_stock', 'low_stock', 'out_of_stock', 'made_to_order');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  sku text unique,
  description text,
  specifications text,
  price numeric(12,2),
  price_unit text,
  price_on_request boolean not null default false,
  stock_quantity int not null default 0,
  stock_status public.stock_status not null default 'in_stock',
  delivery_info text,
  image_url text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Promotions and announcements
-- ---------------------------------------------------------------------------
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  banner_image text,
  terms text,
  cta_label text,
  cta_url text,
  starts_on date,
  ends_on date,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger promotions_touch before update on public.promotions
  for each row execute function public.touch_updated_at();

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text,
  cover_image text,
  published_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger announcements_touch before update on public.announcements
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Inquiries (quotation requests, product inquiries, consultations, contact)
-- ---------------------------------------------------------------------------
create type public.inquiry_type as enum ('quotation', 'product', 'consultation', 'contact');
create type public.inquiry_status as enum ('new', 'contacted', 'site_visit', 'quoted', 'won', 'lost', 'closed');

create table public.reference_counters (
  prefix text not null,
  year int not null,
  last_value int not null default 0,
  primary key (prefix, year)
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  reference_no text not null unique,
  type public.inquiry_type not null,
  status public.inquiry_status not null default 'new',
  full_name text not null,
  phone text not null,
  email text,
  location text,
  service text,
  product_id uuid references public.products (id) on delete set null,
  budget text,
  preferred_date text,
  preferred_contact text,
  message text,
  attachments text[] not null default '{}',
  customer_id uuid references public.customers (id) on delete set null,
  assigned_to uuid references public.profiles (id) on delete set null,
  consent boolean not null default false,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_status_idx on public.inquiries (status, created_at desc);
create trigger inquiries_touch before update on public.inquiries
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Notifications and activity log (admin)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles (id) on delete cascade, -- null = all team members
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Public submission function: the only way visitors can write data.
-- ---------------------------------------------------------------------------
create or replace function public.submit_inquiry(payload jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type public.inquiry_type := (payload->>'type')::public.inquiry_type;
  v_prefix text;
  v_year int := extract(year from now() at time zone 'Asia/Manila')::int;
  v_next int;
  v_ref text;
  v_name text := btrim(coalesce(payload->>'full_name', ''));
  v_phone text := btrim(coalesce(payload->>'phone', ''));
  v_attachments text[];
begin
  if length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'Invalid name';
  end if;
  if v_phone !~ '^[0-9+() -]{7,20}$' then
    raise exception 'Invalid phone number';
  end if;
  if length(coalesce(payload->>'message', '')) > 4000 then
    raise exception 'Message is too long';
  end if;
  if coalesce((payload->>'consent')::boolean, false) is not true then
    raise exception 'Consent is required';
  end if;

  select coalesce(array_agg(value), '{}') into v_attachments
  from jsonb_array_elements_text(coalesce(payload->'attachments', '[]'::jsonb)) as t(value)
  where value ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,120}$';
  if array_length(v_attachments, 1) > 5 then
    raise exception 'Too many attachments';
  end if;

  v_prefix := case v_type
    when 'quotation' then 'QR'
    when 'product' then 'PI'
    when 'consultation' then 'CS'
    else 'IN'
  end;

  insert into public.reference_counters as rc (prefix, year, last_value)
  values (v_prefix, v_year, 1)
  on conflict (prefix, year) do update set last_value = rc.last_value + 1
  returning last_value into v_next;

  v_ref := v_prefix || '-' || v_year || '-' || lpad(v_next::text, 4, '0');

  insert into public.inquiries (
    reference_no, type, full_name, phone, email, location, service, product_id,
    budget, preferred_date, preferred_contact, message, attachments, consent
  ) values (
    v_ref, v_type, v_name, v_phone,
    nullif(btrim(payload->>'email'), ''),
    nullif(btrim(payload->>'location'), ''),
    nullif(btrim(payload->>'service'), ''),
    nullif(payload->>'product_id', '')::uuid,
    nullif(btrim(payload->>'budget'), ''),
    nullif(btrim(payload->>'preferred_date'), ''),
    nullif(btrim(payload->>'preferred_contact'), ''),
    nullif(btrim(payload->>'message'), ''),
    v_attachments,
    true
  );

  insert into public.notifications (title, body, link)
  values ('New ' || v_type::text || ' request ' || v_ref, v_name || ' · ' || v_phone, '/admin/inquiries?ref=' || v_ref);

  return v_ref;
end $$;

revoke all on function public.submit_inquiry(jsonb) from public;
grant execute on function public.submit_inquiry(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.projects enable row level security;
alter table public.project_photos enable row level security;
alter table public.testimonials enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.announcements enable row level security;
alter table public.reference_counters enable row level security;
alter table public.inquiries enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;

-- Profiles: team members see each other; only managers change roles.
create policy "team reads profiles" on public.profiles for select to authenticated using (public.is_team() or id = auth.uid());
create policy "managers manage profiles" on public.profiles for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- Settings: public read, managers write.
create policy "public reads settings" on public.site_settings for select using (true);
create policy "managers write settings" on public.site_settings for update to authenticated using (public.is_manager()) with check (public.is_manager());

-- Published content: public reads published rows, editors manage all rows.
create policy "public reads services" on public.services for select using (is_published or public.is_team());
create policy "editors manage services" on public.services for all to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "public reads projects" on public.projects for select using (is_published or public.is_team());
create policy "editors manage projects" on public.projects for all to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "public reads project photos" on public.project_photos for select using (
  exists (select 1 from public.projects p where p.id = project_id and (p.is_published or public.is_team()))
);
create policy "editors manage project photos" on public.project_photos for all to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "public reads approved testimonials" on public.testimonials for select using ((status = 'approved' and consent_given) or public.is_team());
create policy "editors manage testimonials" on public.testimonials for all to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "public reads products" on public.products for select using (is_published or public.is_team());
create policy "team manages products" on public.products for all to authenticated using (public.is_team()) with check (public.is_team());

create policy "public reads promotions" on public.promotions for select using (
  (is_published and (starts_on is null or starts_on <= current_date) and (ends_on is null or ends_on >= current_date)) or public.is_team()
);
create policy "editors manage promotions" on public.promotions for all to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "public reads announcements" on public.announcements for select using (is_published or public.is_team());
create policy "editors manage announcements" on public.announcements for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- Private data: team only. Visitors never read inquiries or customers.
create policy "team manages customers" on public.customers for all to authenticated using (public.is_team()) with check (public.is_team());
create policy "team manages inquiries" on public.inquiries for all to authenticated using (public.is_team()) with check (public.is_team());
create policy "team reads notifications" on public.notifications for select to authenticated using (public.is_team() and (recipient_id is null or recipient_id = auth.uid()));
create policy "team updates own notifications" on public.notifications for update to authenticated using (public.is_team() and (recipient_id is null or recipient_id = auth.uid()));
create policy "managers read activity" on public.activity_logs for select to authenticated using (public.is_manager());
create policy "team writes activity" on public.activity_logs for insert to authenticated with check (public.is_team() and actor_id = auth.uid());
-- reference_counters: no policies, only reachable through submit_inquiry().

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 10485760, array['image/jpeg','image/png','image/webp','video/mp4']),
  ('inquiry-uploads', 'inquiry-uploads', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

create policy "public reads media" on storage.objects for select using (bucket_id = 'media');
create policy "editors write media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_editor());
create policy "editors update media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_editor());
create policy "editors delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_editor());

-- Visitors may upload (but never list or read) inquiry photos, into a random folder.
create policy "visitors upload inquiry photos" on storage.objects for insert to anon, authenticated with check (
  bucket_id = 'inquiry-uploads'
  and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
);
create policy "team reads inquiry photos" on storage.objects for select to authenticated using (bucket_id = 'inquiry-uploads' and public.is_team());
create policy "managers delete inquiry photos" on storage.objects for delete to authenticated using (bucket_id = 'inquiry-uploads' and public.is_manager());

-- ---------------------------------------------------------------------------
-- The very first user becomes the active owner. Everyone after that starts as an
-- INACTIVE staff profile with no access until an owner or admin activates them.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_first boolean := not exists (select 1 from public.profiles);
begin
  insert into public.profiles (id, full_name, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case when v_first then 'owner'::public.app_role else 'staff'::public.app_role end,
    v_first
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
