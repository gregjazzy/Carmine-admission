do $$ begin
  if not exists (select 1 from pg_type where typname = 'carmine_tache_statut') then
    create type carmine_tache_statut as enum ('a_venir', 'a_faire', 'en_cours', 'fait', 'sans_objet', 'effacee');
  end if;
  if not exists (select 1 from pg_type where typname = 'carmine_tache_origine') then
    create type carmine_tache_origine as enum ('socle', 'exigence', 'evenement');
  end if;
end $$;

update carmine_universites set filiere = 'fr'::carmine_track where pays = 'France' and filiere is null;

alter table carmine_exigences_universite
  add column if not exists tour text check (tour in ('anticipe', 'ordinaire'));

alter table carmine_students
  add column if not exists options text[] not null default '{}';

alter table carmine_cibles_eleve
  add column if not exists tour        text check (tour in ('anticipe', 'ordinaire')),
  add column if not exists decision    text check (decision in ('admis', 'refuse', 'report', 'attente', 'retire')),
  add column if not exists decision_le date,
  add column if not exists offre       text check (offre in ('ferme', 'assurance', 'aucune')),
  add column if not exists offre_le    date,
  add column if not exists ajoute_le   timestamptz not null default now();

alter table carmine_documents
  add column if not exists tache_id uuid;

create table if not exists carmine_types_tache (
  type         text primary key,
  duree_jours  int not null default 0,
  gras_jours   int not null default 0,
  trame_code   text references carmine_trames(code)
);

insert into carmine_types_tache (type, duree_jours, gras_jours) values
  ('profil', 0, 0),
  ('test_admission', 70, 21),
  ('inscription_test', 3, 7),
  ('depot', 3, 7),
  ('formulaire', 3, 7),
  ('essai', 42, 30),
  ('langue', 56, 21),
  ('aide', 21, 14),
  ('piece', 30, 30),
  ('entretien', 21, 14),
  ('autre', 7, 7),
  ('livrable', 0, 0),
  ('jalon', 0, 0),
  ('document', 0, 0),
  ('examen', 0, 0)
on conflict (type) do nothing;

create table if not exists carmine_taches (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references carmine_students on delete cascade,
  origine          carmine_tache_origine not null,
  milestone_id     text,
  exigence_id      uuid references carmine_exigences_universite on delete set null,
  universite_id    uuid references carmine_universites on delete set null,
  type             text not null,
  titre            text not null,
  consigne         text,
  owners           text[] not null default '{}',
  lock             boolean not null default false,
  echeance         date not null,
  fin_periode      date,
  apparition       date not null,
  statut           carmine_tache_statut not null default 'a_venir',
  public_note      text,
  private_note     text,
  brouillon_id     uuid,
  date_confirmee_le timestamptz,
  envoye_le        timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique nulls not distinct (student_id, origine, milestone_id, exigence_id, universite_id)
);

create index if not exists carmine_taches_eleve_echeance on carmine_taches (student_id, echeance);
create index if not exists carmine_taches_apparition on carmine_taches (apparition) where statut in ('a_venir', 'a_faire', 'en_cours');

create or replace function carmine_tache_avant_maj() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.statut = 'fait' and (tg_op = 'INSERT' or coalesce(old.statut::text, '') <> 'fait') then
    new.completed_at := now();
  elsif new.statut <> 'fait' then
    new.completed_at := null;
  end if;
  return new;
end $$;

create trigger carmine_taches_maj
  before insert or update on carmine_taches
  for each row execute function carmine_tache_avant_maj();

alter table carmine_taches enable row level security;
alter table carmine_types_tache enable row level security;

create policy "admin gère les tâches" on carmine_taches
  for all using (carmine_is_admin()) with check (carmine_is_admin());

create policy "lire les types de tâche" on carmine_types_tache
  for select using (auth.uid() is not null);
create policy "admin gère les types de tâche" on carmine_types_tache
  for all using (carmine_is_admin()) with check (carmine_is_admin());

create or replace view carmine_taches_famille as
select t.id, t.student_id, t.origine, t.milestone_id, t.exigence_id, t.universite_id,
       t.type, t.titre, t.consigne, t.owners, t.lock, t.echeance, t.fin_periode, t.apparition,
       case when t.statut = 'a_venir' and t.apparition <= current_date then 'a_faire' else t.statut::text end as statut,
       t.public_note, t.completed_at, t.updated_at
  from carmine_taches t
 where t.statut not in ('effacee')
   and not (t.statut = 'a_venir' and t.apparition > current_date)
   and exists (select 1 from carmine_student_parents sp
                where sp.student_id = t.student_id and sp.profile_id = auth.uid());

grant select on carmine_taches_famille to authenticated;
