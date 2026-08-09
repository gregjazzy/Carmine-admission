-- La liste finale (D-03) n'est pas un second tableau : c'est le sous-ensemble
-- retenu parmi les universités envisagées (C-06).
alter table carmine_cibles_eleve
  add column if not exists retenue boolean not null default false;
