/**
 * Générateur de tâches — pur, sans réseau, testable en Node.
 *
 * Reçoit un dossier, le socle, les exigences validées de ses universités, ses
 * cibles et les types de tâche ; rend la liste complète des tâches voulues,
 * de la classe d'entrée à la rentrée universitaire. La comparaison avec la
 * base et l'écriture se font ailleurs (donnees.js).
 */
import {
  dueDate, periodEnd, daysUntil, scheduleForStudentIn, outOfScopeIn, CLASSES,
} from '../portail/calendrier.js';
import {
  RETIRES, OPTIONS, PAYS_CONDITION, CANDIDATURE, tracksDe, DEPOT_REPLI, PROFIL_DATE, PAR_TYPE,
} from './socle.js';

const JOUR = 86_400_000;
const plusJours = (date, n) => new Date(date.getTime() + n * JOUR);
const iso = (date) => date.toISOString().slice(0, 10);
const dateDe = (v) => (v instanceof Date ? v : new Date(`${v}T00:00:00Z`));

/** Clé d'identité d'une tâche voulue, alignée sur la contrainte d'unicité en base. */
export const cle = (t) =>
  [t.origine, t.milestone_id ?? '', t.exigence_id ?? '', t.universite_id ?? ''].join('|');

/**
 * @param student   { id, tracks, terminale_year, entry_class, options }
 * @param socle     MILESTONES
 * @param exigences lignes validées, chacune avec `universite` { id, pays, filiere }
 * @param cibles    { universite_id, retenue, tour, decision, decision_le, offre, offre_le, universite }
 * @param types     { [type]: { duree_jours, gras_jours } }
 */
export function genererTaches({ student, socle, exigences, cibles, types }) {
  const options = student.options ?? [];
  const paysVises = new Set(cibles.map((c) => c.universite?.pays).filter(Boolean));
  const T = student.terminale_year;

  /* ── Socle ─────────────────────────────────────────────────── */
  const applicable = socle.filter((m) => {
    if (RETIRES.has(m.id)) return false;
    if (!tracksDe(m).some((tr) => student.tracks.includes(tr))) return false;
    if (OPTIONS[m.id] && !OPTIONS[m.id].some((o) => options.includes(o))) return false;
    if (PAYS_CONDITION[m.id] && !PAYS_CONDITION[m.id].some((p) => paysVises.has(p))) return false;
    return true;
  });
  // scheduleForStudentIn filtre lui-même par filière : on lui passe toutes
  // les filières du jalon, la nôtre ayant déjà été appliquée ci-dessus.
  const toutes = ['uk', 'us', 'eu', 'fr'];
  const socleFiltre = applicable.map((m) => ({ ...m, tracks: tracksDe(m) }));
  const horsPerimetre = new Set(
    outOfScopeIn(socleFiltre, toutes, T, student.entry_class).map((i) => i.milestone.id),
  );

  const taches = scheduleForStudentIn(socleFiltre, toutes, T, student.entry_class)
    .map(({ milestone: m, due }) => ({
      origine: 'socle',
      milestone_id: m.id,
      exigence_id: null,
      universite_id: null,
      type: m.kind,
      titre: m.title,
      consigne: null,
      owners: m.owners,
      lock: Boolean(m.lock),
      apparition: iso(due),
      echeance: iso(periodEnd(m, due)),
      fin_periode: m.finM ? iso(periodEnd(m, due)) : null,
      hors_perimetre: horsPerimetre.has(m.id),
      partagee: CANDIDATURE.has(m.id),
      filieres: tracksDe(m),
      rattrape: Boolean(m.rattrape),
    }));

  /* ── Exigences des universités ─────────────────────────────── */
  const actives = cibles.filter((c) => !['refuse', 'retire'].includes(c.decision ?? ''));
  const parUniversite = new Map();
  for (const e of exigences) {
    if (!parUniversite.has(e.universite_id)) parUniversite.set(e.universite_id, []);
    parUniversite.get(e.universite_id).push(e);
  }

  for (const c of actives) {
    const lignes = parUniversite.get(c.universite_id) ?? [];
    const u = c.universite ?? lignes[0]?.universite ?? {};
    const filiere = u.filiere ?? 'us';

    // Le dépôt de référence de cette université pour cet élève : celui du tour
    // choisi, sinon celui de repli de la filière. Les exigences sans date s'y accrochent.
    const depots = lignes.filter((e) => e.type === 'depot' && tourOk(e, c) && e.y != null);
    const depotRef = depots.length
      ? depots.map((e) => dueDate({ y: e.y, m: e.m, d: e.d }, T)).sort((a, b) => a - b)[0]
      : dueDate(DEPOT_REPLI[filiere] ?? DEPOT_REPLI.us, T);

    for (const e of lignes) {
      if (e.regime === 'retenue' && !c.retenue) continue;
      if (!tourOk(e, c)) continue;

      const typeCfg = types[e.type] ?? { duree_jours: 0, gras_jours: 0 };
      const duree = e.duree_jours ?? typeCfg.duree_jours ?? 0;
      const gras = typeCfg.gras_jours ?? 0;

      let echeance;
      let finPeriode = null;
      if (e.type === 'profil') {
        // Une condition de profil se joue au choix des spécialités. Pour un
        // élève pris après, elle n'est pas en retard : elle est à vérifier à
        // l'entrée, sous trois semaines.
        const datePrevue = dueDate(PROFIL_DATE, T);
        const yEntree = CLASSES.find((c) => c.key === student.entry_class)?.y ?? -6;
        const entree = new Date(Date.UTC(T + yEntree, 8, 1));
        echeance = datePrevue < entree ? plusJours(entree, 21) : datePrevue;
      } else if (e.relatif_a) {
        const ev = dateEvenement(e.relatif_a, c, student);
        if (!ev) continue; // l'événement n'est pas encore arrivé
        echeance = plusJours(ev, e.delai_jours ?? 0);
      } else if (e.y != null && e.m != null) {
        echeance = dueDate({ y: e.y, m: e.m, d: e.d ?? 1 }, T);
        if (e.fin_m != null) {
          finPeriode = periodEnd({ finM: e.fin_m, m: e.m }, echeance);
          echeance = finPeriode;
        }
      } else {
        echeance = depotRef;
      }

      const debut = finPeriode ? dueDate({ y: e.y, m: e.m, d: e.d ?? 1 }, T) : echeance;
      const apparition = e.type === 'profil'
        ? plusJours(echeance, -21)
        : plusJours(debut, -(duree + gras));

      const cfg = PAR_TYPE[e.type] ?? PAR_TYPE.autre;
      taches.push({
        origine: 'exigence',
        milestone_id: null,
        exigence_id: e.id,
        universite_id: c.universite_id,
        type: e.type,
        titre: e.type === 'profil' && dueDate(PROFIL_DATE, T) < echeance ? `Vérifier : ${e.libelle}` : e.libelle,
        consigne: e.consigne ?? null,
        owners: cfg.owners,
        lock: cfg.lock,
        apparition: iso(apparition),
        echeance: iso(echeance),
        fin_periode: finPeriode ? iso(finPeriode) : null,
        hors_perimetre: false,
        partagee: false,
        filieres: [filiere],
        rattrape: false,
      });
    }

    /* ── Événements ──────────────────────────────────────────── */
    if (c.decision && c.decision_le) {
      const d0 = dateDe(c.decision_le);
      const d26 = socle.find((m) => m.id === 'D-26');
      if (['report', 'attente'].includes(c.decision) && d26) {
        taches.push(evenement('D-26', d26.title, ['eleve', 'carmine'], plusJours(d0, 14), d0, c, filiere));
      }
      const d18 = socle.find((m) => m.id === 'D-18');
      if (c.decision === 'admis' && c.tour === 'anticipe' && d18) {
        taches.push(evenement('D-18', 'Retrait des autres candidatures', ['eleve', 'carmine'],
          plusJours(d0, 2), d0, c, filiere, true));
      }
    }
  }

  return taches;
}

function evenement(milestoneId, titre, owners, echeance, apparition, c, filiere, lock = false) {
  return {
    origine: 'evenement', milestone_id: milestoneId, exigence_id: null, universite_id: c.universite_id,
    type: 'jalon', titre, consigne: null, owners, lock,
    apparition: iso(apparition), echeance: iso(echeance), fin_periode: null,
    hors_perimetre: false, partagee: false, filieres: [filiere], rattrape: false,
  };
}

/** Une ligne de dépôt anticipé ne vaut que pour un dossier en tour anticipé, et inversement. */
function tourOk(e, c) {
  if (!e.tour) return true;
  if (e.tour === 'anticipe') return c.tour === 'anticipe';
  return c.tour !== 'anticipe';
}

function dateEvenement(relatifA, c, student) {
  if (relatifA === 'decision') return c.decision_le ? dateDe(c.decision_le) : null;
  if (relatifA === 'offre_ferme') return c.offre === 'ferme' && c.offre_le ? dateDe(c.offre_le) : null;
  if (relatifA === 'admission') return c.decision === 'admis' && c.decision_le ? dateDe(c.decision_le) : null;
  return null;
}

/* ── Lecture d'une tâche en base ───────────────────────────────── */

/** Statut effectif : une tâche « à venir » dont la date d'apparition est passée est à faire. */
export function statutEffectif(t, today = new Date()) {
  if (t.statut === 'a_venir' && daysUntil(dateDe(t.apparition), today) <= 0) return 'a_faire';
  return t.statut;
}

/** Urgence, avec des seuils plus larges pour l'irrattrapable. */
export function urgenceTache(t, today = new Date()) {
  const st = statutEffectif(t, today);
  if (['fait', 'sans_objet', 'effacee', 'a_venir'].includes(st)) return 'ok';
  const d = daysUntil(dateDe(t.echeance), today);
  if (d < 0) return 'retard';
  if (t.lock) {
    if (d <= 14) return 'urgent';
    if (d <= 45) return 'bientot';
    return 'ok';
  }
  if (d <= 7) return 'urgent';
  if (d <= 21) return 'bientot';
  return 'ok';
}

/** Vraie si la tâche est apparue depuis moins de sept jours. */
export function apparueCetteSemaine(t, today = new Date()) {
  const d = daysUntil(dateDe(t.apparition), today);
  return d <= 0 && d > -7 && statutEffectif(t, today) === 'a_faire';
}

/** Classe scolaire à laquelle appartient une date, pour un pivot de terminale donné. */
export function classeDe(dateIso, terminaleYear) {
  const d = dateDe(dateIso);
  const sy = d.getUTCMonth() + 1 >= 8 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  const y = sy - terminaleYear;
  return CLASSES.find((c) => c.y === y) ?? CLASSES[CLASSES.length - 1];
}

/**
 * Les tâches qui composent le dossier d'une université : les siennes, plus
 * les partagées de sa filière.
 */
export function tachesDeUniversite(taches, universiteId, filiere) {
  return taches.filter((t) =>
    t.universite_id === universiteId
    || (t.universite_id == null && t.partagee && (t.filieres ?? []).includes(filiere)));
}

/** Avancement sur un ensemble de tâches : faits sur total, hors sans objet et effacées. */
export function avancement(taches, today = new Date()) {
  let done = 0; let total = 0; let late = 0;
  for (const t of taches) {
    const st = statutEffectif(t, today);
    if (st === 'sans_objet' || st === 'effacee') continue;
    total += 1;
    if (st === 'fait') done += 1;
    else if (st !== 'a_venir' && daysUntil(dateDe(t.echeance), today) < 0) late += 1;
  }
  return { done, total, late, pct: total ? Math.round((done / total) * 100) : 0 };
}
