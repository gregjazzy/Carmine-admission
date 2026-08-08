/**
 * Amorçage commun aux pages du portail.
 * Reprend l'habillage du site (variables, en-tête, pied de page) et sa traduction,
 * sans charger les modules de la vitrine — parallaxe, témoignages, FAQ — inutiles ici.
 */
import '../../css/variables.css';
import '../../css/reset.css';
import '../../css/base.css';
import '../../css/header.css';
import '../../css/footer.css';
import '../../css/responsive.css';
import '../../css/portail.css';

import { initNavigation } from '../navigation.js';
import { initI18n, changeLanguage } from '../i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    initNavigation();
  } catch {
    /* la navigation n'est pas critique pour le portail */
  }

  try {
    await initI18n();
  } catch {
    /* le portail reste lisible même si les traductions du site ne chargent pas */
  }

  // L'ouverture du menu déroulant est câblée dans main.js, qui n'est chargé que
  // sur la vitrine : sans ces lignes le drapeau reste un bouton mort ici, et la
  // langue devient impossible à changer depuis le portail.
  const langToggle = document.querySelector('.lang-toggle');
  const langSelected = document.querySelector('.lang-toggle__selected');
  if (langToggle && langSelected) {
    langSelected.addEventListener('click', (e) => {
      e.stopPropagation();
      langToggle.classList.toggle('open');
    });
    document.addEventListener('click', () => langToggle.classList.remove('open'));
  }

  // Le sélecteur de langue recharge la page : le contenu du portail est rendu en
  // JavaScript au démarrage, il ne se retraduit pas en place comme la vitrine.
  document.querySelectorAll('.lang-toggle__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lng = btn.dataset.lang;
      if (!lng || lng === localStorage.getItem('lang')) return;
      localStorage.setItem('lang', lng);
      changeLanguage(lng);
      window.location.reload();
    });
  });
});
