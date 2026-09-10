/**
 * Écran du jour : ce qui demande une action, tous dossiers confondus, dans la
 * même grille que la page d'un élève. À qui est la balle : à moi, à l'élève,
 * aux parents, au lycée. En tête, les tâches apparues cette semaine que Greg
 * n'a pas encore attribuées : un clic confirme la proposition.
 */
import { listStudents, getAllTaches, listUniversites, updateTache, confirmerAttribution, passerBalle } from '../donnees.js';
import { statutEffectif, urgenceTache, apparueCetteSemaine, attendDepuis } from '../generateur.js';
import { daysUntil } from '../../portail/calendrier.js';
import { t, t2, esc, fmtIso, delai } from '../lang.js';
import { nav } from './nav.js';

const RANG = { retard: 0, urgent: 1, bientot: 2, ok: 3 };

export async function vueJour(app) {
  const render = async () => {
    const [students, taches, universites] = await Promise.all([listStudents(), getAllTaches(), listUniversites()]);
    const eleves = new Map(students.filter((s) => !s.admission).map((s) => [s.id, s]));
    const nomU = new Map(universites.map((u) => [u.id, u.cursus ? `${u.etablissement} · ${u.cursus}` : u.etablissement]));
    const today = new Date();

    const actives = taches
      .filter((x) => eleves.has(x.student_id))
      .map((x) => ({ x, st: statutEffectif(x, today), u: urgenceTache(x, today), nouvelle: apparueCetteSemaine(x, today) }))
      .filter(({ st }) => ['a_faire', 'en_cours'].includes(st))
      .sort((a, b) => (RANG[a.u] - RANG[b.u]) || a.x.echeance.localeCompare(b.x.echeance));

    const aAttribuer = actives.filter(({ x }) => !x.attribuee);
    const colonnes = { carmine: [], eleve: [], parents: [], etablissement: [] };
    for (const item of actives) {
      if (!item.x.attribuee) continue;
      const b = item.x.balle ?? item.x.owners[0] ?? 'carmine';
      (colonnes[b === 'externe' ? 'etablissement' : b] ?? colonnes.carmine).push(item);
    }
    // Chez les autres, seul ce qui est en retard, proche, ou qui attend depuis
    // longtemps remonte ici ; le reste vit sur la page de l'élève.
    for (const k of ['eleve', 'parents', 'etablissement']) {
      colonnes[k] = colonnes[k].filter(({ x, u }) => u !== 'ok' || attendDepuis(x, today) >= 7);
    }
    colonnes.carmine = colonnes.carmine.filter(({ u, nouvelle }) => u !== 'ok' || nouvelle);

    const n = (u) => actives.filter((l) => l.u === u).length;
    const irrattrapables = actives.filter(({ x, u }) => x.lock && daysUntil(new Date(`${x.echeance}T00:00:00Z`), today) <= 14 && u !== 'retard').length;
    const sansTaches = students.filter((s) => !s.admission && !taches.some((x) => x.student_id === s.id)).length;

    const eleveDe = (x) => { const s = eleves.get(x.student_id); return s ? `${s.first_name} ${s.last_name}` : ''; };
    const ligne = ({ x, u }, colonne) => {
      const p = u === 'retard' || u === 'urgent' ? 'r' : u === 'bientot' ? 'o' : 'g';
      const jours = attendDepuis(x, today);
      return `<div class="ligne ligne--${p}" data-tache="${esc(x.id)}" data-eleve="${esc(x.student_id)}" role="button" tabindex="0">
        <div class="ligne__t">${x.lock ? '<span class="ligne__lock">●</span> ' : ''}${esc(x.titre)}</div>
        <div class="ligne__u"><b>${esc(eleveDe(x))}</b>${x.universite_id ? ` · ${esc(nomU.get(x.universite_id) ?? '')}` : ''}</div>
        <div class="ligne__b"><span class="pastille pastille--${p}">${esc(delai(x.echeance, today))}</span>
          ${colonne !== 'carmine' && jours > 0 ? `<span class="attente">${esc(t('attendDepuis'))} <b>${jours} j</b></span>` : ''}
          ${colonne === 'carmine' ? `<button type="button" class="ligne__act" data-fait="${esc(x.id)}">${esc(t('fait'))}</button>` : ''}
          <a class="ligne__act" href="/moteur?dossier=${esc(x.student_id)}&tache=${esc(x.id)}">${esc(t('ouvrirDossier'))}</a>
        </div></div>`;
    };
    const colonne = (cle, titreCle, items) => `
      <div class="col${cle === 'carmine' ? ' col--moi' : ''}">
        <h3>${esc(t(titreCle))} <span>${items.length}</span></h3>
        ${items.length ? items.slice(0, 12).map((it) => ligne(it, cle)).join('') : `<p class="col-vide">${esc(t(cle === 'carmine' ? 'colVideMoi' : 'colVide'))}</p>`}
        ${items.length > 12 ? `<p class="col-vide">${esc(t('colPlus')(items.length - 12))}</p>` : ''}
      </div>`;

    app.innerHTML = `
      <div class="portal__inner">
        ${nav('jour')}
        <div class="admin-bar"><h1>${esc(t('jourTitre'))}</h1>
          <div class="portal-actions"><button class="btn btn--secondary btn--sm" id="out">${esc(t('deconnexion'))}</button></div></div>
        <div class="kpi-row">
          <div class="kpi"><b>${eleves.size}</b><span>${esc(t('kpiDossiers'))}</span></div>
          <div class="kpi ${n('retard') ? 'kpi--late' : 'kpi--zero'}"><b>${n('retard')}</b><span>${esc(t('kpiRetard'))}</span></div>
          <div class="kpi ${n('urgent') ? 'kpi--soon' : 'kpi--zero'}"><b>${n('urgent')}</b><span>${esc(t('kpiUrgent'))}</span></div>
          <div class="kpi ${irrattrapables ? 'kpi--late' : 'kpi--zero'}"><b>${irrattrapables}</b><span>${esc(t('kpiIrrattrapables'))}</span></div>
        </div>
        ${sansTaches ? `<p class="moteur-intro">${esc(t('aSynchroniser')(sansTaches))} <a href="/moteur?vue=dossiers">${esc(t('navDossiers'))}</a></p>` : ''}

        ${aAttribuer.length ? `
        <section class="attribuer">
          <div class="attribuer__head"><h2>${esc(t('aAttribuerTitre')(aAttribuer.length))}</h2>
            <button type="button" class="btn btn--primary btn--sm" id="confirmer-tout">${esc(t('confirmerTout'))}</button></div>
          <p class="moteur-intro">${esc(t('aAttribuerIntro'))}</p>
          <div class="attribuer__liste">${aAttribuer.slice(0, 40).map(({ x }) => `
            <div class="attribuer__ligne" data-id="${esc(x.id)}">
              <span class="attribuer__qui"><b>${esc(eleveDe(x))}</b></span>
              <span class="attribuer__t">${x.lock ? '<span class="ligne__lock">●</span> ' : ''}${esc(x.titre)}${x.universite_id ? ` <small>${esc(nomU.get(x.universite_id) ?? '')}</small>` : ''}</span>
              <span class="attribuer__date">${esc(fmtIso(x.echeance))}</span>
              <select data-balle>${['carmine', 'eleve', 'parents', 'etablissement'].map((b) =>
                `<option value="${b}"${(x.balle ?? x.owners[0]) === b ? ' selected' : ''}>${esc(t2('owners', b))}</option>`).join('')}</select>
            </div>`).join('')}</div>
        </section>` : ''}

        <div class="cols">
          ${colonne('carmine', 'colMoi', colonnes.carmine)}
          ${colonne('eleve', 'colEleve', colonnes.eleve)}
          ${colonne('parents', 'colParents', colonnes.parents)}
          ${colonne('etablissement', 'colLycee', colonnes.etablissement)}
        </div>
      </div>`;

    document.getElementById('out').addEventListener('click', async () => { const { signOut } = await import('../donnees.js'); signOut(); });

    app.querySelectorAll('[data-fait]').forEach((b) => b.addEventListener('click', async (ev) => {
      ev.stopPropagation(); b.disabled = true;
      try { await updateTache(b.dataset.fait, { statut: 'fait' }); b.closest('.ligne').remove(); }
      catch (err) { b.disabled = false; b.textContent = `${t('echec')} : ${err.message}`; }
    }));
    app.querySelectorAll('.ligne[data-tache]').forEach((el) => el.addEventListener('click', (ev) => {
      if (ev.target.closest('a,button')) return;
      location.href = `/moteur?dossier=${el.dataset.eleve}&tache=${el.dataset.tache}`;
    }));
    app.querySelectorAll('.attribuer__ligne [data-balle]').forEach((sel) => sel.addEventListener('change', async () => {
      const id = sel.closest('.attribuer__ligne').dataset.id;
      try { await passerBalle(id, sel.value); sel.closest('.attribuer__ligne').remove(); } catch (err) { sel.disabled = true; }
    }));
    document.getElementById('confirmer-tout')?.addEventListener('click', async (ev) => {
      const btn = ev.currentTarget;
      btn.disabled = true;
      try { await confirmerAttribution(aAttribuer.map(({ x }) => x.id)); await render(); }
      catch (err) { btn.textContent = `${t('echec')} : ${err.message}`; }
    });
  };
  await render();
  return { onSignOut: () => {} };
}
