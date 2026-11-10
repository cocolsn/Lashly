-- Vérifie les photos avant/après : stockage privé, chaque pro n'accède qu'à son dossier
-- ({pro_id}/...), et ne rattache des photos qu'à ses propres rendez-vous. Tout est annulé à la fin.
begin;
create temp table r (n int generated always as identity, test text, resultat text) on commit drop;
grant all on r to public;
insert into auth.users (id, email, aud, role) values
  ('44444444-4444-4444-4444-444444444444', 'a@example.invalid', 'authenticated', 'authenticated'),
  ('55555555-5555-5555-5555-555555555555', 'b@example.invalid', 'authenticated', 'authenticated');
insert into public.pros (id, slug, studio_name, city) values
  ('44444444-4444-4444-4444-444444444444', 'test-photo-a', 'Studio A', 'Melun'),
  ('55555555-5555-5555-5555-555555555555', 'test-photo-b', 'Studio B', 'Paris');
insert into public.clients (id, pro_id, full_name, phone, email, consent_at) values
  ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'Emma', '0612345678', 'e@example.invalid', now());
insert into public.bookings (id, pro_id, client_id, service_name, price_cents, starts_at, ends_at, blocked_until)
  values ('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444',
          '66666666-6666-6666-6666-666666666666', 'Pose', 8000, now(), now() + interval '2 hours',
          now() + interval '2 hours 10 minutes');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
do $$ begin
  insert into storage.objects (bucket_id, name)
    values ('lash-photos', '44444444-4444-4444-4444-444444444444/66666666-6666-6666-6666-666666666666/a.jpg');
  insert into r (test, resultat) values ('A envoie une photo dans SON dossier (attendu : autorisé)', 'autorisé');
exception when others then insert into r (test, resultat) values ('A envoie une photo dans SON dossier (attendu : autorisé)', 'REFUSÉ (problème)'); end $$;
do $$ begin
  insert into public.booking_photos (pro_id, booking_id, storage_path, kind)
    values ('44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777',
            '44444444-4444-4444-4444-444444444444/66666666-6666-6666-6666-666666666666/a.jpg', 'before');
  insert into r (test, resultat) values ('A rattache la photo à SON rendez-vous (attendu : autorisé)', 'autorisé');
exception when others then insert into r (test, resultat) values ('A rattache la photo à SON rendez-vous (attendu : autorisé)', 'REFUSÉ (problème)'); end $$;

select set_config('request.jwt.claims', '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}', true);
insert into r (test, resultat)
  select 'B voit les fichiers de A (attendu 0)', count(*)::text from storage.objects where bucket_id = 'lash-photos';
insert into r (test, resultat) select 'B voit les photos de A (attendu 0)', count(*)::text from public.booking_photos;
do $$ begin
  insert into storage.objects (bucket_id, name) values ('lash-photos', '44444444-4444-4444-4444-444444444444/x/b.jpg');
  insert into r (test, resultat) values ('B dépose un fichier dans le dossier de A', 'AUTORISÉ (problème)');
exception when others then insert into r (test, resultat) values ('B dépose un fichier dans le dossier de A', 'refusé'); end $$;
do $$ begin
  insert into public.booking_photos (pro_id, booking_id, storage_path, kind)
    values ('55555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777',
            '55555555-5555-5555-5555-555555555555/z.jpg', 'after');
  insert into r (test, resultat) values ('B rattache une photo au rendez-vous de A', 'AUTORISÉ (problème)');
exception when others then insert into r (test, resultat) values ('B rattache une photo au rendez-vous de A', 'refusé'); end $$;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
insert into r (test, resultat)
  select 'visiteur anonyme voit des photos (attendu 0)', count(*)::text from storage.objects where bucket_id = 'lash-photos';

reset role;
insert into r (test, resultat) select 'stockage public ? (attendu false)', public::text from storage.buckets where id = 'lash-photos';
select test, resultat from r order by n;
rollback;
