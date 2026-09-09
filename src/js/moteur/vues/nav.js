/** Barre de navigation du moteur : écran du jour, dossiers, fiches. */
import { t, esc } from '../lang.js';

export function nav(active) {
  const item = (key, href, label) =>
    `<a href="${href}" class="moteur-nav__item${active === key ? ' is-active' : ''}">${esc(label)}</a>`;
  return `
    <nav class="moteur-nav" aria-label="Moteur">
      ${item('jour', '/moteur', t('navJour'))}
      ${item('dossiers', '/moteur?vue=dossiers', t('navDossiers'))}
      ${item('fiches', '/moteur?vue=fiches', t('navFiches'))}
    </nav>`;
}
