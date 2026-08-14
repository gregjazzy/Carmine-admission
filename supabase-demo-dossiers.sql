-- ═══════════════════════════════════════════════════════════════════════════
--  Dossiers de démonstration — trente élèves fictifs :
--  vingt aboutis, avec l'établissement intégré, et dix en cours.
--
--  À exécuter dans l'éditeur SQL de Supabase. Le fichier commence par effacer
--  ce qu'une exécution précédente aurait laissé : le relancer repart d'une
--  table propre plutôt que d'empiler des doublons.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Colonne requise ───────────────────────────────────────────────────────
-- L'établissement intégré : rien ne le stockait, il se noyait dans le texte
-- d'un compte rendu alors que c'est le résultat du travail. C'est aussi lui
-- qui distingue un dossier clos d'un dossier en cours.
alter table carmine_students add column if not exists admission text;

-- ── Remise à plat ─────────────────────────────────────────────────────────
-- Chaque dossier est nommé : aucun autre ne peut partir.
delete from carmine_students where (first_name, last_name) in (
  ('Adam', 'Lefebvre'),
  ('Alice', 'Guérin'),
  ('Marius', 'Tessier'),
  ('Éva', 'Barbier'),
  ('Nina', 'Charpentier'),
  ('Basile', 'Rolland'),
  ('Yasmine', 'Bouchard'),
  ('Théo', 'Marchand'),
  ('Léa', 'Bertrand'),
  ('Adrien', 'Vasseur'),
  ('Louise', 'Mercier'),
  ('Antoine', 'Delaunay'),
  ('Sarah', 'Amrani'),
  ('Victor', 'Poirier'),
  ('Emma', 'Rossi'),
  ('Inès', 'Chevalier'),
  ('Nathan', 'Roussel'),
  ('Camille', 'Fontaine'),
  ('Clara', 'Perrin'),
  ('Hugo', 'Lemoine'),
  ('Manon', 'Girard'),
  ('Sacha', 'Nguyen'),
  ('Malik', 'Dupuis'),
  ('Anaïs', 'Leroy'),
  ('Raphaël', 'Moreau'),
  ('Jade', 'Colin'),
  ('Noah', 'Faure'),
  ('Lina', 'Benali'),
  ('Gabriel', 'Renard'),
  ('Zoé', 'Aubert')
);
delete from carmine_students where lower(last_name) = 'llech';

-- Les établissements ajoutés plus bas le sont une fois pour toutes.
delete from carmine_universites
 where etablissement in ('University of Cambridge', 'University of Warwick', 'University College London', 'King''s College London', 'EPFL', 'Università Bocconi', 'University of Sydney', 'Lycée Stanislas', 'Lycée Sainte-Geneviève') and millesime = '2026-27';

-- ── Établissements absents du référentiel ─────────────────────────────────
-- Dix établissements que le référentiel américain ne couvre pas.
insert into carmine_universites
  (pays, etablissement, cursus, nature, taux_admission, offre_type, seuil_points,
   eligibilite, source, millesime, consulte_le)
values
  ('Royaume-Uni', 'University of Cambridge', 'Natural Sciences', 'offre_type', 0.16, 'A*A*A, dont Mathématiques et Physique — ou 18/20 de moyenne au baccalauréat français avec mentions', null, 'Entretien exigé. Candidature exclusive avec Oxford.', 'Site de l''établissement', '2026-27', '2026-08-13'),
  ('Royaume-Uni', 'University of Warwick', 'Mathematics', 'offre_type', 0.21, 'A*A*A dont Mathématiques — ou 16/20 de moyenne au baccalauréat français', null, null, 'Site de l''établissement', '2026-27', '2026-08-13'),
  ('Royaume-Uni', 'University College London', 'Economics', 'offre_type', 0.24, 'A*A*A dont Mathématiques — ou 17/20 de moyenne au baccalauréat français', null, null, 'Site de l''établissement', '2026-27', '2026-08-13'),
  ('Royaume-Uni', 'King''s College London', 'Liberal Arts', 'offre_type', 0.31, 'AAA — ou 15/20 de moyenne au baccalauréat français', null, null, 'Site de l''établissement', '2026-27', '2026-08-13'),
  ('Suisse', 'EPFL', 'Section de mathématiques', 'eligibilite', null, null, 14.0, 'Baccalauréat français avec mention bien et spécialités Mathématiques et Physique-Chimie : admission sans examen. En deçà, examen d''admission.', 'Site de l''établissement', '2026-27', '2026-08-13'),
  ('Suisse', 'EPFL', 'Génie mécanique', 'eligibilite', null, null, 14.0, 'Mêmes conditions que les autres sections : mention bien et spécialités scientifiques conservées en terminale.', 'Site de l''établissement', '2026-27', '2026-08-13'),
  ('Italie', 'Università Bocconi', 'International Economics and Finance', 'seuil_points', 0.42, null, 78.0, 'Test SAT ou test maison Bocconi, plus dossier scolaire. Candidature par vagues, la première étant la plus favorable.', 'Site de l''établissement', '2026-27', '2026-08-13'),
  ('Australie', 'University of Sydney', 'Bachelor of Science', 'seuil_points', 0.3, null, 85.0, 'Équivalence ATAR calculée à partir de la moyenne du baccalauréat français.', 'Site de l''établissement', '2026-27', '2026-08-13'),
  ('France', 'Lycée Stanislas', 'CPGE MPSI', 'eligibilite', 0.12, null, null, 'Parcoursup. Bulletins de première et de terminale, spécialités Mathématiques et Physique-Chimie conservées, avis du conseil de classe.', 'Site de l''établissement', '2026-27', '2026-08-13'),
  ('France', 'Lycée Sainte-Geneviève', 'CPGE MP', 'eligibilite', 0.09, null, null, 'Parcoursup. Dossier scolaire exigeant sur les trois trimestres de première et les deux premiers de terminale.', 'Site de l''établissement', '2026-27', '2026-08-13');

-- ── Les dossiers, leur calendrier, leurs cibles et leurs comptes rendus
do $$
declare
  v_student uuid;
begin

  -- Adam Lefebvre — quatrieme, uk, us
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Adam', 'Lefebvre', 'cinquieme', 'quatrieme', 2030, array['uk','us']::carmine_track[], 'Lycée Jeanine-Manuel', 'Paris', null)
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2027-09-15', 'a_faire'),
    (v_student, 'A-02', '2027-10-01', 'a_faire'),
    (v_student, 'A-03', '2028-02-15', 'a_faire'),
    (v_student, 'A-04', '2027-10-15', 'a_faire'),
    (v_student, 'A-05', '2028-06-15', 'a_faire'),
    (v_student, 'A-06', '2027-09-05', 'a_faire'),
    (v_student, 'B-01', '2029-02-20', 'a_faire'),
    (v_student, 'B-02', '2028-10-10', 'a_faire'),
    (v_student, 'B-03', '2029-01-15', 'a_faire'),
    (v_student, 'B-04', '2029-04-15', 'a_faire'),
    (v_student, 'B-05', '2029-01-20', 'a_faire'),
    (v_student, 'B-06', '2029-06-20', 'a_faire'),
    (v_student, 'C-01', '2029-09-25', 'a_faire'),
    (v_student, 'C-02', '2029-10-10', 'a_faire'),
    (v_student, 'C-03', '2029-11-15', 'a_faire'),
    (v_student, 'C-04', '2029-12-05', 'a_faire'),
    (v_student, 'C-05', '2030-03-15', 'a_faire'),
    (v_student, 'C-06', '2030-02-15', 'a_faire'),
    (v_student, 'C-07', '2030-03-20', 'a_faire'),
    (v_student, 'C-08', '2030-04-15', 'a_faire'),
    (v_student, 'C-09', '2030-06-15', 'a_faire'),
    (v_student, 'C-10', '2030-04-01', 'a_faire'),
    (v_student, 'C-11', '2030-06-25', 'a_faire'),
    (v_student, 'C-12', '2030-06-05', 'a_faire'),
    (v_student, 'C-13', '2030-09-15', 'a_faire'),
    (v_student, 'C-14', '2030-07-05', 'a_faire'),
    (v_student, 'C-15', '2030-07-10', 'a_faire'),
    (v_student, 'C-16', '2030-07-10', 'a_faire'),
    (v_student, 'C-17', '2030-08-10', 'a_faire'),
    (v_student, 'C-18', '2030-07-05', 'a_faire'),
    (v_student, 'D-01', '2030-08-01', 'a_faire'),
    (v_student, 'D-02', '2030-09-05', 'a_faire'),
    (v_student, 'D-03', '2030-09-15', 'a_faire'),
    (v_student, 'D-04', '2030-09-20', 'a_faire'),
    (v_student, 'D-05', '2030-09-10', 'a_faire'),
    (v_student, 'D-06', '2030-10-01', 'a_faire'),
    (v_student, 'D-07', '2030-10-15', 'a_faire'),
    (v_student, 'D-08', '2030-10-15', 'a_faire'),
    (v_student, 'D-09', '2030-10-22', 'a_faire'),
    (v_student, 'D-10', '2030-10-24', 'a_faire'),
    (v_student, 'D-11', '2030-11-05', 'a_faire'),
    (v_student, 'D-12', '2030-11-01', 'a_faire'),
    (v_student, 'D-13', '2030-11-30', 'a_faire'),
    (v_student, 'D-14', '2030-11-15', 'a_faire'),
    (v_student, 'D-15', '2030-11-10', 'a_faire'),
    (v_student, 'D-16', '2030-12-05', 'a_faire'),
    (v_student, 'D-17', '2030-12-01', 'a_faire'),
    (v_student, 'D-18', '2030-12-15', 'a_faire'),
    (v_student, 'D-19', '2031-01-01', 'a_faire'),
    (v_student, 'D-20', '2031-01-13', 'a_faire'),
    (v_student, 'D-23', '2031-01-31', 'a_faire'),
    (v_student, 'D-25', '2031-02-10', 'a_faire'),
    (v_student, 'D-26', '2031-02-20', 'a_faire'),
    (v_student, 'D-28', '2031-03-28', 'a_faire'),
    (v_student, 'D-29', '2031-04-10', 'a_faire'),
    (v_student, 'D-30', '2031-05-01', 'a_faire'),
    (v_student, 'D-31', '2031-05-20', 'a_faire'),
    (v_student, 'D-33', '2031-06-15', 'a_faire'),
    (v_student, 'D-34', '2031-07-05', 'a_faire'),
    (v_student, 'E-01', '2031-05-25', 'a_faire'),
    (v_student, 'E-02', '2031-05-30', 'a_faire'),
    (v_student, 'E-03', '2031-06-10', 'a_faire'),
    (v_student, 'E-04', '2031-06-01', 'a_faire'),
    (v_student, 'E-05', '2031-07-15', 'a_faire'),
    (v_student, 'E-06', '2031-08-05', 'a_faire'),
    (v_student, 'E-07', '2031-09-30', 'a_faire');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'ambitieuse' from carmine_universites
   where etablissement = 'University of Cambridge' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 18, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 38, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);

  -- Alice Guérin — troisieme, uk
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Alice', 'Guérin', 'quatrieme', 'troisieme', 2029, array['uk']::carmine_track[], 'Lycée français de Londres', 'Londres', null)
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2026-09-15', 'en_cours'),
    (v_student, 'A-02', '2026-10-01', 'a_faire'),
    (v_student, 'A-03', '2027-02-15', 'a_faire'),
    (v_student, 'A-04', '2026-10-15', 'a_faire'),
    (v_student, 'B-01', '2028-02-20', 'a_faire'),
    (v_student, 'B-02', '2027-10-10', 'a_faire'),
    (v_student, 'B-03', '2028-01-15', 'a_faire'),
    (v_student, 'B-05', '2028-01-20', 'a_faire'),
    (v_student, 'B-06', '2028-06-20', 'a_faire'),
    (v_student, 'C-01', '2028-09-25', 'a_faire'),
    (v_student, 'C-02', '2028-10-10', 'a_faire'),
    (v_student, 'C-03', '2028-11-15', 'a_faire'),
    (v_student, 'C-06', '2029-02-15', 'a_faire'),
    (v_student, 'C-07', '2029-03-20', 'a_faire'),
    (v_student, 'C-09', '2029-06-15', 'a_faire'),
    (v_student, 'C-11', '2029-06-25', 'a_faire'),
    (v_student, 'C-13', '2029-09-15', 'a_faire'),
    (v_student, 'C-14', '2029-07-05', 'a_faire'),
    (v_student, 'C-15', '2029-07-10', 'a_faire'),
    (v_student, 'C-18', '2029-07-05', 'a_faire'),
    (v_student, 'D-02', '2029-09-05', 'a_faire'),
    (v_student, 'D-03', '2029-09-15', 'a_faire'),
    (v_student, 'D-06', '2029-10-01', 'a_faire'),
    (v_student, 'D-08', '2029-10-15', 'a_faire'),
    (v_student, 'D-09', '2029-10-22', 'a_faire'),
    (v_student, 'D-10', '2029-10-24', 'a_faire'),
    (v_student, 'D-11', '2029-11-05', 'a_faire'),
    (v_student, 'D-14', '2029-11-15', 'a_faire'),
    (v_student, 'D-15', '2029-11-10', 'a_faire'),
    (v_student, 'D-16', '2029-12-05', 'a_faire'),
    (v_student, 'D-20', '2030-01-13', 'a_faire'),
    (v_student, 'D-31', '2030-05-20', 'a_faire'),
    (v_student, 'D-33', '2030-06-15', 'a_faire'),
    (v_student, 'D-34', '2030-07-05', 'a_faire'),
    (v_student, 'E-01', '2030-05-25', 'a_faire'),
    (v_student, 'E-02', '2030-05-30', 'a_faire'),
    (v_student, 'E-03', '2030-06-10', 'a_faire'),
    (v_student, 'E-04', '2030-06-01', 'a_faire'),
    (v_student, 'E-05', '2030-07-15', 'a_faire'),
    (v_student, 'E-07', '2030-09-30', 'a_faire');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'King''s College London' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 19, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 44, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 57, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Marius Tessier — troisieme, eu
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Marius', 'Tessier', 'quatrieme', 'troisieme', 2029, array['eu']::carmine_track[], 'Lycée Saint-Louis-de-Gonzague', 'Paris', null)
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2026-09-15', 'a_faire'),
    (v_student, 'A-02', '2026-10-01', 'a_faire'),
    (v_student, 'A-03', '2027-02-15', 'a_faire'),
    (v_student, 'A-04', '2026-10-15', 'a_faire'),
    (v_student, 'B-01', '2028-02-20', 'a_faire'),
    (v_student, 'B-06', '2028-06-20', 'a_faire'),
    (v_student, 'C-01', '2028-09-25', 'a_faire'),
    (v_student, 'C-06', '2029-02-15', 'a_faire'),
    (v_student, 'C-07', '2029-03-20', 'a_faire'),
    (v_student, 'C-11', '2029-06-25', 'a_faire'),
    (v_student, 'C-18', '2029-07-05', 'a_faire'),
    (v_student, 'D-03', '2029-09-15', 'a_faire'),
    (v_student, 'D-14', '2029-11-15', 'a_faire'),
    (v_student, 'D-21', '2030-01-15', 'a_faire'),
    (v_student, 'D-22', '2030-01-20', 'a_faire'),
    (v_student, 'D-24', '2030-02-01', 'a_faire'),
    (v_student, 'D-27', '2030-04-25', 'a_faire'),
    (v_student, 'D-32', '2030-05-01', 'a_faire'),
    (v_student, 'D-33', '2030-06-15', 'a_faire'),
    (v_student, 'E-03', '2030-06-10', 'a_faire'),
    (v_student, 'E-04', '2030-06-01', 'a_faire'),
    (v_student, 'E-05', '2030-07-15', 'a_faire'),
    (v_student, 'E-07', '2030-09-30', 'a_faire');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'plausible' from carmine_universites
   where etablissement = 'Lycée Stanislas' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 18, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 40, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 57, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Éva Barbier — seconde, uk, eu
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Éva', 'Barbier', 'troisieme', 'seconde', 2028, array['uk','eu']::carmine_track[], 'Lycée français de Bruxelles', 'Bruxelles', null)
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2025-09-15', 'fait'),
    (v_student, 'A-02', '2025-10-01', 'fait'),
    (v_student, 'A-03', '2026-02-15', 'fait'),
    (v_student, 'A-04', '2025-10-15', 'fait'),
    (v_student, 'B-01', '2027-02-20', 'a_faire'),
    (v_student, 'B-02', '2026-10-10', 'a_faire'),
    (v_student, 'B-03', '2027-01-15', 'a_faire'),
    (v_student, 'B-05', '2027-01-20', 'a_faire'),
    (v_student, 'B-06', '2027-06-20', 'a_faire'),
    (v_student, 'C-01', '2027-09-25', 'a_faire'),
    (v_student, 'C-02', '2027-10-10', 'a_faire'),
    (v_student, 'C-03', '2027-11-15', 'a_faire'),
    (v_student, 'C-06', '2028-02-15', 'a_faire'),
    (v_student, 'C-07', '2028-03-20', 'a_faire'),
    (v_student, 'C-09', '2028-06-15', 'a_faire'),
    (v_student, 'C-11', '2028-06-25', 'a_faire'),
    (v_student, 'C-13', '2028-09-15', 'a_faire'),
    (v_student, 'C-14', '2028-07-05', 'a_faire'),
    (v_student, 'C-15', '2028-07-10', 'a_faire'),
    (v_student, 'C-18', '2028-07-05', 'a_faire'),
    (v_student, 'D-02', '2028-09-05', 'a_faire'),
    (v_student, 'D-03', '2028-09-15', 'a_faire'),
    (v_student, 'D-06', '2028-10-01', 'a_faire'),
    (v_student, 'D-08', '2028-10-15', 'a_faire'),
    (v_student, 'D-09', '2028-10-22', 'a_faire'),
    (v_student, 'D-10', '2028-10-24', 'a_faire'),
    (v_student, 'D-11', '2028-11-05', 'a_faire'),
    (v_student, 'D-14', '2028-11-15', 'a_faire'),
    (v_student, 'D-15', '2028-11-10', 'a_faire'),
    (v_student, 'D-16', '2028-12-05', 'a_faire'),
    (v_student, 'D-20', '2029-01-13', 'a_faire'),
    (v_student, 'D-21', '2029-01-15', 'a_faire'),
    (v_student, 'D-22', '2029-01-20', 'a_faire'),
    (v_student, 'D-24', '2029-02-01', 'a_faire'),
    (v_student, 'D-27', '2029-04-25', 'a_faire'),
    (v_student, 'D-31', '2029-05-20', 'a_faire'),
    (v_student, 'D-32', '2029-05-01', 'a_faire'),
    (v_student, 'D-33', '2029-06-15', 'a_faire'),
    (v_student, 'D-34', '2029-07-05', 'a_faire'),
    (v_student, 'E-01', '2029-05-25', 'a_faire'),
    (v_student, 'E-02', '2029-05-30', 'a_faire'),
    (v_student, 'E-03', '2029-06-10', 'a_faire'),
    (v_student, 'E-04', '2029-06-01', 'a_faire'),
    (v_student, 'E-05', '2029-07-15', 'a_faire'),
    (v_student, 'E-07', '2029-09-30', 'a_faire');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'University of Cambridge' limit 1;
  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'plausible' from carmine_universites
   where etablissement = 'EPFL' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 24, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Nina Charpentier — seconde, us
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Nina', 'Charpentier', 'troisieme', 'seconde', 2028, array['us']::carmine_track[], 'Lycée français de Dubaï', 'Dubaï', null)
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2025-09-15', 'fait'),
    (v_student, 'A-02', '2025-10-01', 'fait'),
    (v_student, 'A-03', '2026-02-15', 'fait'),
    (v_student, 'A-04', '2025-10-15', 'fait'),
    (v_student, 'A-05', '2026-06-15', 'fait'),
    (v_student, 'A-06', '2025-09-05', 'fait'),
    (v_student, 'B-01', '2027-02-20', 'a_faire'),
    (v_student, 'B-02', '2026-10-10', 'a_faire'),
    (v_student, 'B-03', '2027-01-15', 'a_faire'),
    (v_student, 'B-04', '2027-04-15', 'a_faire'),
    (v_student, 'B-05', '2027-01-20', 'a_faire'),
    (v_student, 'B-06', '2027-06-20', 'a_faire'),
    (v_student, 'C-01', '2027-09-25', 'a_faire'),
    (v_student, 'C-03', '2027-11-15', 'a_faire'),
    (v_student, 'C-04', '2027-12-05', 'a_faire'),
    (v_student, 'C-05', '2028-03-15', 'a_faire'),
    (v_student, 'C-06', '2028-02-15', 'a_faire'),
    (v_student, 'C-07', '2028-03-20', 'a_faire'),
    (v_student, 'C-08', '2028-04-15', 'a_faire'),
    (v_student, 'C-09', '2028-06-15', 'a_faire'),
    (v_student, 'C-10', '2028-04-01', 'a_faire'),
    (v_student, 'C-12', '2028-06-05', 'a_faire'),
    (v_student, 'C-16', '2028-07-10', 'a_faire'),
    (v_student, 'C-17', '2028-08-10', 'a_faire'),
    (v_student, 'C-18', '2028-07-05', 'a_faire'),
    (v_student, 'D-01', '2028-08-01', 'a_faire'),
    (v_student, 'D-03', '2028-09-15', 'a_faire'),
    (v_student, 'D-04', '2028-09-20', 'a_faire'),
    (v_student, 'D-05', '2028-09-10', 'a_faire'),
    (v_student, 'D-07', '2028-10-15', 'a_faire'),
    (v_student, 'D-12', '2028-11-01', 'a_faire'),
    (v_student, 'D-13', '2028-11-30', 'a_faire'),
    (v_student, 'D-14', '2028-11-15', 'a_faire'),
    (v_student, 'D-17', '2028-12-01', 'a_faire'),
    (v_student, 'D-18', '2028-12-15', 'a_faire'),
    (v_student, 'D-19', '2029-01-01', 'a_faire'),
    (v_student, 'D-23', '2029-01-31', 'a_faire'),
    (v_student, 'D-25', '2029-02-10', 'a_faire'),
    (v_student, 'D-26', '2029-02-20', 'a_faire'),
    (v_student, 'D-28', '2029-03-28', 'a_faire'),
    (v_student, 'D-29', '2029-04-10', 'a_faire'),
    (v_student, 'D-30', '2029-05-01', 'a_faire'),
    (v_student, 'D-33', '2029-06-15', 'a_faire'),
    (v_student, 'E-01', '2029-05-25', 'a_faire'),
    (v_student, 'E-03', '2029-06-10', 'a_faire'),
    (v_student, 'E-04', '2029-06-01', 'a_faire'),
    (v_student, 'E-05', '2029-07-15', 'a_faire'),
    (v_student, 'E-06', '2029-08-05', 'a_faire'),
    (v_student, 'E-07', '2029-09-30', 'a_faire');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'plausible' from carmine_universites
   where etablissement = 'Brown University' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 20, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 41, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Basile Rolland — seconde, eu
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Basile', 'Rolland', 'troisieme', 'seconde', 2028, array['eu']::carmine_track[], 'Lycée Henri-IV', 'Paris', null)
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2025-09-15', 'fait'),
    (v_student, 'A-02', '2025-10-01', 'fait'),
    (v_student, 'A-03', '2026-02-15', 'fait'),
    (v_student, 'A-04', '2025-10-15', 'fait'),
    (v_student, 'B-01', '2027-02-20', 'a_faire'),
    (v_student, 'B-06', '2027-06-20', 'a_faire'),
    (v_student, 'C-01', '2027-09-25', 'a_faire'),
    (v_student, 'C-06', '2028-02-15', 'a_faire'),
    (v_student, 'C-07', '2028-03-20', 'a_faire'),
    (v_student, 'C-11', '2028-06-25', 'a_faire'),
    (v_student, 'C-18', '2028-07-05', 'a_faire'),
    (v_student, 'D-03', '2028-09-15', 'a_faire'),
    (v_student, 'D-14', '2028-11-15', 'a_faire'),
    (v_student, 'D-21', '2029-01-15', 'a_faire'),
    (v_student, 'D-22', '2029-01-20', 'a_faire'),
    (v_student, 'D-24', '2029-02-01', 'a_faire'),
    (v_student, 'D-27', '2029-04-25', 'a_faire'),
    (v_student, 'D-32', '2029-05-01', 'a_faire'),
    (v_student, 'D-33', '2029-06-15', 'a_faire'),
    (v_student, 'E-03', '2029-06-10', 'a_faire'),
    (v_student, 'E-04', '2029-06-01', 'a_faire'),
    (v_student, 'E-05', '2029-07-15', 'a_faire'),
    (v_student, 'E-07', '2029-09-30', 'a_faire');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'plausible' from carmine_universites
   where etablissement = 'EPFL' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 18, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);

  -- Yasmine Bouchard — premiere, uk, us
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Yasmine', 'Bouchard', 'seconde', 'premiere', 2027, array['uk','us']::carmine_track[], 'Lycée international de Ferney', 'Ferney-Voltaire', null)
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2024-09-15', 'sans_objet'),
    (v_student, 'A-02', '2024-10-01', 'sans_objet'),
    (v_student, 'A-03', '2025-02-15', 'sans_objet'),
    (v_student, 'A-04', '2024-10-15', 'sans_objet'),
    (v_student, 'A-05', '2025-06-15', 'sans_objet'),
    (v_student, 'A-06', '2024-09-05', 'sans_objet'),
    (v_student, 'B-01', '2026-02-20', 'fait'),
    (v_student, 'B-02', '2025-10-10', 'fait'),
    (v_student, 'B-03', '2026-01-15', 'fait'),
    (v_student, 'B-04', '2026-04-15', 'fait'),
    (v_student, 'B-05', '2026-01-20', 'fait'),
    (v_student, 'B-06', '2026-06-20', 'fait'),
    (v_student, 'C-01', '2026-09-25', 'a_faire'),
    (v_student, 'C-02', '2026-10-10', 'a_faire'),
    (v_student, 'C-03', '2026-11-15', 'a_faire'),
    (v_student, 'C-04', '2026-12-05', 'a_faire'),
    (v_student, 'C-05', '2027-03-15', 'a_faire'),
    (v_student, 'C-06', '2027-02-15', 'a_faire'),
    (v_student, 'C-07', '2027-03-20', 'a_faire'),
    (v_student, 'C-08', '2027-04-15', 'a_faire'),
    (v_student, 'C-09', '2027-06-15', 'a_faire'),
    (v_student, 'C-10', '2027-04-01', 'a_faire'),
    (v_student, 'C-11', '2027-06-25', 'a_faire'),
    (v_student, 'C-12', '2027-06-05', 'a_faire'),
    (v_student, 'C-13', '2027-09-15', 'a_faire'),
    (v_student, 'C-14', '2027-07-05', 'a_faire'),
    (v_student, 'C-15', '2027-07-10', 'a_faire'),
    (v_student, 'C-16', '2027-07-10', 'a_faire'),
    (v_student, 'C-17', '2027-08-10', 'a_faire'),
    (v_student, 'C-18', '2027-07-05', 'a_faire'),
    (v_student, 'D-01', '2027-08-01', 'a_faire'),
    (v_student, 'D-02', '2027-09-05', 'a_faire'),
    (v_student, 'D-03', '2027-09-15', 'a_faire'),
    (v_student, 'D-04', '2027-09-20', 'a_faire'),
    (v_student, 'D-05', '2027-09-10', 'a_faire'),
    (v_student, 'D-06', '2027-10-01', 'a_faire'),
    (v_student, 'D-07', '2027-10-15', 'a_faire'),
    (v_student, 'D-08', '2027-10-15', 'a_faire'),
    (v_student, 'D-09', '2027-10-22', 'a_faire'),
    (v_student, 'D-10', '2027-10-24', 'a_faire'),
    (v_student, 'D-11', '2027-11-05', 'a_faire'),
    (v_student, 'D-12', '2027-11-01', 'a_faire'),
    (v_student, 'D-13', '2027-11-30', 'a_faire'),
    (v_student, 'D-14', '2027-11-15', 'a_faire'),
    (v_student, 'D-15', '2027-11-10', 'a_faire'),
    (v_student, 'D-16', '2027-12-05', 'a_faire'),
    (v_student, 'D-17', '2027-12-01', 'a_faire'),
    (v_student, 'D-18', '2027-12-15', 'a_faire'),
    (v_student, 'D-19', '2028-01-01', 'a_faire'),
    (v_student, 'D-20', '2028-01-13', 'a_faire'),
    (v_student, 'D-23', '2028-01-31', 'a_faire'),
    (v_student, 'D-25', '2028-02-10', 'a_faire'),
    (v_student, 'D-26', '2028-02-20', 'a_faire'),
    (v_student, 'D-28', '2028-03-28', 'a_faire'),
    (v_student, 'D-29', '2028-04-10', 'a_faire'),
    (v_student, 'D-30', '2028-05-01', 'a_faire'),
    (v_student, 'D-31', '2028-05-20', 'a_faire'),
    (v_student, 'D-33', '2028-06-15', 'a_faire'),
    (v_student, 'D-34', '2028-07-05', 'a_faire'),
    (v_student, 'E-01', '2028-05-25', 'a_faire'),
    (v_student, 'E-02', '2028-05-30', 'a_faire'),
    (v_student, 'E-03', '2028-06-10', 'a_faire'),
    (v_student, 'E-04', '2028-06-01', 'a_faire'),
    (v_student, 'E-05', '2028-07-15', 'a_faire'),
    (v_student, 'E-06', '2028-08-05', 'a_faire'),
    (v_student, 'E-07', '2028-09-30', 'a_faire');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'University College London' limit 1;
  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'plausible' from carmine_universites
   where etablissement = 'Brown University' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 22, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 41, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Théo Marchand — premiere, eu
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Théo', 'Marchand', 'seconde', 'premiere', 2027, array['eu']::carmine_track[], 'Lycée Louis-le-Grand', 'Paris', null)
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2024-09-15', 'sans_objet'),
    (v_student, 'A-02', '2024-10-01', 'sans_objet'),
    (v_student, 'A-03', '2025-02-15', 'sans_objet'),
    (v_student, 'A-04', '2024-10-15', 'sans_objet'),
    (v_student, 'B-01', '2026-02-20', 'fait'),
    (v_student, 'B-06', '2026-06-20', 'fait'),
    (v_student, 'C-01', '2026-09-25', 'a_faire'),
    (v_student, 'C-06', '2027-02-15', 'a_faire'),
    (v_student, 'C-07', '2027-03-20', 'a_faire'),
    (v_student, 'C-11', '2027-06-25', 'a_faire'),
    (v_student, 'C-18', '2027-07-05', 'a_faire'),
    (v_student, 'D-03', '2027-09-15', 'a_faire'),
    (v_student, 'D-14', '2027-11-15', 'a_faire'),
    (v_student, 'D-21', '2028-01-15', 'a_faire'),
    (v_student, 'D-22', '2028-01-20', 'a_faire'),
    (v_student, 'D-24', '2028-02-01', 'a_faire'),
    (v_student, 'D-27', '2028-04-25', 'a_faire'),
    (v_student, 'D-32', '2028-05-01', 'a_faire'),
    (v_student, 'D-33', '2028-06-15', 'a_faire'),
    (v_student, 'E-03', '2028-06-10', 'a_faire'),
    (v_student, 'E-04', '2028-06-01', 'a_faire'),
    (v_student, 'E-05', '2028-07-15', 'a_faire'),
    (v_student, 'E-07', '2028-09-30', 'a_faire');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'Lycée Stanislas' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 23, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 40, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Léa Bertrand — premiere, uk, us
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Léa', 'Bertrand', 'seconde', 'premiere', 2027, array['uk','us']::carmine_track[], 'Lycée français de Londres', 'Londres', null)
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2024-09-15', 'sans_objet'),
    (v_student, 'A-02', '2024-10-01', 'sans_objet'),
    (v_student, 'A-03', '2025-02-15', 'sans_objet'),
    (v_student, 'A-04', '2024-10-15', 'sans_objet'),
    (v_student, 'A-05', '2025-06-15', 'sans_objet'),
    (v_student, 'A-06', '2024-09-05', 'sans_objet'),
    (v_student, 'B-01', '2026-02-20', 'fait'),
    (v_student, 'B-02', '2025-10-10', 'fait'),
    (v_student, 'B-03', '2026-01-15', 'fait'),
    (v_student, 'B-04', '2026-04-15', 'fait'),
    (v_student, 'B-05', '2026-01-20', 'fait'),
    (v_student, 'B-06', '2026-06-20', 'fait'),
    (v_student, 'C-01', '2026-09-25', 'a_faire'),
    (v_student, 'C-02', '2026-10-10', 'a_faire'),
    (v_student, 'C-03', '2026-11-15', 'a_faire'),
    (v_student, 'C-04', '2026-12-05', 'a_faire'),
    (v_student, 'C-05', '2027-03-15', 'a_faire'),
    (v_student, 'C-06', '2027-02-15', 'a_faire'),
    (v_student, 'C-07', '2027-03-20', 'a_faire'),
    (v_student, 'C-08', '2027-04-15', 'a_faire'),
    (v_student, 'C-09', '2027-06-15', 'a_faire'),
    (v_student, 'C-10', '2027-04-01', 'a_faire'),
    (v_student, 'C-11', '2027-06-25', 'a_faire'),
    (v_student, 'C-12', '2027-06-05', 'a_faire'),
    (v_student, 'C-13', '2027-09-15', 'a_faire'),
    (v_student, 'C-14', '2027-07-05', 'a_faire'),
    (v_student, 'C-15', '2027-07-10', 'a_faire'),
    (v_student, 'C-16', '2027-07-10', 'a_faire'),
    (v_student, 'C-17', '2027-08-10', 'a_faire'),
    (v_student, 'C-18', '2027-07-05', 'a_faire'),
    (v_student, 'D-01', '2027-08-01', 'a_faire'),
    (v_student, 'D-02', '2027-09-05', 'a_faire'),
    (v_student, 'D-03', '2027-09-15', 'a_faire'),
    (v_student, 'D-04', '2027-09-20', 'a_faire'),
    (v_student, 'D-05', '2027-09-10', 'a_faire'),
    (v_student, 'D-06', '2027-10-01', 'a_faire'),
    (v_student, 'D-07', '2027-10-15', 'a_faire'),
    (v_student, 'D-08', '2027-10-15', 'a_faire'),
    (v_student, 'D-09', '2027-10-22', 'a_faire'),
    (v_student, 'D-10', '2027-10-24', 'a_faire'),
    (v_student, 'D-11', '2027-11-05', 'a_faire'),
    (v_student, 'D-12', '2027-11-01', 'a_faire'),
    (v_student, 'D-13', '2027-11-30', 'a_faire'),
    (v_student, 'D-14', '2027-11-15', 'a_faire'),
    (v_student, 'D-15', '2027-11-10', 'a_faire'),
    (v_student, 'D-16', '2027-12-05', 'a_faire'),
    (v_student, 'D-17', '2027-12-01', 'a_faire'),
    (v_student, 'D-18', '2027-12-15', 'a_faire'),
    (v_student, 'D-19', '2028-01-01', 'a_faire'),
    (v_student, 'D-20', '2028-01-13', 'a_faire'),
    (v_student, 'D-23', '2028-01-31', 'a_faire'),
    (v_student, 'D-25', '2028-02-10', 'a_faire'),
    (v_student, 'D-26', '2028-02-20', 'a_faire'),
    (v_student, 'D-28', '2028-03-28', 'a_faire'),
    (v_student, 'D-29', '2028-04-10', 'a_faire'),
    (v_student, 'D-30', '2028-05-01', 'a_faire'),
    (v_student, 'D-31', '2028-05-20', 'a_faire'),
    (v_student, 'D-33', '2028-06-15', 'a_faire'),
    (v_student, 'D-34', '2028-07-05', 'a_faire'),
    (v_student, 'E-01', '2028-05-25', 'a_faire'),
    (v_student, 'E-02', '2028-05-30', 'a_faire'),
    (v_student, 'E-03', '2028-06-10', 'a_faire'),
    (v_student, 'E-04', '2028-06-01', 'a_faire'),
    (v_student, 'E-05', '2028-07-15', 'a_faire'),
    (v_student, 'E-06', '2028-08-05', 'a_faire'),
    (v_student, 'E-07', '2028-09-30', 'a_faire');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'ambitieuse' from carmine_universites
   where etablissement = 'University of Cambridge' limit 1;
  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'Pomona College' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 19, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 38, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 61, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Adrien Vasseur — premiere, uk
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Adrien', 'Vasseur', 'seconde', 'premiere', 2027, array['uk']::carmine_track[], 'Lycée Janson-de-Sailly', 'Paris', null)
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2024-09-15', 'sans_objet'),
    (v_student, 'A-02', '2024-10-01', 'sans_objet'),
    (v_student, 'A-03', '2025-02-15', 'sans_objet'),
    (v_student, 'A-04', '2024-10-15', 'sans_objet'),
    (v_student, 'B-01', '2026-02-20', 'fait'),
    (v_student, 'B-02', '2025-10-10', 'fait'),
    (v_student, 'B-03', '2026-01-15', 'fait'),
    (v_student, 'B-05', '2026-01-20', 'fait'),
    (v_student, 'B-06', '2026-06-20', 'fait'),
    (v_student, 'C-01', '2026-09-25', 'a_faire'),
    (v_student, 'C-02', '2026-10-10', 'a_faire'),
    (v_student, 'C-03', '2026-11-15', 'a_faire'),
    (v_student, 'C-06', '2027-02-15', 'a_faire'),
    (v_student, 'C-07', '2027-03-20', 'a_faire'),
    (v_student, 'C-09', '2027-06-15', 'a_faire'),
    (v_student, 'C-11', '2027-06-25', 'a_faire'),
    (v_student, 'C-13', '2027-09-15', 'a_faire'),
    (v_student, 'C-14', '2027-07-05', 'a_faire'),
    (v_student, 'C-15', '2027-07-10', 'a_faire'),
    (v_student, 'C-18', '2027-07-05', 'a_faire'),
    (v_student, 'D-02', '2027-09-05', 'a_faire'),
    (v_student, 'D-03', '2027-09-15', 'a_faire'),
    (v_student, 'D-06', '2027-10-01', 'a_faire'),
    (v_student, 'D-08', '2027-10-15', 'a_faire'),
    (v_student, 'D-09', '2027-10-22', 'a_faire'),
    (v_student, 'D-10', '2027-10-24', 'a_faire'),
    (v_student, 'D-11', '2027-11-05', 'a_faire'),
    (v_student, 'D-14', '2027-11-15', 'a_faire'),
    (v_student, 'D-15', '2027-11-10', 'a_faire'),
    (v_student, 'D-16', '2027-12-05', 'a_faire'),
    (v_student, 'D-20', '2028-01-13', 'a_faire'),
    (v_student, 'D-31', '2028-05-20', 'a_faire'),
    (v_student, 'D-33', '2028-06-15', 'a_faire'),
    (v_student, 'D-34', '2028-07-05', 'a_faire'),
    (v_student, 'E-01', '2028-05-25', 'a_faire'),
    (v_student, 'E-02', '2028-05-30', 'a_faire'),
    (v_student, 'E-03', '2028-06-10', 'a_faire'),
    (v_student, 'E-04', '2028-06-01', 'a_faire'),
    (v_student, 'E-05', '2028-07-15', 'a_faire'),
    (v_student, 'E-07', '2028-09-30', 'a_faire');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'University of Warwick' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 18, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 37, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 59, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);

  -- Louise Mercier — apres, uk, us
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Louise', 'Mercier', 'seconde', 'apres', 2023, array['uk','us']::carmine_track[], 'Lycée français de Londres', 'Londres', 'University of Cambridge — Natural Sciences')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2020-09-15', 'sans_objet'),
    (v_student, 'A-02', '2020-10-01', 'sans_objet'),
    (v_student, 'A-03', '2021-02-15', 'sans_objet'),
    (v_student, 'A-04', '2020-10-15', 'sans_objet'),
    (v_student, 'A-05', '2021-06-15', 'sans_objet'),
    (v_student, 'A-06', '2020-09-05', 'sans_objet'),
    (v_student, 'B-01', '2022-02-20', 'fait'),
    (v_student, 'B-02', '2021-10-10', 'fait'),
    (v_student, 'B-03', '2022-01-15', 'fait'),
    (v_student, 'B-04', '2022-04-15', 'fait'),
    (v_student, 'B-05', '2022-01-20', 'fait'),
    (v_student, 'B-06', '2022-06-20', 'fait'),
    (v_student, 'C-01', '2022-09-25', 'fait'),
    (v_student, 'C-02', '2022-10-10', 'fait'),
    (v_student, 'C-03', '2022-11-15', 'fait'),
    (v_student, 'C-04', '2022-12-05', 'fait'),
    (v_student, 'C-05', '2023-03-15', 'fait'),
    (v_student, 'C-06', '2023-02-15', 'fait'),
    (v_student, 'C-07', '2023-03-20', 'fait'),
    (v_student, 'C-08', '2023-04-15', 'fait'),
    (v_student, 'C-09', '2023-06-15', 'fait'),
    (v_student, 'C-10', '2023-04-01', 'fait'),
    (v_student, 'C-11', '2023-06-25', 'fait'),
    (v_student, 'C-12', '2023-06-05', 'fait'),
    (v_student, 'C-13', '2023-09-15', 'fait'),
    (v_student, 'C-14', '2023-07-05', 'fait'),
    (v_student, 'C-15', '2023-07-10', 'fait'),
    (v_student, 'C-16', '2023-07-10', 'fait'),
    (v_student, 'C-17', '2023-08-10', 'fait'),
    (v_student, 'C-18', '2023-07-05', 'fait'),
    (v_student, 'D-01', '2023-08-01', 'fait'),
    (v_student, 'D-02', '2023-09-05', 'fait'),
    (v_student, 'D-03', '2023-09-15', 'fait'),
    (v_student, 'D-04', '2023-09-20', 'fait'),
    (v_student, 'D-05', '2023-09-10', 'fait'),
    (v_student, 'D-06', '2023-10-01', 'fait'),
    (v_student, 'D-07', '2023-10-15', 'fait'),
    (v_student, 'D-08', '2023-10-15', 'fait'),
    (v_student, 'D-09', '2023-10-22', 'fait'),
    (v_student, 'D-10', '2023-10-24', 'fait'),
    (v_student, 'D-11', '2023-11-05', 'fait'),
    (v_student, 'D-12', '2023-11-01', 'fait'),
    (v_student, 'D-13', '2023-11-30', 'fait'),
    (v_student, 'D-14', '2023-11-15', 'fait'),
    (v_student, 'D-15', '2023-11-10', 'fait'),
    (v_student, 'D-16', '2023-12-05', 'fait'),
    (v_student, 'D-17', '2023-12-01', 'fait'),
    (v_student, 'D-18', '2023-12-15', 'fait'),
    (v_student, 'D-19', '2024-01-01', 'fait'),
    (v_student, 'D-20', '2024-01-13', 'fait'),
    (v_student, 'D-23', '2024-01-31', 'fait'),
    (v_student, 'D-25', '2024-02-10', 'fait'),
    (v_student, 'D-26', '2024-02-20', 'fait'),
    (v_student, 'D-28', '2024-03-28', 'fait'),
    (v_student, 'D-29', '2024-04-10', 'fait'),
    (v_student, 'D-30', '2024-05-01', 'fait'),
    (v_student, 'D-31', '2024-05-20', 'fait'),
    (v_student, 'D-33', '2024-06-15', 'fait'),
    (v_student, 'D-34', '2024-07-05', 'fait'),
    (v_student, 'E-01', '2024-05-25', 'fait'),
    (v_student, 'E-02', '2024-05-30', 'fait'),
    (v_student, 'E-03', '2024-06-10', 'fait'),
    (v_student, 'E-04', '2024-06-01', 'fait'),
    (v_student, 'E-05', '2024-07-15', 'fait'),
    (v_student, 'E-06', '2024-08-05', 'fait'),
    (v_student, 'E-07', '2024-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'plausible' from carmine_universites
   where etablissement = 'University of Cambridge' limit 1;
  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'Yale University' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 45, 'Bilan de fin de mission', 'Admission obtenue : University of Cambridge — Natural Sciences. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 22, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Antoine Delaunay — apres, eu
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Antoine', 'Delaunay', 'seconde', 'apres', 2021, array['eu']::carmine_track[], 'Lycée Louis-le-Grand', 'Paris', 'EPFL — Section de mathématiques')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2018-09-15', 'sans_objet'),
    (v_student, 'A-02', '2018-10-01', 'sans_objet'),
    (v_student, 'A-03', '2019-02-15', 'sans_objet'),
    (v_student, 'A-04', '2018-10-15', 'sans_objet'),
    (v_student, 'B-01', '2020-02-20', 'fait'),
    (v_student, 'B-06', '2020-06-20', 'fait'),
    (v_student, 'C-01', '2020-09-25', 'fait'),
    (v_student, 'C-06', '2021-02-15', 'fait'),
    (v_student, 'C-07', '2021-03-20', 'fait'),
    (v_student, 'C-11', '2021-06-25', 'fait'),
    (v_student, 'C-18', '2021-07-05', 'fait'),
    (v_student, 'D-03', '2021-09-15', 'fait'),
    (v_student, 'D-14', '2021-11-15', 'fait'),
    (v_student, 'D-21', '2022-01-15', 'fait'),
    (v_student, 'D-22', '2022-01-20', 'fait'),
    (v_student, 'D-24', '2022-02-01', 'fait'),
    (v_student, 'D-27', '2022-04-25', 'fait'),
    (v_student, 'D-32', '2022-05-01', 'fait'),
    (v_student, 'D-33', '2022-06-15', 'fait'),
    (v_student, 'E-03', '2022-06-10', 'fait'),
    (v_student, 'E-04', '2022-06-01', 'fait'),
    (v_student, 'E-05', '2022-07-15', 'fait'),
    (v_student, 'E-07', '2022-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'EPFL' limit 1;
  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'ambitieuse' from carmine_universites
   where etablissement = 'Lycée Stanislas' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 43, 'Bilan de fin de mission', 'Admission obtenue : EPFL — Section de mathématiques. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 26, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Sarah Amrani — apres, us
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Sarah', 'Amrani', 'seconde', 'apres', 2024, array['us']::carmine_track[], 'Lycée français de New York', 'New York', 'Pomona College')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2021-09-15', 'sans_objet'),
    (v_student, 'A-02', '2021-10-01', 'sans_objet'),
    (v_student, 'A-03', '2022-02-15', 'sans_objet'),
    (v_student, 'A-04', '2021-10-15', 'sans_objet'),
    (v_student, 'A-05', '2022-06-15', 'sans_objet'),
    (v_student, 'A-06', '2021-09-05', 'sans_objet'),
    (v_student, 'B-01', '2023-02-20', 'fait'),
    (v_student, 'B-02', '2022-10-10', 'fait'),
    (v_student, 'B-03', '2023-01-15', 'fait'),
    (v_student, 'B-04', '2023-04-15', 'fait'),
    (v_student, 'B-05', '2023-01-20', 'fait'),
    (v_student, 'B-06', '2023-06-20', 'fait'),
    (v_student, 'C-01', '2023-09-25', 'fait'),
    (v_student, 'C-03', '2023-11-15', 'fait'),
    (v_student, 'C-04', '2023-12-05', 'fait'),
    (v_student, 'C-05', '2024-03-15', 'fait'),
    (v_student, 'C-06', '2024-02-15', 'fait'),
    (v_student, 'C-07', '2024-03-20', 'fait'),
    (v_student, 'C-08', '2024-04-15', 'fait'),
    (v_student, 'C-09', '2024-06-15', 'fait'),
    (v_student, 'C-10', '2024-04-01', 'fait'),
    (v_student, 'C-12', '2024-06-05', 'fait'),
    (v_student, 'C-16', '2024-07-10', 'fait'),
    (v_student, 'C-17', '2024-08-10', 'fait'),
    (v_student, 'C-18', '2024-07-05', 'fait'),
    (v_student, 'D-01', '2024-08-01', 'fait'),
    (v_student, 'D-03', '2024-09-15', 'fait'),
    (v_student, 'D-04', '2024-09-20', 'fait'),
    (v_student, 'D-05', '2024-09-10', 'fait'),
    (v_student, 'D-07', '2024-10-15', 'fait'),
    (v_student, 'D-12', '2024-11-01', 'fait'),
    (v_student, 'D-13', '2024-11-30', 'fait'),
    (v_student, 'D-14', '2024-11-15', 'fait'),
    (v_student, 'D-17', '2024-12-01', 'fait'),
    (v_student, 'D-18', '2024-12-15', 'fait'),
    (v_student, 'D-19', '2025-01-01', 'fait'),
    (v_student, 'D-23', '2025-01-31', 'fait'),
    (v_student, 'D-25', '2025-02-10', 'fait'),
    (v_student, 'D-26', '2025-02-20', 'fait'),
    (v_student, 'D-28', '2025-03-28', 'fait'),
    (v_student, 'D-29', '2025-04-10', 'fait'),
    (v_student, 'D-30', '2025-05-01', 'fait'),
    (v_student, 'D-33', '2025-06-15', 'fait'),
    (v_student, 'E-01', '2025-05-25', 'fait'),
    (v_student, 'E-03', '2025-06-10', 'fait'),
    (v_student, 'E-04', '2025-06-01', 'fait'),
    (v_student, 'E-05', '2025-07-15', 'fait'),
    (v_student, 'E-06', '2025-08-05', 'fait'),
    (v_student, 'E-07', '2025-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'Pomona College' limit 1;
  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'plausible' from carmine_universites
   where etablissement = 'Amherst College' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 57, 'Bilan de fin de mission', 'Admission obtenue : Pomona College. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 26, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);

  -- Victor Poirier — apres, uk, eu
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Victor', 'Poirier', 'seconde', 'apres', 2023, array['uk','eu']::carmine_track[], 'Lycée français de Genève', 'Genève', 'University College London — Economics')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2020-09-15', 'sans_objet'),
    (v_student, 'A-02', '2020-10-01', 'sans_objet'),
    (v_student, 'A-03', '2021-02-15', 'sans_objet'),
    (v_student, 'A-04', '2020-10-15', 'sans_objet'),
    (v_student, 'B-01', '2022-02-20', 'fait'),
    (v_student, 'B-02', '2021-10-10', 'fait'),
    (v_student, 'B-03', '2022-01-15', 'fait'),
    (v_student, 'B-05', '2022-01-20', 'fait'),
    (v_student, 'B-06', '2022-06-20', 'fait'),
    (v_student, 'C-01', '2022-09-25', 'fait'),
    (v_student, 'C-02', '2022-10-10', 'fait'),
    (v_student, 'C-03', '2022-11-15', 'fait'),
    (v_student, 'C-06', '2023-02-15', 'fait'),
    (v_student, 'C-07', '2023-03-20', 'fait'),
    (v_student, 'C-09', '2023-06-15', 'fait'),
    (v_student, 'C-11', '2023-06-25', 'fait'),
    (v_student, 'C-13', '2023-09-15', 'fait'),
    (v_student, 'C-14', '2023-07-05', 'fait'),
    (v_student, 'C-15', '2023-07-10', 'fait'),
    (v_student, 'C-18', '2023-07-05', 'fait'),
    (v_student, 'D-02', '2023-09-05', 'fait'),
    (v_student, 'D-03', '2023-09-15', 'fait'),
    (v_student, 'D-06', '2023-10-01', 'fait'),
    (v_student, 'D-08', '2023-10-15', 'fait'),
    (v_student, 'D-09', '2023-10-22', 'fait'),
    (v_student, 'D-10', '2023-10-24', 'fait'),
    (v_student, 'D-11', '2023-11-05', 'fait'),
    (v_student, 'D-14', '2023-11-15', 'fait'),
    (v_student, 'D-15', '2023-11-10', 'fait'),
    (v_student, 'D-16', '2023-12-05', 'fait'),
    (v_student, 'D-20', '2024-01-13', 'fait'),
    (v_student, 'D-21', '2024-01-15', 'fait'),
    (v_student, 'D-22', '2024-01-20', 'fait'),
    (v_student, 'D-24', '2024-02-01', 'fait'),
    (v_student, 'D-27', '2024-04-25', 'fait'),
    (v_student, 'D-31', '2024-05-20', 'fait'),
    (v_student, 'D-32', '2024-05-01', 'fait'),
    (v_student, 'D-33', '2024-06-15', 'fait'),
    (v_student, 'D-34', '2024-07-05', 'fait'),
    (v_student, 'E-01', '2024-05-25', 'fait'),
    (v_student, 'E-02', '2024-05-30', 'fait'),
    (v_student, 'E-03', '2024-06-10', 'fait'),
    (v_student, 'E-04', '2024-06-01', 'fait'),
    (v_student, 'E-05', '2024-07-15', 'fait'),
    (v_student, 'E-07', '2024-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'University College London' limit 1;
  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'ambitieuse' from carmine_universites
   where etablissement = 'Università Bocconi' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 80, 'Bilan de fin de mission', 'Admission obtenue : University College London — Economics. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 26, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 43, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Emma Rossi — apres, uk
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Emma', 'Rossi', 'seconde', 'apres', 2020, array['uk']::carmine_track[], 'Lycée français de Milan', 'Milan', 'University of Warwick — Mathematics')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2017-09-15', 'sans_objet'),
    (v_student, 'A-02', '2017-10-01', 'sans_objet'),
    (v_student, 'A-03', '2018-02-15', 'sans_objet'),
    (v_student, 'A-04', '2017-10-15', 'sans_objet'),
    (v_student, 'B-01', '2019-02-20', 'fait'),
    (v_student, 'B-02', '2018-10-10', 'fait'),
    (v_student, 'B-03', '2019-01-15', 'fait'),
    (v_student, 'B-05', '2019-01-20', 'fait'),
    (v_student, 'B-06', '2019-06-20', 'fait'),
    (v_student, 'C-01', '2019-09-25', 'fait'),
    (v_student, 'C-02', '2019-10-10', 'fait'),
    (v_student, 'C-03', '2019-11-15', 'fait'),
    (v_student, 'C-06', '2020-02-15', 'fait'),
    (v_student, 'C-07', '2020-03-20', 'fait'),
    (v_student, 'C-09', '2020-06-15', 'fait'),
    (v_student, 'C-11', '2020-06-25', 'fait'),
    (v_student, 'C-13', '2020-09-15', 'fait'),
    (v_student, 'C-14', '2020-07-05', 'fait'),
    (v_student, 'C-15', '2020-07-10', 'fait'),
    (v_student, 'C-18', '2020-07-05', 'fait'),
    (v_student, 'D-02', '2020-09-05', 'fait'),
    (v_student, 'D-03', '2020-09-15', 'fait'),
    (v_student, 'D-06', '2020-10-01', 'fait'),
    (v_student, 'D-08', '2020-10-15', 'fait'),
    (v_student, 'D-09', '2020-10-22', 'fait'),
    (v_student, 'D-10', '2020-10-24', 'fait'),
    (v_student, 'D-11', '2020-11-05', 'fait'),
    (v_student, 'D-14', '2020-11-15', 'fait'),
    (v_student, 'D-15', '2020-11-10', 'fait'),
    (v_student, 'D-16', '2020-12-05', 'fait'),
    (v_student, 'D-20', '2021-01-13', 'fait'),
    (v_student, 'D-31', '2021-05-20', 'fait'),
    (v_student, 'D-33', '2021-06-15', 'fait'),
    (v_student, 'D-34', '2021-07-05', 'fait'),
    (v_student, 'E-01', '2021-05-25', 'fait'),
    (v_student, 'E-02', '2021-05-30', 'fait'),
    (v_student, 'E-03', '2021-06-10', 'fait'),
    (v_student, 'E-04', '2021-06-01', 'fait'),
    (v_student, 'E-05', '2021-07-15', 'fait'),
    (v_student, 'E-07', '2021-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'ambitieuse' from carmine_universites
   where etablissement = 'University of Warwick' limit 1;
  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'plausible' from carmine_universites
   where etablissement = 'King''s College London' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 41, 'Bilan de fin de mission', 'Admission obtenue : University of Warwick — Mathematics. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 27, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 36, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Inès Chevalier — apres, us
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Inès', 'Chevalier', 'seconde', 'apres', 2020, array['us']::carmine_track[], 'Lycée français de New York', 'New York', 'Harvard University')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2017-09-15', 'sans_objet'),
    (v_student, 'A-02', '2017-10-01', 'sans_objet'),
    (v_student, 'A-03', '2018-02-15', 'sans_objet'),
    (v_student, 'A-04', '2017-10-15', 'sans_objet'),
    (v_student, 'A-05', '2018-06-15', 'sans_objet'),
    (v_student, 'A-06', '2017-09-05', 'sans_objet'),
    (v_student, 'B-01', '2019-02-20', 'fait'),
    (v_student, 'B-02', '2018-10-10', 'fait'),
    (v_student, 'B-03', '2019-01-15', 'fait'),
    (v_student, 'B-04', '2019-04-15', 'fait'),
    (v_student, 'B-05', '2019-01-20', 'fait'),
    (v_student, 'B-06', '2019-06-20', 'fait'),
    (v_student, 'C-01', '2019-09-25', 'fait'),
    (v_student, 'C-03', '2019-11-15', 'fait'),
    (v_student, 'C-04', '2019-12-05', 'fait'),
    (v_student, 'C-05', '2020-03-15', 'fait'),
    (v_student, 'C-06', '2020-02-15', 'fait'),
    (v_student, 'C-07', '2020-03-20', 'fait'),
    (v_student, 'C-08', '2020-04-15', 'fait'),
    (v_student, 'C-09', '2020-06-15', 'fait'),
    (v_student, 'C-10', '2020-04-01', 'fait'),
    (v_student, 'C-12', '2020-06-05', 'fait'),
    (v_student, 'C-16', '2020-07-10', 'fait'),
    (v_student, 'C-17', '2020-08-10', 'fait'),
    (v_student, 'C-18', '2020-07-05', 'fait'),
    (v_student, 'D-01', '2020-08-01', 'fait'),
    (v_student, 'D-03', '2020-09-15', 'fait'),
    (v_student, 'D-04', '2020-09-20', 'fait'),
    (v_student, 'D-05', '2020-09-10', 'fait'),
    (v_student, 'D-07', '2020-10-15', 'fait'),
    (v_student, 'D-12', '2020-11-01', 'fait'),
    (v_student, 'D-13', '2020-11-30', 'fait'),
    (v_student, 'D-14', '2020-11-15', 'fait'),
    (v_student, 'D-17', '2020-12-01', 'fait'),
    (v_student, 'D-18', '2020-12-15', 'fait'),
    (v_student, 'D-19', '2021-01-01', 'fait'),
    (v_student, 'D-23', '2021-01-31', 'fait'),
    (v_student, 'D-25', '2021-02-10', 'fait'),
    (v_student, 'D-26', '2021-02-20', 'fait'),
    (v_student, 'D-28', '2021-03-28', 'fait'),
    (v_student, 'D-29', '2021-04-10', 'fait'),
    (v_student, 'D-30', '2021-05-01', 'fait'),
    (v_student, 'D-33', '2021-06-15', 'fait'),
    (v_student, 'E-01', '2021-05-25', 'fait'),
    (v_student, 'E-03', '2021-06-10', 'fait'),
    (v_student, 'E-04', '2021-06-01', 'fait'),
    (v_student, 'E-05', '2021-07-15', 'fait'),
    (v_student, 'E-06', '2021-08-05', 'fait'),
    (v_student, 'E-07', '2021-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'plausible' from carmine_universites
   where etablissement = 'Harvard University' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 53, 'Bilan de fin de mission', 'Admission obtenue : Harvard University. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 19, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 36, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);

  -- Nathan Roussel — apres, eu
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Nathan', 'Roussel', 'seconde', 'apres', 2023, array['eu']::carmine_track[], 'Lycée français de Zurich', 'Zurich', 'EPFL — Génie mécanique')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2020-09-15', 'sans_objet'),
    (v_student, 'A-02', '2020-10-01', 'sans_objet'),
    (v_student, 'A-03', '2021-02-15', 'sans_objet'),
    (v_student, 'A-04', '2020-10-15', 'sans_objet'),
    (v_student, 'B-01', '2022-02-20', 'fait'),
    (v_student, 'B-06', '2022-06-20', 'fait'),
    (v_student, 'C-01', '2022-09-25', 'fait'),
    (v_student, 'C-06', '2023-02-15', 'fait'),
    (v_student, 'C-07', '2023-03-20', 'fait'),
    (v_student, 'C-11', '2023-06-25', 'fait'),
    (v_student, 'C-18', '2023-07-05', 'fait'),
    (v_student, 'D-03', '2023-09-15', 'fait'),
    (v_student, 'D-14', '2023-11-15', 'fait'),
    (v_student, 'D-21', '2024-01-15', 'fait'),
    (v_student, 'D-22', '2024-01-20', 'fait'),
    (v_student, 'D-24', '2024-02-01', 'fait'),
    (v_student, 'D-27', '2024-04-25', 'fait'),
    (v_student, 'D-32', '2024-05-01', 'fait'),
    (v_student, 'D-33', '2024-06-15', 'fait'),
    (v_student, 'E-03', '2024-06-10', 'fait'),
    (v_student, 'E-04', '2024-06-01', 'fait'),
    (v_student, 'E-05', '2024-07-15', 'fait'),
    (v_student, 'E-07', '2024-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'EPFL' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 82, 'Bilan de fin de mission', 'Admission obtenue : EPFL — Génie mécanique. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 22, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 36, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Camille Fontaine — apres, eu
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Camille', 'Fontaine', 'seconde', 'apres', 2024, array['eu']::carmine_track[], 'Lycée Victor-Hugo', 'Paris', 'Università Bocconi — International Economics and Finance')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2021-09-15', 'sans_objet'),
    (v_student, 'A-02', '2021-10-01', 'sans_objet'),
    (v_student, 'A-03', '2022-02-15', 'sans_objet'),
    (v_student, 'A-04', '2021-10-15', 'sans_objet'),
    (v_student, 'B-01', '2023-02-20', 'fait'),
    (v_student, 'B-06', '2023-06-20', 'fait'),
    (v_student, 'C-01', '2023-09-25', 'fait'),
    (v_student, 'C-06', '2024-02-15', 'fait'),
    (v_student, 'C-07', '2024-03-20', 'fait'),
    (v_student, 'C-11', '2024-06-25', 'fait'),
    (v_student, 'C-18', '2024-07-05', 'fait'),
    (v_student, 'D-03', '2024-09-15', 'fait'),
    (v_student, 'D-14', '2024-11-15', 'fait'),
    (v_student, 'D-21', '2025-01-15', 'fait'),
    (v_student, 'D-22', '2025-01-20', 'fait'),
    (v_student, 'D-24', '2025-02-01', 'fait'),
    (v_student, 'D-27', '2025-04-25', 'fait'),
    (v_student, 'D-32', '2025-05-01', 'fait'),
    (v_student, 'D-33', '2025-06-15', 'fait'),
    (v_student, 'E-03', '2025-06-10', 'fait'),
    (v_student, 'E-04', '2025-06-01', 'fait'),
    (v_student, 'E-05', '2025-07-15', 'fait'),
    (v_student, 'E-07', '2025-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'Università Bocconi' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 69, 'Bilan de fin de mission', 'Admission obtenue : Università Bocconi — International Economics and Finance. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 19, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Clara Perrin — apres, eu
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Clara', 'Perrin', 'seconde', 'apres', 2023, array['eu']::carmine_track[], 'Lycée Henri-IV', 'Paris', 'Lycée Sainte-Geneviève — CPGE MP')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2020-09-15', 'sans_objet'),
    (v_student, 'A-02', '2020-10-01', 'sans_objet'),
    (v_student, 'A-03', '2021-02-15', 'sans_objet'),
    (v_student, 'A-04', '2020-10-15', 'sans_objet'),
    (v_student, 'B-01', '2022-02-20', 'fait'),
    (v_student, 'B-06', '2022-06-20', 'fait'),
    (v_student, 'C-01', '2022-09-25', 'fait'),
    (v_student, 'C-06', '2023-02-15', 'fait'),
    (v_student, 'C-07', '2023-03-20', 'fait'),
    (v_student, 'C-11', '2023-06-25', 'fait'),
    (v_student, 'C-18', '2023-07-05', 'fait'),
    (v_student, 'D-03', '2023-09-15', 'fait'),
    (v_student, 'D-14', '2023-11-15', 'fait'),
    (v_student, 'D-21', '2024-01-15', 'fait'),
    (v_student, 'D-22', '2024-01-20', 'fait'),
    (v_student, 'D-24', '2024-02-01', 'fait'),
    (v_student, 'D-27', '2024-04-25', 'fait'),
    (v_student, 'D-32', '2024-05-01', 'fait'),
    (v_student, 'D-33', '2024-06-15', 'fait'),
    (v_student, 'E-03', '2024-06-10', 'fait'),
    (v_student, 'E-04', '2024-06-01', 'fait'),
    (v_student, 'E-05', '2024-07-15', 'fait'),
    (v_student, 'E-07', '2024-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'ambitieuse' from carmine_universites
   where etablissement = 'Lycée Sainte-Geneviève' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 41, 'Bilan de fin de mission', 'Admission obtenue : Lycée Sainte-Geneviève — CPGE MP. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 25, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);

  -- Hugo Lemoine — apres, eu
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Hugo', 'Lemoine', 'seconde', 'apres', 2024, array['eu']::carmine_track[], 'Lycée français de Genève', 'Genève', 'EPFL — Section de mathématiques')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2021-09-15', 'sans_objet'),
    (v_student, 'A-02', '2021-10-01', 'sans_objet'),
    (v_student, 'A-03', '2022-02-15', 'sans_objet'),
    (v_student, 'A-04', '2021-10-15', 'sans_objet'),
    (v_student, 'B-01', '2023-02-20', 'fait'),
    (v_student, 'B-06', '2023-06-20', 'fait'),
    (v_student, 'C-01', '2023-09-25', 'fait'),
    (v_student, 'C-06', '2024-02-15', 'fait'),
    (v_student, 'C-07', '2024-03-20', 'fait'),
    (v_student, 'C-11', '2024-06-25', 'fait'),
    (v_student, 'C-18', '2024-07-05', 'fait'),
    (v_student, 'D-03', '2024-09-15', 'fait'),
    (v_student, 'D-14', '2024-11-15', 'fait'),
    (v_student, 'D-21', '2025-01-15', 'fait'),
    (v_student, 'D-22', '2025-01-20', 'fait'),
    (v_student, 'D-24', '2025-02-01', 'fait'),
    (v_student, 'D-27', '2025-04-25', 'fait'),
    (v_student, 'D-32', '2025-05-01', 'fait'),
    (v_student, 'D-33', '2025-06-15', 'fait'),
    (v_student, 'E-03', '2025-06-10', 'fait'),
    (v_student, 'E-04', '2025-06-01', 'fait'),
    (v_student, 'E-05', '2025-07-15', 'fait'),
    (v_student, 'E-07', '2025-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'ambitieuse' from carmine_universites
   where etablissement = 'EPFL' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 67, 'Bilan de fin de mission', 'Admission obtenue : EPFL — Section de mathématiques. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 25, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 45, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 59, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);

  -- Manon Girard — apres, uk
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Manon', 'Girard', 'seconde', 'apres', 2022, array['uk']::carmine_track[], 'King''s College School', 'Londres', 'King''s College London — Liberal Arts')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2019-09-15', 'sans_objet'),
    (v_student, 'A-02', '2019-10-01', 'sans_objet'),
    (v_student, 'A-03', '2020-02-15', 'sans_objet'),
    (v_student, 'A-04', '2019-10-15', 'sans_objet'),
    (v_student, 'B-01', '2021-02-20', 'fait'),
    (v_student, 'B-02', '2020-10-10', 'fait'),
    (v_student, 'B-03', '2021-01-15', 'fait'),
    (v_student, 'B-05', '2021-01-20', 'fait'),
    (v_student, 'B-06', '2021-06-20', 'fait'),
    (v_student, 'C-01', '2021-09-25', 'fait'),
    (v_student, 'C-02', '2021-10-10', 'fait'),
    (v_student, 'C-03', '2021-11-15', 'fait'),
    (v_student, 'C-06', '2022-02-15', 'fait'),
    (v_student, 'C-07', '2022-03-20', 'fait'),
    (v_student, 'C-09', '2022-06-15', 'fait'),
    (v_student, 'C-11', '2022-06-25', 'fait'),
    (v_student, 'C-13', '2022-09-15', 'fait'),
    (v_student, 'C-14', '2022-07-05', 'fait'),
    (v_student, 'C-15', '2022-07-10', 'fait'),
    (v_student, 'C-18', '2022-07-05', 'fait'),
    (v_student, 'D-02', '2022-09-05', 'fait'),
    (v_student, 'D-03', '2022-09-15', 'fait'),
    (v_student, 'D-06', '2022-10-01', 'fait'),
    (v_student, 'D-08', '2022-10-15', 'fait'),
    (v_student, 'D-09', '2022-10-22', 'fait'),
    (v_student, 'D-10', '2022-10-24', 'fait'),
    (v_student, 'D-11', '2022-11-05', 'fait'),
    (v_student, 'D-14', '2022-11-15', 'fait'),
    (v_student, 'D-15', '2022-11-10', 'fait'),
    (v_student, 'D-16', '2022-12-05', 'fait'),
    (v_student, 'D-20', '2023-01-13', 'fait'),
    (v_student, 'D-31', '2023-05-20', 'fait'),
    (v_student, 'D-33', '2023-06-15', 'fait'),
    (v_student, 'D-34', '2023-07-05', 'fait'),
    (v_student, 'E-01', '2023-05-25', 'fait'),
    (v_student, 'E-02', '2023-05-30', 'fait'),
    (v_student, 'E-03', '2023-06-10', 'fait'),
    (v_student, 'E-04', '2023-06-01', 'fait'),
    (v_student, 'E-05', '2023-07-15', 'fait'),
    (v_student, 'E-07', '2023-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'ambitieuse' from carmine_universites
   where etablissement = 'King''s College London' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 43, 'Bilan de fin de mission', 'Admission obtenue : King''s College London — Liberal Arts. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 19, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 39, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 57, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);

  -- Sacha Nguyen — apres, us
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Sacha', 'Nguyen', 'seconde', 'apres', 2021, array['us']::carmine_track[], 'Lycée français de Singapour', 'Singapour', 'Stanford University')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2018-09-15', 'sans_objet'),
    (v_student, 'A-02', '2018-10-01', 'sans_objet'),
    (v_student, 'A-03', '2019-02-15', 'sans_objet'),
    (v_student, 'A-04', '2018-10-15', 'sans_objet'),
    (v_student, 'A-05', '2019-06-15', 'sans_objet'),
    (v_student, 'A-06', '2018-09-05', 'sans_objet'),
    (v_student, 'B-01', '2020-02-20', 'fait'),
    (v_student, 'B-02', '2019-10-10', 'fait'),
    (v_student, 'B-03', '2020-01-15', 'fait'),
    (v_student, 'B-04', '2020-04-15', 'fait'),
    (v_student, 'B-05', '2020-01-20', 'fait'),
    (v_student, 'B-06', '2020-06-20', 'fait'),
    (v_student, 'C-01', '2020-09-25', 'fait'),
    (v_student, 'C-03', '2020-11-15', 'fait'),
    (v_student, 'C-04', '2020-12-05', 'fait'),
    (v_student, 'C-05', '2021-03-15', 'fait'),
    (v_student, 'C-06', '2021-02-15', 'fait'),
    (v_student, 'C-07', '2021-03-20', 'fait'),
    (v_student, 'C-08', '2021-04-15', 'fait'),
    (v_student, 'C-09', '2021-06-15', 'fait'),
    (v_student, 'C-10', '2021-04-01', 'fait'),
    (v_student, 'C-12', '2021-06-05', 'fait'),
    (v_student, 'C-16', '2021-07-10', 'fait'),
    (v_student, 'C-17', '2021-08-10', 'fait'),
    (v_student, 'C-18', '2021-07-05', 'fait'),
    (v_student, 'D-01', '2021-08-01', 'fait'),
    (v_student, 'D-03', '2021-09-15', 'fait'),
    (v_student, 'D-04', '2021-09-20', 'fait'),
    (v_student, 'D-05', '2021-09-10', 'fait'),
    (v_student, 'D-07', '2021-10-15', 'fait'),
    (v_student, 'D-12', '2021-11-01', 'fait'),
    (v_student, 'D-13', '2021-11-30', 'fait'),
    (v_student, 'D-14', '2021-11-15', 'fait'),
    (v_student, 'D-17', '2021-12-01', 'fait'),
    (v_student, 'D-18', '2021-12-15', 'fait'),
    (v_student, 'D-19', '2022-01-01', 'fait'),
    (v_student, 'D-23', '2022-01-31', 'fait'),
    (v_student, 'D-25', '2022-02-10', 'fait'),
    (v_student, 'D-26', '2022-02-20', 'fait'),
    (v_student, 'D-28', '2022-03-28', 'fait'),
    (v_student, 'D-29', '2022-04-10', 'fait'),
    (v_student, 'D-30', '2022-05-01', 'fait'),
    (v_student, 'D-33', '2022-06-15', 'fait'),
    (v_student, 'E-01', '2022-05-25', 'fait'),
    (v_student, 'E-03', '2022-06-10', 'fait'),
    (v_student, 'E-04', '2022-06-01', 'fait'),
    (v_student, 'E-05', '2022-07-15', 'fait'),
    (v_student, 'E-06', '2022-08-05', 'fait'),
    (v_student, 'E-07', '2022-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'plausible' from carmine_universites
   where etablissement = 'Stanford University' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 82, 'Bilan de fin de mission', 'Admission obtenue : Stanford University. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 19, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 45, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 58, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Malik Dupuis — apres, us
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Malik', 'Dupuis', 'seconde', 'apres', 2024, array['us']::carmine_track[], 'Lycée français de Dubaï', 'Dubaï', 'Massachusetts Institute of Technology')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2021-09-15', 'sans_objet'),
    (v_student, 'A-02', '2021-10-01', 'sans_objet'),
    (v_student, 'A-03', '2022-02-15', 'sans_objet'),
    (v_student, 'A-04', '2021-10-15', 'sans_objet'),
    (v_student, 'A-05', '2022-06-15', 'sans_objet'),
    (v_student, 'A-06', '2021-09-05', 'sans_objet'),
    (v_student, 'B-01', '2023-02-20', 'fait'),
    (v_student, 'B-02', '2022-10-10', 'fait'),
    (v_student, 'B-03', '2023-01-15', 'fait'),
    (v_student, 'B-04', '2023-04-15', 'fait'),
    (v_student, 'B-05', '2023-01-20', 'fait'),
    (v_student, 'B-06', '2023-06-20', 'fait'),
    (v_student, 'C-01', '2023-09-25', 'fait'),
    (v_student, 'C-03', '2023-11-15', 'fait'),
    (v_student, 'C-04', '2023-12-05', 'fait'),
    (v_student, 'C-05', '2024-03-15', 'fait'),
    (v_student, 'C-06', '2024-02-15', 'fait'),
    (v_student, 'C-07', '2024-03-20', 'fait'),
    (v_student, 'C-08', '2024-04-15', 'fait'),
    (v_student, 'C-09', '2024-06-15', 'fait'),
    (v_student, 'C-10', '2024-04-01', 'fait'),
    (v_student, 'C-12', '2024-06-05', 'fait'),
    (v_student, 'C-16', '2024-07-10', 'fait'),
    (v_student, 'C-17', '2024-08-10', 'fait'),
    (v_student, 'C-18', '2024-07-05', 'fait'),
    (v_student, 'D-01', '2024-08-01', 'fait'),
    (v_student, 'D-03', '2024-09-15', 'fait'),
    (v_student, 'D-04', '2024-09-20', 'fait'),
    (v_student, 'D-05', '2024-09-10', 'fait'),
    (v_student, 'D-07', '2024-10-15', 'fait'),
    (v_student, 'D-12', '2024-11-01', 'fait'),
    (v_student, 'D-13', '2024-11-30', 'fait'),
    (v_student, 'D-14', '2024-11-15', 'fait'),
    (v_student, 'D-17', '2024-12-01', 'fait'),
    (v_student, 'D-18', '2024-12-15', 'fait'),
    (v_student, 'D-19', '2025-01-01', 'fait'),
    (v_student, 'D-23', '2025-01-31', 'fait'),
    (v_student, 'D-25', '2025-02-10', 'fait'),
    (v_student, 'D-26', '2025-02-20', 'fait'),
    (v_student, 'D-28', '2025-03-28', 'fait'),
    (v_student, 'D-29', '2025-04-10', 'fait'),
    (v_student, 'D-30', '2025-05-01', 'fait'),
    (v_student, 'D-33', '2025-06-15', 'fait'),
    (v_student, 'E-01', '2025-05-25', 'fait'),
    (v_student, 'E-03', '2025-06-10', 'fait'),
    (v_student, 'E-04', '2025-06-01', 'fait'),
    (v_student, 'E-05', '2025-07-15', 'fait'),
    (v_student, 'E-06', '2025-08-05', 'fait'),
    (v_student, 'E-07', '2025-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'plausible' from carmine_universites
   where etablissement = 'Massachusetts Institute of Technology' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 72, 'Bilan de fin de mission', 'Admission obtenue : Massachusetts Institute of Technology. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 20, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);

  -- Anaïs Leroy — apres, uk, us
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Anaïs', 'Leroy', 'seconde', 'apres', 2022, array['uk','us']::carmine_track[], 'Lycée Jeanine-Manuel', 'Paris', 'University of Warwick — Mathematics')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2019-09-15', 'sans_objet'),
    (v_student, 'A-02', '2019-10-01', 'sans_objet'),
    (v_student, 'A-03', '2020-02-15', 'sans_objet'),
    (v_student, 'A-04', '2019-10-15', 'sans_objet'),
    (v_student, 'A-05', '2020-06-15', 'sans_objet'),
    (v_student, 'A-06', '2019-09-05', 'sans_objet'),
    (v_student, 'B-01', '2021-02-20', 'fait'),
    (v_student, 'B-02', '2020-10-10', 'fait'),
    (v_student, 'B-03', '2021-01-15', 'fait'),
    (v_student, 'B-04', '2021-04-15', 'fait'),
    (v_student, 'B-05', '2021-01-20', 'fait'),
    (v_student, 'B-06', '2021-06-20', 'fait'),
    (v_student, 'C-01', '2021-09-25', 'fait'),
    (v_student, 'C-02', '2021-10-10', 'fait'),
    (v_student, 'C-03', '2021-11-15', 'fait'),
    (v_student, 'C-04', '2021-12-05', 'fait'),
    (v_student, 'C-05', '2022-03-15', 'fait'),
    (v_student, 'C-06', '2022-02-15', 'fait'),
    (v_student, 'C-07', '2022-03-20', 'fait'),
    (v_student, 'C-08', '2022-04-15', 'fait'),
    (v_student, 'C-09', '2022-06-15', 'fait'),
    (v_student, 'C-10', '2022-04-01', 'fait'),
    (v_student, 'C-11', '2022-06-25', 'fait'),
    (v_student, 'C-12', '2022-06-05', 'fait'),
    (v_student, 'C-13', '2022-09-15', 'fait'),
    (v_student, 'C-14', '2022-07-05', 'fait'),
    (v_student, 'C-15', '2022-07-10', 'fait'),
    (v_student, 'C-16', '2022-07-10', 'fait'),
    (v_student, 'C-17', '2022-08-10', 'fait'),
    (v_student, 'C-18', '2022-07-05', 'fait'),
    (v_student, 'D-01', '2022-08-01', 'fait'),
    (v_student, 'D-02', '2022-09-05', 'fait'),
    (v_student, 'D-03', '2022-09-15', 'fait'),
    (v_student, 'D-04', '2022-09-20', 'fait'),
    (v_student, 'D-05', '2022-09-10', 'fait'),
    (v_student, 'D-06', '2022-10-01', 'fait'),
    (v_student, 'D-07', '2022-10-15', 'fait'),
    (v_student, 'D-08', '2022-10-15', 'fait'),
    (v_student, 'D-09', '2022-10-22', 'fait'),
    (v_student, 'D-10', '2022-10-24', 'fait'),
    (v_student, 'D-11', '2022-11-05', 'fait'),
    (v_student, 'D-12', '2022-11-01', 'fait'),
    (v_student, 'D-13', '2022-11-30', 'fait'),
    (v_student, 'D-14', '2022-11-15', 'fait'),
    (v_student, 'D-15', '2022-11-10', 'fait'),
    (v_student, 'D-16', '2022-12-05', 'fait'),
    (v_student, 'D-17', '2022-12-01', 'fait'),
    (v_student, 'D-18', '2022-12-15', 'fait'),
    (v_student, 'D-19', '2023-01-01', 'fait'),
    (v_student, 'D-20', '2023-01-13', 'fait'),
    (v_student, 'D-23', '2023-01-31', 'fait'),
    (v_student, 'D-25', '2023-02-10', 'fait'),
    (v_student, 'D-26', '2023-02-20', 'fait'),
    (v_student, 'D-28', '2023-03-28', 'fait'),
    (v_student, 'D-29', '2023-04-10', 'fait'),
    (v_student, 'D-30', '2023-05-01', 'fait'),
    (v_student, 'D-31', '2023-05-20', 'fait'),
    (v_student, 'D-33', '2023-06-15', 'fait'),
    (v_student, 'D-34', '2023-07-05', 'fait'),
    (v_student, 'E-01', '2023-05-25', 'fait'),
    (v_student, 'E-02', '2023-05-30', 'fait'),
    (v_student, 'E-03', '2023-06-10', 'fait'),
    (v_student, 'E-04', '2023-06-01', 'fait'),
    (v_student, 'E-05', '2023-07-15', 'fait'),
    (v_student, 'E-06', '2023-08-05', 'fait'),
    (v_student, 'E-07', '2023-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'University of Warwick' limit 1;
  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'Duke University' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 40, 'Bilan de fin de mission', 'Admission obtenue : University of Warwick — Mathematics. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 23, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 43, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);

  -- Raphaël Moreau — apres, uk, eu
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Raphaël', 'Moreau', 'seconde', 'apres', 2022, array['uk','eu']::carmine_track[], 'Lycée français de Vienne', 'Vienne', 'University College London — Economics')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2019-09-15', 'sans_objet'),
    (v_student, 'A-02', '2019-10-01', 'sans_objet'),
    (v_student, 'A-03', '2020-02-15', 'sans_objet'),
    (v_student, 'A-04', '2019-10-15', 'sans_objet'),
    (v_student, 'B-01', '2021-02-20', 'fait'),
    (v_student, 'B-02', '2020-10-10', 'fait'),
    (v_student, 'B-03', '2021-01-15', 'fait'),
    (v_student, 'B-05', '2021-01-20', 'fait'),
    (v_student, 'B-06', '2021-06-20', 'fait'),
    (v_student, 'C-01', '2021-09-25', 'fait'),
    (v_student, 'C-02', '2021-10-10', 'fait'),
    (v_student, 'C-03', '2021-11-15', 'fait'),
    (v_student, 'C-06', '2022-02-15', 'fait'),
    (v_student, 'C-07', '2022-03-20', 'fait'),
    (v_student, 'C-09', '2022-06-15', 'fait'),
    (v_student, 'C-11', '2022-06-25', 'fait'),
    (v_student, 'C-13', '2022-09-15', 'fait'),
    (v_student, 'C-14', '2022-07-05', 'fait'),
    (v_student, 'C-15', '2022-07-10', 'fait'),
    (v_student, 'C-18', '2022-07-05', 'fait'),
    (v_student, 'D-02', '2022-09-05', 'fait'),
    (v_student, 'D-03', '2022-09-15', 'fait'),
    (v_student, 'D-06', '2022-10-01', 'fait'),
    (v_student, 'D-08', '2022-10-15', 'fait'),
    (v_student, 'D-09', '2022-10-22', 'fait'),
    (v_student, 'D-10', '2022-10-24', 'fait'),
    (v_student, 'D-11', '2022-11-05', 'fait'),
    (v_student, 'D-14', '2022-11-15', 'fait'),
    (v_student, 'D-15', '2022-11-10', 'fait'),
    (v_student, 'D-16', '2022-12-05', 'fait'),
    (v_student, 'D-20', '2023-01-13', 'fait'),
    (v_student, 'D-21', '2023-01-15', 'fait'),
    (v_student, 'D-22', '2023-01-20', 'fait'),
    (v_student, 'D-24', '2023-02-01', 'fait'),
    (v_student, 'D-27', '2023-04-25', 'fait'),
    (v_student, 'D-31', '2023-05-20', 'fait'),
    (v_student, 'D-32', '2023-05-01', 'fait'),
    (v_student, 'D-33', '2023-06-15', 'fait'),
    (v_student, 'D-34', '2023-07-05', 'fait'),
    (v_student, 'E-01', '2023-05-25', 'fait'),
    (v_student, 'E-02', '2023-05-30', 'fait'),
    (v_student, 'E-03', '2023-06-10', 'fait'),
    (v_student, 'E-04', '2023-06-01', 'fait'),
    (v_student, 'E-05', '2023-07-15', 'fait'),
    (v_student, 'E-07', '2023-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'University College London' limit 1;
  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'plausible' from carmine_universites
   where etablissement = 'Università Bocconi' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 48, 'Bilan de fin de mission', 'Admission obtenue : University College London — Economics. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 20, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 42, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 54, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);

  -- Jade Colin — apres, us
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Jade', 'Colin', 'seconde', 'apres', 2023, array['us']::carmine_track[], 'Lycée français de Los Angeles', 'Los Angeles', 'Pomona College')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2020-09-15', 'sans_objet'),
    (v_student, 'A-02', '2020-10-01', 'sans_objet'),
    (v_student, 'A-03', '2021-02-15', 'sans_objet'),
    (v_student, 'A-04', '2020-10-15', 'sans_objet'),
    (v_student, 'A-05', '2021-06-15', 'sans_objet'),
    (v_student, 'A-06', '2020-09-05', 'sans_objet'),
    (v_student, 'B-01', '2022-02-20', 'fait'),
    (v_student, 'B-02', '2021-10-10', 'fait'),
    (v_student, 'B-03', '2022-01-15', 'fait'),
    (v_student, 'B-04', '2022-04-15', 'fait'),
    (v_student, 'B-05', '2022-01-20', 'fait'),
    (v_student, 'B-06', '2022-06-20', 'fait'),
    (v_student, 'C-01', '2022-09-25', 'fait'),
    (v_student, 'C-03', '2022-11-15', 'fait'),
    (v_student, 'C-04', '2022-12-05', 'fait'),
    (v_student, 'C-05', '2023-03-15', 'fait'),
    (v_student, 'C-06', '2023-02-15', 'fait'),
    (v_student, 'C-07', '2023-03-20', 'fait'),
    (v_student, 'C-08', '2023-04-15', 'fait'),
    (v_student, 'C-09', '2023-06-15', 'fait'),
    (v_student, 'C-10', '2023-04-01', 'fait'),
    (v_student, 'C-12', '2023-06-05', 'fait'),
    (v_student, 'C-16', '2023-07-10', 'fait'),
    (v_student, 'C-17', '2023-08-10', 'fait'),
    (v_student, 'C-18', '2023-07-05', 'fait'),
    (v_student, 'D-01', '2023-08-01', 'fait'),
    (v_student, 'D-03', '2023-09-15', 'fait'),
    (v_student, 'D-04', '2023-09-20', 'fait'),
    (v_student, 'D-05', '2023-09-10', 'fait'),
    (v_student, 'D-07', '2023-10-15', 'fait'),
    (v_student, 'D-12', '2023-11-01', 'fait'),
    (v_student, 'D-13', '2023-11-30', 'fait'),
    (v_student, 'D-14', '2023-11-15', 'fait'),
    (v_student, 'D-17', '2023-12-01', 'fait'),
    (v_student, 'D-18', '2023-12-15', 'fait'),
    (v_student, 'D-19', '2024-01-01', 'fait'),
    (v_student, 'D-23', '2024-01-31', 'fait'),
    (v_student, 'D-25', '2024-02-10', 'fait'),
    (v_student, 'D-26', '2024-02-20', 'fait'),
    (v_student, 'D-28', '2024-03-28', 'fait'),
    (v_student, 'D-29', '2024-04-10', 'fait'),
    (v_student, 'D-30', '2024-05-01', 'fait'),
    (v_student, 'D-33', '2024-06-15', 'fait'),
    (v_student, 'E-01', '2024-05-25', 'fait'),
    (v_student, 'E-03', '2024-06-10', 'fait'),
    (v_student, 'E-04', '2024-06-01', 'fait'),
    (v_student, 'E-05', '2024-07-15', 'fait'),
    (v_student, 'E-06', '2024-08-05', 'fait'),
    (v_student, 'E-07', '2024-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'ambitieuse' from carmine_universites
   where etablissement = 'Pomona College' limit 1;
  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'Williams College' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 68, 'Bilan de fin de mission', 'Admission obtenue : Pomona College. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 26, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Noah Faure — apres, uk
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Noah', 'Faure', 'seconde', 'apres', 2023, array['uk']::carmine_track[], 'Lycée français de Hong Kong', 'Hong Kong', 'University of Sydney — Bachelor of Science')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2020-09-15', 'sans_objet'),
    (v_student, 'A-02', '2020-10-01', 'sans_objet'),
    (v_student, 'A-03', '2021-02-15', 'sans_objet'),
    (v_student, 'A-04', '2020-10-15', 'sans_objet'),
    (v_student, 'B-01', '2022-02-20', 'fait'),
    (v_student, 'B-02', '2021-10-10', 'fait'),
    (v_student, 'B-03', '2022-01-15', 'fait'),
    (v_student, 'B-05', '2022-01-20', 'fait'),
    (v_student, 'B-06', '2022-06-20', 'fait'),
    (v_student, 'C-01', '2022-09-25', 'fait'),
    (v_student, 'C-02', '2022-10-10', 'fait'),
    (v_student, 'C-03', '2022-11-15', 'fait'),
    (v_student, 'C-06', '2023-02-15', 'fait'),
    (v_student, 'C-07', '2023-03-20', 'fait'),
    (v_student, 'C-09', '2023-06-15', 'fait'),
    (v_student, 'C-11', '2023-06-25', 'fait'),
    (v_student, 'C-13', '2023-09-15', 'fait'),
    (v_student, 'C-14', '2023-07-05', 'fait'),
    (v_student, 'C-15', '2023-07-10', 'fait'),
    (v_student, 'C-18', '2023-07-05', 'fait'),
    (v_student, 'D-02', '2023-09-05', 'fait'),
    (v_student, 'D-03', '2023-09-15', 'fait'),
    (v_student, 'D-06', '2023-10-01', 'fait'),
    (v_student, 'D-08', '2023-10-15', 'fait'),
    (v_student, 'D-09', '2023-10-22', 'fait'),
    (v_student, 'D-10', '2023-10-24', 'fait'),
    (v_student, 'D-11', '2023-11-05', 'fait'),
    (v_student, 'D-14', '2023-11-15', 'fait'),
    (v_student, 'D-15', '2023-11-10', 'fait'),
    (v_student, 'D-16', '2023-12-05', 'fait'),
    (v_student, 'D-20', '2024-01-13', 'fait'),
    (v_student, 'D-31', '2024-05-20', 'fait'),
    (v_student, 'D-33', '2024-06-15', 'fait'),
    (v_student, 'D-34', '2024-07-05', 'fait'),
    (v_student, 'E-01', '2024-05-25', 'fait'),
    (v_student, 'E-02', '2024-05-30', 'fait'),
    (v_student, 'E-03', '2024-06-10', 'fait'),
    (v_student, 'E-04', '2024-06-01', 'fait'),
    (v_student, 'E-05', '2024-07-15', 'fait'),
    (v_student, 'E-07', '2024-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'plausible' from carmine_universites
   where etablissement = 'University of Sydney' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 60, 'Bilan de fin de mission', 'Admission obtenue : University of Sydney — Bachelor of Science. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 26, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 37, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 57, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);

  -- Lina Benali — apres, us, eu
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Lina', 'Benali', 'seconde', 'apres', 2020, array['us','eu']::carmine_track[], 'Lycée français de Rabat', 'Rabat', 'New York University')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2017-09-15', 'sans_objet'),
    (v_student, 'A-02', '2017-10-01', 'sans_objet'),
    (v_student, 'A-03', '2018-02-15', 'sans_objet'),
    (v_student, 'A-04', '2017-10-15', 'sans_objet'),
    (v_student, 'A-05', '2018-06-15', 'sans_objet'),
    (v_student, 'A-06', '2017-09-05', 'sans_objet'),
    (v_student, 'B-01', '2019-02-20', 'fait'),
    (v_student, 'B-02', '2018-10-10', 'fait'),
    (v_student, 'B-03', '2019-01-15', 'fait'),
    (v_student, 'B-04', '2019-04-15', 'fait'),
    (v_student, 'B-05', '2019-01-20', 'fait'),
    (v_student, 'B-06', '2019-06-20', 'fait'),
    (v_student, 'C-01', '2019-09-25', 'fait'),
    (v_student, 'C-03', '2019-11-15', 'fait'),
    (v_student, 'C-04', '2019-12-05', 'fait'),
    (v_student, 'C-05', '2020-03-15', 'fait'),
    (v_student, 'C-06', '2020-02-15', 'fait'),
    (v_student, 'C-07', '2020-03-20', 'fait'),
    (v_student, 'C-08', '2020-04-15', 'fait'),
    (v_student, 'C-09', '2020-06-15', 'fait'),
    (v_student, 'C-10', '2020-04-01', 'fait'),
    (v_student, 'C-11', '2020-06-25', 'fait'),
    (v_student, 'C-12', '2020-06-05', 'fait'),
    (v_student, 'C-16', '2020-07-10', 'fait'),
    (v_student, 'C-17', '2020-08-10', 'fait'),
    (v_student, 'C-18', '2020-07-05', 'fait'),
    (v_student, 'D-01', '2020-08-01', 'fait'),
    (v_student, 'D-03', '2020-09-15', 'fait'),
    (v_student, 'D-04', '2020-09-20', 'fait'),
    (v_student, 'D-05', '2020-09-10', 'fait'),
    (v_student, 'D-07', '2020-10-15', 'fait'),
    (v_student, 'D-12', '2020-11-01', 'fait'),
    (v_student, 'D-13', '2020-11-30', 'fait'),
    (v_student, 'D-14', '2020-11-15', 'fait'),
    (v_student, 'D-17', '2020-12-01', 'fait'),
    (v_student, 'D-18', '2020-12-15', 'fait'),
    (v_student, 'D-19', '2021-01-01', 'fait'),
    (v_student, 'D-21', '2021-01-15', 'fait'),
    (v_student, 'D-22', '2021-01-20', 'fait'),
    (v_student, 'D-23', '2021-01-31', 'fait'),
    (v_student, 'D-24', '2021-02-01', 'fait'),
    (v_student, 'D-25', '2021-02-10', 'fait'),
    (v_student, 'D-26', '2021-02-20', 'fait'),
    (v_student, 'D-27', '2021-04-25', 'fait'),
    (v_student, 'D-28', '2021-03-28', 'fait'),
    (v_student, 'D-29', '2021-04-10', 'fait'),
    (v_student, 'D-30', '2021-05-01', 'fait'),
    (v_student, 'D-32', '2021-05-01', 'fait'),
    (v_student, 'D-33', '2021-06-15', 'fait'),
    (v_student, 'E-01', '2021-05-25', 'fait'),
    (v_student, 'E-03', '2021-06-10', 'fait'),
    (v_student, 'E-04', '2021-06-01', 'fait'),
    (v_student, 'E-05', '2021-07-15', 'fait'),
    (v_student, 'E-06', '2021-08-05', 'fait'),
    (v_student, 'E-07', '2021-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'ambitieuse' from carmine_universites
   where etablissement = 'EPFL' limit 1;
  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'ambitieuse' from carmine_universites
   where etablissement = 'New York University' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 85, 'Bilan de fin de mission', 'Admission obtenue : New York University. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 20, 'Cadrage initial', 'Premier point complet : parcours, résultats, ambitions. Nous arrêtons les deux pays visés et le calendrier des tests. La liste d''établissements reste ouverte jusqu''à la fin de l''année.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 37, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);

  -- Gabriel Renard — apres, eu
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Gabriel', 'Renard', 'seconde', 'apres', 2020, array['eu']::carmine_track[], 'Lycée Saint-Louis-de-Gonzague', 'Paris', 'Lycée Stanislas — CPGE MPSI')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2017-09-15', 'sans_objet'),
    (v_student, 'A-02', '2017-10-01', 'sans_objet'),
    (v_student, 'A-03', '2018-02-15', 'sans_objet'),
    (v_student, 'A-04', '2017-10-15', 'sans_objet'),
    (v_student, 'B-01', '2019-02-20', 'fait'),
    (v_student, 'B-06', '2019-06-20', 'fait'),
    (v_student, 'C-01', '2019-09-25', 'fait'),
    (v_student, 'C-06', '2020-02-15', 'fait'),
    (v_student, 'C-07', '2020-03-20', 'fait'),
    (v_student, 'C-11', '2020-06-25', 'fait'),
    (v_student, 'C-18', '2020-07-05', 'fait'),
    (v_student, 'D-03', '2020-09-15', 'fait'),
    (v_student, 'D-14', '2020-11-15', 'fait'),
    (v_student, 'D-21', '2021-01-15', 'fait'),
    (v_student, 'D-22', '2021-01-20', 'fait'),
    (v_student, 'D-24', '2021-02-01', 'fait'),
    (v_student, 'D-27', '2021-04-25', 'fait'),
    (v_student, 'D-32', '2021-05-01', 'fait'),
    (v_student, 'D-33', '2021-06-15', 'fait'),
    (v_student, 'E-03', '2021-06-10', 'fait'),
    (v_student, 'E-04', '2021-06-01', 'fait'),
    (v_student, 'E-05', '2021-07-15', 'fait'),
    (v_student, 'E-07', '2021-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'plausible' from carmine_universites
   where etablissement = 'Lycée Stanislas' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 83, 'Bilan de fin de mission', 'Admission obtenue : Lycée Stanislas — CPGE MPSI. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 22, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 39, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);

  -- Zoé Aubert — apres, uk
  insert into carmine_students
    (first_name, last_name, entry_class, current_class, terminale_year, tracks, school, city, admission)
  values ('Zoé', 'Aubert', 'seconde', 'apres', 2020, array['uk']::carmine_track[], 'Lycée français de Tokyo', 'Tokyo', 'University of Cambridge — Natural Sciences')
  returning id into v_student;

  insert into carmine_student_milestones (student_id, milestone_id, due_date, status)
  values
    (v_student, 'A-01', '2017-09-15', 'sans_objet'),
    (v_student, 'A-02', '2017-10-01', 'sans_objet'),
    (v_student, 'A-03', '2018-02-15', 'sans_objet'),
    (v_student, 'A-04', '2017-10-15', 'sans_objet'),
    (v_student, 'B-01', '2019-02-20', 'fait'),
    (v_student, 'B-02', '2018-10-10', 'fait'),
    (v_student, 'B-03', '2019-01-15', 'fait'),
    (v_student, 'B-05', '2019-01-20', 'fait'),
    (v_student, 'B-06', '2019-06-20', 'fait'),
    (v_student, 'C-01', '2019-09-25', 'fait'),
    (v_student, 'C-02', '2019-10-10', 'fait'),
    (v_student, 'C-03', '2019-11-15', 'fait'),
    (v_student, 'C-06', '2020-02-15', 'fait'),
    (v_student, 'C-07', '2020-03-20', 'fait'),
    (v_student, 'C-09', '2020-06-15', 'fait'),
    (v_student, 'C-11', '2020-06-25', 'fait'),
    (v_student, 'C-13', '2020-09-15', 'fait'),
    (v_student, 'C-14', '2020-07-05', 'fait'),
    (v_student, 'C-15', '2020-07-10', 'fait'),
    (v_student, 'C-18', '2020-07-05', 'fait'),
    (v_student, 'D-02', '2020-09-05', 'fait'),
    (v_student, 'D-03', '2020-09-15', 'fait'),
    (v_student, 'D-06', '2020-10-01', 'fait'),
    (v_student, 'D-08', '2020-10-15', 'fait'),
    (v_student, 'D-09', '2020-10-22', 'fait'),
    (v_student, 'D-10', '2020-10-24', 'fait'),
    (v_student, 'D-11', '2020-11-05', 'fait'),
    (v_student, 'D-14', '2020-11-15', 'fait'),
    (v_student, 'D-15', '2020-11-10', 'fait'),
    (v_student, 'D-16', '2020-12-05', 'fait'),
    (v_student, 'D-20', '2021-01-13', 'fait'),
    (v_student, 'D-31', '2021-05-20', 'fait'),
    (v_student, 'D-33', '2021-06-15', 'fait'),
    (v_student, 'D-34', '2021-07-05', 'fait'),
    (v_student, 'E-01', '2021-05-25', 'fait'),
    (v_student, 'E-02', '2021-05-30', 'fait'),
    (v_student, 'E-03', '2021-06-10', 'fait'),
    (v_student, 'E-04', '2021-06-01', 'fait'),
    (v_student, 'E-05', '2021-07-15', 'fait'),
    (v_student, 'E-07', '2021-09-30', 'fait');

  insert into carmine_cibles_eleve (student_id, universite_id, verdict)
  select v_student, id, 'probable' from carmine_universites
   where etablissement = 'University of Cambridge' limit 1;

  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 49, 'Bilan de fin de mission', 'Admission obtenue : University of Cambridge — Natural Sciences. Dossier clos — inscription confirmée, formalités d''installation achevées.', true);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 19, 'Séance de travail — écriture', 'Relecture ligne à ligne du brouillon. Le récit tient, la chute reste faible. Deux passes prévues avant la version transmise.', false);
  insert into carmine_session_notes (student_id, session_date, title, body, visible_to_parents)
  values (v_student, current_date - 42, 'Point d''étape sur les résultats', 'Moyennes consolidées revues trimestre par trimestre. Les prérequis sont couverts pour l''essentiel des cibles envisagées ; le point ouvert reste la lettre de l''établissement.', true);

end $$;

-- ── Suppression ───────────────────────────────────────────────────────────
-- Le jour où ces dossiers ont fait leur office : réexécuter le seul bloc
-- « Remise à plat » du début de ce fichier.
