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

  // Navigation
  navJour: 'Écran du jour', navDossiers: 'Dossiers', navFiches: 'Fiches université',

  // Écran du jour
  jourTitre: 'Écran du jour',
  jourIntro: "Ce qui demande une action, tous dossiers confondus. Une tâche apparaît quand il est temps de s'en occuper, avec le gras nécessaire avant l'échéance.",
  kpiDossiers: 'dossiers', kpiRetard: 'en retard', kpiUrgent: 'urgentes', kpiApparues: 'apparues cette semaine', kpiIrrattrapables: 'irrattrapables sous 14 jours',
  jourVide: "Rien ne demande d'action aujourd'hui.",
  colEleve: 'Élève', colTache: 'Tâche', colQui: 'Qui', colEcheance: 'Échéance', colDelai: 'Délai', colStatut: 'Statut',
  fait: 'Fait', ouvrirDossier: 'Ouvrir', nouvelle: 'nouvelle',
  aSynchroniser: (n) => `${n} dossier${n > 1 ? 's' : ''} sans tâches : ouvrir chacun pour générer son calendrier, ou tout synchroniser.`,
  toutSynchroniser: 'Tout synchroniser',
  synchronise: (a, r, e) => `Synchronisé : ${a} ajoutée${a > 1 ? 's' : ''}, ${r} mise${r > 1 ? 's' : ''} à jour, ${e} effacée${e > 1 ? 's' : ''}.`,

  // Dossiers
  dossiersTitre: 'Dossiers',
  colClasse: 'Classe', colAvancement: 'Avancement', colProchaine: 'Prochaine échéance',
  aucunDossier: 'Aucun dossier. Les dossiers se créent dans le pilotage.',
  sansTaches: 'calendrier à générer',
  dossierTermine: 'dossier terminé',
  retards: (n) => `${n} en retard`,

  // Fiche élève
  retourDossiers: 'Tous les dossiers',
  ciblesTitre: 'Universités',
  ciblesIntro: "Une université envisagée génère ce qui se prépare avant septembre de terminale. Une université retenue génère aussi le dépôt, les formulaires, les pièces. Retirer une université efface ce qui n'est pas commencé.",
  ciblesVide: 'Aucune université attachée à ce dossier.',
  ajouterUniversite: 'Ajouter une université',
  ajouterPlaceholder: 'Nom, puis choisir dans la liste',
  universiteInconnue: 'Inconnue du référentiel : lancer une fiche depuis « Fiches université », puis revenir.',
  envisagee: 'Envisagée', retenue: 'Retenue',
  tourLabel: 'Tour', tours: { '': '—', anticipe: 'Anticipé', ordinaire: 'Ordinaire' },
  decisionLabel: 'Décision', decisions: { '': '—', admis: 'Admise', refuse: 'Refusée', report: 'Reportée', attente: "Liste d'attente", retire: 'Retirée' },
  fiche: 'fiche', exigencesValidees: (n) => `${n} exigence${n > 1 ? 's' : ''} validée${n > 1 ? 's' : ''}`,
  sansExigence: 'sans fiche validée',
  retirer: 'Retirer',
  retirerConfirm: "Retirer cette université ? Ses tâches non commencées seront effacées.",
  optionsTitre: 'Options du dossier',
  options: { artistique: 'Dossier artistique', sportif: 'Voie sportive', aide_financiere: 'Aide financière' },
  niveau: 'Vue', niveauTout: 'Tout le dossier', niveauPays: 'Par pays', niveauUniversite: 'Par université',
  qui: 'Qui', quiTous: 'Tous', quiParents: 'Parents', quiEleve: 'Élève', quiCarmine: 'Carmine', quiEtablissement: 'Établissement',
  etat: 'État', etatTous: 'Tout', etatAFaire: 'À faire', etatAVenir: 'À venir', etatFait: 'Fait',
  taches: (n) => `${n} tâche${n > 1 ? 's' : ''}`,
  partagee: 'Partagée',
  filieres: { uk: 'Royaume-Uni', us: 'États-Unis', eu: 'Europe', fr: 'France' },
  statutsTache: { a_venir: 'À venir', a_faire: 'À faire', en_cours: 'En cours', fait: 'Fait', sans_objet: 'Sans objet', effacee: 'Effacée' },
  urgences: { retard: 'En retard', urgent: 'Urgent', bientot: 'Bientôt', ok: '' },
  owners: { carmine: 'Carmine', eleve: 'Élève', parents: 'Parents', etablissement: 'Établissement', externe: 'Organisme externe' },
  apparait: 'Apparaît le', echeanceLabel: 'Échéance', jusquAu: "jusqu'au",
  dateConfirmee: 'Date confirmée', confirmerDate: 'Confirmer la date sur la source',
  irrattrapable: 'Irrattrapable',
  messageParents: 'Message aux parents', notePrivee: 'Note privée',
  aucuneTache: 'Aucune tâche dans cette vue.',
  exporter: 'Exporter le dossier', exportTitre: 'Dossier université', exportSocle: 'Étapes communes', exportLivrables: 'Documents remis',
  purposeLabel: 'À quoi sert cette étape',
  emailTitre: 'Email', emailIntro: "Un brouillon dans ta voix, à partir de la trame du type de tâche et du dossier. Tu relis, tu envoies depuis Gmail.",
  emailA: 'À', emailObjet: 'Objet', emailCorps: 'Message', ouvrirGmail: 'Ouvrir dans Gmail', marquerEnvoye: 'Marquer envoyé', envoyeLe: 'Envoyé le',
  preparerEmail: "Préparer l'email", regenerer: 'Regénérer', redactionEnCours: 'Rédaction en cours…',
  briefTitre: "Brief d'essai", briefIntro: "Un brief prépare l'élève à écrire : ce que l'université cherche, ce que le dossier contient déjà, cinq questions pour la première version. Il n'écrit rien à sa place.",
  genererBrief: 'Générer le brief', publierEleve: "Publier pour l'élève",
  statutsLivrable: { brouillon: 'Brouillon', relu: 'Relu', publie: 'Publié' },
  piecesTitre: 'Pièces', aucunePiece: 'Aucune pièce déposée.', deposerPiece: 'Déposer une pièce', deposerHint: 'PDF, image ou document', envoiEnCours: 'Envoi…',
  modelesTitre: 'Modèles', trameMissing: "Ce modèle n'est pas encore en base.",
  dossierLabel: 'Dossier', prochaine: 'Prochaine échéance', rienAFaire: "Rien n'est attendu de vous pour le moment",
  focusTitre: "Ce que nous attendons de vous", parcours: 'Le parcours', quiVous: 'Vous', quiEnfant: 'Votre enfant',
  signedInAs: 'Connecté en tant que', aucunDossierFamille: "Aucun dossier n'est rattaché à cette adresse.",
  repereTag: 'Notre méthode', repereBody: "Cette date n'est imposée par aucune université : c'est un rythme que nous nous donnons pour arriver prêts aux échéances qui, elles, ne se rattrapent pas.",
  watchOut: 'Point de vigilance.', weProduce: 'Ce que nous produisons', weExpect: 'Ce que nous attendons de vous', nothingExpected: 'Rien de particulier à cette étape.', whereWeAre: 'Où en sommes-nous',
  nouveauDossier: 'Nouveau dossier', prenom: 'Prénom', nom: 'Nom', classeActuelle: 'Classe actuelle', lycee: 'Établissement', ville: 'Ville',
  filieresLabel: 'Filières visées', creerDossier: 'Créer le dossier', choisirFiliere: 'Choisir au moins une filière.',
  archiver: 'Archiver le dossier', archiverConfirm: "Archiver ce dossier ? Il sort des listes et de l'écran du jour ; rien n'est supprimé.",
  passees: (n) => `${n} étape${n > 1 ? 's' : ''} antérieure${n > 1 ? 's' : ''} à la prise en charge`,
  passeesIntro: "Ce que la méthode prévoit avant l'année d'entrée. Ces étapes n'étaient pas demandées : elles sont rangées sans objet, jamais en retard.",
  methodeTitre: 'Mode opératoire, interne',
  ajouterBtn: 'Ajouter', anneeEnCours: 'Année en cours', fermer: 'Fermer',
  aujourdhui: "aujourd'hui", demain: 'demain', hier: 'hier',
  dans: (n) => `dans ${n} j`, retardDe: (n) => `en retard de ${n} j`,
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

  navJour: 'Today', navDossiers: 'Files', navFiches: 'University sheets',
  jourTitre: 'Today',
  jourIntro: 'What needs action, across every file. A task appears when it is time to deal with it, with the slack needed before the deadline.',
  kpiDossiers: 'files', kpiRetard: 'overdue', kpiUrgent: 'urgent', kpiApparues: 'appeared this week', kpiIrrattrapables: 'unrecoverable within 14 days',
  jourVide: 'Nothing needs action today.',
  colEleve: 'Student', colTache: 'Task', colQui: 'Who', colEcheance: 'Due', colDelai: 'Delay', colStatut: 'Status',
  fait: 'Done', ouvrirDossier: 'Open', nouvelle: 'new',
  aSynchroniser: (n) => `${n} file${n > 1 ? 's' : ''} without tasks: open each to generate its calendar, or sync all.`,
  toutSynchroniser: 'Sync all',
  synchronise: (a, r, e) => `Synced: ${a} added, ${r} updated, ${e} cleared.`,
  dossiersTitre: 'Files',
  colClasse: 'Year', colAvancement: 'Progress', colProchaine: 'Next deadline',
  aucunDossier: 'No file. Files are created in the steering area.',
  sansTaches: 'calendar to generate',
  dossierTermine: 'file complete',
  retards: (n) => `${n} overdue`,
  retourDossiers: 'All files',
  ciblesTitre: 'Universities',
  ciblesIntro: 'A university under consideration generates what is prepared before September of the final year. A retained university also generates the submission, forms and documents. Removing a university clears what has not started.',
  ciblesVide: 'No university attached to this file.',
  ajouterUniversite: 'Add a university',
  ajouterPlaceholder: 'Name, then pick from the list',
  universiteInconnue: 'Not in the reference table: run a sheet from “University sheets”, then come back.',
  envisagee: 'Considered', retenue: 'Retained',
  tourLabel: 'Round', tours: { '': '—', anticipe: 'Early', ordinaire: 'Regular' },
  decisionLabel: 'Decision', decisions: { '': '—', admis: 'Admitted', refuse: 'Rejected', report: 'Deferred', attente: 'Waitlisted', retire: 'Withdrawn' },
  fiche: 'sheet', exigencesValidees: (n) => `${n} validated requirement${n > 1 ? 's' : ''}`,
  sansExigence: 'no validated sheet',
  retirer: 'Remove',
  retirerConfirm: 'Remove this university? Its unstarted tasks will be cleared.',
  optionsTitre: 'File options',
  options: { artistique: 'Arts portfolio', sportif: 'Athletic route', aide_financiere: 'Financial aid' },
  niveau: 'View', niveauTout: 'Whole file', niveauPays: 'By country', niveauUniversite: 'By university',
  qui: 'Who', quiTous: 'All', quiParents: 'Parents', quiEleve: 'Student', quiCarmine: 'Carmine', quiEtablissement: 'School',
  etat: 'State', etatTous: 'All', etatAFaire: 'To do', etatAVenir: 'Upcoming', etatFait: 'Done',
  taches: (n) => `${n} task${n > 1 ? 's' : ''}`,
  partagee: 'Shared',
  filieres: { uk: 'United Kingdom', us: 'United States', eu: 'Europe', fr: 'France' },
  statutsTache: { a_venir: 'Upcoming', a_faire: 'To do', en_cours: 'In progress', fait: 'Done', sans_objet: 'Not applicable', effacee: 'Cleared' },
  urgences: { retard: 'Overdue', urgent: 'Urgent', bientot: 'Soon', ok: '' },
  owners: { carmine: 'Carmine', eleve: 'Student', parents: 'Parents', etablissement: 'School', externe: 'External body' },
  apparait: 'Appears on', echeanceLabel: 'Due', jusquAu: 'until',
  dateConfirmee: 'Date confirmed', confirmerDate: 'Confirm the date on the source',
  irrattrapable: 'Unrecoverable',
  messageParents: 'Message to parents', notePrivee: 'Private note',
  aucuneTache: 'No task in this view.',
  exporter: 'Export the file', exportTitre: 'University file', exportSocle: 'Common steps', exportLivrables: 'Documents delivered',
  purposeLabel: 'What this step is for',
  emailTitre: 'Email', emailIntro: 'A draft in your voice, from the task type template and the file. You review, you send from Gmail.',
  emailA: 'To', emailObjet: 'Subject', emailCorps: 'Message', ouvrirGmail: 'Open in Gmail', marquerEnvoye: 'Mark as sent', envoyeLe: 'Sent on',
  preparerEmail: 'Prepare the email', regenerer: 'Regenerate', redactionEnCours: 'Writing…',
  briefTitre: 'Essay brief', briefIntro: 'A brief prepares the student to write: what the university is after, what the file already holds, five questions for the first draft. It writes nothing in their place.',
  genererBrief: 'Generate the brief', publierEleve: 'Publish for the student',
  statutsLivrable: { brouillon: 'Draft', relu: 'Reviewed', publie: 'Published' },
  piecesTitre: 'Documents', aucunePiece: 'No document uploaded.', deposerPiece: 'Upload a document', deposerHint: 'PDF, image or document', envoiEnCours: 'Uploading…',
  modelesTitre: 'Templates', trameMissing: 'This template is not in the database yet.',
  dossierLabel: 'File', prochaine: 'Next deadline', rienAFaire: 'Nothing is expected from you for now',
  focusTitre: 'What we need from you', parcours: 'The journey', quiVous: 'You', quiEnfant: 'Your child',
  signedInAs: 'Signed in as', aucunDossierFamille: 'No file is attached to this address.',
  repereTag: 'Our method', repereBody: 'No university imposes this date: it is a rhythm we set ourselves so as to arrive ready for the deadlines that cannot be recovered.',
  watchOut: 'Worth knowing.', weProduce: 'What we produce', weExpect: 'What we need from you', nothingExpected: 'Nothing in particular at this step.', whereWeAre: 'Where we are',
  nouveauDossier: 'New file', prenom: 'First name', nom: 'Last name', classeActuelle: 'Current year', lycee: 'School', ville: 'City',
  filieresLabel: 'Tracks', creerDossier: 'Create the file', choisirFiliere: 'Pick at least one track.',
  archiver: 'Archive the file', archiverConfirm: 'Archive this file? It leaves the lists and the daily screen; nothing is deleted.',
  passees: (n) => `${n} step${n > 1 ? 's' : ''} before intake`,
  passeesIntro: 'What the method plans before the year of entry. These steps were never asked for: they are filed as not applicable, never overdue.',
  methodeTitre: 'How to run it, internal',
  ajouterBtn: 'Add', anneeEnCours: 'Current year', fermer: 'Close',
  aujourdhui: 'today', demain: 'tomorrow', hier: 'yesterday',
  dans: (n) => `in ${n} d`, retardDe: (n) => `${n} d overdue`,
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

/** Délai en clair, à partir d'une date ISO. */
export function delai(iso, today = new Date()) {
  const a = Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const d = Math.round((a - b) / 86_400_000);
  if (d === 0) return t('aujourdhui');
  if (d === 1) return t('demain');
  if (d === -1) return t('hier');
  return d > 0 ? t('dans')(d) : t('retardDe')(-d);
}

export function fmtIso(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(ui === EN ? 'en-GB' : 'fr-FR',
    { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}
