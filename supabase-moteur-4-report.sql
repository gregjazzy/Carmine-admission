update carmine_taches t
   set statut = m.status::text::carmine_tache_statut,
       public_note = coalesce(t.public_note, m.public_note),
       private_note = coalesce(t.private_note, m.private_note)
  from carmine_student_milestones m
 where m.student_id = t.student_id
   and m.milestone_id = t.milestone_id
   and t.origine = 'socle'
   and t.statut = 'a_venir'
   and m.status in ('en_cours', 'fait', 'sans_objet');

select count(*) as taches_reportees from carmine_taches where statut in ('en_cours', 'fait');
