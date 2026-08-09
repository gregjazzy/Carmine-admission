-- Exigence de langue, cursus par cursus. Distincte des médianes d'admission :
-- elle a sa propre source et son propre millésime, et se vérifie chaque année.
alter table carmine_universites
  add column if not exists exigence_langue        text,
  add column if not exists exigence_langue_source text;
