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

// Init everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  initNavigation();
  initParallax();
  initAnimations();
  initFAQ();
  initTestimonials();
  initContactForm();

  // Pie chart (only on homepage)
  if (document.querySelector('.pie-chart')) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            initPieChart();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(document.querySelector('.pie-chart'));
  }

  // Language toggle buttons
  document.querySelectorAll('.lang-toggle__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      changeLanguage(btn.dataset.lang);
    });
  });
});
