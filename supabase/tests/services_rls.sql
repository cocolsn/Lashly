-- Vérifie l'isolation des prestations (RLS). Tout est annulé à la fin (rollback).
begin;
insert into auth.users (id, email, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'test-a@example.invalid', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'test-b@example.invalid', 'authenticated', 'authenticated');
insert into public.pros (id, slug, studio_name, city) values
  ('11111111-1111-1111-1111-111111111111', 'test-studio-a', 'Studio A', 'Melun'),
  ('22222222-2222-2222-2222-222222222222', 'test-studio-b', 'Studio B', 'Paris');
insert into public.services (id, pro_id, name, duration_min, price_cents) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Pose A', 120, 8000);
create temp table results (test text, outcome text) on commit drop;
grant all on results to public;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
insert into results select 'B voit les prestations de A (attendu : 0)', count(*)::text from public.services;
do $$ begin
  begin
    insert into public.services (pro_id, name, duration_min, price_cents)
      values ('11111111-1111-1111-1111-111111111111', 'Intrus', 60, 100);
    insert into results values ('B ajoute une prestation chez A', 'AUTORISÉ (problème)');
  exception when others then insert into results values ('B ajoute une prestation chez A', 'refusé'); end;
  begin
    insert into public.services (pro_id, name, duration_min, price_cents)
      values ('22222222-2222-2222-2222-222222222222', 'Durée trop courte', 10, 100);
    insert into results values ('durée de 10 min', 'AUTORISÉ (problème)');
  exception when others then insert into results values ('durée de 10 min', 'refusé'); end;
end $$;
update public.services set price_cents = 1 where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
delete from public.services where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  begin
    perform 1 from public.services;
    insert into results values ('visiteur anonyme lit services', 'AUTORISÉ (problème)');
  exception when others then insert into results values ('visiteur anonyme lit services', 'refusé'); end;
end $$;

reset role;
insert into results select 'prix de A après modif/suppression par B (attendu : 8000)', price_cents::text
  from public.services where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select * from results;
rollback;
