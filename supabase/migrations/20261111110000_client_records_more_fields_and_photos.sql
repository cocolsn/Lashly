-- Fiche cliente plus complète et photos avant/après par rendez-vous.

-- Longueur : on passe d'une seule valeur à une fourchette mini/maxi.
alter table public.client_records rename column length_mm to length_min_mm;

alter table public.client_records
  add column length_max_mm numeric(4, 1) check (length_max_mm between 0 and 30),
  add column effect text check (char_length(effect) <= 80),            -- effet : naturel, cat eye…
  add column volume text check (char_length(volume) <= 20),            -- 1D, 2D, 3D, 4-6D, méga
  add column mapping_inner_mm numeric(4, 1) check (mapping_inner_mm between 0 and 30),   -- coin interne
  add column mapping_middle_mm numeric(4, 1) check (mapping_middle_mm between 0 and 30), -- milieu
  add column mapping_outer_mm numeric(4, 1) check (mapping_outer_mm between 0 and 30),   -- coin externe
  add column natural_lashes text check (char_length(natural_lashes) <= 40),
  -- Yeux sensibles et lentilles sont des informations de santé : accord de la cliente requis.
  add column sensitive_eyes boolean not null default false,
  add column contact_lenses boolean not null default false,
  add column patch_test_on date,
  add constraint client_records_length_range
    check (length_min_mm is null or length_max_mm is null or length_min_mm <= length_max_mm),
  add constraint client_records_health_flags_consent
    check ((not sensitive_eyes and not contact_lenses) or health_consent_at is not null);

update public.client_records set length_max_mm = length_min_mm where length_min_mm is not null;

-- Photos avant/après rattachées à un rendez-vous. Les fichiers sont dans le stockage privé
-- « lash-photos », rangés par pro : {pro_id}/{client_id}/{photo}.jpg
create table public.booking_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pro_id uuid not null references public.pros (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  storage_path text not null unique check (storage_path like pro_id::text || '/%'),
  kind text not null check (kind in ('before', 'after'))
);

create index booking_photos_booking_id_idx on public.booking_photos (booking_id);
create index booking_photos_pro_id_idx on public.booking_photos (pro_id);

alter table public.booking_photos enable row level security;

create policy "booking_photos_select_own" on public.booking_photos
  for select to authenticated using ((select auth.uid()) = pro_id);
create policy "booking_photos_insert_own" on public.booking_photos
  for insert to authenticated with check (
    (select auth.uid()) = pro_id
    and exists (select 1 from public.bookings b where b.id = booking_id and b.pro_id = (select auth.uid()))
  );
create policy "booking_photos_delete_own" on public.booking_photos
  for delete to authenticated using ((select auth.uid()) = pro_id);

revoke all on public.booking_photos from anon, authenticated;
grant select, insert, delete on public.booking_photos to authenticated;

-- Stockage privé : 5 Mo maximum par photo, images seulement ; chaque pro n'accède qu'à son dossier.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lash-photos', 'lash-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "lash_photos_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'lash-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "lash_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lash-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "lash_photos_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lash-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
