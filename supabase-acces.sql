-- ═══════════════════════════════════════════════════════════════════════════
--  Ouverture des accès à un dossier
--
--  L'accès se donne à la main, après négociation. Le problème : un profil
--  n'existe qu'à la première connexion, on ne peut donc pas rattacher une
--  adresse à un dossier avant que la personne se soit connectée une fois.
--  D'où cette table d'invitations, convertie en rattachement soit à la
--  première connexion, soit immédiatement si le profil existe déjà.
-- ═══════════════════════════════════════════════════════════════════════════

create type carmine_acces_role as enum ('parent', 'eleve');

create table carmine_acces_invites (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references carmine_students on delete cascade,
  email       text not null,
  role        carmine_acces_role not null default 'parent',
  invite_par  uuid references carmine_profiles,
  cree_le     timestamptz not null default now(),
  -- Horodatage de la conversion en rattachement. Tant qu'il est nul,
  -- l'invitation est en attente d'une première connexion.
  active_le   timestamptz,
  unique (student_id, email)
);

-- Les adresses arrivent telles que tapées ; sans normalisation, « Marie@… »
-- et « marie@… » créeraient deux invitations dont une seule s'activerait.
create function carmine_normalise_invite() returns trigger
language plpgsql as $$
begin
  new.email := lower(trim(new.email));
  return new;
end $$;

create trigger carmine_invite_normalise
  before insert or update on carmine_acces_invites
  for each row execute function carmine_normalise_invite();

-- ── Conversion en rattachement ─────────────────────────────────────────────

create function carmine_activer_invites(p_profile uuid, p_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into carmine_student_parents (student_id, profile_id)
  select i.student_id, p_profile
    from carmine_acces_invites i
   where i.email = lower(p_email)
  on conflict do nothing;

  update carmine_acces_invites
     set active_le = now()
   where email = lower(p_email) and active_le is null;
end $$;

-- Première connexion : le profil vient d'être créé, on convertit dans la
-- foulée. Remplace la fonction du schéma de base en lui ajoutant cette étape.
create or replace function carmine_handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into carmine_profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;

  perform carmine_activer_invites(new.id, new.email);
  return new;
end $$;

-- Invitation déposée sur une adresse déjà connue : l'accès s'ouvre tout de
-- suite, sans attendre une reconnexion qui n'aurait aucune raison d'arriver.
create function carmine_invite_immediate() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_profile uuid;
begin
  select id into v_profile from carmine_profiles where lower(email) = new.email;
  if v_profile is not null then
    insert into carmine_student_parents (student_id, profile_id)
    values (new.student_id, v_profile)
    on conflict do nothing;
    update carmine_acces_invites set active_le = now() where id = new.id;
  end if;
  return new;
end $$;

create trigger carmine_invite_apres_insert
  after insert on carmine_acces_invites
  for each row execute function carmine_invite_immediate();

-- Retirer une invitation retire l'accès : sans cela, révoquer serait un
-- geste sans effet, ce qui est pire que pas de bouton du tout.
create function carmine_invite_retrait() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_profile uuid;
begin
  select id into v_profile from carmine_profiles where lower(email) = old.email;
  if v_profile is not null then
    delete from carmine_student_parents
     where student_id = old.student_id and profile_id = v_profile;
  end if;
  return old;
end $$;

create trigger carmine_invite_apres_delete
  after delete on carmine_acces_invites
  for each row execute function carmine_invite_retrait();

-- ── Sécurité ───────────────────────────────────────────────────────────────

alter table carmine_acces_invites enable row level security;

create policy "admin gère les accès" on carmine_acces_invites
  for all using (carmine_is_admin()) with check (carmine_is_admin());
