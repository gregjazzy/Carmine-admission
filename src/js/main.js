import { initI18n, changeLanguage } from './i18n.js';
import { initNavigation } from './navigation.js';
import { initParallax } from './parallax.js';
import { initAnimations, initPieChart } from './animations.js';
import { initFAQ } from './faq.js';
import { initTestimonials } from './testimonials.js';
import { initContactForm } from './contact-form.js';
import { initBlogPersonalization } from './blog-personalization.js';

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

// Init everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  initNavigation();
  initParallax();
  initAnimations();
  initFAQ();
  initTestimonials();
  initContactForm();
  initBlogPersonalization();

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

  // Language toggle buttons
  document.querySelectorAll('.lang-toggle__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      changeLanguage(btn.dataset.lang);
    });
  });
});
