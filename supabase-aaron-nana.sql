do $$
declare v uuid;
begin
  select id into v from carmine_students
   where first_name ilike 'Aaron' and last_name ilike 'Nana%' and not archived
   order by created_at desc limit 1;
  if v is null then raise exception 'Dossier Aaron Nana introuvable'; end if;

  insert into carmine_universites (pays, etablissement, cursus, nature, filiere, domaine, source, millesime, consulte_le)
  values ('Royaume-Uni', 'London School of Economics', 'Economics and Data Science', 'offre_type', 'uk', 'lse.ac.uk', 'Site de l’établissement', '2026-27', '2026-09-09')
  on conflict (pays, etablissement, (coalesce(cursus, ''))) do nothing;

  insert into carmine_cibles_eleve (student_id, universite_id, ordre)
  select v, u.id, row_number() over (order by u.pays desc, u.etablissement)
    from carmine_universites u
   where (u.pays = 'US' and u.etablissement in (
           'Massachusetts Institute of Technology', 'Stanford University', 'Harvard University', 'Yale University',
           'Princeton University', 'Columbia University in the City of New York', 'University of Pennsylvania',
           'University of California-Berkeley', 'New York University'))
      or (u.pays = 'Royaume-Uni' and (u.etablissement, coalesce(u.cursus, '')) in (
           ('London School of Economics', 'Economics and Data Science'),
           ('Imperial College London', 'Economics, Finance and Data Science'),
           ('University of Cambridge', 'Economics'),
           ('University of Oxford', 'Economics and Management'),
           ('University College London', 'Economics'),
           ('University of Warwick', 'Economics')))
  on conflict do nothing;

  update carmine_taches set statut = 'fait',
    public_note = coalesce(public_note, 'Compte Common App créé, informations personnelles et rubrique Education complétées, liste saisie.')
   where student_id = v and milestone_id = 'D-01' and statut in ('a_venir', 'a_faire');

  update carmine_taches set statut = 'en_cours',
    public_note = coalesce(public_note, 'Session du 3 octobre 2026 réservée.')
   where student_id = v and milestone_id = 'C-05' and statut in ('a_venir', 'a_faire');

  update carmine_taches set statut = 'en_cours',
    public_note = coalesce(public_note, 'IELTS 7.0 obtenu. Vérifier université par université avant de réserver une nouvelle session.')
   where student_id = v and milestone_id = 'C-11' and statut in ('a_venir', 'a_faire');

  update carmine_taches set statut = 'en_cours',
    public_note = coalesce(public_note, 'Les trois réponses sont rédigées. Relecture à faire.')
   where student_id = v and milestone_id = 'C-15' and statut in ('a_venir', 'a_faire');

  update carmine_taches set statut = 'en_cours',
    private_note = coalesce(private_note, 'Neuf américaines toutes sous 12 % d’admission, six britanniques pour cinq vœux, Oxford et Cambridge ensemble. À arbitrer.')
   where student_id = v and milestone_id = 'D-03' and statut in ('a_venir', 'a_faire');

  insert into carmine_donnees_eleve (student_id, rubrique, donnees) values
  (v, 'profil', '{"lycee":"Lycée Sainte-Croix de Neuilly","classe":"terminale","specialites":["Mathématiques","Physique-Chimie","SES"],"interets":["Economics","Finance","Mathematics","Data Science"],"tests":{"SAT":"session réservée 3 octobre 2026","IELTS":"7.0 obtenu","TMUA":"session réservée 15-16 octobre 2026, préparation en cours"},"source":"État d’avancement remis par l’élève, septembre 2026"}'::jsonb),
  (v, 'activites', '{"entrepreneuriat":["Création de sites internet pour des entreprises","Courtify, projet entrepreneurial dans le basketball","Blue Ocean Competition : top 250 sur 23 000, premier Français"],"finance":["Expérience en gestion de patrimoine","Expérience en comptabilité","HEC Summer Program, Financial Literacy","Imperial Summer Program, Data Science & AI"],"droit":["Expérience chez Auguste Debouzy"],"debat":["Fondateur du club de débat du lycée","HMC Europe, simulation organisée par Harvard"],"sport":["Basketball en compétition à haut niveau","Arbitre départemental de basketball","Judo"],"source":"État d’avancement remis par l’élève, septembre 2026"}'::jsonb)
  on conflict (student_id, rubrique) do update set donnees = excluded.donnees;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents) values
  (v, current_date, 'Note de situation, 9 septembre 2026',
'Prospect, dossier créé, non signé. État d’avancement remis par l’élève lui-même.

Où il en est. Terminale à Sainte-Croix de Neuilly, spécialités maths, physique-chimie, SES. Common App ouverte et remplie hors essais. SAT réservé le 3 octobre. IELTS 7.0. TMUA réservé les 15 et 16 octobre, préparation en cours. Personal Statement rédigé en trois réponses, à relire. Profil entrepreneurial fort : Blue Ocean top 250 sur 23 000, premier Français ; Courtify ; deux programmes d’été HEC et Imperial ; club de débat fondé ; basket en compétition.

Ce qui bloque la liste. Neuf américaines, toutes sous 12 % d’admission, aucune probable : la liste n’a pas de socle. Six programmes britanniques pour cinq vœux UCAS, et Oxford avec Cambridge la même année, ce qui est interdit : deux retraits à décider avant le 15 octobre.

Ce qui presse. Oxbridge et UCAS Oxbridge : 15 octobre 18 h. TMUA le 15-16 octobre, il est inscrit. Tour anticipé américain : 1er novembre, aucune université choisie pour l’anticipé, et les REA (Harvard, Stanford, Yale, Princeton) s’excluent entre elles. Essai principal Common App : rien d’écrit, seule la méthodologie est étudiée. Essais complémentaires : neuf universités, rien d’écrit. Notes prédites et référence UCAS : rien n’indique que Sainte-Croix a été sollicité. Rattachement UCAS à l’établissement : non mentionné.

Questions à lui poser, faits que lui seul a. 1. Maths expertes ou non : conditionne Cambridge Economics et pèse pour Oxford E&M. 2. Qui a été sollicité au lycée pour la référence UCAS et les notes prédites, et pour les deux lettres américaines. 3. Le compte UCAS est-il ouvert et rattaché à Sainte-Croix. 4. Aide financière demandée ou non : change la liste. 5. Bulletins de première et rang. 6. Sa préférence pour l’anticipé, s’il doit en choisir une.

À vérifier et arbitrer par nous, pas à lui demander. L’IELTS 7.0 suffit-il université par université, minima par section compris, avant toute nouvelle session. Quels programmes exigent le TMUA parmi les six. Le choix de l’anticipé et sa forme, contraignante ou non ; les REA s’excluent entre elles. Le retrait Oxford ou Cambridge. Le socle de la liste américaine. Le super-curriculaire en économie, absent du document.

Ce que Carmine fait en premier s’il signe. Arbitrer les deux listes cette semaine ; choisir l’anticipé ; ouvrir l’essai principal ; relire le Personal Statement ; lancer le lycée sur les notes prédites et la référence ; vérifier les exigences de langue et de tests par fiche.',
  false);
end $$;

select 'ok' as resultat;
