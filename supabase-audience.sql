-- Mesure d'audience maison : ce que font les visiteurs une fois sur le site.
--
-- Search Console s'arrête à la porte : il voit le clic dans Google, pas ce qui
-- suit. Cette table recueille la suite, page par page, sans cookie.
--
-- Deux identifiants tirés au hasard, jamais un nom ni une adresse :
--   visite   — par onglet (sessionStorage), le parcours d'une venue ;
--   visiteur — par navigateur (localStorage), pour reconnaître qu'une même
--              famille revient d'un jour à l'autre avant d'écrire.
-- Le formulaire de contact transmet le visiteur au relais d'envoi, qui met
-- dans le mail un lien vers ce parcours (page /audience). Greg a l'accord de
-- la CNIL pour ce rapprochement (9 oct. 2026). Conservation : 25 mois, purgés
-- à l'ouverture de la page Audience.
--
-- À lancer une fois dans l'éditeur SQL de Supabase. Rejouable sans dégât.

create table if not exists carmine_audience (
  id          bigint generated always as identity primary key,
  cree_le     timestamptz not null default now(),
  visite      text not null check (char_length(visite) between 8 and 40),
  visiteur    text check (char_length(visiteur) between 8 and 40),
  type        text not null check (type in ('vue', 'clic', 'formulaire', 'sortie')),
  page        text not null check (char_length(page) <= 300),
  provenance  text check (char_length(provenance) <= 300),
  cible       text check (char_length(cible) <= 300),
  libelle     text check (char_length(libelle) <= 200),
  duree       integer check (duree between 0 and 86400),
  profondeur  smallint check (profondeur between 0 and 100),
  langue      text check (char_length(langue) <= 20),
  appareil    text check (appareil in ('mobile', 'tablette', 'ordinateur')),
  fuseau      text check (char_length(fuseau) <= 60)
);

create index if not exists carmine_audience_cree_le on carmine_audience (cree_le);
create index if not exists carmine_audience_visite on carmine_audience (visite);

-- Rejouable sur une table déjà créée sans la colonne visiteur.
alter table carmine_audience add column if not exists visiteur text check (char_length(visiteur) between 8 and 40);
create index if not exists carmine_audience_visiteur on carmine_audience (visiteur);

alter table carmine_audience enable row level security;

-- Le navigateur du visiteur écrit, sans pouvoir relire : l'horodatage est
-- celui du serveur, et seul l'administrateur lit et purge.
grant insert on carmine_audience to anon, authenticated;
grant select, delete on carmine_audience to authenticated;
grant usage on sequence carmine_audience_id_seq to anon, authenticated;

drop policy if exists "tout visiteur écrit sa mesure" on carmine_audience;
create policy "tout visiteur écrit sa mesure" on carmine_audience
  for insert to anon, authenticated
  with check (cree_le > now() - interval '5 minutes' and cree_le < now() + interval '5 minutes');

drop policy if exists "admin lit l'audience" on carmine_audience;
create policy "admin lit l'audience" on carmine_audience
  for select using (carmine_is_admin());

drop policy if exists "admin purge l'audience" on carmine_audience;
create policy "admin purge l'audience" on carmine_audience
  for delete using (carmine_is_admin());
