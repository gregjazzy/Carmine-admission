/**
 * Audience — ce que font les visiteurs une fois sur le site (page /audience,
 * administrateur seulement). Les lignes viennent de src/js/audience.js ; les
 * calculs sont dans audience-calcul.js.
 */
import supabase from '../supabase.js';
import { getProfile } from './data.js';
import {
  visites, rangs, chiffres, parSource, parPage, ENTONNOIRS, entonnoir, articlesVersCours,
  estPageCours, sansLecture, rendusGoogle, estPageGreg, formulaireDetail, estEtapeFormulaire, etape, CHAMPS,
} from './audience-calcul.js';
import { exclureCeNavigateur, MARQUE_EXCLUSION } from '../audience.js';
import '../../css/audience.css';

const app = document.getElementById('portal-app');
const params = new URLSearchParams(location.search);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nb = (n) => new Intl.NumberFormat('fr-FR').format(n);
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)} %` : '—');
const date = (iso) => new Date(iso).toLocaleString('fr-FR', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});
function temps(s) {
  if (s == null) return '—';
  s = Math.round(s);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m} min ${String(s % 60).padStart(2, '0')}` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
}
const ecart = (a, b) => temps((new Date(b) - new Date(a)) / 1000);


/* ── Données ─────────────────────────────────────────────────── */

const COLONNES = 'id, cree_le, visite, visiteur, type, page, provenance, cible, libelle, duree, profondeur, langue, appareil, fuseau';

/** Toutes les lignes, par paquets de 1 000 (plafond de l'API). */
async function charger(filtre) {
  const lignes = [];
  for (let de = 0; de < 100000; de += 1000) {
    let q = supabase.from('carmine_audience').select(COLONNES).order('id').range(de, de + 999);
    q = filtre(q);
    const { data, error } = await q;
    if (error) throw error;
    lignes.push(...data);
    if (data.length < 1000) break;
  }
  return lignes;
}

/** Navigateurs de Greg (src/js/audience.js, exclureCeNavigateur) : toutes leurs lignes sont écartées. */
async function visiteursExclus() {
  const { data, error } = await supabase.from('carmine_audience').select('visiteur').eq('cible', MARQUE_EXCLUSION);
  if (error) throw error;
  return new Set(data.map((l) => l.visiteur).filter(Boolean));
}

// Conservation : 25 mois au plus (supabase-audience.sql).
async function purger() {
  const limite = new Date();
  limite.setMonth(limite.getMonth() - 25);
  await supabase.from('carmine_audience').delete().lt('cree_le', limite.toISOString());
}

/* ── Rendu des morceaux ──────────────────────────────────────── */

function blocChiffres(c) {
  return `
    <div class="kpi-row">
      <div class="kpi"><b>${nb(c.visites)}</b><span>Visites</span></div>
      <div class="kpi"><b>${nb(c.visiteurs)}</b><span>Visiteurs</span></div>
      <div class="kpi"><b>${nb(c.pagesVues)}</b><span>Pages vues</span></div>
      <div class="kpi"><b>${nb(c.cours)}</b><span>Passés par la page cours</span></div>
      <div class="kpi kpi--zero"><b>${nb(c.formulaires)}</b><span>Formulaires envoyés</span></div>
      <div class="kpi"><b>${c.visites ? (c.taux * 100).toFixed(1).replace('.', ',') : '—'} %</b><span>Visites qui écrivent</span></div>
    </div>`;
}

function blocEntonnoirs(vs) {
  return `
    <div class="aud-funnels">
      ${ENTONNOIRS.map((def) => {
        const m = entonnoir(vs, def);
        const haut = m[0].n || 1;
        return `
          <div class="aud-funnel">
            <h3>${esc(def.nom)}</h3>
            ${m.map((x, i) => `
              <div class="aud-step">
                <div class="aud-step__top">
                  <span>${esc(x.nom)}</span>
                  <b>${nb(x.n)}${i ? ` <small>${pct(x.n, m[i - 1].n)}</small>` : ''}</b>
                </div>
                <span class="aud-bar"><i style="width:${(x.n / haut) * 100}%"></i></span>
              </div>`).join('')}
          </div>`;
      }).join('')}
    </div>`;
}

function blocFormulaire(vs) {
  const f = formulaireDetail(vs);
  if (!f.commence && !f.envoye) {
    return '<div class="empty-state">Personne n\'a encore touché au formulaire sur cette période (mesure champ par champ depuis le 23 oct. 2026).</div>';
  }
  const ligne = (nom, n, base) => `<tr><td>${esc(nom)}</td><td>${nb(n)}${base != null ? ` <span class="sub">${pct(n, base)}</span>` : ''}</td></tr>`;
  return `
    <table class="files-table aud-table">
      <tbody>
        ${ligne('Commence à remplir', f.commence)}
        ${ligne('Clique sur Envoyer', f.essai, f.commence)}
        ${ligne('Bloqué par un champ', f.bloque, f.essai)}
        ${ligne('Erreur d\'envoi', f.erreur, f.essai)}
        ${ligne('Formulaire envoyé', f.envoye, f.commence)}
      </tbody>
    </table>
    <div class="aud-scroll"><table class="files-table aud-table">
      <thead><tr><th>Champ</th><th>Touché</th><th>Rempli</th><th>A bloqué l'envoi</th><th>Dernier champ avant de partir</th></tr></thead>
      <tbody>${f.champs.map((c) => `
        <tr>
          <td>${esc(c.nom)}</td>
          <td>${nb(c.touche)}</td>
          <td>${nb(c.rempli)} <span class="sub">${pct(c.rempli, c.touche)}</span></td>
          <td>${nb(c.bloque)}</td>
          <td>${nb(c.partis)}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>`;
}

function blocSources(vs) {
  const lignes = parSource(vs);
  if (!lignes.length) return '';
  return `
    <table class="files-table aud-table">
      <thead><tr><th>Source</th><th>Visites</th><th>→ page cours</th><th>→ formulaire</th></tr></thead>
      <tbody>${lignes.map((s) => `
        <tr>
          <td><span class="aud-tag aud-tag--${esc(s.famille)}">${esc(s.nom)}</span></td>
          <td>${nb(s.visites)}</td>
          <td>${nb(s.cours)} <span class="sub">${pct(s.cours, s.visites)}</span></td>
          <td>${nb(s.formulaires)} <span class="sub">${pct(s.formulaires, s.visites)}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

const lienPage = (p) => `<a href="${esc(estPageGreg(p) ? `https://${p}` : p)}" target="_blank" rel="noopener">${esc(p)}</a>`;

function blocPages(vs) {
  const lignes = parPage(vs).slice(0, 60);
  if (!lignes.length) return '';
  return `
    <div class="aud-scroll"><table class="files-table aud-table">
      <thead><tr>
        <th>Page</th><th>Visites</th><th>Entrées</th><th>Temps moyen</th><th>Lu en moyenne</th>
        <th>→ page cours</th><th>→ formulaire</th>
      </tr></thead>
      <tbody>${lignes.map((p) => `
        <tr>
          <td class="aud-page">${lienPage(p.page)}</td>
          <td>${nb(p.visites)}</td>
          <td>${nb(p.entrees)}</td>
          <td>${temps(p.dureeMoy)}</td>
          <td>${p.lectureMoy == null ? '—' : `${Math.round(p.lectureMoy)} %`}</td>
          <td>${estPageCours(p.page) ? '—' : `${nb(p.versCours)} <span class="sub">${pct(p.versCours, p.visites)}</span>`}</td>
          <td>${nb(p.versFormulaire)} <span class="sub">${pct(p.versFormulaire, p.visites)}</span></td>
        </tr>`).join('')}
      </tbody>
    </table></div>`;
}

function blocArticlesCours(vs) {
  const lignes = articlesVersCours(vs).slice(0, 15);
  if (!lignes.length) return '<div class="empty-state">Aucun lecteur d\'article n\'est encore arrivé sur la page cours.</div>';
  return `
    <table class="files-table aud-table">
      <thead><tr><th>Article lu avant la page cours</th><th>Visites</th></tr></thead>
      <tbody>${lignes.map((x) => `<tr><td class="aud-page">${lienPage(x.page)}</td><td>${nb(x.n)}</td></tr>`).join('')}</tbody>
    </table>`;
}

/** Le parcours d'une visite, événement par événement. */
function parcours(v) {
  return `
    <ol class="aud-path">
      ${v.evenements.map((e) => {
        const t = ecart(v.debut, e.cree_le);
        if (e.type === 'vue') {
          const p = v.pages.find((x) => x.a === e.cree_le && x.page === e.page);
          const mesure = p && p.duree ? ` · ${temps(p.duree)}, lu à ${p.profondeur} %` : '';
          return `<li class="aud-ev aud-ev--vue"><span class="aud-t">${t}</span>${lienPage(e.page)}<span class="sub-in">${mesure}</span></li>`;
        }
        if (e.type === 'clic' && estEtapeFormulaire(e.cible)) {
          const x = etape(e.cible);
          const champ = (CHAMPS.find(([k]) => k === x.champ) || [, x.champ])[1];
          const texte = {
            champ: `Formulaire : touche « ${champ} »`,
            rempli: `Formulaire : remplit « ${champ} »`,
            bloque: `Formulaire : envoi bloqué par « ${champ} »`,
            essai: 'Formulaire : clique sur Envoyer',
            erreur: 'Formulaire : erreur d\'envoi',
          }[x.quoi] || e.cible;
          return `<li class="aud-ev aud-ev--clic"><span class="aud-t">${t}</span>${esc(texte)}</li>`;
        }
        if (e.type === 'clic') {
          return `<li class="aud-ev aud-ev--clic"><span class="aud-t">${t}</span>Clic « ${esc(e.libelle || '—')} »${
            e.cible ? ` <span class="sub-in">→ ${esc(e.cible)}</span>` : ''}</li>`;
        }
        if (e.type === 'formulaire') {
          return `<li class="aud-ev aud-ev--form"><span class="aud-t">${t}</span><b>Formulaire envoyé</b>${
            e.libelle ? ` <span class="sub-in">(${esc(e.libelle)})</span>` : ''}</li>`;
        }
        return '';
      }).join('')}
    </ol>`;
}

function ligneVisite(v, ouverte) {
  const prov = v.provenance && !v.provenance.startsWith('/') && !v.provenance.startsWith('utm:')
    ? `<span class="sub">${esc(v.provenance)}</span>` : '';
  return `
    <details class="aud-visit${v.formulaire ? ' aud-visit--form' : ''}"${ouverte ? ' open' : ''}>
      <summary>
        <span class="aud-when">${esc(date(v.debut))}</span>
        <span class="aud-src"><span class="aud-tag aud-tag--${esc(v.source.famille)}">${esc(v.source.nom)}</span>${prov}</span>
        <span class="aud-entry">${esc(v.entree)}</span>
        <span class="aud-meta">${v.pages.length} page${v.pages.length > 1 ? 's' : ''} · ${temps(v.duree)}</span>
        <span class="aud-meta">${esc(v.appareil || '')}${v.fuseau ? ` · ${esc(v.fuseau)}` : ''}</span>
        <span class="aud-flags">
          ${v.voitCours ? '<span class="aud-flag">page cours</span>' : ''}
          ${v.formulaire ? '<span class="aud-flag aud-flag--form">a écrit</span>' : ''}
          ${v.venues > 1 ? `<a class="aud-flag aud-flag--back" href="/audience?visiteur=${esc(v.visiteur)}">venue ${v.rang || '?'} sur ${v.venues}</a>` : ''}
        </span>
      </summary>
      ${parcours(v)}
    </details>`;
}

const FILTRES = [
  ['toutes', 'Toutes', () => true],
  ['ecrit', 'Ont écrit', (v) => !!v.formulaire],
  ['cours', 'Page cours', (v) => v.voitCours],
  ['google', 'Google', (v) => v.source.nom === 'Google'],
  ['ia', 'IA', (v) => v.source.famille === 'ia'],
  ['revenus', 'Revenus', (v) => v.venues > 1],
];

function blocVisites(vs, filtre) {
  const [, , test] = FILTRES.find(([k]) => k === filtre) || FILTRES[0];
  const liste = vs.filter(test);
  return `
    <div class="seg-track seg-visites">
      ${FILTRES.map(([k, nom, t]) => `<button type="button" data-f="${k}" aria-pressed="${k === filtre}">${esc(nom)}<span>${nb(vs.filter(t).length)}</span></button>`).join('')}
    </div>
    <div class="aud-visits">
      ${liste.length ? liste.slice(0, 300).map((v) => ligneVisite(v, false)).join('')
        : '<div class="empty-state">Aucune visite dans ce filtre.</div>'}
      ${liste.length > 300 ? `<p class="aud-note">Les 300 plus récentes sur ${nb(liste.length)}.</p>` : ''}
    </div>`;
}

// Ouvrir cette page marque le navigateur (exclureCeNavigateur) : ses visites,
// passées comprises, ne comptent jamais.
const blocIgnorer = () => `<p class="aud-note">Vos visites sur ce navigateur ne sont jamais comptées, y compris celles d'avant.</p>`;

// Le marquage vaut pour un site : sur chaque appareil, ouvrir une fois ce lien
// pour que vos visites sur gregmittelette.com ne comptent pas non plus.
const blocIgnorerGreg = () => `<p class="aud-note">gregmittelette.com : <a class="lien-nu" href="https://gregmittelette.com/?ne-pas-compter=1" target="_blank" rel="noopener">ne pas compter mes visites sur ce navigateur</a> (à ouvrir une fois par appareil).</p>`;

const SITES = [['carmine', 'Carmine'], ['greg', 'gregmittelette.com'], ['tous', 'Les deux sites']];
const garderSite = (site) => (l) => (site === 'tous' ? true : site === 'greg' ? estPageGreg(l.page) : !estPageGreg(l.page));

function blocEclairs(n, affichees, jours, site = 'carmine') {
  const s = site !== 'carmine' ? `&site=${site}` : '';
  if (!n) return '';
  return affichees
    ? `<p class="aud-note">Les ${nb(n)} visites sans lecture (une page, 0 s, aucun clic) sont comptées. <a class="lien-nu" href="/audience?jours=${jours}${s}&eclairs=0">Les écarter</a></p>`
    : `<p class="aud-note">${nb(n)} visite${n > 1 ? 's' : ''} sans lecture (une page, 0 s, aucun clic : surtout des robots) ${n > 1 ? 'sont écartées' : 'est écartée'}. <a class="lien-nu" href="/audience?jours=${jours}${s}">Les afficher</a></p>`;
}

/* ── Vues ────────────────────────────────────────────────────── */

const PERIODES = [['7', '7 jours'], ['30', '30 jours'], ['90', '90 jours'], ['365', '12 mois']];

async function vueEnsemble() {
  const jours = PERIODES.some(([k]) => k === params.get('jours')) ? params.get('jours') : '30';
  const depuis = new Date(Date.now() - Number(jours) * 864e5).toISOString();
  const site = SITES.some(([k]) => k === params.get('site')) ? params.get('site') : 'carmine';
  const exclus = await visiteursExclus();
  const lues = visites((await charger((q) => q.gte('cree_le', depuis)))
    .filter((l) => !exclus.has(l.visiteur)).filter(garderSite(site)));
  const google = rendusGoogle(lues);
  const toutes = lues.filter((v) => !google.has(v));
  const lien = (j, s, e) => `/audience?jours=${j}${s !== 'carmine' ? `&site=${s}` : ''}${e ? '' : '&eclairs=0'}`;
  const avecEclairs = params.get('eclairs') !== '0';
  const nEclairs = toutes.filter(sansLecture).length;
  const vs = rangs(avecEclairs ? toutes : toutes.filter((v) => !sansLecture(v)));
  let filtre = 'toutes';

  const rendre = () => {
    app.innerHTML = `
      <div class="portal__inner">
        <div class="admin-bar">
          <h1>Audience</h1>
          <div class="seg-track seg-periode">
            ${PERIODES.map(([k, nom]) => `<a class="aud-period${k === jours ? ' is-on' : ''}" href="${lien(k, site, avecEclairs)}">${esc(nom)}</a>`).join('')}
          </div>
          <div class="seg-track seg-periode">
            ${SITES.map(([k, nom]) => `<a class="aud-period${k === site ? ' is-on' : ''}" href="${lien(jours, k, avecEclairs)}">${esc(nom)}</a>`).join('')}
          </div>
        </div>
        ${blocIgnorer()}
        ${blocIgnorerGreg()}
        ${blocEclairs(nEclairs, avecEclairs, jours, site)}
        ${vs.length ? `
          ${blocChiffres(chiffres(vs))}
          <h2 class="section-title" style="margin-top:0">Entonnoirs</h2>
          ${blocEntonnoirs(vs)}
          <h2 class="section-title">Le formulaire, champ par champ</h2>
          ${blocFormulaire(vs)}
          <h2 class="section-title">D'où viennent les visiteurs</h2>
          ${blocSources(vs)}
          <h2 class="section-title">Articles qui mènent à la page cours</h2>
          ${blocArticlesCours(vs)}
          <h2 class="section-title">Pages</h2>
          ${blocPages(vs)}
          <h2 class="section-title">Les visites, une par une</h2>
          ${blocVisites(vs, filtre)}`
        : '<div class="empty-state">Aucune visite enregistrée sur cette période. La mesure démarre dès que le site est en ligne avec le script et la table Supabase créée.</div>'}
      </div>`;
    rendreFiltre();
  };
  // Le changement de filtre ne recharge que la liste.
  const rendreFiltre = () => {
    app.querySelector('.seg-visites')?.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-f]');
      if (!b) return;
      filtre = b.dataset.f;
      app.querySelector('.seg-visites').remove();
      app.querySelector('.aud-visits').remove();
      app.querySelector('.portal__inner').insertAdjacentHTML('beforeend', blocVisites(vs, filtre));
      rendreFiltre();
    });
  };
  rendre();
}

/** Toutes les venues d'un visiteur : le lien du mail de contact ouvre ici. */
async function vueVisiteur(id) {
  const vs = rangs(visites(await charger((q) => q.eq('visiteur', id))));
  app.innerHTML = `
    <div class="portal__inner">
      <p class="moteur-retour"><a href="/audience">← Audience</a></p>
      <div class="admin-bar"><h1>Parcours d'un visiteur</h1></div>
      ${vs.length ? `
        <p class="aud-note">${vs.length} venue${vs.length > 1 ? 's' : ''}, du ${esc(date(vs[vs.length - 1].debut))} au ${esc(date(vs[0].debut))}.
          Première arrivée : <b>${esc(vs[vs.length - 1].source.nom)}</b>, sur ${esc(vs[vs.length - 1].entree)}.</p>
        <div class="aud-visits">${vs.map((v) => ligneVisite(v, true)).join('')}</div>`
      : '<div class="empty-state">Aucune visite enregistrée pour ce visiteur (mesure pas encore active, ou plus de 25 mois).</div>'}
    </div>`;
}


/* ── Amorçage ────────────────────────────────────────────────── */

(async function start() {
  try {
    const profile = await getProfile();
    if (!profile) {
      location.href = '/espace-client';
      return;
    }
    if (profile.role !== 'admin') {
      app.innerHTML = `
        <div class="portal__inner portal__inner--narrow">
          <div class="portal-msg portal-msg--err is-visible">Page réservée à l'administrateur. <a href="/espace-client">Espace client</a>.</div>
        </div>`;
      return;
    }
    // Ce navigateur est celui de Greg : il ne compte plus jamais, passé compris.
    exclureCeNavigateur();
    purger().catch(() => {});
    const visiteur = params.get('visiteur');
    if (visiteur && /^[a-z0-9]{8,40}$/.test(visiteur)) await vueVisiteur(visiteur);
    else await vueEnsemble();
  } catch (err) {
    app.innerHTML = `
      <div class="portal__inner portal__inner--narrow">
        <div class="portal-msg portal-msg--err is-visible">${esc(err.message)}${
          /carmine_audience/.test(err.message) ? ' — la table n\'existe pas encore : lancer supabase-audience.sql dans Supabase.' : ''}</div>
      </div>`;
  }
})();
