-- Correctif : la contrainte services_addon_check laissait passer une option incomplète
-- (ex. nom sans prix), car une comparaison avec NULL rend la condition « inconnue », donc acceptée.
-- On impose explicitement : les trois champs de l'option sont tous remplis ou tous vides.

alter table public.services
  add constraint services_addon_complete check (
    num_nonnulls(addon_name, addon_price_cents, addon_duration_min) in (0, 3)
  );
