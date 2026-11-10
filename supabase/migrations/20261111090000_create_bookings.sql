-- Étape 4 : réservation publique.
-- Clientes, fiches (données de santé : réactions), rendez-vous avec anti double réservation,
-- et trois fonctions publiques : lire un studio, calculer les créneaux, réserver.
-- Le public n'a aucun accès direct aux tables : il passe uniquement par ces fonctions.

create extension if not exists btree_gist with schema extensions;

-- Clientes d'une pro (créées automatiquement à la réservation).
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pro_id uuid not null references public.pros (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (char_length(phone) <= 30),
  email text not null check (char_length(email) <= 200 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  consent_at timestamptz not null,
  unique (pro_id, email)
);

-- Fiche cliente. reactions est une donnée de santé (RGPD art. 9) : consentement séparé et horodaté.
create table public.client_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pro_id uuid not null references public.pros (id) on delete cascade,
  client_id uuid not null unique references public.clients (id) on delete cascade,
  lash_type text check (char_length(lash_type) <= 80),
  curl text check (char_length(curl) <= 20),
  length_mm numeric(4, 1) check (length_mm between 0 and 30),
  thickness numeric(4, 2) check (thickness between 0 and 1),
  glue text check (char_length(glue) <= 80),
  reactions text check (char_length(reactions) <= 4000),
  health_consent_at timestamptz,
  notes text check (char_length(notes) <= 5000),
  check (reactions is null or health_consent_at is not null)
);

-- Rendez-vous. blocked_until = fin + temps de préparation : c'est la plage protégée contre
-- les chevauchements. Nom, option et prix sont copiés au moment de la réservation.
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pro_id uuid not null references public.pros (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  service_name text not null,
  addon_name text,
  price_cents integer not null check (price_cents >= 0),
  deposit_cents integer not null default 0 check (deposit_cents >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  blocked_until timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'done', 'no_show')),
  check (starts_at < ends_at and ends_at <= blocked_until),
  -- Anti double réservation : deux rendez-vous actifs d'une même pro ne peuvent pas se chevaucher,
  -- même si deux clientes valident au même instant.
  constraint bookings_no_overlap exclude using gist (
    pro_id with =,
    tstzrange(starts_at, blocked_until) with &&
  ) where (status <> 'cancelled')
);

create index bookings_pro_id_starts_at_idx on public.bookings (pro_id, starts_at);
create index bookings_client_id_idx on public.bookings (client_id);

-- RLS : une pro ne voit et ne modifie que ses lignes. Les créations passent par create_booking.
alter table public.clients enable row level security;
alter table public.client_records enable row level security;
alter table public.bookings enable row level security;

create policy "clients_select_own" on public.clients
  for select to authenticated using ((select auth.uid()) = pro_id);
create policy "clients_update_own" on public.clients
  for update to authenticated using ((select auth.uid()) = pro_id) with check ((select auth.uid()) = pro_id);
create policy "clients_delete_own" on public.clients
  for delete to authenticated using ((select auth.uid()) = pro_id);

create policy "client_records_select_own" on public.client_records
  for select to authenticated using ((select auth.uid()) = pro_id);
create policy "client_records_insert_own" on public.client_records
  for insert to authenticated with check (
    (select auth.uid()) = pro_id
    and exists (select 1 from public.clients c where c.id = client_id and c.pro_id = (select auth.uid()))
  );
create policy "client_records_update_own" on public.client_records
  for update to authenticated using ((select auth.uid()) = pro_id) with check ((select auth.uid()) = pro_id);

create policy "bookings_select_own" on public.bookings
  for select to authenticated using ((select auth.uid()) = pro_id);
create policy "bookings_update_own" on public.bookings
  for update to authenticated using ((select auth.uid()) = pro_id) with check ((select auth.uid()) = pro_id);

revoke all on public.clients, public.client_records, public.bookings from anon, authenticated;
grant select, update, delete on public.clients to authenticated;
grant select, insert, update on public.client_records to authenticated;
grant select, update (status) on public.bookings to authenticated;

-- Studio public : nom, ville et prestations visibles. Renvoie null si l'adresse n'existe pas.
create function public.get_public_studio(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'slug', p.slug,
    'studio_name', p.studio_name,
    'city', p.city,
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'duration_min', s.duration_min,
        'price_cents', s.price_cents,
        'description', s.description,
        'addon_name', s.addon_name,
        'addon_price_cents', s.addon_price_cents,
        'addon_duration_min', s.addon_duration_min
      ) order by s.position, s.created_at)
      from public.services s
      where s.pro_id = p.id and s.active
    ), '[]'::jsonb)
  )
  from public.pros p
  where p.slug = lower(p_slug);
$$;

-- Créneaux libres pour une prestation, sur les p_days prochains jours (heure de Paris).
-- Règles :
--  - jour ouvert seulement ;
--  - mode « auto » : un début toutes les slot_step_minutes depuis l'ouverture, à condition que
--    début + durée + préparation tienne avant la fermeture et ne chevauche aucune pause ;
--  - mode « fixed » : seulement les heures choisies par la pro ;
--  - jamais dans le passé, jamais sur un rendez-vous existant (préparation comprise).
create function public.get_available_slots(
  p_slug text,
  p_service_id uuid,
  p_with_addon boolean default false,
  p_days integer default 14
)
returns setof timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz constant text := 'Europe/Paris';
  v_pro public.pros;
  v_service public.services;
  v_hours public.opening_hours;
  v_block interval;
  v_day date;
  v_time time;
  v_start_local timestamp;
  v_end_local timestamp;
  v_start timestamptz;
begin
  select * into v_pro from public.pros where slug = lower(p_slug);
  if not found then return; end if;

  select * into v_service from public.services
  where id = p_service_id and pro_id = v_pro.id and active;
  if not found then return; end if;

  v_block := make_interval(mins => v_service.duration_min
    + case when p_with_addon and v_service.addon_name is not null then v_service.addon_duration_min else 0 end
    + v_pro.buffer_minutes);

  for v_day in
    select d::date from generate_series(
      (now() at time zone v_tz)::date,
      (now() at time zone v_tz)::date + (least(greatest(p_days, 1), 14) - 1),
      interval '1 day'
    ) d
  loop
    select * into v_hours from public.opening_hours
    where pro_id = v_pro.id and weekday = extract(dow from v_day);
    continue when not found or not v_hours.is_open;

    for v_time in
      select t from unnest(v_hours.fixed_times) t where v_hours.slot_mode = 'fixed'
      union
      select v_hours.start_time + make_interval(mins => n * v_pro.slot_step_minutes)
      from generate_series(
        0,
        (extract(epoch from v_hours.end_time - v_hours.start_time) / 60)::integer / v_pro.slot_step_minutes
      ) n
      where v_hours.slot_mode = 'auto'
      order by 1
    loop
      v_start_local := v_day + v_time;
      v_end_local := v_start_local + v_block;
      v_start := v_start_local at time zone v_tz;

      continue when v_start <= now();

      if v_hours.slot_mode = 'auto' then
        continue when v_end_local > v_day + v_hours.end_time;
        continue when exists (
          select 1 from public.opening_breaks b
          where b.pro_id = v_pro.id and b.weekday = v_hours.weekday
            and v_day + b.start_time < v_end_local
            and v_day + b.end_time > v_start_local
        );
      end if;

      continue when exists (
        select 1 from public.bookings bk
        where bk.pro_id = v_pro.id and bk.status <> 'cancelled'
          and tstzrange(bk.starts_at, bk.blocked_until) && tstzrange(v_start, v_end_local at time zone v_tz)
      );

      return next v_start;
    end loop;
  end loop;
end;
$$;

-- Réservation par une cliente. Vérifie tout côté serveur, crée ou retrouve la cliente,
-- enregistre ses réactions seulement avec le consentement santé, puis crée le rendez-vous.
-- Erreurs renvoyées (message) : consent_required, health_consent_required, invalid_name,
-- invalid_phone, invalid_email, invalid_reactions, studio_not_found, service_not_found,
-- slot_unavailable, slot_taken.
create function public.create_booking(
  p_slug text,
  p_service_id uuid,
  p_with_addon boolean,
  p_starts_at timestamptz,
  p_full_name text,
  p_phone text,
  p_email text,
  p_reactions text,
  p_consent boolean,
  p_health_consent boolean
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_name text := regexp_replace(btrim(coalesce(p_full_name, '')), '\s+', ' ', 'g');
  v_phone text := btrim(coalesce(p_phone, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_reactions text := nullif(btrim(coalesce(p_reactions, '')), '');
  v_with_addon boolean;
  v_pro public.pros;
  v_service public.services;
  v_duration integer;
  v_client_id uuid;
  v_booking_id uuid;
begin
  if not coalesce(p_consent, false) then raise exception 'consent_required'; end if;
  if char_length(v_name) not between 2 and 120 then raise exception 'invalid_name'; end if;
  if v_phone !~ '^[+0-9 .()-]+$' or char_length(v_phone) > 30
    or char_length(regexp_replace(v_phone, '\D', '', 'g')) not between 9 and 15 then
    raise exception 'invalid_phone';
  end if;
  if char_length(v_email) > 200 or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'invalid_email';
  end if;
  if v_reactions is not null then
    if char_length(v_reactions) > 1000 then raise exception 'invalid_reactions'; end if;
    if not coalesce(p_health_consent, false) then raise exception 'health_consent_required'; end if;
  end if;

  select * into v_pro from public.pros where slug = lower(p_slug);
  if not found then raise exception 'studio_not_found'; end if;

  select * into v_service from public.services
  where id = p_service_id and pro_id = v_pro.id and active;
  if not found then raise exception 'service_not_found'; end if;

  v_with_addon := coalesce(p_with_addon, false) and v_service.addon_name is not null;

  if not exists (
    select 1 from public.get_available_slots(p_slug, p_service_id, v_with_addon) s where s = p_starts_at
  ) then
    raise exception 'slot_unavailable';
  end if;

  v_duration := v_service.duration_min + case when v_with_addon then v_service.addon_duration_min else 0 end;

  -- Cliente existante (même email chez cette pro) : on garde ses coordonnées telles que la pro
  -- les a éventuellement corrigées, on met seulement à jour la date de consentement.
  insert into public.clients (pro_id, full_name, phone, email, consent_at)
  values (v_pro.id, v_name, v_phone, v_email, now())
  on conflict (pro_id, email) do update set consent_at = excluded.consent_at
  returning id into v_client_id;

  if v_reactions is not null then
    insert into public.client_records (pro_id, client_id, reactions, health_consent_at)
    values (v_pro.id, v_client_id, v_reactions, now())
    on conflict (client_id) do update set
      reactions = left(
        coalesce(public.client_records.reactions || E'\n', '')
          || 'Indiqué à la réservation du ' || to_char(now() at time zone 'Europe/Paris', 'DD/MM/YYYY')
          || ' : ' || excluded.reactions,
        4000),
      health_consent_at = excluded.health_consent_at;
  end if;

  begin
    insert into public.bookings (
      pro_id, client_id, service_id, service_name, addon_name, price_cents,
      starts_at, ends_at, blocked_until
    ) values (
      v_pro.id, v_client_id, v_service.id, v_service.name,
      case when v_with_addon then v_service.addon_name end,
      v_service.price_cents + case when v_with_addon then v_service.addon_price_cents else 0 end,
      p_starts_at,
      p_starts_at + make_interval(mins => v_duration),
      p_starts_at + make_interval(mins => v_duration + v_pro.buffer_minutes)
    )
    returning id into v_booking_id;
  exception when exclusion_violation then
    raise exception 'slot_taken';
  end;

  return jsonb_build_object('id', v_booking_id, 'starts_at', p_starts_at);
end;
$$;

revoke execute on function public.get_public_studio(text) from public;
revoke execute on function public.get_available_slots(text, uuid, boolean, integer) from public;
revoke execute on function public.create_booking(text, uuid, boolean, timestamptz, text, text, text, text, boolean, boolean) from public;
grant execute on function public.get_public_studio(text) to anon, authenticated;
grant execute on function public.get_available_slots(text, uuid, boolean, integer) to anon, authenticated;
grant execute on function public.create_booking(text, uuid, boolean, timestamptz, text, text, text, text, boolean, boolean) to anon, authenticated;
