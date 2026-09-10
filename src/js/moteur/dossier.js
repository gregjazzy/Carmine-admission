/**
 * Espace famille du moteur — page /dossier.
 *
 * Ce que voit une famille : ses tâches à partir de leur apparition, par
 * classe, par pays, par université ; l'état par université ; les pièces à
 * déposer ; les messages, briefs et livrables publiés. Jamais une tâche « à
 * venir », jamais une note privée, jamais une trame.
 *
 * La connexion se fait sur l'espace client existant : cette page ne fait que
 * lire la session. Non liée depuis le site jusqu'à la bascule.
 */
import '../../css/moteur.css';
import { supabase, getProfile, signOut, listUniversites, documentUrl, uploadDocument, getGuides, cleGuide } from './donnees.js';
import { initLang, t, t2, esc, fmtIso, delai } from './lang.js';
import { urgenceTache, classeDe, avancement, tachesDeUniversite } from './generateur.js';
import { CANDIDATURE, tracksDe } from './socle.js';
import { MILESTONES } from '../portail/milestones.js';
import { CLASSES } from '../portail/calendrier.js';

const app = document.getElementById('portal-app');

async function mesDossiers() {
  const { data, error } = await supabase.from('carmine_students').select('*').eq('archived', false).order('last_name');
  if (error) throw error;
  return data ?? [];
}
async function mesTaches(studentId) {
  const { data, error } = await supabase.from('carmine_taches_famille').select('*').eq('student_id', studentId).order('echeance');
  if (error) throw error;
  return data ?? [];
}
async function mesCibles(studentId) {
  const { data, error } = await supabase
    .from('carmine_cibles_eleve')
    .select('universite_id, retenue, tour, decision, carmine_universites(id, pays, etablissement, cursus, filiere)')
    .eq('student_id', studentId).order('ordre');
  if (error) throw error;
  return (data ?? []).filter((c) => c.carmine_universites).map((c) => ({ ...c, universite: c.carmine_universites }));
}
async function mesDocuments(studentId) {
  const { data, error } = await supabase.from('carmine_documents').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
async function mesLivrables(studentId) {
  const { data, error } = await supabase.from('carmine_livrables').select('id, tache_id, trame_code, titre, contenu, statut, publie_le').eq('student_id', studentId).eq('statut', 'publie');
  if (error) throw error;
  return data ?? [];
}

const estPartagee = (x) => x.milestone_id ? CANDIDATURE.has(x.milestone_id) : false;
const filieresDe = (x, universites) => {
  if (x.universite_id) { const u = universites.find((v) => v.id === x.universite_id); return u?.filiere ? [u.filiere] : []; }
  const m = MILESTONES.find((mm) => mm.id === x.milestone_id);
  return m ? tracksDe(m) : [];
};

async function renderDossier(profile, students) {
  let current = students[0];
  const filtres = { niveau: 'tout', universite: '', qui: 'tous' };

  const render = async () => {
    const [taches, cibles, universites, docs, livrables] = await Promise.all([
      mesTaches(current.id), mesCibles(current.id), listUniversites(), mesDocuments(current.id), mesLivrables(current.id),
    ]);
    const today = new Date();
    const nomU = (uid) => { const u = universites.find((x) => x.id === uid); return u ? (u.cursus ? `${u.etablissement} · ${u.cursus}` : u.etablissement) : ''; };
    const enrichies = taches.map((x) => ({ ...x, partagee: x.universite_id == null && estPartagee(x), filieres: filieresDe(x, universites) }));
    const cls = classeDe(today.toISOString().slice(0, 10), current.terminale_year);

    let ensemble = enrichies;
    if (filtres.niveau === 'universite' && filtres.universite) {
      const c = cibles.find((x) => x.universite_id === filtres.universite);
      ensemble = tachesDeUniversite(enrichies, filtres.universite, c?.universite?.filiere ?? 'us');
    } else if (filtres.niveau !== 'tout') ensemble = enrichies.filter((x) => x.filieres.includes(filtres.niveau));
    const av = avancement(ensemble, today);
    const visibles = ensemble.filter((x) => filtres.qui === 'tous' || x.owners.includes(filtres.qui));

    const focus = enrichies
      .filter((x) => ['a_faire', 'en_cours'].includes(x.statut) && ['parents', 'eleve'].includes(x.balle ?? x.owners[0]))
      .sort((a, b) => a.echeance.localeCompare(b.echeance)).slice(0, 4);

    const yEntree = CLASSES.find((c) => c.key === current.entry_class)?.y ?? -6;
    const passees = visibles.filter((x) => x.statut === 'sans_objet' && classeDe(x.apparition, current.terminale_year).y < yEntree);
    const courantes = visibles.filter((x) => !passees.includes(x));
    const groupes = new Map();
    for (const x of courantes) {
      const c = classeDe(x.apparition, current.terminale_year);
      if (!groupes.has(c.key)) groupes.set(c.key, { c, sy: current.terminale_year + c.y, items: [] });
      groupes.get(c.key).items.push(x);
    }
    const ordre = [...groupes.values()].sort((a, b) => a.sy - b.sy);
    const seg = (cls2, items, actif, data) => `<div class="seg-track ${cls2}">${items.map(([val, label]) =>
      `<button type="button" data-${data}="${esc(val)}" aria-pressed="${String(val) === String(actif)}">${esc(label)}</button>`).join('')}</div>`;

    app.innerHTML = `
      <div class="portal__inner">
        <div class="compte-bar"><span class="compte-bar__who">${esc(t('signedInAs'))} <b>${esc(profile.email)}</b></span>
          <span class="compte-bar__actions"><button class="btn btn--secondary btn--sm" id="out">${esc(t('deconnexion'))}</button></span></div>
        ${students.length > 1 ? `<div class="portal-field" style="max-width:320px"><select id="pick">${students.map((s) =>
          `<option value="${s.id}"${s.id === current.id ? ' selected' : ''}>${esc(s.first_name)} ${esc(s.last_name)}</option>`).join('')}</select></div>` : ''}
        <div class="dossier-head">
          <div class="dossier-head__who"><span class="label">${esc(t('dossierLabel'))}</span>
            <h1>${esc(current.first_name)} ${esc(current.last_name)}</h1>
            <span class="meta">${esc(cls.label)}${current.school ? ' · ' + esc(current.school) : ''} · ${current.tracks.map((tr) => esc(t2('filieres', tr))).join(', ')}</span></div>
          <div class="dossier-head__next"><span class="label">${esc(t('prochaine'))}</span>
            ${focus.length ? `<strong>${esc(focus[0].titre)}</strong><span>${esc(fmtIso(focus[0].echeance))} · ${esc(delai(focus[0].echeance, today))}</span>`
              : `<strong>${esc(t('rienAFaire'))}</strong>`}</div>
          <div class="dossier-progress"><b>${av.pct}%</b><span>${av.done} / ${av.total}</span><div class="bar"><i style="width:${av.pct}%"></i></div></div>
        </div>

        ${focus.length ? `<div class="focus-block"><h2>${esc(t('focusTitre'))}</h2><ul class="focus-list">${focus.map((x) => `
          <li><span class="when"><span class="pastille pastille--${urgenceTache(x, today) === 'retard' || urgenceTache(x, today) === 'urgent' ? 'r' : urgenceTache(x, today) === 'bientot' ? 'o' : 'g'}">${esc(delai(x.echeance, today))}</span></span><span class="what"><button type="button" data-tache="${esc(x.id)}" class="focus-link">${esc(x.titre)}</button>
          <small>${esc(t2('balleFamille', x.balle ?? x.owners[0]))}${x.universite_id ? ` · ${esc(nomU(x.universite_id))}` : ''}${x.mot_balle ? ` · ${esc(x.mot_balle)}` : ''}</small></span></li>`).join('')}</ul></div>` : ''}

        ${cibles.length ? `<h2 class="section-title">${esc(t('ciblesTitre'))}</h2><ul class="cible-list">${cibles.map((c) => {
          const u = c.universite; const mine = tachesDeUniversite(enrichies, c.universite_id, u.filiere ?? 'us'); const a = avancement(mine, today);
          return `<li><div class="cible-nom">${esc(u.etablissement)}${u.cursus ? ` <span class="cible-cursus">${esc(u.cursus)}</span>` : ''}</div>
            <div class="cible-ref">${esc(c.retenue ? t('retenue') : t('envisagee'))}${c.decision ? ` · ${esc(t2('decisions', c.decision))}` : ''} · ${a.done}/${a.total}${a.late ? ` · ${esc(t('retards')(a.late))}` : ''}</div></li>`; }).join('')}</ul>` : ''}

        <h2 class="section-title">${esc(t('parcours'))}</h2>
        <div class="filters">
          <div class="track-filter"><span class="track-filter__label">${esc(t('niveau'))}</span>
            ${seg('seg-niveau', [['tout', t('niveauTout')], ...current.tracks.map((tr) => [tr, t2('filieres', tr)]), ...(cibles.length ? [['universite', t('niveauUniversite')]] : [])], filtres.niveau, 'niveau')}
            <select data-el="niveau-u"${filtres.niveau === 'universite' ? '' : ' hidden'}>${cibles.map((c) => `<option value="${esc(c.universite_id)}"${filtres.universite === c.universite_id ? ' selected' : ''}>${esc(nomU(c.universite_id))}</option>`).join('')}</select></div>
          <div class="track-filter"><span class="track-filter__label">${esc(t('qui'))}</span>
            ${seg('seg-qui', [['tous', t('quiTous')], ['parents', t('quiVous')], ['eleve', t('quiEnfant')], ['carmine', t('quiCarmine')]], filtres.qui, 'qui')}</div>
        </div>
        ${ordre.length ? ordre.map((g) => `<section class="year-group"><div class="year-head"><h2>${esc(g.c.label)} · ${g.sy}-${g.sy + 1}</h2>
          ${g.c.key === cls.key ? `<span class="badge-now">${esc(t('anneeEnCours'))}</span>` : ''}<span class="count">${esc(t('taches')(g.items.length))}</span></div>
          <div class="ms-grid">${g.items.map((x) => carte(x, today, nomU)).join('')}</div></section>`).join('') : `<div class="empty-state">${esc(t('aucuneTache'))}</div>`}
        ${passees.length ? `<details class="moteur-details"><summary>${esc(t('passees')(passees.length))}</summary>
          <p class="moteur-intro">${esc(t('passeesIntro'))}</p>
          <div class="ms-grid">${passees.map((x) => carte(x, today, nomU)).join('')}</div></details>` : ''}
      </div>`;

    document.getElementById('out').addEventListener('click', signOut);
    document.getElementById('pick')?.addEventListener('change', async (e) => { current = students.find((s) => s.id === e.target.value); await render(); });
    const brancheSeg = (cls2, key) => app.querySelector(`.${cls2}`)?.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; filtres[key] = b.dataset[key];
      if (key === 'niveau' && filtres.niveau === 'universite' && !filtres.universite) filtres.universite = cibles[0]?.universite_id ?? '';
      render();
    });
    brancheSeg('seg-niveau', 'niveau'); brancheSeg('seg-qui', 'qui');
    app.querySelector('[data-el=niveau-u]')?.addEventListener('change', (e) => { filtres.universite = e.target.value; render(); });
    app.querySelectorAll('[data-tache]').forEach((el) => el.addEventListener('click', () => {
      const x = enrichies.find((y) => y.id === el.dataset.tache);
      if (x) ouvrir(x, { nomU, docs: docs.filter((d) => d.tache_id === x.id), livrables: livrables.filter((l) => l.tache_id === x.id), studentId: current.id, apres: render });
    }));
  };
  await render();
}

function carte(x, today, nomU) {
  const u = urgenceTache(x, today);
  const classes = ['ms-card', x.lock ? 'is-lock' : '', `u-${u}`, x.statut === 'fait' ? 'is-done' : ''].filter(Boolean).join(' ');
  const nom = x.universite_id ? nomU(x.universite_id) : '';
  const m = x.milestone_id ? MILESTONES.find((mm) => mm.id === x.milestone_id) : null;
  return `<button type="button" class="${classes}" data-tache="${esc(x.id)}">
    <span class="ms-card__top"><span class="ms-card__id">${esc(x.milestone_id ?? t2('types', x.type))}</span>
      ${m?.repere ? `<span class="ms-tag ms-tag--repere">${esc(t('repereTag'))}</span>` : ''}${x.lock ? `<span class="ms-tag ms-tag--lock">● ${esc(t('irrattrapable'))}</span>` : ''}</span>
    <h3>${esc(x.titre)}</h3>${nom ? `<span class="ms-card__pour">${esc(nom)}</span>` : ''}
    <span class="ms-card__date">${esc(fmtIso(x.echeance))}${['fait', 'sans_objet'].includes(x.statut) ? '' : ` · ${esc(delai(x.echeance, today))}`}</span>
    <span class="ms-card__qui">${x.owners.map((o) => esc(t2('owners', o))).join(' · ')}</span>
    <span class="ms-status st-${esc(x.statut)}"><span class="dot"></span>${esc(t2('statutsTache', x.statut))}</span></button>`;
}

let panel = null; let scrim = null;
function fermer() { panel?.classList.remove('is-open'); scrim?.classList.remove('is-open'); }
function ouvrir(x, { nomU, docs, livrables, studentId, apres }) {
  if (!panel) {
    scrim = document.createElement('div'); scrim.className = 'ms-scrim';
    panel = document.createElement('aside'); panel.className = 'ms-panel'; panel.setAttribute('role', 'dialog'); panel.tabIndex = -1;
    document.body.append(scrim, panel); scrim.addEventListener('click', fermer);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermer(); });
  }
  const m = x.milestone_id ? MILESTONES.find((mm) => mm.id === x.milestone_id) : null;
  const nom = x.universite_id ? nomU(x.universite_id) : '';
  const peutDeposer = x.owners.some((o) => o === 'parents' || o === 'eleve');
  panel.innerHTML = `
    <div class="ms-panel__head"><div class="row"><div style="min-width:0">
      <div class="ms-panel__eyebrow">${esc(x.milestone_id ?? t2('types', x.type))}${nom ? ` · ${esc(nom)}` : ''}</div><h2>${esc(x.titre)}</h2></div>
      <button class="ms-close" data-el="close" aria-label="${esc(t('fermer'))}">&times;</button></div>
      <div class="ms-panel__meta"><span class="ms-tag${x.lock ? ' ms-tag--lock' : ''}">${x.lock ? '● ' : ''}${esc(t2('types', x.type))}</span>
        <span class="ms-tag">${esc(t('echeanceLabel'))} ${esc(fmtIso(x.echeance))}</span></div></div>
    <div class="ms-panel__body">
      <div class="blk">
        <div class="guide-head"><h4>${esc(t('purposeLabel'))}</h4>
          <button type="button" class="btn btn--secondary btn--sm" data-el="guide-btn" hidden>${esc(t('guideBtn'))}</button></div>
        ${m?.obj ? `<p class="quote">${esc(m.obj)}</p>` : ''}
        <div class="guide-zone" data-el="guide" hidden></div>
      </div>
      ${m?.repere ? `<div class="blk-repere">${esc(t('repereBody'))}</div>` : ''}
      ${x.consigne ? `<div class="blk"><h4>${esc(t2('champs', 'consigne'))}</h4><p class="quote">${esc(x.consigne)}</p></div>` : ''}
      ${m?.warn ? `<div class="blk-warn"><strong>${esc(t('watchOut'))}</strong> ${esc(m.warn)}</div>` : ''}
      ${m ? `<div class="blk-duo"><div><h4>${esc(t('weProduce'))}</h4><p>${esc(m.carmine ?? '')}</p></div><div><h4>${esc(t('weExpect'))}</h4><p>${esc(m.family ?? t('nothingExpected'))}</p></div></div>` : ''}
      <div class="blk"><h4>${esc(t('qui'))}</h4><p>${x.owners.map((o) => esc(t2('owners', o))).join(' · ')}</p></div>
      ${x.public_note ? `<div class="blk"><h4>${esc(t('whereWeAre'))}</h4><p>${esc(x.public_note)}</p></div>` : ''}
      ${livrables.length ? livrables.map((l) => `<div class="blk"><h4>${esc(l.titre)}</h4><pre class="livrable-texte">${esc(l.contenu)}</pre></div>`).join('') : ''}
      <div class="blk"><h4>${esc(t('piecesTitre'))}</h4><ul class="doc-list" data-el="docs">${docs.map((d) => `<li data-path="${esc(d.storage_path)}"><a href="#" data-doc>${esc(d.filename)}</a><span class="size">${esc(fmtIso(d.created_at.slice(0, 10)))}</span></li>`).join('') || `<li style="border:0;background:none;padding-left:0;color:var(--text-secondary)">${esc(t('aucunePiece'))}</li>`}</ul>
        ${peutDeposer ? `<label class="dropzone"><strong>${esc(t('deposerPiece'))}</strong><span>${esc(t('deposerHint'))}</span><input type="file" data-el="file"></label>` : ''}</div>
    </div>`;
  panel.querySelector('[data-el=close]').addEventListener('click', fermer);
  guideFamille(panel.querySelector('[data-el=guide]'), panel.querySelector('[data-el=guide-btn]'), x);
  panel.querySelectorAll('[data-doc]').forEach((a) => a.addEventListener('click', async (e) => {
    e.preventDefault(); try { window.open(await documentUrl(a.closest('li').dataset.path), '_blank'); } catch { /* lien indisponible */ }
  }));
  panel.querySelector('[data-el=file]')?.addEventListener('change', async (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    panel.querySelector('.dropzone strong').textContent = t('envoiEnCours');
    try { await uploadDocument(studentId, x.id, f); fermer(); await apres(); }
    catch (err) { panel.querySelector('.dropzone strong').textContent = `${t('echec')} : ${err.message}`; }
  });
  panel.classList.add('is-open'); scrim.classList.add('is-open'); panel.focus();
}

(async function start() {
  try {
    initLang();
    const profile = await getProfile();
    if (!profile) { location.href = '/espace-client'; return; }
    const students = await mesDossiers();
    if (!students.length) {
      app.innerHTML = `<div class="portal__inner"><div class="empty-state">${esc(t('aucunDossierFamille'))}</div></div>`;
      return;
    }
    await renderDossier(profile, students);
  } catch (err) {
    app.innerHTML = `<div class="portal__inner portal__inner--narrow"><div class="portal-msg portal-msg--err is-visible">${esc(err.message)}</div></div>`;
  }
})();

/** Le guide famille d'une étape, s'il est validé. Le bouton n'apparaît que dans ce cas. */
async function guideFamille(zone, bouton, x) {
  let guides = [];
  try { guides = await getGuides(cleGuide(x), x.exigence_id ? x.type : null); } catch { return; }
  const g = guides.find((y) => y.audience === 'famille' && y.statut === 'valide');
  if (!g) return;
  bouton.hidden = false;
  zone.innerHTML = `<div class="guide-texte">${rendreMarkdown(g.contenu)}</div>`;
  bouton.addEventListener('click', () => { zone.hidden = !zone.hidden; });
}

/** Markdown minimal : titres, listes, paragraphes. Sans HTML entrant. */
function rendreMarkdown(md) {
  const lignes = esc(md).split('\n');
  let html = ''; let liste = null;
  const fermerListe = () => { if (liste) { html += `</${liste}>`; liste = null; } };
  for (const l of lignes) {
    if (/^## /.test(l)) { fermerListe(); html += `<h4>${l.slice(3)}</h4>`; }
    else if (/^\d+\. /.test(l)) { if (liste !== 'ol') { fermerListe(); html += '<ol>'; liste = 'ol'; } html += `<li>${l.replace(/^\d+\. /, '')}</li>`; }
    else if (/^[-*] /.test(l)) { if (liste !== 'ul') { fermerListe(); html += '<ul>'; liste = 'ul'; } html += `<li>${l.slice(2)}</li>`; }
    else if (l.trim() === '') { fermerListe(); }
    else { fermerListe(); html += `<p>${l}</p>`; }
  }
  fermerListe();
  return html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
