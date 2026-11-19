/**
 * Page des offres : titre au nom de l'école de la famille.
 *
 * Greg envoie le lien de cette page à une famille, suivi de ?ecole=<code>
 * (ex. /admission-ecoles-paris?ecole=jeannine-manuel). Seul le titre change,
 * avec la bonne préposition devant le nom ; tout le reste de la page est
 * identique pour toutes les écoles. Code inconnu ou absent : titre général.
 */

import { ECOLES } from './ecoles-offre-liste.js';

const TITRE = {
  fr: (e) => `Préparer l'admission ${e.fr}`,
  en: (e) => `Preparing for admission to ${e.en}`,
};

const INTRO = {
  fr: (e) => `Greg Mittelette, fondateur de Carmine, connaît de l'intérieur les écoles les plus sélectives : depuis près de quinze ans, il suit leurs meilleurs élèves. Chaque année, il prépare une quinzaine de candidats pour leur admission ${e.fr} : il sait ce que cette école évalue aux tests, ce qu'elle regarde pendant l'entretien et ce qui distingue un dossier retenu.`,
  en: (e) => `Greg Mittelette, founder of Carmine, knows the most selective schools from the inside: for nearly fifteen years, he has worked with their top pupils. Every year, he prepares some fifteen candidates for their admission to ${e.en}: he knows what this school assesses in its tests, what it looks for in the interview, and what sets a successful application apart.`,
};

// Prix par grille ; la grille « fr » est celle écrite dans la page.
const PRIX = {
  int: {
    fr: { o1: '750 €', o2: '+ 750 €', o3: '750 €', o3n: "seule · + 450 € avec l'évaluation" },
    en: { o1: '€750', o2: '+ €750', o3: '€750', o3n: 'on its own · + €450 with the assessment' },
  },
  us: {
    fr: { o1: '750 €', o2: '+ 1 200 €', o3: '750 €', o3n: "seule · + 450 € avec l'évaluation" },
    en: { o1: '€750', o2: '+ €1,200', o3: '€750', o3n: 'on its own · + €450 with the assessment' },
  },
};

const code = new URLSearchParams(location.search).get('ecole');
const cle = code && code.toLowerCase();
const ecole = cle && Object.hasOwn(ECOLES, cle) ? ECOLES[cle] : null;

// Consultation d'une heure : seulement pour les familles qui hésitent entre
// plusieurs écoles (?ecole=paris, Greg 19 nov. 2026).
if (ecole?.consultation) {
  const montrer = () => document.getElementById('consultation')?.removeAttribute('hidden');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montrer);
  else montrer();
}

// Lien envoyé par Greg à un parent qui a déjà rempli le formulaire : pas de
// bouton qui l'y renvoie ; le bloc d'appel dit de répondre au message
// (Greg, 19 nov. 2026). La page générale garde ses boutons.
const APPEL = {
  fr: "Un premier appel gratuit de quinze minutes, pour recueillir les informations sur votre famille. Pour convenir d'un horaire, répondez simplement à notre message.",
  en: 'A free first call of fifteen minutes, to gather information about your family. To arrange a time, simply reply to our message.',
};
if (ecole) document.documentElement.classList.add('offre-envoyee');

if (ecole) {
  // Rejoué à chaque traduction : i18n réécrit le titre au chargement et au
  // changement de langue.
  document.addEventListener('i18n:updated', () => {
    const h1 = document.querySelector('.page-hero__title');
    if (!h1) return;
    const lang = document.documentElement.lang.startsWith('en') ? 'en' : 'fr';
    h1.textContent = ecole.titre?.[lang] ?? TITRE[lang](ecole);
    // Présentation au nom de l'école (Greg, 19 nov. 2026) : chaque année
    // depuis dix ans, une quinzaine d'élèves préparés pour cette école.
    const intro = document.querySelector('[data-i18n="schools.intro_text"]');
    if (intro) intro.textContent = ecole.intro?.[lang] ?? INTRO[lang](ecole);
    const appel = document.querySelector('[data-i18n="schools.cta_text"]');
    if (appel) appel.textContent = APPEL[lang];
    const prix = PRIX[ecole.grille]?.[lang];
    if (prix) {
      const poser = (cle, texte) =>
        document.querySelectorAll(`[data-i18n="schools.${cle}"]`).forEach((el) => { el.textContent = texte; });
      poser('o1_price', prix.o1);
      poser('o2_price', prix.o2);
      poser('o3_price', prix.o3);
      poser('o3_price_note', prix.o3n);
    }
  });
}
