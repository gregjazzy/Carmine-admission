/**
 * Mécanique du calendrier — sans aucune donnée.
 *
 * Dates, classes, urgences, découpage par année : tout ce qui se calcule vit
 * ici, séparé du référentiel. La démonstration publique embarque ce module
 * avec un squelette allégé (milestones.demo.js) ; le référentiel complet —
 * la méthode, ce que vend l'accompagnement — ne quitte jamais l'espace
 * authentifié.
 */

export const PHASES = [
  {
    key: 0,
    roman: 'I',
    title: 'Amont',
    when: 'De la sixième à la troisième',
    intro:
      "On ne prépare pas encore un dossier : on construit un élève. Choix d'établissement, niveau de langue, premiers engagements réels. C'est aussi l'année où s'ouvre le relevé de notes que liront les universités américaines.",
  },
  {
    key: 1,
    roman: 'II',
    title: 'Fondations',
    when: 'Seconde',
    intro:
      "L'année des décisions structurantes. Les spécialités choisies au printemps déterminent les cursus accessibles trois ans plus tard. On élague les activités et on lance le premier projet de fond.",
  },
  {
    key: 2,
    roman: 'III',
    title: 'Construction',
    when: 'Première',
    intro:
      "L'année la plus scrutée du dossier. Tests standardisés, distinction externe, liste d'universités, recommandeurs sollicités, et un été consacré à l'écriture.",
  },
  {
    key: 3,
    roman: 'IV',
    title: 'Candidature',
    when: 'Terminale',
    intro:
      'Quatre calendriers se superposent — britannique, américain, européen, français. Le travail devient un pilotage à la date près, où aucune échéance ne se rattrape.',
  },
  {
    key: 4,
    roman: 'V',
    title: 'Concrétisation',
    when: "Une fois l'admission obtenue",
    intro:
      "L'admission ne vaut que si elle se concrétise. Visa, conditions de notes à tenir, installation : la phase la plus sous-estimée, et celle où les délais administratifs font encore perdre des places chaque année.",
  },
];

/**
 * Date d'échéance d'un jalon pour un élève donné.
 * @param m jalon du référentiel
 * @param terminaleStartYear année civile de la RENTRÉE de terminale (ex. 2027)
 */
export function dueDate(m, terminaleStartYear) {
  const year = terminaleStartYear + m.y + (m.m >= 8 ? 0 : 1);
  return new Date(Date.UTC(year, m.m - 1, m.d));
}


/**
 * Fin de la période d'un jalon étalé.
 *
 * Sur ces jalons, `dueDate` marque le DÉBUT : la préparation au MAT s'ouvre le
 * 5 juillet et court jusqu'en octobre. Sans fin, le compte à rebours prenait ce
 * début pour une échéance et annonçait « en retard de trente-six jours » à une
 * élève parfaitement dans les temps.
 *
 * Les jalons `lock` en sont exempts : leur date ne se rattrape pas, c'est bien
 * une échéance, quelle que soit la fenêtre de préparation qui la précède.
 *
 * @param due date de début, déjà calculée pour l'élève
 */
export function periodEnd(m, due) {
  if (!m.finM) return due;
  // Une période peut franchir le 1er janvier : « Décembre – mars ».
  const an = due.getUTCFullYear() + (m.finM < m.m ? 1 : 0);
  return new Date(Date.UTC(an, m.finM, 0)); // jour 0 = dernier jour du mois précédent
}

/** Seuils de rappel, en jours avant échéance. */
export const REMINDERS = [45, 21, 10, 3, 0];
export const REMINDERS_STANDARD = [21, 7, 0];

export function daysUntil(due, today = new Date()) {
  const a = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - b) / 86_400_000);
}

/**
 * Niveau d'urgence d'un jalon, tel qu'il colore la fiche et déclenche les alertes.
 * Un jalon irrattrapable (`lock`) bascule en urgent bien plus tôt qu'un jalon ordinaire.
 */
export function urgency(m, due, status, today = new Date()) {
  if (status === 'fait' || status === 'sans_objet') return 'ok';
  const d = daysUntil(periodEnd(m, due), today);
  if (d < 0) return 'retard';
  if (m.lock) {
    if (d <= 14) return 'urgent';
    if (d <= 45) return 'bientot';
    return 'ok';
  }
  if (d <= 7) return 'urgent';
  if (d <= 21) return 'bientot';
  return 'ok';
}

/** Jalons applicables à un élève, triés par échéance — sur la liste fournie. */
export function scheduleForIn(list, tracks, terminaleStartYear) {
  return list.filter((m) => m.tracks.some((t) => tracks.includes(t)))
    .map((m) => ({ milestone: m, due: dueDate(m, terminaleStartYear) }))
    .sort((a, b) => a.due.getTime() - b.due.getTime());
}

/* ═══════════════════════ Classes et années scolaires ═══════════════════════ */

/**
 * Les classes, indexées par leur écart à la terminale.
 * C'est ce que l'on saisit à la création d'un dossier — jamais une année de terminale,
 * qui n'est qu'un pivot de calcul interne.
 */
export const CLASSES = [
  { key: 'sixieme',   label: 'Sixième',    short: '6e',  y: -6, year: 'Year 7',  grade: 'Grade 6' },
  { key: 'cinquieme', label: 'Cinquième',  short: '5e',  y: -5, year: 'Year 8',  grade: 'Grade 7' },
  { key: 'quatrieme', label: 'Quatrième',  short: '4e',  y: -4, year: 'Year 9',  grade: 'Grade 8' },
  { key: 'troisieme', label: 'Troisième',  short: '3e',  y: -3, year: 'Year 10', grade: 'Grade 9' },
  { key: 'seconde',   label: 'Seconde',    short: '2de', y: -2, year: 'Year 11', grade: 'Grade 10' },
  { key: 'premiere',  label: 'Première',   short: '1re', y: -1, year: 'Year 12', grade: 'Grade 11' },
  { key: 'terminale', label: 'Terminale',  short: 'Tle', y: 0,  year: 'Year 13', grade: 'Grade 12' },
  { key: 'apres',     label: 'Après le bac', short: 'Post-bac', y: 1, year: '—', grade: '—' },
];


/** Année civile de la rentrée scolaire en cours (une année bascule au 1er août). */
export function currentSchoolYear(today = new Date()) {
  return today.getMonth() + 1 >= 8 ? today.getFullYear() : today.getFullYear() - 1;
}

/**
 * Déduit l'année de rentrée de terminale à partir de la classe actuelle de l'élève.
 * Un élève en seconde (y = -2) à la rentrée 2026 sera en terminale à la rentrée 2028.
 */
export function terminaleYearFromClass(classKey, schoolYear = currentSchoolYear()) {
  const c = CLASSES.find((x) => x.key === classKey);
  if (!c) throw new Error(`Classe inconnue : ${classKey}`);
  return schoolYear - c.y;
}

/** Classe correspondant à une date donnée, pour un élève dont on connaît l'année de terminale. */
export function classAt(due, terminaleStartYear) {
  const sy = currentSchoolYear(due);
  const y = sy - terminaleStartYear;
  return CLASSES.find((c) => c.y === y) ?? CLASSES[CLASSES.length - 1];
}


/**
 * Calendrier d'un élève selon sa classe d'entrée.
 *
 * Deux natures d'étapes antérieures à la prise en charge :
 *  - l'occasion manquée (olympiades, projet de seconde) sort du calendrier
 *    — c'est le « hors périmètre », honnête et sans culpabilisation ;
 *  - l'étape marquée `rattrapable` (Personal Statement, essais, SAT,
 *    certification d'anglais) est OBLIGATOIRE pour candidater : elle ne
 *    disparaît pas, elle se replace à la rentrée de l'année d'entrée.
 *    Un dossier pris en terminale a un calendrier complet, pas troué.
 */
export function scheduleForStudentIn(list, tracks, terminaleStartYear, fromClass) {
  const minY = fromClass ? (CLASSES.find((c) => c.key === fromClass)?.y ?? -6) : -6;
  const items = scheduleForIn(list, tracks, terminaleStartYear).map((item) => {
    if (!item.milestone.rattrapable) return item;
    if (classAt(item.due, terminaleStartYear).y >= minY) return item;
    // échéance de rattrapage : le 30 septembre de l'année d'entrée —
    // la période d'origine (finM) n'a plus de sens, on la retire pour que
    // le compte à rebours parte de la nouvelle date.
    const sy = terminaleStartYear + minY;
    return {
      milestone: { ...item.milestone, finM: undefined, rattrape: true },
      due: new Date(Date.UTC(sy, 8, 30)),
    };
  });
  return items.sort((a, b) => a.due.getTime() - b.due.getTime());
}

/**
 * Calendrier complet d'un élève, découpé classe par classe.
 * Ne renvoie que les classes qui portent au moins un jalon applicable.
 */
export function scheduleByClassIn(list, tracks, terminaleStartYear, fromClass) {
  const minY = fromClass ? (CLASSES.find((c) => c.key === fromClass)?.y ?? -6) : -6;
  const groups = new Map();

  for (const item of scheduleForStudentIn(list, tracks, terminaleStartYear, fromClass)) {
    const c = classAt(item.due, terminaleStartYear);
    if (c.y < minY) continue;
    if (!groups.has(c.key)) {
      const sy = terminaleStartYear + c.y;
      groups.set(c.key, {
        classKey: c.key,
        label: c.label,
        fullLabel: `${c.label} · ${sy}-${sy + 1}`,
        schoolYear: sy,
        items: [],
      });
    }
    groups.get(c.key).items.push(item);
  }

  return [...groups.values()].sort((a, b) => a.schoolYear - b.schoolYear);
}

/**
 * Jalons déjà passés au moment de la prise en charge : ils ne sont pas supprimés,
 * mais marqués « hors périmètre » pour que le dossier reste honnête sans culpabiliser
 * une famille qui arrive tardivement.
 */
export function outOfScopeIn(list, tracks, terminaleStartYear, fromClass) {
  const minY = CLASSES.find((c) => c.key === fromClass)?.y ?? -6;
  // les rattrapables ne sont jamais « hors périmètre » : ils sont redatés
  return scheduleForIn(list, tracks, terminaleStartYear).filter(
    (i) => classAt(i.due, terminaleStartYear).y < minY && !i.milestone.rattrapable
  );
}

export const TRACK_LABEL = {
  uk: 'Royaume-Uni',
  us: 'États-Unis',
  eu: 'Europe',
};

export const OWNER_LABEL = {
  carmine: 'Carmine',
  eleve: 'Élève',
  parents: 'Parents',
  etablissement: 'Établissement',
  externe: 'Organisme externe',
};

export const KIND_LABEL = {
  livrable: 'Livrable',
  jalon: 'Jalon',
  document: 'Document',
  examen: 'Examen',
  formulaire: 'Formulaire',
};
