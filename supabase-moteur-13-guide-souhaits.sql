insert into carmine_guides (cle, audience, langue, titre, statut, valide_le, contenu) values
('jalon:A-00', 'famille', 'fr', 'Vos souhaits : universités, pays, filières', 'valide', now(),
'## Ce que nous attendons de vous

Une liste, en vrac, de ce qui vous attire : des universités, des pays, des filières, des types d''établissement. Pas un classement, pas une décision. Le point de départ de la conversation. Nous la lisons face aux admissions réelles dans la note de positionnement, et nous en tirons ensemble la première liste d''universités envisagées.

## Où l''écrire

1. Dans votre espace, descendez jusqu''au bloc « Les universités qui vous intéressent ».
2. Tapez un nom dans le champ, cliquez « Ajouter ». Une ligne par idée.
3. Recommencez autant de fois que nécessaire. Vous pouvez retirer une ligne avec la croix.
4. L''élève fait de même avec son propre compte : ses idées comptent autant que les vôtres, même si elles diffèrent.

Il n''y a rien à valider ni à envoyer. Dès qu''une première ligne existe, l''étape passe « faite » de notre côté, et vous pouvez continuer à compléter la liste tout au long de l''année.

## Quoi écrire

- **Des universités**, même si vous n''êtes pas sûrs qu''elles soient accessibles : « Cambridge », « Imperial », « Bocconi », « McGill ». Un nom suffit, sans cursus.
- **Des pays ou des zones** : « Royaume-Uni », « Pays-Bas », « pas les États-Unis ».
- **Des filières ou des domaines** : « économie », « ingénierie », « prépa MPSI », « médecine au Royaume-Uni ».
- **Des types d''établissement** : « une grande prépa parisienne », « une université de campus », « une ville plutôt qu''un campus isolé ».
- **Ce que vous refusez** : « pas plus de trois heures de Paris », « pas de dépôt avant décembre », « budget plafonné ». Une ligne suffit.

Quelques exemples de lignes, pour l''échelle : « Cambridge, en sciences », « Une prépa à Toulouse ou Paris », « Pays-Bas, en anglais, si le budget tient », « Pas les États-Unis cette année », « Imperial, à voir ».

## Ce qu''il ne faut pas faire

- Ne pas se limiter à ce que vous croyez atteignable : c''est notre travail de le mesurer, et nous le ferons chiffres en main.
- Ne pas chercher le cursus exact, la bonne orthographe ou le site officiel. Un nom approximatif suffit, nous le reconnaissons.
- Ne pas attendre d''être d''accord en famille : écrivez chacun les vôtres, y compris ceux qui divergent. Les divergences sont utiles, elles se discutent en séance.

## Quand

Sous dix jours après l''ouverture de votre espace, avant la note de positionnement. Après, la liste reste ouverte : chaque ajout est vu à la séance suivante.

## Ce qui se passe ensuite

Nous lisons chaque ligne face aux exigences publiées et aux profils réellement admis. La note de positionnement dit lesquelles sont crédibles aujourd''hui, lesquelles le deviennent avec un travail précis, et lesquelles ne le sont pas, en le justifiant. Puis nous arrêtons ensemble la première liste d''universités envisagées, celle qui déclenche le calendrier détaillé, université par université, dans votre espace.'),

('jalon:A-00', 'famille', 'en', 'Your wishes: universities, countries, courses', 'valide', now(),
'## What we need from you

A rough list of what appeals to you: universities, countries, courses, kinds of institution. Not a ranking, not a decision. The starting point of the conversation. We read it against real admissions in the positioning note, and from it we build together the first list of universities under consideration.

## Where to write it

1. In your area, scroll down to the block “Universities you are drawn to”.
2. Type a name in the field, click “Add”. One line per idea.
3. Repeat as often as you need. A line can be removed with the cross.
4. The student does the same from their own account: their ideas count as much as yours, even when they differ.

There is nothing to validate or send. As soon as a first line exists, the step is marked done on our side, and you can keep adding to the list throughout the year.

## What to write

- **Universities**, even if you are unsure they are within reach: “Cambridge”, “Imperial”, “Bocconi”, “McGill”. A name is enough, no course needed.
- **Countries or regions**: “United Kingdom”, “Netherlands”, “not the United States”.
- **Courses or fields**: “economics”, “engineering”, “MPSI preparatory class”, “medicine in the UK”.
- **Kinds of institution**: “a top Paris preparatory class”, “a campus university”, “a city rather than an isolated campus”.
- **What you rule out**: “no more than three hours from Paris”, “no application before December”, “capped budget”. One line is enough.

A few example lines, for scale: “Cambridge, in sciences”, “A preparatory class in Toulouse or Paris”, “Netherlands, in English, if the budget holds”, “Not the United States this year”, “Imperial, to be seen”.

## What not to do

- Do not restrict yourself to what you believe is reachable: measuring that is our job, and we will do it with the figures in hand.
- Do not look for the exact course, the right spelling or the official website. An approximate name is enough, we will recognise it.
- Do not wait to agree as a family: each of you writes your own, including the ones that differ. Differences are useful, they get discussed in session.

## When

Within ten days of your area opening, before the positioning note. After that, the list stays open: every addition is seen at the next session.

## What happens next

We read each line against the published requirements and the profiles actually admitted. The positioning note says which are credible today, which become so with specific work, and which are not, with the reasons. Then we settle together the first list of universities under consideration, the one that triggers the detailed calendar, university by university, in your area.')
on conflict (cle, audience, langue) do update set titre = excluded.titre, contenu = excluded.contenu, statut = excluded.statut, valide_le = excluded.valide_le;
