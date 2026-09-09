/**
 * Libellés du moteur, dans les deux langues du site. La détection de langue
 * est celle du portail (clé `lang` du localStorage), importée, pas recopiée.
 */
import { currentLang } from '../portail/lang.js';

const FR = {
  titre: 'Moteur de pilotage',
  fiches: 'Fiches université',
  fichesIntro: "Chaque université visée par une famille porte sa fiche : ce qu'elle exige, ligne par ligne, avec la page où l'information a été lue. L'IA cherche, vous validez.",
  kpiUniversites: 'universités',
  kpiValidees: 'exigences validées',
  kpiBrouillons: 'lignes à valider',
  kpiSansFiche: 'sans fiche',
  nouvelleFiche: 'Nouvelle fiche',
  etablissement: 'Établissement',
  cursus: 'Cursus (facultatif)',
  cursusHint: 'Au Royaume-Uni et en Europe, la fiche vaut par cursus. Aux États-Unis, laisser vide.',
  pays: 'Pays',
  filiere: 'Filière',
  domaine: 'Site officiel (facultatif)',
  domaineHint: 'ex. admissions.harvard.edu — borne la recherche au site de l’université.',
  chercher: 'Lancer la recherche',
  rechercheEnCours: 'Recherche en cours, une à trois minutes…',
  rechercheFaite: (n) => `${n} ligne${n > 1 ? 's' : ''} écrite${n > 1 ? 's' : ''} en brouillon.`,
  relancer: 'Relancer la recherche',
  relancerConfirm: 'Relancer remplace les brouillons actuels. Les lignes validées ne bougent pas. Continuer ?',
  ouvrir: 'Ouvrir',
  aucune: 'Aucune université. Lancez la première fiche.',
  colUniversite: 'Université', colPays: 'Pays', colFiliere: 'Filière', colFiche: 'Fiche', colRecherche: 'Dernière recherche',
  jamais: 'jamais',
  sansFiche: 'sans fiche',
  aValider: (n) => `${n} à valider`,
  validees: (n) => `${n} validée${n > 1 ? 's' : ''}`,
  retourFiches: 'Toutes les fiches',
  brouillons: 'À valider',
  brouillonsIntro: "Ouvrez le lien à côté de chaque ligne, comparez, corrigez si besoin, puis validez. Une ligne validée entre au référentiel et servira à toutes les familles qui visent cette université.",
  valideesTitre: 'Validées',
  autres: 'Périmées et rejetées',
  aucunBrouillon: 'Rien à valider.',
  aucuneValidee: 'Aucune ligne validée.',
  noteFiche: "Ce que l'IA n'a pas su classer",
  ajouter: 'Ajouter une ligne à la main',
  champs: {
    type: 'Type', libelle: 'Libellé', consigne: 'Consigne', longueur: 'Longueur',
    regime: 'Régime', y: 'Année', m: 'Mois', d: 'Jour', fin_m: 'Fin (mois)',
    relatif_a: 'Après l’événement', delai_jours: 'Délai (jours)', duree_jours: 'Préparation (jours)',
    source_url: 'Adresse de la source', millesime: 'Millésime', verifie_le: 'Vérifié le',
  },
  types: {
    profil: 'Condition de profil', test_admission: 'Test d’admission', inscription_test: 'Inscription au test',
    depot: 'Échéance de dépôt', formulaire: 'Formulaire', essai: 'Essai', langue: 'Langue',
    aide: 'Aide financière', piece: 'Pièce', entretien: 'Entretien', autre: 'Autre',
  },
  regimes: { envisagee: 'Envisagée', retenue: 'Retenue' },
  annees: { '-3': 'Troisième', '-2': 'Seconde', '-1': 'Première', '0': 'Terminale', '1': 'Après le bac' },
  evenements: { '': '—', decision: 'Décision reçue', offre_ferme: 'Offre ferme', admission: 'Admission' },
  confiances: { trouve: 'Trouvé', ambigu: 'Ambigu', non_trouve: 'Non trouvé' },
  statuts: { brouillon: 'Brouillon', validee: 'Validée', perimee: 'Périmée', rejetee: 'Rejetée' },
  sansDate: 'sans date',
  ouvrirSource: 'Ouvrir la source',
  sansSource: 'Sans source',
  enregistrer: 'Enregistrer',
  valider: 'Valider',
  rejeter: 'Rejeter',
  perimer: 'Marquer périmée',
  modifier: 'Modifier',
  supprimer: 'Supprimer',
  supprimerConfirm: 'Supprimer cette ligne ?',
  enregistre: 'Enregistré',
  echec: 'Échec',
  noteIa: 'Note de l’IA',
  jusquau: 'jusqu’en',
  adminOnly: "Cette page est réservée à l'administration.",
  connexion: 'Se connecter',
  deconnexion: 'Se déconnecter',
  chargement: 'Chargement…',
};

const EN = {
  titre: 'Steering engine',
  fiches: 'University sheets',
  fichesIntro: 'Every university a family is aiming for has a sheet: what it requires, line by line, with the page the information was read on. The AI searches, you validate.',
  kpiUniversites: 'universities',
  kpiValidees: 'validated requirements',
  kpiBrouillons: 'lines to validate',
  kpiSansFiche: 'without a sheet',
  nouvelleFiche: 'New sheet',
  etablissement: 'Institution',
  cursus: 'Course (optional)',
  cursusHint: 'In the UK and Europe the sheet is per course. In the US, leave blank.',
  pays: 'Country',
  filiere: 'Track',
  domaine: 'Official site (optional)',
  domaineHint: 'e.g. admissions.harvard.edu — restricts the search to the university’s site.',
  chercher: 'Run the search',
  rechercheEnCours: 'Searching, one to three minutes…',
  rechercheFaite: (n) => `${n} line${n > 1 ? 's' : ''} written as draft.`,
  relancer: 'Run the search again',
  relancerConfirm: 'Running again replaces the current drafts. Validated lines are untouched. Continue?',
  ouvrir: 'Open',
  aucune: 'No university yet. Run the first sheet.',
  colUniversite: 'University', colPays: 'Country', colFiliere: 'Track', colFiche: 'Sheet', colRecherche: 'Last search',
  jamais: 'never',
  sansFiche: 'no sheet',
  aValider: (n) => `${n} to validate`,
  validees: (n) => `${n} validated`,
  retourFiches: 'All sheets',
  brouillons: 'To validate',
  brouillonsIntro: 'Open the link next to each line, compare, correct if needed, then validate. A validated line enters the reference table and serves every family aiming for this university.',
  valideesTitre: 'Validated',
  autres: 'Outdated and rejected',
  aucunBrouillon: 'Nothing to validate.',
  aucuneValidee: 'No validated line.',
  noteFiche: 'What the AI could not classify',
  ajouter: 'Add a line by hand',
  champs: {
    type: 'Type', libelle: 'Label', consigne: 'Prompt', longueur: 'Length',
    regime: 'Regime', y: 'Year', m: 'Month', d: 'Day', fin_m: 'End (month)',
    relatif_a: 'After event', delai_jours: 'Delay (days)', duree_jours: 'Preparation (days)',
    source_url: 'Source URL', millesime: 'Vintage', verifie_le: 'Checked on',
  },
  types: {
    profil: 'Profile condition', test_admission: 'Admissions test', inscription_test: 'Test registration',
    depot: 'Submission deadline', formulaire: 'Form', essai: 'Essay', langue: 'Language',
    aide: 'Financial aid', piece: 'Document', entretien: 'Interview', autre: 'Other',
  },
  regimes: { envisagee: 'Considered', retenue: 'Retained' },
  annees: { '-3': 'Year 10', '-2': 'Year 11', '-1': 'Year 12', '0': 'Year 13', '1': 'After school' },
  evenements: { '': '—', decision: 'Decision received', offre_ferme: 'Firm offer', admission: 'Admission' },
  confiances: { trouve: 'Found', ambigu: 'Ambiguous', non_trouve: 'Not found' },
  statuts: { brouillon: 'Draft', validee: 'Validated', perimee: 'Outdated', rejetee: 'Rejected' },
  sansDate: 'no date',
  ouvrirSource: 'Open source',
  sansSource: 'No source',
  enregistrer: 'Save',
  valider: 'Validate',
  rejeter: 'Reject',
  perimer: 'Mark outdated',
  modifier: 'Edit',
  supprimer: 'Delete',
  supprimerConfirm: 'Delete this line?',
  enregistre: 'Saved',
  echec: 'Failed',
  noteIa: 'AI note',
  jusquau: 'until',
  adminOnly: 'This page is restricted to administration.',
  connexion: 'Sign in',
  deconnexion: 'Sign out',
  chargement: 'Loading…',
};

let ui = FR;
export function initLang() {
  const lng = currentLang();
  ui = lng === 'en' ? EN : FR;
  document.documentElement.lang = lng;
  return lng;
}
export const t = (key) => ui[key] ?? FR[key] ?? key;
export const t2 = (group, key) => ui[group]?.[key] ?? FR[group]?.[key] ?? key;

export const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const MOIS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MOIS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const mois = (m) => (ui === EN ? MOIS_EN : MOIS_FR)[m - 1] ?? m;

/** « Terminale · 1 nov. », « Première · juin → oct. », « 2 j après décision ». */
export function dateRelative(e) {
  if (e.relatif_a) {
    const n = e.delai_jours ?? 0;
    return `${n} j · ${t2('evenements', e.relatif_a)}`;
  }
  if (e.y == null || e.m == null) return t('sansDate');
  const classe = t2('annees', String(e.y));
  const debut = e.d != null ? `${e.d} ${mois(e.m)}` : mois(e.m);
  const fin = e.fin_m != null ? ` → ${mois(e.fin_m)}` : '';
  return `${classe} · ${debut}${fin}`;
}

export function fmtDate(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(ui === EN ? 'en-GB' : 'fr-FR',
    { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}
