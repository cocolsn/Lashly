-- Index sur les clés étrangères signalées par l'outil de performance de Supabase.
create index bookings_service_id_idx on public.bookings (service_id);
create index client_records_pro_id_idx on public.client_records (pro_id);
