-- Vérifie l'agenda : une pro annule ses rendez-vous, pas ceux d'une autre, et ne peut changer
-- que le statut. Tout est annulé à la fin (rollback).
begin;
create temp table r (n int generated always as identity, test text, resultat text) on commit drop;
grant all on r to public;
insert into auth.users (id, email, aud, role) values
  ('44444444-4444-4444-4444-444444444444', 'a@example.invalid', 'authenticated', 'authenticated'),
  ('55555555-5555-5555-5555-555555555555', 'b@example.invalid', 'authenticated', 'authenticated');
insert into public.pros (id, slug, studio_name, city) values
  ('44444444-4444-4444-4444-444444444444', 'test-agenda-a', 'Studio A', 'Melun'),
  ('55555555-5555-5555-5555-555555555555', 'test-agenda-b', 'Studio B', 'Paris');
insert into public.clients (id, pro_id, full_name, phone, email, consent_at)
  values ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'Emma', '0612345678',
          'e@example.invalid', now());
insert into public.bookings (id, pro_id, client_id, service_name, price_cents, starts_at, ends_at, blocked_until)
  values ('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444',
          '66666666-6666-6666-6666-666666666666', 'Pose', 8000, now() + interval '1 day',
          now() + interval '1 day 2 hours', now() + interval '1 day 2 hours 10 minutes');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}', true);
with u as (update public.bookings set status = 'cancelled' where id = '77777777-7777-7777-7777-777777777777' returning 1)
insert into r (test, resultat) select 'B annule le rendez-vous de A (attendu 0 ligne)', count(*)::text from u;

select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
do $$ begin
  update public.bookings set price_cents = 1 where id = '77777777-7777-7777-7777-777777777777';
  insert into r (test, resultat) values ('A modifie le prix d''un rendez-vous', 'AUTORISÉ (problème)');
exception when others then
  insert into r (test, resultat) values ('A modifie le prix d''un rendez-vous', 'refusé (seul le statut est modifiable)');
end $$;
with u as (
  update public.bookings set status = 'cancelled'
  where id = '77777777-7777-7777-7777-777777777777' and status = 'confirmed' returning 1
)
insert into r (test, resultat) select 'A annule son rendez-vous (attendu 1 ligne)', count(*)::text from u;
insert into r (test, resultat) select 'A lit son agenda avec la cliente (attendu cancelled · Emma)', b.status || ' · ' || c.full_name
  from public.bookings b join public.clients c on c.id = b.client_id;

reset role;
select test, resultat from r order by n;
rollback;
