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
  getGuides, updateGuide, genererGuide, matiereGuide, cleGuide, passerBalle,
} from '../donnees.js';
import { statutEffectif, urgenceTache, classeDe, tachesDeUniversite, avancement, blocages, attendDepuis } from '../generateur.js';
import { OPTIONS_DOSSIER, CANDIDATURE, DOCS_MOTEUR, tracksDe } from '../socle.js';
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
    const avTotal = avancement(vivantes, today);

    /* ── Le haut : ce qui compte maintenant ─────────────────── */
    const actives = vivantes
      .filter((x) => ['a_faire', 'en_cours'].includes(statutEffectif(x, today)))
      .map((x) => ({ x, u: urgenceTache(x, today) }))
      .sort((a, b) => (RANG[a.u] - RANG[b.u]) || a.x.echeance.localeCompare(b.x.echeance));
    const colonnes = { carmine: [], eleve: [], parents: [], etablissement: [] };
    for (const item of actives) {
      const b = item.x.balle ?? item.x.owners[0] ?? 'carmine';
      (colonnes[b === 'externe' ? 'etablissement' : b] ?? colonnes.carmine).push(item);
    }
    const prochainLock = actives.filter(({ x }) => x.lock).sort((a, b) => a.x.echeance.localeCompare(b.x.echeance))[0]?.x ?? null;
    const blocs = blocages({ cibles, exigencesValidees: exigences, taches: vivantes, today });

    /* ── L'inventaire : parcours complet, filtré ─────────────── */
    let ensemble = vivantes;
    if (filtres.niveau === 'universite' && filtres.universite) {
      const c = cibles.find((x) => x.universite_id === filtres.universite);
      ensemble = tachesDeUniversite(vivantes.map((x) => ({ ...x, partagee: x.universite_id == null && x.origine === 'socle' && estPartagee(x), filieres: filieresDe(x, universites) })),
        filtres.universite, c?.universite?.filiere ?? 'us');
    } else if (filtres.niveau !== 'tout') {
      ensemble = vivantes.filter((x) => filieresDe(x, universites).includes(filtres.niveau));
    }
    const visibles = ensemble.filter((x) => {
      const st = statutEffectif(x, today);
      if (filtres.qui !== 'tous' && !x.owners.includes(filtres.qui)) return false;
      if (filtres.etat === 'a_faire' && !['a_faire', 'en_cours'].includes(st)) return false;
      if (filtres.etat === 'a_venir' && st !== 'a_venir') return false;
      if (filtres.etat === 'fait' && st !== 'fait') return false;
      return true;
    });
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

    const colonne = (cle, titreCle, items) => `
      <div class="col${cle === 'carmine' ? ' col--moi' : ''}">
        <h3>${esc(t(titreCle))} <span>${items.length}</span></h3>
        ${items.length ? items.slice(0, 8).map(({ x, u }) => ligne(x, u, today, nomU, cle)).join('')
          : `<p class="col-vide">${esc(t(cle === 'carmine' ? 'colVideMoi' : 'colVide'))}</p>`}
        ${items.length > 8 ? `<p class="col-vide">${esc(t('colPlus')(items.length - 8))}</p>` : ''}
      </div>`;

    app.innerHTML = `
      <div class="portal__inner">
        <p class="moteur-retour"><a href="/moteur?vue=dossiers">← ${esc(t('retourDossiers'))}</a></p>
        <div class="dossier-head">
          <div class="dossier-head__who">
            <span class="label">${esc(t('navDossiers'))}</span>
            <h1>${esc(student.first_name)} ${esc(student.last_name)}</h1>
            <span class="meta">${esc(cls.label)}${student.school ? ' · ' + esc(student.school) : ''} · ${student.tracks.map((tr) => esc(t2('filieres', tr))).join(', ')} · ${esc(t('ciblesResume')(cibles.length, cibles.filter((c) => c.retenue).length))}</span>
          </div>
          <div class="portal-actions"><button class="btn btn--secondary btn--sm" id="export">${esc(t('exporter'))}</button>
            <button class="btn btn--secondary btn--sm" id="archiver">${esc(t('archiver'))}</button></div>
          <div class="dossier-progress"><b>${avTotal.pct}%</b><span>${avTotal.done} / ${avTotal.total}${avTotal.late ? ` · ${esc(t('retards')(avTotal.late))}` : ''}</span>
            <div class="bar"><i style="width:${avTotal.pct}%"></i></div></div>
        </div>
        <p class="fiche-msg" id="msg-sync">${esc(msgSync)}</p>

        ${prochainLock ? `<div class="lock-bandeau" data-tache="${esc(prochainLock.id)}"><span class="lock-bandeau__dot"></span>
          <span><b>${esc(t('prochaineIrrattrapable'))}</b> · ${esc(prochainLock.titre)}${prochainLock.universite_id ? `, ${esc(nomU(prochainLock.universite_id))}` : ''}, ${esc(fmtIso(prochainLock.echeance))}</span>
          <span class="lock-bandeau__cd">${esc(delai(prochainLock.echeance, today))}</span></div>` : ''}

        <div class="cols">
          ${colonne('carmine', 'colMoi', colonnes.carmine)}
          ${colonne('eleve', 'colEleve', colonnes.eleve)}
          ${colonne('parents', 'colParents', colonnes.parents)}
          ${colonne('etablissement', 'colLycee', colonnes.etablissement)}
        </div>

        ${blocs.length ? `<div class="bloque"><b>${esc(t('bloqueTitre'))}</b><ul>${blocs.map((b) => `<li>${esc(b.texte)}</li>`).join('')}</ul></div>` : ''}

        <details class="inv">
          <summary>${esc(t('ciblesTitre'))} <small>${esc(t('ciblesResume')(cibles.length, cibles.filter((c) => c.retenue).length))}</small></summary>
          <section class="cibles-bloc">
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
        </details>

        <details class="inv">
          <summary>${esc(t('parcoursComplet'))} <small>${esc(t('taches')(courantes.length))}</small></summary>
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
        </details>

        ${passees.length ? `<details class="inv"><summary>${esc(t('passees')(passees.length))} <small>${esc(t('sansObjetCourt'))}</small></summary>
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

    const brancheSeg = (cls2, key) => app.querySelector(`.${cls2}`)?.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      filtres[key] = b.dataset[key];
      if (key === 'niveau' && filtres.niveau === 'universite' && !filtres.universite) filtres.universite = cibles[0]?.universite_id ?? '';
      ouvertInv = true;
      render();
    });
    brancheSeg('seg-niveau', 'niveau'); brancheSeg('seg-qui', 'qui'); brancheSeg('seg-etat', 'etat');
    app.querySelector('[data-el=niveau-u]')?.addEventListener('change', (e) => { filtres.universite = e.target.value; ouvertInv = true; render(); });
    if (ouvertInv) app.querySelectorAll('details.inv')[1]?.setAttribute('open', '');

    const ouvrir = (tid, section = null) => {
      const x = taches.find((y) => y.id === tid);
      if (x) ouvrirPanneau(x, { nomU, exigence: x.exigence_id ? parExigence.get(x.exigence_id) : null, apres: render, section });
    };
    app.querySelectorAll('[data-tache]').forEach((el) => el.addEventListener('click', (ev) => {
      const act = ev.target.closest('[data-act]');
      ouvrir(el.dataset.tache, act?.dataset.act === 'relancer' ? 'email' : null);
    }));

    if (tacheOuverte) { const tid = tacheOuverte; tacheOuverte = null; ouvrir(tid); }
  };

  let ouvertInv = false;
  await render();
}

const RANG = { retard: 0, urgent: 1, bientot: 2, ok: 3 };

/** Une ligne de colonne : filet, titre, université, pastille, attente, geste. */
function ligne(x, u, today, nomU, colonne) {
  const nom = x.universite_id ? nomU(x.universite_id) : '';
  const jours = attendDepuis(x, today);
  const pastille = u === 'retard' || u === 'urgent' ? 'r' : u === 'bientot' ? 'o' : 'g';
  const geste = colonne === 'carmine'
    ? `<button type="button" class="ligne__act" data-act="ouvrir">${esc(t('ouvrirDossier'))}</button>`
    : (jours >= 7 ? `<button type="button" class="ligne__act" data-act="relancer">${esc(t('relancer'))}</button>` : '');
  return `
    <div class="ligne ligne--${pastille}" data-tache="${esc(x.id)}" role="button" tabindex="0">
      <div class="ligne__t">${x.lock ? '<span class="ligne__lock" title="Irrattrapable">●</span> ' : ''}${esc(x.titre)}</div>
      <div class="ligne__u">${nom ? esc(nom) : esc(x.milestone_id ?? t2('types', x.type))}${x.mot_balle ? ` · ${esc(x.mot_balle)}` : ''}</div>
      <div class="ligne__b">
        <span class="pastille pastille--${pastille}">${esc(delai(x.echeance, today))}</span>
        ${colonne !== 'carmine' && jours > 0 ? `<span class="attente">${esc(t('attendDepuis'))} <b>${jours} j</b></span>` : ''}
        ${!x.attribuee ? `<span class="attente attente--new">${esc(t('aAttribuer'))}</span>` : ''}
        ${geste}
      </div>
    </div>`;
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
      <span class="ms-card__qui">${x.owners.map((o) => esc(t2('owners', o))).join(' · ')}</span>
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

function ouvrirPanneau(x, { nomU, exigence, apres, section = null }) {
  assurePanneau();
  const today = new Date();
  const st = statutEffectif(x, today);
  const nom = x.universite_id ? nomU(x.universite_id) : '';
  const m = x.milestone_id ? MILESTONES.find((mm) => mm.id === x.milestone_id) : null;
  const modeles = [...(m?.docs ?? []).filter((d) => d.trame), ...(DOCS_MOTEUR[x.milestone_id] ?? [])];
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
      <div class="blk">
        <div class="guide-head"><h4>${esc(t('purposeLabel'))}</h4>
          <button type="button" class="btn btn--secondary btn--sm" data-el="guide-btn">${esc(t('guideBtn'))}</button></div>
        ${m?.obj ? `<p class="quote">${esc(m.obj)}</p>` : ''}
        <div class="guide-zone" data-el="guide" hidden></div>
      </div>
      ${m?.warn ? `<div class="blk-warn"><strong>${esc(t('watchOut'))}</strong> ${esc(m.warn)}</div>` : ''}
      ${m ? `<div class="blk-duo"><div><h4>${esc(t('weProduce'))}</h4><p>${esc(m.carmine ?? '')}</p></div><div><h4>${esc(t('weExpect'))}</h4><p>${esc(m.family ?? t('nothingExpected'))}</p></div></div>` : ''}
      ${m?.methode ? `<div class="blk blk-methode"><h4>${esc(t('methodeTitre'))}</h4>${m.methode.split('\n').map((p) => `<p>${esc(p)}</p>`).join('')}</div>` : ''}
      <div class="blk blk-balle"><h4>${esc(t('balleTitre'))}</h4>
        <p class="journal-intro">${esc(t('balleIntro'))} ${x.owners.map((o) => esc(t2('owners', o))).join(' · ')}.</p>
        <div class="seg-track seg-balle">${['carmine', 'eleve', 'parents', 'etablissement'].map((b) =>
          `<button type="button" data-balle="${b}" aria-pressed="${(x.balle ?? x.owners[0]) === b}">${esc(t2('owners', b))}</button>`).join('')}</div>
        <div class="portal-field" style="margin-top:.6rem"><input data-el="mot" placeholder="${esc(t('motBalle'))}" value="${esc(x.mot_balle ?? '')}"></div>
        <button type="button" class="btn btn--secondary btn--sm" data-el="passer">${esc(t('passerBalle'))}</button>
        <span class="fiche-msg" data-el="msg-balle" style="display:inline;margin-left:.6rem"></span>
      </div>
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
      ${x.type === 'livrable' && x.milestone_id ? `<div class="blk" data-el="livrable" hidden><h4>${esc(t('livrableTitre'))}</h4><p class="journal-loading">${esc(t('chargement'))}</p></div>` : ''}
      <div class="blk" data-el="pieces"><h4>${esc(t('piecesTitre'))}</h4><p class="journal-loading">${esc(t('chargement'))}</p></div>
      ${modeles.length ? `<div class="blk"><h4>${esc(t('modelesTitre'))}</h4><ul class="doc-list">${modeles.map((d) =>
        `<li><span class="ms-tag">${esc(d.code)}</span><button type="button" class="doc-open" data-trame="${esc(d.trame)}">${esc(d.label)}</button><span class="size">${esc(d.note ?? '')}</span></li>`).join('')}</ul>
        <div class="trame-lue" data-el="trame-lue" hidden></div></div>` : ''}
    </div>`;
  panel.querySelector('[data-el=close]').addEventListener('click', fermer);
  let balleChoisie = x.balle ?? x.owners[0] ?? 'carmine';
  panel.querySelectorAll('[data-balle]').forEach((b) => b.addEventListener('click', () => {
    balleChoisie = b.dataset.balle;
    panel.querySelectorAll('[data-balle]').forEach((y) => y.setAttribute('aria-pressed', String(y === b)));
  }));
  panel.querySelector('[data-el=passer]').addEventListener('click', async (ev) => {
    ev.currentTarget.disabled = true;
    try { await passerBalle(x.id, balleChoisie, panel.querySelector('[data-el=mot]').value.trim()); fermer(); await apres(); }
    catch (err) { panel.querySelector('[data-el=msg-balle]').textContent = `${t('echec')} : ${err.message}`; ev.currentTarget.disabled = false; }
  });
  if (section === 'email') setTimeout(() => panel.querySelector('[data-el=email]')?.scrollIntoView({ block: 'start' }), 50);
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

  brancherGuide(panel.querySelector('[data-el=guide]'), panel.querySelector('[data-el=guide-btn]'), x, m, exigence, nom);
  if (emailable) brancherEmail(panel.querySelector('[data-el=email]'), x);
  if (x.type === 'essai') brancherLivrable(panel.querySelector('[data-el=brief]'), x, 'BRIEF-ESSAI', 'briefTitre', 'briefIntro', 'genererBrief');
  if (x.type === 'livrable' && x.milestone_id) brancherLivrable(panel.querySelector('[data-el=livrable]'), x, x.milestone_id, 'livrableTitre', 'livrableIntro', 'genererLivrable', true);
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

async function brancherLivrable(zone, x, trameCode, titreCle, introCle, boutonCle, verifierTrame = false) {
  if (verifierTrame) {
    try { const tr = await getTrame(trameCode); if (!tr) return; zone.hidden = false; } catch { return; }
  }
  const rendre = async () => {
    let livrables = [];
    try { livrables = (await listLivrablesTache(x.id)).filter((l) => l.trame_code === trameCode); }
    catch (err) { zone.innerHTML = `<h4>${esc(t(titreCle))}</h4><p class="journal-empty">${esc(err.message)}</p>`; return; }
    const l = livrables[0];
    zone.innerHTML = `<h4>${esc(t(titreCle))}</h4>
      ${l ? `
        <p class="journal-intro">${esc(t2('statutsLivrable', l.statut))}${l.publie_le ? ` · ${esc(fmtIso(l.publie_le.slice(0, 10)))}` : ''}</p>
        <div class="portal-field"><textarea data-el="texte" rows="16">${esc(l.contenu ?? '')}</textarea></div>
        <div class="exi-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-act="save">${esc(t('enregistrer'))}</button>
          ${l.statut !== 'publie' ? `<button type="button" class="btn btn--primary btn--sm" data-act="publier">${esc(t('publierFamille'))}</button>` : ''}
          <button type="button" class="exi-del" data-act="regen">${esc(t('regenerer'))}</button>
          <span class="fiche-msg" data-el="msg"></span>
        </div>`
      : `<p class="journal-intro">${esc(t(introCle))}</p>
         <button type="button" class="btn btn--primary btn--sm" data-act="regen">${esc(t(boutonCle))}</button>
         <span class="fiche-msg" data-el="msg"></span>`}`;
    const msg = zone.querySelector('[data-el=msg]');
    zone.querySelector('[data-act=save]')?.addEventListener('click', async () => {
      try { await updateLivrable(l.id, { contenu: zone.querySelector('[data-el=texte]').value, statut: l.statut === 'publie' ? 'publie' : 'relu' }); msg.textContent = t('enregistre'); }
      catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; }
    });
    zone.querySelector('[data-act=publier]')?.addEventListener('click', async () => {
      try { await updateLivrable(l.id, { contenu: zone.querySelector('[data-el=texte]').value, statut: 'publie' }); await rendre(); }
      catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; }
    });
    zone.querySelector('[data-act=regen]')?.addEventListener('click', async (ev) => {
      ev.currentTarget.disabled = true; msg.textContent = t('redactionEnCours');
      try { await genererLivrable({ tache_id: x.id, trame_code: trameCode }); await rendre(); }
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

/* ── Guide d'une étape, côté admin ──────────────────────────── */

function brancherGuide(zone, bouton, x, m, exigence, nom) {
  const cle = cleGuide(x);
  let audience = 'interne';
  bouton.addEventListener('click', async () => {
    zone.hidden = !zone.hidden;
    if (!zone.hidden) await rendre();
  });
  const rendre = async () => {
    zone.innerHTML = `<p class="journal-loading">${esc(t('chargement'))}</p>`;
    let guides = [];
    try { guides = await getGuides(cle, x.exigence_id ? x.type : null); } catch (err) { zone.innerHTML = `<p class="journal-empty">${esc(err.message)}</p>`; return; }
    const g = guides.find((y) => y.audience === audience);
    zone.innerHTML = `
      <div class="seg-track seg-guide">
        ${['interne', 'famille'].map((a) => `<button type="button" data-aud="${a}" aria-pressed="${a === audience}">${esc(t2('audiences', a))}${
          guides.find((y) => y.audience === a) ? (guides.find((y) => y.audience === a).statut === 'valide' ? ' ✓' : ' ·') : ''}</button>`).join('')}
      </div>
      ${g ? `
        <p class="journal-intro">${esc(g.statut === 'valide' ? t('guideValide') : t('guideBrouillon'))}${g.genere_le ? ` · ${esc(fmtIso(g.genere_le.slice(0, 10)))}` : ''}</p>
        <div class="portal-field"><textarea data-el="texte" rows="18">${esc(g.contenu)}</textarea></div>
        <div class="exi-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-act="save">${esc(t('enregistrer'))}</button>
          ${g.statut !== 'valide' ? `<button type="button" class="btn btn--primary btn--sm" data-act="valider">${esc(t('valider'))}</button>` : ''}
          <button type="button" class="exi-del" data-act="regen">${esc(t('regenerer'))}</button>
          <span class="fiche-msg" data-el="msg"></span>
        </div>`
      : `<p class="journal-intro">${esc(t('guideIntro'))}</p>
         <button type="button" class="btn btn--primary btn--sm" data-act="regen">${esc(t('genererGuide'))}</button>
         <span class="fiche-msg" data-el="msg"></span>`}`;
    const msg = zone.querySelector('[data-el=msg]');
    zone.querySelectorAll('[data-aud]').forEach((b) => b.addEventListener('click', () => { audience = b.dataset.aud; rendre(); }));
    zone.querySelector('[data-act=save]')?.addEventListener('click', async () => {
      try { await updateGuide(g.id, { contenu: zone.querySelector('[data-el=texte]').value }); msg.textContent = t('enregistre'); }
      catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; }
    });
    zone.querySelector('[data-act=valider]')?.addEventListener('click', async () => {
      try { await updateGuide(g.id, { contenu: zone.querySelector('[data-el=texte]').value, statut: 'valide' }); await rendre(); }
      catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; }
    });
    zone.querySelector('[data-act=regen]')?.addEventListener('click', async (ev) => {
      ev.currentTarget.disabled = true; msg.textContent = t('redactionEnCours');
      try {
        await genererGuide({ cle, audience, titre: nom ? `${x.titre} · ${nom}` : x.titre, matiere: matiereGuide(x, m, exigence, nom) });
        await rendre();
      } catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; ev.currentTarget.disabled = false; }
    });
  };
}
