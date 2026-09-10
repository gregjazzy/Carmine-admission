alter table carmine_taches
  add column if not exists balle        text check (balle in ('carmine', 'eleve', 'parents', 'etablissement', 'externe')),
  add column if not exists balle_depuis timestamptz,
  add column if not exists attribuee    boolean not null default false,
  add column if not exists mot_balle    text;

update carmine_taches
   set balle = coalesce(balle, owners[1], 'carmine'),
       balle_depuis = coalesce(balle_depuis, created_at),
       attribuee = case when statut in ('fait', 'sans_objet', 'effacee') then true else attribuee end
 where balle is null;

create or replace view carmine_taches_famille as
select t.id, t.student_id, t.origine, t.milestone_id, t.exigence_id, t.universite_id,
       t.type, t.titre, t.consigne, t.owners, t.lock, t.echeance, t.fin_periode, t.apparition,
       case when t.statut = 'a_venir' and t.apparition <= current_date then 'a_faire' else t.statut::text end as statut,
       t.public_note, t.completed_at, t.updated_at,
       t.balle, t.balle_depuis, t.mot_balle
  from carmine_taches t
 where t.statut not in ('effacee')
   and not (t.statut = 'a_venir' and t.apparition > current_date)
   and exists (select 1 from carmine_student_parents sp
                where sp.student_id = t.student_id and sp.profile_id = auth.uid());

grant select on carmine_taches_famille to authenticated;

select balle, count(*) from carmine_taches where statut not in ('effacee') group by balle order by 2 desc;
