/**
 * Ce que le moteur ajoute au socle, sans le modifier.
 *
 * Le socle (milestones.js) reste la méthode, écrite à un seul endroit. Le
 * moteur a besoin de trois choses de plus, indexées par identifiant de jalon :
 * lesquels sortent du socle parce qu'ils deviennent des exigences d'université,
 * lesquels dépendent d'une option du dossier ou d'un pays visé, et lesquels
 * comptent dans le dossier de chaque université.
 */

/** Sortent du socle : ils ne se génèrent plus que par les fiches ou les événements. */
export const RETIRES = new Set([
  'C-13', // inscription aux tests UK → exigence inscription_test
  'C-14', // préparation ESAT/TMUA/UCAT/LNAT → exigence test_admission
  'D-08', // échéance 15 octobre → exigence depot (Oxford, Cambridge, médecine)
  'D-09', // My Cambridge Application → exigence formulaire
  'D-10', // passage ESAT/TMUA → exigence test_admission
  'D-11', // travaux écrits → exigence piece
  'D-12', // candidatures anticipées → exigence depot, tour anticipé
  'D-13', // Californie → exigences depot + essais
  'D-15', // préparation aux entretiens → exigence entretien
  'D-16', // entretiens Oxbridge → exigence entretien
  'D-17', // entretiens anciens élèves → exigence entretien
  'D-26', // lettres d'intérêt maintenu → événement (report, liste d'attente)
  'E-02', // ATAS → exigence piece, relative à l'offre ferme
]);

/** Ne se génèrent que si le dossier porte l'une de ces options. */
export const OPTIONS = {
  'D-14': ['artistique', 'sportif'],
  'D-23': ['aide_financiere'],
};

/** Ne se génèrent que si une cible du dossier est dans l'un de ces pays. */
export const PAYS_CONDITION = {
  'D-21': ['Pays-Bas', 'Suède'],
  'D-32': ['Pays-Bas'],
  'D-24': ['Irlande'],
  'D-27': ['Suisse'],
};

/**
 * Dates corrigées par-dessus le socle, sans le modifier. D-34 : les résultats
 * britanniques tombent en août APRÈS le bac, année y = 1 dans la convention du
 * socle, pas y = 0 (août précédant la terminale). À reporter dans le socle à
 * la bascule.
 */
export const DATES_OVERRIDE = {
  'D-34': { y: 1, m: 8, d: 12 },
};

/** Filières remplacées : le jalon vaut pour ces filières et non celles du socle. */
export const TRACKS_OVERRIDE = {
  'D-22': ['fr'], // vœux Parcoursup : filière France, pas Europe
};

/**
 * Comptent dans le dossier de chaque université de la même filière : ce sont
 * les tâches partagées, affichées sous Harvard comme sous Brown.
 */
export const CANDIDATURE = new Set([
  'C-05', 'C-09', 'C-11', 'C-12', 'C-15', 'C-16',
  'D-01', 'D-02', 'D-04', 'D-05', 'D-06', 'D-07', 'D-19', 'D-20', 'D-22', 'D-25', 'D-33',
]);

/** Les options qu'un dossier peut porter, et leur libellé. */
export const OPTIONS_DOSSIER = ['artistique', 'sportif', 'aide_financiere'];

/** Filières que le moteur connaît. */
export const FILIERES = ['uk', 'us', 'eu', 'fr'];

/**
 * Rattrapables en plus de ceux du socle : les étapes de départ qu'on refait
 * pour une arrivée tardive, au lieu de les ranger sans objet. Décision de
 * Greg, 9 septembre 2026. Redatées au 30 septembre de l'année d'entrée.
 */
export const RATTRAPABLES = new Set(['A-01', 'A-02', 'C-01', 'C-06', 'C-07']);

/** Un jalon écrit pour les trois filières vaut pour tout le monde, France comprise. */
export function tracksDe(m) {
  if (TRACKS_OVERRIDE[m.id]) return TRACKS_OVERRIDE[m.id];
  return m.tracks.length >= 3 ? [...m.tracks, 'fr'] : m.tracks;
}

/** Échéance de repli d'une exigence sans date : le dépôt ordinaire de la filière. */
export const DEPOT_REPLI = {
  us: { y: 0, m: 1, d: 1 },
  uk: { y: 0, m: 1, d: 13 },
  eu: { y: 0, m: 1, d: 15 },
  fr: { y: 0, m: 3, d: 13 },
};

/** Date de l'arbitrage des spécialités (B-01), où s'accrochent les conditions de profil. */
export const PROFIL_DATE = { y: -2, m: 2, d: 20 };

/** Intervenants et caractère irrattrapable, par type d'exigence. */
export const PAR_TYPE = {
  profil:           { owners: ['carmine', 'parents'],        lock: false },
  test_admission:   { owners: ['eleve'],                     lock: true },
  inscription_test: { owners: ['eleve', 'carmine'],          lock: true },
  depot:            { owners: ['eleve'],                     lock: true },
  formulaire:       { owners: ['eleve', 'carmine'],          lock: true },
  essai:            { owners: ['eleve', 'carmine'],          lock: false },
  langue:           { owners: ['eleve'],                     lock: false },
  aide:             { owners: ['parents', 'carmine'],        lock: true },
  piece:            { owners: ['etablissement', 'carmine'],  lock: false },
  entretien:        { owners: ['eleve', 'carmine'],          lock: false },
  autre:            { owners: ['carmine'],                   lock: false },
};
