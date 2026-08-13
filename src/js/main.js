import { initI18n, changeLanguage } from './i18n.js';
import { initNavigation } from './navigation.js';
import { initParallax } from './parallax.js';
import { initAnimations, initPieChart } from './animations.js';
import { initFAQ } from './faq.js';
import { initTestimonials } from './testimonials.js';
import { initContactForm } from './contact-form.js';

// CSS imports
import '../css/variables.css';
import '../css/reset.css';
import '../css/base.css';
import '../css/animations.css';
import '../css/parallax.css';
import '../css/header.css';
import '../css/hero.css';
import '../css/sections.css';
import '../css/testimonials.css';
import '../css/contact.css';
import '../css/footer.css';
import '../css/pages.css';
import '../css/responsive.css';

/**
 * Retour d'authentification en erreur.
 *
 * Un lien de connexion ou de reinitialisation expire, et surtout ne sert
 * qu'une fois : les scanners de courriel le visitent avant son destinataire et
 * le consomment. Supabase renvoie alors sur l'adresse par defaut du site,
 * c'est-a-dire ici, avec l'erreur dans le fragment. Le visiteur atterrissait
 * sur la page d'accueil sans un mot d'explication.
 */
(function retourAuthEnErreur() {
  const frag = new URLSearchParams(location.hash.slice(1));
  if (!frag.get('error') && !frag.get('error_code')) return;
  location.replace(`/espace-client${location.hash}`);
})();

// Init everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  initNavigation();
  initParallax();
  initAnimations();
  initFAQ();
  initTestimonials();
  initContactForm();


  // Results bars animation (only on homepage)
  const resultsBars = document.querySelector('.results-bars');
  if (resultsBars) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            resultsBars.querySelectorAll('.results-bar__fill').forEach((bar, i) => {
              bar.style.setProperty('--bar-width', bar.dataset.width);
              bar.style.transitionDelay = `${i * 0.08}s`;
              bar.classList.add('animated');
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(resultsBars);
  }

  // Language dropdown toggle
  const langToggle = document.querySelector('.lang-toggle');
  const langSelected = document.querySelector('.lang-toggle__selected');

  if (langSelected && langToggle) {
    langSelected.addEventListener('click', (e) => {
      e.stopPropagation();
      langToggle.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      langToggle.classList.remove('open');
    });
  }

  document.querySelectorAll('.lang-toggle__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      changeLanguage(btn.dataset.lang);
      if (langToggle) langToggle.classList.remove('open');
    });
  });
});
