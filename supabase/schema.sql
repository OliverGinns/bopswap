-- BopSwap: paste this whole file into the Supabase SQL editor and run it. Safe to re-run.
-- No auth in the demo, so the anon key may read and insert (but never update or delete).

create extension if not exists pgcrypto;

create table if not exists public.listings (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  title         text not null check (char_length(title) between 1 and 80),
  description   text not null default '' check (char_length(description) <= 300),
  category      text not null check (category in ('Tops','Bottoms','Outerwear','Shoes','Accessories','Costume')),
  theme         text not null check (theme in ('90s','fancy-dress')),
  size          text not null default 'One size' check (char_length(size) <= 20),
  condition     text not null default 'Good' check (condition in ('New','Like new','Good','Well loved')),
  tags          text[] not null default '{}' check (cardinality(tags) <= 8),
  price         numeric(7,2) check (price is null or price >= 0),  -- null = swap
  seller_name   text not null default 'A student' check (char_length(seller_name) <= 60),
  college       text check (char_length(college) <= 60),
  lat           double precision,
  lng           double precision,
  image_url     text
);

create index if not exists listings_created_at_idx on public.listings (created_at desc);

alter table public.listings enable row level security;

drop policy if exists "anyone can read listings" on public.listings;
create policy "anyone can read listings" on public.listings for select to anon, authenticated using (true);

drop policy if exists "anyone can add listings" on public.listings;
create policy "anyone can add listings" on public.listings for insert to anon, authenticated with check (true);

-- Public image bucket (5 MB, images only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "anyone can view listing images" on storage.objects;
create policy "anyone can view listing images" on storage.objects for select to anon, authenticated using (bucket_id = 'listing-images');

drop policy if exists "anyone can upload listing images" on storage.objects;
create policy "anyone can upload listing images" on storage.objects for insert to anon, authenticated with check (bucket_id = 'listing-images');
