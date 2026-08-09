-- Les douze modèles de lettres quittent le disque pour la base, où ils sont
-- versionnés, sauvegardés, et réservés à l'administration par les RLS.
insert into carmine_trames (code, titre, contenu) values
  ('LET-RECO-PROF', 'Demande de lettre de recommandation à un professeur (FR)', '## 1. Demande de lettre de recommandation à un professeur (FR)

> À envoyer **avant les vacances d''été de la 1re**. Un professeur sollicité en septembre écrit une
> lettre générique ; sollicité en mai, il l''écrit avec du recul.

**Objet : Demande de lettre de recommandation — candidature universitaire à l''étranger**

Madame / Monsieur [Nom],

Je prépare une candidature pour la rentrée [année] dans des universités [britanniques / américaines
/ européennes], et je souhaiterais vous demander si vous accepteriez d''écrire une lettre de
recommandation en ma faveur.

Je me tourne vers vous parce que [raison précise et sincère : « votre cours de spécialité
mathématiques a été le déclencheur de mon intérêt pour l''optimisation, et le travail que j''ai mené
sur [sujet] est directement né de vos séances sur [thème] »]. Vous êtes l''une des rares personnes à
pouvoir décrire ma manière de travailler sur la durée, et pas seulement mes résultats.

Pour vous faciliter la tâche, je joins un document de synthèse : mes projets, mon parcours, les
cursus visés et les qualités que les universités attendent de ce type de lettre. Je reste
naturellement disponible pour en discuter.

Les lettres sont attendues pour le [date, avec 3 semaines de marge]. Si vous préférez ne pas donner
suite, je le comprendrai tout à fait et vous remercie de me le dire simplement.

Avec mes remerciements sincères,
[Prénom Nom] — classe de [classe]

---'),
  ('LET-BRAG', 'Brag sheet — fiche à remettre au recommandeur', '## 2. Brag sheet — fiche à remettre au recommandeur

> Document d''une à deux pages. Il ne s''agit pas de dicter la lettre, mais de donner de la matière
> concrète et vérifiable.

```
FICHE DE SYNTHÈSE — [Prénom Nom], [classe], [établissement]

CURSUS VISÉS
· Discipline : [ ]
· Universités : [ ]
· Type de lettre attendu : [voir note en bas]

DANS VOTRE COURS
· Notes / évolution : [ ]
· Deux moments précis où je me suis distingué : [ex. : l''exposé sur X ; la question que j''ai
  posée sur Y qui a ouvert une discussion ; mon insistance à refaire le TP Z]
· Une difficulté que j''ai surmontée : [ ]

EN DEHORS DU COURS, EN LIEN AVEC LA DISCIPLINE
· Lectures / MOOCs / recherches : [ ]
· Projets, concours, olympiades, publications : [ ]
· Responsabilités et initiatives : [ ]

CE QUE LA LETTRE DEVRAIT IDÉALEMENT MONTRER
· [ex. : capacité à travailler seul sur un problème ouvert]
· [ex. : progression réelle, pas un niveau donné]
· [ex. : effet sur le groupe classe]

CALENDRIER
· Date limite : [ ] · Modalité d''envoi : [portail / signature / cachet]
```

> **Note à joindre pour le professeur** — différence essentielle :
> - **Lettre pour le Royaume-Uni (UCAS)** : une seule référence, factuelle, centrée sur l''aptitude
>   académique dans la discipline et les *predicted grades*. Le registre personnel n''y a pas sa place.
> - **Lettre pour les États-Unis** : lettre personnelle, narrative, avec des anecdotes. On attend un
>   portrait, des exemples précis, une comparaison avec les autres élèves rencontrés dans la carrière.

---'),
  ('LET-PRED-GRADES', 'Demande de predicted grades et de reference UCAS à l''établissement (FR)', '## 3. Demande de predicted grades et de reference UCAS à l''établissement (FR)

**Objet : Candidature UCAS de [Prénom Nom] — predicted grades et référence, échéance du [date]**

Madame / Monsieur [Proviseur / Référent orientation],

[Prénom] candidate cette année via UCAS à [nombre] universités britanniques, dont [Oxford /
Cambridge], dont la date limite est fixée au **[15 octobre, 18h heure britannique]** — sans
tolérance de retard.

Le dossier requiert de l''établissement deux éléments :

1. **Les predicted grades** — une estimation des notes attendues au baccalauréat, par matière de
   spécialité et en moyenne générale. Les universités visées attendent typiquement [ex. : mention
   Très Bien avec 17-18/20 dans les spécialités mathématiques et physique-chimie]. Ces notes
   conditionnent l''offre : une prédiction trop basse rend la candidature non recevable, une
   prédiction irréaliste fragilise la crédibilité de l''établissement.

2. **La référence** — un texte unique et structuré, portant sur (a) l''établissement et son contexte,
   (b) les circonstances particulières éventuelles, (c) l''aptitude de l''élève à suivre le cursus visé.

Je joins une fiche de synthèse sur le parcours de [Prénom] ainsi qu''une trame de référence conforme
au format UCAS en vigueur. Nous nous tenons à votre disposition pour un échange.

Afin de sécuriser l''échéance, pourrions-nous convenir d''une remise pour le **[date : 15 octobre
moins 3 semaines]** ?

Avec mes remerciements,
[Nom] — [Carmine Admission / le parent]

---'),
  ('LET-INFO-ADM', 'Demande d''information à un service des admissions (EN)', '## 4. Demande d''information à un service des admissions (EN)

> Sobre, spécifique, jamais une question dont la réponse est sur le site. Un email inutile laisse
> une trace inutile.

**Subject: French Baccalauréat applicant — [Course name] entry requirements**

Dear Admissions Team,

I am a French student applying for entry in [year] to [course] at [university].

I hold the French Baccalauréat with the [Mathematics and Physics-Chemistry] specialisms, plus
[Mathématiques Expertes]. Your published entry requirements list [quote the exact requirement].
I would be grateful for clarification on one point: [one precise question the website does not
answer — e.g. whether Mathématiques Expertes is treated as equivalent to Further Mathematics A-level
for this course].

Thank you for your time.

Kind regards,
[Full name] — [School], [City], France

---'),
  ('LET-LOCI-REPORT', 'Letter of Continued Interest — after a deferral (EN)', '## 5. Letter of Continued Interest — after a deferral (EN)

> À envoyer **mi-janvier à début février**, jamais dans les jours suivant le report. 250-400 mots.
> Une seule par université. Elle n''a de valeur que si elle apporte du **neuf**.

**Subject: Continued Interest — [Full name], Applicant ID [number]**

Dear [Admissions Officer / Office of Admissions],

Thank you for the continued consideration of my application to [University]. I am writing to
confirm that [University] remains my first choice, and to share developments since I applied in
November.

Academically, my first-term results are [precise: rank, grades, e.g. "17.8/20 overall, with 19/20
in Mathématiques Expertes"], and I have since [new, verifiable achievement — a competition result, a
completed research project, a publication, a new responsibility].

[One short paragraph — three or four sentences — on something specific to this university that has
become more concrete for you since applying: a course you have since read into, a faculty member
whose work you followed up, a programme you attended. Name it precisely. Generic praise is worse
than nothing.]

If admitted, I will enrol. I would be glad to provide any further information the committee may find
useful.

With thanks for your time,
[Full name]
[Applicant ID] · [School] · [Email]

---'),
  ('LET-LOCI-ATTENTE', 'Letter of Continued Interest — waitlist (EN)', '## 6. Letter of Continued Interest — waitlist (EN)

**Subject: Waitlist — Continued Interest, [Full name], ID [number]**

Dear [Admissions Office],

Thank you for offering me a place on the waiting list for the Class of [year]. I am writing to
accept that place and to confirm that **[University] remains my first choice: if offered admission,
I will withdraw my other applications and enrol.**

Since submitting my application, [new achievement, one or two sentences, verifiable].
My final-year results are [grades].

[Two or three sentences, highly specific, on why this university and no other — a course sequence, a
lab, a programme structure you cannot find elsewhere.]

I understand the waiting list offers no guarantee, and I am grateful simply to remain under
consideration. Please let me know if any further documents would be helpful.

Sincerely,
[Full name]

---'),
  ('LET-AIDE-APPEL', 'Financial aid appeal (EN)', '## 7. Financial aid appeal (EN)

> Ne jamais employer le mot *negotiate*. Le registre est celui de la révision d''un dossier au vu
> d''éléments nouveaux ou omis.

**Subject: Request for review of financial aid award — [Full name], ID [number]**

Dear Office of Financial Aid,

Thank you for the offer of admission and the accompanying aid award of [$amount] for [year].
[Student name] is delighted to have been admitted.

We are writing to ask whether the award might be reviewed in light of circumstances that the
application may not have fully captured:

- [Change in circumstances: reduction in income, job loss, medical expenses, currency devaluation,
  another child entering higher education — with figures]
- [Documentation attached: tax notice, employer letter, medical statements]

[If applicable, and only if factually true:] We have also received an award of [$amount] from
[comparable institution], and we are attaching that letter for reference.

[University] remains [student]''s clear first choice. Any reconsideration you are able to offer would
be genuinely decisive for us. We are happy to provide any further documentation.

With sincere thanks,
[Parent name] — on behalf of [Student name]

---'),
  ('LET-MERCI-ALUMNI', 'Thank-you note after an alumni interview (EN)', '## 8. Thank-you note after an alumni interview (EN)

> Sous 24 heures. Court. Trois à cinq phrases, pas davantage.

**Subject: Thank you — [Full name] interview, [date]**

Dear [Mr./Ms./Dr. Name],

Thank you for taking the time to speak with me [yesterday / on Tuesday]. I especially appreciated
what you said about [one precise thing they said — proof you listened], which has stayed with me
since.

Our conversation confirmed that [University] is where I want to spend the next four years.

Thank you again for your time and for your candour.

Best regards,
[Full name]

---'),
  ('LET-MENTORAT', 'Demande de mentorat ou de stage de recherche (FR/EN)', '## 9. Demande de mentorat ou de stage de recherche (FR/EN)

> Le levier le plus efficace pour faire passer un spike du Tier 3 au Tier 2. Taux de réponse faible
> — envoyer à 15-20 chercheurs, pas à 3. Décembre-janvier pour l''été suivant.

**Objet : Étudiant de première — proposition d''aide bénévole sur [sujet précis]**

Madame / Monsieur [Nom],

Je suis élève de première au lycée [nom], à [ville]. J''ai lu votre article « [titre exact] »
([revue, année]), et [une phrase montrant que vous l''avez réellement lu : une question précise, un
point qui vous a arrêté, un lien avec autre chose].

Je travaille depuis [durée] sur [projet personnel, décrit en une phrase concrète], et j''ai acquis
[compétences vérifiables : Python, statistiques, protocole expérimental, terrain].

Je me permets de vous écrire pour vous proposer mon aide, bénévolement, sur des tâches même très
modestes de votre travail — traitement de données, revue de littérature, travail de terrain — entre
[dates]. Je suis conscient que l''encadrement d''un lycéen représente un coût de temps ; je m''engage à
être autonome et à ne rien vous demander qui ne serve directement le laboratoire.

Je joins un CV d''une page et un résumé de mon projet. Merci du temps que vous voudrez bien accorder
à ce message.

Respectueusement,
[Prénom Nom]

---'),
  ('LET-RETRAIT-ED', 'Retrait des candidatures après une admission ED (EN)', '## 10. Retrait des candidatures après une admission ED (EN)

> Obligation contractuelle. À envoyer sous 48 h après l''admission ED, à **toutes** les autres
> universités.

**Subject: Application withdrawal — [Full name], ID [number]**

Dear Admissions Office,

I am writing to withdraw my application to [University] for [term/year]. I have been admitted under
a binding Early Decision agreement at another institution and will be enrolling there.

Thank you for the time and care given to my application.

Sincerely,
[Full name] · [Application ID] · [School]

---'),
  ('LET-GAP-YEAR', 'Demande de report d''admission — gap year (EN)', '## 11. Demande de report d''admission — gap year (EN)

> À demander **après** l''admission et le dépôt de l''acompte, jamais avant. La plupart des
> universités sélectives l''accordent si le projet est structuré ; certaines l''interdisent
> (les universités de Californie, notamment).

**Subject: Request to defer enrolment — [Full name], ID [number]**

Dear [Dean of Admissions / Admissions Office],

Thank you again for my place in the Class of [year]. I am writing to request permission to defer my
enrolment by one year, to [term, year].

I intend to use the year for [precise plan, structured, with dates: e.g. "a nine-month research
placement at [lab], followed by an intensive German course in Berlin to reach C1 before beginning my
degree"]. I have attached a short outline and confirmation from [organisation].

I confirm that I will not apply to, or enrol at, any other degree-granting institution during this
period, and I will keep the office informed of any change to these plans.

Thank you for considering this request.

Sincerely,
[Full name]

---'),
  ('LET-SUITE-SESSION', 'Email de suite après une visite ou une session d''information (EN)', '## 12. Email de suite après une visite ou une session d''information (EN)

> Sert le *demonstrated interest*, qui est un critère explicite dans plusieurs universités
> (Tufts, Chicago, Northeastern, BU, Case Western...). Une trace vaut mieux qu''aucune.

**Subject: Thank you — [Event name], [date]**

Dear [Name],

Thank you for the [information session / campus tour] on [date]. I came away with a much clearer
sense of [specific programme or structure — e.g. "how the open curriculum actually works in
practice, particularly the way concentration requirements interact with it"].

One question I did not get to ask: [a single, genuinely specific question].

I look forward to applying this autumn.

Best regards,
[Full name] · [School], [City], France')
on conflict (code) do update set
  titre = excluded.titre, contenu = excluded.contenu,
  version = carmine_trames.version + 1;
