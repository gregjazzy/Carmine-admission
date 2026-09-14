insert into carmine_guides (cle, audience, langue, titre, statut, valide_le, contenu) values
('jalon:A-0B', 'famille', 'fr', 'Bulletins depuis la troisième', 'valide', now(),
'## Ce que nous attendons de vous

Les bulletins de chaque trimestre depuis la troisième, tels que le lycée les édite. Ils servent à une seule chose au départ : situer l''élève avec justesse dans la note de positionnement, face aux profils réellement admis dans les cibles visées. Sans eux, la note raisonne à l''aveugle.

## Pourquoi depuis la troisième

- **Les universités américaines** lisent le relevé sur quatre ans : elles demandent les notes de la troisième à la terminale, et jugent la progression autant que le niveau.
- **Les universités britanniques et les prépas** regardent la régularité : une trajectoire qui monte vaut plus qu''une bonne année isolée.
- **Le rang de classe**, quand le lycée l''indique, pèse plus qu''une moyenne : une note de 15 dans une classe où la moyenne est à 11 se lit autrement qu''un 15 dans une classe à 14.

## Quoi déposer

- Troisième : les trois trimestres.
- Seconde : les trois trimestres.
- Première : chaque trimestre à mesure qu''il sort.
- Le rang de classe s''il figure, les appréciations des professeurs, la moyenne de la classe si elle est donnée. Ne retirez rien : les appréciations comptent.

Un fichier par bulletin ou un seul PDF regroupé, comme vous voulez. Photo lisible acceptée si vous n''avez pas le PDF ; le lycée peut aussi les rééditer depuis Pronote ou École Directe, rubrique bulletins, bouton d''export.

## Où

Dans votre espace, sur cette étape : ouvrez-la, puis « Déposer une pièce » en bas du panneau. Recommencez pour chaque fichier. Dès qu''un premier bulletin est déposé, l''étape passe « faite » ; vous pouvez continuer à en ajouter ensuite, notamment chaque nouveau trimestre.

## Ce qu''il ne faut pas faire

- Ne pas attendre d''avoir tout : déposez ce que vous avez, le reste suivra.
- Ne pas résumer les notes dans un message : c''est le document du lycée qui compte, il sera transmis tel quel aux universités en temps voulu.
- Ne pas traduire : nous nous en chargeons quand une université l''exige.

## Quand

Sous sept jours après l''ouverture de votre espace, avant la note de positionnement. Puis chaque trimestre, dans la semaine qui suit la sortie du bulletin.

## Ce qui se passe ensuite

Nous lisons chaque trimestre : moyennes, rang, spécialités, progression, appréciations. La note de positionnement en tire, cible par cible, où en est l''élève et ce qu''il reste à construire. Les bulletins suivants nourrissent les points d''étape, puis les dossiers de candidature eux-mêmes, où le lycée les transmettra officiellement.'),

('jalon:A-0B', 'famille', 'en', 'School reports since Year 10', 'valide', now(),
'## What we need from you

The report for every term since Year 10 (troisième), as the school issues it. At the start they serve one purpose: placing the student accurately in the positioning note, against the profiles actually admitted to the targets. Without them, the note reasons blind.

## Why since Year 10

- **American universities** read the transcript over four years: they ask for grades from Year 10 to the final year, and judge progression as much as level.
- **British universities and preparatory classes** look at consistency: a rising trajectory is worth more than one good year in isolation.
- **Class rank**, when the school gives it, weighs more than an average: a 15 in a class averaging 11 reads differently from a 15 in a class at 14.

## What to upload

- Year 10: all three terms.
- Year 11: all three terms.
- Year 12: each term as it comes out.
- The class rank if shown, the teachers'' comments, the class average if given. Remove nothing: the comments matter.

One file per report or a single combined PDF, as you prefer. A legible photo is fine if you have no PDF; the school can also re-issue them from Pronote or École Directe, reports section, export button.

## Where

In your area, on this step: open it, then “Upload a document” at the bottom of the panel. Repeat for each file. As soon as a first report is uploaded, the step is marked done; you can keep adding afterwards, especially each new term.

## What not to do

- Do not wait to have everything: upload what you have, the rest will follow.
- Do not summarise the grades in a message: the school''s document is what counts, and it will be sent as is to universities when the time comes.
- Do not translate: we handle that when a university requires it.

## When

Within seven days of your area opening, before the positioning note. Then every term, in the week after the report comes out.

## What happens next

We read each term: averages, rank, subjects, progression, comments. The positioning note draws from them, target by target, where the student stands and what remains to be built. Later reports feed the progress notes, then the applications themselves, where the school will send them officially.')
on conflict (cle, audience, langue) do update set titre = excluded.titre, contenu = excluded.contenu, statut = excluded.statut, valide_le = excluded.valide_le;
