-- Moteur, lot langue : l'interface est bilingue, les données le deviennent.
-- 1. Libellé anglais des exigences d'université (rempli par la fiche IA, éditable).
alter table carmine_exigences_universite add column if not exists libelle_en text;
-- 2. Titre anglais des tâches d'exigence (recopié du libellé à la génération).
alter table carmine_taches add column if not exists titre_en text;
-- 3. Les guides existent par langue ; les 138 guides actuels sont en français.
alter table carmine_guides add column if not exists langue text not null default 'fr' check (langue in ('fr', 'en'));
alter table carmine_guides drop constraint if exists carmine_guides_cle_audience_key;
alter table carmine_guides add constraint carmine_guides_cle_audience_langue_key unique (cle, audience, langue);
-- 4. La vue famille expose le titre anglais.
create or replace view carmine_taches_famille as
select t.id, t.student_id, t.origine, t.milestone_id, t.exigence_id, t.universite_id,
       t.type, t.titre, t.titre_en, t.consigne, t.owners, t.lock, t.echeance, t.fin_periode, t.apparition,
       case when t.statut = 'a_venir' and t.apparition <= current_date then 'a_faire' else t.statut::text end as statut,
       t.public_note, t.completed_at, t.updated_at,
       t.balle, t.balle_depuis, t.mot_balle
  from carmine_taches t
 where t.statut not in ('effacee')
   and not (t.statut = 'a_venir' and t.apparition > current_date)
   and exists (select 1 from carmine_student_parents sp
                where sp.student_id = t.student_id and sp.profile_id = auth.uid());
grant select on carmine_taches_famille to authenticated;
select count(*) as guides_fr from carmine_guides where langue = 'fr';
