-- Horaires, suite : chaque jour peut être en mode « automatique » (créneaux réguliers entre
-- ouverture et fermeture, moins les pauses, avec un intervalle choisi par la pro) ou « heures fixes » (liste d'heures de début
-- choisies par la pro). Les pauses deviennent multiples et propres à chaque jour.

alter table public.opening_hours
  add column slot_mode text not null default 'auto' check (slot_mode in ('auto', 'fixed')),
  add column fixed_times time[] not null default '{}' check (cardinality(fixed_times) <= 24);

create table public.opening_breaks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pro_id uuid not null references public.pros (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (start_time < end_time)
);

create index opening_breaks_pro_id_weekday_idx on public.opening_breaks (pro_id, weekday);

alter table public.opening_breaks enable row level security;

-- Une pro ne voit et ne modifie que ses propres pauses.
create policy "opening_breaks_select_own" on public.opening_breaks
  for select to authenticated using ((select auth.uid()) = pro_id);

create policy "opening_breaks_insert_own" on public.opening_breaks
  for insert to authenticated with check ((select auth.uid()) = pro_id);

create policy "opening_breaks_delete_own" on public.opening_breaks
  for delete to authenticated using ((select auth.uid()) = pro_id);

revoke all on public.opening_breaks from anon;
revoke all on public.opening_breaks from authenticated;
grant select, insert, delete on public.opening_breaks to authenticated;

-- L'ancienne pause unique (pros.pause_start / pros.pause_end) est remplacée par opening_breaks.
-- Ces colonnes ne sont plus utilisées ; elles seront supprimées dans une prochaine migration.

-- Intervalle entre deux débuts de créneau en mode automatique (30 min par défaut).
alter table public.pros
  add column slot_step_minutes integer not null default 30
    check (slot_step_minutes between 5 and 240 and slot_step_minutes % 5 = 0);
