import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

const SUPPORTED_LANGS = ['fr', 'en'];

export async function initI18n() {
  await i18next
    .use(HttpBackend)
    .use(LanguageDetector)
    .init({
      supportedLngs: SUPPORTED_LANGS,
      fallbackLng: 'fr',
      debug: false,
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'lang',
      },
      backend: {
        loadPath: '/locales/{{lng}}/translation.json',
      },
      interpolation: {
        escapeValue: false,
      },
    });

  updateContent();
  updateLangToggle();

  return i18next;
}

export function changeLanguage(lng) {
  i18next.changeLanguage(lng, () => {
    updateContent();
    updateLangToggle();
  });
}

function updateContent() {
  // Update all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const translation = i18next.t(key);
    if (translation && translation !== key) {
      el.innerHTML = translation;
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translation = i18next.t(key);
    if (translation && translation !== key) {
      el.setAttribute('placeholder', translation);
    }
  });

  // Update select options
  document.querySelectorAll('[data-i18n-option]').forEach((el) => {
    const key = el.getAttribute('data-i18n-option');
    const translation = i18next.t(key);
    if (translation && translation !== key) {
      el.textContent = translation;
    }
  });

  // Update meta title and description
  const titleKey = document.querySelector('meta[data-i18n-title]');
  if (titleKey) {
    document.title = i18next.t(titleKey.getAttribute('data-i18n-title'));
  }

  const descKey = document.querySelector('meta[data-i18n-desc]');
  if (descKey) {
    descKey.setAttribute('content', i18next.t(descKey.getAttribute('data-i18n-desc')));
  }

  // Update lang attribute
  document.documentElement.lang = i18next.language.startsWith('fr') ? 'fr' : 'en';
}

function updateLangToggle() {
  const currentLang = i18next.language.startsWith('fr') ? 'fr' : 'en';
  document.querySelectorAll('.lang-toggle__btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

export { i18next };
