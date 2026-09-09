alter table carmine_taches enable row level security;
alter table carmine_types_tache enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'carmine_taches' and policyname = 'admin gère les tâches') then
    create policy "admin gère les tâches" on carmine_taches
      for all using (carmine_is_admin()) with check (carmine_is_admin());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'carmine_types_tache' and policyname = 'lire les types de tâche') then
    create policy "lire les types de tâche" on carmine_types_tache
      for select using (auth.uid() is not null);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'carmine_types_tache' and policyname = 'admin gère les types de tâche') then
    create policy "admin gère les types de tâche" on carmine_types_tache
      for all using (carmine_is_admin()) with check (carmine_is_admin());
  end if;
end $$;

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

select
  (select count(*) from pg_policies where tablename = 'carmine_taches') as policies_taches,
  (select count(*) from pg_policies where tablename = 'carmine_types_tache') as policies_types,
  (select count(*) from carmine_types_tache) as types,
  (select count(*) from pg_views where viewname = 'carmine_taches_famille') as vue_famille;
