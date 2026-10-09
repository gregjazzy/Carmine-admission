/**
 * Audience — les calculs, sans rien d'affiché : des lignes de carmine_audience
 * aux visites, aux sources, aux entonnoirs. Séparé de la page pour se tester
 * seul (node), sur des lignes fabriquées.
 */

/* ── Pages ───────────────────────────────────────────────────── */

const sansLangue = (p) => p.replace(/^\/en(?=\/|$)/, '').replace(/^\/blog\/en(?=\/)/, '/blog') || '/';

export const estPageCours = (p) => sansLangue(p) === '/cours-particuliers';
export const estArticle = (p) => /^\/blog\/[^/]+$/.test(sansLangue(p));
/** Article qui parle de cours : pages « cours-… », maths, physique, SAT maths, olympiades. */
export const estArticleCours = (p) =>
  estArticle(p) && /\/(cours-|.*maths|.*physique|.*olympiades|.*concours-general)/.test(sansLangue(p));
export const estPageAdmissions = (p) =>
  ['/consulting-admissions', '/admission-ecoles-paris'].includes(sansLangue(p));
const versContact = (cible) => /contact/i.test(cible || '');

/* ── Sources ─────────────────────────────────────────────────── */

const SOURCES = [
  [/chatgpt\.com|chat\.openai\.com|openai\.com/, 'ChatGPT', 'ia'],
  [/perplexity\.ai/, 'Perplexity', 'ia'],
  [/claude\.ai/, 'Claude', 'ia'],
  [/gemini\.google/, 'Gemini', 'ia'],
  [/copilot\.microsoft|bing\.com\/chat/, 'Copilot', 'ia'],
  [/(^|\.)google\./, 'Google', 'moteur'],
  [/(^|\.)bing\.com/, 'Bing', 'moteur'],
  [/duckduckgo|ecosia|qwant|yahoo|yandex|baidu|brave/, 'Autre moteur', 'moteur'],
  [/superprof/, 'Superprof', 'site'],
  [/linkedin|lnkd\.in/, 'LinkedIn', 'reseau'],
  [/facebook|fb\.com|instagram/, 'Facebook / Instagram', 'reseau'],
  [/whatsapp|wa\.me/, 'WhatsApp', 'reseau'],
  [/(^|\.)t\.co$|twitter|x\.com/, 'X', 'reseau'],
  [/reddit/, 'Reddit', 'reseau'],
  [/mail\.google|outlook|mail\./, 'Messagerie', 'reseau'],
];

/** Nom lisible et famille de la provenance notée sur la première page vue. */
export function source(provenance) {
  if (!provenance) return { nom: 'Accès direct', famille: 'direct' };
  if (provenance.startsWith('utm:')) return { nom: `Campagne ${provenance.slice(4)}`, famille: 'campagne' };
  if (provenance.startsWith('/')) return { nom: 'Le site (nouvel onglet)', famille: 'interne' };
  const hote = provenance.split('/')[0];
  for (const [re, nom, famille] of SOURCES) if (re.test(hote)) return { nom, famille };
  return { nom: hote.replace(/^www\./, ''), famille: 'site' };
}

/* ── Visites ─────────────────────────────────────────────────── */

/**
 * Regroupe les lignes par visite. Chaque visite garde ses pages dans l'ordre,
 * avec, par page, le temps passé et la lecture maximum notés au départ.
 */
export function visites(lignes) {
  const parVisite = new Map();
  for (const l of [...lignes].sort((a, b) => a.cree_le.localeCompare(b.cree_le) || a.id - b.id)) {
    let v = parVisite.get(l.visite);
    if (!v) {
      v = {
        visite: l.visite, visiteur: l.visiteur, debut: l.cree_le, fin: l.cree_le,
        appareil: l.appareil, fuseau: l.fuseau, langue: l.langue,
        evenements: [], pages: [], clics: [], formulaire: null, provenance: undefined,
      };
      parVisite.set(l.visite, v);
    }
    v.fin = l.cree_le;
    v.evenements.push(l);
    if (l.type === 'vue') {
      if (v.provenance === undefined) v.provenance = l.provenance ?? null;
      v.pages.push({ page: l.page, a: l.cree_le, duree: 0, profondeur: 0, provenance: l.provenance });
    } else if (l.type === 'sortie') {
      // La dernière page de ce chemin vue avant ce départ.
      const p = [...v.pages].reverse().find((x) => x.page === l.page);
      if (p) {
        p.duree = Math.max(p.duree, l.duree || 0);
        p.profondeur = Math.max(p.profondeur, l.profondeur || 0);
      }
    } else if (l.type === 'clic') {
      v.clics.push(l);
    } else if (l.type === 'formulaire') {
      v.formulaire = l;
    }
  }
  for (const v of parVisite.values()) {
    if (v.provenance === undefined) v.provenance = null; // visite sans « vue » (onglet rouvert)
    v.source = source(v.provenance);
    v.entree = v.pages[0]?.page ?? v.evenements[0].page;
    v.duree = v.pages.reduce((s, p) => s + p.duree, 0);
    v.voitCours = v.pages.some((p) => estPageCours(p.page));
  }
  return [...parVisite.values()].sort((a, b) => b.debut.localeCompare(a.debut));
}

/** Rang de chaque visite pour son visiteur (1 = première venue dans la période). */
export function rangs(vs) {
  const parVisiteur = new Map();
  for (const v of [...vs].sort((a, b) => a.debut.localeCompare(b.debut))) {
    if (!v.visiteur) continue;
    const n = (parVisiteur.get(v.visiteur) || 0) + 1;
    parVisiteur.set(v.visiteur, n);
    v.rang = n;
  }
  for (const v of vs) v.venues = v.visiteur ? parVisiteur.get(v.visiteur) : 1;
  return vs;
}

/* ── Synthèses ───────────────────────────────────────────────── */

export function chiffres(vs) {
  const visiteurs = new Set(vs.map((v) => v.visiteur).filter(Boolean));
  const pagesVues = vs.reduce((s, v) => s + v.pages.length, 0);
  const formulaires = vs.filter((v) => v.formulaire).length;
  return {
    visites: vs.length,
    visiteurs: visiteurs.size,
    pagesVues,
    cours: vs.filter((v) => v.voitCours).length,
    formulaires,
    taux: vs.length ? formulaires / vs.length : 0,
  };
}

export function parSource(vs) {
  const m = new Map();
  for (const v of vs) {
    const k = v.source.nom;
    const x = m.get(k) || { nom: k, famille: v.source.famille, visites: 0, cours: 0, formulaires: 0 };
    x.visites += 1;
    if (v.voitCours) x.cours += 1;
    if (v.formulaire) x.formulaires += 1;
    m.set(k, x);
  }
  return [...m.values()].sort((a, b) => b.visites - a.visites);
}

/**
 * Par page : vues, visites, entrées, temps et lecture moyens, et la part des
 * visites qui, APRÈS cette page, sont allées sur la page cours ou ont écrit.
 */
export function parPage(vs) {
  const m = new Map();
  for (const v of vs) {
    const vues = new Set();
    v.pages.forEach((p, i) => {
      const x = m.get(p.page) || {
        page: p.page, vues: 0, visites: 0, entrees: 0, duree: 0, lecture: 0, mesures: 0,
        versCours: 0, versFormulaire: 0,
      };
      x.vues += 1;
      if (i === 0) x.entrees += 1;
      if (p.duree) { x.duree += p.duree; x.lecture += p.profondeur; x.mesures += 1; }
      if (!vues.has(p.page)) {
        vues.add(p.page);
        x.visites += 1;
        const apres = v.pages.slice(i + 1);
        if (!estPageCours(p.page) && apres.some((q) => estPageCours(q.page))) x.versCours += 1;
        if (v.formulaire && v.formulaire.cree_le >= p.a) x.versFormulaire += 1;
      }
      m.set(p.page, x);
    });
  }
  return [...m.values()]
    .map((x) => ({
      ...x,
      dureeMoy: x.mesures ? x.duree / x.mesures : null,
      lectureMoy: x.mesures ? x.lecture / x.mesures : null,
    }))
    .sort((a, b) => b.visites - a.visites);
}

/**
 * Entonnoirs. Chaque marche est un test sur la visite ; une visite ne compte à
 * une marche que si elle a franchi les précédentes.
 */
export const ENTONNOIRS = [
  {
    nom: 'Cours particuliers',
    marches: [
      ['Lit un article cours', (v) => v.pages.some((p) => estArticleCours(p.page))],
      ['Arrive sur la page cours', (v) => v.voitCours],
      ['Clique vers le contact', (v) => v.clics.some((c) => versContact(c.cible))],
      ['Envoie le formulaire', (v) => !!v.formulaire],
    ],
  },
  {
    nom: 'Admissions',
    marches: [
      ['Lit un article admissions', (v) => v.pages.some((p) => estArticle(p.page) && !estArticleCours(p.page))],
      ['Va sur une page Carmine (accompagnement, écoles)', (v) => v.pages.some((p) => estPageAdmissions(p.page) || sansLangue(p.page) === '/')],
      ['Clique vers le contact', (v) => v.clics.some((c) => versContact(c.cible))],
      ['Envoie le formulaire', (v) => !!v.formulaire],
    ],
  },
  {
    nom: 'Tout le site',
    marches: [
      ['Arrive sur le site', () => true],
      ['Voit plus d\'une page', (v) => v.pages.length > 1],
      ['Clique vers le contact', (v) => v.clics.some((c) => versContact(c.cible))],
      ['Envoie le formulaire', (v) => !!v.formulaire],
    ],
  },
];

export function entonnoir(vs, def) {
  let restantes = vs;
  return def.marches.map(([nom, test]) => {
    restantes = restantes.filter(test);
    return { nom, n: restantes.length };
  });
}

/** Articles qui ont précédé l'arrivée sur la page cours, du plus fort au plus faible. */
export function articlesVersCours(vs) {
  const m = new Map();
  for (const v of vs) {
    const i = v.pages.findIndex((p) => estPageCours(p.page));
    if (i <= 0) continue;
    for (const p of new Set(v.pages.slice(0, i).map((x) => x.page).filter(estArticle))) {
      m.set(p, (m.get(p) || 0) + 1);
    }
  }
  return [...m.entries()].map(([page, n]) => ({ page, n })).sort((a, b) => b.n - a.n);
}
