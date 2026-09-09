/**
 * Moteur de pilotage — entrée de la page /moteur.
 *
 * Construit à côté de l'ancien portail, sans le modifier : il reprend la
 * connexion, le rôle et l'habillage du site, et écrit dans ses propres tables.
 * Réservé à l'administration ; la page n'est liée nulle part.
 *
 *   /moteur                    liste des fiches université (lot 1)
 *   /moteur?universite=<id>    validation d'une fiche
 */
import '../../css/moteur.css';
import { getProfile, signOut } from './donnees.js';
import { initLang, t, esc } from './lang.js';
import { vueFiches } from './vues/fiches.js';
import { vueUniversite } from './vues/universite.js';

const app = document.getElementById('portal-app');
const params = new URLSearchParams(location.search);

(async function start() {
  try {
    initLang();
    const profile = await getProfile();
    if (!profile) {
      location.href = '/espace-client';
      return;
    }
    if (profile.role !== 'admin') {
      app.innerHTML = `
        <div class="portal__inner portal__inner--narrow">
          <div class="portal-msg portal-msg--err is-visible">${esc(t('adminOnly'))}</div>
        </div>`;
      return;
    }
    const universite = params.get('universite');
    if (universite) {
      await vueUniversite(app, universite);
    } else {
      const vue = await vueFiches(app);
      vue.onSignOut(signOut);
    }
  } catch (err) {
    app.innerHTML = `
      <div class="portal__inner portal__inner--narrow">
        <div class="portal-msg portal-msg--err is-visible">${esc(err.message)}</div>
      </div>`;
  }
})();
