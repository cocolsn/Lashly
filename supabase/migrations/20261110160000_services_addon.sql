-- Option facultative sur une prestation (ex. « + teinture de cils » sur un rehaussement),
-- avec son prix et sa durée en plus. Les trois champs sont tous remplis ou tous vides.

alter table public.services
  add column addon_name text,
  add column addon_price_cents integer,
  add column addon_duration_min integer,
  add constraint services_addon_check check (
    (addon_name is null and addon_price_cents is null and addon_duration_min is null)
    or (
      char_length(btrim(addon_name)) between 2 and 80
      and addon_price_cents between 0 and 100000
      and addon_duration_min between 0 and 120
      and addon_duration_min % 5 = 0
    )
  );
