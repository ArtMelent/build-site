-- GeniusDev: initial schema
-- Run once in Supabase → SQL Editor (or `supabase db push`).
-- Tables: services (public catalogue), leads (form submissions), admins (who may use /admin).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admins: a user can manage the site only if their auth user id is listed here.
-- Signing up alone grants nothing.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admins can see admins" on public.admins;
create policy "admins can see admins"
  on public.admins for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
create table if not exists public.services (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique
                    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title             text not null check (char_length(title) between 2 and 120),
  short_description text not null default '' check (char_length(short_description) <= 300),
  intro             text not null default '' check (char_length(intro) <= 1500),
  body              text not null default '' check (char_length(body) <= 30000), -- Markdown
  highlights        text[] not null default '{}',
  price_from        integer check (price_from is null or price_from >= 0),
  price_unit        text not null default 'грн',
  image_url         text,
  seo_title         text check (seo_title is null or char_length(seo_title) <= 120),
  seo_description   text check (seo_description is null or char_length(seo_description) <= 300),
  sort_order        integer not null default 100,
  is_published      boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists services_published_order_idx
  on public.services (is_published, sort_order);

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

alter table public.services enable row level security;

drop policy if exists "anyone can read published services" on public.services;
create policy "anyone can read published services"
  on public.services for select
  to anon, authenticated
  using (is_published or public.is_admin());

drop policy if exists "admins can insert services" on public.services;
create policy "admins can insert services"
  on public.services for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admins can update services" on public.services;
create policy "admins can update services"
  on public.services for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins can delete services" on public.services;
create policy "admins can delete services"
  on public.services for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Leads (form submissions)
-- Inserted only by the server function (/api/lead) with the service-role key,
-- so the public has no insert policy at all. Admins read and update them.
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 100),
  phone        text not null check (char_length(phone) between 5 and 30),
  message      text not null default '' check (char_length(message) <= 2000),
  service_id   uuid references public.services (id) on delete set null,
  service_title text, -- snapshot, survives service deletion/renaming
  source_page  text,
  ip_hash      text, -- salted SHA-256 of the sender IP, only for rate limiting
  status       text not null default 'new'
               check (status in ('new', 'in_progress', 'done', 'spam')),
  admin_note   text not null default '' check (char_length(admin_note) <= 2000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_phone_created_idx on public.leads (phone, created_at desc);
create index if not exists leads_ip_created_idx on public.leads (ip_hash, created_at desc);

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

alter table public.leads enable row level security;

drop policy if exists "admins can read leads" on public.leads;
create policy "admins can read leads"
  on public.leads for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins can update leads" on public.leads;
create policy "admins can update leads"
  on public.leads for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins can delete leads" on public.leads;
create policy "admins can delete leads"
  on public.leads for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: public bucket for service photos, writable by admins only.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('service-images', 'service-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public can read service images" on storage.objects;
create policy "public can read service images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'service-images');

drop policy if exists "admins can upload service images" on storage.objects;
create policy "admins can upload service images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'service-images' and public.is_admin());

drop policy if exists "admins can update service images" on storage.objects;
create policy "admins can update service images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'service-images' and public.is_admin());

drop policy if exists "admins can delete service images" on storage.objects;
create policy "admins can delete service images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'service-images' and public.is_admin());
