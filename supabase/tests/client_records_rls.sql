-- Vérifie les fiches clientes : isolation entre pros, accord obligatoire pour les réactions
-- (donnée de santé), impossibilité de rattacher une fiche à la cliente d'une autre pro.
-- Tout est annulé à la fin (rollback). Suppression vérifiée en lisant pg_policies.
begin;
create temp table r (n int generated always as identity, test text, resultat text) on commit drop;
grant all on r to public;
insert into auth.users (id, email, aud, role) values
  ('44444444-4444-4444-4444-444444444444', 'a@example.invalid', 'authenticated', 'authenticated'),
  ('55555555-5555-5555-5555-555555555555', 'b@example.invalid', 'authenticated', 'authenticated');
insert into public.pros (id, slug, studio_name, city) values
  ('44444444-4444-4444-4444-444444444444', 'test-fiche-a', 'Studio A', 'Melun'),
  ('55555555-5555-5555-5555-555555555555', 'test-fiche-b', 'Studio B', 'Paris');
insert into public.clients (id, pro_id, full_name, phone, email, consent_at) values
  ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'Emma', '0612345678', 'e@example.invalid', now()),
  ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'Léa', '0700000000', 'l@example.invalid', now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
do $$ begin
  insert into public.client_records (pro_id, client_id, curl, length_mm)
    values ('44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'CC', 11.5);
  insert into r (test, resultat) values ('A remplit la fiche de SA cliente (attendu : autorisé)', 'autorisé');
exception when others then insert into r (test, resultat) values ('A remplit la fiche de SA cliente (attendu : autorisé)', 'REFUSÉ (problème)'); end $$;
do $$ begin
  insert into public.client_records (pro_id, client_id, curl)
    values ('44444444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', 'C');
  insert into r (test, resultat) values ('A crée une fiche pour la cliente de B', 'AUTORISÉ (problème)');
exception when others then insert into r (test, resultat) values ('A crée une fiche pour la cliente de B', 'refusé'); end $$;
do $$ begin
  update public.client_records set reactions = 'Rougeurs' where client_id = '66666666-6666-6666-6666-666666666666';
  insert into r (test, resultat) values ('réaction notée sans accord santé', 'AUTORISÉ (problème)');
exception when others then insert into r (test, resultat) values ('réaction notée sans accord santé', 'refusé'); end $$;
do $$ begin
  update public.client_records set client_id = '88888888-8888-8888-8888-888888888888'
    where client_id = '66666666-6666-6666-6666-666666666666';
  insert into r (test, resultat) values ('A rattache sa fiche à la cliente de B', 'AUTORISÉ (problème)');
exception when others then insert into r (test, resultat) values ('A rattache sa fiche à la cliente de B', 'refusé'); end $$;
update public.client_records set reactions = 'Rougeurs', health_consent_at = now()
  where client_id = '66666666-6666-6666-6666-666666666666';
insert into r (test, resultat) select 'réaction notée avec accord (attendu Rougeurs)', coalesce(reactions, 'rien') from public.client_records;
insert into r (test, resultat) select 'A voit les clientes (attendu Emma)', string_agg(full_name, ',') from public.clients;
with u as (update public.clients set phone = '0999999999' where id = '88888888-8888-8888-8888-888888888888' returning 1)
insert into r (test, resultat) select 'A modifie la cliente de B (attendu 0)', count(*)::text from u;

select set_config('request.jwt.claims', '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}', true);
insert into r (test, resultat) select 'B voit la fiche de la cliente de A (attendu 0)', count(*)::text from public.client_records;

reset role;
insert into r (test, resultat)
  select 'règle de suppression clients (attendu : auth.uid() = pro_id)', qual
  from pg_policies where schemaname = 'public' and tablename = 'clients' and cmd = 'DELETE';
select test, resultat from r order by n;
rollback;
