/**
 * Intégrer un compte rendu : l'entrée du moteur. On colle le message d'un
 * parent, ses notes après un appel ou le message d'un prospect ; le modèle en
 * tire une proposition ; on coche, on corrige, on applique ; puis on génère
 * les notes qui en découlent. Rien ne bouge en base avant « Appliquer ».
 */
import {
  listStudents, getStudent, createStudent, updateStudent, listCibles, addCible, updateCible,
  synchroniser, getTaches, updateTache, analyserCompteRendu, marquerApplique, ajouterDonneesEleve,
  genererLivrable, listLivrablesEleve, updateLivrable, listAcces, lienGmail,
} from '../donnees.js';
import { MILESTONES } from '../../portail/milestones.js';
import { CLASSES, terminaleYearFromClass, currentSchoolYear } from '../../portail/calendrier.js';
import { FILIERES } from '../socle.js';
import { t, t2, esc, fmtIso } from '../lang.js';
import { nav } from './nav.js';

const SOURCES = ['parent', 'appel', 'prospect'];
const NOTES = [
  { code: 'NOTE-SITUATION', cle: 'crNoteSituation', email: false },
  { code: 'REPONSE-PARENT', cle: 'crReponseParent', email: true },
  { code: 'NOTE-PROSPECT', cle: 'crNoteProspect', email: true },
  { code: 'NOTE-RESUME-PARENTS', cle: 'crNoteResume', email: false, publiable: true },
];

export async function vueIntegrer(app, dossierId) {
  const students = await listStudents();
  let etat = { compteRenduId: null, proposition: null, studentId: dossierId ?? '', source: 'parent', texte: '' };

  const rendre = () => {
    app.innerHTML = `
      <div class="portal__inner">
        ${nav('integrer')}
        <div class="admin-bar"><h1>${esc(t('crTitre'))}</h1></div>
        <p class="moteur-intro">${esc(t('crIntro'))}</p>

        <form class="cr-form" id="cr-form">
          <div class="cr-form__ligne">
            <label class="portal-field"><span>${esc(t('crDossier'))}</span>
              <select name="student_id">
                <option value="">${esc(t('crNouveau'))}</option>
                ${students.map((s) => `<option value="${s.id}"${s.id === etat.studentId ? ' selected' : ''}>${esc(s.first_name)} ${esc(s.last_name)}</option>`).join('')}
              </select></label>
            <label class="portal-field"><span>${esc(t('crSource'))}</span>
              <select name="source">${SOURCES.map((s) => `<option value="${s}"${s === etat.source ? ' selected' : ''}>${esc(t2('crSources', s))}</option>`).join('')}</select></label>
          </div>
          <label class="portal-field"><span>${esc(t('crTexte'))}</span>
            <textarea name="texte" rows="12" placeholder="${esc(t('crPlaceholder'))}">${esc(etat.texte)}</textarea></label>
          <div class="portal-actions">
            <button type="submit" class="btn btn--primary btn--sm">${esc(t('crAnalyser'))}</button>
            <span class="fiche-msg" data-el="msg"></span>
          </div>
        </form>

        <div id="cr-proposition"></div>
        <div id="cr-notes"></div>
      </div>`;

    const form = document.getElementById('cr-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = form.querySelector('[data-el=msg]');
      const btn = form.querySelector('button[type=submit]');
      etat.studentId = form.student_id.value;
      etat.source = form.source.value;
      etat.texte = form.texte.value.trim();
      if (etat.texte.length < 20) { msg.textContent = t('crTropCourt'); return; }
      btn.disabled = true; msg.textContent = t('crAnalyseEnCours');
      try {
        const r = await analyserCompteRendu({
          texte: etat.texte, source: etat.source, student_id: etat.studentId || null,
          socle: MILESTONES.map((m) => ({ id: m.id, title: m.title, kind: m.kind })),
        });
        etat.compteRenduId = r.id; etat.proposition = r.proposition;
        msg.textContent = '';
        rendreProposition();
      } catch (err) {
        msg.textContent = `${t('echec')} : ${err.message}`;
      } finally { btn.disabled = false; }
    });

    if (etat.proposition) rendreProposition();
  };

  const rendreProposition = () => {
    const p = etat.proposition;
    const d = p.dossier ?? {};
    const zone = document.getElementById('cr-proposition');
    const existant = !!etat.studentId;
    const annee = d.terminale_year || (d.current_class ? terminaleYearFromClass(d.current_class, currentSchoolYear()) : '');

    const liste = (items, cls = '') => (items?.length
      ? `<ul class="cr-liste ${cls}">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
      : `<p class="journal-empty">${esc(t('crRien'))}</p>`);

    zone.innerHTML = `
      <section class="cr-bloc">
        <h2 class="section-title">${esc(t('crResume'))}</h2>
        <p class="cr-resume">${esc(p.resume ?? '')}</p>
        ${p.ambiguites?.length ? `<div class="blk-warn"><strong>${esc(t('crAmbiguites'))}.</strong> ${p.ambiguites.map(esc).join(' · ')}</div>` : ''}
      </section>

      <section class="cr-bloc">
        <h2 class="section-title">${esc(existant ? t('crDossierMaj') : t('crDossierCreer'))}</h2>
        <div class="fiche-nouvelle__grid" id="cr-dossier">
          <label class="portal-field"><span>${esc(t('prenom'))}</span><input name="first_name" value="${esc(d.first_name ?? '')}"${existant ? ' disabled' : ' required'}></label>
          <label class="portal-field"><span>${esc(t('nom'))}</span><input name="last_name" value="${esc(d.last_name ?? '')}"${existant ? ' disabled' : ' required'}></label>
          <label class="portal-field"><span>${esc(t('classeActuelle'))}</span>
            <select name="current_class"${existant ? ' disabled' : ''}>
              <option value="">—</option>
              ${CLASSES.filter((c) => c.key !== 'apres').map((c) => `<option value="${c.key}"${c.key === d.current_class ? ' selected' : ''}>${esc(c.label)}</option>`).join('')}
            </select></label>
          <label class="portal-field"><span>${esc(t('crAnneeTerminale'))}</span><input name="terminale_year" value="${esc(String(annee ?? ''))}"${existant ? ' disabled' : ''}></label>
          <label class="portal-field"><span>${esc(t('lycee'))}</span><input name="school" value="${esc(d.school ?? '')}"></label>
          <label class="portal-field"><span>${esc(t('ville'))}</span><input name="city" value="${esc(d.city ?? '')}"></label>
          <div class="portal-field"><span>${esc(t('filieresLabel'))}</span>
            ${FILIERES.map((f) => `<label class="options-bloc__item"><input type="checkbox" name="tracks" value="${f}"${(d.tracks ?? []).includes(f) ? ' checked' : ''}> ${esc(t2('filieres', f))}</label>`).join('')}</div>
          <label class="portal-field"><span>${esc(t('crContact'))}</span><input name="contact" value="${esc([d.contact_nom, d.contact_email].filter(Boolean).join(' · '))}" disabled></label>
        </div>
      </section>

      <section class="cr-bloc">
        <h2 class="section-title">${esc(t('crUniversites'))} <span class="count">${(p.universites ?? []).length}</span></h2>
        ${(p.universites ?? []).length ? `<ul class="cr-coches" id="cr-universites">${p.universites.map((u, i) => `
          <li class="cr-coche cr-coche--${esc(u.statut)}">
            <label><input type="checkbox" name="u${i}"${u.statut === 'reconnue' ? ' checked' : ''}${u.statut !== 'reconnue' ? ' disabled' : ''}>
              <b>${esc(u.nom)}${u.cursus ? ` — ${esc(u.cursus)}` : ''}</b> <span class="sub">${esc(u.pays ?? '')}</span></label>
            <span class="cr-statut">${esc(t2('crStatutsU', u.statut))}</span>
            ${u.statut === 'reconnue' ? `
              <select name="regime${i}"><option value="envisagee"${u.regime !== 'retenue' ? ' selected' : ''}>${esc(t2('regimes', 'envisagee'))}</option><option value="retenue"${u.regime === 'retenue' ? ' selected' : ''}>${esc(t2('regimes', 'retenue'))}</option></select>
              <select name="tour${i}"><option value="">—</option><option value="anticipe"${u.tour === 'anticipe' ? ' selected' : ''}>${esc(t2('crTours', 'anticipe'))}</option><option value="ordinaire"${u.tour === 'ordinaire' ? ' selected' : ''}>${esc(t2('crTours', 'ordinaire'))}</option></select>` : ''}
            ${u.statut === 'inconnue' ? `<a class="cr-lien" href="/moteur?vue=fiches&nouvelle=${encodeURIComponent(u.nom)}">${esc(t('crLancerFiche'))}</a>` : ''}
            ${u.commentaire ? `<p class="sub">${esc(u.commentaire)}</p>` : ''}
          </li>`).join('')}</ul>` : `<p class="journal-empty">${esc(t('crRien'))}</p>`}
      </section>

      <section class="cr-bloc">
        <h2 class="section-title">${esc(t('crFaits'))} <span class="count">${(p.faits ?? []).length}</span></h2>
        ${(p.faits ?? []).length ? `<ul class="cr-coches" id="cr-faits">${p.faits.map((f, i) => `
          <li class="cr-coche">
            <label><input type="checkbox" name="f${i}"${f.milestone_id || f.tache_id ? ' checked' : ' disabled'}>
              <b>${esc(f.libelle)}</b></label>
            <span class="cr-statut">${esc(t2('crStatutsF', f.statut))}${f.date ? ` · ${esc(fmtIso(f.date))}` : ''}${f.milestone_id ? ` · ${esc(f.milestone_id)}` : ''}${!f.milestone_id && !f.tache_id ? ` · ${esc(t('crSansEtape'))}` : ''}</span>
            ${f.note ? `<p class="sub">${esc(f.note)}</p>` : ''}
          </li>`).join('')}</ul>` : `<p class="journal-empty">${esc(t('crRien'))}</p>`}
      </section>

      <div class="cr-deux">
        <section class="cr-bloc"><h2 class="section-title">${esc(t('crSouhaits'))}</h2>${liste(p.souhaits)}</section>
        <section class="cr-bloc"><h2 class="section-title">${esc(t('crNotesPrivees'))}</h2>${liste(p.notes_privees)}</section>
        <section class="cr-bloc"><h2 class="section-title">${esc(t('crQuestions'))}</h2>${liste(p.questions_famille)}</section>
        <section class="cr-bloc"><h2 class="section-title">${esc(t('crVerifications'))}</h2>${liste(p.verifications_carmine)}</section>
      </div>

      <div class="portal-actions cr-appliquer">
        <button type="button" class="btn btn--primary" id="cr-appliquer">${esc(t('crAppliquer'))}</button>
        <span class="fiche-msg" id="cr-msg"></span>
      </div>`;

    document.getElementById('cr-appliquer').addEventListener('click', appliquer);
    document.getElementById('cr-notes').innerHTML = '';
  };

  const appliquer = async (ev) => {
    const btn = ev.currentTarget; const msg = document.getElementById('cr-msg');
    btn.disabled = true; msg.textContent = t('crApplicationEnCours');
    const p = etat.proposition;
    const bloc = document.getElementById('cr-dossier');
    const val = (n) => bloc.querySelector(`[name=${n}]`)?.value?.trim() ?? '';
    const tracks = [...bloc.querySelectorAll('[name=tracks]:checked')].map((x) => x.value);
    try {
      let student;
      if (etat.studentId) {
        student = await getStudent(etat.studentId);
        const maj = {};
        if (val('school') && val('school') !== (student.school ?? '')) maj.school = val('school');
        if (val('city') && val('city') !== (student.city ?? '')) maj.city = val('city');
        if (tracks.length && tracks.join() !== (student.tracks ?? []).join()) maj.tracks = tracks;
        if (Object.keys(maj).length) { await updateStudent(student.id, maj); Object.assign(student, maj); }
      } else {
        if (!val('first_name') || !val('last_name') || !val('current_class')) throw new Error(t('crDossierIncomplet'));
        student = await createStudent({
          first_name: val('first_name'), last_name: val('last_name'),
          current_class: val('current_class'), entry_class: val('current_class'),
          terminale_year: Number(val('terminale_year')) || terminaleYearFromClass(val('current_class'), currentSchoolYear()),
          tracks: tracks.length ? tracks : ['us', 'uk'], school: val('school') || null, city: val('city') || null,
        });
        etat.studentId = student.id;
      }

      // Universités reconnues et cochées.
      const dejaCibles = new Set((await listCibles(student.id)).map((c) => c.universite_id));
      const lu = document.getElementById('cr-universites');
      let ordre = dejaCibles.size;
      for (const [i, u] of (p.universites ?? []).entries()) {
        if (u.statut !== 'reconnue' || !lu?.querySelector(`[name=u${i}]`)?.checked) continue;
        if (!dejaCibles.has(u.universite_id)) await addCible(student.id, u.universite_id, ordre++);
        const regime = lu.querySelector(`[name=regime${i}]`)?.value;
        const tour = lu.querySelector(`[name=tour${i}]`)?.value || null;
        await updateCible(student.id, u.universite_id, { retenue: regime === 'retenue', tour });
      }

      // Le calendrier, puis les faits cochés dessus.
      await synchroniser(student);
      const taches = await getTaches(student.id);
      const lf = document.getElementById('cr-faits');
      for (const [i, f] of (p.faits ?? []).entries()) {
        if (!lf?.querySelector(`[name=f${i}]`)?.checked) continue;
        const x = (f.tache_id && taches.find((y) => y.id === f.tache_id))
          || (f.milestone_id && taches.find((y) => y.milestone_id === f.milestone_id && y.origine === 'socle'));
        if (!x) continue;
        const maj = { statut: f.statut, attribuee: true };
        if (f.note) maj.private_note = [x.private_note, f.note].filter(Boolean).join('\n');
        await updateTache(x.id, maj);
      }

      // Souhaits, notes, questions : gardés avec le dossier, datés.
      await ajouterDonneesEleve(student.id, 'comptes_rendus', {
        date: new Date().toISOString().slice(0, 10), source: etat.source,
        souhaits: p.souhaits ?? [], notes_privees: p.notes_privees ?? [],
        questions_famille: p.questions_famille ?? [], verifications_carmine: p.verifications_carmine ?? [],
        contact: [p.dossier?.contact_nom, p.dossier?.contact_email].filter(Boolean).join(' · '),
      });
      await marquerApplique(etat.compteRenduId, student.id);
      msg.innerHTML = `${esc(t('crApplique'))} <a href="/moteur?dossier=${student.id}">${esc(t('crOuvrirDossier'))}</a>`;
      await rendreNotes(student);
    } catch (err) {
      msg.textContent = `${t('echec')} : ${err.message}`;
      btn.disabled = false;
    }
  };

  const rendreNotes = async (student) => {
    const zone = document.getElementById('cr-notes');
    const livrables = await listLivrablesEleve(student.id);
    const acces = await listAcces(student.id).catch(() => []);
    const emailsParents = acces.filter((a) => a.role === 'parent').map((a) => a.email);
    const contactMail = (etat.proposition?.dossier?.contact_email ?? '').trim();
    const dest = contactMail ? [contactMail] : emailsParents;

    zone.innerHTML = `
      <section class="cr-bloc">
        <h2 class="section-title">${esc(t('crNotesTitre'))}</h2>
        <p class="moteur-intro">${esc(t('crNotesIntro'))}</p>
        <div class="cr-notes">${NOTES.map((n) => {
          const l = livrables.filter((x) => x.trame_code === n.code).sort((a, b) => (b.genere_le ?? '').localeCompare(a.genere_le ?? ''))[0];
          return `<div class="cr-note" data-code="${n.code}">
            <h4>${esc(t(n.cle))}</h4>
            ${l ? `
              ${l.objet ? `<p class="cr-objet"><b>${esc(t('crObjet'))}</b> ${esc(l.objet)}</p>` : ''}
              <div class="portal-field"><textarea data-el="texte" rows="14">${esc(l.contenu ?? '')}</textarea></div>
              <div class="exi-actions">
                <button type="button" class="btn btn--secondary btn--sm" data-act="save">${esc(t('enregistrer'))}</button>
                ${n.email ? `<a class="btn btn--primary btn--sm" data-act="gmail" href="#" target="_blank" rel="noopener">${esc(t('crOuvrirGmail'))}</a>` : ''}
                ${n.publiable && l.statut !== 'publie' ? `<button type="button" class="btn btn--primary btn--sm" data-act="publier">${esc(t('publierFamille'))}</button>` : ''}
                <button type="button" class="exi-del" data-act="regen">${esc(t('regenerer'))}</button>
                <span class="fiche-msg" data-el="msg"></span>
              </div>`
            : `<button type="button" class="btn btn--primary btn--sm" data-act="regen">${esc(t('crGenerer'))}</button>
               <span class="fiche-msg" data-el="msg"></span>`}
          </div>`; }).join('')}</div>
      </section>`;

    zone.querySelectorAll('.cr-note').forEach((bloc) => {
      const code = bloc.dataset.code;
      const l = livrables.filter((x) => x.trame_code === code).sort((a, b) => (b.genere_le ?? '').localeCompare(a.genere_le ?? ''))[0];
      const msg = bloc.querySelector('[data-el=msg]');
      const texte = () => bloc.querySelector('[data-el=texte]')?.value ?? '';
      bloc.querySelector('[data-act=regen]')?.addEventListener('click', async (ev) => {
        ev.currentTarget.disabled = true; msg.textContent = t('redactionEnCours');
        try { await genererLivrable({ student_id: student.id, trame_code: code, compte_rendu_id: etat.compteRenduId }); await rendreNotes(student); }
        catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; ev.currentTarget.disabled = false; }
      });
      bloc.querySelector('[data-act=save]')?.addEventListener('click', async () => {
        try { await updateLivrable(l.id, { contenu: texte(), statut: l.statut === 'publie' ? 'publie' : 'relu' }); msg.textContent = t('enregistre'); }
        catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; }
      });
      bloc.querySelector('[data-act=publier]')?.addEventListener('click', async () => {
        try { await updateLivrable(l.id, { contenu: texte(), statut: 'publie' }); await rendreNotes(student); }
        catch (err) { msg.textContent = `${t('echec')} : ${err.message}`; }
      });
      const gmail = bloc.querySelector('[data-act=gmail]');
      if (gmail && l) {
        const maj = () => { gmail.href = lienGmail({ to: dest.join(','), objet: l.objet ?? l.titre, corps: texte() }); };
        maj(); bloc.querySelector('[data-el=texte]')?.addEventListener('input', maj);
      }
    });
    zone.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  rendre();
}
