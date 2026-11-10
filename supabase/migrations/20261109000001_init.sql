-- Iloilo Modern Homes Construction Co. — initial schema
-- Public website content, customer submissions, and the foundations for the admin dashboard.
-- Every table has Row Level Security enabled. The public (anon) role can only read published
-- content and submit inquiries through the submit_inquiry() function.

create extension if not exists "pgcrypto";

-- Everything lives in its own "imhcc" schema so it can share a Supabase project with other
-- apps without clashing (they keep "public"). Expose "imhcc" under Settings > Data API.
create schema if not exists imhcc;
grant usage on schema imhcc to anon, authenticated, service_role;
alter default privileges in schema imhcc grant all on tables to anon, authenticated, service_role;
alter default privileges in schema imhcc grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema imhcc grant execute on functions to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Roles and profiles
-- ---------------------------------------------------------------------------
create type imhcc.app_role as enum ('owner', 'admin', 'editor', 'staff');

create table imhcc.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role imhcc.app_role not null default 'staff',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper: the current user's role, or null for visitors.
create or replace function imhcc.current_role_name()
returns imhcc.app_role
language sql stable security definer set search_path = imhcc, public
as $$
  select role from imhcc.profiles where id = auth.uid() and is_active
$$;

create or replace function imhcc.has_role(roles imhcc.app_role[])
returns boolean
language sql stable security definer set search_path = imhcc, public
as $$
  select coalesce(imhcc.current_role_name() = any(roles), false)
$$;

-- Any signed-in team member (owner, admin, editor, staff)
create or replace function imhcc.is_team()
returns boolean language sql stable as $$
  select imhcc.has_role(array['owner','admin','editor','staff']::imhcc.app_role[])
$$;

-- Content editors (owner, admin, editor)
create or replace function imhcc.is_editor()
returns boolean language sql stable as $$
  select imhcc.has_role(array['owner','admin','editor']::imhcc.app_role[])
$$;

-- Managers (owner, admin)
create or replace function imhcc.is_manager()
returns boolean language sql stable as $$
  select imhcc.has_role(array['owner','admin']::imhcc.app_role[])
$$;

create or replace function imhcc.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch before update on imhcc.profiles
  for each row execute function imhcc.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Website settings (single row)
-- ---------------------------------------------------------------------------
create table imhcc.site_settings (
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
create trigger site_settings_touch before update on imhcc.site_settings
  for each row execute function imhcc.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
create table imhcc.services (
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
create trigger services_touch before update on imhcc.services
  for each row execute function imhcc.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Customers (private)
-- ---------------------------------------------------------------------------
create table imhcc.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger customers_touch before update on imhcc.customers
  for each row execute function imhcc.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Projects and photos
-- ---------------------------------------------------------------------------
create type imhcc.project_status as enum ('planning', 'ongoing', 'completed');
create type imhcc.photo_phase as enum ('before', 'during', 'after');

create table imhcc.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  status imhcc.project_status not null default 'completed',
  location text,
  summary text,
  story text,
  scope text[] not null default '{}',
  duration text,
  completed_on date,
  cover_image text,
  customer_id uuid references imhcc.customers (id) on delete set null,
  service_id uuid references imhcc.services (id) on delete set null,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger projects_touch before update on imhcc.projects
  for each row execute function imhcc.touch_updated_at();

create table imhcc.project_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references imhcc.projects (id) on delete cascade,
  image_url text not null,
  caption text,
  phase imhcc.photo_phase not null default 'after',
  taken_on date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index project_photos_project_idx on imhcc.project_photos (project_id, sort_order);

-- ---------------------------------------------------------------------------
-- Testimonials (published only with consent)
-- ---------------------------------------------------------------------------
create type imhcc.moderation_status as enum ('pending', 'approved', 'hidden');

create table imhcc.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_town text,
  service_label text,
  quote text not null,
  rating int check (rating between 1 and 5),
  photo_url text,
  project_id uuid references imhcc.projects (id) on delete set null,
  customer_id uuid references imhcc.customers (id) on delete set null,
  consent_given boolean not null default false,
  consent_date date,
  status imhcc.moderation_status not null default 'pending',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonial_needs_consent check (status <> 'approved' or consent_given)
);
create trigger testimonials_touch before update on imhcc.testimonials
  for each row execute function imhcc.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Hardware products
-- ---------------------------------------------------------------------------
create type imhcc.stock_status as enum ('in_stock', 'low_stock', 'out_of_stock', 'made_to_order');

create table imhcc.products (
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
  stock_status imhcc.stock_status not null default 'in_stock',
  delivery_info text,
  image_url text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_touch before update on imhcc.products
  for each row execute function imhcc.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Promotions and announcements
-- ---------------------------------------------------------------------------
create table imhcc.promotions (
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
create trigger promotions_touch before update on imhcc.promotions
  for each row execute function imhcc.touch_updated_at();

create table imhcc.announcements (
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
create trigger announcements_touch before update on imhcc.announcements
  for each row execute function imhcc.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Inquiries (quotation requests, product inquiries, consultations, contact)
-- ---------------------------------------------------------------------------
create type imhcc.inquiry_type as enum ('quotation', 'product', 'consultation', 'contact');
create type imhcc.inquiry_status as enum ('new', 'contacted', 'site_visit', 'quoted', 'won', 'lost', 'closed');

create table imhcc.reference_counters (
  prefix text not null,
  year int not null,
  last_value int not null default 0,
  primary key (prefix, year)
);

create table imhcc.inquiries (
  id uuid primary key default gen_random_uuid(),
  reference_no text not null unique,
  type imhcc.inquiry_type not null,
  status imhcc.inquiry_status not null default 'new',
  full_name text not null,
  phone text not null,
  email text,
  location text,
  service text,
  product_id uuid references imhcc.products (id) on delete set null,
  budget text,
  preferred_date text,
  preferred_contact text,
  message text,
  attachments text[] not null default '{}',
  customer_id uuid references imhcc.customers (id) on delete set null,
  assigned_to uuid references imhcc.profiles (id) on delete set null,
  consent boolean not null default false,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_status_idx on imhcc.inquiries (status, created_at desc);
create trigger inquiries_touch before update on imhcc.inquiries
  for each row execute function imhcc.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Notifications and activity log (admin)
-- ---------------------------------------------------------------------------
create table imhcc.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references imhcc.profiles (id) on delete cascade, -- null = all team members
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table imhcc.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references imhcc.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Public submission function: the only way visitors can write data.
-- ---------------------------------------------------------------------------
create or replace function imhcc.submit_inquiry(payload jsonb)
returns text
language plpgsql
security definer
set search_path = imhcc, public
as $$
declare
  v_type imhcc.inquiry_type := (payload->>'type')::imhcc.inquiry_type;
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

  insert into imhcc.reference_counters as rc (prefix, year, last_value)
  values (v_prefix, v_year, 1)
  on conflict (prefix, year) do update set last_value = rc.last_value + 1
  returning last_value into v_next;

  v_ref := v_prefix || '-' || v_year || '-' || lpad(v_next::text, 4, '0');

  insert into imhcc.inquiries (
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

  insert into imhcc.notifications (title, body, link)
  values ('New ' || v_type::text || ' request ' || v_ref, v_name || ' · ' || v_phone, '/admin/inquiries?ref=' || v_ref);

  return v_ref;
end $$;

revoke all on function imhcc.submit_inquiry(jsonb) from public;
grant execute on function imhcc.submit_inquiry(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table imhcc.profiles enable row level security;
alter table imhcc.site_settings enable row level security;
alter table imhcc.services enable row level security;
alter table imhcc.customers enable row level security;
alter table imhcc.projects enable row level security;
alter table imhcc.project_photos enable row level security;
alter table imhcc.testimonials enable row level security;
alter table imhcc.products enable row level security;
alter table imhcc.promotions enable row level security;
alter table imhcc.announcements enable row level security;
alter table imhcc.reference_counters enable row level security;
alter table imhcc.inquiries enable row level security;
alter table imhcc.notifications enable row level security;
alter table imhcc.activity_logs enable row level security;

-- Profiles: team members see each other; only managers change roles.
create policy "team reads profiles" on imhcc.profiles for select to authenticated using (imhcc.is_team() or id = auth.uid());
create policy "managers manage profiles" on imhcc.profiles for all to authenticated using (imhcc.is_manager()) with check (imhcc.is_manager());

-- Settings: public read, managers write.
create policy "public reads settings" on imhcc.site_settings for select using (true);
create policy "managers write settings" on imhcc.site_settings for update to authenticated using (imhcc.is_manager()) with check (imhcc.is_manager());

-- Published content: public reads published rows, editors manage all rows.
create policy "public reads services" on imhcc.services for select using (is_published or imhcc.is_team());
create policy "editors manage services" on imhcc.services for all to authenticated using (imhcc.is_editor()) with check (imhcc.is_editor());

create policy "public reads projects" on imhcc.projects for select using (is_published or imhcc.is_team());
create policy "editors manage projects" on imhcc.projects for all to authenticated using (imhcc.is_editor()) with check (imhcc.is_editor());

create policy "public reads project photos" on imhcc.project_photos for select using (
  exists (select 1 from imhcc.projects p where p.id = project_id and (p.is_published or imhcc.is_team()))
);
create policy "editors manage project photos" on imhcc.project_photos for all to authenticated using (imhcc.is_editor()) with check (imhcc.is_editor());

create policy "public reads approved testimonials" on imhcc.testimonials for select using ((status = 'approved' and consent_given) or imhcc.is_team());
create policy "editors manage testimonials" on imhcc.testimonials for all to authenticated using (imhcc.is_editor()) with check (imhcc.is_editor());

create policy "public reads products" on imhcc.products for select using (is_published or imhcc.is_team());
create policy "team manages products" on imhcc.products for all to authenticated using (imhcc.is_team()) with check (imhcc.is_team());

create policy "public reads promotions" on imhcc.promotions for select using (
  (is_published and (starts_on is null or starts_on <= current_date) and (ends_on is null or ends_on >= current_date)) or imhcc.is_team()
);
create policy "editors manage promotions" on imhcc.promotions for all to authenticated using (imhcc.is_editor()) with check (imhcc.is_editor());

create policy "public reads announcements" on imhcc.announcements for select using (is_published or imhcc.is_team());
create policy "editors manage announcements" on imhcc.announcements for all to authenticated using (imhcc.is_editor()) with check (imhcc.is_editor());

-- Private data: team only. Visitors never read inquiries or customers.
create policy "team manages customers" on imhcc.customers for all to authenticated using (imhcc.is_team()) with check (imhcc.is_team());
create policy "team manages inquiries" on imhcc.inquiries for all to authenticated using (imhcc.is_team()) with check (imhcc.is_team());
create policy "team reads notifications" on imhcc.notifications for select to authenticated using (imhcc.is_team() and (recipient_id is null or recipient_id = auth.uid()));
create policy "team updates own notifications" on imhcc.notifications for update to authenticated using (imhcc.is_team() and (recipient_id is null or recipient_id = auth.uid()));
create policy "managers read activity" on imhcc.activity_logs for select to authenticated using (imhcc.is_manager());
create policy "team writes activity" on imhcc.activity_logs for insert to authenticated with check (imhcc.is_team() and actor_id = auth.uid());
-- reference_counters: no policies, only reachable through submit_inquiry().

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('imhcc-media', 'imhcc-media', true, 10485760, array['image/jpeg','image/png','image/webp','video/mp4']),
  ('imhcc-inquiry-uploads', 'imhcc-inquiry-uploads', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

create policy "imhcc: public reads media" on storage.objects for select using (bucket_id = 'imhcc-media');
create policy "imhcc: editors write media" on storage.objects for insert to authenticated with check (bucket_id = 'imhcc-media' and imhcc.is_editor());
create policy "imhcc: editors update media" on storage.objects for update to authenticated using (bucket_id = 'imhcc-media' and imhcc.is_editor());
create policy "imhcc: editors delete media" on storage.objects for delete to authenticated using (bucket_id = 'imhcc-media' and imhcc.is_editor());

-- Visitors may upload (but never list or read) inquiry photos, into a random folder.
create policy "imhcc: visitors upload inquiry photos" on storage.objects for insert to anon, authenticated with check (
  bucket_id = 'imhcc-inquiry-uploads'
  and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
);
create policy "imhcc: team reads inquiry photos" on storage.objects for select to authenticated using (bucket_id = 'imhcc-inquiry-uploads' and imhcc.is_team());
create policy "imhcc: managers delete inquiry photos" on storage.objects for delete to authenticated using (bucket_id = 'imhcc-inquiry-uploads' and imhcc.is_manager());

-- ---------------------------------------------------------------------------
-- The very first user becomes the active owner. Everyone after that starts as an
-- INACTIVE staff profile with no access until an owner or admin activates them.
-- ---------------------------------------------------------------------------
create or replace function imhcc.handle_new_user()
returns trigger language plpgsql security definer set search_path = imhcc, public as $$
declare
  v_first boolean := not exists (select 1 from imhcc.profiles);
begin
  insert into imhcc.profiles (id, full_name, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case when v_first then 'owner'::imhcc.app_role else 'staff'::imhcc.app_role end,
    v_first
  );
  return new;
end $$;

create trigger imhcc_on_auth_user_created after insert on auth.users
  for each row execute function imhcc.handle_new_user();
