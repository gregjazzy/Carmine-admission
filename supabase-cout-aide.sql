-- ═══════════════════════════════════════════════════════════════════════════
--  Coût et aide financière — trois faits par établissement
--
--  Renseignés une fois par an, ils servent tous les dossiers. Le travail par
--  élève redevient l'arbitrage, pas la collecte.
--
--  Volontairement, aucune colonne de « coût net estimé » : les calculateurs
--  publics sont conçus pour les résidents américains et renvoient, pour un
--  candidat français, soit rien soit un chiffre faux. On ne stocke que ce qui
--  est publié.
-- ═══════════════════════════════════════════════════════════════════════════

do $$ begin
  if not exists (select 1 from pg_type where typname = 'carmine_aide_politique') then
    create type carmine_aide_politique as enum (
      'besoin_ignore',      -- la demande d'aide n'entre pas dans la décision
      'besoin_pris_compte', -- demander l'aide pèse sur la candidature
      'aucune_aide',        -- rien pour les candidats étrangers
      'inconnue'
    );
  end if;
end $$;

alter table carmine_universites
  add column if not exists cout_annuel        numeric(9,2),
  add column if not exists cout_devise        text,
  -- Politique envers les CANDIDATS ÉTRANGERS, jamais envers les résidents :
  -- c'est la seule qui concerne les dossiers du cabinet.
  add column if not exists aide_internationaux carmine_aide_politique not null default 'inconnue',
  add column if not exists couvre_besoin_total boolean,
  add column if not exists aide_source        text,
  add column if not exists aide_millesime     text;
