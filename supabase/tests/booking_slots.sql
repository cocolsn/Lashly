-- Tests du calcul des créneaux et de l'anti double réservation. Tout est annulé à la fin.
-- À lancer dans « SQL Editor » de Supabase : chaque ligne doit afficher ok = true.
-- Studio de test : ouvert tous les jours 08:00–12:00, pause 10:00–10:30, créneaux toutes les
-- 30 min, prestation de 60 min, 10 min de préparation → un créneau bloque 70 min.
begin;
create temp table t (n int generated always as identity, test text, ok boolean, detail text) on commit drop;
grant all on t to public;

insert into auth.users (id, email, aud, role)
  values ('33333333-3333-3333-3333-333333333333', 'test-slots@example.invalid', 'authenticated', 'authenticated');
insert into public.pros (id, slug, studio_name, city, buffer_minutes, slot_step_minutes)
  values ('33333333-3333-3333-3333-333333333333', 'test-creneaux', 'Studio test', 'Melun', 10, 30);
insert into public.services (id, pro_id, name, duration_min, price_cents, addon_name, addon_price_cents, addon_duration_min)
  values ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Pose', 60, 8000,
          'Teinture', 1500, 30);
insert into public.services (pro_id, name, duration_min, price_cents, active)
  values ('33333333-3333-3333-3333-333333333333', 'Masquée', 60, 1000, false);
insert into public.opening_hours (pro_id, weekday, is_open, start_time, end_time)
  select '33333333-3333-3333-3333-333333333333', d, true, '08:00', '12:00' from generate_series(0, 6) d;
insert into public.opening_breaks (pro_id, weekday, start_time, end_time)
  select '33333333-3333-3333-3333-333333333333', d, '10:00', '10:30' from generate_series(0, 6) d;

-- Demain, heure de Paris.
create temp table ctx on commit drop as
  select ((now() at time zone 'Europe/Paris')::date + 1) as d;
grant all on ctx to public;
create function pg_temp.slots_tomorrow(p_with_addon boolean default false) returns text language sql as $$
  select coalesce(string_agg(to_char(s at time zone 'Europe/Paris', 'HH24:MI'), ',' order by s), '')
  from public.get_available_slots('test-creneaux', 'cccccccc-cccc-cccc-cccc-cccccccccccc', p_with_addon) s
  where (s at time zone 'Europe/Paris')::date = (select d from ctx);
$$;
create function pg_temp.at_tomorrow(p_time time) returns timestamptz language sql as $$
  select ((select d from ctx) + p_time) at time zone 'Europe/Paris';
$$;
create function pg_temp.check(p_test text, p_got text, p_expected text) returns void language sql as $$
  insert into t (test, ok, detail) values (p_test, p_got is not distinct from p_expected, 'obtenu : ' || coalesce(p_got, 'null') || ' / attendu : ' || p_expected);
$$;
create function pg_temp.book(p_time time, p_consent boolean default true, p_reactions text default null,
                             p_health boolean default false, p_email text default 'cliente@example.invalid')
returns text language plpgsql as $$
begin
  perform public.create_booking('test-creneaux', 'cccccccc-cccc-cccc-cccc-cccccccccccc', false, pg_temp.at_tomorrow(p_time),
    'Emma Test', '06 12 34 56 78', p_email, p_reactions, p_consent, p_health);
  return 'ok';
exception when others then return sqlerrm;
end $$;

-- Le public passe par les fonctions, comme une vraie cliente.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select pg_temp.check('studio public : seules les prestations visibles',
  (select string_agg(s->>'name', ',') from jsonb_array_elements(public.get_public_studio('TEST-CRENEAUX')->'services') s), 'Pose');
select pg_temp.check('studio inconnu', public.get_public_studio('nexiste-pas')::text, null);

-- 08:00 et 08:30 tiennent avant la pause ; 09:00 à 10:00 la chevauchent ; 10:30 tient ;
-- 11:00 dépasserait la fermeture (12:10).
select pg_temp.check('créneaux automatiques (pause, fermeture)', pg_temp.slots_tomorrow(), '08:00,08:30,10:30');
-- Avec l'option (+30 min → 100 min bloquées) : seul 08:00… finit à 09:40 avant la pause.
select pg_temp.check('créneaux avec option (+30 min)', pg_temp.slots_tomorrow(true), '08:00');
select pg_temp.check('aucun créneau dans le passé',
  (select count(*)::text from public.get_available_slots('test-creneaux', 'cccccccc-cccc-cccc-cccc-cccccccccccc') s where s <= now()), '0');
select pg_temp.check('horizon limité à 14 jours',
  (select count(*)::text from public.get_available_slots('test-creneaux', 'cccccccc-cccc-cccc-cccc-cccccccccccc', false, 60) s
   where s >= ((now() at time zone 'Europe/Paris')::date + 14) at time zone 'Europe/Paris'), '0');

-- Réservation, puis le créneau disparaît pour la suivante.
select pg_temp.check('sans consentement', pg_temp.book('08:00', false), 'consent_required');
select pg_temp.check('allergies sans consentement santé', pg_temp.book('08:00', true, 'Colle cyanoacrylate'), 'health_consent_required');
select pg_temp.check('email invalide', pg_temp.book('08:00', true, null, false, 'pas-un-email'), 'invalid_email');
select pg_temp.check('heure hors créneaux', pg_temp.book('09:00'), 'slot_unavailable');
select pg_temp.check('réservation 08:00', pg_temp.book('08:00', true, 'Colle cyanoacrylate', true), 'ok');
select pg_temp.check('08:00 et 08:30 ne sont plus proposés', pg_temp.slots_tomorrow(), '10:30');
select pg_temp.check('même créneau une 2e fois', pg_temp.book('08:00', true, null, false, 'autre@example.invalid'), 'slot_unavailable');

-- Le public ne lit toujours rien directement.
do $$ begin
  perform 1 from public.bookings;
  perform pg_temp.check('anonyme lit bookings', 'autorisé', 'refusé');
exception when others then perform pg_temp.check('anonyme lit bookings', 'refusé', 'refusé'); end $$;

reset role;

-- Deux validations simultanées : la 2e insertion directe est bloquée par la contrainte d'exclusion.
do $$ begin
  insert into public.bookings (pro_id, client_id, service_name, price_cents, starts_at, ends_at, blocked_until)
  select '33333333-3333-3333-3333-333333333333', c.id, 'Pose', 8000,
         pg_temp.at_tomorrow('08:30'), pg_temp.at_tomorrow('09:30'), pg_temp.at_tomorrow('09:40')
  from public.clients c where c.pro_id = '33333333-3333-3333-3333-333333333333' limit 1;
  perform pg_temp.check('chevauchement en base (contrainte EXCLUDE)', 'accepté', 'refusé');
exception when exclusion_violation then perform pg_temp.check('chevauchement en base (contrainte EXCLUDE)', 'refusé', 'refusé'); end $$;

select pg_temp.check('fiche : réaction enregistrée avec consentement',
  (select (reactions is not null and health_consent_at is not null)::text from public.client_records
   where pro_id = '33333333-3333-3333-3333-333333333333'), 'true');
select pg_temp.check('prix copié dans le rendez-vous',
  (select price_cents::text from public.bookings where pro_id = '33333333-3333-3333-3333-333333333333'), '8000');

-- Un rendez-vous annulé libère le créneau.
update public.bookings set status = 'cancelled' where pro_id = '33333333-3333-3333-3333-333333333333';
select pg_temp.check('annulation : créneaux rendus', pg_temp.slots_tomorrow(), '08:00,08:30,10:30');

-- Mode « heures fixes » : seulement les heures choisies (les pauses ne s'appliquent pas).
update public.opening_hours set slot_mode = 'fixed', fixed_times = '{10:00,15:00,17:00}'
  where pro_id = '33333333-3333-3333-3333-333333333333';
select pg_temp.check('heures fixes', pg_temp.slots_tomorrow(), '10:00,15:00,17:00');

-- Jour fermé : aucun créneau.
update public.opening_hours set is_open = false where pro_id = '33333333-3333-3333-3333-333333333333';
select pg_temp.check('jour fermé', pg_temp.slots_tomorrow(), '');

-- Intervalle de 15 min en mode automatique.
update public.opening_hours set is_open = true, slot_mode = 'auto' where pro_id = '33333333-3333-3333-3333-333333333333';
update public.pros set slot_step_minutes = 15 where id = '33333333-3333-3333-3333-333333333333';
select pg_temp.check('intervalle de 15 min', pg_temp.slots_tomorrow(), '08:00,08:15,08:30,08:45,10:30,10:45');

select test, ok, detail from t order by n;
rollback;
