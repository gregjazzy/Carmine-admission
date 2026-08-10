/** Espace client — connexion, puis suivi du dossier de son enfant. */
import {
  getProfile, signIn, signUp, resetPassword, updatePassword, signOut,
  listStudents, getMilestoneStates, listNotes, summarize, milestoneById,
} from './data.js';
import {
  scheduleByClass, outOfScope, dueDate, currentSchoolYear, CLASSES, urgency, periodEnd,
} from './milestones.js';
import {
  milestoneCard, openPanel, trackFilter, ownerFilter, applyTrackFilter,
  esc, fmtDate, fmtShort, delayLabel,
} from './ui.js';
import { initLang, t, t2, mt, classLabel } from './lang.js';

const app = document.getElementById('portal-app');

/* ── Écran de connexion ──────────────────────────────────────── */

const demoInvite = () => `
  <div class="demo-invite">
    <strong>${esc(t('noFileYet'))}</strong>
    <p>${esc(t('demoInviteBody'))}</p>
    <a class="btn btn--primary btn--sm" href="/demo">${esc(t('seeExample'))}</a>
  </div>`;

/**
 * Un seul écran, trois modes : se connecter, créer son accès, mot de passe
 * oublié. Trois pages auraient multiplié les allers-retours pour un geste qui
 * n'arrive qu'une fois.
 */
function renderLogin(mode = 'signin') {
  const champs = {
    signin: { titre: 'loginTitle', intro: 'loginIntro', bouton: 'loginSubmit' },
    signup: { titre: 'signupTitle', intro: 'signupIntro', bouton: 'signupSubmit' },
    reset: { titre: 'resetTitle', intro: 'resetIntro', bouton: 'resetSubmit' },
  }[mode];

  const motDePasse = mode !== 'reset';

  app.innerHTML = `
    <div class="portal__inner portal__inner--narrow">
      <div class="login-card">
        <div class="login-card__eyebrow">${esc(t('loginEyebrow'))}</div>
        <h1>${esc(t(champs.titre))}</h1>
        <p>${esc(t(champs.intro))}</p>
        <form id="login-form">
          <div class="portal-field">
            <label for="email">${esc(t('emailLabel'))}</label>
            <input type="email" id="email" name="email" required autocomplete="email"
                   placeholder="${esc(t('emailPlaceholder'))}">
          </div>
          ${motDePasse ? `
            <div class="portal-field">
              <label for="password">${esc(t('passwordLabel'))}</label>
              <input type="password" id="password" name="password" required minlength="8"
                     autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}">
              ${mode === 'signup' ? `<small class="field-hint">${esc(t('passwordHint'))}</small>` : ''}
            </div>` : ''}
          <button type="submit" class="btn btn--primary" style="width:100%">${esc(t(champs.bouton))}</button>
        </form>
        <div class="portal-msg" id="login-msg"></div>
        <p class="login-switch">
          ${mode === 'signin' ? `
            <button type="button" data-mode="reset">${esc(t('forgotPassword'))}</button>
            <span>·</span>
            <button type="button" data-mode="signup">${esc(t('goToSignup'))}</button>`
            : `<button type="button" data-mode="signin">${esc(t('backToSignin'))}</button>`}
        </p>
      </div>
      ${demoInvite()}
    </div>`;

  const form = document.getElementById('login-form');
  const msg = document.getElementById('login-msg');

  app.querySelectorAll('.login-switch button').forEach((b) =>
    b.addEventListener('click', () => renderLogin(b.dataset.mode)));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = t('working');
    msg.className = 'portal-msg';

    const email = form.email.value;
    const mdp = motDePasse ? form.password.value : null;
    let error = null;
    let succes = '';

    if (mode === 'signin') {
      ({ error } = await signIn(email, mdp));
      // La session s'établit sans rechargement : on enchaîne sur le dossier.
      if (!error) return start();
    } else if (mode === 'signup') {
      const { data, error: err } = await signUp(email, mdp);
      error = err;
      // Une adresse déjà prise renvoie un utilisateur sans identités plutôt
      // qu'une erreur — Supabase refuse de dire qui est inscrit. On affiche le
      // même message dans les deux cas.
      if (!error) succes = data?.session ? '' : t('signupSent');
      if (!error && data?.session) return start();
    } else {
      ({ error } = await resetPassword(email));
      if (!error) succes = t('resetSent');
    }

    btn.disabled = false;
    btn.textContent = t(champs.bouton);

    if (error) {
      msg.className = 'portal-msg portal-msg--err is-visible';
      msg.textContent = `${t('loginFailed')} : ${error.message}`;
    } else {
      msg.className = 'portal-msg portal-msg--ok is-visible';
      msg.textContent = succes;
      form.reset();
    }
  });
}

/**
 * Écran de définition du mot de passe, après le lien de réinitialisation.
 * La session est déjà ouverte par le lien : il ne reste qu'à enregistrer.
 */
function renderNewPassword() {
  app.innerHTML = `
    <div class="portal__inner portal__inner--narrow">
      <div class="login-card">
        <div class="login-card__eyebrow">${esc(t('loginEyebrow'))}</div>
        <h1>${esc(t('newPasswordTitle'))}</h1>
        <p>${esc(t('newPasswordIntro'))}</p>
        <form id="pwd-form">
          <div class="portal-field">
            <label for="password">${esc(t('passwordLabel'))}</label>
            <input type="password" id="password" name="password" required minlength="8"
                   autocomplete="new-password">
            <small class="field-hint">${esc(t('passwordHint'))}</small>
          </div>
          <button type="submit" class="btn btn--primary" style="width:100%">${esc(t('newPasswordSubmit'))}</button>
        </form>
        <div class="portal-msg" id="login-msg"></div>
      </div>
    </div>`;

  const form = document.getElementById('pwd-form');
  const msg = document.getElementById('login-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = t('working');

    const { error } = await updatePassword(form.password.value);
    if (!error) {
      history.replaceState(null, '', location.pathname);
      return start();
    }
    btn.disabled = false;
    btn.textContent = t('newPasswordSubmit');
    msg.className = 'portal-msg portal-msg--err is-visible';
    msg.textContent = `${t('failed')} : ${error.message}`;
  });
}

/* ── Vue dossier ─────────────────────────────────────────────── */

/**
 * Raccourci vers le tableau de bord interne, visible du seul administrateur.
 * /pilotage n'est lié nulle part sur le site : sans ce lien, la page ne serait
 * atteignable qu'en tapant son adresse de mémoire.
 */
function pilotageLink(profile) {
  if (profile.role !== 'admin') return '';
  return `<a href="/pilotage" class="btn btn--secondary btn--sm"
             style="margin-right:.75rem">${esc(t('goToPilotage'))}</a>`;
}

async function renderDossier(profile) {
  const students = await listStudents();

  if (!students.length) {
    app.innerHTML = `
      <div class="portal__inner">
        <div class="empty-state">${t('noFile')}</div>
        <p style="text-align:center;margin-bottom:1.25rem">
          <a href="/#contact" class="btn btn--primary btn--sm"
             style="margin-right:.75rem">${esc(t('demoCtaButton'))}</a>
          <a href="/demo" class="btn btn--secondary btn--sm">${esc(t('seeExample'))}</a>
        </p>
        <p style="text-align:center">
          ${pilotageLink(profile)}
          <button class="btn btn--secondary btn--sm" id="out">${esc(t('signOut'))}</button></p>
      </div>`;
    document.getElementById('out').addEventListener('click', signOut);
    return;
  }

  const isAdmin = profile.role === 'admin';
  let current = students[0];
  let activeTrack = 'all';
  let activeOwner = 'all';

  const render = async () => {
    const states = await getMilestoneStates(current.id);
    const stats = summarize(states, current.tracks, current.terminale_year);
    const groups = scheduleByClass(current.tracks, current.terminale_year, current.entry_class);
    const past = outOfScope(current.tracks, current.terminale_year, current.entry_class);
    const notes = (await listNotes(current.id)).filter((n) => n.visible_to_parents || isAdmin);
    const today = new Date();
    const nowClass = CLASSES.find((c) => c.y === currentSchoolYear() - current.terminale_year);
    const cardOpts = { studentTracks: current.tracks };

    // Les prochaines actions attendues de la famille ou de l'élève.
    const focus = groups
      .flatMap((g) => g.items)
      .filter(({ milestone, due }) => {
        const st = states[milestone.id]?.status ?? 'a_faire';
        if (st === 'fait' || st === 'sans_objet') return false;
        const involves = milestone.owners.some((o) => o === 'parents' || o === 'eleve');
        return involves && urgency(milestone, due, st, today) !== 'ok';
      })
      .slice(0, 4);

    app.innerHTML = `
      <div class="portal__inner">
        ${students.length > 1 ? `
          <div class="portal-field" style="max-width:320px">
            <label for="pick">${esc(t('fileFollowed'))}</label>
            <select id="pick">${students.map((s) =>
              `<option value="${s.id}"${s.id === current.id ? ' selected' : ''}>${
                esc(s.first_name)} ${esc(s.last_name)}</option>`).join('')}</select>
          </div>` : ''}

        <div class="dossier-head">
          <div class="dossier-head__who">
            <span class="label">${esc(t('file'))}</span>
            <h1>${esc(current.first_name)} ${esc(current.last_name)}</h1>
            <span class="meta">${esc(classLabel(nowClass?.key ?? 'terminale'))}${
              current.school ? ' · ' + esc(current.school) : ''} · ${
              current.tracks.map((tr) => esc(t2('tracks', tr))).join(', ')}</span>
          </div>
          <div class="dossier-head__next">
            <span class="label">${esc(t('nextDeadline'))}</span>
            ${focus.length ? `
              <strong>${esc(mt(focus[0].milestone, 'title'))}</strong>
              <span>${esc(fmtDate(focus[0].due))} — ${esc(delayLabel(periodEnd(focus[0].milestone, focus[0].due)))}</span>`
              : `<strong>${esc(t('nothingDue'))}</strong>
                 <span>${esc(t('nothingDueSub'))}</span>`}
          </div>
          <div class="dossier-progress">
            <b>${stats.pct}%</b>
            <span>${stats.done} / ${stats.total}</span>
            <div class="bar"><i style="width:${stats.pct}%"></i></div>
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

        ${notes.length ? `
          <h2 class="section-title">${esc(t('sessionNotes'))}</h2>
          ${notes.slice(0, 4).map((n) => `
            <article class="note-item">
              <time>${esc(fmtDate(new Date(n.session_date)))}</time>
              <h3>${esc(n.title)}</h3>
              <p>${esc(n.body)}</p>
            </article>`).join('')}` : ''}

        <h2 class="section-title">${esc(t('journey'))}</h2>
        <div class="filters">
          ${trackFilter(current.tracks, activeTrack)}
          ${ownerFilter(activeOwner)}
        </div>
        <div id="calendar">
          ${groups.map((g) => `
            <section class="year-group">
              <div class="year-head">
                <h2>${esc(classLabel(g.classKey, g.schoolYear))}</h2>
                ${g.classKey === nowClass?.key ? `<span class="badge-now">${esc(t('currentYear'))}</span>` : ''}
                <span class="count">${g.items.length} ${g.items.length > 1 ? esc(t('steps')) : esc(t('step'))}</span>
              </div>
              <div class="ms-grid">
                ${g.items.map(({ milestone, due }) =>
                  milestoneCard(milestone, due, states[milestone.id], cardOpts)).join('')}
              </div>
            </section>`).join('')}
        </div>

        ${past.length ? `
          <details style="margin-top:2rem">
            <summary style="cursor:pointer;color:var(--text-secondary);font-size:.9rem">
              ${past.length} ${esc(t('pastTitle'))}
            </summary>
            <p style="color:var(--text-secondary);font-size:.87rem;margin:.75rem 0 1rem">
              ${esc(t('pastIntro'))}
            </p>
            <div class="ms-grid">
              ${past.map(({ milestone, due }) =>
                milestoneCard(milestone, due, states[milestone.id],
                  { ...cardOpts, past: true })).join('')}
            </div>
          </details>` : ''}

        <p style="margin-top:2.5rem;text-align:center">
          ${pilotageLink(profile)}
          <button class="btn btn--secondary btn--sm" id="out">${esc(t('signOut'))}</button>
        </p>
      </div>`;

    document.getElementById('out').addEventListener('click', signOut);

    const calendar = document.getElementById('calendar');
    if (activeTrack !== 'all' || activeOwner !== 'all') {
      applyTrackFilter(calendar, activeTrack, activeOwner);
    }

    const seg = app.querySelector('.seg-track');
    if (seg) {
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        activeTrack = b.dataset.track;
        seg.querySelectorAll('button').forEach((x) =>
          x.setAttribute('aria-pressed', String(x === b)));
        applyTrackFilter(calendar, activeTrack, activeOwner);
      });
    }

    const segOwner = app.querySelector('.seg-owner');
    if (segOwner) {
      segOwner.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        activeOwner = b.dataset.owner;
        segOwner.querySelectorAll('button').forEach((x) =>
          x.setAttribute('aria-pressed', String(x === b)));
        applyTrackFilter(calendar, activeTrack, activeOwner);
      });
    }

    const pick = document.getElementById('pick');
    if (pick) {
      pick.addEventListener('change', async () => {
        current = students.find((s) => s.id === pick.value);
        activeTrack = 'all';
        await render();
      });
    }
  };

  // Un seul écouteur, posé une fois : le contenu est reconstruit à chaque rendu.
  app.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-milestone]');
    if (!btn) return;
    const m = milestoneById(btn.dataset.milestone);
    if (!m) return;
    getMilestoneStates(current.id).then((states) => {
      openPanel(m, dueDate(m, current.terminale_year), states[m.id], {
        canUpload: Boolean(m.upload?.length),
        studentId: current.id,
      });
    });
  });

  await render();
}

/* ── Amorçage ────────────────────────────────────────────────── */

/**
 * Le lien de réinitialisation ramène ici avec `type=recovery` dans le
 * fragment. La session y est déjà ouverte : sans ce test, la personne
 * arriverait sur son dossier sans jamais avoir choisi de mot de passe, et le
 * lien reçu n'aurait servi à rien.
 */
const recuperation = () => new URLSearchParams(location.hash.slice(1)).get('type') === 'recovery';

async function start() {
  try {
    await initLang();
    if (recuperation()) return renderNewPassword();
    const profile = await getProfile();
    if (!profile) renderLogin();
    else await renderDossier(profile);
  } catch (err) {
    app.innerHTML = `
      <div class="portal__inner portal__inner--narrow">
        <div class="portal-msg portal-msg--err is-visible">${esc(err.message)}</div>
      </div>`;
  }
}

start();
