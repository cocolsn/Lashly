-- Étape 6 : en modifiant une fiche, une pro ne doit pas pouvoir la rattacher à la cliente
-- d'une autre pro (la règle d'ajout le vérifiait déjà, pas celle de modification).
alter policy "client_records_update_own" on public.client_records
  with check (
    (select auth.uid()) = pro_id
    and exists (select 1 from public.clients c where c.id = client_id and c.pro_id = (select auth.uid()))
  );
