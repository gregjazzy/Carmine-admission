/**
 * Mesure d'audience maison (table carmine_audience, voir supabase-audience.sql).
 *
 * Search Console voit le clic dans Google, rien de ce qui suit. Ce module note
 * la suite : la page vue et d'où l'on vient, les clics qui comptent, l'envoi du
 * formulaire, le temps passé et jusqu'où la page a été lue. Aucun cookie :
 *   visite   — tirée au hasard par onglet (sessionStorage), le parcours d'une venue ;
 *   visiteur — tiré au hasard par navigateur (localStorage), pour reconnaître
 *              une famille qui revient avant d'écrire.
 *
 * On écrit directement dans l'API REST de Supabase plutôt que par le client
 * supabase-js : la vitrine n'a pas à charger toute la bibliothèque pour un
 * simple envoi, et fetch keepalive survit à la fermeture de la page.
 */

// Mêmes valeurs que src/js/supabase.js : la clé publiable est faite pour le
// navigateur, la table n'accepte que des écritures (RLS).
const API = 'https://drfgfpyxviflnqegvwde.supabase.co/rest/v1/carmine_audience';
const CLE = 'sb_publishable__xUMoGjeA-1UotBXw0e-KQ_I6pfzQs_';

// Posé par la page /audience : les visites de Greg sur son propre site ne
// comptent pas.
const IGNORER = 'carmine-audience-ignorer';

const ROBOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|whatsapp|telegram/i;

// Le simple accès à localStorage ou sessionStorage lève une SecurityError
// quand le navigateur bloque le stockage du site : on les nomme, on ne les
// touche que dans un try.
const STOCKAGES = { local: () => window.localStorage, session: () => window.sessionStorage };
function lire(stockage, cle) {
  try { return STOCKAGES[stockage]().getItem(cle); } catch { return null; }
}
function ecrire(stockage, cle, val) {
  try { STOCKAGES[stockage]().setItem(cle, val); } catch { /* stockage bloqué */ }
}

function tirage() {
  if (crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  return (Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 20);
}

function identifiant(stockage, cle) {
  let id = lire(stockage, cle);
  if (!id || !/^[a-z0-9]{8,40}$/.test(id)) {
    id = tirage();
    ecrire(stockage, cle, id);
  }
  return id;
}

let ids = null;
/** Les deux identifiants, aussi transmis par le formulaire de contact. */
export function idsAudience() {
  if (!ids) {
    ids = {
      visite: identifiant('session', 'carmine-visite'),
      visiteur: identifiant('local', 'carmine-visiteur'),
    };
  }
  return ids;
}

function actif() {
  if (navigator.webdriver || ROBOT.test(navigator.userAgent)) return false;
  if (lire('local', IGNORER) === '1') return false;
  return /carmine-admission\.com$/.test(location.hostname) || lire('local', 'carmine-audience-test');
}

function appareil() {
  const w = Math.min(screen.width, screen.height);
  if (matchMedia('(pointer: coarse)').matches) return w >= 600 ? 'tablette' : 'mobile';
  return 'ordinateur';
}

const coupe = (s, n) => (s == null ? null : String(s).slice(0, n));
const page = () => coupe(location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/', 300);

function envoyer(type, champs = {}) {
  try { envoyerSansGarde(type, champs); } catch { /* la mesure ne doit jamais gêner la page */ }
}
function envoyerSansGarde(type, champs) {
  if (!actif()) return;
  const { visite, visiteur } = idsAudience();
  const corps = {
    visite, visiteur, type, page: page(),
    langue: coupe(navigator.language, 20),
    appareil: appareil(),
    fuseau: coupe(Intl.DateTimeFormat().resolvedOptions().timeZone, 60),
    ...champs,
  };
  try {
    fetch(API, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: CLE,
        'content-type': 'application/json',
        prefer: 'return=minimal',
      },
      body: JSON.stringify(corps),
    }).catch(() => {});
  } catch { /* la mesure ne doit jamais gêner la page */ }
}

/** Formulaire envoyé avec succès ; libelle = l'objet choisi, jamais le contenu. */
export function noteFormulaire(objet) {
  envoyer('formulaire', { libelle: coupe(objet, 200) });
}

/** D'où vient le visiteur : la page précédente du site, ou le site d'origine. */
function provenance() {
  const ref = document.referrer;
  const params = new URLSearchParams(location.search);
  const utm = params.get('utm_source') || params.get('ref');
  if (utm) return coupe(`utm:${utm}`, 300);
  if (!ref) return null;
  try {
    const u = new URL(ref);
    if (u.hostname === location.hostname) return coupe(u.pathname.replace(/\.html$/, ''), 300);
    return coupe(u.hostname + u.pathname, 300);
  } catch { return null; }
}

// Les clics qui disent quelque chose : boutons d'action, liens vers le contact
// ou la page cours, sorties vers un autre site, téléphone, mail, WhatsApp.
function clicParlant(a) {
  const href = a.getAttribute('href') || '';
  if (a.classList.contains('btn')) return true;
  if (/contact|cours-particuliers|consulting|mailto:|tel:|wa\.me|whatsapp/i.test(href)) return true;
  return a.hostname && a.hostname !== location.hostname;
}

export function initAudience() {
  try { demarrer(); } catch { /* la mesure ne doit jamais gêner la page */ }
}
function demarrer() {
  if (!actif()) return;
  let profondeur = 0;
  let actifDepuis = Date.now();
  let cumul = 0;

  envoyer('vue', { provenance: provenance() });

  const mesure = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    const p = h > 0 ? Math.round((scrollY / h) * 100) : 100;
    if (p > profondeur) profondeur = Math.min(100, p);
  };
  addEventListener('scroll', mesure, { passive: true });
  mesure();

  document.addEventListener('click', (e) => {
    const el = e.target.closest('a, button');
    if (!el) return;
    if (el.tagName === 'A' ? !clicParlant(el) : !el.classList.contains('btn')) return;
    if (el.type === 'submit') return; // l'envoi réussi est noté par noteFormulaire
    envoyer('clic', {
      cible: coupe(el.getAttribute('href') || el.id || null, 300),
      libelle: coupe((el.textContent || '').replace(/\s+/g, ' ').trim(), 200),
    });
  }, { capture: true });

  // Temps réellement passé sur la page (onglet visible), envoyé à chaque
  // départ : la page Audience retient le maximum par page et par visite.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      cumul += Date.now() - actifDepuis;
      envoyer('sortie', {
        duree: Math.min(86400, Math.round(cumul / 1000)),
        profondeur,
      });
    } else {
      actifDepuis = Date.now();
    }
  });
}
