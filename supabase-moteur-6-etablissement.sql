-- Trames remplies par l'établissement : profil, référence UCAS, évaluation professeur,
-- lettre du responsable d'orientation. Carmine fournit la trame et les données,
-- l'établissement rédige et dépose.

insert into carmine_trames (code, titre, contenu, consignes, type, pour_type_tache)
values ('ETAB-PROFIL', 'Profil d''établissement (School Profile)', '# Profil d''établissement — trame

Document que les universités américaines attendent avec le dossier, et qu''un lycée français
n''a presque jamais. Sans lui, un lecteur d''admission lit « 15,4 » sans savoir si c''est bon.
Une à deux pages, **en anglais**, sur papier à en-tête de l''établissement, signé par la
direction. Il vaut pour tous les élèves de la promotion : écrit une fois, il resservira.

> **Ce que Carmine fait** : cette trame, les données de l''élève, la relecture.
> **Ce que l''établissement fait** : il l''adopte, le complète avec ses chiffres, le signe et le dépose.
> Le document reste celui de l''établissement.

---

## 1. School identity

| | |
|---|---|
| School name | *[nom complet]* |
| Address | *[adresse, ville, pays]* |
| Head of school | *[nom, fonction]* |
| Contact for admissions offices | *[nom, fonction, courriel, téléphone]* |
| Website | |
| CEEB / ACT code | *[si l''établissement en a un ; sinon écrire « none — French school without CEEB code »]* |
| School type | *[public / private under contract with the State (sous contrat) / private]* |
| Founded | |

## 2. Community and context

Trois à cinq phrases : où se trouve l''établissement, quel public il accueille, ce qui le
caractérise. Un lecteur américain ne connaît ni la ville ni la réputation locale.

- Total enrolment: *[nombre]* students, of whom *[nombre]* in the final three years (Seconde, Première, Terminale).
- Class of *[année]*: *[nombre]* students.
- *[Sections particulières : internationale, européenne, bilingue, sportive.]*
- *[Ce qui distingue l''établissement, sans superlatif : ancienneté, réseau, projet pédagogique.]*

## 3. The French curriculum, briefly

Paragraphe à recopier et à ajuster. Il explique un système que le lecteur ne connaît pas.

> Students follow the French national curriculum leading to the *Baccalauréat*, a national
> examination taken at the end of Terminale (Grade 12). From Première (Grade 11), students
> choose three *spécialités* (major subjects, 4 hours per week each), reduced to two in
> Terminale (6 hours per week each). *Mathématiques Expertes* is an additional advanced
> mathematics option available in Terminale to students who keep Mathematics as a spécialité;
> it is comparable in demand to Further Mathematics A-level.

- Spécialités offered by this school: *[liste]*
- Additional options offered: *[Mathématiques Expertes, Mathématiques Complémentaires, DGEMC, langues, latin…]*
- Language of instruction: *[French / French and English for the international section]*

## 4. Grading system — the section that matters most

Sans ce paragraphe, une moyenne française est illisible. À recopier, puis à chiffrer.

> Grades are given on a 0–20 scale. **This scale is not a percentage.** Marks above 18 are
> exceptional and rarely awarded; a mark of 16 is considered excellent, 14 very good, 12 above
> the pass mark of 10. French teachers grade to distinguish, not to reward: full marks are
> almost never given, in any subject.

**Distribution for the Class of *[année]* (overall averages, Première):**

| Overall average | Number of students | Percentage |
|---|---|---|
| 18 and above | | |
| 16 – 17.99 | | |
| 14 – 15.99 | | |
| 12 – 13.99 | | |
| 10 – 11.99 | | |
| Below 10 | | |

*[Si l''établissement ne peut pas fournir la distribution complète, donner au minimum la
moyenne de la promotion et la moyenne du premier décile.]*

- Class average for the year group: *[ ]*
- Highest overall average in the year group: *[ ]*

**Class rank:** *[« This school does not rank students. » ou « Rank is provided on request; the
student''s rank appears on the transcript. »]* — répondre explicitement, l''absence de réponse
est lue comme un refus de communiquer.

## 5. Baccalauréat results — Class of *[année précédente]*

| | |
|---|---|
| Pass rate | *[ ]* % |
| *Mention Très Bien* (16/20 and above, with distinction) | *[ ]* % |
| *Mention Bien* (14–15.99) | *[ ]* % |
| *Mention Assez Bien* (12–13.99) | *[ ]* % |
| National average for *Mention Très Bien* | *[ ]* % *[donne l''échelle de comparaison]* |

## 6. Post-secondary destinations

Où vont les diplômés. C''est ce qui situe le niveau réel de l''établissement.

- *Classes préparatoires aux grandes écoles* (two-year intensive programmes preparing for the
  competitive entrance examinations of France''s *grandes écoles*): *[ ]* % of the class.
  *[Une phrase pour expliquer ce que c''est : les prépas n''ont pas d''équivalent américain.]*
- French universities: *[ ]* %
- Selective post-secondary schools (business, engineering, IEP): *[ ]* %
- Universities abroad: *[ ]* % — *[citer les destinations des trois dernières années]*

## 7. Special circumstances affecting this cohort

*[Facultatif, mais lu : réforme du baccalauréat, changement d''équipe, mouvement social,
épisode sanitaire, tout ce qui explique une anomalie dans les notes d''une année.]*

---

*Signature, fonction, date, cachet de l''établissement.*', 'Une à deux pages en anglais, à faire adopter et signer par l''établissement. Vaut pour toute la promotion.', 'etablissement', 'piece')
on conflict (code) do update set titre = excluded.titre, contenu = excluded.contenu, consignes = excluded.consignes, type = excluded.type, pour_type_tache = excluded.pour_type_tache, version = carmine_trames.version + 1;

insert into carmine_trames (code, titre, contenu, consignes, type, pour_type_tache)
values ('ETAB-REF-UCAS', 'Référence UCAS et notes prédites', '# Référence UCAS — trame

Depuis le cycle 2024, la référence UCAS n''est plus une lettre libre : ce sont **trois réponses
distinctes**, écrites par l''établissement, en anglais, dans le portail UCAS. Elle est déposée
avec les *predicted grades*. Sans elle, la candidature ne part pas.

> **Ce que Carmine fait** : cette trame, la fiche de synthèse sur l''élève, le suivi jusqu''au dépôt.
> **Ce que l''établissement fait** : il rédige et dépose. La référence est son texte, pas le nôtre.

**Échéances :** 15 octobre 18 h (heure britannique) pour Oxford, Cambridge, médecine, dentaire,
vétérinaire. Mi-janvier pour les autres. Prévoir une remise **trois semaines avant**.

---

## Ce que ce n''est pas

Ce n''est pas une appréciation de bulletin, ni un portrait personnel. Les tuteurs britanniques
cherchent une chose : **cet élève peut-il suivre ce cursus précis, et pourquoi le pensez-vous**.
Les qualités humaines, l''implication dans la vie de l''établissement, la gentillesse : hors sujet
ici, à la différence des lettres américaines.

## Section 1 — School or college context

> *Anything you would like to say about the applicant''s school or college that will help the
> universities understand their achievements and potential.*

Ce qui aide le lecteur à situer les notes de l''élève. Trois à six phrases.

- Type d''établissement, effectif de la promotion, cursus suivi.
- **L''échelle de notation** : « Grades are on a 0–20 scale; 16 is considered excellent and marks
  above 18 are exceptional. » Sans cette phrase, un 15 est lu comme un 75 %.
- Le niveau de la promotion, et où se situe l''élève dedans : rang, décile, ou formulation
  comparative si l''établissement ne classe pas.
- Les spécialités offertes, et celles qui ne le sont pas. *[Décisif : si l''établissement
  n''offre pas Mathématiques Expertes, il faut l''écrire, sans quoi son absence est lue comme un
  choix de l''élève.]*

## Section 2 — Extenuating circumstances

> *Anything that has affected the applicant''s education and achievement that the universities
> should know about.*

À ne remplir que s''il y a quelque chose. Une section vide vaut mieux qu''une circonstance inventée.

- Maladie, deuil, situation familiale, changement d''établissement, expatriation, interruption.
- Effet **concret** sur les résultats : quel trimestre, quelles matières, quelle ampleur.
- Ce qui a été mis en place, et la récupération observée.

> Registre : factuel, daté, sans pathos. *« Between January and April of Première, the student''s
> attendance was affected by [ ]. Marks in [subject] fell from [ ] to [ ] over that period and
> returned to [ ] in the following term. »*

## Section 3 — Supportive information

> *Anything else about the applicant that supports their application.*

Le cœur de la référence. Quatre à huit phrases, sur la discipline visée uniquement.

- **Aptitude académique dans la matière** : ce que l''élève fait que les autres ne font pas.
  Un exemple précis vaut dix adjectifs. *« In a class discussion on [ ], he challenged [ ] and
  produced an argument I had not encountered from a student at this level. »*
- **Manière de travailler** : autonomie, réaction à un problème sans méthode donnée, tenue dans
  la durée. C''est ce que l''entretien d''Oxbridge testera.
- **Travail au-delà du programme**, en lien avec la discipline : lectures, cours en ligne,
  concours, projet. Nommer les titres et les résultats.
- **Adéquation au cursus visé** : pourquoi ce programme, et pas la discipline en général.
- Cohérence avec les *predicted grades* : la référence doit soutenir la prédiction, pas la contredire.

## Predicted grades

Déposés séparément, mais indissociables de la référence.

| | Predicted |
|---|---|
| Overall Baccalauréat average | *[ ]* /20 |
| Spécialité 1 — *[matière]* | *[ ]* /20 |
| Spécialité 2 — *[matière]* | *[ ]* /20 |
| Mathématiques Expertes *[le cas échéant]* | *[ ]* /20 |
| Expected *mention* | *[Très Bien / Bien]* |

> **L''équilibre à tenir.** Une prédiction inférieure à l''offre type rend la candidature
> irrecevable : le tuteur ne fait pas d''offre à un élève qu''on annonce en dessous de sa
> condition. Une prédiction irréaliste, elle, se paie l''année suivante sur la crédibilité de
> l''établissement auprès des mêmes universités. La prédiction juste est celle que l''élève peut
> atteindre s''il tient son année.

Exigences des cursus visés, pour information : *[Carmine remplit ce tableau à partir des fiches
université, avec la source et le millésime de chacune.]*

| University | Course | Typical offer | French equivalent published |
|---|---|---|---|
| | | | |

---

*Nom, fonction, date.*', 'Trois réponses distinctes dans le portail UCAS, plus les notes prédites. Remise trois semaines avant l''échéance.', 'etablissement', 'piece')
on conflict (code) do update set titre = excluded.titre, contenu = excluded.contenu, consignes = excluded.consignes, type = excluded.type, pour_type_tache = excluded.pour_type_tache, version = carmine_trames.version + 1;

insert into carmine_trames (code, titre, contenu, consignes, type, pour_type_tache)
values ('ETAB-EVAL-PROF', 'Fiche pour le professeur recommandeur (États-Unis)', '# Évaluation par un professeur — États-Unis

À remettre au professeur sollicité, avec la fiche de synthèse de l''élève. Ce document
**explique** ce qui lui est demandé ; il ne rédige rien à sa place. La lettre est la sienne :
un texte écrit par un tiers se repère, et sur un dossier américain, faire écrire une
recommandation par quelqu''un d''autre est une fausse déclaration.

> **Ce que Carmine fait** : cette fiche, la synthèse sur l''élève, le suivi des relances.
> **Ce que le professeur fait** : il note, il écrit, il dépose lui-même dans la Common App.
> **Ce que la famille fait** : elle sollicite, elle remercie, elle ne relit pas.

---

## Ce qui vous est demandé, concrètement

Vous recevrez un courriel de la *Common Application* vous invitant à créer un compte de
*recommender*. Deux choses vous y attendent :

1. **Une grille de notation** : seize qualités à situer sur une échelle.
2. **Une lettre**, entre 400 et 800 mots.

Deux points de calendrier : la lettre est attendue **avant le [date, trois semaines avant
l''échéance]**, et l''élève ne pourra jamais la lire — il a signé une renonciation à ce droit,
qui est la norme et qui donne sa valeur à votre texte.

## La lettre américaine n''est pas une appréciation française

C''est le point qui surprend le plus. Une appréciation de bulletin évalue un résultat en deux
lignes. Une lettre américaine **raconte un élève** :

| Appréciation française | Lettre américaine |
|---|---|
| Deux à quatre lignes | 400 à 800 mots |
| Le niveau atteint | La manière de travailler, la trajectoire |
| Sobre, impersonnelle | Narrative, avec des scènes précises |
| Pas de comparaison | La comparaison est attendue : « parmi les cinq meilleurs élèves rencontrés en vingt ans » |
| Retenue dans l''éloge | La retenue française est lue comme une réserve |

Ce dernier point est le plus coûteux. Un lecteur américain compare votre lettre à des lettres
écrites dans une culture où l''éloge est la norme. Une lettre française mesurée, sincèrement
positive, y est lue comme tiède. Dire ce que vous pensez vraiment, pleinement, n''est pas de
la flatterie : c''est la seule manière d''être compris.

## La grille de notation, traduite

Chaque qualité se situe sur : *Below average · Average · Good (above average) · Very good (well
above average) · Excellent (top 10 %) · Outstanding (top 5 %) · One of the top few I have
encountered in my career*. Vous pouvez laisser une ligne vide si vous n''avez pas d''avis.

| En anglais | Ce que ça recouvre |
|---|---|
| Academic achievement | Le niveau atteint dans votre matière |
| Intellectual promise | Ce dont il ou elle sera capable, pas seulement ce qui est acquis |
| Quality of writing | Clarté et rigueur de l''écrit |
| Creative, original thought | Approche personnelle d''un problème |
| Productive class discussion | Ce que sa présence apporte au groupe |
| Respect accorded by faculty | Le regard des collègues |
| Disciplined work habits | Régularité, méthode |
| Maturity | |
| Motivation | |
| Leadership | Entraînement des autres, pas nécessairement un titre |
| Integrity | |
| Reaction to setbacks | Réaction à un échec ou à une difficulté |
| Concern for others | |
| Self-confidence | |
| Initiative, independence | Travail sans consigne |
| Overall | L''appréciation d''ensemble |

**Le repère qui compte** : la référence est votre carrière entière, pas la classe de cette
année. « Top 5 % » signifie top 5 % des élèves que vous avez enseignés.

## La lettre : ce qui la rend utile

- **Une ou deux scènes précises.** Le jour où il a contesté un résultat au tableau et avait
  raison. La question posée en cours qui a ouvert une demi-heure de discussion. La copie où
  il a pris un chemin que vous n''attendiez pas. C''est ce dont un lecteur se souvient.
- **Une trajectoire.** D''où il partait, où il en est. Une progression nette raconte mieux
  qu''un niveau élevé et constant.
- **Une difficulté surmontée**, si vous en avez vu une.
- **Une comparaison explicite** avec les élèves de votre carrière.
- **Le lien avec le cursus visé** : *[discipline visée par l''élève]*.

À éviter : reprendre la liste d''activités, que le dossier contient déjà ; les généralités
(« élève sérieux et travailleur ») ; les qualités que vous n''avez pas observées vous-même.

## Langue

L''anglais est préférable. Si vous écrivez en français, prévenez-nous : nous faisons traduire
par un traducteur assermenté, et c''est votre texte français qui fait foi. N''utilisez pas de
traduction automatique.

## Pour vous faciliter le travail

Vous trouverez avec cette fiche une synthèse préparée par l''élève : son parcours, ses projets,
les cursus visés, ce qu''il retient de votre cours. Elle est là pour vous rafraîchir la mémoire.
Ce n''est pas un texte à reprendre, et rien ne vous oblige à en tenir compte.

---

*Merci du temps que vous accordez à ce dossier. Il compte davantage que l''élève ne l''imagine.*', 'À remettre au professeur avec la fiche de synthèse de l''élève. Il note, il écrit, il dépose lui-même.', 'etablissement', 'piece')
on conflict (code) do update set titre = excluded.titre, contenu = excluded.contenu, consignes = excluded.consignes, type = excluded.type, pour_type_tache = excluded.pour_type_tache, version = carmine_trames.version + 1;

insert into carmine_trames (code, titre, contenu, consignes, type, pour_type_tache)
values ('ETAB-LETTRE-ORIENTATION', 'Lettre du responsable d''orientation (États-Unis)', '# Lettre du responsable d''orientation — États-Unis

La Common Application attend une lettre du *school counselor*. Un lycée français n''a pas de
counselor : le rôle revient au chef d''établissement, au professeur principal ou au référent
orientation. C''est cette personne qui écrit, et elle seule.

> **Ce que Carmine fait** : cette trame, le profil d''établissement, la synthèse sur l''élève,
> le suivi jusqu''au dépôt.
> **Ce que l''établissement fait** : il rédige, il signe, il dépose.
> **La limite** : écrire cette lettre à la place de l''établissement est une fausse déclaration
> sur un dossier américain, au même titre qu''une signature apposée par un tiers.

**Échéances :** 1er novembre pour les candidatures anticipées, 1er janvier pour le tour
ordinaire. Remise souhaitée **trois semaines avant**. Un même responsable traite souvent
plusieurs élèves : s''y prendre dès septembre.

---

## Ce qu''elle dit, et que la lettre d''un professeur ne dit pas

Le professeur parle de sa matière. Le responsable d''orientation parle de **l''élève dans son
établissement** : sa place dans la promotion, son parcours, son contexte, la cohérence de son
projet. C''est la seule voix du dossier qui puisse comparer l''élève à tous les autres.

Longueur : 400 à 700 mots. Anglais de préférence, sinon français avec traduction assermentée.

## 1. La place dans la promotion

Le paragraphe le plus lu. Il transforme des notes en information.

- Rang ou décile, ou à défaut une formulation comparative claire : *« among the top five
  students of a year group of 180 »*.
- Rappel de l''échelle de notation, même si le profil d''établissement le dit déjà :
  *« on our 0–20 scale, 16 is excellent and marks above 18 are exceptional »*.
- Difficulté du cursus choisi : spécialités, options avancées, section internationale.
  Préciser si l''élève a pris la combinaison la plus exigeante que l''établissement propose.

## 2. Le parcours dans l''établissement

- Depuis quand il ou elle y est scolarisé.
- Évolution sur trois ans : ce qui a changé, quand, pourquoi.
- Responsabilités tenues, initiatives prises **dans** l''établissement : club fondé, délégué,
  projet mené. C''est ici que ces éléments comptent, pas dans la lettre du professeur.

## 3. Le contexte

Ce que les notes ne montrent pas et qui les explique.

- Circonstances familiales, médicales, matérielles, si elles ont eu un effet.
- Expatriation, changement de système scolaire, langue d''enseignement.
- Ce que l''élève a fait de ces circonstances.

*[Ne rien écrire ici qui n''ait été convenu avec la famille. Une circonstance révélée sans
accord est une faute.]*

## 4. Le caractère

Deux ou trois phrases sur la personne, avec un exemple observé. Comment il se comporte quand
personne ne le note. Ce que ses camarades disent de lui. Ce qui reste quand on retire les
résultats.

## 5. La cohérence du projet

Pourquoi ce cursus, dans ce pays, pour cet élève, vu de l''établissement. Un lecteur d''admission
vérifie que le projet n''est pas celui des parents.

## 6. Formule de recommandation

Une phrase nette, en dernier paragraphe. L''absence de recommandation explicite est remarquée.

*« I recommend [name] without reservation. »* — et si c''est vrai : *« [Name] is among the
strongest candidates I have supported for study abroad. »*

---

## Ce qui accompagne cette lettre

Le responsable d''orientation dépose aussi, dans le même espace :

1. **Le relevé de notes officiel** (troisième, seconde, première, puis mi-année de terminale),
   traduit par un traducteur assermenté. *[Carmine vérifie la correspondance des intitulés et
   de l''échelle ; nous ne traduisons pas.]*
2. **Le profil d''établissement** (*School Profile*), trame fournie séparément.
3. **Le rapport de mi-année** (*Mid-Year Report*), en février.

---

*Nom, fonction, établissement, date.*', 'Écrite et déposée par le chef d''établissement ou le professeur principal. Jamais par le cabinet.', 'etablissement', 'piece')
on conflict (code) do update set titre = excluded.titre, contenu = excluded.contenu, consignes = excluded.consignes, type = excluded.type, pour_type_tache = excluded.pour_type_tache, version = carmine_trames.version + 1;

select count(*) as trames_etablissement from carmine_trames where type = 'etablissement';
