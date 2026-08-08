-- ═══════════════════════════════════════════════════════════════════════════
--  Livrables assistés — Carmine Admission
--
--  Chaîne : la famille saisit ses données → Carmine choisit les cibles →
--  une Edge Function appelle Claude et écrit un BROUILLON → Carmine relit et
--  corrige → Carmine publie. Un livrable non publié est invisible des parents.
--
--  La trame elle-même vit ici, plus sur un disque : elle est versionnée,
--  sauvegardée, et modifiable sans redéploiement.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Trames de livrables ────────────────────────────────────────────────────
-- Réservées à l'administration : c'est la méthode, pas le livrable.
create table carmine_trames (
  id          uuid primary key default gen_random_uuid(),
  -- Identifiant du référentiel de jalons : « C-01 », « B-01 »…
  code        text not null unique,
  titre       text not null,
  -- Markdown. Sert de plan au modèle, et de trame si tu rédiges à la main.
  contenu     text not null,
  -- Consignes de rédaction passées au modèle, en plus de la trame.
  consignes   text,
  version     int  not null default 1,
  updated_at  timestamptz not null default now()
);

create trigger carmine_trames_touch
  before update on carmine_trames
  for each row execute function carmine_touch_reference();

-- ── Données saisies par la famille ─────────────────────────────────────────
-- Une ligne par rubrique (« notes », « activites », « tests »), en JSON pour
-- que le formulaire évolue sans migration.
create table carmine_donnees_eleve (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references carmine_students on delete cascade,
  rubrique    text not null,
  donnees     jsonb not null default '{}'::jsonb,
  -- Qui a saisi en dernier : utile quand parents et consultant se relaient.
  saisi_par   uuid references carmine_profiles,
  updated_at  timestamptz not null default now(),
  unique (student_id, rubrique)
);

create trigger carmine_donnees_eleve_touch
  before update on carmine_donnees_eleve
  for each row execute function carmine_touch_reference();

-- ── Établissements visés par un élève ──────────────────────────────────────
-- Le lien entre un dossier et les lignes du référentiel : c'est lui qui
-- détermine à quelles médianes le profil sera comparé.
create table carmine_cibles_eleve (
  student_id    uuid not null references carmine_students on delete cascade,
  universite_id uuid not null references carmine_universites on delete cascade,
  -- Verdict arbitré par Carmine, distinct du calcul automatique.
  verdict       text,
  ordre         int not null default 0,
  primary key (student_id, universite_id)
);

-- ── Repères ouverts à la famille ───────────────────────────────────────────
-- Situe l'élève face à l'ensemble du référentiel, pas seulement à ses cibles :
-- au-dessus du 75e percentile, dans la fourchette, sous le 25e. Jamais un rang
-- ni un score global — un chiffre unique se lit comme un verdict.
--
-- Interrupteur délibéré, indépendant de la publication d'un livrable : ouvrir
-- les repères et transmettre une note ne sont pas la même décision, et ce
-- contenu peut mal atterrir s'il apparaît sans avoir été annoncé.
alter table carmine_students
  add column reperes_visibles boolean not null default false;

-- ── Livrables produits ─────────────────────────────────────────────────────
create type carmine_livrable_statut as enum ('brouillon', 'relu', 'publie');

create table carmine_livrables (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references carmine_students on delete cascade,
  trame_code    text not null,
  titre         text not null,
  -- Markdown, généré puis corrigé à la main. C'est ce que le parent lira.
  contenu       text not null default '',
  statut        carmine_livrable_statut not null default 'brouillon',

  -- Traçabilité de la génération : sans elle, impossible de savoir six mois
  -- plus tard sur quel modèle et quel millésime de données on s'est appuyé.
  modele        text,
  millesime_ref text,
  tokens_entree int,
  tokens_sortie int,
  genere_le     timestamptz,
  publie_le     timestamptz,

  cree_par      uuid references carmine_profiles,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on carmine_livrables (student_id, created_at desc);

create trigger carmine_livrables_touch
  before update on carmine_livrables
  for each row execute function carmine_touch_reference();

-- ═══════════════════════════════════════════════════════════════════════════
--  Sécurité
-- ═══════════════════════════════════════════════════════════════════════════

alter table carmine_trames         enable row level security;
alter table carmine_donnees_eleve  enable row level security;
alter table carmine_cibles_eleve   enable row level security;
alter table carmine_livrables      enable row level security;

-- Les trames sont la méthode : administration uniquement, lecture comprise.
create policy "admin seul sur les trames" on carmine_trames
  for all using (carmine_is_admin()) with check (carmine_is_admin());

-- La famille saisit et relit ses propres données.
create policy "voir les données de ses élèves" on carmine_donnees_eleve
  for select using (
    carmine_is_admin() or exists (
      select 1 from carmine_student_parents sp
      where sp.student_id = carmine_donnees_eleve.student_id and sp.profile_id = auth.uid()
    )
  );
create policy "saisir les données de ses élèves" on carmine_donnees_eleve
  for insert with check (
    carmine_is_admin() or exists (
      select 1 from carmine_student_parents sp
      where sp.student_id = carmine_donnees_eleve.student_id and sp.profile_id = auth.uid()
    )
  );
create policy "corriger les données de ses élèves" on carmine_donnees_eleve
  for update using (
    carmine_is_admin() or exists (
      select 1 from carmine_student_parents sp
      where sp.student_id = carmine_donnees_eleve.student_id and sp.profile_id = auth.uid()
    )
  );
create policy "admin gère les données" on carmine_donnees_eleve
  for all using (carmine_is_admin()) with check (carmine_is_admin());

-- Les cibles sont visibles de la famille, arbitrées par Carmine seul.
create policy "voir les cibles de ses élèves" on carmine_cibles_eleve
  for select using (
    carmine_is_admin() or exists (
      select 1 from carmine_student_parents sp
      where sp.student_id = carmine_cibles_eleve.student_id and sp.profile_id = auth.uid()
    )
  );
create policy "admin gère les cibles" on carmine_cibles_eleve
  for all using (carmine_is_admin()) with check (carmine_is_admin());

-- Un livrable n'existe pour le parent qu'une fois publié. Le brouillon et
-- l'étape « relu » restent strictement internes.
create policy "voir les livrables publiés" on carmine_livrables
  for select using (
    carmine_is_admin() or (
      statut = 'publie' and exists (
        select 1 from carmine_student_parents sp
        where sp.student_id = carmine_livrables.student_id and sp.profile_id = auth.uid()
      )
    )
  );
create policy "admin gère les livrables" on carmine_livrables
  for all using (carmine_is_admin()) with check (carmine_is_admin());

-- ── Trame C-01 ─────────────────────────────────────────────────────────────
insert into carmine_trames (code, titre, contenu, consignes) values
  ('C-01', 'Note de positionnement chiffrée', '# Note de positionnement chiffrée — trame

Livrable **C-01**, remis fin septembre de première. C''est le document qui fixe le cadre
de tout l''accompagnement : il situe le profil réel face aux profils réellement admis, et
transforme un objectif rêvé en plan de travail daté.

> **Règle de rédaction.** Chaque chiffre porte sa source et son millésime. Chaque
> conversion porte son hypothèse. Ce qui n''est pas mesurable est présenté comme tel —
> une note qui prétend chiffrer l''inchiffrable se retourne contre nous au premier parent
> qui creuse.

---

## 1. En-tête

| | |
|---|---|
| Élève | *Prénom Nom* |
| Classe | *Première · année scolaire* |
| Établissement | |
| Pays visés | |
| Date de la note | |
| Millésime du référentiel | *ex. College Scorecard 2025-26, consulté le …* |

---

## 2. Hypothèses de lecture

À recopier telles quelles, puis ajuster. Ce paragraphe protège la note.

- **Conversion des notes.** Il n''existe aucun barème officiel entre le système français
  et le GPA américain. La conversion retenue ici est *[décrire]*. Elle vaut comme ordre
  de grandeur, jamais comme équivalence.
- **Fourchettes de tests.** Les 25-75 publiées ne portent que sur les candidats **ayant
  choisi de soumettre** un score. Elles sont mécaniquement tirées vers le haut. Chaque
  ligne du référentiel indique la politique de test de l''établissement.
- **Établissements sans données de test.** Caltech, Berkeley, UCLA et les autres qui ne
  considèrent pas les scores : la case est *non applicable*, jamais *non renseigné*.
- **Ancienneté.** Les données publiées ont environ un an de retard. Sans effet sur une
  décision stratégique — les médianes bougent lentement.

---

## 3. Axe académique

**Ce qu''on mesure :** moyennes par matière sur les deux dernières années, trajectoire
(en progression, stable, en érosion), rang relatif dans la classe si l''établissement le
communique, et exigence du cursus suivi — spécialités, options, section internationale.

| Matière | Moyenne T1 | T2 | T3 | Tendance |
|---|---|---|---|---|
| | | | | |

**Lecture.** *Deux à quatre phrases. La trajectoire compte davantage que le niveau
absolu : une remontée de 13 à 16 se raconte mieux qu''un 15 plat.*

---

## 4. Axe distinction externe — le *spike*

**Cet axe n''est pas chiffrable.** Aucune université ne publie le niveau d''activités de
ses admis, et il n''en existe aucune médiane. On le situe donc sur une échelle à paliers,
explicitée dans la note pour que la famille sache lire le verdict.

| Palier | Ce que ça recouvre |
|---|---|
| **Tier 1** | Reconnaissance nationale ou internationale : médaille d''olympiade, publication, sélection nationale, projet à audience réelle. |
| **Tier 2** | Reconnaissance régionale, ou responsabilité de premier plan : finaliste de concours, fondateur d''une initiative suivie, recherche encadrée aboutie. |
| **Tier 3** | Engagement sérieux et durable sans reconnaissance externe : responsabilité associative, pratique de haut niveau, projet personnel documenté. |
| **Tier 4** | Participation régulière, sans distinction ni responsabilité. |

| Activité | Depuis | Palier | Preuve externe |
|---|---|---|---|
| | | | |

**Lecture.** *Le spike est-il lisible en une phrase ? Une candidature sélective américaine
se retient par un thème, pas par une liste. Dire ici s''il existe, s''il est à construire,
ou s''il faut élaguer.*

---

## 5. Axe tests

| | Score actuel | Date | Nature |
|---|---|---|---|
| SAT blanc diagnostic | | | sans enjeu |
| SAT officiel | | | |
| IELTS / TOEFL | | | |

**Lecture.** *Situer par rapport aux cibles ci-dessous, en rappelant que la préparation
au SAT porte à 70 % sur la partie lecture et écriture — c''est là que se gagnent les
points pour un profil francophone.*

---

## 6. Positionnement par établissement visé

La colonne **Position** se lit face à la fourchette 25-75 du référentiel :

| Verdict | Règle |
|---|---|
| **Likely** | Au-dessus du 75e percentile, et taux d''admission supérieur à 20 %. |
| **Target** | Dans la fourchette, plutôt au-dessus de la médiane. |
| **Reach** | Sous le 25e percentile, **ou** taux d''admission inférieur à 10 % quel que soit le profil. |

> Sous 10 % d''admission, aucun profil n''est *Target*. Le dire explicitement évite la
> conversation pénible de mars de terminale.

| Établissement | Pays | Taux adm. | Référence | Position de l''élève | Verdict |
|---|---|---|---|---|---|
| | | | *25-75 SAT · points CAO · offre type* | | |

*Les références proviennent de la table `carmine_universites`. Ne jamais recopier un
chiffre sans sa source et son millésime.*

---

## 7. Projection à dix-huit mois

Où chacun des trois axes peut raisonnablement arriver d''ici au dépôt des candidatures,
**si** le plan est tenu. C''est la partie qui distingue une note de positionnement d''un
simple bilan.

| Axe | Aujourd''hui | Projection réaliste | Projection haute | Ce qui la conditionne |
|---|---|---|---|---|
| Académique | | | | |
| Spike | | | | |
| Tests | | | | |

---

## 8. Écarts à combler

Chaque écart devient un jalon daté dans le portail. Sans cette colonne, la note reste un
constat.

| Écart identifié | Action | Échéance | Qui |
|---|---|---|---|
| | | | |

---

## 9. Ce que cette note n''est pas

- Ce n''est pas une prédiction. Les admissions très sélectives comportent une part
  irréductible d''aléa, y compris pour des profils au-dessus des médianes.
- Ce n''est pas un classement de valeur personnelle. C''est une mesure d''écart à un
  référentiel donné, sur trois axes choisis.
- Ce n''est pas figé. Elle est relue à chaque point d''étape, et le référentiel est
  rafraîchi chaque année.

---

## Note d''usage interne

L''arrivée tardive n''est jamais un reproche : une famille qui se présente en première a
quinze mois devant elle, et l''essentiel de ce qui décide d''une candidature se joue dans
les douze derniers mois. La note dit l''écart, pas le retard.
', 'Tu rédiges un BROUILLON destiné à être relu et corrigé par le consultant avant publication.

Contraintes de fond :
- N''invente aucun chiffre. Chaque donnée vient des sections fournies ; ce qui manque est écrit « non renseigné », jamais estimé.
- Les fourchettes SAT/ACT ne portent que sur les candidats ayant choisi de soumettre un score. Rappelle-le quand tu t''en sers.
- Un établissement sans données de test est « non applicable », jamais « non renseigné » : il ne les considère pas.
- L''axe distinction externe n''est pas chiffrable. Situe-le sur l''échelle à quatre paliers, sans jamais lui donner un score.
- Sous 10 % d''admission, aucun profil n''est Target.
- Une arrivée tardive n''est pas un retard. La note dit l''écart, pas la faute.

Contraintes de forme :
- Suis le plan de la trame, sections et tableaux compris.
- Reste concis : couvre la substance sans sections de remplissage ni résumés redondants.
- Ne vérifie pas ton travail dans le texte et n''ajoute pas de section de contrôle : la relecture est humaine.
- Ne fais que la note demandée. N''élargis pas le périmètre, ne propose pas de suites.
- Là où une donnée manque pour conclure, laisse « [à compléter] » plutôt que de combler.')
on conflict (code) do update set
  contenu = excluded.contenu, consignes = excluded.consignes,
  version = carmine_trames.version + 1;

-- ═══════════════════════════════════════════════════════════════════════════
--  Suivi item par item
--
--  Générique : ce qui vaut pour le programme super-curriculaire (C-02) vaut
--  pour les projets de fond (B-03, C-10) et la banque d'essais (C-17, D-18).
--  Un item = une chose à faire, puis une chose sur laquelle l'élève a écrit.
--
--  Les trois champs de réflexion sont la raison d'être de la table. Dix
--  livres lus sans notes ne produisent aucune ligne exploitable en juillet
--  devant le Personal Statement ; les mêmes dix livres annotés en produisent
--  trente. C'est là que se fabrique la matière première.
-- ═══════════════════════════════════════════════════════════════════════════

create type carmine_item_type as enum
  ('lecture', 'cours', 'concours', 'projet', 'essai', 'autre');
create type carmine_item_statut as enum
  ('a_faire', 'en_cours', 'fait', 'abandonne');

create table carmine_suivi_items (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references carmine_students on delete cascade,
  -- Jalon de rattachement : « C-02 », « C-10 »…
  milestone_id text not null,
  type         carmine_item_type   not null default 'lecture',
  statut       carmine_item_statut not null default 'a_faire',

  titre        text not null,
  -- Auteur, plateforme, lien — ce qu'il faut pour retrouver la source.
  reference    text,

  -- La réflexion. Trois questions plutôt qu'un champ libre : une page blanche
  -- produit « très intéressant », ces trois-là produisent une pensée.
  retenu       text,
  desaccord    text,
  question     text,

  -- Qui a mis l'item au programme. Le consultant propose, l'élève annote.
  propose_par  uuid references carmine_profiles,
  ordre        int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index on carmine_suivi_items (student_id, milestone_id, ordre);

create trigger carmine_suivi_items_touch
  before update on carmine_suivi_items
  for each row execute function carmine_touch_reference();

alter table carmine_suivi_items enable row level security;

-- La famille lit, ajoute et annote les items de ses propres élèves : c'est
-- l'élève qui écrit la réflexion, pas le consultant.
create policy "voir le suivi de ses élèves" on carmine_suivi_items
  for select using (
    carmine_is_admin() or exists (
      select 1 from carmine_student_parents sp
      where sp.student_id = carmine_suivi_items.student_id and sp.profile_id = auth.uid()
    )
  );
create policy "ajouter un item" on carmine_suivi_items
  for insert with check (
    carmine_is_admin() or exists (
      select 1 from carmine_student_parents sp
      where sp.student_id = carmine_suivi_items.student_id and sp.profile_id = auth.uid()
    )
  );
create policy "annoter un item" on carmine_suivi_items
  for update using (
    carmine_is_admin() or exists (
      select 1 from carmine_student_parents sp
      where sp.student_id = carmine_suivi_items.student_id and sp.profile_id = auth.uid()
    )
  );
create policy "admin gère le suivi" on carmine_suivi_items
  for all using (carmine_is_admin()) with check (carmine_is_admin());
