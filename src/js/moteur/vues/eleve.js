/**
 * Fiche d'un élève dans le moteur : ses universités, ses options, son
 * calendrier de tâches à trois niveaux (dossier, pays, université), et le
 * panneau d'une tâche. Le dossier est resynchronisé à chaque ouverture et
 * après chaque changement de cible : c'est le moteur qui tient le calendrier.
 */
import {
  getStudent, updateStudent, listCibles, addCible, updateCible, removeCible,
  listUniversites, listExigencesValidees, getTaches, updateTache, synchroniser,
  listDocuments, uploadDocument, documentUrl, listLivrablesTache, listLivrablesEleve, updateLivrable,
  getTrame, listAcces, preparerEmail, genererLivrable, lienGmail,
} from '../donnees.js';
import { statutEffectif, urgenceTache, classeDe, tachesDeUniversite, avancement } from '../generateur.js';
import { OPTIONS_DOSSIER, CANDIDATURE, tracksDe } from '../socle.js';
import { MILESTONES } from '../../portail/milestones.js';
import { CLASSES } from '../../portail/calendrier.js';
import { t, t2, esc, fmtIso, delai } from '../lang.js';

const QUI = ['tous', 'parents', 'eleve', 'carmine', 'etablissement'];
const ETATS = ['tous', 'a_faire', 'a_venir', 'fait'];
const OWNER_KEY = { tous: 'quiTous', parents: 'quiParents', eleve: 'quiEleve', carmine: 'quiCarmine', etablissement: 'quiEtablissement' };
const ETAT_KEY = { tous: 'etatTous', a_faire: 'etatAFaire', a_venir: 'etatAVenir', fait: 'etatFait' };

const seg = (cls, items, actif, data) => `
  <div class="seg-track ${cls}">${items.map(([val, label]) =>
    `<button type="button" data-${data}="${esc(val)}" aria-pressed="${String(val) === String(actif)}">${esc(label)}</button>`).join('')}</div>`;

export async function vueEleve(app, id, tacheOuverte = null) {
  const student = await getStudent(id);
  const filtres = { niveau: 'tout', universite: '', qui: 'tous', etat: 'tous' };
  let msgSync = '';

  const render = async () => {
    try {
      const r = await synchroniser(student);
      if (r.ajoutees || r.redatees || r.effacees) msgSync = t('synchronise')(r.ajoutees, r.redatees, r.effacees);
    } catch (err) {
      msgSync = `${t('echec')} : ${err.message}`;
    }
    const [taches, cibles, universites] = await Promise.all([getTaches(id), listCibles(id), listUniversites()]);
    const exigences = await listExigencesValidees(cibles.map((c) => c.universite_id));
    const parExigence = new Map(exigences.map((e) => [e.id, e]));
    const nbExigences = new Map();
    for (const e of exigences) nbExigences.set(e.universite_id, (nbExigences.get(e.universite_id) ?? 0) + 1);
    const nomU = (uid) => {
      const u = universites.find((x) => x.id === uid);
      return u ? (u.cursus ? `${u.etablissement} · ${u.cursus}` : u.etablissement) : '';
    };
    const today = new Date();
    const cls = classeDe(today.toISOString().slice(0, 10), student.terminale_year);
    const vivantes = taches.filter((x) => x.statut !== 'effacee');

    /* ── Sélection selon le niveau ───────────────────────── */
    let ensemble = vivantes;
    if (filtres.niveau === 'universite' && filtres.universite) {
      const c = cibles.find((x) => x.universite_id === filtres.universite);
      ensemble = tachesDeUniversite(vivantes.map((x) => ({ ...x, partagee: x.universite_id == null && x.origine === 'socle' && estPartagee(x), filieres: filieresDe(x, universites) })),
        filtres.universite, c?.universite?.filiere ?? 'us');
    } else if (filtres.niveau !== 'tout') {
      const fil = filtres.niveau;
      ensemble = vivantes.filter((x) => filieresDe(x, universites).includes(fil));
    }
    const av = avancement(ensemble, today);

    const visibles = ensemble.filter((x) => {
      const st = statutEffectif(x, today);
      if (filtres.qui !== 'tous' && !x.owners.includes(filtres.qui)) return false;
      if (filtres.etat === 'a_faire' && !['a_faire', 'en_cours'].includes(st)) return false;
      if (filtres.etat === 'a_venir' && st !== 'a_venir') return false;
      if (filtres.etat === 'fait' && st !== 'fait') return false;
      return true;
    });

    /* ── Groupes par classe ──────────────────────────────── */
    // Les étapes antérieures à la prise en charge, rangées « sans objet », ne
    // se mêlent pas au parcours : elles se replient en bas, comme avant.
    const yEntree = CLASSES.find((c) => c.key === student.entry_class)?.y ?? -6;
    const passees = visibles.filter((x) => x.statut === 'sans_objet' && classeDe(x.apparition, student.terminale_year).y < yEntree);
    const courantes = visibles.filter((x) => !passees.includes(x));
    const groupes = new Map();
    for (const x of courantes) {
      const c = classeDe(x.apparition, student.terminale_year);
      if (!groupes.has(c.key)) groupes.set(c.key, { c, sy: student.terminale_year + c.y, items: [] });
      groupes.get(c.key).items.push(x);
    }
    const ordre = [...groupes.values()].sort((a, b) => a.sy - b.sy);

    app.innerHTML = `
      <div class="portal__inner">
        <p class="moteur-retour"><a href="/moteur?vue=dossiers">← ${esc(t('retourDossiers'))}</a></p>
        <div class="dossier-head">
          <div class="dossier-head__who">
            <span class="label">${esc(t('navDossiers'))}</span>
            <h1>${esc(student.first_name)} ${esc(student.last_name)}</h1>
            <span class="meta">${esc(cls.label)}${student.school ? ' · ' + esc(student.school) : ''} · ${student.tracks.map((tr) => esc(t2('filieres', tr))).join(', ')}</span>
          </div>
          <div class="portal-actions"><button class="btn btn--secondary btn--sm" id="export">${esc(t('exporter'))}</button>
            <button class="btn btn--secondary btn--sm" id="archiver">${esc(t('archiver'))}</button></div>
          <div class="dossier-progress"><b>${av.pct}%</b><span>${av.done} / ${av.total}${av.late ? ` · ${esc(t('retards')(av.late))}` : ''}</span>
            <div class="bar"><i style="width:${av.pct}%"></i></div></div>
        </div>
        <p class="fiche-msg" id="msg-sync">${esc(msgSync)}</p>

        <section class="cibles-bloc">
          <div class="journal-head"><h2 class="section-title" style="margin:0">${esc(t('ciblesTitre'))}</h2>
            <span class="journal-count">${cibles.length}</span></div>
          <p class="moteur-intro">${esc(t('ciblesIntro'))}</p>
          ${cibles.length ? `<ul class="cible-list cibles-moteur">${cibles.map((c) => {
            const u = c.universite; const nb = nbExigences.get(c.universite_id) ?? 0;
            return `<li data-u="${esc(c.universite_id)}">
              <div class="cible-nom">${esc(u.etablissement)}${u.cursus ? ` <span class="cible-cursus">${esc(u.cursus)}</span>` : ''}</div>
              <div class="cible-src">${esc(u.pays)} · ${nb ? esc(t('exigencesValidees')(nb)) : esc(t('sansExigence'))} · <a href="/moteur?universite=${u.id}">${esc(t('fiche'))}</a></div>
              <div class="cible-actions cible-actions--moteur">
                <span class="seg-track seg-regime">
                  <button type="button" data-regime="0" aria-pressed="${!c.retenue}">${esc(t('envisagee'))}</button>
                  <button type="button" data-regime="1" aria-pressed="${Boolean(c.retenue)}">${esc(t('retenue'))}</button>
                </span>
                ${u.filiere === 'us' ? `<label>${esc(t('tourLabel'))} <select data-tour>${['', 'anticipe', 'ordinaire'].map((k) =>
                  `<option value="${k}"${(c.tour ?? '') === k ? ' selected' : ''}>${esc(t2('tours', k))}</option>`).join('')}</select></label>` : ''}
                <label>${esc(t('decisionLabel'))} <select data-decision>${['', 'admis', 'refuse', 'report', 'attente', 'retire'].map((k) =>
                  `<option value="${k}"${(c.decision ?? '') === k ? ' selected' : ''}>${esc(t2('decisions', k))}</option>`).join('')}</select></label>
                <input type="date" data-decision-le value="${esc(c.decision_le ?? '')}"${c.decision ? '' : ' hidden'}>
                <button type="button" class="exi-del" data-retirer>${esc(t('retirer'))}</button>
              </div>
            </li>`; }).join('')}</ul>` : `<p class="journal-empty">${esc(t('ciblesVide'))}</p>`}
          <form class="journal-add" id="add-cible">
            <select data-el="univ" required>
              <option value="">${esc(t('ajouterUniversite'))}…</option>
              ${groupesPays(universites.filter((u) => !cibles.some((c) => c.universite_id === u.id)))}
            </select>
            <button type="submit" class="btn btn--secondary btn--sm">${esc(t('ajouterBtn'))}</button>
            <a class="btn btn--secondary btn--sm" href="/moteur?vue=fiches">${esc(t('nouvelleFiche'))}</a>
          </form>
          <div class="options-bloc">
            <span class="track-filter__label">${esc(t('optionsTitre'))}</span>
            ${OPTIONS_DOSSIER.map((o) => `<label><input type="checkbox" data-option="${o}"${(student.options ?? []).includes(o) ? ' checked' : ''}> ${esc(t2('options', o))}</label>`).join('')}
          </div>
        </section>

        <h2 class="section-title">${esc(t('taches')(courantes.length))}</h2>
        <div class="filters">
          <div class="track-filter"><span class="track-filter__label">${esc(t('niveau'))}</span>
            ${seg('seg-niveau', [['tout', t('niveauTout')], ...student.tracks.map((tr) => [tr, t2('filieres', tr)]), ['universite', t('niveauUniversite')]], filtres.niveau, 'niveau')}
            <select data-el="niveau-u"${filtres.niveau === 'universite' ? '' : ' hidden'}>
              ${cibles.map((c) => `<option value="${esc(c.universite_id)}"${filtres.universite === c.universite_id ? ' selected' : ''}>${esc(nomU(c.universite_id))}</option>`).join('')}
            </select></div>
          <div class="track-filter"><span class="track-filter__label">${esc(t('qui'))}</span>
            ${seg('seg-qui', QUI.map((q) => [q, t(OWNER_KEY[q])]), filtres.qui, 'qui')}</div>
          <div class="track-filter"><span class="track-filter__label">${esc(t('etat'))}</span>
            ${seg('seg-etat', ETATS.map((e) => [e, t(ETAT_KEY[e])]), filtres.etat, 'etat')}</div>
        </div>

        ${ordre.length ? ordre.map((g) => `
          <section class="year-group">
            <div class="year-head"><h2>${esc(g.c.label)} · ${g.sy}-${g.sy + 1}</h2>
              ${g.c.key === cls.key ? `<span class="badge-now">${esc(t('anneeEnCours'))}</span>` : ''}
              <span class="count">${esc(t('taches')(g.items.length))}</span></div>
            <div class="ms-grid">${g.items.map((x) => carte(x, today, nomU)).join('')}</div>
          </section>`).join('') : `<div class="empty-state">${esc(t('aucuneTache'))}</div>`}
        ${passees.length ? `<details class="moteur-details"><summary>${esc(t('passees')(passees.length))}</summary>
          <p class="moteur-intro">${esc(t('passeesIntro'))}</p>
          <div class="ms-grid">${passees.map((x) => carte(x, today, nomU)).join('')}</div></details>` : ''}
      </div>`;

    /* ── Câblage ─────────────────────────────────────────── */
    const resync = async () => { await render(); };

    document.getElementById('archiver').addEventListener('click', async () => {
      if (!confirm(t('archiverConfirm'))) return;
      await updateStudent(id, { archived: true });
      location.href = '/moteur?vue=dossiers';
    });
    document.getElementById('export').addEventListener('click', () =>
      exporterDossier({ student, taches: vivantes, cibles, universites, nomU }));

    app.querySelector('#add-cible').addEventListener('submit', async (e) => {
      e.preventDefault();
      const uid = app.querySelector('[data-el=univ]').value;
      if (!uid) return;
      await addCible(id, uid, cibles.length);
      await resync();
    });

    app.querySelectorAll('.cibles-moteur li').forEach((li) => {
      const uid = li.dataset.u;
      li.querySelectorAll('[data-regime]').forEach((b) => b.addEventListener('click', async () => {
        await updateCible(id, uid, { retenue: b.dataset.regime === '1' }); await resync();
      }));
      li.querySelector('[data-tour]')?.addEventListener('change', async (ev) => {
        await updateCible(id, uid, { tour: ev.target.value || null }); await resync();
      });
      const selDecision = li.querySelector('[data-decision]');
      const dateDecision = li.querySelector('[data-decision-le]');
      selDecision.addEventListener('change', async () => {
        const decision = selDecision.value || null;
        const decision_le = decision ? (dateDecision.value || today.toISOString().slice(0, 10)) : null;
        await updateCible(id, uid, { decision, decision_le }); await resync();
      });
      dateDecision.addEventListener('change', async () => {
        await updateCible(id, uid, { decision_le: dateDecision.value || null }); await resync();
      });
      li.querySelector('[data-retirer]').addEventListener('click', async () => {
        if (!confirm(t('retirerConfirm'))) return;
        await removeCible(id, uid); await resync();
      });
    });

    app.querySelectorAll('[data-option]').forEach((c) => c.addEventListener('change', async () => {
      const options = [...app.querySelectorAll('[data-option]')].filter((x) => x.checked).map((x) => x.dataset.option);
      await updateStudent(id, { options });
      student.options = options;
      await resync();
    }));

    const brancheSeg = (cls, key) => app.querySelector(`.${cls}`)?.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      filtres[key] = b.dataset[key];
      if (key === 'niveau' && filtres.niveau === 'universite' && !filtres.universite) filtres.universite = cibles[0]?.universite_id ?? '';
      render();
    });
    brancheSeg('seg-niveau', 'niveau'); brancheSeg('seg-qui', 'qui'); brancheSeg('seg-etat', 'etat');
    app.querySelector('[data-el=niveau-u]')?.addEventListener('change', (e) => { filtres.universite = e.target.value; render(); });

    app.querySelectorAll('.ms-card[data-tache]').forEach((card) => card.addEventListener('click', () => {
      const x = taches.find((y) => y.id === card.dataset.tache);
      if (x) ouvrirPanneau(x, { nomU, exigence: x.exigence_id ? parExigence.get(x.exigence_id) : null, apres: render });
    }));

    if (tacheOuverte) {
      const x = taches.find((y) => y.id === tacheOuverte);
      tacheOuverte = null;
      if (x) ouvrirPanneau(x, { nomU, exigence: x.exigence_id ? parExigence.get(x.exigence_id) : null, apres: render });
    }
  };

  await render();
}

/* ── Aides ──────────────────────────────────────────────────── */


function estPartagee(x) { return x.milestone_id ? CANDIDATURE.has(x.milestone_id) : false; }

function filieresDe(x, universites) {
  if (x.universite_id) {
    const u = universites.find((v) => v.id === x.universite_id);
    return u?.filiere ? [u.filiere] : [];
  }
  const m = MILESTONES.find((mm) => mm.id === x.milestone_id);
  return m ? tracksDe(m) : [];
}

function groupesPays(universites) {
  const parPays = new Map();
  for (const u of universites) (parPays.get(u.pays) ?? parPays.set(u.pays, []).get(u.pays)).push(u);
  return [...parPays.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([pays, list]) =>
    `<optgroup label="${esc(pays)}">${list.sort((a, b) => (a.etablissement + (a.cursus ?? '')).localeCompare(b.etablissement + (b.cursus ?? '')))
      .map((u) => `<option value="${esc(u.id)}">${esc(u.etablissement)}${u.cursus ? ` — ${esc(u.cursus)}` : ''}</option>`).join('')}</optgroup>`).join('');
}

function carte(x, today, nomU) {
  const st = statutEffectif(x, today);
  const u = urgenceTache(x, today);
  const classes = ['ms-card', x.lock ? 'is-lock' : '', `u-${u}`, st === 'fait' ? 'is-done' : '', st === 'a_venir' ? 'is-avenir' : ''].filter(Boolean).join(' ');
  const nom = x.universite_id ? nomU(x.universite_id) : '';
  return `
    <button type="button" class="${classes}" data-tache="${esc(x.id)}">
      <span class="ms-card__top">
        <span class="ms-card__id">${esc(x.milestone_id ?? t2('types', x.type))}</span>
        ${x.lock ? `<span class="ms-tag ms-tag--lock">● ${esc(t('irrattrapable'))}</span>` : ''}
        ${x.origine === 'socle' && estPartagee(x) ? `<span class="ms-tag">${esc(t('partagee'))}</span>` : ''}
      </span>
      <h3>${esc(x.titre)}</h3>
      ${nom ? `<span class="ms-card__pour">${esc(nom)}</span>` : ''}
      <span class="ms-card__date">${esc(fmtIso(x.echeance))}${['fait', 'sans_objet'].includes(st) ? '' : ` · ${esc(delai(x.echeance, today))}`}</span>
      ${st === 'a_venir' ? `<span class="ms-card__when">${esc(t('apparait'))} ${esc(fmtIso(x.apparition))}</span>` : ''}
      <span class="ms-status st-${esc(st)}"><span class="dot"></span>${esc(t2('statutsTache', st))}</span>
    </button>`;
}

/* ── Panneau d'une tâche ────────────────────────────────────── */

let panel = null; let scrim = null;
function assurePanneau() {
  if (panel) return;
  scrim = document.createElement('div'); scrim.className = 'ms-scrim';
  panel = document.createElement('aside'); panel.className = 'ms-panel'; panel.setAttribute('role', 'dialog'); panel.tabIndex = -1;
  document.body.append(scrim, panel);
  scrim.addEventListener('click', fermer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermer(); });
}
function fermer() { panel?.classList.remove('is-open'); scrim?.classList.remove('is-open'); }

function ouvrirPanneau(x, { nomU, exigence, apres }) {
  assurePanneau();
  const today = new Date();
  const st = statutEffectif(x, today);
  const nom = x.universite_id ? nomU(x.universite_id) : '';
  const m = x.milestone_id ? MILESTONES.find((mm) => mm.id === x.milestone_id) : null;
  const modeles = (m?.docs ?? []).filter((d) => d.trame);
  const emailable = x.owners.some((o) => o !== 'carmine');
  panel.innerHTML = `
    <div class="ms-panel__head">
      <div class="row"><div style="min-width:0">
        <div class="ms-panel__eyebrow">${esc(x.milestone_id ?? t2('types', x.type))}${nom ? ` · ${esc(nom)}` : ''}</div>
        <h2>${esc(x.titre)}</h2></div>
        <button class="ms-close" data-el="close" aria-label="${esc(t('fermer'))}">&times;</button></div>
      <div class="ms-panel__meta">
        <span class="ms-tag${x.lock ? ' ms-tag--lock' : ''}">${x.lock ? '● ' : ''}${esc(t2('types', x.type))}</span>
        <span class="ms-tag">${esc(t('echeanceLabel'))} ${esc(fmtIso(x.echeance))}</span>
        <span class="ms-tag">${esc(t('apparait'))} ${esc(fmtIso(x.apparition))}</span>
      </div>
    </div>
    <div class="ms-panel__body">
      ${x.consigne ? `<div class="blk"><h4>${esc(t2('champs', 'consigne'))}</h4><p class="quote">${esc(x.consigne)}</p></div>` : ''}
      ${m?.obj ? `<div class="blk"><h4>${esc(t('purposeLabel'))}</h4><p class="quote">${esc(m.obj)}</p></div>` : ''}
      <div class="blk"><h4>${esc(t('qui'))}</h4><p>${x.owners.map((o) => esc(t2('owners', o))).join(' · ')}</p></div>
      ${exigence ? `<div class="blk"><h4>${esc(t('ouvrirSource'))}</h4>
        <p>${exigence.source_url ? `<a href="${esc(exigence.source_url)}" target="_blank" rel="noopener">${esc(exigence.source_url)}</a>` : esc(t('sansSource'))}
        ${exigence.millesime ? ` · ${esc(exigence.millesime)}` : ''}</p>
        ${x.lock ? `<p>${x.date_confirmee_le
          ? `<span class="exi-conf exi-conf--trouve">${esc(t('dateConfirmee'))} · ${esc(fmtIso(x.date_confirmee_le.slice(0, 10)))}</span>`
          : `<button type="button" class="btn btn--secondary btn--sm" data-el="confirmer">${esc(t('confirmerDate'))}</button>`}</p>` : ''}
      </div>` : ''}

      <div class="blk"><h4>${esc(t('etat'))}</h4>
        <div class="portal-field"><select data-el="statut">${['a_faire', 'en_cours', 'fait', 'sans_objet'].map((k) =>
          `<option value="${k}"${k === (st === 'a_venir' ? 'a_faire' : st) ? ' selected' : ''}>${esc(t2('statutsTache', k))}</option>`).join('')}</select></div>
        <div class="portal-field"><label>${esc(t('messageParents'))}</label><textarea data-el="public" rows="2">${esc(x.public_note ?? '')}</textarea></div>
        <div class="portal-field"><label>${esc(t('notePrivee'))}</label><textarea data-el="private" rows="2">${esc(x.private_note ?? '')}</textarea></div>
        <button class="btn btn--primary btn--sm" data-el="save">${esc(t('enregistrer'))}</button>
        <span class="fiche-msg" data-el="msg" style="display:inline;margin-left:.6rem"></span>
      </div>

      ${emailable ? `<div class="blk" data-el="email"><h4>${esc(t('emailTitre'))}</h4><p class="journal-loading">${esc(t('chargement'))}</p></div>` : ''}
      ${x.type === 'essai' ? `<div class="blk" data-el="brief"><h4>${esc(t('briefTitre'))}</h4><p class="journal-loading">${esc(t('chargement'))}</p></div>` : ''}
      <div class="blk" data-el="pieces"><h4>${esc(t('piecesTitre'))}</h4><p class="journal-loading">${esc(t('chargement'))}</p></div>
      ${modeles.length ? `<div class="blk"><h4>${esc(t('modelesTitre'))}</h4><ul class="doc-list">${modeles.map((d) =>
        `<li><span class="ms-tag">${esc(d.code)}</span><button type="button" class="doc-open" data-trame="${esc(d.trame)}">${esc(d.label)}</button><span class="size">${esc(d.note ?? '')}</span></li>`).join('')}</ul>
        <div class="trame-lue" data-el="trame-lue" hidden></div></div>` : ''}
    </div>`;
  panel.querySelector('[data-el=close]').addEventListener('click', fermer);
  const msg = panel.querySelector('[data-el=msg]');
  panel.querySelector('[data-el=save]').addEventListener('click', async (ev) => {
    ev.currentTarget.disabled = true;
    try {
      await updateTache(x.id, {
        statut: panel.querySelector('[data-el=statut]').value,
        public_note: panel.querySelector('[data-el=public]').value || null,
        private_note: panel.querySelector('[data-el=private]').value || null,
      });
      msg.textContent = t('enregistre');
      fermer();
      await apres();
    } catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; ev.currentTarget.disabled = false; }
  });
  panel.querySelector('[data-el=confirmer]')?.addEventListener('click', async (ev) => {
    ev.currentTarget.disabled = true;
    try { await updateTache(x.id, { date_confirmee_le: new Date().toISOString() }); fermer(); await apres(); }
    catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; }
  });
  panel.querySelectorAll('[data-trame]').forEach((b) => b.addEventListener('click', async () => {
    const zone = panel.querySelector('[data-el=trame-lue]');
    zone.hidden = false;
    try {
      const trame = await getTrame(b.dataset.trame);
      zone.innerHTML = trame ? `<h4>${esc(trame.titre)}</h4><pre>${esc(trame.contenu)}</pre>` : `<p class="journal-empty">${esc(t('trameMissing'))}</p>`;
    } catch (err) { zone.innerHTML = `<p class="journal-empty">${esc(err.message)}</p>`; }
  }));

  if (emailable) brancherEmail(panel.querySelector('[data-el=email]'), x);
  if (x.type === 'essai') brancherBrief(panel.querySelector('[data-el=brief]'), x);
  brancherPieces(panel.querySelector('[data-el=pieces]'), x);

  panel.classList.add('is-open'); scrim.classList.add('is-open'); panel.focus();
}

/* ── Email d'une tâche ──────────────────────────────────────── */

async function brancherEmail(zone, x) {
  const rendre = async () => {
    let livrables = [];
    try { livrables = (await listLivrablesTache(x.id)).filter((l) => l.objet != null); }
    catch (err) { zone.innerHTML = `<h4>${esc(t('emailTitre'))}</h4><p class="journal-empty">${esc(err.message)}</p>`; return; }
    const l = livrables[0];
    zone.innerHTML = `<h4>${esc(t('emailTitre'))}</h4>
      ${l ? `
        <div class="portal-field"><label>${esc(t('emailA'))}</label><input data-el="to" value="${esc(l.destinataire ?? '')}"></div>
        <div class="portal-field"><label>${esc(t('emailObjet'))}</label><input data-el="objet" value="${esc(l.objet ?? '')}"></div>
        <div class="portal-field"><label>${esc(t('emailCorps'))}</label><textarea data-el="corps" rows="9">${esc(l.contenu ?? '')}</textarea></div>
        <div class="exi-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-act="save">${esc(t('enregistrer'))}</button>
          <a class="btn btn--primary btn--sm" data-act="gmail" href="#" target="_blank" rel="noopener">${esc(t('ouvrirGmail'))}</a>
          ${x.envoye_le ? `<span class="exi-conf exi-conf--trouve">${esc(t('envoyeLe'))} ${esc(fmtIso(x.envoye_le.slice(0, 10)))}</span>`
            : `<button type="button" class="btn btn--secondary btn--sm" data-act="envoye">${esc(t('marquerEnvoye'))}</button>`}
          <button type="button" class="exi-del" data-act="regen">${esc(t('regenerer'))}</button>
          <span class="fiche-msg" data-el="msg"></span>
        </div>`
      : `<p class="journal-intro">${esc(t('emailIntro'))}</p>
         <button type="button" class="btn btn--primary btn--sm" data-act="regen">${esc(t('preparerEmail'))}</button>
         <span class="fiche-msg" data-el="msg"></span>`}`;
    const msg = zone.querySelector('[data-el=msg]');
    const lire = () => ({
      destinataire: zone.querySelector('[data-el=to]').value.trim() || null,
      objet: zone.querySelector('[data-el=objet]').value.trim(),
      contenu: zone.querySelector('[data-el=corps]').value,
    });
    const majLien = () => {
      const a = zone.querySelector('[data-act=gmail]'); if (!a) return;
      const v = lire(); a.href = lienGmail({ to: v.destinataire, objet: v.objet, corps: v.contenu });
    };
    majLien();
    zone.querySelectorAll('[data-el=to],[data-el=objet],[data-el=corps]').forEach((el) => el.addEventListener('input', majLien));
    zone.querySelector('[data-act=save]')?.addEventListener('click', async () => {
      try { await updateLivrable(l.id, { ...lire(), titre: lire().objet, statut: 'relu' }); msg.textContent = t('enregistre'); }
      catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; }
    });
    zone.querySelector('[data-act=envoye]')?.addEventListener('click', async () => {
      try { await updateTache(x.id, { envoye_le: new Date().toISOString() }); x.envoye_le = new Date().toISOString(); await rendre(); }
      catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; }
    });
    zone.querySelector('[data-act=regen]')?.addEventListener('click', async (ev) => {
      ev.currentTarget.disabled = true; msg.textContent = t('redactionEnCours');
      try { await preparerEmail(x.id); await rendre(); }
      catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; ev.currentTarget.disabled = false; }
    });
  };
  await rendre();
}

/* ── Brief d'un essai ───────────────────────────────────────── */

async function brancherBrief(zone, x) {
  const rendre = async () => {
    let livrables = [];
    try { livrables = (await listLivrablesTache(x.id)).filter((l) => l.trame_code === 'BRIEF-ESSAI'); }
    catch (err) { zone.innerHTML = `<h4>${esc(t('briefTitre'))}</h4><p class="journal-empty">${esc(err.message)}</p>`; return; }
    const l = livrables[0];
    zone.innerHTML = `<h4>${esc(t('briefTitre'))}</h4>
      ${l ? `
        <p class="journal-intro">${esc(t2('statutsLivrable', l.statut))}${l.publie_le ? ` · ${esc(fmtIso(l.publie_le.slice(0, 10)))}` : ''}</p>
        <div class="portal-field"><textarea data-el="brief" rows="14">${esc(l.contenu ?? '')}</textarea></div>
        <div class="exi-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-act="save">${esc(t('enregistrer'))}</button>
          ${l.statut !== 'publie' ? `<button type="button" class="btn btn--primary btn--sm" data-act="publier">${esc(t('publierEleve'))}</button>` : ''}
          <button type="button" class="exi-del" data-act="regen">${esc(t('regenerer'))}</button>
          <span class="fiche-msg" data-el="msg"></span>
        </div>`
      : `<p class="journal-intro">${esc(t('briefIntro'))}</p>
         <button type="button" class="btn btn--primary btn--sm" data-act="regen">${esc(t('genererBrief'))}</button>
         <span class="fiche-msg" data-el="msg"></span>`}`;
    const msg = zone.querySelector('[data-el=msg]');
    zone.querySelector('[data-act=save]')?.addEventListener('click', async () => {
      try { await updateLivrable(l.id, { contenu: zone.querySelector('[data-el=brief]').value, statut: l.statut === 'publie' ? 'publie' : 'relu' }); msg.textContent = t('enregistre'); }
      catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; }
    });
    zone.querySelector('[data-act=publier]')?.addEventListener('click', async () => {
      try { await updateLivrable(l.id, { contenu: zone.querySelector('[data-el=brief]').value, statut: 'publie' }); await rendre(); }
      catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; }
    });
    zone.querySelector('[data-act=regen]')?.addEventListener('click', async (ev) => {
      ev.currentTarget.disabled = true; msg.textContent = t('redactionEnCours');
      try { await genererLivrable({ tache_id: x.id, trame_code: 'BRIEF-ESSAI' }); await rendre(); }
      catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; ev.currentTarget.disabled = false; }
    });
  };
  await rendre();
}

/* ── Pièces d'une tâche ─────────────────────────────────────── */

async function brancherPieces(zone, x) {
  const rendre = async () => {
    let docs = [];
    try { docs = await listDocuments(x.id); }
    catch (err) { zone.innerHTML = `<h4>${esc(t('piecesTitre'))}</h4><p class="journal-empty">${esc(err.message)}</p>`; return; }
    const lignes = await Promise.all(docs.map(async (d) => {
      let url = '#'; try { url = await documentUrl(d.storage_path); } catch { /* lien indisponible */ }
      return `<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(d.filename)}</a><span class="size">${esc(fmtIso(d.created_at.slice(0, 10)))}</span></li>`;
    }));
    zone.innerHTML = `<h4>${esc(t('piecesTitre'))}</h4>
      <ul class="doc-list">${lignes.join('') || `<li style="border:0;background:none;padding-left:0;color:var(--text-secondary)">${esc(t('aucunePiece'))}</li>`}</ul>
      <label class="dropzone"><strong>${esc(t('deposerPiece'))}</strong><span>${esc(t('deposerHint'))}</span><input type="file" data-el="file"></label>`;
    zone.querySelector('[data-el=file]').addEventListener('change', async (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      zone.querySelector('.dropzone strong').textContent = t('envoiEnCours');
      try { await uploadDocument(x.student_id, x.id, f); await rendre(); }
      catch (err) { zone.querySelector('.dropzone strong').textContent = `${t('echec')} : ${err.message}`; }
    });
  };
  await rendre();
}

/* ── Export du dossier ──────────────────────────────────────── */

async function exporterDossier({ student, taches, cibles, universites, nomU }) {
  const today = new Date();
  let livrables = [];
  try { livrables = (await listLivrablesEleve(student.id)).filter((l) => l.statut === 'publie'); } catch { /* sans livrables */ }
  const bloc = (titre, liste) => liste.length ? `<h2>${esc(titre)}</h2>${liste.map((x) => {
    const st = statutEffectif(x, today);
    return `<div class="t"><b>${esc(x.titre)}</b> <span>${esc(t2('statutsTache', st))} · ${esc(fmtIso(x.echeance))}</span>${x.public_note ? `<p>${esc(x.public_note)}</p>` : ''}</div>`;
  }).join('')}` : '';
  const parU = cibles.map((c) => {
    const u = c.universite;
    const mine = tachesDeUniversite(taches.map((x) => ({ ...x, partagee: x.universite_id == null && x.origine === 'socle' && estPartagee(x), filieres: filieresDe(x, universites) })), c.universite_id, u.filiere ?? 'us');
    const av = avancement(mine, today);
    return bloc(`${u.etablissement}${u.cursus ? ` — ${u.cursus}` : ''} · ${c.retenue ? t('retenue') : t('envisagee')} · ${av.done}/${av.total}`, mine.filter((x) => x.universite_id === c.universite_id));
  }).join('');
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(student.first_name)} ${esc(student.last_name)} — Carmine Admission</title>
    <style>body{font:14px/1.5 -apple-system,Inter,sans-serif;color:#1A1A2E;max-width:760px;margin:2rem auto;padding:0 1rem}h1{font-family:Georgia,serif;font-size:1.8rem;margin:0}h2{font-family:Georgia,serif;font-size:1.15rem;margin:1.6rem 0 .5rem;border-bottom:1px solid #ddd;padding-bottom:.2rem}.t{padding:.35rem 0;border-bottom:1px solid #f0f0f0}.t span{color:#6B6B7B;font-size:.85rem;margin-left:.5rem}.t p{margin:.2rem 0 0;color:#444}pre{white-space:pre-wrap;font:inherit;background:#f7f7f4;padding:.8rem;border-radius:4px}@media print{body{margin:0}}</style></head><body>
    <p style="color:#B8973B;letter-spacing:.14em;text-transform:uppercase;font-size:.72rem;font-weight:600">Carmine Admission · ${esc(t('exportTitre'))}</p>
    <h1>${esc(student.first_name)} ${esc(student.last_name)}</h1>
    <p style="color:#6B6B7B">${esc(fmtIso(today.toISOString().slice(0, 10)))} · ${student.tracks.map((tr) => esc(t2('filieres', tr))).join(', ')}${student.admission ? ` · ${esc(student.admission)}` : ''}</p>
    ${parU}
    ${bloc(t('exportSocle'), taches.filter((x) => x.universite_id == null))}
    ${livrables.length ? `<h2>${esc(t('exportLivrables'))}</h2>${livrables.map((l) => `<h3>${esc(l.titre)}</h3><pre>${esc(l.contenu)}</pre>`).join('')}` : ''}
    </body></html>`;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html); w.document.close();
  setTimeout(() => w.print(), 400);
}
