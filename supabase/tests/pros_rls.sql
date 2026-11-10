-- Vérifie l'isolation des profils (RLS). Tout est annulé à la fin (rollback).
-- À lancer dans l'éditeur SQL de Supabase : chaque ligne du résultat doit être « refusé » ou attendue.
begin;
insert into auth.users (id, email, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'test-a@example.invalid', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'test-b@example.invalid', 'authenticated', 'authenticated');
create temp table results (test text, outcome text) on commit drop;
grant all on results to public;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
insert into public.pros (id, slug, studio_name, city)
  values ('11111111-1111-1111-1111-111111111111', 'studio-a', 'Studio A', 'Melun');
do $$ begin
  begin
    insert into public.pros (id, slug, studio_name, city)
      values ('22222222-2222-2222-2222-222222222222', 'studio-b', 'Studio B', 'Paris');
    insert into results values ('A crée un profil pour B', 'AUTORISÉ (problème)');
  exception when others then insert into results values ('A crée un profil pour B', 'refusé'); end;
  begin
    update public.pros set slug = 'connexion' where id = '11111111-1111-1111-1111-111111111111';
    insert into results values ('slug réservé', 'AUTORISÉ (problème)');
  exception when others then insert into results values ('slug réservé', 'refusé'); end;
end $$;

select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
insert into results select 'B voit les profils des autres (attendu : 0)', count(*)::text from public.pros;
do $$ begin
  begin
    insert into public.pros (id, slug, studio_name, city)
      values ('22222222-2222-2222-2222-222222222222', 'studio-a', 'Studio B', 'Paris');
    insert into results values ('B prend le slug de A', 'AUTORISÉ (problème)');
  exception when others then insert into results values ('B prend le slug de A', 'refusé'); end;
end $$;
update public.pros set city = 'Pirate' where id = '11111111-1111-1111-1111-111111111111';

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  begin
    perform 1 from public.pros;
    insert into results values ('visiteur anonyme lit pros', 'AUTORISÉ (problème)');
  exception when others then insert into results values ('visiteur anonyme lit pros', 'refusé'); end;
end $$;

reset role;
insert into results select 'ville de A après modification par B (attendu : Melun)', city
  from public.pros where id = '11111111-1111-1111-1111-111111111111';
select * from results;
rollback;
