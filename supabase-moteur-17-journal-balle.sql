create table if not exists carmine_balle_journal (
  id          uuid primary key default gen_random_uuid(),
  tache_id    uuid not null references carmine_taches on delete cascade,
  student_id  uuid not null references carmine_students on delete cascade,
  de          text,
  vers        text not null,
  mot         text,
  par         uuid,
  quand       timestamptz not null default now()
);
create index if not exists carmine_balle_journal_tache on carmine_balle_journal (tache_id, quand);

alter table carmine_balle_journal enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'carmine_balle_journal' and policyname = 'admin lit le journal de la balle') then
    create policy "admin lit le journal de la balle" on carmine_balle_journal
      for select using (carmine_is_admin());
  end if;
end $$;

create or replace function carmine_journal_balle() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and coalesce(old.balle, '') is distinct from coalesce(new.balle, '') then
    insert into carmine_balle_journal (tache_id, student_id, de, vers, mot, par)
    values (new.id, new.student_id, old.balle, new.balle, new.mot_balle, auth.uid());
  end if;
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'carmine_taches_journal_balle') then
    create trigger carmine_taches_journal_balle
      after update on carmine_taches
      for each row execute function carmine_journal_balle();
  end if;
end $$;
