-- Forme de l'œil (amande, rond, tombant…), pour choisir l'effet de pose.
alter table public.client_records
  add column eye_shape text check (char_length(eye_shape) <= 40);
