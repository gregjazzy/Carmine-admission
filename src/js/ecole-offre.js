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

const code = new URLSearchParams(location.search).get('ecole');
const cle = code && code.toLowerCase();
const ecole = cle && Object.hasOwn(ECOLES, cle) ? ECOLES[cle] : null;

if (ecole) {
  // Rejoué à chaque traduction : i18n réécrit le titre au chargement et au
  // changement de langue.
  document.addEventListener('i18n:updated', () => {
    const h1 = document.querySelector('.page-hero__title');
    if (!h1) return;
    const lang = document.documentElement.lang.startsWith('en') ? 'en' : 'fr';
    h1.textContent = TITRE[lang](ecole);
    // Présentation au nom de l'école (Greg, 19 nov. 2026) : chaque année
    // depuis dix ans, une quinzaine d'élèves préparés pour cette école.
    const intro = document.querySelector('[data-i18n="schools.intro_text"]');
    if (intro) intro.textContent = INTRO[lang](ecole);
  });
}
