-- Vérifie l'isolation entre pros (RLS) et les contrôles de la base. Tout est annulé à la fin.
-- À lancer dans « SQL Editor » de Supabase : chaque ligne doit afficher le résultat attendu.
-- Les suppressions sont vérifiées en lisant les règles (pg_policies), sans rien supprimer.
begin;
insert into auth.users (id, email, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'test-a@example.invalid', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'test-b@example.invalid', 'authenticated', 'authenticated');
insert into public.pros (id, slug, studio_name, city) values
  ('11111111-1111-1111-1111-111111111111', 'test-studio-a', 'Studio A', 'Melun'),
  ('22222222-2222-2222-2222-222222222222', 'test-studio-b', 'Studio B', 'Paris');
insert into public.services (id, pro_id, name, duration_min, price_cents) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Pose A', 120, 8000);
insert into public.opening_hours (pro_id, weekday, is_open) values ('11111111-1111-1111-1111-111111111111', 1, true);
insert into public.opening_breaks (pro_id, weekday, start_time, end_time)
  values ('11111111-1111-1111-1111-111111111111', 1, '12:30', '13:30');
create temp table results (n int generated always as identity, test text, outcome text) on commit drop;
grant all on results to public;

-- La pro B essaie de lire et de modifier les données de la pro A.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
insert into results (test, outcome) select 'B voit les prestations de A (attendu 0)', count(*)::text from public.services;
insert into results (test, outcome) select 'B voit les horaires de A (attendu 0)', count(*)::text from public.opening_hours;
insert into results (test, outcome) select 'B voit les pauses de A (attendu 0)', count(*)::text from public.opening_breaks;
insert into results (test, outcome)
  select 'B voit le studio de A (attendu 0)', count(*)::text from public.pros
  where id = '11111111-1111-1111-1111-111111111111';
do $$ begin
  begin
    insert into public.services (pro_id, name, duration_min, price_cents)
      values ('11111111-1111-1111-1111-111111111111', 'Intrus', 60, 100);
    insert into results (test, outcome) values ('B ajoute une prestation chez A', 'AUTORISÉ (problème)');
  exception when others then insert into results (test, outcome) values ('B ajoute une prestation chez A', 'refusé'); end;
  begin
    insert into public.opening_hours (pro_id, weekday, is_open) values ('11111111-1111-1111-1111-111111111111', 2, true);
    insert into results (test, outcome) values ('B ajoute un horaire chez A', 'AUTORISÉ (problème)');
  exception when others then insert into results (test, outcome) values ('B ajoute un horaire chez A', 'refusé'); end;
  begin
    insert into public.opening_breaks (pro_id, weekday, start_time, end_time)
      values ('11111111-1111-1111-1111-111111111111', 1, '16:00', '16:15');
    insert into results (test, outcome) values ('B ajoute une pause chez A', 'AUTORISÉ (problème)');
  exception when others then insert into results (test, outcome) values ('B ajoute une pause chez A', 'refusé'); end;
  begin
    insert into public.services (pro_id, name, duration_min, price_cents)
      values ('22222222-2222-2222-2222-222222222222', 'Trop court', 10, 100);
    insert into results (test, outcome) values ('prestation de 10 min', 'AUTORISÉ (problème)');
  exception when others then insert into results (test, outcome) values ('prestation de 10 min', 'refusé'); end;
  begin
    insert into public.services (pro_id, name, duration_min, price_cents, addon_name)
      values ('22222222-2222-2222-2222-222222222222', 'Option incomplète', 60, 100, 'Teinture');
    insert into results (test, outcome) values ('option sans prix', 'AUTORISÉ (problème)');
  exception when others then insert into results (test, outcome) values ('option sans prix', 'refusé'); end;
  begin
    insert into public.services (pro_id, name, duration_min, price_cents)
      values ('22222222-2222-2222-2222-222222222222', 'Ma pose', 60, 5000);
    insert into results (test, outcome) values ('B ajoute SA prestation (attendu : autorisé)', 'autorisé');
  exception when others then
    insert into results (test, outcome) values ('B ajoute SA prestation (attendu : autorisé)', 'REFUSÉ (problème)');
  end;
end $$;
update public.services set price_cents = 1 where pro_id = '11111111-1111-1111-1111-111111111111';
update public.opening_hours set is_open = false where pro_id = '11111111-1111-1111-1111-111111111111';

-- Un visiteur non connecté n'a accès à rien directement.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ declare t text; begin
  foreach t in array array['pros', 'services', 'opening_hours', 'opening_breaks'] loop
    begin
      execute format('select 1 from public.%I limit 1', t);
      insert into results (test, outcome) values ('visiteur anonyme lit ' || t, 'AUTORISÉ (problème)');
    exception when others then insert into results (test, outcome) values ('visiteur anonyme lit ' || t, 'refusé'); end;
  end loop;
end $$;

reset role;
insert into results (test, outcome)
  select 'prix de A après modification par B (attendu 8000)', price_cents::text
  from public.services where pro_id = '11111111-1111-1111-1111-111111111111';
insert into results (test, outcome)
  select 'lundi de A après modification par B (attendu : ouvert)', case when is_open then 'ouvert' else 'FERMÉ (problème)' end
  from public.opening_hours where pro_id = '11111111-1111-1111-1111-111111111111';
insert into results (test, outcome)
  select 'règle de suppression ' || tablename || ' (attendu : auth.uid() = pro_id)', coalesce(qual, '(aucune condition)')
  from pg_policies where schemaname = 'public' and cmd = 'DELETE';
insert into results (test, outcome)
  select 'droit de suppression sur ' || t || ' (attendu : non)',
    case when has_table_privilege('authenticated', 'public.' || t, 'DELETE') then 'oui' else 'non' end
  from unnest(array['pros', 'opening_hours']) t;
select test, outcome from results order by n;
rollback;
