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
  // L'accès s'ouvre à la main, au démarrage de l'accompagnement : la formulation
  // ne doit pas laisser croire qu'il suffit de le demander.
  noFile: "Aucun dossier n'est rattaché à cette adresse.<br>Si nous n'avons pas encore échangé, écrivez-nous — votre espace s'ouvre au démarrage de l'accompagnement.",
  discover: "Découvrir l'accompagnement",
  noFileYet: "Vous n'avez pas encore de dossier ?",

  // Démonstration publique — le dossier est inventé, et cela doit se lire
  // d'emblée : un visiteur qui croirait voir un vrai dossier verrait aussi
  // une confidentialité qui ne tient pas.
  demoTag: 'Exemple',
  demoIntro: "Ce dossier est fictif. Il montre l'espace tel que le voit une famille accompagnée : le calendrier complet, étape par étape, les comptes rendus de séance et l'avancement réel. Les documents déposés, la méthode interne et les échanges n'apparaissent que dans un dossier ouvert.",
  demoCtaTitle: 'Et pour votre enfant ?',
  demoCtaBody: "Le calendrier se construit à partir de sa classe actuelle et des pays visés. Écrivez-nous : nous ouvrons votre espace, et celui de votre enfant, une fois l'accompagnement engagé.",
  demoCtaButton: 'Nous écrire',
  seeExample: 'Voir un exemple de suivi',

  file: 'Dossier',
  fileFollowed: 'Dossier suivi',
  nextDeadline: 'Prochaine échéance',
  nothingDue: 'Rien ne requiert votre attention',
  nothingExpected: 'Rien de votre côté à cette étape.',
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
  progressCount: (done, total, late) =>
    `${done} sur ${total}${late ? ` · ${late} en retard` : ''}`,
  step: 'étape',
  sessionNotes: 'Comptes rendus de séance',
  signOut: 'Se déconnecter',
  consolidated: 'Calendrier consolidé',
  allTracks: 'Toutes les filières',
  pastTitle: 'étapes antérieures à votre prise en charge',
  pastIntro: "Ces étapes précèdent le début de notre accompagnement. Elles figurent ici pour mémoire, et ne constituent pas un retard.",

  purpose: 'À quoi sert cette étape',
  concerns: 'Concerne',
  concernsTitle: 'Qui est concerné',
  weProduce: 'Ce que nous produisons',
  weExpect: 'Ce que nous attendons de vous',
  people: 'Intervenants',
  watchOut: 'Point de vigilance.',
  methodTitle: 'Mode opératoire — interne',
  loading: 'Chargement…',
  questionsTitle: 'Questions à poser',
  trameMissing: 'Ce modèle n’est pas encore en base.',
  questionsCopy: 'Copier pour les transmettre',
  questionsCopied: 'Copié',
  questionsIntro: "À adapter à l'université concernée, puis à transmettre. Rappeler à l'élève de noter le nom de la personne qui lui répond : un essai citant une réponse précise se distingue d'un essai citant une brochure.",
  wishesTitle: 'Les universités qui vous intéressent',
  wishesIntro: "Notez-les librement, même si vous n'êtes pas sûrs : c'est le point de départ de la conversation, pas un engagement. Une université absente de nos référentiels a toute sa place ici.",
  wishesIntroAdmin: 'Les souhaits déposés par la famille, tels quels. À convertir en cibles ci-dessous, ou à discuter.',
  wishesEmpty: 'Aucun souhait déposé pour le moment.',
  wishesToDocument: (n) => `${n} établissement${n > 1 ? 's' : ''} à documenter dans le référentiel.`,
  wishPlaceholder: "Nom d'une université",
  selectionTitle: 'La sélection retenue',
  retained: 'Retenue',
  retenuesCount: (n, total) => `${n} retenue${n > 1 ? 's' : ''} sur ${total} envisagée${total > 1 ? 's' : ''}.`,
  selectionEmpty: "Aucune université retenue pour l'instant.",
  pickUniversity: 'Choisir dans le référentiel…',
  admissionRate: 'Admission',
  testsNotApplicable: 'tests non applicables',
  bands: { ambitieuse: 'Ambitieuses', plausible: 'Plausibles', probable: 'Probables' },

  journalTitles: { lecture: 'Journal de lecture', projet: 'Carnet de projet', essai: 'Banque d’essais', contact: 'Journal de contacts' },
  journalIntros: {
    lecture: "Pour chaque lecture ou cours suivi, trois lignes suffisent. C’est ce carnet qui, en juillet, rendra le Personal Statement rédigeable — et c’est exactement ce que creusera l’entretien.",
    projet: "Ce carnet ne sert pas à nous rendre des comptes : il sert à toi, en octobre, quand il faudra raconter ce projet en six cent cinquante mots. Note ce que tu as fait et ce que tu en tires. Nous le relisons ensemble en séance pour creuser, jamais pour vérifier.",
    essai: "Chaque version compte. Gardez trace de ce qui fonctionne et de ce que vous coupez : la banque d’essais se réutilise d’une université à l’autre.",
    contact: "Une ligne par session suivie ou par échange. Ce que vous notez ici se retrouvera mot pour mot dans les essais « pourquoi nous » de l’automne.",
  },
  journalFields: {
    retenu: 'Ce que j’en retiens',
    desaccord: 'Ce avec quoi je ne suis pas d’accord',
    question: 'La question que cela m’ouvre',
  },
  journalHints: {
    retenu: 'L’idée que vous garderiez si vous ne deviez en garder qu’une.',
    desaccord: 'Même un désaccord partiel. C’est ce qu’on vous demandera de défendre.',
    question: 'Ce que vous aimeriez creuser ensuite.',
  },
  journalEmpty: {
    lecture: 'Rien encore. Ajoutez la première lecture ci-dessous — un titre suffit pour commencer.',
    projet: 'Rien encore. Note ci-dessous ce que tu as fait la dernière fois que tu y as travaillé.',
    essai: 'Rien encore. Ajoutez un premier essai ci-dessous.',
    contact: 'Rien encore. Notez ci-dessous la première session suivie.',
  },
  journalNew: { lecture: 'Titre du livre, de l’article ou du cours', projet: 'Ce que tu as fait cette fois', essai: 'Intitulé de l’essai', contact: 'Université et type de contact' },
  journalRefHint: 'Auteur, plateforme ou lien — facultatif',
  journalAdd: 'Ajouter',
  journalRemove: 'Retirer',
  journalAnnotated: 'annoté',
  journalToAnnotate: 'à annoter',
  journalCount: (faits, total) => `${faits} annoté${faits > 1 ? 's' : ''} sur ${total}`,

  deadlineNature: "Nature de l'échéance",
  deadlineNatureBody: "Cette date ne se rattrape pas. Elle reste affichée en tête de votre espace à mesure qu'elle approche.",
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
  savedAuto: 'Enregistré automatiquement',
  close: 'Fermer',
  whereWeAre: 'Où en sommes-nous',

  status: { a_faire: 'À faire', en_cours: 'En cours', fait: 'Terminé', sans_objet: 'Sans objet' },

  today: "aujourd'hui",
  fromDate: 'À partir du',
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

  // Ouverture des accès — l'accès se donne à la main, jamais sur demande.
  accessTitle: 'Accès au dossier',
  accessIntro: "Une adresse par personne. L'accès s'ouvre immédiatement si elle s'est déjà connectée ; sinon il s'active à sa première connexion, avec le lien qu'elle recevra en se connectant depuis l'espace client.",
  accessCount: (n) => `${n} adresse${n > 1 ? 's' : ''}`,
  accessEmpty: 'Personne n’a encore accès à ce dossier.',
  accessPlaceholder: 'adresse@exemple.com',
  accessOpen: "Ouvrir l'accès",
  accessActive: 'Actif',
  accessPending: 'En attente de première connexion',
  accessRemove: 'Retirer',
  accessConfirmRemove: "Retirer cet accès ? La personne ne verra plus le dossier.",
  accessRoles: { parent: 'Parent', eleve: 'Élève' },

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
