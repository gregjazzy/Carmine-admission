create table if not exists carmine_guides (
  id            uuid primary key default gen_random_uuid(),
  cle           text not null,
  audience      text not null check (audience in ('famille', 'interne')),
  titre         text not null,
  contenu       text not null default '',
  statut        text not null default 'brouillon' check (statut in ('brouillon', 'valide')),
  modele        text,
  genere_le     timestamptz,
  valide_le     timestamptz,
  updated_at    timestamptz not null default now(),
  unique (cle, audience)
);

alter table carmine_guides enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'carmine_guides' and policyname = 'lire les guides famille validés') then
    create policy "lire les guides famille validés" on carmine_guides
      for select using (auth.uid() is not null and ((audience = 'famille' and statut = 'valide') or carmine_is_admin()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'carmine_guides' and policyname = 'admin gère les guides') then
    create policy "admin gère les guides" on carmine_guides
      for all using (carmine_is_admin()) with check (carmine_is_admin());
  end if;
end $$;

select count(*) as guides from carmine_guides;
