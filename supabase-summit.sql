-- ═══════════════════════════════════════════════════════════════════════════
--  Summit — comptes et progression
--
--  L'entraînement reste libre ; le compte sert à GARDER : profil de l'élève,
--  résultats de sessions, historique de scores. Un compte Summit est un compte
--  Carmine ordinaire (auth.users) : le même qui ouvrira les ressources, et
--  demain l'espace client.
--
--  La sécurité suit la règle de la maison : chacun ne lit et n'écrit que ses
--  propres données ; l'administrateur (carmine_profiles.role = 'admin') lit
--  tout — c'est ce qui alimente le pilotage.
--
--  À exécuter dans l'éditeur SQL du projet Supabase.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Profil d'élève Summit ──────────────────────────────────────────────────
-- Un compte = un élève. Le nom affiché et l'objectif de score vivent ici ;
-- l'adresse email reste dans auth.users.

create table if not exists summit_profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  name         text not null,
  emoji        text not null default '🎯',
  target_score integer check (target_score between 400 and 1600),
  created_at   timestamptz not null default now()
);

alter table summit_profiles enable row level security;

drop policy if exists "summit_profiles: lire son profil" on summit_profiles;
create policy "summit_profiles: lire son profil"
  on summit_profiles for select
  using (
    user_id = auth.uid()
    or exists (select 1 from carmine_profiles p
               where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "summit_profiles: créer son profil" on summit_profiles;
create policy "summit_profiles: créer son profil"
  on summit_profiles for insert
  with check (user_id = auth.uid());

drop policy if exists "summit_profiles: modifier son profil" on summit_profiles;
create policy "summit_profiles: modifier son profil"
  on summit_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Résultats de sessions ──────────────────────────────────────────────────
-- Une ligne par session terminée — test complet, entraînement par thème ou
-- Ivy League. Le détail des réponses est conservé tel que l'app le produit
-- (jsonb) : c'est lui qui nourrit rapports et statistiques, et il évolue avec
-- l'app sans migration.

create table if not exists summit_results (
  id           text primary key,            -- identifiant produit par l'app
  user_id      uuid not null references auth.users (id) on delete cascade,
  mode         text not null check (mode in ('practice-test', 'real-test', 'theme', 'ivy')),
  date         timestamptz not null,
  scaled       jsonb,                       -- { rw, math, total } pour un test complet
  theme        jsonb,                       -- filtres du mode thème
  answers      jsonb not null,              -- [{ questionId, given, correct, timeSec, flagged }]
  duration_sec integer not null default 0,
  completed    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists summit_results_user_date
  on summit_results (user_id, date);

alter table summit_results enable row level security;

drop policy if exists "summit_results: lire les siens" on summit_results;
create policy "summit_results: lire les siens"
  on summit_results for select
  using (
    user_id = auth.uid()
    or exists (select 1 from carmine_profiles p
               where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "summit_results: écrire les siens" on summit_results;
create policy "summit_results: écrire les siens"
  on summit_results for insert
  with check (user_id = auth.uid());

-- Pas de politique update/delete : un résultat de session ne se réécrit pas.
-- (L'app fait de l'insertion pure ; corriger une session n'a pas de sens.)
