/**
 * Langue du portail.
 *
 * Reprend la clé `lang` du localStorage utilisée par i18next sur le reste du site,
 * afin que le choix fait sur la vitrine soit conservé en arrivant dans l'espace client.
 * Le module anglais n'est téléchargé que si la langue l'exige.
 */
import {
  TRACK_LABEL, OWNER_LABEL, KIND_LABEL, PHASES, CLASSES,
} from './milestones.js';

const SUPPORTED = ['fr', 'en'];

export function currentLang() {
  const stored = localStorage.getItem('lang');
  if (stored && SUPPORTED.includes(stored.slice(0, 2))) return stored.slice(0, 2);
  const nav = (navigator.language || 'fr').slice(0, 2);
  return SUPPORTED.includes(nav) ? nav : 'fr';
}

/* Libellés français — la référence. */
const UI_FR = {
  loginEyebrow: 'Espace client',
  loginTitle: 'Suivre le dossier de votre enfant',
  loginIntro: "Saisissez l'adresse que vous nous avez communiquée. Nous vous envoyons un lien de connexion — il n'y a pas de mot de passe à retenir.",
  emailLabel: 'Adresse électronique',
  emailPlaceholder: 'vous@exemple.com',
  loginSubmit: 'Recevoir mon lien',
  loginSending: 'Envoi…',
  loginSent: 'Lien envoyé. Ouvrez votre boîte mail — il est valable une heure.',
  loginFailed: "L'envoi a échoué",
  noFile: "Aucun dossier n'est encore rattaché à cette adresse.<br>Écrivez-nous et nous vous donnons accès immédiatement.",
  discover: "Découvrir l'accompagnement",
  noFileYet: "Vous n'avez pas encore de dossier ?",

  file: 'Dossier',
  fileFollowed: 'Dossier suivi',
  nextDeadline: 'Prochaine échéance',
  nothingDue: 'Rien ne requiert votre attention',
  // Aucune notification n'est envoyée : les échéances remontent dans cette page.
  // La formulation ne doit rien promettre que le portail ne tienne.
  nothingDueSub: "Vos prochaines échéances apparaîtront ici dès qu'une action vous concernera.",
  focusTitle: 'Ce qui vous concerne en ce moment',
  journey: 'Le parcours, étape par étape',
  currentYear: 'Année en cours',
  steps: 'étapes',
  whoLabel: 'Qui agit',
  allOwners: 'Tout',
  ownerYou: 'Vous',
  ownerChild: 'Votre enfant',
  ownerCarmine: 'Carmine',
  nextNone: 'Rien ne requiert votre attention',
  progress: (done, total, late) =>
    `${done} sur ${total}${late ? ` · ${late} en retard` : ''}`,
  step: 'étape',
  sessionNotes: 'Comptes rendus de séance',
  signOut: 'Se déconnecter',
  consolidated: 'Calendrier consolidé',
  allTracks: 'Toutes les filières',
  pastTitle: 'étapes antérieures à votre prise en charge',
  pastIntro: "Ces étapes précèdent le début de notre accompagnement. Elles figurent ici pour mémoire, et ne constituent pas un retard.",

  purpose: 'À quoi sert cette étape',
  weProduce: 'Ce que nous produisons',
  weExpect: 'Ce que nous attendons de vous',
  people: 'Intervenants',
  watchOut: 'Point de vigilance.',
  deadlineNature: "Nature de l'échéance",
  deadlineNatureBody: "Cette date ne se rattrape pas. Des rappels sont envoyés à quarante-cinq, vingt et un, dix et trois jours, puis le jour même.",
  documents: 'Documents',
  expectedDocs: 'Pièces attendues',
  templates: 'Modèles associés',
  dropFile: 'Déposer un fichier',
  dropHint: 'PDF, image ou document — cliquez ou glissez ici',
  noDocs: 'Aucun document déposé.',
  uploading: 'Envoi en cours…',
  progress: 'Avancement',
  parentMessage: 'Message affiché aux parents',
  privateNote: 'Note interne — jamais visible des parents',
  save: 'Enregistrer',
  saved: 'Enregistré',
  close: 'Fermer',
  whereWeAre: 'Où en sommes-nous',

  status: { a_faire: 'À faire', en_cours: 'En cours', fait: 'Terminé', sans_objet: 'Sans objet' },

  today: "aujourd'hui",
  tomorrow: 'demain',
  overdueOne: "en retard d'un jour",
  overdue: (n) => `en retard de ${n} jours`,
  inDays: (n) => `dans ${n} jours`,
  inOneMonth: 'dans un mois',
  inMonths: (n) => `dans ${n} mois`,

  classes: Object.fromEntries(CLASSES.map((c) => [c.key, c.label])),
  tracks: TRACK_LABEL,
  kinds: KIND_LABEL,
  owners: OWNER_LABEL,

  steering: 'Pilotage',
  newFile: 'Nouveau dossier',
  needsAction: 'Ce qui demande une action',
  files: 'Dossiers',
  allClear: "Aucune échéance ne réclame d'attention. Tout est à jour.",
  student: 'Élève', stepCol: 'Étape', dueCol: 'Échéance', delayCol: 'Délai', statusCol: 'Statut',
  overdueCount: 'en retard',
  allFiles: 'Tous les dossiers',
  resync: 'Réaligner le calendrier',
  addNote: 'Ajouter un compte rendu',
  createTitle: 'Créer un suivi',
  createIntro: "Le calendrier complet se génère automatiquement à partir de la classe actuelle, de la sixième jusqu'à la rentrée universitaire.",
  firstName: 'Prénom',
  lastName: 'Nom',
  currentClass: 'Classe actuelle',
  tracksLabel: 'Filières visées',
  school: 'Établissement',
  city: 'Ville',
  createSubmit: 'Créer le dossier',
  creating: 'Création…',
  cancel: 'Annuler',
  pickTrack: 'Sélectionnez au moins une filière.',
  failed: 'Échec',
  noFiles: 'Aucun dossier. Créez le premier.',
  adminOnly: "Cette page est réservée à l'administration.",
  goToClient: 'Accéder à votre espace',
  goToPilotage: 'Tableau de bord',
  notePromptTitle: 'Titre du compte rendu',
  notePromptBody: 'Contenu',
  notePromptVisible: 'Rendre ce compte rendu visible par les parents ?',
  noteVisible: 'visible des parents',
  notePrivate: 'privé',
  summary: (n, late, urgent) =>
    `${n} dossier${n > 1 ? 's' : ''} actif${n > 1 ? 's' : ''}` +
    (late ? ` · ${late} en retard` : '') +
    ` · ${urgent} échéance${urgent > 1 ? 's' : ''} imminente${urgent > 1 ? 's' : ''}`,
  hiddenRows: (n) => `${n} autres échéances non affichées.`,
  resynced: (a, r, d) => `Calendrier réaligné : ${a} ajoutées, ${r} redatées, ${d} retirées.`,
};

let lang = 'fr';
let ui = UI_FR;
let milestonesEn = null;
let phasesEn = null;

/** À appeler une fois au démarrage de la page, avant tout rendu. */
export async function initLang() {
  lang = currentLang();
  if (lang === 'en') {
    const mod = await import('./milestones.en.js');
    milestonesEn = mod.MILESTONES_EN;
    phasesEn = mod.PHASES_EN;
    ui = mod.UI_EN;
    document.documentElement.lang = 'en';
  }
  return lang;
}

export const getLang = () => lang;

/** Libellé d'interface. */
export const t = (key) => ui[key] ?? UI_FR[key] ?? key;

/** Libellé d'interface imbriqué : t2('status', 'fait'). */
export const t2 = (group, key) => ui[group]?.[key] ?? UI_FR[group]?.[key] ?? key;

/**
 * Champ traduit d'un jalon, avec repli sur le français si la traduction manque —
 * mieux vaut une ligne en français qu'un champ vide.
 */
export function mt(milestone, field) {
  if (lang === 'en' && milestonesEn?.[milestone.id]?.[field] != null) {
    return milestonesEn[milestone.id][field];
  }
  return milestone[field];
}

/** Phase traduite. */
export function pt(phaseKey, field) {
  if (lang === 'en' && phasesEn?.[phaseKey]?.[field] != null) return phasesEn[phaseKey][field];
  const p = PHASES.find((x) => x.key === phaseKey);
  return p ? p[field] : '';
}

/** Libellé d'une classe, éventuellement suivi de l'année scolaire. */
export function classLabel(classKey, schoolYear) {
  const label = t2('classes', classKey);
  return schoolYear == null ? label : `${label} · ${schoolYear}-${schoolYear + 1}`;
}

/** Format de date adapté à la langue courante. */
export function dateFormatter(opts) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', opts);
}
