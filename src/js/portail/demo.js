/**
 * Démonstration publique — /demo
 *
 * Aucune connexion, aucun appel à Supabase : le dossier est fabriqué ici, en
 * mémoire. C'est délibéré. Un visiteur doit pouvoir voir ce qu'il achète sans
 * rien saisir, et une page qui n'interroge aucune donnée ne peut en laisser
 * fuir aucune.
 *
 * L'accès réel se donne à la main, après négociation : cette page ne mène donc
 * pas à un formulaire de connexion mais au formulaire de contact.
 */
import {
  MILESTONES, scheduleByClass, dueDate, currentSchoolYear, CLASSES, urgency, daysUntil,
} from './milestones.js';
import {
  milestoneCard, openPanel, trackFilter, ownerFilter, applyTrackFilter,
  esc, fmtDate, fmtShort, delayLabel,
} from './ui.js';
import { initLang, getLang, t, t2, mt, classLabel } from './lang.js';

const app = document.getElementById('portal-app');

/** Élève inventée : entrée en seconde, aujourd'hui en terminale, Royaume-Uni et États-Unis. */
const ELEVE = {
  first_name: 'Léa',
  last_name: 'Bertrand',
  entry_class: 'seconde',
  current_class: 'terminale',
  tracks: ['uk', 'us'],
  school: 'Lycée français international',
};

/**
 * Messages affichés aux parents sur quelques étapes, pour que la démonstration
 * montre un dossier tenu plutôt qu'un calendrier vide. Les autres étapes n'en
 * portent pas : un dossier réel n'est pas commenté ligne à ligne.
 */
const MESSAGES_FR = {
  'B-01': "Spécialités arrêtées en conseil de classe : mathématiques, physique-chimie, anglais monde contemporain. Cohérent avec les prérequis d'Imperial et de Berkeley.",
  'B-03': "Projet lancé en janvier : mesure comparée de la qualité de l'air devant trois écoles du quartier. Un enseignant de physique encadre le protocole.",
  'B-04': 'Premier SAT blanc : 1310 (lecture 620, mathématiques 690). L\'écart se joue sur la lecture, où le temps imparti reste le principal obstacle.',
  'C-01': "Note de positionnement remise le 25 septembre. Profil scientifique solide ; la distinction externe reste à construire.",
  'C-02': 'Huit lectures annotées à ce jour. Trois reviennent déjà dans les brouillons du Personal Statement.',
  'C-03': 'Inscrite au Concours général de mathématiques et à l\'AMC 12.',
  'C-05': 'SAT du 3 mai : 1490 (lecture 720, mathématiques 770). Une seconde passation est programmée à l\'automne.',
  'C-06': 'Vingt-trois établissements envisagés, resserrés à onze à l\'issue de la séance du 12 juin.',
  'C-10': "Le protocole de mesure est stabilisé ; la campagne de relevés court jusqu'à la mi-septembre.",
  'C-14': "TMUA visé pour Cambridge, MAT pour Oxford. Le choix se resserrera avec la liste finale — un seul des deux sera passé.",
  'C-15': 'Première version écrite en juillet. Trois relectures depuis ; il reste cent vingt mots à couper.',
  'C-17': "Deux essais complémentaires écrits sur les cinq attendus pour les candidatures anticipées. Séance de relecture le 22 août.",
  'D-03': 'Onze établissements retenus : quatre ambitieuses, quatre plausibles, trois probables. La liste se fige au 15 septembre.',
  'D-04': "Sept activités documentées sur les dix possibles. Nous complétons avec les distinctions obtenues en première.",
};

const MESSAGES_EN = {
  'B-01': 'Subject choices confirmed: mathematics, physics-chemistry, English. Consistent with the entry requirements at Imperial and Berkeley.',
  'B-03': 'Project started in January: a comparative measurement of air quality outside three local schools. A physics teacher supervises the protocol.',
  'B-04': 'First practice SAT: 1310 (reading 620, mathematics 690). The gap is in reading, where the time limit remains the main obstacle.',
  'C-01': 'Positioning report delivered on 25 September. Strong scientific profile; the external distinction is still to be built.',
  'C-02': 'Eight annotated readings so far. Three already appear in the Personal Statement drafts.',
  'C-03': 'Entered for the Concours général in mathematics and for the AMC 12.',
  'C-05': 'SAT of 3 May: 1490 (reading 720, mathematics 770). A second sitting is scheduled for the autumn.',
  'C-06': 'Twenty-three institutions considered, narrowed to eleven after the session of 12 June.',
  'C-10': 'The measurement protocol is settled; data collection runs until mid-September.',
  'C-14': 'TMUA for Cambridge, MAT for Oxford. The choice will narrow with the final list — only one of the two will be sat.',
  'C-15': 'First version written in July. Three revisions since; one hundred and twenty words still to cut.',
  'C-17': 'Two supplemental essays written of the five needed for the early applications. Review session on 22 August.',
  'D-03': 'Eleven institutions retained: four reaches, four targets, three likelies. The list is fixed on 15 September.',
  'D-04': 'Seven activities documented of the ten allowed. We are completing them with the distinctions won in Year 12.',
};

/**
 * Étapes laissées en cours plutôt que terminées : celles dont la période court
 * encore. C'est ce qui distingue un dossier tenu d'une case cochée.
 */
const EN_COURS = ['C-10', 'C-14', 'C-15', 'C-16', 'C-17', 'D-03', 'D-04'];

const NOTES_FR = [
  {
    jours: 11,
    title: 'Arbitrage de la liste finale',
    body: "Onze établissements retenus, répartis en quatre ambitieuses, quatre plausibles et trois probables. Le choix entre Oxford et Cambridge est tranché : ce sera Oxford, pour la structure de la licence de physique. Rappel : la règle interdit de candidater aux deux la même année.",
  },
  {
    jours: 32,
    title: 'Personal Statement — deuxième passe',
    body: "La version de juillet racontait le projet ; celle-ci raconte ce qu'il a changé dans sa façon de lire un protocole. Le glissement est celui que cherchent les tuteurs britanniques. Reste à couper cent vingt mots.",
  },
  {
    jours: 60,
    title: 'Bilan de la première',
    body: "Moyennes consolidées et SAT à 1490 : les prérequis sont couverts pour l'ensemble des cibles envisagées. Le point ouvert reste la lettre du chef d'établissement, à demander dès la rentrée pour ne pas dépendre d'un délai que nous ne maîtrisons pas.",
  },
];

const NOTES_EN = [
  {
    jours: 11,
    title: 'Settling the final list',
    body: 'Eleven institutions retained — four reaches, four targets, three likelies. The choice between Oxford and Cambridge is settled: Oxford, for the structure of its physics course. A reminder: the rules forbid applying to both in the same year.',
  },
  {
    jours: 32,
    title: 'Personal Statement — second pass',
    body: 'The July version told the story of the project; this one tells what it changed in how she reads a protocol. That shift is what UK tutors look for. One hundred and twenty words still to cut.',
  },
  {
    jours: 60,
    title: 'End-of-year review',
    body: 'Consolidated grades and a SAT of 1490: the entry requirements are covered across every target considered. The open point is the head teacher’s reference, to be requested in September so we do not depend on a delay we cannot control.',
  },
];

/**
 * Comptes rendus de séance. Les dates sont calculées à partir du jour courant :
 * la démonstration ne vieillit pas.
 */
function comptesRendus() {
  return (getLang() === 'en' ? NOTES_EN : NOTES_FR).map((n) => {
    const d = new Date();
    d.setDate(d.getDate() - n.jours);
    return { ...n, date: d };
  });
}

/**
 * Avancement simulé, dérivé des dates : tout ce qui est échu est fait, sauf les
 * étapes explicitement laissées en cours. Rien à maintenir d'une année sur l'autre.
 */
function etats(terminaleYear) {
  const messages = getLang() === 'en' ? MESSAGES_EN : MESSAGES_FR;
  const out = {};
  for (const m of MILESTONES) {
    if (!m.tracks.some((tr) => ELEVE.tracks.includes(tr))) continue;
    const passe = daysUntil(dueDate(m, terminaleYear)) < 0;
    const statut = EN_COURS.includes(m.id) ? 'en_cours' : (passe ? 'fait' : 'a_faire');
    if (statut === 'a_faire' && !messages[m.id]) continue;
    out[m.id] = { status: statut, public_note: messages[m.id] ?? null };
  }
  return out;
}

function render() {
  const terminaleYear = currentSchoolYear();
  const groups = scheduleByClass(ELEVE.tracks, terminaleYear, ELEVE.entry_class);
  const states = etats(terminaleYear);
  const notes = comptesRendus();
  const today = new Date();
  const nowClass = CLASSES.find((c) => c.key === ELEVE.current_class);

  const tous = groups.flatMap((g) => g.items);
  const done = tous.filter(({ milestone }) => states[milestone.id]?.status === 'fait').length;
  const pct = Math.round((done / tous.length) * 100);

  // Les étapes étalées sur plusieurs mois ont une date de début déjà passée :
  // dans un dossier réel elles remonteraient en retard, ce qui est juste. Ici
  // on ne montre que les échéances à venir — la démonstration doit donner à
  // voir le fonctionnement, pas un dossier mal tenu.
  const focus = tous
    .filter(({ milestone, due }) => {
      const st = states[milestone.id]?.status ?? 'a_faire';
      if (st === 'fait' || st === 'sans_objet' || daysUntil(due, today) < 0) return false;
      const involves = milestone.owners.some((o) => o === 'parents' || o === 'eleve');
      return involves && urgency(milestone, due, st, today) !== 'ok';
    })
    .slice(0, 4);

  app.innerHTML = `
    <div class="portal__inner">
      <div class="demo-banner">
        <span class="demo-banner__tag">${esc(t('demoTag'))}</span>
        <p>${esc(t('demoIntro'))}</p>
      </div>

      <div class="dossier-head">
        <div class="dossier-head__who">
          <span class="label">${esc(t('file'))}</span>
          <h1>${esc(ELEVE.first_name)} ${esc(ELEVE.last_name)}</h1>
          <span class="meta">${esc(classLabel(nowClass.key))} · ${esc(ELEVE.school)} · ${
            ELEVE.tracks.map((tr) => esc(t2('tracks', tr))).join(', ')}</span>
        </div>
        <div class="dossier-head__next">
          <span class="label">${esc(t('nextDeadline'))}</span>
          ${focus.length ? `
            <strong>${esc(mt(focus[0].milestone, 'title'))}</strong>
            <span>${esc(fmtDate(focus[0].due))} — ${esc(delayLabel(focus[0].due))}</span>`
            : `<strong>${esc(t('nothingDue'))}</strong>
               <span>${esc(t('nothingDueSub'))}</span>`}
        </div>
        <div class="dossier-progress">
          <b>${pct}%</b>
          <span>${done} / ${tous.length}</span>
          <div class="bar"><i style="width:${pct}%"></i></div>
        </div>
      </div>

      ${focus.length ? `
        <div class="focus-block">
          <h2>${esc(t('focusTitle'))}</h2>
          <ul class="focus-list">
            ${focus.map(({ milestone, due }) => `
              <li>
                <span class="when">${esc(fmtShort(due))}</span>
                <span class="what">
                  <button type="button" data-milestone="${esc(milestone.id)}"
                    style="background:none;border:0;padding:0;font:inherit;color:inherit;cursor:pointer;text-align:left;text-decoration:underline;text-underline-offset:3px">${
                    esc(mt(milestone, 'title'))}</button>
                  <small>${esc(mt(milestone, 'family') || mt(milestone, 'obj'))}</small>
                </span>
              </li>`).join('')}
          </ul>
        </div>` : ''}

      <h2 class="section-title">${esc(t('sessionNotes'))}</h2>
      ${notes.map((n) => `
        <article class="note-item">
          <time>${esc(fmtDate(n.date))}</time>
          <h3>${esc(n.title)}</h3>
          <p>${esc(n.body)}</p>
        </article>`).join('')}

      <h2 class="section-title">${esc(t('journey'))}</h2>
      ${trackFilter(ELEVE.tracks, 'all')}
      ${ownerFilter('all')}
      <div id="calendar">
        ${groups.map((g) => `
          <section class="year-group">
            <div class="year-head">
              <h2>${esc(classLabel(g.classKey, g.schoolYear))}</h2>
              ${g.classKey === nowClass.key ? `<span class="badge-now">${esc(t('currentYear'))}</span>` : ''}
              <span class="count">${g.items.length} ${g.items.length > 1 ? esc(t('steps')) : esc(t('step'))}</span>
            </div>
            <div class="ms-grid">
              ${g.items.map(({ milestone, due }) =>
                milestoneCard(milestone, due, states[milestone.id],
                  { studentTracks: ELEVE.tracks })).join('')}
            </div>
          </section>`).join('')}
      </div>

      <div class="demo-cta">
        <h2>${esc(t('demoCtaTitle'))}</h2>
        <p>${esc(t('demoCtaBody'))}</p>
        <a class="btn btn--primary" href="/#contact">${esc(t('demoCtaButton'))}</a>
      </div>
    </div>`;

  const calendar = document.getElementById('calendar');
  let activeTrack = 'all';
  let activeOwner = 'all';

  app.querySelector('.seg-track')?.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    activeTrack = b.dataset.track;
    app.querySelectorAll('.seg-track button').forEach((x) =>
      x.setAttribute('aria-pressed', String(x === b)));
    applyTrackFilter(calendar, activeTrack, activeOwner);
  });

  app.querySelector('.seg-owner')?.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    activeOwner = b.dataset.owner;
    app.querySelectorAll('.seg-owner button').forEach((x) =>
      x.setAttribute('aria-pressed', String(x === b)));
    applyTrackFilter(calendar, activeTrack, activeOwner);
  });

  // Fiche en lecture seule : sans canEdit ni studentId, le panneau n'affiche
  // ni mode opératoire, ni trame de questions, ni carnet, ni dépôt de pièces.
  app.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-milestone]');
    if (!btn) return;
    const m = MILESTONES.find((x) => x.id === btn.dataset.milestone);
    if (m) openPanel(m, dueDate(m, terminaleYear), states[m.id], {});
  });
}

(async function start() {
  await initLang();
  render();
})();
