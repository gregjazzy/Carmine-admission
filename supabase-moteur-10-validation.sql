create or replace function carmine_exigence_avant_maj() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.statut = 'validee' then
    if new.source_url is null then
      raise exception 'Une exigence validée porte une source.';
    end if;
    if new.millesime is null then
      new.millesime := to_char(now(), 'YYYY') || '-' || to_char(now() + interval '1 year', 'YY');
    end if;
    if new.verifie_le is null then
      new.verifie_le := current_date;
    end if;
    if tg_op = 'INSERT' or coalesce(old.statut::text, '') <> 'validee' then
      new.valide_le := now();
      new.valide_par := auth.uid();
    end if;
  end if;
  return new;
end $$;
