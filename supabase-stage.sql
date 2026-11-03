-- Stage de prérentrée en faux direct (3 nov. 2026) — tableau animé + correction des copies par Claude.
-- À coller une fois dans Supabase ▸ SQL Editor (projet Carmine admission).
-- Aucune règle d'accès (RLS activée, aucune politique) : le navigateur ne lit et n'écrit RIEN directement,
-- tout passe par les fonctions « stage » et « stage-corriger » (clé service). Un élève n'est connu que par son jeton.

create table if not exists stage_eleves (
  jeton       text primary key,                 -- 24 caractères, dans son lien : ?stage=<jeton>
  cohorte     text not null,                    -- ex. « tle-2027-08-24 » : les élèves qui suivent les mêmes séances
  prenom      text not null,
  email       text,
  cree_le     timestamptz not null default now()
);

-- une séance = un jour d'une cohorte : son heure de début et son déroulé (fichier du tableau : stage/deroules/<deroule>.json)
create table if not exists stage_seances (
  id          text primary key,                 -- ex. « tle-2027-08-24-j1 »
  cohorte     text not null,
  jour        int  not null,
  titre       text not null,
  debut       timestamptz not null,
  deroule     text not null                     -- ex. « tle-j1 »
);
create index if not exists stage_seances_cohorte on stage_seances (cohorte, debut);

-- une copie envoyée : la photo, puis la correction quand elle est prête
create table if not exists stage_copies (
  id            uuid primary key default gen_random_uuid(),
  jeton         text not null references stage_eleves (jeton) on delete cascade,
  seance        text not null references stage_seances (id) on delete cascade,
  exercice      text not null,                  -- id de l'exercice dans la banque du tableau (ex. rec-1)
  photos        text[] not null default '{}',   -- chemins dans le bucket privé stage-copies
  statut        text not null default 'en_attente' check (statut in ('en_attente', 'en_cours', 'corrigee', 'erreur')),
  essais        int  not null default 0,
  correction    jsonb,
  valide        boolean,                        -- la question est validée pour lui
  erreurs       text[] not null default '{}',   -- codes des erreurs typiques relevées (pour « ce que la classe a raté »)
  modele        text,
  tokens_entree int,
  tokens_sortie int,
  cree_le       timestamptz not null default now(),
  corrige_le    timestamptz
);
create index if not exists stage_copies_eleve on stage_copies (jeton, seance);
create index if not exists stage_copies_classe on stage_copies (seance, exercice) where statut = 'corrigee';
create index if not exists stage_copies_file on stage_copies (statut, cree_le) where statut in ('en_attente', 'erreur');

-- la conversation de l'élève avec son correcteur
create table if not exists stage_messages (
  id        bigint generated always as identity primary key,
  jeton     text not null references stage_eleves (jeton) on delete cascade,
  role      text not null check (role in ('user', 'assistant')),
  contenu   text not null,
  seance    text,
  cree_le   timestamptz not null default now()
);
create index if not exists stage_messages_eleve on stage_messages (jeton, cree_le);

alter table stage_eleves   enable row level security;
alter table stage_seances  enable row level security;
alter table stage_copies   enable row level security;
alter table stage_messages enable row level security;

-- les photos des copies : bucket privé, lu et écrit seulement par les fonctions
insert into storage.buckets (id, name, public)
values ('stage-copies', 'stage-copies', false)
on conflict (id) do nothing;

-- la caméra de Greg pendant les blocs au tableau : vidéos publiques (adresses impossibles à deviner), lues en cours de
-- route par les élèves ; écrites seulement par la fonction tableau-classeurs (code professeur). 300 Mo au plus par bloc.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('stage-videos', 'stage-videos', true, 314572800, array['video/webm', 'video/mp4'])
on conflict (id) do nothing;

-- « ce que la classe a raté » : pour un exercice d'une séance, combien de copies corrigées et combien par erreur
create or replace function stage_classe(p_seance text, p_exercice text)
returns json language sql stable as $$
  select json_build_object(
    'copies', (select count(*) from stage_copies where seance = p_seance and exercice = p_exercice and statut = 'corrigee'),
    'valides', (select count(*) from stage_copies where seance = p_seance and exercice = p_exercice and statut = 'corrigee' and valide),
    'erreurs', coalesce((
      select json_object_agg(code, n) from (
        select unnest(erreurs) as code, count(*) as n
        from stage_copies where seance = p_seance and exercice = p_exercice and statut = 'corrigee'
        group by 1
      ) e), '{}'::json)
  );
$$;
