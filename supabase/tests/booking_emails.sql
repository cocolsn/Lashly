-- Vérifie les emails (confirmation, rappel la veille, annulation) sans rien envoyer :
-- une fausse clé Resend est créée dans le coffre le temps du test, et tout est annulé à la fin
-- (les requêtes d'envoi en file d'attente disparaissent avec le rollback).
-- À lancer seulement si la clé « resend_api_key » n'est pas encore dans le coffre.
begin;
create temp table r (n int generated always as identity, test text, resultat text) on commit drop;
grant all on r to public;
select vault.create_secret('re_fausse_cle_de_test', 'resend_api_key');

insert into auth.users (id, email, aud, role)
  values ('33333333-3333-3333-3333-333333333333', 'pro.test@example.invalid', 'authenticated', 'authenticated');
insert into public.pros (id, slug, studio_name, city, phone)
  values ('33333333-3333-3333-3333-333333333333', 'test-emails', 'Studio Test', 'Melun', '06 00 00 00 00');
insert into public.services (id, pro_id, name, duration_min, price_cents)
  values ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Pose hybride', 120, 8550);
insert into public.opening_hours (pro_id, weekday, is_open, start_time, end_time)
  select '33333333-3333-3333-3333-333333333333', d, true, '09:00', '18:00' from generate_series(0, 6) d;

create temp table q0 on commit drop as select coalesce(max(id), 0) as id from net.http_request_queue;
create temp view q as
  select id, convert_from(body, 'UTF8')::jsonb as b from net.http_request_queue where id > (select id from q0);

-- Une cliente réserve pour demain en signalant une allergie (donnée de santé).
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select public.create_booking('test-emails', 'cccccccc-cccc-cccc-cccc-cccccccccccc', false,
  (select min(s) from public.get_available_slots('test-emails', 'cccccccc-cccc-cccc-cccc-cccccccccccc') s
   where (s at time zone 'Europe/Paris')::date = (now() at time zone 'Europe/Paris')::date + 1),
  'Chloé Testeuse', '06 11 22 33 44', 'chloe@example.invalid', 'ALLERGIE-SECRETE-COLLE', true, true);
reset role;

insert into r (test, resultat)
  select 'confirmation : destinataire / répondre à (attendu cliente / pro)', (b->'to'->>0) || ' / ' || (b->>'reply_to')
  from q order by id limit 1;
insert into r (test, resultat) select 'confirmation : objet', b->>'subject' from q order by id limit 1;
insert into r (test, resultat) select 'confirmation : texte', b->>'text' from q order by id limit 1;

insert into r (test, resultat) select 'rappels envoyés (attendu 1)', private.send_due_reminders()::text;
insert into r (test, resultat) select 'rappels renvoyés une 2e fois (attendu 0)', private.send_due_reminders()::text;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
update public.bookings set status = 'cancelled' where pro_id = '33333333-3333-3333-3333-333333333333';
reset role;
insert into r (test, resultat)
  select 'annulation : objet | lien', (b->>'subject') || ' | ' || substring(b->>'text' from 'https://\S+')
  from q where b->>'subject' like 'Rendez-vous annulé%';

insert into r (test, resultat) select 'emails au total (attendu 3)', count(*)::text from q;
insert into r (test, resultat)
  select 'allergie présente dans un email (attendu false)', bool_or(b::text like '%ALLERGIE-SECRETE%')::text from q;
select test, resultat from r order by n;
rollback;
