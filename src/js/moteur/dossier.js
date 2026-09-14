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
import { initLang, t, t2, esc, fmtIso, delai, titreTache, jalon } from './lang.js';
import { urgenceTache, classeDe, avancement, tachesDeUniversite } from './generateur.js';
import { CANDIDATURE, tracksDe } from './socle.js';
import { MILESTONES } from '../portail/milestones.js';
import { CLASSES } from '../portail/calendrier.js';
import { brancherJournal, brancherSouhaits, t2Ancien } from './journal.js';

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
    .select('universite_id, retenue, tour, decision, verdict, carmine_universites(id, pays, etablissement, cursus, filiere)')
    .eq('student_id', studentId).order('ordre');
  if (error) throw error;
  return (data ?? []).filter((c) => c.carmine_universites).map((c) => ({ ...c, universite: c.carmine_universites }));
}
async function mesDocuments(studentId) {
  const { data, error } = await supabase.from('carmine_documents').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
async function mesNotesSeance(studentId) {
  const { data, error } = await supabase.from('carmine_session_notes').select('id, session_date, title, body')
    .eq('student_id', studentId).eq('visible_to_parents', true).order('session_date', { ascending: false });
  if (error) return [];
  return data ?? [];
}
async function mesLivrables(studentId) {
  const { data, error } = await supabase.from('carmine_livrables').select('id, tache_id, trame_code, titre, contenu, statut, publie_le').eq('student_id', studentId).eq('statut', 'publie');
  if (error) throw error;
  return data ?? [];
}

/** Le rôle du compte connecté sur ce dossier : parent par défaut, élève si l'accès le dit. */
async function monRole(studentId, email) {
  const { data } = await supabase.from('carmine_acces_invites').select('role').eq('student_id', studentId).ilike('email', email).maybeSingle();
  return data?.role === 'eleve' ? 'eleve' : 'parent';
}

/** Ce qui ne regarde pas l'élève : l'argent. */
const AIDE_JALONS = new Set(['C-07', 'D-23', 'D-28', 'D-29']);
const estAide = (x) => x.type === 'aide' || AIDE_JALONS.has(x.milestone_id ?? '');
const ESSAI_JALONS = new Set(['C-15', 'C-16', 'C-17']);
const estEssai = (x) => x.type === 'essai' || ESSAI_JALONS.has(x.milestone_id ?? '');

const estPartagee = (x) => x.milestone_id ? CANDIDATURE.has(x.milestone_id) : false;
const filieresDe = (x, universites) => {
  if (x.universite_id) { const u = universites.find((v) => v.id === x.universite_id); return u?.filiere ? [u.filiere] : []; }
  const m = jalon(MILESTONES.find((mm) => mm.id === x.milestone_id));
  return m ? tracksDe(m) : [];
};

async function renderDossier(profile, students) {
  let current = students[0];
  const filtres = { niveau: 'tout', universite: '', qui: 'tous', parcoursOuvert: false };

  const render = async () => {
    const [taches, cibles, universites, docs, livrables, notesSeance] = await Promise.all([
      mesTaches(current.id), mesCibles(current.id), listUniversites(), mesDocuments(current.id), mesLivrables(current.id), mesNotesSeance(current.id),
    ]);
    const today = new Date();
    const nomU = (uid) => { const u = universites.find((x) => x.id === uid); return u ? (u.cursus ? `${u.etablissement} · ${u.cursus}` : u.etablissement) : ''; };
    const enrichies = taches.map((x) => ({ ...x, partagee: x.universite_id == null && estPartagee(x), filieres: filieresDe(x, universites) }));
    const cls = classeDe(today.toISOString().slice(0, 10), current.terminale_year);

    const role = await monRole(current.id, profile.email);
    let ensemble = role === 'eleve' ? enrichies.filter((x) => !estAide(x)) : enrichies;
    if (filtres.niveau === 'universite' && filtres.universite) {
      const c = cibles.find((x) => x.universite_id === filtres.universite);
      ensemble = tachesDeUniversite(enrichies, filtres.universite, c?.universite?.filiere ?? 'us');
    } else if (filtres.niveau !== 'tout') ensemble = enrichies.filter((x) => x.filieres.includes(filtres.niveau));
    const av = avancement(ensemble, today);
    const visibles = ensemble.filter((x) => filtres.qui === 'tous' || x.owners.includes(filtres.qui));
    // (le rôle filtre plus bas ce qui ne regarde pas l'élève)

    const pourMoi = role === 'eleve' ? enrichies.filter((x) => !estAide(x)) : enrichies;
    const vivantes = pourMoi.filter((x) => ['a_faire', 'en_cours'].includes(x.statut)).sort((a, b) => a.echeance.localeCompare(b.echeance));
    const balleDe = (x) => x.balle ?? x.owners[0] ?? 'carmine';
    const verrou = vivantes.find((x) => x.lock);
    const ORDRE_SECTIONS = role === 'eleve' ? ['eleve', 'parents', 'carmine', 'etablissement'] : ['parents', 'eleve', 'carmine', 'etablissement'];
    const sections = ORDRE_SECTIONS.map((b) => ({ b, items: vivantes.filter((x) => balleDe(x) === b) })).filter((sct) => sct.b !== 'etablissement' || sct.items.length);
    const essais = role === 'eleve' ? pourMoi.filter((x) => estEssai(x) && x.statut !== 'sans_objet').sort((a, b) => a.echeance.localeCompare(b.echeance)) : [];
    const point = livrables.filter((l) => !l.tache_id).sort((a, b) => (b.publie_le ?? '').localeCompare(a.publie_le ?? ''))[0];
    const pastille = (x) => { const u = urgenceTache(x, today); return u === 'retard' || u === 'urgent' ? 'r' : u === 'bientot' ? 'o' : 'g'; };
    const ligne = (x) => `<li><span class="when"><span class="pastille pastille--${pastille(x)}">${esc(delai(x.echeance, today))}</span></span>
      <span class="what"><button type="button" data-tache="${esc(x.id)}" class="focus-link">${esc(titreTache(x))}</button>
      <small>${x.universite_id ? esc(nomU(x.universite_id)) : esc(t2('types', x.type))}${x.statut === 'en_cours' ? ` · ${esc(t2('statutsTache', 'en_cours'))}` : ''}${x.mot_balle ? ` · ${esc(x.mot_balle)}` : ''}</small></span></li>`;

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
        <div class="compte-bar"><span class="compte-bar__who">${esc(t('signedInAs'))} <b>${esc(profile.email)}</b> · ${esc(t2('famRoles', role))}</span>
          <span class="compte-bar__actions"><button type="button" class="btn btn--secondary btn--sm" id="accueil-ouvrir">${esc(t('accueilLien'))}</button><a class="btn btn--secondary btn--sm" href="/espace-client?ancien=1">${esc(t('famCompte'))}</a><button class="btn btn--secondary btn--sm" id="out">${esc(t('deconnexion'))}</button></span></div>
        ${students.length > 1 ? `<div class="portal-field" style="max-width:320px"><select id="pick">${students.map((s) =>
          `<option value="${s.id}"${s.id === current.id ? ' selected' : ''}>${esc(s.first_name)} ${esc(s.last_name)}</option>`).join('')}</select></div>` : ''}
        <div class="dossier-head">
          <div class="dossier-head__who"><span class="label">${esc(t('dossierLabel'))}</span>
            <h1>${esc(current.first_name)} ${esc(current.last_name)}</h1>
            <span class="meta">${esc(cls.label)}${current.school ? ' · ' + esc(current.school) : ''} · ${current.tracks.map((tr) => esc(t2('filieres', tr))).join(', ')}</span></div>
          <div class="dossier-progress"><b>${av.pct}%</b><span>${av.done} / ${av.total}</span><div class="bar"><i style="width:${av.pct}%"></i></div></div>
        </div>

        ${verrou ? `<div class="lock-bandeau" data-tache="${esc(verrou.id)}"><span class="lock-bandeau__dot"></span><span><b>${esc(t('prochaineIrrattrapable'))}</b> · ${esc(titreTache(verrou))}${verrou.universite_id ? `, ${esc(nomU(verrou.universite_id))}` : ''}, ${esc(fmtIso(verrou.echeance))}</span><span class="lock-bandeau__cd">${esc(delai(verrou.echeance, today))}</span></div>` : ''}

        ${point ? `<section class="fam-point"><h2 class="section-title">${esc(t('famPoint'))}</h2>
          <p class="fam-point__meta">${esc(point.titre)}${point.publie_le ? ` · ${esc(fmtIso(point.publie_le.slice(0, 10)))}` : ''}</p>
          <details class="fam-point__corps" open><summary>${esc(t('famLire'))}</summary><div class="guide-texte">${rendreMarkdown(point.contenu)}</div></details></section>` : ''}

        ${essais.length ? `<section class="focus-block fam-essais"><h2>${esc(t('famEssais'))}</h2><ul class="focus-list">${essais.map((x) => `<li><span class="when"><span class="pastille pastille--${x.statut === 'fait' ? 'g' : pastille(x)}">${x.statut === 'fait' ? esc(t2('statutsTache', 'fait')) : esc(delai(x.echeance, today))}</span></span>
          <span class="what"><button type="button" data-tache="${esc(x.id)}" class="focus-link">${esc(titreTache(x))}</button><small>${x.universite_id ? esc(nomU(x.universite_id)) : ''}${x.statut === 'en_cours' ? ` · ${esc(t2('statutsTache', 'en_cours'))}` : ''}</small></span></li>`).join('')}</ul></section>` : ''}

        ${sections.map((sct) => `<section class="focus-block fam-section fam-section--${sct.b}"><h2>${esc(t2('famSections', role)[sct.b])}${sct.items.length ? ` <span class="count">${sct.items.length}</span>` : ''}</h2>
          ${sct.items.length ? `<ul class="focus-list">${sct.items.slice(0, 8).map(ligne).join('')}</ul>${sct.items.length > 8 ? `<p class="fam-plus">${esc(t('colPlus')(sct.items.length - 8))}</p>` : ''}` : `<p class="fam-vide">${esc(t2('famVide', role)[sct.b])}</p>`}</section>`).join('')}

        <section class="blk blk-souhaits fam-souhaits" data-el="souhaits"></section>

        ${cibles.length ? `<h2 class="section-title">${esc(t('famEtat'))}</h2><ul class="cible-list">${cibles.map((c) => {
          const u = c.universite; const mine = tachesDeUniversite(pourMoi, c.universite_id, u.filiere ?? 'us'); const a = avancement(mine, today);
          const prochaine = mine.filter((x) => ['a_faire', 'en_cours'].includes(x.statut)).sort((x, y) => x.echeance.localeCompare(y.echeance))[0];
          return `<li><button type="button" class="cible-nom cible-nom--lien" data-universite="${esc(c.universite_id)}">${esc(u.etablissement)}${u.cursus ? ` <span class="cible-cursus">${esc(u.cursus)}</span>` : ''}</button>
            <div class="cible-ref">${esc(c.retenue ? t('retenue') : t('envisagee'))}${c.verdict ? ` · ${esc(t2Ancien('bands', c.verdict))}` : ''}${c.decision ? ` · ${esc(t2('decisions', c.decision))}` : ''} · ${a.done}/${a.total}${a.late ? ` · ${esc(t('retards')(a.late))}` : ''}</div>
            <div class="cible-next">${prochaine ? `${esc(t('famProchaineU'))} : <button type="button" class="focus-link" data-tache="${esc(prochaine.id)}">${esc(titreTache(prochaine))}</button>, ${esc(fmtIso(prochaine.echeance))}` : esc(t('famAucuneU'))}</div></li>`; }).join('')}</ul>` : ''}

        ${notesSeance.length ? `<details class="moteur-details fam-notes"><summary>${esc(t('notesSeanceTitre'))} · ${notesSeance.length}</summary>
          ${notesSeance.map((n) => `<article class="note-item"><time>${esc(fmtIso(n.session_date))}</time><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p></article>`).join('')}</details>` : ''}

        <details class="moteur-details fam-parcours"><summary>${esc(t('famParcours'))} · ${esc(t('taches')(courantes.length))}</summary>
        <div class="filters">
          <div class="track-filter"><span class="track-filter__label">${esc(t('niveau'))}</span>
            ${seg('seg-niveau', [['tout', t('niveauTout')], ...current.tracks.map((tr) => [tr, t2('filieres', tr)]), ...(cibles.length ? [['universite', t('niveauUniversite')]] : [])], filtres.niveau, 'niveau')}
            <select data-el="niveau-u"${filtres.niveau === 'universite' ? '' : ' hidden'}>${cibles.map((c) => `<option value="${esc(c.universite_id)}"${filtres.universite === c.universite_id ? ' selected' : ''}>${esc(nomU(c.universite_id))}</option>`).join('')}</select></div>
          <div class="track-filter"><span class="track-filter__label">${esc(t('qui'))}</span>
            ${seg('seg-qui', [['tous', t('quiTous')], ['parents', role === 'eleve' ? t('famTesParents') : t('quiVous')], ['eleve', role === 'eleve' ? t('famToi') : t('quiEnfant')], ['carmine', t('quiCarmine')]], filtres.qui, 'qui')}</div>
        </div>
        ${ordre.length ? ordre.map((g) => `<section class="year-group"><div class="year-head"><h2>${esc(g.c.label)} · ${g.sy}-${g.sy + 1}</h2>
          ${g.c.key === cls.key ? `<span class="badge-now">${esc(t('anneeEnCours'))}</span>` : ''}<span class="count">${esc(t('taches')(g.items.length))}</span></div>
          <div class="ms-grid">${g.items.map((x) => carte(x, today, nomU)).join('')}</div></section>`).join('') : `<div class="empty-state">${esc(t('aucuneTache'))}</div>`}
        ${passees.length ? `<details class="moteur-details"><summary>${esc(t('passees')(passees.length))}</summary>
          <p class="moteur-intro">${esc(t('passeesIntro'))}</p>
          <div class="ms-grid">${passees.map((x) => carte(x, today, nomU)).join('')}</div></details>` : ''}
        </details>
      </div>`;

    document.getElementById('out').addEventListener('click', signOut);
    document.getElementById('accueil-ouvrir').addEventListener('click', () => ouvrirAccueil(role, current));
    const cleAccueil = `carmine-accueil-vu:${current.id}`;
    let dejaVu = false; try { dejaVu = !!localStorage.getItem(cleAccueil); } catch { /* stockage indisponible */ }
    if (!dejaVu) ouvrirAccueil(role, current, cleAccueil);
    brancherSouhaits(app.querySelector('[data-el=souhaits]'), { studentId: current.id, admin: false });
    document.getElementById('pick')?.addEventListener('change', async (e) => { current = students.find((s) => s.id === e.target.value); await render(); });
    const brancheSeg = (cls2, key) => app.querySelector(`.${cls2}`)?.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; filtres[key] = b.dataset[key]; filtres.parcoursOuvert = true;
      if (key === 'niveau' && filtres.niveau === 'universite' && !filtres.universite) filtres.universite = cibles[0]?.universite_id ?? '';
      render();
    });
    brancheSeg('seg-niveau', 'niveau'); brancheSeg('seg-qui', 'qui');
    const parcours = app.querySelector('.fam-parcours');
    if (parcours) { parcours.open = filtres.parcoursOuvert; parcours.addEventListener('toggle', () => { filtres.parcoursOuvert = parcours.open; }); }
    app.querySelector('[data-el=niveau-u]')?.addEventListener('change', (e) => { filtres.universite = e.target.value; render(); });
    app.querySelectorAll('[data-universite]').forEach((el) => el.addEventListener('click', async () => {
      filtres.niveau = 'universite'; filtres.universite = el.dataset.universite; filtres.parcoursOuvert = true;
      await render();
      app.querySelector('.fam-parcours')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    app.querySelectorAll('[data-tache]').forEach((el) => el.addEventListener('click', () => {
      const x = enrichies.find((y) => y.id === el.dataset.tache);
      if (x) ouvrir(x, { nomU, docs: docs.filter((d) => d.tache_id === x.id), livrables: livrables.filter((l) => l.tache_id === x.id), studentId: current.id, apres: render, role });
    }));
  };
  await render();
}

function carte(x, today, nomU) {
  const u = urgenceTache(x, today);
  const classes = ['ms-card', x.lock ? 'is-lock' : '', `u-${u}`, x.statut === 'fait' ? 'is-done' : ''].filter(Boolean).join(' ');
  const nom = x.universite_id ? nomU(x.universite_id) : '';
  const m = x.milestone_id ? jalon(MILESTONES.find((mm) => mm.id === x.milestone_id)) : null;
  return `<button type="button" class="${classes}" data-tache="${esc(x.id)}">
    <span class="ms-card__top"><span class="ms-card__id">${esc(x.milestone_id ?? t2('types', x.type))}</span>
      ${m?.repere ? `<span class="ms-tag ms-tag--repere">${esc(t('repereTag'))}</span>` : ''}${x.lock ? `<span class="ms-tag ms-tag--lock">● ${esc(t('irrattrapable'))}</span>` : ''}</span>
    <h3>${esc(titreTache(x))}</h3>${nom ? `<span class="ms-card__pour">${esc(nom)}</span>` : ''}
    <span class="ms-card__date">${esc(fmtIso(x.echeance))}${['fait', 'sans_objet'].includes(x.statut) ? '' : ` · ${esc(delai(x.echeance, today))}`}</span>
    <span class="ms-card__qui">${x.owners.map((o) => esc(t2('owners', o))).join(' · ')}</span>
    <span class="ms-status st-${esc(x.statut)}"><span class="dot"></span>${esc(t2('statutsTache', x.statut))}</span></button>`;
}

let panel = null; let scrim = null;
function fermer() { panel?.classList.remove('is-open'); scrim?.classList.remove('is-open'); }
let monId = null;
function ouvrir(x, { nomU, docs, livrables, studentId, apres, role = 'parent' }) {
  if (!panel) {
    scrim = document.createElement('div'); scrim.className = 'ms-scrim';
    panel = document.createElement('aside'); panel.className = 'ms-panel'; panel.setAttribute('role', 'dialog'); panel.tabIndex = -1;
    document.body.append(scrim, panel); scrim.addEventListener('click', fermer);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermer(); });
  }
  const m = x.milestone_id ? jalon(MILESTONES.find((mm) => mm.id === x.milestone_id)) : null;
  const nom = x.universite_id ? nomU(x.universite_id) : '';
  // La famille peut toujours déposer une pièce : le guide de bien des étapes le
  // lui demande, même quand l'intervenant nommé est Carmine (bulletins, relevés).
  const peutDeposer = true;
  panel.innerHTML = `
    <div class="ms-panel__head"><div class="row"><div style="min-width:0">
      <div class="ms-panel__eyebrow">${esc(x.milestone_id ?? t2('types', x.type))}${nom ? ` · ${esc(nom)}` : ''}</div><h2>${esc(titreTache(x))}</h2></div>
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
      ${m?.suivi && x.origine === 'socle' ? `<div class="blk" data-el="journal"><p class="journal-loading">…</p></div>` : ''}
      ${x.milestone_id === 'A-00' ? `<div class="blk" data-el="souhaits-panel"></div>` : ''}
      ${m?.warn ? `<div class="blk-warn"><strong>${esc(t('watchOut'))}</strong> ${esc(m.warn)}</div>` : ''}
      ${m ? `<div class="blk-duo"><div><h4>${esc(t('weProduce'))}</h4><p>${esc(m.carmine ?? '')}</p></div><div><h4>${esc(role === 'eleve' ? t('weExpectToi') : t('weExpect'))}</h4><p>${esc(m.family ?? t('nothingExpected'))}</p></div></div>` : ''}
      <div class="blk"><h4>${esc(t('qui'))}</h4><p>${x.owners.map((o) => esc(t2('owners', o))).join(' · ')}</p></div>
      ${['parents', 'eleve'].includes(x.balle ?? x.owners[0]) && ['a_faire', 'en_cours'].includes(x.statut) ? `<div class="blk blk-balle-famille">
        <h4>${esc(role === 'eleve' ? t('famBalleTitreToi') : t('famBalleTitre'))}</h4>
        <p class="journal-intro">${esc(role === 'eleve' ? t('famBalleIntroToi') : t('famBalleIntro'))}</p>
        <div class="portal-field"><input data-el="mot-famille" placeholder="${esc(t('famBalleMot'))}"></div>
        <button type="button" class="btn btn--primary btn--sm" data-el="passer-famille">${esc(t('famBalleBouton'))}</button>
        <span class="fiche-msg" data-el="msg-famille" style="display:inline;margin-left:.6rem"></span>
      </div>` : ''}
      ${x.public_note ? `<div class="blk"><h4>${esc(t('whereWeAre'))}</h4><p>${esc(x.public_note)}</p></div>` : ''}
      ${livrables.length ? livrables.map((l) => `<div class="blk"><h4>${esc(l.titre)}</h4><pre class="livrable-texte">${esc(l.contenu)}</pre></div>`).join('') : ''}
      <div class="blk"><h4>${esc(t('piecesTitre'))}</h4><ul class="doc-list" data-el="docs">${docs.map((d) => `<li data-path="${esc(d.storage_path)}" data-id="${esc(d.id)}"><a href="#" data-doc>${esc(d.filename)}</a><span class="size">${esc(fmtIso(d.created_at.slice(0, 10)))}</span>${d.uploaded_by === monId ? ` <button type="button" class="wish-del" data-doc-del aria-label="${esc(t('supprimer'))}" title="${esc(t('supprimer'))}">&times;</button>` : ''}</li>`).join('') || `<li style="border:0;background:none;padding-left:0;color:var(--text-secondary)">${esc(t('aucunePiece'))}</li>`}</ul>
        ${peutDeposer ? `<label class="dropzone"><strong>${esc(t('deposerPiece'))}</strong><span>${esc(t('deposerHint'))}</span><input type="file" data-el="file"></label>` : ''}</div>
    </div>`;
  panel.querySelector('[data-el=close]').addEventListener('click', fermer);
  panel.querySelector('[data-el=passer-famille]')?.addEventListener('click', async (ev) => {
    const btn = ev.currentTarget; btn.disabled = true;
    const msg = panel.querySelector('[data-el=msg-famille]');
    try {
      const { error } = await supabase.rpc('carmine_famille_passer_balle', { p_tache: x.id, p_mot: panel.querySelector('[data-el=mot-famille]').value.trim() || null });
      if (error) throw error;
      fermer(); await apres();
    } catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; btn.disabled = false; }
  });
  guideFamille(panel.querySelector('[data-el=guide]'), panel.querySelector('[data-el=guide-btn]'), x, x.milestone_id === 'A-00');
  if (x.milestone_id === 'A-00') brancherSouhaits(panel.querySelector('[data-el=souhaits-panel]'), { studentId, admin: false });
  if (m?.suivi && x.origine === 'socle') brancherJournal(panel.querySelector('[data-el=journal]'), { studentId, milestoneId: x.milestone_id, kind: m.suivi });
  panel.querySelectorAll('[data-doc-del]').forEach((b) => b.addEventListener('click', async () => {
    const li = b.closest('li'); const d = docs.find((y) => y.id === li.dataset.id);
    if (!d || !confirm(t('famSupprimerPiece')(d.filename))) return;
    b.disabled = true;
    try {
      await supabase.storage.from('carmine-documents').remove([d.storage_path]);
      const { error } = await supabase.from('carmine_documents').delete().eq('id', d.id);
      if (error) throw error;
      fermer(); await apres();
    } catch (err) { b.disabled = false; alert(`${t('echec')} : ${err.message}`); }
  }));
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
    monId = profile.id ?? (await supabase.auth.getUser()).data?.user?.id ?? null;
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

/* ── Accueil : comment ça marche, à la première connexion et sur demande ── */

let accueil = null;
function ouvrirAccueil(role, student, cleAccueil = null) {
  if (!accueil) { accueil = document.createElement('div'); accueil.className = 'accueil'; document.body.append(accueil); }
  const etapes = t2('accueilEtapes', role);
  accueil.innerHTML = `
    <div class="accueil__scrim" data-el="fermer"></div>
    <section class="accueil__carte" role="dialog" aria-modal="true" aria-labelledby="accueil-titre">
      <p class="accueil__eyebrow">${esc(t('accueilEyebrow'))}</p>
      <h2 id="accueil-titre">${esc(t2('accueilTitre', role)(student.first_name))}</h2>
      <p class="accueil__intro">${esc(t2('accueilIntro', role))}</p>
      <ol class="accueil__liste">${etapes.map((e, i) => `
        <li><span class="accueil__num">${i + 1}</span>
          <div><h3>${esc(e.titre)}</h3><p>${esc(e.texte)}</p><p class="accueil__ou">${esc(e.ou)}</p></div></li>`).join('')}</ol>
      <div class="accueil__pied">
        <button type="button" class="btn btn--primary" data-el="ok">${esc(t2('accueilOk', role))}</button>
        <span>${esc(t('accueilRelire'))}</span>
      </div>
    </section>`;
  const fermerAccueil = () => {
    accueil.classList.remove('is-open');
    if (cleAccueil) { try { localStorage.setItem(cleAccueil, new Date().toISOString()); } catch { /* rien */ } }
  };
  accueil.querySelector('[data-el=ok]').addEventListener('click', fermerAccueil);
  accueil.querySelector('[data-el=fermer]').addEventListener('click', fermerAccueil);
  requestAnimationFrame(() => accueil.classList.add('is-open'));
  accueil.querySelector('[data-el=ok]').focus();
}

/** Le guide famille d'une étape, s'il est validé. Le bouton n'apparaît que dans ce cas. */
async function guideFamille(zone, bouton, x, ouvert = false) {
  let guides = [];
  try { guides = await getGuides(cleGuide(x), x.exigence_id ? x.type : null); } catch { return; }
  const g = guides.find((y) => y.audience === 'famille' && y.statut === 'valide');
  if (!g) return;
  bouton.hidden = false;
  zone.innerHTML = `<div class="guide-texte">${rendreMarkdown(g.contenu)}</div>`;
  if (ouvert) zone.hidden = false;
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
