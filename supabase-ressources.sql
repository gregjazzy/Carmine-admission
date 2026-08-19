-- ═══════════════════════════════════════════════════════════════════════════
--  Ressources — qualification des prospects et journal des téléchargements
--
--  Une ressource « contre compte » s'obtient en deux temps indolores :
--  l'email à la création du compte, puis — au premier téléchargement —
--  prénom, nom et classe de l'élève. La classe est le champ en or : elle
--  dit l'horizon du projet, donc qui appeler d'abord.
--
--  Le journal des téléchargements dit qui a pris quoi et quand : c'est le
--  fichier de prospection, lisible du pilotage.
--
--  À exécuter dans l'éditeur SQL du projet Supabase.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Qualification : qui est derrière le compte ─────────────────────────────

create table if not exists carmine_contacts (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,                          -- copie, pour le pilotage
  first_name text not null,
  last_name  text not null,
  -- classe de l'élève concerné — le champ qui dit l'horizon du projet
  classe     text not null check (classe in (
    'sixieme', 'cinquieme', 'quatrieme', 'troisieme',
    'seconde', 'premiere', 'terminale', 'post-bac'
  )),
  created_at timestamptz not null default now()
);

alter table carmine_contacts enable row level security;

drop policy if exists "contacts: lire le sien" on carmine_contacts;
create policy "contacts: lire le sien"
  on carmine_contacts for select
  using (
    user_id = auth.uid()
    or exists (select 1 from carmine_profiles p
               where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "contacts: créer le sien" on carmine_contacts;
create policy "contacts: créer le sien"
  on carmine_contacts for insert
  with check (user_id = auth.uid());

drop policy if exists "contacts: modifier le sien" on carmine_contacts;
create policy "contacts: modifier le sien"
  on carmine_contacts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Journal des téléchargements ────────────────────────────────────────────
-- Écrit par la fonction de livraison (clé service) : le navigateur ne peut
-- pas s'attribuer des téléchargements, ni en lire d'autres que les siens.

create table if not exists carmine_downloads (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  ressource  text not null,                 -- ex. « guide-ecg »
  created_at timestamptz not null default now()
);

create index if not exists carmine_downloads_user
  on carmine_downloads (user_id, created_at);

alter table carmine_downloads enable row level security;

drop policy if exists "downloads: lire les siens" on carmine_downloads;
create policy "downloads: lire les siens"
  on carmine_downloads for select
  using (
    user_id = auth.uid()
    or exists (select 1 from carmine_profiles p
               where p.id = auth.uid() and p.role = 'admin')
  );

-- Pas de politique insert : seule la clé service écrit ici.
