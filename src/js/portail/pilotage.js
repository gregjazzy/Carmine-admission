/** Pilotage — vue interne : tous les dossiers, triés par urgence. */
import {
  getProfile, signOut, listStudents, getMilestoneStates, getAllMilestoneStates, createStudent,
  resyncSchedule, setMilestoneNote, summarize, milestoneById, addNote, listNotes,
  listAcces, ouvrirAcces, retirerAcces, listSummit,
} from './data.js';
import {
  scheduleFor, scheduleForStudent, scheduleByClass, dueDate, urgency, daysUntil, periodEnd,
  CLASSES, terminaleYearFromClass, currentSchoolYear,
} from './milestones.js';
import {
  milestoneCard, openPanel, trackFilter, applyTrackFilter,
  esc, fmtDate, delayLabel, statusLabel,
} from './ui.js';
import { initLang, t, t2, mt, classLabel } from './lang.js';

const app = document.getElementById('portal-app');
const params = new URLSearchParams(location.search);

/* ── Tableau de bord ─────────────────────────────────────────── */

/**
 * Tableau des dossiers.
 *
 * Un dossier abouti n'a plus rien à demander, mais il se consulte encore : on
 * y revient pour retrouver ce qui a été fait et où l'élève est entré. D'où les
 * trois vues plutôt qu'une liste unique où vingt dossiers clos noieraient les
 * cinq qui courent.
 */
function tableauDossiers(cards, vue) {
  const visibles = cards.filter(({ s }) =>
    vue === 'tous' || (vue === 'clos' ? s.admission : !s.admission));

  if (!visibles.length) return `<div class="empty-state">${esc(t('noFilesHere'))}</div>`;

  return `
    <table class="files-table">
      <thead><tr>
        <th>${esc(t('student'))}</th>
        <th>${esc(t('classCol'))}</th>
        <th>${esc(t('progressCol'))}</th>
        <th>${esc(t('lastDoneCol'))}</th>
        <th>${esc(t('outcomeCol'))}</th>
      </tr></thead>
      <tbody>
        ${visibles.map(({ s, stats, derniere, prochaine, retards }) => {
          const cls = CLASSES.find((c) => c.y === currentSchoolYear() - s.terminale_year);
          return `
          <tr${retards ? ' class="u-retard"' : ''}>
            <td class="pupil">
              <a href="/pilotage?dossier=${s.id}">${esc(s.first_name)} ${esc(s.last_name)}</a>
              <span class="sub">${s.tracks.map((tr) => esc(t2('tracks', tr))).join(' / ')}</span>
            </td>
            <td>${esc(classLabel(cls?.key ?? 'apres'))}
              <span class="sub">${esc(t2('classes', 'terminale'))} ${s.terminale_year}</span></td>
            <td class="progress-cell">
              <span class="pct">${stats.pct}%</span>
              <span class="bar"><i style="width:${stats.pct}%"></i></span>
              <span class="sub">${stats.done}/${stats.total}${
                retards ? ` &middot; <b class="late">${retards} ${esc(t('overdueCount'))}</b>` : ''}</span>
            </td>
            <td>${derniere ? `${esc(mt(derniere.milestone, 'title'))}
                   <span class="sub">${esc(fmtDate(derniere.due))}</span>`
                 : `<span class="sub">${esc(t('nothingDoneYet'))}</span>`}</td>
            <td>${s.admission
                 ? `<b class="admis">${esc(s.admission)}</b>
                    <span class="sub">${esc(t('admitted'))}</span>`
                 : prochaine ? `${esc(mt(prochaine.milestone, 'title'))}
                   <span class="sub">${esc(fmtDate(prochaine.due))} &middot; ${esc(delayLabel(prochaine.due))}</span>`
                 : `<span class="sub">${esc(t('fileComplete'))}</span>`}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

async function renderDashboard() {
  const students = await listStudents();
  const today = new Date();
  // Une requête pour tous les dossiers : il en fallait une par élève, soit
  // vingt-cinq allers-retours avant le premier pixel.
  const parEleve = await getAllMilestoneStates();

  const rows = [];
  const cards = [];

  for (const s of students) {
    const states = parEleve[s.id] ?? {};
    const stats = summarize(states, s.tracks, s.terminale_year, today);
    const calendrier = scheduleForStudent(s.tracks, s.terminale_year, s.entry_class);

    // Dernière étape franchie et prochaine échéance : ce qu'on cherche en
    // ouvrant la liste, et qu'un pourcentage seul ne disait pas.
    let derniere = null;
    let prochaine = null;
    let retards = 0;
    for (const { milestone, due } of calendrier) {
      const st = states[milestone.id]?.status ?? 'a_faire';
      const fin = periodEnd(milestone, due);
      if (st === 'fait') {
        if (!derniere || fin > derniere.due) derniere = { milestone, due: fin };
      } else if (st !== 'sans_objet') {
        if (daysUntil(fin, today) < 0) retards += 1;
        if (!prochaine || fin < prochaine.due) prochaine = { milestone, due: fin };
      }
    }
    cards.push({ s, stats, derniere, prochaine, retards });

    for (const { milestone, due } of calendrier) {
      const st = states[milestone.id]?.status ?? 'a_faire';
      if (st === 'fait' || st === 'sans_objet') continue;
      const u = urgency(milestone, due, st, today);
      if (u === 'ok') continue;
      // Le tri suit la date qui compte : la fin d'une période étalée, sinon l'échéance.
      rows.push({ s, milestone, due, st, u, days: daysUntil(periodEnd(milestone, due), today) });
    }
  }

  const rank = { retard: 0, urgent: 1, bientot: 2 };
  rows.sort((a, b) => (rank[a.u] - rank[b.u]) || (a.days - b.days));
  // Les dossiers en peine d'abord : c'est l'ordre dans lequel on veut les lire.
  cards.sort((a, b) =>
    (Boolean(a.s.admission) - Boolean(b.s.admission))
    || (b.retards - a.retards) || (a.stats.pct - b.stats.pct));

  const late = rows.filter((r) => r.u === 'retard').length;
  const urgent = rows.filter((r) => r.u === 'urgent').length;

  app.innerHTML = `
    <div class="portal__inner">
      <div class="admin-bar">
        <h1>${esc(t('steering'))}</h1>
        <div class="portal-actions">
          <button class="btn btn--primary btn--sm" id="new-student">${esc(t('newFile'))}</button>
          <button class="btn btn--secondary btn--sm" id="out">${esc(t('signOut'))}</button>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi">
          <b>${students.length}</b><span>${esc(t('kpiFiles'))}</span>
        </div>
        <div class="kpi ${late ? 'kpi--late' : 'kpi--zero'}">
          <b>${late}</b><span>${esc(t('kpiLate'))}</span>
        </div>
        <div class="kpi ${urgent ? 'kpi--soon' : 'kpi--zero'}">
          <b>${urgent}</b><span>${esc(t('kpiSoon'))}</span>
        </div>
      </div>

      <h2 class="section-title" style="margin-top:0">${esc(t('needsAction'))}</h2>
      ${rows.length ? `
        <div class="table-scroll">
          <table class="alert-table">
            <thead><tr>
              <th>${esc(t('student'))}</th><th>${esc(t('stepCol'))}</th><th>${esc(t('dueCol'))}</th><th>${esc(t('delayCol'))}</th><th>${esc(t('statusCol'))}</th>
            </tr></thead>
            <tbody>
              ${rows.slice(0, 40).map((r) => `
                <tr class="u-${r.u}">
                  <td class="pupil"><a href="/pilotage?dossier=${r.s.id}">${
                    esc(r.s.first_name)} ${esc(r.s.last_name)}</a></td>
                  <td>${r.milestone.lock ? '<span class="ms-tag ms-tag--lock">●</span> ' : ''}${
                    esc(mt(r.milestone, 'title'))}<br>
                    <span style="font-size:.78rem;color:var(--text-secondary)">${esc(r.milestone.id)} ·
                    ${r.milestone.owners.join(', ')}</span></td>
                  <td>${esc(fmtDate(r.due))}</td>
                  <td class="days">${esc(delayLabel(periodEnd(r.milestone, r.due)))}</td>
                  <td>${esc(statusLabel(r.st))}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        ${rows.length > 40 ? `<p style="font-size:.82rem;color:var(--text-secondary);margin-top:.6rem">
          ${esc(t('hiddenRows')(rows.length - 40))}</p>` : ''}`
        : `<div class="empty-state">${esc(t('allClear'))}</div>`}

      <div class="files-head">
        <h2 class="section-title">${esc(t('files'))}</h2>
        <div class="seg-track seg-files">
          <button type="button" data-vue="cours" aria-pressed="true">${
            esc(t('filesOpen'))} <span>${cards.filter((c) => !c.s.admission).length}</span></button>
          <button type="button" data-vue="clos" aria-pressed="false">${
            esc(t('filesClosed'))} <span>${cards.filter((c) => c.s.admission).length}</span></button>
          <button type="button" data-vue="tous" aria-pressed="false">${
            esc(t('filesAll'))} <span>${cards.length}</span></button>
        </div>
      </div>
      <div class="table-scroll" data-el="files"></div>
      ${!students.length ? `<div class="empty-state">${esc(t('noFiles'))}</div>` : ''}

      <h2 class="section-title">${esc(t('summitTitle'))}</h2>
      <div data-el="summit"><div class="empty-state">…</div></div>
    </div>`;

  document.getElementById('out').addEventListener('click', signOut);
  document.getElementById('new-student').addEventListener('click', renderNewStudent);

  // Summit, chargé après coup : la liste des dossiers n'attend pas le SAT.
  chargerSummit(app.querySelector('[data-el=summit]'));

  // Les dossiers en cours à l'ouverture : c'est le travail du jour.
  const zone = app.querySelector('[data-el=files]');
  zone.innerHTML = tableauDossiers(cards, 'cours');
  app.querySelector('.seg-files').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    app.querySelectorAll('.seg-files button').forEach((x) =>
      x.setAttribute('aria-pressed', String(x === b)));
    zone.innerHTML = tableauDossiers(cards, b.dataset.vue);
  });
}

/* ── Summit : les élèves qui s'entraînent au SAT ─────────────────────────
   Chaque compte est un prospect ou un client au travail : dernier score,
   meilleur score, volume et fraîcheur — de quoi savoir qui appeler. */
async function chargerSummit(zone) {
  let donnees;
  try {
    donnees = await listSummit();
  } catch (err) {
    zone.innerHTML = `<p class="journal-empty">${esc(err.message)}</p>`;
    return;
  }
  const { profils, resultats } = donnees;
  if (!profils.length) {
    zone.innerHTML = `<div class="empty-state">${esc(t('summitEmpty'))}</div>`;
    return;
  }

  const parCompte = new Map(profils.map((p) => [p.user_id, {
    p, sessions: 0, questions: 0, derniere: null, dernierTest: null, meilleur: null,
  }]));
  for (const r of resultats) {
    const a = parCompte.get(r.user_id);
    if (!a) continue;
    a.sessions += 1;
    a.questions += Array.isArray(r.answers) ? r.answers.length : 0;
    const d = new Date(r.date);
    if (!a.derniere || d > a.derniere) a.derniere = d;
    if (r.scaled?.total) {
      if (!a.dernierTest || d > a.dernierTest.date) a.dernierTest = { date: d, total: r.scaled.total };
      if (!a.meilleur || r.scaled.total > a.meilleur) a.meilleur = r.scaled.total;
    }
  }

  const lignes = [...parCompte.values()]
    .sort((a, b) => (b.derniere?.getTime() ?? 0) - (a.derniere?.getTime() ?? 0));

  zone.innerHTML = `
    <div class="table-scroll">
      <table class="alert-table">
        <thead><tr>
          <th>${esc(t('student'))}</th><th>Email</th><th>${esc(t('summitGoal'))}</th>
          <th>${esc(t('summitLast'))}</th><th>${esc(t('summitBest'))}</th>
          <th>${esc(t('summitSessions'))}</th><th>${esc(t('summitQuestions'))}</th>
          <th>${esc(t('summitSeen'))}</th>
        </tr></thead>
        <tbody>
          ${lignes.map(({ p, sessions, questions, derniere, dernierTest, meilleur }) => `
            <tr>
              <td class="pupil">${esc(p.name)}</td>
              <td>${esc(p.email ?? '—')}</td>
              <td>${p.target_score ?? '—'}</td>
              <td>${dernierTest ? `<b>${dernierTest.total}</b>` : '—'}</td>
              <td>${meilleur ?? '—'}</td>
              <td>${sessions}</td>
              <td>${questions}</td>
              <td>${derniere ? esc(fmtDate(derniere)) : '—'}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ── Création d'un dossier ───────────────────────────────────── */

function renderNewStudent() {
  const sy = currentSchoolYear();
  app.innerHTML = `
    <div class="portal__inner portal__inner--narrow">
      <div class="login-card">
        <div class="login-card__eyebrow">${esc(t('newFile'))}</div>
        <h1>${esc(t('createTitle'))}</h1>
        <p>${esc(t('createIntro'))}</p>
        <form id="new-form">
          <div class="portal-field">
            <label for="first_name">${esc(t('firstName'))}</label>
            <input id="first_name" required>
          </div>
          <div class="portal-field">
            <label for="last_name">${esc(t('lastName'))}</label>
            <input id="last_name" required>
          </div>
          <div class="portal-field">
            <label for="current_class">${esc(t('currentClass'))} (${sy}-${sy + 1})</label>
            <select id="current_class" required>
              ${/* Les trois systèmes sont affichés ensemble : un élève scolarisé
                    à Londres est en Year 12, pas en « première ». */''}
              ${CLASSES.filter((c) => c.key !== 'apres').map((c) =>
                `<option value="${c.key}"${c.key === 'seconde' ? ' selected' : ''}>${
                  esc(c.label)} · ${esc(c.year)} · ${esc(c.grade)}</option>`).join('')}
            </select>
          </div>
          <div class="portal-field">
            <label>${esc(t('tracksLabel'))}</label>
            <label style="font-weight:400;display:block"><input type="checkbox" value="uk" checked> ${esc(t2('tracks', 'uk'))}</label>
            <label style="font-weight:400;display:block"><input type="checkbox" value="us" checked> ${esc(t2('tracks', 'us'))}</label>
            <label style="font-weight:400;display:block"><input type="checkbox" value="eu"> ${esc(t2('tracks', 'eu'))}</label>
          </div>
          <div class="portal-field">
            <label for="school">${esc(t('school'))}</label>
            <input id="school">
          </div>
          <div class="portal-field">
            <label for="city">${esc(t('city'))}</label>
            <input id="city">
          </div>
          <button type="submit" class="btn btn--primary" style="width:100%">${esc(t('createSubmit'))}</button>
        </form>
        <div class="portal-msg" id="new-msg"></div>
        <p style="margin-top:1rem;text-align:center">
          <button class="btn btn--secondary btn--sm" id="cancel">${esc(t('cancel'))}</button>
        </p>
      </div>
    </div>`;

  document.getElementById('cancel').addEventListener('click', renderDashboard);

  const form = document.getElementById('new-form');
  const msg = document.getElementById('new-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tracks = [...form.querySelectorAll('input[type=checkbox]:checked')].map((i) => i.value);
    if (!tracks.length) {
      msg.className = 'portal-msg portal-msg--err is-visible';
      msg.textContent = t('pickTrack');
      return;
    }
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = t('creating');

    try {
      const cls = form.current_class.value;
      const student = await createStudent({
        first_name: form.first_name.value.trim(),
        last_name: form.last_name.value.trim(),
        entry_class: cls,
        current_class: cls,
        terminale_year: terminaleYearFromClass(cls, sy),
        tracks,
        school: form.school.value.trim() || null,
        city: form.city.value.trim() || null,
      });
      location.href = `/pilotage?dossier=${student.id}`;
    } catch (err) {
      btn.disabled = false;
      btn.textContent = t('createSubmit');
      msg.className = 'portal-msg portal-msg--err is-visible';
      msg.textContent = `${t('failed')} : ${err.message}`;
    }
  });
}

/* ── Fiche d'un dossier ──────────────────────────────────────── */

/* ── Ouverture des accès ─────────────────────────────────────── */

/**
 * Rend et câble le bloc d'accès d'un dossier.
 *
 * L'accès ne s'obtient pas en le demandant : il s'ouvre ici, une adresse à la
 * fois, une fois l'accompagnement engagé. Une adresse qui ne s'est jamais
 * connectée reste « en attente » jusqu'à sa première connexion — c'est normal
 * et il faut que ça se lise, sinon on croit que la saisie a échoué.
 */
async function wireAcces(root, studentId) {
  const zone = root.querySelector('[data-el=acces]');
  if (!zone) return;

  const render = async () => {
    let lignes = [];
    try {
      lignes = await listAcces(studentId);
    } catch (err) {
      zone.innerHTML = `<p class="journal-empty">${esc(err.message)}</p>`;
      return;
    }

    zone.innerHTML = `
      <div class="journal-head">
        <h4>${esc(t('accessTitle'))}</h4>
        <span class="journal-count">${esc(t('accessCount')(lignes.length))}</span>
      </div>
      <p class="journal-intro">${esc(t('accessIntro'))}</p>
      ${lignes.length ? `
        <ul class="acces-list">
          ${lignes.map((l) => `
            <li>
              <span class="acces-who">
                <strong>${esc(l.email)}</strong>
                <small>${esc(t2('accessRoles', l.role))}</small>
              </span>
              <span class="acces-state ${l.active_le ? 'is-on' : ''}">${
                esc(l.active_le ? t('accessActive') : t('accessPending'))}</span>
              <button type="button" class="acces-del" data-retirer="${esc(l.id)}">${esc(t('accessRemove'))}</button>
            </li>`).join('')}
        </ul>` : `<p class="journal-empty">${esc(t('accessEmpty'))}</p>`}
      <form class="acces-form">
        <input type="email" name="email" required placeholder="${esc(t('accessPlaceholder'))}">
        <select name="role">
          <option value="parent">${esc(t2('accessRoles', 'parent'))}</option>
          <option value="eleve">${esc(t2('accessRoles', 'eleve'))}</option>
        </select>
        <button type="submit" class="btn btn--primary btn--sm">${esc(t('accessOpen'))}</button>
      </form>
      <p class="acces-msg" data-el="acces-msg"></p>`;

    const msg = zone.querySelector('[data-el=acces-msg]');

    zone.querySelector('.acces-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const btn = form.querySelector('button');
      btn.disabled = true;
      msg.textContent = '';
      try {
        await ouvrirAcces(studentId, form.email.value, form.role.value);
        await render();
      } catch (err) {
        btn.disabled = false;
        msg.textContent = `${t('failed')} : ${err.message}`;
      }
    });

    zone.querySelectorAll('[data-retirer]').forEach((b) => {
      b.addEventListener('click', async () => {
        if (!confirm(t('accessConfirmRemove'))) return;
        b.disabled = true;
        try {
          await retirerAcces(b.dataset.retirer);
          await render();
        } catch (err) {
          b.disabled = false;
          msg.textContent = `${t('failed')} : ${err.message}`;
        }
      });
    });
  };

  await render();
}

async function renderStudent(id) {
  const students = await listStudents();
  const student = students.find((s) => s.id === id);
  if (!student) return renderDashboard();

  const render = async () => {
    const states = await getMilestoneStates(student.id);
    const stats = summarize(states, student.tracks, student.terminale_year);
    const groups = scheduleByClass(student.tracks, student.terminale_year, student.entry_class);
    const notes = await listNotes(student.id);
    const cls = CLASSES.find((c) => c.y === currentSchoolYear() - student.terminale_year);

    app.innerHTML = `
      <div class="portal__inner">
        <p style="margin-bottom:1rem"><a href="/pilotage" style="color:var(--gold-primary);font-size:.88rem">← ${esc(t('allFiles'))}</a></p>

        <div class="dossier-head">
          <div class="dossier-head__who">
            <span class="label">${esc(t('file'))}</span>
            <h1>${esc(student.first_name)} ${esc(student.last_name)}</h1>
            <span class="meta">${esc(classLabel(cls?.key ?? 'apres'))} · ${esc(t2('classes','terminale'))} ${student.terminale_year}-${
              student.terminale_year + 1} · ${student.tracks.map((tr) => esc(t2('tracks', tr))).join(', ')}</span>
            ${student.admission ? `<span class="dossier-head__admis">${
              esc(t('admissionLabel'))} : <b>${esc(student.admission)}</b></span>` : ''}
          </div>
          <div class="dossier-progress">
            <b>${stats.pct}%</b>
            <span>${esc(t('progressCount')(stats.done, stats.total, stats.late))}</span>
            <div class="bar"><i style="width:${stats.pct}%"></i></div>
          </div>
        </div>

        <div class="portal-actions" style="margin-bottom:1.5rem">
          <button class="btn btn--secondary btn--sm" id="resync">${esc(t('resync'))}</button>
          <button class="btn btn--secondary btn--sm" id="add-note">${esc(t('addNote'))}</button>
        </div>
        <div class="portal-msg" id="admin-msg"></div>

        <div class="blk blk-acces" data-el="acces">
          <p class="journal-loading">${esc(t('loading'))}</p>
        </div>

        ${notes.length ? `
          <h2 class="section-title">${esc(t('sessionNotes'))}</h2>
          ${notes.slice(0, 5).map((n) => `
            <article class="note-item">
              <time>${esc(fmtDate(new Date(n.session_date)))}${
                n.visible_to_parents ? ` · ${t('noteVisible')}` : ` · ${t('notePrivate')}`}</time>
              <h3>${esc(n.title)}</h3>
              <p>${esc(n.body)}</p>
            </article>`).join('')}` : ''}

        ${groups.map((g) => `
          <section class="year-group">
            <div class="year-head">
              <h2>${esc(classLabel(g.classKey, g.schoolYear))}</h2>
              ${g.classKey === cls?.key ? `<span class="badge-now">${esc(t('currentYear'))}</span>` : ''}
              <span class="count">${g.items.length} ${esc(t(g.items.length > 1 ? 'steps' : 'step'))}</span>
            </div>
            <div class="ms-grid">
              ${g.items.map(({ milestone, due }) =>
                milestoneCard(milestone, due, states[milestone.id])).join('')}
            </div>
          </section>`).join('')}
      </div>`;

    const msg = document.getElementById('admin-msg');

    // Le bloc d'accès se remplit après coup : il interroge sa propre table et
    // n'a pas à retarder l'affichage du dossier.
    wireAcces(app, student.id);

    document.getElementById('resync').addEventListener('click', async (e) => {
      e.currentTarget.disabled = true;
      try {
        const r = await resyncSchedule(student);
        msg.className = 'portal-msg portal-msg--ok is-visible';
        msg.textContent = t('resynced')(r.added, r.redated, r.removed);
        await render();
      } catch (err) {
        msg.className = 'portal-msg portal-msg--err is-visible';
        msg.textContent = `${t('failed')} : ${err.message}`;
      }
    });

    document.getElementById('add-note').addEventListener('click', async () => {
      const title = prompt(t('notePromptTitle'));
      if (!title) return;
      const body = prompt(t('notePromptBody'));
      if (!body) return;
      const visible = confirm(t('notePromptVisible'));
      try {
        await addNote({ student_id: student.id, title, body, visible_to_parents: visible });
        await render();
      } catch (err) {
        msg.className = 'portal-msg portal-msg--err is-visible';
        msg.textContent = `${t('failed')} : ${err.message}`;
      }
    });

    app.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-milestone]');
      if (!btn) return;
      const m = milestoneById(btn.dataset.milestone);
      if (!m) return;
      openPanel(m, dueDate(m, student.terminale_year), states[m.id], {
        canEdit: true,
        canUpload: true,
        studentId: student.id,
        onSave: async (fields) => {
          await setMilestoneNote(student.id, m.id, fields);
          await render();
        },
      });
    });
  };

  await render();
}

/* ── Amorçage ────────────────────────────────────────────────── */

(async function start() {
  try {
    await initLang();
    const profile = await getProfile();
    if (!profile) {
      location.href = '/espace-client';
      return;
    }
    if (profile.role !== 'admin') {
      app.innerHTML = `
        <div class="portal__inner portal__inner--narrow">
          <div class="portal-msg portal-msg--err is-visible">
            ${esc(t('adminOnly'))} <a href="/espace-client">${esc(t('goToClient'))}</a>.
          </div>
        </div>`;
      return;
    }
    const dossier = params.get('dossier');
    if (dossier) await renderStudent(dossier);
    else await renderDashboard();
  } catch (err) {
    app.innerHTML = `
      <div class="portal__inner portal__inner--narrow">
        <div class="portal-msg portal-msg--err is-visible">${esc(err.message)}</div>
      </div>`;
  }
})();
