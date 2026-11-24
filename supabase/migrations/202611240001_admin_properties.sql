create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text,
  property_type text not null check (property_type in ('Apartamento', 'Casa', 'Terreno', 'Comercial', 'Outro')),
  purpose text not null check (purpose in ('sale', 'rent')),
  status text not null default 'available' check (status in ('available', 'sold', 'rented')),
  price numeric(14, 2) not null check (price >= 0),
  condo_fee numeric(14, 2) check (condo_fee is null or condo_fee >= 0),
  property_tax numeric(14, 2) check (property_tax is null or property_tax >= 0),
  state text check (state is null or char_length(state) <= 2),
  city text,
  neighborhood text,
  total_area numeric(12, 2) check (total_area is null or total_area >= 0),
  private_area numeric(12, 2) check (private_area is null or private_area >= 0),
  bedrooms integer check (bedrooms is null or bedrooms >= 0),
  suites integer check (suites is null or suites >= 0),
  bathrooms integer check (bathrooms is null or bathrooms >= 0),
  parking_spaces integer check (parking_spaces is null or parking_spaces >= 0),
  features text[] not null default '{}',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_private_addresses (
  property_id uuid primary key references public.properties (id) on delete cascade,
  postal_code text,
  address text,
  street_number text,
  complement text,
  updated_at timestamptz not null default now()
);

create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '',
  display_order integer not null default 0 check (display_order >= 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists properties_publication_created_idx
  on public.properties (is_published, created_at desc);
create index if not exists properties_search_location_idx
  on public.properties (city, neighborhood, property_type, purpose, status);
create index if not exists property_images_property_order_idx
  on public.property_images (property_id, display_order);
create unique index if not exists property_images_one_cover_idx
  on public.property_images (property_id) where is_cover;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

drop trigger if exists property_private_addresses_set_updated_at on public.property_private_addresses;
create trigger property_private_addresses_set_updated_at
before update on public.property_private_addresses
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.properties enable row level security;
alter table public.property_private_addresses enable row level security;
alter table public.property_images enable row level security;

drop policy if exists "Admins can read their own authorization" on public.admin_users;
create policy "Admins can read their own authorization"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Public can read published properties" on public.properties;
create policy "Public can read published properties"
  on public.properties for select to anon, authenticated
  using (is_published or (select public.is_admin()));

drop policy if exists "Admins can create properties" on public.properties;
create policy "Admins can create properties"
  on public.properties for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update properties" on public.properties;
create policy "Admins can update properties"
  on public.properties for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete properties" on public.properties;
create policy "Admins can delete properties"
  on public.properties for delete to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can manage private property addresses" on public.property_private_addresses;
create policy "Admins can manage private property addresses"
  on public.property_private_addresses for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Public can read images of published properties" on public.property_images;
create policy "Public can read images of published properties"
  on public.property_images for select to anon, authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.properties
      where properties.id = property_images.property_id
        and properties.is_published
    )
  );

drop policy if exists "Admins can manage property images" on public.property_images;
create policy "Admins can manage property images"
  on public.property_images for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on public.properties from anon, public;
grant select (
  id, title, description, property_type, purpose, status, price,
  condo_fee, property_tax, state, city, neighborhood, total_area,
  private_area, bedrooms, suites, bathrooms, parking_spaces, features,
  is_published, created_at, updated_at
) on public.properties to anon;
grant select, insert, update, delete on public.properties to authenticated;

revoke all on public.property_private_addresses from anon, public;
grant select, insert, update, delete on public.property_private_addresses to authenticated;

grant select on public.property_images to anon, authenticated;
grant insert, update, delete on public.property_images to authenticated;
grant select on public.admin_users to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view property images" on storage.objects;
create policy "Public can view property images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'property-images');

drop policy if exists "Admins can upload property images" on storage.objects;
create policy "Admins can upload property images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images' and (select public.is_admin()));

drop policy if exists "Admins can update property images" on storage.objects;
create policy "Admins can update property images"
  on storage.objects for update to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()))
  with check (bucket_id = 'property-images' and (select public.is_admin()));

drop policy if exists "Admins can delete property images" on storage.objects;
create policy "Admins can delete property images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()));

-- Bootstrap steps after running this migration:
-- 1) Create the first account in Authentication > Users in the Supabase Dashboard.
-- 2) Copy that user's UUID and run:
--    insert into public.admin_users (user_id) values ('PASTE-AUTH-USER-UUID-HERE');
-- Do not enable public sign-ups or add service_role credentials to the website.
