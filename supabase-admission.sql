-- ═══════════════════════════════════════════════════════════════════════════
--  L'établissement intégré
--
--  Un dossier se termine par une admission, et rien n'en gardait trace : elle
--  se noyait dans le texte d'un compte rendu. C'est pourtant le résultat du
--  travail, et ce qu'on cherche en rouvrant un ancien dossier.
-- ═══════════════════════════════════════════════════════════════════════════

alter table carmine_students
  add column admission text;

comment on column carmine_students.admission is
  'Établissement finalement intégré. Null tant que le dossier est en cours.';
