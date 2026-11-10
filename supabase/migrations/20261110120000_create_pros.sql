-- Étape 1 : profil du studio de chaque pro.
-- Une ligne par compte pro, avec le même id que auth.users.

create table public.pros (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 40)
    -- Doit rester aligné avec RESERVED_SLUGS dans src/lib/slug.ts
    check (slug <> all (array[
      'admin', 'aide', 'api', 'auth', 'cgu', 'confidentialite', 'connexion',
      'contact', 'deconnexion', 'espace', 'inscription', 'lashly',
      'mentions-legales', 'reservation', 'studio'
    ])),
  studio_name text not null check (char_length(btrim(studio_name)) between 2 and 80),
  city text not null check (char_length(btrim(city)) between 2 and 80),
  phone text check (phone is null or char_length(phone) <= 30),
  buffer_minutes integer not null default 10 check (buffer_minutes between 0 and 120),
  pause_start time,
  pause_end time,
  check (
    (pause_start is null and pause_end is null)
    or (pause_start is not null and pause_end is not null and pause_start < pause_end)
  )
);

alter table public.pros enable row level security;

-- Une pro ne voit et ne modifie que sa propre ligne.
create policy "pros_select_own" on public.pros
  for select to authenticated using ((select auth.uid()) = id);

create policy "pros_insert_own" on public.pros
  for insert to authenticated with check ((select auth.uid()) = id);

create policy "pros_update_own" on public.pros
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Le public n'a aucun accès direct (la page publique viendra à l'étape 4).
revoke all on public.pros from anon;
revoke all on public.pros from authenticated;
grant select, insert, update on public.pros to authenticated;
