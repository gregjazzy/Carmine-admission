create table if not exists carmine_comptes_rendus (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid references carmine_students on delete set null,
  source       text not null default 'parent' check (source in ('parent', 'appel', 'prospect')),
  texte        text not null,
  proposition  jsonb,
  applique_le  timestamptz,
  cree_par     uuid references carmine_profiles,
  created_at   timestamptz not null default now()
);

create index if not exists carmine_comptes_rendus_eleve on carmine_comptes_rendus (student_id, created_at desc);

alter table carmine_comptes_rendus enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'carmine_comptes_rendus' and policyname = 'admin gère les comptes rendus') then
    create policy "admin gère les comptes rendus" on carmine_comptes_rendus
      for all using (carmine_is_admin()) with check (carmine_is_admin());
  end if;
end $$;

insert into carmine_trames (code, titre, contenu, consignes, type, pour_type_tache) values
('NOTE-SITUATION', 'Note de situation (interne)', '# Note de situation — [Prénom Nom]

## Où il en est
Classe, filières, lycée. Ce qui est fait, ce qui est commencé, ce qui manque, classe par classe depuis la prise en charge.

## Les six prochains mois
Les échéances irrattrapables, dans l''ordre, avec la date et ce qui doit être prêt avant.

## La liste
Les universités nommées, celles qui se contredisent entre elles ou avec le profil, celles dont la fiche manque.

## Questions à la famille
Les faits qu''elle seule détient : spécialités, bulletins et rang, qui a été sollicité au lycée, aide demandée, préférences.

## Vérifications Carmine
Ce que le cabinet vérifie lui-même avant l''appel : exigences de langue et de tests, choix de l''anticipé, retraits, socle de la liste.

## Ce que je propose de dire
Trois à cinq phrases, la position à tenir à l''appel.',
'Note interne, lue par le consultant avant un appel. Sobre, en français, sans formule de politesse. Chaque affirmation vient du compte rendu, du dossier ou du calendrier généré : ce qui manque est écrit « [à confirmer] », jamais deviné. Sépare toujours les questions à la famille, faits qu''elle seule détient, des vérifications qui reviennent à Carmine. On ne demande jamais à une famille ce qu''elle nous paie pour vérifier. Ne dramatise jamais une arrivée tardive : la terminale est un dossier à convertir.',
'livrable', null),

('REPONSE-PARENT', 'Réponse au parent après son message', 'Objet : [Prénom] — ce que je retiens, et la suite

Bonjour [Madame, Monsieur],

Merci pour votre message. Voici ce que j''en retiens sur la situation de [Prénom] : [deux à quatre phrases, factuelles].

Pour avancer, j''ai besoin de quelques précisions que vous seuls avez :
- [question 1]
- [question 2]
- [question 3]

De mon côté, je vérifie avant notre échange [ce que Carmine vérifie].

Les prochaines étapes qui vous concernent : [deux ou trois, tirées du calendrier, avec leur date].

Proposez-moi deux créneaux [cette semaine / la semaine prochaine].

Bien à vous,
Grégory',
'Email au parent, en français, vouvoiement, ton direct et chaleureux, sans jargon. Ce que tu as compris, les questions à clarifier sous forme de questions, les prochaines étapes tirées du calendrier généré. Jamais de méthode ni de diagnostic chiffré : ils relèvent du bilan de positionnement. Ne dramatise jamais une arrivée tardive. Réponds par l''objet sur la première ligne (« Objet : … »), une ligne vide, puis le corps. Rien d''autre.',
'email', null),

('NOTE-PROSPECT', 'Note à un prospect après son premier message', 'Objet : [Prénom] — ce qui se joue en [classe], et la suite

Bonjour [Prénom / Madame, Monsieur],

Merci pour votre message. Voici ce que je retiens : [trois ou quatre points concrets tirés du message].

Ce qui se joue à cette classe : [deux phrases, factuelles, sans dramatiser].

Les douze prochains mois, en grandes lignes : [trois à cinq échéances datées].

Ce qu''un accompagnement changerait : [deux ou trois phrases, concrètes, sans détailler la méthode].

[Proposition : bilan de positionnement, séance d''une heure, ce qu''on en repart.]

Proposez-moi deux créneaux.

Bien à vous,
Grégory',
'Email à un prospect, en français. Plus court que la réponse au parent. Calibré à sa classe. Nomme les risques, ne donne pas la méthode : les écarts chiffrés et le plan de rattrapage sont le bilan de positionnement, payant. La note doit donner envie du bilan, pas le remplacer. Ne dramatise jamais une arrivée tardive : la terminale est un client à convertir. Réponds par l''objet sur la première ligne (« Objet : … »), une ligne vide, puis le corps. Rien d''autre.',
'email', null),

('NOTE-RESUME-PARENTS', 'Note résumé aux parents', '# Point d''étape — [Prénom Nom], [date]

## Ce qui est fait
Depuis le dernier point, en trois à six lignes.

## Ce qui vient dans les trois mois
Les échéances, dans l''ordre, avec qui fait quoi.

## Ce que nous attendons de vous
Deux à quatre points, concrets, datés.

## Où en sont les universités
La liste, ce qui a bougé, ce qui reste à trancher.

## Un mot
Deux ou trois phrases, la position du cabinet.',
'Note publiée dans l''espace de la famille, en français, vouvoiement. Factuelle, tirée du dossier et des tâches. Rien de la méthode. Ne dramatise jamais. Ce qui manque est « [à confirmer] », jamais deviné.',
'livrable', null)
on conflict (code) do update set titre = excluded.titre, contenu = excluded.contenu, consignes = excluded.consignes, type = excluded.type, pour_type_tache = excluded.pour_type_tache, version = carmine_trames.version + 1;
