/**
 * Vue d'une fiche université : les lignes en brouillon à valider, les lignes
 * validées, les autres. Chaque ligne s'édite en place, avec le lien source à
 * côté : valider, c'est comparer la ligne à la page, pas connaître l'université.
 */
import {
  getUniversite, listExigences, updateExigence, ajouterExigence, supprimerExigence, lancerFiche,
} from '../donnees.js';
import { t, t2, esc, dateRelative, fmtDate } from '../lang.js';

const TYPES = ['profil', 'test_admission', 'inscription_test', 'depot', 'formulaire',
  'essai', 'langue', 'aide', 'piece', 'entretien', 'autre'];
const ANNEES = ['-3', '-2', '-1', '0', '1'];
const EVENEMENTS = ['', 'decision', 'offre_ferme', 'admission'];
const DATES_EXIGEES = new Set(['test_admission', 'inscription_test', 'depot', 'formulaire', 'aide']);

const opt = (val, label, cur) => `<option value="${esc(val)}"${String(val) === String(cur ?? '') ? ' selected' : ''}>${esc(label)}</option>`;

/** Résumé d'une ligne, fermé. */
function resume(e) {
  return `
    <div class="exi-resume">
      <span class="ms-tag">${esc(t2('types', e.type))}</span>
      <span class="exi-resume__libelle">${esc(e.libelle)}</span>
      <span class="exi-resume__date">${esc(dateRelative(e))}</span>
      <span class="exi-conf exi-conf--${esc(e.confiance ?? 'ambigu')}">${esc(t2('confiances', e.confiance ?? 'ambigu'))}</span>
      ${e.source_url
        ? `<a class="exi-source" href="${esc(e.source_url)}" target="_blank" rel="noopener">${esc(t('ouvrirSource'))}</a>`
        : `<span class="exi-source exi-source--absente">${esc(t('sansSource'))}</span>`}
    </div>`;
}

/** Formulaire d'une ligne, ouvert. */
function formulaire(e) {
  const ch = (k) => esc(t2('champs', k));
  return `
    <div class="exi-form">
      <label><span>${ch('type')}</span>
        <select name="type">${TYPES.map((k) => opt(k, t2('types', k), e.type)).join('')}</select></label>
      <label class="exi-form__large"><span>${ch('libelle')}</span>
        <input name="libelle" value="${esc(e.libelle ?? '')}" required></label>
      <label class="exi-form__full"><span>${ch('consigne')}</span>
        <textarea name="consigne" rows="3">${esc(e.consigne ?? '')}</textarea></label>
      <label><span>${ch('longueur')}</span><input name="longueur" value="${esc(e.longueur ?? '')}"></label>
      <label><span>${ch('regime')}</span>
        <select name="regime">${['envisagee', 'retenue'].map((k) => opt(k, t2('regimes', k), e.regime)).join('')}</select></label>
      <label><span>${ch('y')}</span>
        <select name="y">${opt('', '—', e.y ?? '')}${ANNEES.map((k) => opt(k, t2('annees', k), e.y)).join('')}</select></label>
      <label><span>${ch('m')}</span><input name="m" type="number" min="1" max="12" value="${e.m ?? ''}"></label>
      <label><span>${ch('d')}</span><input name="d" type="number" min="1" max="31" value="${e.d ?? ''}"></label>
      <label><span>${ch('fin_m')}</span><input name="fin_m" type="number" min="1" max="12" value="${e.fin_m ?? ''}"></label>
      <label><span>${ch('relatif_a')}</span>
        <select name="relatif_a">${EVENEMENTS.map((k) => opt(k, t2('evenements', k), e.relatif_a ?? '')).join('')}</select></label>
      <label><span>${ch('delai_jours')}</span><input name="delai_jours" type="number" value="${e.delai_jours ?? ''}"></label>
      <label><span>${ch('duree_jours')}</span><input name="duree_jours" type="number" value="${e.duree_jours ?? ''}"></label>
      <label class="exi-form__full"><span>${ch('source_url')}</span>
        <input name="source_url" type="url" value="${esc(e.source_url ?? '')}"></label>
      <label><span>${ch('millesime')}</span><input name="millesime" value="${esc(e.millesime ?? '')}"></label>
      <label><span>${ch('verifie_le')}</span><input name="verifie_le" type="date" value="${esc(e.verifie_le ?? '')}"></label>
      ${e.note_ia ? `<p class="exi-note exi-form__full"><b>${esc(t('noteIa'))}.</b> ${esc(e.note_ia)}</p>` : ''}
    </div>`;
}

function ligne(e, ouverte) {
  const brouillon = e.statut === 'brouillon';
  return `
    <li class="exi exi--${esc(e.statut)}${ouverte ? ' is-open' : ''}" data-id="${esc(e.id)}">
      ${resume(e)}
      <div class="exi-corps"${ouverte ? '' : ' hidden'}>
        ${formulaire(e)}
        <div class="exi-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-act="save">${esc(t('enregistrer'))}</button>
          ${brouillon || e.statut === 'perimee'
            ? `<button type="button" class="btn btn--primary btn--sm" data-act="valider">${esc(t('valider'))}</button>` : ''}
          ${brouillon
            ? `<button type="button" class="btn btn--secondary btn--sm" data-act="rejeter">${esc(t('rejeter'))}</button>` : ''}
          ${e.statut === 'validee'
            ? `<button type="button" class="btn btn--secondary btn--sm" data-act="perimer">${esc(t('perimer'))}</button>` : ''}
          <button type="button" class="exi-del" data-act="del">${esc(t('supprimer'))}</button>
          <span class="fiche-msg" data-el="msg"></span>
        </div>
      </div>
    </li>`;
}

function lireFormulaire(li) {
  const f = li.querySelector('.exi-corps');
  const v = (n) => f.querySelector(`[name=${n}]`).value.trim();
  const num = (n) => (v(n) === '' ? null : Number(v(n)));
  return {
    type: v('type'),
    libelle: v('libelle'),
    consigne: v('consigne') || null,
    longueur: v('longueur') || null,
    regime: v('regime'),
    y: num('y'), m: num('m'), d: num('d'), fin_m: num('fin_m'),
    relatif_a: v('relatif_a') || null,
    delai_jours: num('delai_jours'),
    duree_jours: num('duree_jours'),
    source_url: v('source_url') || null,
    millesime: v('millesime') || null,
    verifie_le: v('verifie_le') || null,
  };
}

/** Contrôle côté navigateur, avant le serveur, pour un message immédiat. */
function manque(champs) {
  const pb = [];
  if (!champs.source_url) pb.push(t2('champs', 'source_url'));
  if (!champs.millesime) pb.push(t2('champs', 'millesime'));
  if (!champs.verifie_le) pb.push(t2('champs', 'verifie_le'));
  if (DATES_EXIGEES.has(champs.type)
      && !((champs.y != null && champs.m != null && champs.d != null)
           || (champs.relatif_a && champs.delai_jours != null))) {
    pb.push(`${t2('champs', 'y')} / ${t2('champs', 'm')} / ${t2('champs', 'd')}`);
  }
  return pb;
}

export async function vueUniversite(app, id) {
  const render = async () => {
    const [u, exigences] = await Promise.all([getUniversite(id), listExigences(id)]);
    const par = (s) => exigences.filter((e) => e.statut === s);
    const brouillons = par('brouillon');
    const validees = par('validee');
    const autres = exigences.filter((e) => e.statut === 'perimee' || e.statut === 'rejetee');

    app.innerHTML = `
      <div class="portal__inner">
        <p class="moteur-retour"><a href="/moteur">← ${esc(t('retourFiches'))}</a></p>
        <div class="dossier-head">
          <div class="dossier-head__who">
            <span class="label">${esc(t('fiches'))}</span>
            <h1>${esc(u.etablissement)}${u.cursus ? ` <span class="moteur-cursus">${esc(u.cursus)}</span>` : ''}</h1>
            <span class="meta">${esc(u.pays)}${u.domaine ? ` · ${esc(u.domaine)}` : ''}${
              u.fiche_recherchee_le ? ` · ${esc(t('colRecherche').toLowerCase())} ${esc(fmtDate(u.fiche_recherchee_le))}` : ''}</span>
          </div>
          <div class="portal-actions">
            <button class="btn btn--secondary btn--sm" id="relancer">${esc(t('relancer'))}</button>
            <button class="btn btn--secondary btn--sm" id="ajouter">${esc(t('ajouter'))}</button>
          </div>
        </div>
        <p class="fiche-msg" id="msg-fiche"></p>

        ${u.note_fiche ? `<div class="blk-warn"><strong>${esc(t('noteFiche'))}.</strong> ${esc(u.note_fiche)}</div>` : ''}

        <h2 class="section-title">${esc(t('brouillons'))} <span class="count">${brouillons.length}</span></h2>
        <p class="moteur-intro">${esc(t('brouillonsIntro'))}</p>
        <ul class="exi-list" data-groupe="brouillon">
          ${brouillons.length ? brouillons.map((e) => ligne(e, true)).join('') : `<li class="empty-state">${esc(t('aucunBrouillon'))}</li>`}
        </ul>

        <h2 class="section-title">${esc(t('valideesTitre'))} <span class="count">${validees.length}</span></h2>
        <ul class="exi-list" data-groupe="validee">
          ${validees.length ? validees.map((e) => ligne(e, false)).join('') : `<li class="empty-state">${esc(t('aucuneValidee'))}</li>`}
        </ul>

        ${autres.length ? `
          <details class="moteur-details">
            <summary>${esc(t('autres'))} · ${autres.length}</summary>
            <ul class="exi-list">${autres.map((e) => ligne(e, false)).join('')}</ul>
          </details>` : ''}
      </div>`;

    const msgFiche = document.getElementById('msg-fiche');

    document.getElementById('relancer').addEventListener('click', async (ev) => {
      if (brouillons.length && !confirm(t('relancerConfirm'))) return;
      ev.currentTarget.disabled = true;
      msgFiche.textContent = t('rechercheEnCours');
      try {
        const r = await lancerFiche({ universite_id: id });
        msgFiche.textContent = t('rechercheFaite')(r.inserees);
        await render();
      } catch (err) {
        ev.currentTarget.disabled = false;
        msgFiche.textContent = `${t('echec')} : ${err.message}`;
      }
    });

    document.getElementById('ajouter').addEventListener('click', async () => {
      try {
        await ajouterExigence({
          universite_id: id, type: 'autre', libelle: '…', regime: 'retenue',
          statut: 'brouillon', confiance: 'trouve',
          millesime: u.millesime ?? null, verifie_le: new Date().toISOString().slice(0, 10),
        });
        await render();
        app.querySelector('[data-groupe=brouillon] .exi:last-child [name=libelle]')?.focus();
      } catch (err) {
        msgFiche.textContent = `${t('echec')} : ${err.message}`;
      }
    });

    app.querySelectorAll('.exi').forEach((li) => {
      const idLigne = li.dataset.id;
      const corps = li.querySelector('.exi-corps');
      const msg = li.querySelector('[data-el=msg]');

      li.querySelector('.exi-resume').addEventListener('click', (ev) => {
        if (ev.target.closest('a')) return;
        corps.hidden = !corps.hidden;
        li.classList.toggle('is-open', !corps.hidden);
      });

      const agir = async (fn, apres = true) => {
        li.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        try {
          await fn();
          if (apres) await render();
        } catch (err) {
          msg.textContent = `${t('echec')} : ${err.message}`;
          li.querySelectorAll('button').forEach((b) => { b.disabled = false; });
        }
      };

      li.querySelector('[data-act=save]').addEventListener('click', () =>
        agir(async () => {
          await updateExigence(idLigne, lireFormulaire(li));
          msg.textContent = t('enregistre');
        }, false));

      li.querySelector('[data-act=valider]')?.addEventListener('click', () => {
        const champs = lireFormulaire(li);
        const pb = manque(champs);
        if (pb.length) { msg.textContent = `${t('echec')} : ${pb.join(', ')}`; return; }
        agir(() => updateExigence(idLigne, { ...champs, statut: 'validee' }));
      });

      li.querySelector('[data-act=rejeter]')?.addEventListener('click', () =>
        agir(() => updateExigence(idLigne, { statut: 'rejetee' })));

      li.querySelector('[data-act=perimer]')?.addEventListener('click', () =>
        agir(() => updateExigence(idLigne, { statut: 'perimee' })));

      li.querySelector('[data-act=del]').addEventListener('click', () => {
        if (!confirm(t('supprimerConfirm'))) return;
        agir(() => supprimerExigence(idLigne));
      });
    });
  };

  await render();
}
