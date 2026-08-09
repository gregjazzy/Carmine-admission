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
            data-tracks="${esc(shared.join(' '))}"
            data-owners="${esc(milestone.owners.join(' '))}">
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

/**
 * Barre de filtre par destinataire, côté parent.
 * Le dossier reste visible en entier par défaut : c'est ce que la famille achète.
 * Le filtre sert à répondre à « qu'est-ce qu'on me demande, à moi » sans rien masquer.
 */
export function ownerFilter(active = 'all') {
  const btn = (val, label) =>
    `<button type="button" data-owner="${esc(val)}" aria-pressed="${val === active}">${esc(label)}</button>`;
  return `
    <div class="track-filter">
      <span class="track-filter__label">${esc(t('whoLabel'))}</span>
      <div class="seg-owner">
        ${btn('all', t('allOwners'))}
        ${btn('parents', t('ownerYou'))}
        ${btn('eleve', t('ownerChild'))}
        ${btn('carmine', t('ownerCarmine'))}
      </div>
    </div>`;
}

/** Applique les filtres de filière et de destinataire sans reconstruire la page. */
export function applyTrackFilter(root, track, owner = 'all') {
  root.querySelectorAll('.ms-card').forEach((card) => {
    const list = (card.dataset.tracks || '').split(' ').filter(Boolean);
    const owners = (card.dataset.owners || '').split(' ').filter(Boolean);
    card.hidden = (track !== 'all' && !list.includes(track))
      || (owner !== 'all' && !owners.includes(owner));
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

  // Mode opératoire : la méthode de conduite du jalon, pour l'administration
  // seule. canEdit n'est vrai que sur /pilotage — un parent ne le voit jamais.
  const methode = opts.canEdit ? mt(milestone, 'methode') : '';
  if (methode) {
    html += `<div class="blk blk-methode"><h4>${esc(t('methodTitle'))}</h4>${
      methode.split('\n').map((p) => `<p>${esc(p)}</p>`).join('')}</div>`;
  }

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

  // Trame de questions : contenu de méthode, versionné avec le référentiel
  // plutôt que stocké en base — il est le même pour tous les dossiers et doit
  // rester lisible de la famille, que les trames en base ne permettent pas.
  const questions = mt(milestone, 'questions');
  if (questions?.length) {
    html += `<div class="blk"><h4>${esc(t('questionsTitle'))}</h4>
      <p class="journal-intro">${esc(t('questionsIntro'))}</p>
      <ol class="question-list">${questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>
    </div>`;
  }

  // Universités envisagées : deux voies distinctes. La famille dépose ses
  // souhaits en clair, y compris hors référentiel ; le consultant arbitre en
  // reliant chaque cible au référentiel, seul moyen qu'elle porte ses médianes.
  if (milestone.cibles && opts.studentId) {
    html += `<div class="blk" data-el="cibles">
      <p class="journal-loading">${esc(t('loading'))}</p>
    </div>`;
  }

  // Journal de suivi : lectures annotées, projets, essais. C'est ici que se
  // fabrique la matière première du Personal Statement — dix livres lus sans
  // notes ne produisent aucune ligne exploitable neuf mois plus tard.
  if (milestone.suivi && opts.studentId) {
    html += `<div class="blk">
      <div class="journal-head">
        <h4>${esc(t2('journalTitles', milestone.suivi))}</h4>
        <span class="journal-count" data-el="journal-count"></span>
      </div>
      <p class="journal-intro">${esc(t2('journalIntros', milestone.suivi))}</p>
      <div data-el="journal"><p class="journal-loading">${esc(t('loading'))}</p></div>
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

  if (milestone.suivi && opts.studentId) {
    wireJournal(panelEl, opts.studentId, milestone);
  }

  if (milestone.cibles && opts.studentId) {
    wireCibles(panelEl, opts.studentId, Boolean(opts.canEdit));
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

/* ── Journal de suivi ────────────────────────────────────────── */

/**
 * Rend et câble le journal d'un jalon.
 *
 * Trois champs de réflexion plutôt qu'une zone de texte libre : une page
 * blanche produit « très intéressant », ces trois questions produisent une
 * pensée — et « ce avec quoi je ne suis pas d'accord » est exactement ce que
 * creusera un entretien d'Oxbridge.
 */
async function wireJournal(root, studentId, milestone) {
  const { listItems, addItem, updateItem, removeItem } = await import('./data.js');
  const hote = root.querySelector('[data-el=journal]');
  const compteur = root.querySelector('[data-el=journal-count]');
  const kind = milestone.suivi;

  const champs = ['retenu', 'desaccord', 'question'];
  const annote = (it) => champs.some((c) => (it[c] || '').trim());

  const rendre = (items) => {
    const faits = items.filter(annote).length;
    compteur.textContent = items.length
      ? t('journalCount')(faits, items.length)
      : '';

    hote.innerHTML = `
      ${items.length ? `<ul class="journal-list">${items.map((it) => `
        <li class="journal-item${annote(it) ? ' is-done' : ''}" data-id="${esc(it.id)}">
          <details${annote(it) ? '' : ' open'}>
            <summary>
              <span class="journal-item__title">${esc(it.titre)}</span>
              ${it.reference ? `<span class="journal-item__ref">${esc(it.reference)}</span>` : ''}
              <span class="journal-item__state">${annote(it) ? esc(t('journalAnnotated')) : esc(t('journalToAnnotate'))}</span>
            </summary>
            <div class="journal-fields">
              ${champs.map((c) => `
                <label>
                  <span>${esc(t2('journalFields', c))}</span>
                  <textarea rows="2" data-champ="${c}"
                    placeholder="${esc(t2('journalHints', c))}">${esc(it[c] || '')}</textarea>
                </label>`).join('')}
              <div class="journal-actions">
                <button class="btn btn--primary btn--sm" data-act="save">${esc(t('save'))}</button>
                <button class="btn btn--secondary btn--sm" data-act="del">${esc(t('journalRemove'))}</button>
                <span class="journal-msg" data-el="msg"></span>
              </div>
            </div>
          </details>
        </li>`).join('')}</ul>`
        : `<p class="journal-empty">${esc(t2('journalEmpty', kind))}</p>`}

      <form class="journal-add" data-el="add">
        <input required data-el="titre" placeholder="${esc(t2('journalNew', kind))}">
        <input data-el="reference" placeholder="${esc(t('journalRefHint'))}">
        <button type="submit" class="btn btn--secondary btn--sm">${esc(t('journalAdd'))}</button>
      </form>`;

    hote.querySelectorAll('.journal-item').forEach((li) => {
      const id = li.dataset.id;
      const msg = li.querySelector('[data-el=msg]');

      li.querySelector('[data-act=save]').addEventListener('click', async (e) => {
        e.preventDefault();
        const btn = e.currentTarget;
        btn.disabled = true;
        try {
          const maj = {};
          li.querySelectorAll('[data-champ]').forEach((z) => {
            maj[z.dataset.champ] = z.value.trim() || null;
          });
          maj.statut = champs.some((c) => maj[c]) ? 'fait' : 'en_cours';
          await updateItem(id, maj);
          msg.textContent = t('saved');
          charger();
        } catch (err) {
          msg.textContent = `${t('failed')} : ${err.message}`;
        } finally {
          btn.disabled = false;
        }
      });

      // Filet de sécurité : un élève qui écrit trois paragraphes puis referme le
      // panneau sans cliquer perdrait tout. On enregistre à la sortie du champ,
      // sans redessiner la liste — le curseur de l'utilisateur reste où il est.
      li.querySelectorAll('[data-champ]').forEach((zone) => {
        let valeurInitiale = zone.value;
        zone.addEventListener('blur', async () => {
          if (zone.value === valeurInitiale) return;
          valeurInitiale = zone.value;
          const maj = {};
          li.querySelectorAll('[data-champ]').forEach((z) => {
            maj[z.dataset.champ] = z.value.trim() || null;
          });
          maj.statut = champs.some((c) => maj[c]) ? 'fait' : 'en_cours';
          try {
            await updateItem(id, maj);
            msg.textContent = t('savedAuto');
            li.classList.toggle('is-done', champs.some((c) => maj[c]));
          } catch (err) {
            msg.textContent = `${t('failed')} : ${err.message}`;
          }
        });
      });

      li.querySelector('[data-act=del]').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await removeItem(id);
          charger();
        } catch (err) {
          msg.textContent = `${t('failed')} : ${err.message}`;
        }
      });
    });

    const form = hote.querySelector('[data-el=add]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titre = form.querySelector('[data-el=titre]').value.trim();
      if (!titre) return;
      const bouton = form.querySelector('button');
      bouton.disabled = true;
      try {
        await addItem({
          student_id: studentId,
          milestone_id: milestone.id,
          type: kind,
          titre,
          reference: form.querySelector('[data-el=reference]').value.trim() || null,
          ordre: items.length,
        });
        charger();
      } finally {
        bouton.disabled = false;
      }
    });
  };

  async function charger() {
    try {
      rendre(await listItems(studentId, milestone.id));
    } catch (err) {
      hote.innerHTML = `<p class="journal-empty">${esc(err.message)}</p>`;
    }
  }

  charger();
}


/* ── Universités envisagées ──────────────────────────────────── */

/** Résumé chiffré d'un établissement, adapté à la nature de sa référence. */
function ligneReference(u) {
  const taux = u.taux_admission != null
    ? `${(u.taux_admission * 100).toFixed(1)} %`
    : '—';
  if (u.nature === 'medianes' && u.sat_lecture_25 != null) {
    return `${t('admissionRate')} ${taux} · SAT ${u.sat_lecture_25}-${u.sat_lecture_75} / ${u.sat_maths_25}-${u.sat_maths_75}`;
  }
  if (u.nature === 'medianes') {
    return `${t('admissionRate')} ${taux} · ${t('testsNotApplicable')}`;
  }
  return `${t('admissionRate')} ${taux} · ${esc(u.offre_type || u.seuil_points || u.eligibilite || '—')}`;
}

const GROUPES = ['ambitieuse', 'plausible', 'probable'];

async function wireCibles(root, studentId, canEdit) {
  const { listUniversites, listCibles, addCible, setCibleVerdict, removeCible,
          getDonnees, setDonnees } = await import('./data.js');
  const hote = root.querySelector('[data-el=cibles]');

  const charger = async () => {
    const [cibles, souhaits, referentiel] = await Promise.all([
      listCibles(studentId),
      getDonnees(studentId, 'souhaits').then((d) => d?.universites ?? []),
      canEdit ? listUniversites() : Promise.resolve([]),
    ]);
    rendre(cibles, souhaits, referentiel);
  };

  // Rapprochement par le nom, sans intelligence artificielle : le référentiel
  // fournit les chiffres, le modèle ne fournit que le raisonnement.
  const normaliser = (v) => String(v).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();

  const rendre = (cibles, souhaits, referentiel) => {
    const deja = new Set(cibles.map((c) => c.carmine_universites.id));
    const parGroupe = (g) => cibles.filter((c) => (c.verdict || 'plausible') === g);

    // Marquage réservé au consultant : un parent qui lirait « hors référentiel »
    // comprendrait « ils ne couvrent pas cette université ».
    const connus = referentiel.map((u) => normaliser(u.etablissement));
    const aDocumenter = (nom) => {
      const n = normaliser(nom);
      return n.length > 2 && !connus.some((c) => c.includes(n) || n.includes(c));
    };
    const restants = canEdit ? souhaits.filter(aDocumenter).length : 0;

    // Voie 1 — les souhaits de la famille, en clair.
    const blocSouhaits = `
      <h4>${esc(t('wishesTitle'))}</h4>
      <p class="journal-intro">${esc(t(canEdit ? 'wishesIntroAdmin' : 'wishesIntro'))}</p>
      ${canEdit && restants ? `<p class="wish-todo">${esc(t('wishesToDocument')(restants))}</p>` : ''}
      ${souhaits.length ? `<ul class="wish-list">${souhaits.map((n, i) => `
        <li${canEdit && aDocumenter(n) ? ' class="is-todo"' : ''}><span>${esc(n)}</span>${canEdit ? '' :
          `<button type="button" class="wish-del" data-i="${i}" aria-label="${esc(t('journalRemove'))}">&times;</button>`}</li>`).join('')}</ul>`
        : `<p class="journal-empty">${esc(t('wishesEmpty'))}</p>`}
      ${canEdit ? '' : `<form class="journal-add" data-el="add-wish">
        <input required data-el="wish" placeholder="${esc(t('wishPlaceholder'))}">
        <button type="submit" class="btn btn--secondary btn--sm">${esc(t('journalAdd'))}</button>
      </form>`}`;

    // Voie 2 — la sélection arbitrée, adossée au référentiel.
    const blocSelection = `
      <h4 style="margin-top:1.6rem">${esc(t('selectionTitle'))}</h4>
      ${cibles.length ? GROUPES.map((g) => {
        const lot = parGroupe(g);
        if (!lot.length) return '';
        return `<div class="cible-groupe">
          <div class="cible-groupe__nom">${esc(t2('bands', g))}</div>
          <ul class="cible-list">${lot.map(({ carmine_universites: u }) => `
            <li>
              <div class="cible-nom">${esc(u.etablissement)}${u.cursus ? ` <span class="cible-cursus">${esc(u.cursus)}</span>` : ''}</div>
              <div class="cible-ref">${ligneReference(u)}</div>
              <div class="cible-src">${esc(u.source)} · ${esc(u.millesime)}</div>
              ${canEdit ? `<div class="cible-actions">
                <select data-verdict="${esc(u.id)}">
                  ${/* la cible est déjà dans le lot du groupe g : c'est sa valeur courante */''}
                  ${GROUPES.map((k) => `<option value="${k}"${k === g ? ' selected' : ''}>${esc(t2('bands', k))}</option>`).join('')}
                </select>
                <button type="button" class="btn btn--secondary btn--sm" data-del="${esc(u.id)}">${esc(t('journalRemove'))}</button>
              </div>` : ''}
            </li>`).join('')}</ul>
        </div>`;
      }).join('') : `<p class="journal-empty">${esc(t('selectionEmpty'))}</p>`}
      ${canEdit ? `<form class="journal-add" data-el="add-cible" style="margin-top:.8rem">
        <select data-el="univ">
          <option value="">${esc(t('pickUniversity'))}</option>
          ${referentiel.filter((u) => !deja.has(u.id)).map((u) =>
            `<option value="${esc(u.id)}">${esc(u.etablissement)}${u.cursus ? ` — ${esc(u.cursus)}` : ''} (${u.pays})</option>`).join('')}
        </select>
        <button type="submit" class="btn btn--secondary btn--sm">${esc(t('journalAdd'))}</button>
      </form>` : ''}`;

    hote.innerHTML = blocSouhaits + blocSelection;

    const formSouhait = hote.querySelector('[data-el=add-wish]');
    if (formSouhait) {
      formSouhait.addEventListener('submit', async (e) => {
        e.preventDefault();
        const champ = formSouhait.querySelector('[data-el=wish]');
        const nom = champ.value.trim();
        if (!nom) return;
        await setDonnees(studentId, 'souhaits', { universites: [...souhaits, nom] });
        charger();
      });
      hote.querySelectorAll('.wish-del').forEach((b) => {
        b.addEventListener('click', async () => {
          const reste = souhaits.filter((_, i) => i !== Number(b.dataset.i));
          await setDonnees(studentId, 'souhaits', { universites: reste });
          charger();
        });
      });
    }

    const formCible = hote.querySelector('[data-el=add-cible]');
    if (formCible) {
      formCible.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = formCible.querySelector('[data-el=univ]').value;
        if (!id) return;
        await addCible(studentId, id, cibles.length);
        charger();
      });
    }
    hote.querySelectorAll('[data-verdict]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        await setCibleVerdict(studentId, sel.dataset.verdict, sel.value);
        charger();
      });
    });
    hote.querySelectorAll('[data-del]').forEach((b) => {
      b.addEventListener('click', async () => {
        await removeCible(studentId, b.dataset.del);
        charger();
      });
    });
  };

  try {
    await charger();
  } catch (err) {
    hote.innerHTML = `<p class="journal-empty">${esc(err.message)}</p>`;
  }
}
