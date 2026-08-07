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

  // Une page dont le contenu est figé dans une langue — un article de blog —
  // ne peut pas être retraduite sur place. Si le visiteur en préfère une autre
  // et qu'elle existe, on l'y emmène avant même d'afficher quoi que ce soit.
  const wanted = i18next.language.startsWith('fr') ? 'fr' : 'en';
  if (wanted !== pageLang()) {
    const url = alternateUrl(wanted);
    if (url && !sessionStorage.getItem('lang-redirected')) {
      try {
        sessionStorage.setItem('lang-redirected', '1');
      } catch {
        // stockage indisponible : la garde anti-boucle saute, la redirection reste sûre
        // puisqu'elle n'a lieu que si la page cible diffère de la page courante
      }
      window.location.replace(url);
      return i18next;
    }
  }
  try {
    sessionStorage.removeItem('lang-redirected');
  } catch {
    // sans importance
  }

  updateContent();
  updateLangToggle();

  return i18next;
}

/**
 * Langue réelle du contenu de la page.
 *
 * On ne peut pas se fier à documentElement.lang : il reflète la préférence du
 * visiteur, pas la langue du texte affiché. La source fiable est la balise
 * hreflang qui pointe vers la page courante.
 */
function pageLang() {
  const norm = (p) => p.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const here = norm(window.location.pathname);
  for (const link of document.querySelectorAll('link[rel="alternate"][hreflang]')) {
    try {
      if (norm(new URL(link.href, window.location.origin).pathname) === here) {
        return link.getAttribute('hreflang').startsWith('fr') ? 'fr' : 'en';
      }
    } catch {
      // href illisible : on passe au suivant
    }
  }
  // Pas de hreflang exploitable : le chemin /blog/en/ tranche, sinon français.
  return window.location.pathname.includes('/blog/en/') ? 'en' : 'fr';
}

/**
 * URL de la page dans une autre langue, telle que la page la déclare elle-même
 * via <link rel="alternate" hreflang="…">. Les articles de blog existent en deux
 * versions distinctes : leur contenu est du texte en dur, il ne peut pas être
 * retraduit sur place.
 */
function alternateUrl(lng) {
  const link = document.querySelector(`link[rel="alternate"][hreflang="${lng}"]`);
  if (!link) return null;
  try {
    const target = new URL(link.href, window.location.origin);
    const here = new URL(window.location.href);
    // Une alternative qui pointe sur la page courante n'en est pas une.
    if (target.pathname.replace(/\.html$/, '') === here.pathname.replace(/\.html$/, '')) return null;
    // Les balises hreflang portent l'URL de production. On n'en garde que le
    // chemin, pour rester sur le domaine courant — sans quoi une preview de
    // déploiement ou le serveur local renverraient le visiteur vers le site en ligne.
    return here.origin + target.pathname + target.search + target.hash;
  } catch {
    return null;
  }
}

export function changeLanguage(lng) {
  // La langue est mémorisée avant toute navigation, pour que la page d'arrivée
  // affiche déjà la bonne version de son menu et de son pied de page.
  try {
    localStorage.setItem('lang', lng);
  } catch {
    // stockage indisponible : on continue, la traduction reste possible
  }

  const url = alternateUrl(lng);
  if (url) {
    window.location.href = url;
    return;
  }

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

  // L'attribut lang décrit la langue du texte affiché, pas la préférence du
  // visiteur. Sur une page traduisible il suit i18next ; sur une page dont le
  // contenu est figé — un article — il doit rester celui du contenu, sous peine
  // d'annoncer aux moteurs et aux lecteurs d'écran une langue qui n'est pas la bonne.
  document.documentElement.lang = hasAlternates()
    ? pageLang()
    : (i18next.language.startsWith('fr') ? 'fr' : 'en');
}

/** Une page qui déclare des versions alternatives a un contenu figé. */
function hasAlternates() {
  return document.querySelectorAll('link[rel="alternate"][hreflang]').length > 0
    && alternateUrl('fr') !== alternateUrl('en');
}

function updateLangToggle() {
  const currentLang = i18next.language.startsWith('fr') ? 'fr' : 'en';
  const flags = { fr: '🇫🇷', en: '🇬🇧' };
  document.querySelectorAll('.lang-toggle__btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
  const selectedFlag = document.querySelector('.lang-toggle__selected .lang-flag');
  if (selectedFlag) selectedFlag.textContent = flags[currentLang];
}

export { i18next };
