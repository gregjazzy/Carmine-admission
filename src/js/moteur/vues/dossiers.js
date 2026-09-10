/** Liste des dossiers, avec l'avancement calculé sur les tâches du moteur. */
import { listStudents, getTachesResume, listUniversites, synchroniser, createStudent } from '../donnees.js';
import { CLASSES, terminaleYearFromClass, currentSchoolYear } from '../../portail/calendrier.js';
import { FILIERES } from '../socle.js';
import { statutEffectif, urgenceTache, avancement, classeDe } from '../generateur.js';
import { t, t2, esc, fmtIso, delai, titreTache } from '../lang.js';
import { nav } from './nav.js';

export async function vueDossiers(app) {
  const [students, taches, universites] = await Promise.all([listStudents(), getTachesResume(), listUniversites()]);
  const nomU = new Map(universites.map((u) => [u.id, u.etablissement]));
  const parEleve = new Map();
  for (const tache of taches) (parEleve.get(tache.student_id) ?? parEleve.set(tache.student_id, []).get(tache.student_id)).push(tache);
  const today = new Date();

  const lignes = students.map((s) => {
    const ts = parEleve.get(s.id) ?? [];
    const av = avancement(ts, today);
    const vivantes = ts.filter((x) => ['a_faire', 'en_cours'].includes(statutEffectif(x, today)));
    const prochaine = vivantes.sort((a, b) => a.echeance.localeCompare(b.echeance))[0] ?? null;
    const retards = vivantes.filter((x) => urgenceTache(x, today) === 'retard').length;
    return { s, ts, av, prochaine, retards };
  }).sort((a, b) => (Boolean(a.s.admission) - Boolean(b.s.admission)) || (b.retards - a.retards) || (a.av.pct - b.av.pct));

  const sansTaches = lignes.filter((l) => !l.ts.length && !l.s.admission);

  app.innerHTML = `
    <div class="portal__inner">
      ${nav('dossiers')}
      <div class="admin-bar"><h1>${esc(t('dossiersTitre'))}</h1>
        <div class="portal-actions">
          <button class="btn btn--primary btn--sm" id="nouveau">${esc(t('nouveauDossier'))}</button>
          ${sansTaches.length ? `<button class="btn btn--secondary btn--sm" id="sync-all">${esc(t('toutSynchroniser'))}</button>` : ''}
        </div>
      </div>
      <form class="fiche-nouvelle" id="form-nouveau" hidden>
        <div class="fiche-nouvelle__grid">
          <label class="portal-field"><span>${esc(t('prenom'))}</span><input name="first_name" required></label>
          <label class="portal-field"><span>${esc(t('nom'))}</span><input name="last_name" required></label>
          <label class="portal-field"><span>${esc(t('classeActuelle'))} (${currentSchoolYear()}-${currentSchoolYear() + 1})</span>
            <select name="current_class">${CLASSES.filter((c) => c.key !== 'apres').map((c) =>
              `<option value="${c.key}"${c.key === 'seconde' ? ' selected' : ''}>${esc(c.label)} · ${esc(c.year)} · ${esc(c.grade)}</option>`).join('')}</select></label>
          <label class="portal-field"><span>${esc(t('lycee'))}</span><input name="school"></label>
          <label class="portal-field"><span>${esc(t('ville'))}</span><input name="city"></label>
          <div class="portal-field"><span>${esc(t('filieresLabel'))}</span>
            ${FILIERES.map((f) => `<label class="options-bloc__item"><input type="checkbox" name="tracks" value="${f}"${['uk', 'us'].includes(f) ? ' checked' : ''}> ${esc(t2('filieres', f))}</label>`).join('')}</div>
        </div>
        <div class="portal-actions"><button type="submit" class="btn btn--primary btn--sm">${esc(t('creerDossier'))}</button><span class="fiche-msg" data-el="msg"></span></div>
      </form>
      ${sansTaches.length ? `<p class="moteur-intro">${esc(t('aSynchroniser')(sansTaches.length))}</p>` : ''}
      <p class="fiche-msg" id="msg"></p>
      ${lignes.length ? `
      <div class="table-scroll"><table class="files-table">
        <thead><tr><th>${esc(t('colEleve'))}</th><th>${esc(t('colClasse'))}</th><th>${esc(t('colAvancement'))}</th><th>${esc(t('colProchaine'))}</th></tr></thead>
        <tbody>${lignes.map(({ s, ts, av, prochaine, retards }) => {
          const cls = classeDe(new Date().toISOString().slice(0, 10), s.terminale_year);
          return `<tr${retards ? ' class="u-retard"' : ''}>
            <td class="pupil"><a href="/moteur?dossier=${s.id}">${esc(s.first_name)} ${esc(s.last_name)}</a>
              <span class="sub">${s.tracks.map((tr) => esc(t2('filieres', tr))).join(' / ')}</span></td>
            <td>${esc(cls.label)}<span class="sub">${esc(t2('annees', '0'))} ${s.terminale_year}</span></td>
            <td class="progress-cell">${ts.length ? `<span class="pct">${av.pct}%</span><span class="bar"><i style="width:${av.pct}%"></i></span>
              <span class="sub">${av.done}/${av.total}${retards ? ` · <b class="late">${esc(t('retards')(retards))}</b>` : ''}</span>`
              : `<span class="sub">${esc(t('sansTaches'))}</span>`}</td>
            <td>${s.admission ? `<b class="admis">${esc(s.admission)}</b>` : prochaine
              ? `${esc(titreTache(prochaine))}${prochaine.universite_id ? ` <span class="sub">${esc(nomU.get(prochaine.universite_id) ?? '')}</span>` : ''}<span class="sub">${esc(fmtIso(prochaine.echeance))} · ${esc(delai(prochaine.echeance, today))}</span>`
              : `<span class="sub">${esc(ts.length ? t('dossierTermine') : '')}</span>`}</td>
          </tr>`; }).join('')}</tbody>
      </table></div>` : `<div class="empty-state">${esc(t('aucunDossier'))}</div>`}
    </div>`;

  const formNouveau = document.getElementById('form-nouveau');
  document.getElementById('nouveau').addEventListener('click', () => { formNouveau.hidden = !formNouveau.hidden; if (!formNouveau.hidden) formNouveau.first_name.focus(); });
  formNouveau.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = formNouveau.querySelector('[data-el=msg]');
    const tracks = [...formNouveau.querySelectorAll('input[name=tracks]:checked')].map((i) => i.value);
    if (!tracks.length) { msg.textContent = t('choisirFiliere'); return; }
    const cls = formNouveau.current_class.value;
    try {
      const s = await createStudent({
        first_name: formNouveau.first_name.value.trim(), last_name: formNouveau.last_name.value.trim(),
        entry_class: cls, current_class: cls, terminale_year: terminaleYearFromClass(cls, currentSchoolYear()),
        tracks, school: formNouveau.school.value.trim() || null, city: formNouveau.city.value.trim() || null,
      });
      location.href = `/moteur?dossier=${s.id}`;
    } catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; }
  });

  document.getElementById('sync-all')?.addEventListener('click', async (ev) => {
    const btn = ev.currentTarget;
    btn.disabled = true;
    const msg = document.getElementById('msg');
    let a = 0; let r = 0; let e = 0;
    for (const { s } of sansTaches) {
      try {
        const res = await synchroniser(s);
        a += res.ajoutees; r += res.redatees; e += res.effacees;
        msg.textContent = `${s.first_name} ${s.last_name} · ${t('synchronise')(a, r, e)}`;
      } catch (err) {
        msg.textContent = `${t('echec')} : ${err.message}`;
        return;
      }
    }
    await vueDossiers(app);
  });
}
