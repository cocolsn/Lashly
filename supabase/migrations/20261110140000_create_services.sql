-- Étape 2 : prestations proposées par chaque pro.

create table public.services (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pro_id uuid not null references public.pros (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  duration_min integer not null check (duration_min between 15 and 600 and duration_min % 5 = 0),
  price_cents integer not null check (price_cents between 0 and 100000),
  description text check (description is null or char_length(description) <= 1000),
  active boolean not null default true,
  position integer not null default 0
);

create index services_pro_id_position_idx on public.services (pro_id, position);

alter table public.services enable row level security;

-- Une pro ne voit et ne modifie que ses propres prestations.
create policy "services_select_own" on public.services
  for select to authenticated using ((select auth.uid()) = pro_id);

create policy "services_insert_own" on public.services
  for insert to authenticated with check ((select auth.uid()) = pro_id);

create policy "services_update_own" on public.services
  for update to authenticated
  using ((select auth.uid()) = pro_id)
  with check ((select auth.uid()) = pro_id);

create policy "services_delete_own" on public.services
  for delete to authenticated using ((select auth.uid()) = pro_id);

-- Le public n'a aucun accès direct (la page publique viendra à l'étape 4).
revoke all on public.services from anon;
revoke all on public.services from authenticated;
grant select, insert, update, delete on public.services to authenticated;
