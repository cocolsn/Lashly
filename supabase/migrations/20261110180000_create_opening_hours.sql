-- Étape 3 : horaires d'ouverture, une ligne par jour (0 = dimanche … 6 = samedi).
-- La pause et le temps de préparation sont sur pros (pause_start, pause_end, buffer_minutes).
-- Les heures restent enregistrées quand le jour est fermé, pour les retrouver à la réouverture.

create table public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pro_id uuid not null references public.pros (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  is_open boolean not null default false,
  start_time time not null default '09:00',
  end_time time not null default '18:00',
  unique (pro_id, weekday),
  check (start_time < end_time)
);

alter table public.opening_hours enable row level security;

-- Une pro ne voit et ne modifie que ses propres horaires.
create policy "opening_hours_select_own" on public.opening_hours
  for select to authenticated using ((select auth.uid()) = pro_id);

create policy "opening_hours_insert_own" on public.opening_hours
  for insert to authenticated with check ((select auth.uid()) = pro_id);

create policy "opening_hours_update_own" on public.opening_hours
  for update to authenticated
  using ((select auth.uid()) = pro_id)
  with check ((select auth.uid()) = pro_id);

-- Le public n'a aucun accès direct (les créneaux seront calculés côté serveur à l'étape 4).
revoke all on public.opening_hours from anon;
revoke all on public.opening_hours from authenticated;
grant select, insert, update on public.opening_hours to authenticated;
