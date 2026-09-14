create or replace function carmine_famille_passer_balle(p_tache uuid, p_mot text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid;
  v_balle text;
begin
  select student_id, balle into v_student, v_balle from carmine_taches where id = p_tache;
  if v_student is null then
    raise exception 'Tâche introuvable.';
  end if;
  if not exists (select 1 from carmine_student_parents where student_id = v_student and profile_id = auth.uid()) then
    raise exception 'Cette tâche n''est pas dans votre dossier.';
  end if;
  if coalesce(v_balle, '') not in ('parents', 'eleve') then
    raise exception 'La balle n''est pas chez vous sur cette tâche.';
  end if;
  update carmine_taches
     set balle = 'carmine',
         balle_depuis = now(),
         mot_balle = nullif(trim(coalesce(p_mot, '')), ''),
         statut = case when statut in ('a_venir', 'a_faire') then 'en_cours' else statut end,
         attribuee = true
   where id = p_tache;
end $$;

grant execute on function carmine_famille_passer_balle(uuid, text) to authenticated;

-- La famille peut retirer un fichier qu'elle a déposé elle-même, jamais ceux de Carmine.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'carmine_documents' and policyname = 'retirer son propre document') then
    create policy "retirer son propre document" on carmine_documents
      for delete using (uploaded_by = auth.uid() and exists (
        select 1 from carmine_student_parents sp
        where sp.student_id = carmine_documents.student_id and sp.profile_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'carmine — retirer son propre fichier') then
    create policy "carmine — retirer son propre fichier" on storage.objects
      for delete using (bucket_id = 'carmine-documents' and owner = auth.uid());
  end if;
end $$;
