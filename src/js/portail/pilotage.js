/** Pilotage — vue interne : tous les dossiers, triés par urgence. */
import {
  getProfile, signOut, listStudents, getMilestoneStates, createStudent,
  resyncSchedule, setMilestoneNote, summarize, milestoneById, addNote, listNotes,
} from './data.js';
import {
  scheduleFor, scheduleByClass, dueDate, urgency, daysUntil,
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

async function renderDashboard() {
  const students = await listStudents();
  const today = new Date();

  const rows = [];
  const cards = [];

  for (const s of students) {
    const states = await getMilestoneStates(s.id);
    const stats = summarize(states, s.tracks, s.terminale_year, today);
    cards.push({ s, stats });

    for (const { milestone, due } of scheduleFor(s.tracks, s.terminale_year)) {
      const st = states[milestone.id]?.status ?? 'a_faire';
      if (st === 'fait' || st === 'sans_objet') continue;
      const u = urgency(milestone, due, st, today);
      if (u === 'ok') continue;
      rows.push({ s, milestone, due, st, u, days: daysUntil(due, today) });
    }
  }

  const rank = { retard: 0, urgent: 1, bientot: 2 };
  rows.sort((a, b) => (rank[a.u] - rank[b.u]) || (a.days - b.days));

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

      <p style="color:var(--text-secondary);font-size:.92rem;margin-bottom:1.5rem">
        ${esc(t('summary')(students.length, late, urgent))}
      </p>

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
                  <td class="days">${esc(delayLabel(r.due))}</td>
                  <td>${esc(statusLabel(r.st))}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        ${rows.length > 40 ? `<p style="font-size:.82rem;color:var(--text-secondary);margin-top:.6rem">
          ${esc(t('hiddenRows')(rows.length - 40))}</p>` : ''}`
        : `<div class="empty-state">${esc(t('allClear'))}</div>`}

      <h2 class="section-title">${esc(t('files'))}</h2>
      <div class="student-grid">
        ${cards.map(({ s, stats }) => {
          const cls = CLASSES.find((c) => c.y === currentSchoolYear() - s.terminale_year);
          return `
          <a class="student-card" href="/pilotage?dossier=${s.id}">
            <h3>${esc(s.first_name)} ${esc(s.last_name)}</h3>
            <div class="meta">${esc(classLabel(cls?.key ?? 'terminale'))} · ${
              s.tracks.map((tr) => esc(t2('tracks', tr))).join(', ')}</div>
            <div class="bar"><i style="width:${stats.pct}%"></i></div>
            <div class="stats">
              <span>${stats.pct}% · ${stats.done}/${stats.total}</span>
              ${stats.late ? `<span class="late">${stats.late} ${esc(t('overdueCount'))}</span>` : ''}
            </div>
          </a>`;
        }).join('')}
      </div>
      ${!students.length ? `<div class="empty-state">${esc(t('noFiles'))}</div>` : ''}
    </div>`;

  document.getElementById('out').addEventListener('click', signOut);
  document.getElementById('new-student').addEventListener('click', renderNewStudent);
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
            <span class="meta">${esc(classLabel(cls?.key ?? 'terminale'))} · ${esc(t2('classes','terminale'))} ${student.terminale_year}-${
              student.terminale_year + 1} · ${student.tracks.map((tr) => esc(t2('tracks', tr))).join(', ')}</span>
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
