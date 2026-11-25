create table if not exists public.property_videos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  url text not null check (
    char_length(url) between 1 and 2048
    and url = btrim(url)
    and url ~ '^https://[^[:space:]]+$'
  ),
  platform text not null check (platform in ('youtube', 'instagram', 'tiktok', 'vimeo', 'direct')),
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now()
);

create index if not exists property_videos_property_order_idx
  on public.property_videos (property_id, display_order);

alter table public.property_videos enable row level security;

drop policy if exists "Public can read videos of published properties" on public.property_videos;
create policy "Public can read videos of published properties"
  on public.property_videos for select to anon, authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.properties
      where properties.id = property_videos.property_id
        and properties.is_published
    )
  );

drop policy if exists "Admins can manage property videos" on public.property_videos;
create policy "Admins can manage property videos"
  on public.property_videos for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on public.property_videos from anon, public;
grant select on public.property_videos to anon, authenticated;
grant insert, update, delete on public.property_videos to authenticated;
