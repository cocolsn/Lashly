-- Étape 7 : emails aux clientes (confirmation, rappel la veille, annulation), envoyés par la base
-- via Resend. La clé Resend est dans le coffre-fort Supabase (Vault) sous le nom
-- « resend_api_key » : tant qu'elle n'y est pas, aucun email ne part et tout le reste fonctionne.
-- Aucune donnée de santé (réactions, yeux sensibles, lentilles) n'apparaît dans les emails.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- Schéma interne, jamais exposé par l'API publique.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Réglages des emails (adresse d'envoi, adresse du site).
create table private.settings (
  key text primary key,
  value text not null
);
insert into private.settings (key, value) values
  ('email_from', 'Lashly <onboarding@resend.dev>'),
  ('site_url', 'https://lashly-seven.vercel.app');

alter table public.bookings
  add column confirmation_sent_at timestamptz,
  add column reminder_sent_at timestamptz,
  add column cancellation_sent_at timestamptz;

create function private.setting(p_key text) returns text
language sql stable security definer set search_path = ''
as $$ select value from private.settings where key = p_key $$;

create function private.html(p_text text) returns text
language sql immutable set search_path = ''
as $$ select replace(replace(replace(replace(coalesce(p_text, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;') $$;

-- « mardi 12 novembre », « samedi 1er mars » (heure de Paris).
create function private.fr_date(p_ts timestamptz) returns text
language sql stable set search_path = ''
as $$
  select (array['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'])[extract(dow from l)::int + 1]
    || ' ' || case when extract(day from l) = 1 then '1er' else extract(day from l)::int::text end || ' '
    || (array['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre',
              'novembre', 'décembre'])[extract(month from l)::int]
  from (select p_ts at time zone 'Europe/Paris' as l) x
$$;

create function private.fr_time(p_ts timestamptz) returns text
language sql stable set search_path = ''
as $$ select to_char(p_ts at time zone 'Europe/Paris', 'HH24:MI') $$;

-- 8000 → « 80 € », 4550 → « 45,50 € ».
create function private.fr_price(p_cents integer) returns text
language sql immutable set search_path = ''
as $$
  select case when p_cents % 100 = 0 then (p_cents / 100)::text
              else replace(to_char(p_cents / 100.0, 'FM999990.00'), '.', ',') end || ' €'
$$;

-- Envoi d'un email par Resend (asynchrone, après validation de la transaction).
-- Renvoie l'identifiant de la requête, ou null si la clé Resend n'est pas configurée.
create function private.send_email(p_to text, p_reply_to text, p_subject text, p_html text, p_text text)
returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  v_key text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';
  if v_key is null then return null; end if;

  return net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body := jsonb_strip_nulls(jsonb_build_object(
      'from', private.setting('email_from'),
      'to', jsonb_build_array(p_to),
      'reply_to', p_reply_to,
      'subject', p_subject,
      'html', p_html,
      'text', p_text
    ))
  );
end;
$$;

-- Construit et envoie l'email d'un rendez-vous. p_kind : 'confirmation', 'reminder' ou 'cancellation'.
-- Seules les infos pratiques sont utilisées : prénom, prestation, date, prix, studio.
create function private.send_booking_email(p_booking_id uuid, p_kind text)
returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  b record;
  v_first_name text;
  v_when text;
  v_service text;
  v_contact text;
  v_subject text;
  v_intro text;
  v_outro text;
  v_html text;
  v_text text;
begin
  select bk.starts_at, bk.ends_at, bk.service_name, bk.addon_name, bk.price_cents,
         c.full_name, c.email, p.studio_name, p.city, p.phone, p.slug, u.email as pro_email
  into b
  from public.bookings bk
  join public.clients c on c.id = bk.client_id
  join public.pros p on p.id = bk.pro_id
  join auth.users u on u.id = bk.pro_id
  where bk.id = p_booking_id;
  if not found then return null; end if;

  v_first_name := split_part(b.full_name, ' ', 1);
  v_when := private.fr_date(b.starts_at) || ' à ' || private.fr_time(b.starts_at);
  v_service := b.service_name || coalesce(' + ' || b.addon_name, '');
  v_contact := case when b.phone is not null
    then 'contacte ' || b.studio_name || ' au ' || b.phone || ' ou réponds à cet email'
    else 'réponds à cet email' end;

  if p_kind = 'confirmation' then
    v_subject := 'Rendez-vous confirmé · ' || v_when;
    v_intro := 'Ton rendez-vous chez ' || b.studio_name || ' est confirmé.';
    v_outro := 'Un empêchement ? Pour annuler ou déplacer ton rendez-vous, ' || v_contact || '.';
  elsif p_kind = 'reminder' then
    v_subject := 'Rappel : ton rendez-vous demain à ' || private.fr_time(b.starts_at);
    v_intro := 'Petit rappel : tu as rendez-vous demain chez ' || b.studio_name || '.';
    v_outro := 'Pense à venir sans mascara. Un empêchement ? ' || upper(left(v_contact, 1)) || substr(v_contact, 2) || '.';
  elsif p_kind = 'cancellation' then
    v_subject := 'Rendez-vous annulé · ' || v_when;
    v_intro := b.studio_name || ' a dû annuler ton rendez-vous. Désolée pour ce contretemps.';
    v_outro := 'Tu peux choisir un autre créneau ici : ' || private.setting('site_url') || '/' || b.slug;
  else
    raise exception 'unknown_email_kind';
  end if;

  v_text := 'Bonjour ' || v_first_name || ',' || E'\n\n' || v_intro || E'\n\n'
    || 'Prestation : ' || v_service || E'\n'
    || 'Date : ' || v_when || E'\n'
    || 'Prix : ' || private.fr_price(b.price_cents) || E'\n'
    || 'Studio : ' || b.studio_name || ', ' || b.city || E'\n\n'
    || v_outro || E'\n\n' || 'À bientôt,' || E'\n' || b.studio_name;

  v_html :=
    '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f6f5f8;padding:24px;color:#1f1726">'
    || '<div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e6e2ea;border-radius:12px;padding:24px">'
    || '<p style="margin:0 0 4px;font-weight:600;color:#4a1d5c">' || private.html(b.studio_name) || '</p>'
    || '<h1 style="margin:0 0 16px;font-size:20px">' || private.html(v_subject) || '</h1>'
    || '<p>Bonjour ' || private.html(v_first_name) || ',</p>'
    || '<p>' || private.html(v_intro) || '</p>'
    || '<table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f1ecf5;border-radius:8px">'
    || '<tr><td style="padding:10px 12px;color:#6b6475">Prestation</td><td style="padding:10px 12px;font-weight:600">' || private.html(v_service) || '</td></tr>'
    || '<tr><td style="padding:10px 12px;color:#6b6475">Date</td><td style="padding:10px 12px;font-weight:600">' || private.html(v_when) || '</td></tr>'
    || '<tr><td style="padding:10px 12px;color:#6b6475">Prix</td><td style="padding:10px 12px;font-weight:600">' || private.html(private.fr_price(b.price_cents)) || '</td></tr>'
    || '<tr><td style="padding:10px 12px;color:#6b6475">Studio</td><td style="padding:10px 12px;font-weight:600">' || private.html(b.studio_name || ', ' || b.city) || '</td></tr>'
    || '</table>'
    || '<p>' || private.html(v_outro) || '</p>'
    || '<p style="margin-top:24px">À bientôt,<br>' || private.html(b.studio_name) || '</p>'
    || '</div>'
    || '<p style="text-align:center;color:#6b6475;font-size:12px;margin-top:16px">Réservation en ligne avec Lashly</p>'
    || '</div>';

  return private.send_email(b.email, b.pro_email, v_subject, v_html, v_text);
end;
$$;

-- Confirmation dès la réservation.
create function private.on_booking_created() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'confirmed' and private.send_booking_email(new.id, 'confirmation') is not null then
    update public.bookings set confirmation_sent_at = now() where id = new.id;
  end if;
  return null;
end;
$$;

create trigger bookings_send_confirmation
  after insert on public.bookings
  for each row execute function private.on_booking_created();

-- Annulation par la pro : on prévient la cliente (seulement pour un rendez-vous à venir).
create function private.on_booking_cancelled() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'cancelled' and old.status = 'confirmed' and new.starts_at > now()
     and private.send_booking_email(new.id, 'cancellation') is not null then
    update public.bookings set cancellation_sent_at = now() where id = new.id;
  end if;
  return null;
end;
$$;

create trigger bookings_send_cancellation
  after update of status on public.bookings
  for each row execute function private.on_booking_cancelled();

-- Rappels : rendez-vous confirmés de demain (heure de Paris) pas encore rappelés.
create function private.send_due_reminders() returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
  v_tomorrow date := (now() at time zone 'Europe/Paris')::date + 1;
begin
  for v_id in
    select id from public.bookings
    where status = 'confirmed' and reminder_sent_at is null
      and (starts_at at time zone 'Europe/Paris')::date = v_tomorrow
  loop
    if private.send_booking_email(v_id, 'reminder') is not null then
      update public.bookings set reminder_sent_at = now() where id = v_id;
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;

-- Tous les jours à 16:00 UTC (17 h l'hiver, 18 h l'été à Paris).
select cron.schedule('lashly-reminders', '0 16 * * *', $$select private.send_due_reminders()$$);
