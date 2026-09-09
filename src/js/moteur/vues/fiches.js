/** Vue « fiches université » : la liste, les compteurs, le lancement d'une recherche. */
import { listUniversites, compteExigences, lancerFiche } from '../donnees.js';
import { t, t2, esc, fmtDate } from '../lang.js';
import { nav } from './nav.js';

const FILIERES = ['uk', 'us', 'eu'];
const FILIERE_LABEL = { uk: 'Royaume-Uni', us: 'États-Unis', eu: 'Europe' };

export async function vueFiches(app) {
  const [universites, comptes] = await Promise.all([listUniversites(), compteExigences()]);

  const lignes = universites.map((u) => ({ u, c: comptes[u.id] ?? { brouillon: 0, validee: 0, perimee: 0, rejetee: 0 } }));
  // Ce qui attend une validation d'abord, puis ce qui n'a pas de fiche.
  lignes.sort((a, b) =>
    (b.c.brouillon - a.c.brouillon)
    || ((a.c.validee > 0) - (b.c.validee > 0))
    || a.u.etablissement.localeCompare(b.u.etablissement));

  const totalValidees = lignes.reduce((n, l) => n + l.c.validee, 0);
  const totalBrouillons = lignes.reduce((n, l) => n + l.c.brouillon, 0);
  const sansFiche = lignes.filter((l) => !l.c.validee && !l.c.brouillon).length;

  app.innerHTML = `
    <div class="portal__inner">
      ${nav('fiches')}
      <div class="admin-bar">
        <h1>${esc(t('fiches'))}</h1>
        <div class="portal-actions">
          <button class="btn btn--primary btn--sm" id="nouvelle">${esc(t('nouvelleFiche'))}</button>
          <button class="btn btn--secondary btn--sm" id="out">${esc(t('deconnexion'))}</button>
        </div>
      </div>
      <p class="moteur-intro">${esc(t('fichesIntro'))}</p>

      <div class="kpi-row">
        <div class="kpi"><b>${lignes.length}</b><span>${esc(t('kpiUniversites'))}</span></div>
        <div class="kpi ${totalBrouillons ? 'kpi--soon' : 'kpi--zero'}"><b>${totalBrouillons}</b><span>${esc(t('kpiBrouillons'))}</span></div>
        <div class="kpi kpi--zero"><b>${totalValidees}</b><span>${esc(t('kpiValidees'))}</span></div>
        <div class="kpi ${sansFiche ? 'kpi--late' : 'kpi--zero'}"><b>${sansFiche}</b><span>${esc(t('kpiSansFiche'))}</span></div>
      </div>

      <form class="fiche-nouvelle" id="form-nouvelle" hidden>
        <div class="fiche-nouvelle__grid">
          <label class="portal-field"><span>${esc(t('etablissement'))}</span>
            <input name="etablissement" required></label>
          <label class="portal-field"><span>${esc(t('cursus'))}</span>
            <input name="cursus"><small class="field-hint">${esc(t('cursusHint'))}</small></label>
          <label class="portal-field"><span>${esc(t('pays'))}</span>
            <input name="pays" required placeholder="Royaume-Uni"></label>
          <label class="portal-field"><span>${esc(t('filiere'))}</span>
            <select name="filiere">${FILIERES.map((f) =>
              `<option value="${f}">${esc(FILIERE_LABEL[f])}</option>`).join('')}</select></label>
          <label class="portal-field fiche-nouvelle__large"><span>${esc(t('domaine'))}</span>
            <input name="domaine" placeholder="admissions.exemple.edu"><small class="field-hint">${esc(t('domaineHint'))}</small></label>
        </div>
        <div class="portal-actions">
          <button type="submit" class="btn btn--primary btn--sm">${esc(t('chercher'))}</button>
          <span class="fiche-msg" data-el="msg"></span>
        </div>
      </form>

      ${lignes.length ? `
      <div class="table-scroll">
        <table class="files-table">
          <thead><tr>
            <th>${esc(t('colUniversite'))}</th><th>${esc(t('colPays'))}</th>
            <th>${esc(t('colFiche'))}</th><th>${esc(t('colRecherche'))}</th><th></th>
          </tr></thead>
          <tbody>
            ${lignes.map(({ u, c }) => `
              <tr class="${c.brouillon ? 'u-bientot' : ''}">
                <td class="pupil"><a href="/moteur?universite=${u.id}">${esc(u.etablissement)}</a>
                  ${u.cursus ? `<span class="sub">${esc(u.cursus)}</span>` : ''}</td>
                <td>${esc(u.pays)}${u.filiere ? `<span class="sub">${esc(FILIERE_LABEL[u.filiere] ?? u.filiere)}</span>` : ''}</td>
                <td>${c.brouillon ? `<b class="late">${esc(t('aValider')(c.brouillon))}</b><br>` : ''}${
                  c.validee ? esc(t('validees')(c.validee)) : (c.brouillon ? '' : `<span class="sub">${esc(t('sansFiche'))}</span>`)}</td>
                <td>${u.fiche_recherchee_le ? esc(fmtDate(u.fiche_recherchee_le)) : `<span class="sub">${esc(t('jamais'))}</span>`}</td>
                <td><a class="btn btn--secondary btn--sm" href="/moteur?universite=${u.id}">${esc(t('ouvrir'))}</a></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : `<div class="empty-state">${esc(t('aucune'))}</div>`}
    </div>`;

  const form = document.getElementById('form-nouvelle');
  document.getElementById('nouvelle').addEventListener('click', () => {
    form.hidden = !form.hidden;
    if (!form.hidden) form.etablissement.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    const msg = form.querySelector('[data-el=msg]');
    btn.disabled = true;
    msg.textContent = t('rechercheEnCours');
    try {
      const r = await lancerFiche({
        etablissement: form.etablissement.value.trim(),
        cursus: form.cursus.value.trim() || null,
        pays: form.pays.value.trim(),
        filiere: form.filiere.value,
        domaine: form.domaine.value.trim() || null,
      });
      location.href = `/moteur?universite=${r.universite_id}`;
    } catch (err) {
      btn.disabled = false;
      msg.textContent = `${t('echec')} : ${err.message}`;
    }
  });

  return { onSignOut: (fn) => document.getElementById('out').addEventListener('click', fn) };
}
