/** Écran du jour : ce qui demande une action, tous dossiers confondus. */
import { listStudents, getAllTaches, listUniversites, updateTache } from '../donnees.js';
import { statutEffectif, urgenceTache, apparueCetteSemaine } from '../generateur.js';
import { daysUntil } from '../../portail/calendrier.js';
import { t, t2, esc, fmtIso, delai } from '../lang.js';
import { nav } from './nav.js';

const RANG = { retard: 0, urgent: 1, bientot: 2, ok: 3 };

export async function vueJour(app) {
  const [students, taches, universites] = await Promise.all([listStudents(), getAllTaches(), listUniversites()]);
  const eleves = new Map(students.map((s) => [s.id, s]));
  const nomU = new Map(universites.map((u) => [u.id, u.cursus ? `${u.etablissement} · ${u.cursus}` : u.etablissement]));
  const today = new Date();

  const lignes = taches
    .filter((x) => eleves.has(x.student_id))
    .map((x) => ({ x, st: statutEffectif(x, today), u: urgenceTache(x, today), nouvelle: apparueCetteSemaine(x, today) }))
    .filter(({ st, u, nouvelle }) => ['a_faire', 'en_cours'].includes(st) && (u !== 'ok' || nouvelle))
    .sort((a, b) => (RANG[a.u] - RANG[b.u]) || a.x.echeance.localeCompare(b.x.echeance));

  const n = (u) => lignes.filter((l) => l.u === u).length;
  const apparues = lignes.filter((l) => l.nouvelle).length;
  const irrattrapables = lignes.filter((l) => l.x.lock && daysUntil(new Date(`${l.x.echeance}T00:00:00Z`), today) <= 14 && l.u !== 'retard').length;
  const sansTaches = students.filter((s) => !s.admission && !taches.some((x) => x.student_id === s.id)).length;

  app.innerHTML = `
    <div class="portal__inner">
      ${nav('jour')}
      <div class="admin-bar"><h1>${esc(t('jourTitre'))}</h1>
        <div class="portal-actions"><button class="btn btn--secondary btn--sm" id="out">${esc(t('deconnexion'))}</button></div></div>
      <p class="moteur-intro">${esc(t('jourIntro'))}</p>
      <div class="kpi-row">
        <div class="kpi"><b>${students.filter((s) => !s.admission).length}</b><span>${esc(t('kpiDossiers'))}</span></div>
        <div class="kpi ${n('retard') ? 'kpi--late' : 'kpi--zero'}"><b>${n('retard')}</b><span>${esc(t('kpiRetard'))}</span></div>
        <div class="kpi ${n('urgent') ? 'kpi--soon' : 'kpi--zero'}"><b>${n('urgent')}</b><span>${esc(t('kpiUrgent'))}</span></div>
        <div class="kpi ${apparues ? 'kpi--soon' : 'kpi--zero'}"><b>${apparues}</b><span>${esc(t('kpiApparues'))}</span></div>
        <div class="kpi ${irrattrapables ? 'kpi--late' : 'kpi--zero'}"><b>${irrattrapables}</b><span>${esc(t('kpiIrrattrapables'))}</span></div>
      </div>
      ${sansTaches ? `<p class="moteur-intro">${esc(t('aSynchroniser')(sansTaches))} <a href="/moteur?vue=dossiers">${esc(t('navDossiers'))}</a></p>` : ''}
      ${lignes.length ? `
      <div class="table-scroll"><table class="alert-table jour-table">
        <thead><tr><th>${esc(t('colEleve'))}</th><th>${esc(t('colTache'))}</th><th>${esc(t('colQui'))}</th><th>${esc(t('colEcheance'))}</th><th>${esc(t('colDelai'))}</th><th></th></tr></thead>
        <tbody>${lignes.slice(0, 80).map(({ x, st, u, nouvelle }) => {
          const s = eleves.get(x.student_id);
          return `<tr class="u-${u}" data-id="${x.id}">
            <td class="pupil"><a href="/moteur?dossier=${s.id}">${esc(s.first_name)} ${esc(s.last_name)}</a></td>
            <td>${x.lock ? '<span class="ms-tag ms-tag--lock">●</span> ' : ''}${esc(x.titre)}
              ${nouvelle ? `<span class="ms-tag jour-nouvelle">${esc(t('nouvelle'))}</span>` : ''}
              <br><span class="sub">${x.universite_id ? esc(nomU.get(x.universite_id) ?? '') : esc(t2('statutsTache', st))}</span></td>
            <td class="sub">${x.owners.map((o) => esc(t2('owners', o))).join(', ')}</td>
            <td>${esc(fmtIso(x.echeance))}</td>
            <td class="days">${esc(delai(x.echeance, today))}</td>
            <td class="jour-actions"><button type="button" class="btn btn--secondary btn--sm" data-fait="${x.id}">${esc(t('fait'))}</button>
              <a class="btn btn--secondary btn--sm" href="/moteur?dossier=${s.id}&tache=${x.id}">${esc(t('ouvrirDossier'))}</a></td>
          </tr>`; }).join('')}</tbody>
      </table></div>
      ${lignes.length > 80 ? `<p class="moteur-intro">${esc(t('hiddenRows') ? '' : '')}${lignes.length - 80} …</p>` : ''}`
      : `<div class="empty-state">${esc(t('jourVide'))}</div>`}
    </div>`;

  app.querySelectorAll('[data-fait]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    try {
      await updateTache(b.dataset.fait, { statut: 'fait' });
      b.closest('tr').remove();
    } catch (err) { b.disabled = false; b.textContent = `${t('echec')} : ${err.message}`; }
  }));

  return { onSignOut: (fn) => document.getElementById('out').addEventListener('click', fn) };
}
