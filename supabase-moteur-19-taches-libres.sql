-- Tâches libres : une action ajoutée à la main sur un dossier, hors socle et
-- hors exigences. Le moteur ne la génère pas et la synchronisation ne l'efface
-- jamais. À exécuter seule (une valeur d'enum ajoutée ne s'utilise pas dans la
-- même transaction).
alter type carmine_tache_origine add value if not exists 'libre';
