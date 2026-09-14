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
