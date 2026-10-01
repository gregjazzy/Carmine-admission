-- Fields : copies d'élèves envoyées à la correction (fonction corriger-copie).
-- À exécuter une fois dans l'éditeur SQL de Supabase. Rejouable sans dommage.
--
-- Une ligne par copie : les photos vivent dans le bucket privé « fields-copies »,
-- rangées par utilisateur ; la correction rendue par l'IA est gardée telle quelle.
-- Seule la fonction (service role) écrit. L'élève relit ses copies, l'administration
-- les relit toutes et y porte son avis pendant la phase d'essai.

create table if not exists fields_copies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  probleme text not null,                 -- « college/c-air-8 »
  photos text[] not null default '{}',    -- chemins dans le bucket fields-copies
  correction jsonb,
  note smallint,
  modele text,
  tokens_entree integer,
  tokens_sortie integer,
  avis text check (avis in ('signee', 'a_reprendre')),
  avis_note text,
  created_at timestamptz not null default now()
);

create index if not exists fields_copies_user on fields_copies (user_id, created_at desc);

alter table fields_copies enable row level security;

insert into storage.buckets (id, name, public)
values ('fields-copies', 'fields-copies', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'fields_copies' and policyname = 'fields — relire ses copies') then
    create policy "fields — relire ses copies" on fields_copies
      for select using (user_id = auth.uid() or carmine_is_admin());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'fields_copies' and policyname = 'fields — avis de l''administration') then
    create policy "fields — avis de l'administration" on fields_copies
      for update using (carmine_is_admin()) with check (carmine_is_admin());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'fields — voir ses photos de copie') then
    create policy "fields — voir ses photos de copie" on storage.objects
      for select using (bucket_id = 'fields-copies'
        and (carmine_is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
  end if;
end $$;
