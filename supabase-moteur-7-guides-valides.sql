update carmine_guides
   set statut = 'valide', valide_le = now(), updated_at = now()
 where statut = 'brouillon';

select audience, count(*) as guides_valides from carmine_guides where statut = 'valide' group by audience;
