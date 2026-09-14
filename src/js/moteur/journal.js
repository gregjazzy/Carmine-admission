/**
 * Journal de suivi d'une étape : lectures annotées, carnet de projet, banque
 * d'essais, journal de contacts. Repris de l'ancien portail (ui.js,
 * wireJournal) pour les deux panneaux du moteur, admin et famille. Les
 * libellés viennent du dictionnaire de l'ancien portail, qui les possède
 * déjà dans les deux langues.
 */
import { supabase } from './donnees.js';
import { initLang as initLangAncien, t as tA, t2 as t2A } from '../portail/lang.js';
import { esc } from './lang.js';

let init = false;
function pret() { if (!init) { initLangAncien(); init = true; } }
export const tAncien = (k) => { pret(); return tA(k); };
export const t2Ancien = (g, k) => { pret(); return t2A(g, k); };

async function listItems(studentId, milestoneId) {
  const { data, error } = await supabase.from('carmine_suivi_items').select('*')
    .eq('student_id', studentId).eq('milestone_id', milestoneId).order('ordre').order('created_at');
  if (error) throw error;
  return data ?? [];
}
async function addItem(fields) {
  const { data: { session } } = await supabase.auth.getSession();
  const { error } = await supabase.from('carmine_suivi_items').insert({ ...fields, propose_par: session?.user?.id ?? null });
  if (error) throw error;
}
async function updateItem(id, fields) {
  const { error } = await supabase.from('carmine_suivi_items').update(fields).eq('id', id);
  if (error) throw error;
}
async function removeItem(id) {
  const { error } = await supabase.from('carmine_suivi_items').delete().eq('id', id);
  if (error) throw error;
}

const CHAMPS = ['retenu', 'desaccord', 'question'];
const annote = (it) => CHAMPS.some((c) => (it[c] || '').trim());

/** Branche le journal dans une zone du panneau. `kind` : lecture, projet, essai, contact. */
export async function brancherJournal(zone, { studentId, milestoneId, kind }) {
  if (!zone) return;
  pret();
  const rendre = async () => {
    let items = [];
    try { items = await listItems(studentId, milestoneId); }
    catch (err) { zone.innerHTML = `<p class="journal-empty">${esc(err.message)}</p>`; return; }
    const faits = items.filter(annote).length;
    zone.innerHTML = `
      <div class="journal-head"><h4>${esc(t2A('journalTitles', kind))}</h4>
        <span class="journal-count">${items.length ? esc(tA('journalCount')(faits, items.length)) : ''}</span></div>
      <p class="journal-intro">${esc(t2A('journalIntros', kind))}</p>
      ${items.length ? `<ul class="journal-list">${items.map((it) => `
        <li class="journal-item${annote(it) ? ' is-done' : ''}" data-id="${esc(it.id)}">
          <details${annote(it) ? '' : ' open'}>
            <summary><span class="journal-item__title">${esc(it.titre)}</span>
              ${it.reference ? `<span class="journal-item__ref">${esc(it.reference)}</span>` : ''}
              <span class="journal-item__state">${esc(annote(it) ? tA('journalAnnotated') : tA('journalToAnnotate'))}</span></summary>
            <div class="journal-fields">
              ${CHAMPS.map((c) => `<label><span>${esc(t2A('journalFields', c))}</span>
                <textarea rows="2" data-champ="${c}" placeholder="${esc(t2A('journalHints', c))}">${esc(it[c] || '')}</textarea></label>`).join('')}
              <div class="journal-actions">
                <button class="btn btn--primary btn--sm" data-act="save">${esc(tA('save'))}</button>
                <button class="btn btn--secondary btn--sm" data-act="del">${esc(tA('journalRemove'))}</button>
                <span class="journal-msg" data-el="msg"></span>
              </div>
            </div>
          </details>
        </li>`).join('')}</ul>` : `<p class="journal-empty">${esc(t2A('journalEmpty', kind))}</p>`}
      <form class="journal-add" data-el="add">
        <input required data-el="titre" placeholder="${esc(t2A('journalNew', kind))}">
        <input data-el="reference" placeholder="${esc(tA('journalRefHint'))}">
        <button type="submit" class="btn btn--secondary btn--sm">${esc(tA('journalAdd'))}</button>
      </form>`;

    zone.querySelectorAll('.journal-item').forEach((li) => {
      const id = li.dataset.id; const msg = li.querySelector('[data-el=msg]');
      const lire = () => { const maj = {}; li.querySelectorAll('[data-champ]').forEach((z) => { maj[z.dataset.champ] = z.value.trim() || null; }); maj.statut = CHAMPS.some((c) => maj[c]) ? 'fait' : 'en_cours'; return maj; };
      li.querySelector('[data-act=save]').addEventListener('click', async (e) => {
        e.preventDefault(); const btn = e.currentTarget; btn.disabled = true;
        try { await updateItem(id, lire()); msg.textContent = tA('saved'); await rendre(); }
        catch (err) { msg.textContent = `${tA('failed')} : ${err.message}`; btn.disabled = false; }
      });
      li.querySelectorAll('[data-champ]').forEach((z) => {
        let initiale = z.value;
        z.addEventListener('blur', async () => {
          if (z.value === initiale) return; initiale = z.value;
          try { const maj = lire(); await updateItem(id, maj); msg.textContent = tA('savedAuto'); li.classList.toggle('is-done', maj.statut === 'fait'); }
          catch (err) { msg.textContent = `${tA('failed')} : ${err.message}`; }
        });
      });
      li.querySelector('[data-act=del]').addEventListener('click', async (e) => {
        e.preventDefault();
        try { await removeItem(id); await rendre(); } catch (err) { msg.textContent = `${tA('failed')} : ${err.message}`; }
      });
    });
    zone.querySelector('[data-el=add]').addEventListener('submit', async (e) => {
      e.preventDefault(); const form = e.currentTarget;
      const titre = form.querySelector('[data-el=titre]').value.trim(); if (!titre) return;
      const reference = form.querySelector('[data-el=reference]').value.trim() || null;
      try { await addItem({ student_id: studentId, milestone_id: milestoneId, type: kind, titre, reference }); await rendre(); }
      catch (err) { form.insertAdjacentHTML('beforeend', `<span class="journal-msg">${esc(err.message)}</span>`); }
    });
  };
  await rendre();
}

/* ── Souhaits d'universités de la famille ───────────────────── */

export async function getSouhaits(studentId) {
  const { data } = await supabase.from('carmine_donnees_eleve').select('donnees').eq('student_id', studentId).eq('rubrique', 'souhaits').maybeSingle();
  return Array.isArray(data?.donnees?.universites) ? data.donnees.universites : [];
}
export async function setSouhaits(studentId, universites) {
  const { data: { session } } = await supabase.auth.getSession();
  const { error } = await supabase.from('carmine_donnees_eleve')
    .upsert({ student_id: studentId, rubrique: 'souhaits', donnees: { universites }, saisi_par: session?.user?.id ?? null }, { onConflict: 'student_id,rubrique' });
  if (error) throw error;
}

const normaliser = (v) => String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** Bloc souhaits : la famille ajoute et retire ; l'administration lit, avec ce qui reste à documenter. */
export async function brancherSouhaits(zone, { studentId, admin, referentiel = [] }) {
  if (!zone) return;
  pret();
  const rendre = async () => {
    const souhaits = await getSouhaits(studentId).catch(() => []);
    const connus = referentiel.map((u) => normaliser(u.etablissement));
    const aDocumenter = (nom) => { const n = normaliser(nom); return n.length > 2 && !connus.some((c) => c.includes(n) || n.includes(c)); };
    const restants = admin ? souhaits.filter(aDocumenter).length : 0;
    zone.innerHTML = `
      <h4>${esc(tA('wishesTitle'))}</h4>
      <p class="journal-intro">${esc(tA(admin ? 'wishesIntroAdmin' : 'wishesIntro'))}</p>
      ${admin && restants ? `<p class="wish-todo">${esc(tA('wishesToDocument')(restants))}</p>` : ''}
      ${souhaits.length ? `<ul class="wish-list">${souhaits.map((n, i) => `
        <li${admin && aDocumenter(n) ? ' class="is-todo"' : ''}><span>${esc(n)}</span>
          ${admin && aDocumenter(n) ? `<a class="cr-lien" href="/moteur?vue=fiches&nouvelle=${encodeURIComponent(n)}">${esc(tA('journalAdd'))} → fiche</a>` : ''}
          <button type="button" class="wish-del" data-i="${i}" aria-label="${esc(tA('journalRemove'))}">&times;</button></li>`).join('')}</ul>`
        : `<p class="journal-empty">${esc(tA('wishesEmpty'))}</p>`}
      <form class="journal-add" data-el="add-wish">
        <input required data-el="wish" placeholder="${esc(tA('wishPlaceholder'))}">
        <button type="submit" class="btn btn--secondary btn--sm">${esc(tA('journalAdd'))}</button>
      </form>`;
    zone.querySelector('[data-el=add-wish]').addEventListener('submit', async (e) => {
      e.preventDefault(); const nom = zone.querySelector('[data-el=wish]').value.trim(); if (!nom) return;
      await setSouhaits(studentId, [...souhaits, nom]); await rendre();
    });
    zone.querySelectorAll('.wish-del').forEach((b) => b.addEventListener('click', async () => {
      await setSouhaits(studentId, souhaits.filter((_, i) => i !== Number(b.dataset.i))); await rendre();
    }));
  };
  await rendre();
}
