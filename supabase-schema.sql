-- Karak Station Supabase schema
create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  arabic_name text default '',
  arabic_confirmed boolean not null default false,
  amount text default '',
  image text default '',
  image_url text default '',
  category text default '',
  description text default '',
  status text not null default 'available',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.special_foods (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  arabic_name text default '',
  description text default '',
  price text default '',
  image text default '',
  image_url text default '',
  status text not null default 'available',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  title text not null,
  post_date date,
  category text default '',
  image text default '',
  image_url text default '',
  likes integer not null default 0,
  comments integer not null default 0,
  comment_list jsonb not null default '[]'::jsonb,
  link text default '',
  excerpt text default '',
  content text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  customer_name text default '',
  customer_country_code text default '+974',
  customer_phone_number text default '',
  order_type text not null default 'whatsapp',
  items jsonb not null default '[]'::jsonb,
  total text default '',
  message text default '',
  status text not null default 'pending',
  source text default 'website',
  special_poster boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.admin_profiles where id = auth.uid()); $$;

alter table public.categories enable row level security;
alter table public.foods enable row level security;
alter table public.special_foods enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.orders enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_profiles enable row level security;

-- Compatibility store used during the migration.
create table if not exists public.app_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_store enable row level security;
-- Public website can read menu/blog/settings.
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);
drop policy if exists "public read foods" on public.foods;
create policy "public read foods" on public.foods for select using (true);
drop policy if exists "public read special foods" on public.special_foods;
create policy "public read special foods" on public.special_foods for select using (true);
drop policy if exists "public read blog categories" on public.blog_categories;
create policy "public read blog categories" on public.blog_categories for select using (true);
drop policy if exists "public read blog posts" on public.blog_posts;
create policy "public read blog posts" on public.blog_posts for select using (true);
drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select using (true);

drop policy if exists "public create orders" on public.orders;
create policy "public create orders" on public.orders for insert with check (true);
drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders" on public.orders for select using (public.is_admin());
drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete orders" on public.orders;
create policy "admins delete orders" on public.orders for delete using (public.is_admin());

drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage foods" on public.foods;
create policy "admins manage foods" on public.foods for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage special foods" on public.special_foods;
create policy "admins manage special foods" on public.special_foods for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage blog categories" on public.blog_categories;
create policy "admins manage blog categories" on public.blog_categories for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage blog posts" on public.blog_posts;
create policy "admins manage blog posts" on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage settings" on public.site_settings;
create policy "admins manage settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin read own profile" on public.admin_profiles;
create policy "admin read own profile" on public.admin_profiles for select using (id = auth.uid() or public.is_admin());

insert into public.site_settings(key, value) values
('whatsapp_order', '{"countryCode":"+974","phoneNumber":"77821400"}'),
('whatsapp_booking', '{"countryCode":"+974","phoneNumber":"77821400"}')
on conflict (key) do nothing;

insert into storage.buckets (id, name, public) values ('karak-images','karak-images',true)
on conflict (id) do nothing;

drop policy if exists "public read karak images" on storage.objects;
create policy "public read karak images" on storage.objects for select using (bucket_id = 'karak-images');
drop policy if exists "admins upload karak images" on storage.objects;
create policy "admins upload karak images" on storage.objects for insert with check (bucket_id = 'karak-images' and public.is_admin());
drop policy if exists "admins update karak images" on storage.objects;
create policy "admins update karak images" on storage.objects for update using (bucket_id = 'karak-images' and public.is_admin());
drop policy if exists "admins delete karak images" on storage.objects;
create policy "admins delete karak images" on storage.objects for delete using (bucket_id = 'karak-images' and public.is_admin());

-- Transitional compatibility store. Public clients may read menu/blog data and submit orders;
-- only authenticated admins may change administrative/site data.
drop policy if exists "public read app store" on public.app_store;
create policy "public read app store" on public.app_store for select using (
  key in ('adminMenu','adminCategories','adminFoods','blogCategories','blogPosts','specialPosterFoods','karakWhatsAppOrderSettings','karakWhatsAppBookingSettings')
);
drop policy if exists "public create app store" on public.app_store;
create policy "public create app store" on public.app_store for insert with check (key in ('karakSubmittedOrders','whatsappOrderCount','specialPosterWhatsAppOrderCount'));
drop policy if exists "public update app store" on public.app_store;
create policy "public update app store" on public.app_store for update using (key in ('karakSubmittedOrders','whatsappOrderCount','specialPosterWhatsAppOrderCount')) with check (key in ('karakSubmittedOrders','whatsappOrderCount','specialPosterWhatsAppOrderCount'));
drop policy if exists "admins manage app store" on public.app_store;
create policy "admins manage app store" on public.app_store for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete app store" on public.app_store;
