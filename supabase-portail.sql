-- ═══════════════════════════════════════════════════════════════════════════
--  Portail Carmine Admission — schéma de base
--  À exécuter une fois dans Supabase : SQL Editor → coller → Run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Rôles ──────────────────────────────────────────────────────────────────
create type carmine_user_role as enum ('admin', 'parent');

create table carmine_profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  full_name   text,
  role        carmine_user_role not null default 'parent',
  created_at  timestamptz not null default now()
);

-- Crée automatiquement un profil à la première connexion.
create function carmine_handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into carmine_profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger carmine_on_auth_user_created
  after insert on auth.users
  for each row execute function carmine_handle_new_user();

-- Raccourci réutilisé par toutes les policies.
create function carmine_is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from carmine_profiles where id = auth.uid() and role = 'admin');
$$;

-- ── Dossiers élèves ────────────────────────────────────────────────────────
create type carmine_track as enum ('uk', 'us', 'eu');
create type carmine_class_key as enum
  ('sixieme','cinquieme','quatrieme','troisieme','seconde','premiere','terminale','apres');

create table carmine_students (
  id              uuid primary key default gen_random_uuid(),
  first_name      text not null,
  last_name       text not null,
  -- Classe à la prise en charge : sert à masquer les jalons déjà passés.
  entry_class     carmine_class_key not null,
  -- Classe actuelle, avancée chaque rentrée.
  current_class   carmine_class_key not null,
  -- Pivot de calcul des échéances : année civile de la rentrée de terminale.
  terminale_year  int not null,
  tracks          carmine_track[] not null default '{}',
  school          text,
  city            text,
  archived        boolean not null default false,
  created_at      timestamptz not null default now()
);

create table carmine_student_parents (
  student_id  uuid references carmine_students on delete cascade,
  profile_id  uuid references carmine_profiles on delete cascade,
  primary key (student_id, profile_id)
);

-- ── Jalons ─────────────────────────────────────────────────────────────────
create type carmine_milestone_status as enum ('a_faire', 'en_cours', 'fait', 'sans_objet');

create table carmine_student_milestones (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references carmine_students on delete cascade,
  -- Identifiant du référentiel (« D-08 »), défini dans src/data/milestones.ts.
  milestone_id  text not null,
  due_date      date not null,
  status        carmine_milestone_status not null default 'a_faire',
  -- Note interne, jamais visible des parents.
  private_note  text,
  -- Message affiché aux parents sur la fiche du jalon.
  public_note   text,
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique (student_id, milestone_id)
);

create index on carmine_student_milestones (student_id, due_date);
create index on carmine_student_milestones (due_date) where status in ('a_faire', 'en_cours');

create function carmine_touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'fait' and coalesce(old.status, 'a_faire') <> 'fait' then
    new.completed_at := now();
  elsif new.status <> 'fait' then
    new.completed_at := null;
  end if;
  return new;
end $$;

create trigger carmine_student_milestones_touch
  before update on carmine_student_milestones
  for each row execute function carmine_touch_updated_at();

-- ── Documents déposés ──────────────────────────────────────────────────────
create table carmine_documents (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references carmine_students on delete cascade,
  milestone_id  text,
  storage_path  text not null,
  filename      text not null,
  size_bytes    bigint,
  uploaded_by   uuid references carmine_profiles,
  created_at    timestamptz not null default now()
);

create index on carmine_documents (student_id, created_at desc);

-- ── Comptes rendus de séance ───────────────────────────────────────────────
create table carmine_session_notes (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references carmine_students on delete cascade,
  session_date  date not null default current_date,
  title         text not null,
  body          text not null,
  -- Un compte rendu reste privé tant qu'il n'est pas explicitement publié.
  visible_to_parents boolean not null default false,
  created_at    timestamptz not null default now()
);

create index on carmine_session_notes (student_id, session_date desc);

-- ── Journal des alertes (évite les doublons d'envoi) ───────────────────────
create table carmine_alert_log (
  id                   uuid primary key default gen_random_uuid(),
  student_milestone_id uuid not null references carmine_student_milestones on delete cascade,
  -- Seuil déclencheur, en jours avant échéance (0 = le jour même, négatif = retard).
  threshold_days       int not null,
  sent_at              timestamptz not null default now(),
  unique (student_milestone_id, threshold_days)
);

-- ═══════════════════════════════════════════════════════════════════════════
--  Sécurité — un parent ne voit que ses propres enfants.
-- ═══════════════════════════════════════════════════════════════════════════

alter table carmine_profiles           enable row level security;
alter table carmine_students           enable row level security;
alter table carmine_student_parents    enable row level security;
alter table carmine_student_milestones enable row level security;
alter table carmine_documents          enable row level security;
alter table carmine_session_notes      enable row level security;
alter table carmine_alert_log          enable row level security;

create policy "lire son profil" on carmine_profiles
  for select using (id = auth.uid() or carmine_is_admin());
create policy "modifier son profil" on carmine_profiles
  for update using (id = auth.uid() or carmine_is_admin());
create policy "admin gère les profils" on carmine_profiles
  for all using (carmine_is_admin()) with check (carmine_is_admin());

-- Un parent voit les élèves auxquels il est rattaché.
create policy "voir ses élèves" on carmine_students
  for select using (
    carmine_is_admin() or exists (
      select 1 from carmine_student_parents sp
      where sp.student_id = carmine_students.id and sp.profile_id = auth.uid()
    )
  );
create policy "admin gère les élèves" on carmine_students
  for all using (carmine_is_admin()) with check (carmine_is_admin());

create policy "voir ses rattachements" on carmine_student_parents
  for select using (profile_id = auth.uid() or carmine_is_admin());
create policy "admin gère les rattachements" on carmine_student_parents
  for all using (carmine_is_admin()) with check (carmine_is_admin());

create policy "voir les jalons de ses élèves" on carmine_student_milestones
  for select using (
    carmine_is_admin() or exists (
      select 1 from carmine_student_parents sp
      where sp.student_id = carmine_student_milestones.student_id and sp.profile_id = auth.uid()
    )
  );
create policy "admin gère les jalons" on carmine_student_milestones
  for all using (carmine_is_admin()) with check (carmine_is_admin());

-- Les parents peuvent déposer des carmine_documents, mais pas en supprimer.
create policy "voir les carmine_documents de ses élèves" on carmine_documents
  for select using (
    carmine_is_admin() or exists (
      select 1 from carmine_student_parents sp
      where sp.student_id = carmine_documents.student_id and sp.profile_id = auth.uid()
    )
  );
create policy "déposer un document" on carmine_documents
  for insert with check (
    carmine_is_admin() or exists (
      select 1 from carmine_student_parents sp
      where sp.student_id = carmine_documents.student_id and sp.profile_id = auth.uid()
    )
  );
create policy "admin gère les carmine_documents" on carmine_documents
  for all using (carmine_is_admin()) with check (carmine_is_admin());

-- Un compte rendu n'apparaît au parent qu'une fois publié.
create policy "voir les comptes rendus publiés" on carmine_session_notes
  for select using (
    carmine_is_admin() or (
      visible_to_parents and exists (
        select 1 from carmine_student_parents sp
        where sp.student_id = carmine_session_notes.student_id and sp.profile_id = auth.uid()
      )
    )
  );
create policy "admin gère les comptes rendus" on carmine_session_notes
  for all using (carmine_is_admin()) with check (carmine_is_admin());

create policy "admin seul sur le journal d'alertes" on carmine_alert_log
  for all using (carmine_is_admin()) with check (carmine_is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
--  Stockage des pièces justificatives
-- ═══════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('carmine-documents', 'carmine-documents', false)
on conflict (id) do nothing;

-- Les fichiers sont rangés sous « <student_id>/… ».
create policy "carmine — lire les documents" on storage.objects
  for select using (
    bucket_id = 'carmine-documents' and (
      carmine_is_admin() or exists (
        select 1 from carmine_student_parents sp
        where sp.profile_id = auth.uid()
          and sp.student_id::text = (storage.foldername(name))[1]
      )
    )
  );

create policy "carmine — déposer un document" on storage.objects
  for insert with check (
    bucket_id = 'carmine-documents' and (
      carmine_is_admin() or exists (
        select 1 from carmine_student_parents sp
        where sp.profile_id = auth.uid()
          and sp.student_id::text = (storage.foldername(name))[1]
      )
    )
  );

create policy "carmine — admin supprime" on storage.objects
  for delete using (bucket_id = 'carmine-documents' and carmine_is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
--  Vue de pilotage : ce qui doit remonter en haut du tableau de bord.
-- ═══════════════════════════════════════════════════════════════════════════

create view carmine_dashboard_alerts as
select
  sm.id,
  sm.student_id,
  s.first_name,
  s.last_name,
  sm.milestone_id,
  sm.due_date,
  sm.status,
  (sm.due_date - current_date) as days_left
from carmine_student_milestones sm
join carmine_students s on s.id = sm.student_id
where sm.status in ('a_faire', 'en_cours')
  and not s.archived
  and sm.due_date <= current_date + 45
order by sm.due_date;
