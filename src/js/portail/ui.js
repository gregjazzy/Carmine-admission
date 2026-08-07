/** Éléments d'interface partagés entre l'espace client et le pilotage. */
import { urgency, daysUntil } from './milestones.js';
import { listDocuments, uploadDocument, documentUrl } from './data.js';
import { t, t2, mt, pt, dateFormatter, getLang } from './lang.js';

export const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const fmtDate = (d) =>
  dateFormatter({ day: 'numeric', month: 'short', year: 'numeric' }).format(d);
export const fmtShort = (d) => dateFormatter({ day: 'numeric', month: 'short' }).format(d);

export const statusLabel = (k) => t2('status', k);

/** Formule le délai en clair : « dans 12 jours », « aujourd'hui », « en retard de 3 jours ». */
export function delayLabel(due, today = new Date()) {
  const d = daysUntil(due, today);
  if (d === 0) return t('today');
  if (d === 1) return t('tomorrow');
  if (d === -1) return t('overdueOne');
  if (d < 0) return t('overdue')(-d);
  if (d < 31) return t('inDays')(d);
  const months = Math.round(d / 30);
  return months <= 1 ? t('inOneMonth') : t('inMonths')(months);
}

export function fmtSize(bytes) {
  if (!bytes) return '';
  const en = getLang() === 'en';
  if (bytes < 1024) return `${bytes} ${en ? 'B' : 'o'}`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} ${en ? 'kB' : 'ko'}`;
  return `${(bytes / 1024 / 1024).toFixed(1)} ${en ? 'MB' : 'Mo'}`;
}

/* ── Carte de jalon ──────────────────────────────────────────── */

/**
 * @param {object} opts.studentTracks  filières du dossier — les pastilles de filière
 *   ne s'affichent que si le dossier en combine plusieurs, sinon elles sont du bruit.
 */
export function milestoneCard(milestone, due, state, { past = false, studentTracks = [] } = {}) {
  const status = state?.status ?? 'a_faire';
  const u = urgency(milestone, due, status);
  const classes = [
    'ms-card',
    milestone.lock ? 'is-lock' : '',
    `u-${u}`,
    status === 'fait' ? 'is-done' : '',
    past ? 'is-past' : '',
  ].filter(Boolean).join(' ');

  const shared = studentTracks.filter((t) => milestone.tracks.includes(t));
  const trackTags = studentTracks.length > 1
    ? `<span class="ms-card__tracks">${shared
        .map((tr) => `<span class="track-pill track-pill--${tr}">${esc(t2('tracks', tr))}</span>`)
        .join('')}</span>`
    : '';

  return `
    <button type="button" class="${classes}" data-milestone="${esc(milestone.id)}"
            data-tracks="${esc(shared.join(' '))}">
      <span class="ms-card__top">
        <span class="ms-card__id">${esc(milestone.id)}</span>
        <span class="ms-tag${milestone.lock ? ' ms-tag--lock' : ''}">${
          milestone.lock ? '● ' : ''}${esc(t2('kinds', milestone.kind))}</span>
      </span>
      <h3>${esc(mt(milestone, 'title'))}</h3>
      <span class="ms-card__date">${esc(fmtDate(due))} · ${esc(delayLabel(due))}</span>
      ${trackTags}
      <span class="ms-status st-${status}"><span class="dot"></span>${esc(statusLabel(status))}</span>
    </button>`;
}

/** Barre de filtre par filière, affichée seulement pour un dossier multi-parcours. */
export function trackFilter(tracks, active = 'all') {
  if (tracks.length < 2) return '';
  const btn = (val, label) =>
    `<button type="button" data-track="${esc(val)}" aria-pressed="${val === active}">${esc(label)}</button>`;
  return `
    <div class="track-filter">
      <span class="track-filter__label">${esc(t('consolidated'))}</span>
      <div class="seg-track">
        ${btn('all', t('allTracks'))}
        ${tracks.map((tr) => btn(tr, t2('tracks', tr))).join('')}
      </div>
    </div>`;
}

/** Applique le filtre de filière sans reconstruire la page. */
export function applyTrackFilter(root, track) {
  root.querySelectorAll('.ms-card').forEach((card) => {
    const list = (card.dataset.tracks || '').split(' ').filter(Boolean);
    card.hidden = track !== 'all' && !list.includes(track);
  });
  root.querySelectorAll('.year-group').forEach((group) => {
    const visible = [...group.querySelectorAll('.ms-card')].filter((c) => !c.hidden).length;
    group.hidden = visible === 0;
    const count = group.querySelector('.count');
    if (count) count.textContent = `${visible} ${visible > 1 ? t('steps') : t('step')}`;
  });
}

/* ── Panneau de détail ───────────────────────────────────────── */

let panelEl = null;
let scrimEl = null;
let lastFocused = null;

function ensurePanel() {
  if (panelEl) return;
  scrimEl = document.createElement('div');
  scrimEl.className = 'ms-scrim';
  panelEl = document.createElement('aside');
  panelEl.className = 'ms-panel';
  panelEl.setAttribute('role', 'dialog');
  panelEl.setAttribute('aria-modal', 'true');
  panelEl.tabIndex = -1;
  panelEl.innerHTML = `
    <div class="ms-panel__head">
      <div class="row">
        <div style="min-width:0">
          <div class="ms-panel__eyebrow" data-el="eyebrow"></div>
          <h2 data-el="title"></h2>
        </div>
        <button class="ms-close" data-el="close" aria-label="${esc(t('close'))}">&times;</button>
      </div>
      <div class="ms-panel__meta" data-el="meta"></div>
    </div>
    <div class="ms-panel__body" data-el="body"></div>`;
  document.body.append(scrimEl, panelEl);

  scrimEl.addEventListener('click', closePanel);
  panelEl.querySelector('[data-el=close]').addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panelEl.classList.contains('is-open')) closePanel();
  });
}

export function closePanel() {
  if (!panelEl) return;
  panelEl.classList.remove('is-open');
  scrimEl.classList.remove('is-open');
  if (lastFocused?.focus) lastFocused.focus();
}

/**
 * Ouvre la fiche d'un jalon.
 * @param {object} opts.canEdit  affiche les contrôles de statut (pilotage uniquement)
 * @param {object} opts.canUpload  affiche la zone de dépôt de documents
 */
export function openPanel(milestone, due, state, opts = {}) {
  ensurePanel();
  lastFocused = document.activeElement;

  const q = (sel) => panelEl.querySelector(`[data-el=${sel}]`);
  q('eyebrow').textContent = `${pt(milestone.phase, 'title')} · ${milestone.id}`;
  q('title').textContent = mt(milestone, 'title');
  q('meta').innerHTML =
    `<span class="ms-tag${milestone.lock ? ' ms-tag--lock' : ''}">${
      milestone.lock ? '● ' : ''}${esc(t2('kinds', milestone.kind))}</span>` +
    milestone.tracks.map((tr) => `<span class="ms-tag">${esc(t2('tracks', tr))}</span>`).join('') +
    `<span class="ms-tag">${esc(fmtDate(due))}</span>`;

  const status = state?.status ?? 'a_faire';
  let html = '';

  html += `<div class="blk"><h4>${esc(t('purpose'))}</h4><p class="quote">${
    esc(mt(milestone, 'obj'))}</p></div>`;

  const warn = mt(milestone, 'warn');
  if (warn) {
    html += `<div class="blk-warn"><strong>${esc(t('watchOut'))}</strong> ${esc(warn)}</div>`;
  }

  html += `<div class="blk-duo">
    <div><h4>${esc(t('weProduce'))}</h4><p>${esc(mt(milestone, 'carmine'))}</p></div>
    <div><h4>${esc(t('weExpect'))}</h4><p>${
      esc(mt(milestone, 'family') || t('nothingDue'))}</p></div>
  </div>`;

  html += `<div class="blk"><h4>${esc(t('people'))}</h4><p>${
    milestone.owners.map((o) => esc(t2('owners', o))).join(' · ')}</p></div>`;

  if (milestone.lock) {
    html += `<div class="blk"><h4>${esc(t('deadlineNature'))}</h4><p>${
      esc(t('deadlineNatureBody'))}</p></div>`;
  }

  if (opts.canEdit) {
    html += `<div class="blk"><h4>${esc(t('progress'))}</h4>
      <div class="portal-field">
        <select data-el="status-select">
          ${['a_faire', 'en_cours', 'fait', 'sans_objet'].map((k) =>
            `<option value="${k}"${k === status ? ' selected' : ''}>${esc(statusLabel(k))}</option>`).join('')}
        </select>
      </div>
      <div class="portal-field">
        <label>${esc(t('parentMessage'))}</label>
        <textarea data-el="public-note" rows="2">${esc(state?.public_note || '')}</textarea>
      </div>
      <div class="portal-field">
        <label>${esc(t('privateNote'))}</label>
        <textarea data-el="private-note" rows="2">${esc(state?.private_note || '')}</textarea>
      </div>
      <button class="btn btn--primary btn--sm" data-el="save">${esc(t('save'))}</button>
      <span data-el="saved" style="margin-left:.6rem;font-size:.82rem;color:var(--text-secondary)"></span>
    </div>`;
  } else if (state?.public_note) {
    html += `<div class="blk"><h4>${esc(t('whereWeAre'))}</h4><p>${esc(state.public_note)}</p></div>`;
  }

  if (milestone.upload?.length) {
    html += `<div class="blk"><h4>${esc(t('expectedDocs'))}</h4><ul style="margin:0;padding-left:1.05rem;color:var(--text-secondary);font-size:.9rem">${
      milestone.upload.map((u) => `<li>${esc(u)}</li>`).join('')}</ul></div>`;
  }

  if (opts.canUpload) {
    html += `<div class="blk"><h4>${esc(t('documents'))}</h4>
      <label class="dropzone" data-el="drop">
        <strong>${esc(t('dropFile'))}</strong>
        <span>${esc(t('dropHint'))}</span>
        <input type="file" data-el="file">
      </label>
      <ul class="doc-list" data-el="docs"></ul>
    </div>`;
  }

  if (milestone.docs?.length) {
    html += `<div class="blk"><h4>${esc(t('templates'))}</h4><ul class="doc-list">${
      milestone.docs.map((d) =>
        `<li><span class="ms-tag">${esc(d.code)}</span><a>${esc(d.label)}</a><span class="size">${esc(d.note)}</span></li>`
      ).join('')}</ul></div>`;
  }

  q('body').innerHTML = html;
  q('body').scrollTop = 0;

  if (opts.canEdit && opts.onSave) {
    panelEl.querySelector('[data-el=save]').addEventListener('click', async (ev) => {
      const btn = ev.currentTarget;
      btn.disabled = true;
      try {
        await opts.onSave({
          status: panelEl.querySelector('[data-el=status-select]').value,
          public_note: panelEl.querySelector('[data-el=public-note]').value || null,
          private_note: panelEl.querySelector('[data-el=private-note]').value || null,
        });
        panelEl.querySelector('[data-el=saved]').textContent = 'Enregistré';
      } catch (err) {
        panelEl.querySelector('[data-el=saved]').textContent = `Échec : ${err.message}`;
      } finally {
        btn.disabled = false;
      }
    });
  }

  if (opts.canUpload && opts.studentId) {
    wireUpload(panelEl, opts.studentId, milestone.id);
  }

  panelEl.classList.add('is-open');
  scrimEl.classList.add('is-open');
  panelEl.focus();
}

async function wireUpload(root, studentId, milestoneId) {
  const drop = root.querySelector('[data-el=drop]');
  const input = root.querySelector('[data-el=file]');
  const list = root.querySelector('[data-el=docs]');

  async function refresh() {
    try {
      const docs = await listDocuments(studentId, milestoneId);
      list.innerHTML = docs.length
        ? (await Promise.all(docs.map(async (d) => {
            let url = '#';
            try { url = await documentUrl(d.storage_path); } catch { /* lien indisponible */ }
            return `<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(d.filename)}</a>
                    <span class="size">${esc(fmtSize(d.size_bytes))}</span></li>`;
          }))).join('')
        : `<li style="border:0;background:none;color:var(--text-secondary);padding-left:0">${esc(t('noDocs'))}</li>`;
    } catch (e) {
      list.innerHTML = `<li style="border:0;background:none;color:#A8443C;padding-left:0">${esc(e.message)}</li>`;
    }
  }

  async function send(file) {
    if (!file) return;
    drop.querySelector('strong').textContent = t('uploading');
    try {
      await uploadDocument(studentId, milestoneId, file);
      drop.querySelector('strong').textContent = t('dropFile');
      await refresh();
    } catch (e) {
      drop.querySelector('strong').textContent = `Échec : ${e.message}`;
    }
  }

  input.addEventListener('change', () => send(input.files[0]));
  ['dragenter', 'dragover'].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', (e) => send(e.dataTransfer.files[0]));

  refresh();
}
