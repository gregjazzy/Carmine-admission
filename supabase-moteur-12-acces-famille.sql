do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'carmine_acces_invites' and policyname = 'lire son propre accès') then
    create policy "lire son propre accès" on carmine_acces_invites
      for select using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
  end if;
end $$;
