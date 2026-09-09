do $$ begin
  if not exists (select 1 from pg_type where typname = 'carmine_exigence_type') then
    create type carmine_exigence_type as enum ('profil', 'test_admission', 'inscription_test', 'depot', 'formulaire', 'essai', 'langue', 'aide', 'piece', 'entretien', 'autre');
  end if;
  if not exists (select 1 from pg_type where typname = 'carmine_regime') then
    create type carmine_regime as enum ('envisagee', 'retenue');
  end if;
  if not exists (select 1 from pg_type where typname = 'carmine_exigence_statut') then
    create type carmine_exigence_statut as enum ('brouillon', 'validee', 'perimee', 'rejetee');
  end if;
end $$;

alter table carmine_universites
  add column if not exists filiere            carmine_track,

  add column if not exists domaine            text,
  add column if not exists fiche_recherchee_le timestamptz,

  add column if not exists note_fiche         text;

update carmine_universites set filiere = case
  when pays in ('US', 'États-Unis', 'Etats-Unis', 'United States') then 'us'::carmine_track
  when pays in ('UK', 'Royaume-Uni', 'United Kingdom') then 'uk'::carmine_track
  when pays in ('Suisse', 'Italie', 'Australie', 'Pays-Bas', 'Irlande', 'Allemagne',
                'Espagne', 'Suède', 'Danemark', 'Belgique', 'Canada') then 'eu'::carmine_track
  else null end
where filiere is null;

alter table carmine_trames
  add column if not exists type            text not null default 'livrable',
  add column if not exists pour_type_tache text;

create table if not exists carmine_exigences_universite (
  id              uuid primary key default gen_random_uuid(),
  universite_id   uuid not null references carmine_universites on delete cascade,
  type            carmine_exigence_type not null,
  libelle         text not null,
  consigne        text,
  longueur        text,
  regime          carmine_regime not null default 'retenue',

  y               int,
  m               int check (m between 1 and 12),
  d               int check (d between 1 and 31),
  fin_m           int check (fin_m between 1 and 12),

  relatif_a       text check (relatif_a in ('decision', 'offre_ferme', 'admission')),
  delai_jours     int,
  duree_jours     int,
  partage         boolean not null default false,
  trame_code      text references carmine_trames(code),
  source_url      text,
  source          text,
  millesime       text,
  verifie_le      date,
  confiance       text check (confiance in ('trouve', 'ambigu', 'non_trouve')),
  note_ia         text,
  statut          carmine_exigence_statut not null default 'brouillon',
  valide_par      uuid references carmine_profiles,
  valide_le       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists carmine_exigences_universite_statut
  on carmine_exigences_universite (universite_id, statut);

create or replace function carmine_exigence_avant_maj() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.statut = 'validee' then
    if new.source_url is null or new.millesime is null or new.verifie_le is null then
      raise exception 'Une exigence validée porte une source, un millésime et une date de vérification.';
    end if;
    if new.type in ('test_admission', 'inscription_test', 'depot', 'formulaire', 'aide')
       and not ((new.y is not null and new.m is not null and new.d is not null)
                or (new.relatif_a is not null and new.delai_jours is not null)) then
      raise exception 'Une échéance validée porte une date relative à la classe, ou un délai après un événement.';
    end if;
    if tg_op = 'INSERT' or coalesce(old.statut::text, '') <> 'validee' then
      new.valide_le := now();
      new.valide_par := auth.uid();
    end if;
  end if;
  return new;
end $$;

create trigger carmine_exigences_universite_maj
  before insert or update on carmine_exigences_universite
  for each row execute function carmine_exigence_avant_maj();

alter table carmine_exigences_universite enable row level security;

create policy "lire les exigences validées" on carmine_exigences_universite
  for select using (auth.uid() is not null and (statut = 'validee' or carmine_is_admin()));

create policy "admin gère les exigences" on carmine_exigences_universite
  for all using (carmine_is_admin()) with check (carmine_is_admin());
