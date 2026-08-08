-- ═══════════════════════════════════════════════════════════════════════════
--  Référentiel des établissements visés — Carmine Admission
--
--  Sert de base de comparaison à la note de positionnement (jalon C-01).
--  Une ligne = une référence publiée, à une granularité qui dépend du pays :
--  l'établissement aux États-Unis, le cursus au Royaume-Uni et en Irlande.
--
--  Quatre natures de référence coexistent et ne doivent jamais être confondues :
--
--    medianes      États-Unis — fourchettes 25-75 des admis, taux d'admission.
--    seuil_points  Irlande — points de coupure CAO de l'année.
--    offre_type    Royaume-Uni, Canada — exigence de notes annoncée par cursus.
--    eligibilite   Suisse, Pays-Bas — l'admission est réglementaire, pas
--                  compétitive : il n'existe aucun niveau médian à comparer.
--
--  Chaque ligne porte sa source, son millésime et sa date de consultation.
--  Sans ces trois colonnes, on ne sait plus dans deux ans ce qui est périmé.
-- ═══════════════════════════════════════════════════════════════════════════

create type carmine_reference_kind as enum
  ('medianes', 'seuil_points', 'offre_type', 'eligibilite');

create table carmine_universites (
  id              uuid primary key default gen_random_uuid(),
  pays            text not null,
  etablissement   text not null,
  -- Null quand la référence vaut pour l'établissement entier (cas américain).
  cursus          text,
  nature          carmine_reference_kind not null,

  taux_admission  numeric(5,4),

  -- Médianes américaines. Null légitime quand l'établissement ne considère pas
  -- les scores : Caltech, Berkeley, UCLA. « Non applicable », jamais « manquant ».
  sat_lecture_25  int,
  sat_lecture_75  int,
  sat_maths_25    int,
  sat_maths_75    int,
  act_25          int,
  act_75          int,
  sat_moyen       int,
  -- Les fourchettes ne portent que sur les candidats ayant choisi de soumettre
  -- un score : elles sont tirées vers le haut. À lire avec cette colonne.
  politique_test  text,

  offre_type      text,
  seuil_points    numeric(6,1),
  eligibilite     text,

  code_externe    text,
  source          text not null,
  source_url      text,
  millesime       text not null,
  consulte_le     date not null,
  notes           text,
  updated_at      timestamptz not null default now()
);

create unique index carmine_universites_unicite
  on carmine_universites (pays, etablissement, coalesce(cursus, ''));
create index on carmine_universites (pays, nature);

-- Trigger dédié : carmine_touch_updated_at() manipule la colonne « status »
-- des jalons, absente ici — la réutiliser ferait échouer toute mise à jour.
create function carmine_touch_reference() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger carmine_universites_touch
  before update on carmine_universites
  for each row execute function carmine_touch_reference();

-- ── Sécurité ───────────────────────────────────────────────────────────────
-- Le référentiel est une donnée de travail partagée : lisible par toute
-- personne connectée, modifiable par la seule administration.

alter table carmine_universites enable row level security;

create policy "lire le référentiel" on carmine_universites
  for select using (auth.uid() is not null);
create policy "admin gère le référentiel" on carmine_universites
  for all using (carmine_is_admin()) with check (carmine_is_admin());

-- ── Amorce : 39 établissements américains ──────────────────────────────────
-- College Scorecard — U.S. Department of Education, millésime 2025-26, publié le 2026-06-10, consulté le 2026-08-08.
-- Les sept établissements les plus sélectifs affichent des fourchettes
-- rigoureusement identiques : à croiser avec leur Common Data Set avant
-- de fonder une analyse dessus.
insert into carmine_universites
  (pays, etablissement, nature, taux_admission,
   sat_lecture_25, sat_lecture_75, sat_maths_25, sat_maths_75,
   act_25, act_75, sat_moyen, politique_test, code_externe,
   source, source_url, millesime, consulte_le)
values
  ('US', 'California Institute of Technology', 'medianes', 0.0257, null, null, null, null, null, null, null, 'ni requis ni recommandé', '110404', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Stanford University', 'medianes', 0.0361, 740, 780, 770, 800, 34, 35, 1553, 'considéré si soumis', '243744', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Harvard University', 'medianes', 0.0365, 740, 780, 770, 800, 34, 36, 1553, 'requis', '166027', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Yale University', 'medianes', 0.0387, 730, 780, 740, 790, 33, 35, 1534, 'considéré si soumis', '130794', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Columbia University in the City of New York', 'medianes', 0.0399, 740, 780, 770, 800, 34, 35, 1553, 'considéré si soumis', '190150', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'University of Chicago', 'medianes', 0.0448, 740, 780, 770, 800, 34, 35, 1554, 'considéré si soumis', '144050', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Massachusetts Institute of Technology', 'medianes', 0.0455, 740, 780, 780, 800, 34, 36, 1560, 'requis', '166683', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Princeton University', 'medianes', 0.0462, 740, 780, 770, 800, 34, 35, 1553, 'considéré si soumis', '186131', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Brown University', 'medianes', 0.0539, 740, 780, 770, 800, 34, 35, 1546, 'considéré si soumis', '217156', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Dartmouth College', 'medianes', 0.054, 740, 780, 760, 790, 33, 35, 1534, 'considéré si soumis', '182670', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'University of Pennsylvania', 'medianes', 0.054, 740, 770, 770, 800, 34, 36, 1553, 'considéré si soumis', '215062', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Duke University', 'medianes', 0.0571, 740, 770, 760, 800, 34, 35, 1548, 'considéré si soumis', '198419', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Vanderbilt University', 'medianes', 0.0586, 730, 770, 770, 800, 34, 35, 1549, 'considéré si soumis', '221999', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Johns Hopkins University', 'medianes', 0.0644, 740, 770, 780, 800, 34, 36, 1553, 'considéré si soumis', '162928', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Pomona College', 'medianes', 0.0709, 740, 770, 750, 790, 33, 35, 1534, 'considéré si soumis', '121345', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Bowdoin College', 'medianes', 0.0713, 730, 770, 740, 780, 33, 35, 1520, 'considéré si soumis', '161004', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Swarthmore College', 'medianes', 0.0746, 740, 770, 750, 790, 33, 35, 1534, 'considéré si soumis', '216287', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Northwestern University', 'medianes', 0.0769, 740, 770, 770, 800, 33, 35, 1533, 'considéré si soumis', '147767', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Rice University', 'medianes', 0.08, 740, 770, 770, 800, 34, 35, 1553, 'considéré si soumis', '227757', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Williams College', 'medianes', 0.0825, 740, 780, 750, 790, 34, 35, 1533, 'considéré si soumis', '168342', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Cornell University', 'medianes', 0.0876, 730, 770, 770, 800, 33, 35, 1535, 'considéré si soumis', '190415', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'University of California-Los Angeles', 'medianes', 0.0897, null, null, null, null, null, null, null, 'ni requis ni recommandé', '110662', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Amherst College', 'medianes', 0.0901, 740, 780, 750, 800, 33, 35, 1533, 'considéré si soumis', '164465', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'New York University', 'medianes', 0.0923, 720, 760, 760, 800, 34, 35, 1520, 'considéré si soumis', '193900', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'University of Southern California', 'medianes', 0.0981, 710, 760, 740, 790, 32, 35, 1495, 'considéré si soumis', '123961', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Emory University', 'medianes', 0.1065, 720, 760, 750, 790, 32, 35, 1520, 'considéré si soumis', '139658', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Middlebury College', 'medianes', 0.1075, 720, 760, 725, 790, 33, 35, 1508, 'considéré si soumis', '230959', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'University of California-Berkeley', 'medianes', 0.1098, null, null, null, null, null, null, null, 'ni requis ni recommandé', '110635', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Boston University', 'medianes', 0.1111, 690, 750, 730, 780, 32, 34, 1480, 'considéré si soumis', '164988', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'University of Notre Dame', 'medianes', 0.1127, 720, 770, 735, 790, 33, 35, 1520, 'considéré si soumis', '152080', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Tufts University', 'medianes', 0.1149, 720, 770, 750, 790, 33, 35, 1513, 'considéré si soumis', '168148', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Carnegie Mellon University', 'medianes', 0.1166, 730, 770, 770, 800, 34, 35, 1546, 'considéré si soumis', '211440', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Washington University in St Louis', 'medianes', 0.1206, 730, 770, 770, 800, 33, 35, 1530, 'considéré si soumis', '179867', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Georgetown University', 'medianes', 0.1291, 700, 770, 690, 780, 31, 35, 1487, 'requis', '131496', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Georgia Institute of Technology-Main Campus', 'medianes', 0.1407, 680, 750, 690, 790, 30, 34, 1480, 'requis', '139755', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'University of North Carolina at Chapel Hill', 'medianes', 0.1534, 690, 750, 700, 780, 28, 34, 1439, 'considéré si soumis', '199120', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'University of Michigan-Ann Arbor', 'medianes', 0.1564, 680, 750, 680, 780, 31, 34, 1465, 'considéré si soumis', '170976', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'Wesleyan University', 'medianes', 0.1649, 705, 760, 710, 780, 33, 35, 1501, 'considéré si soumis', '130697', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08'),
  ('US', 'University of Virginia-Main Campus', 'medianes', 0.1681, 700, 760, 710, 780, 32, 35, 1480, 'considéré si soumis', '234076', 'College Scorecard — U.S. Department of Education', 'https://collegescorecard.ed.gov/data/', '2025-26', '2026-08-08')
;
