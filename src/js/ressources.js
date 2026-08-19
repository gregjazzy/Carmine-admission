/**
 * Ressources — la porte et la livraison.
 *
 * Le compte est le compte Carmine : même session que l'espace client (un
 * client connecté est déjà reconnu ici) et que Summit demain. La création
 * est libre — c'est l'aimant à prospects.
 *
 * Une ressource « contre compte » se prend en trois temps :
 *   compte → fiche (prénom, nom, classe — une fois) → lecture.
 * La fonction serveur (/api/ressource) revérifie tout et sert le document
 * filigrané au nom du compte ; ici on ne fait qu'orchestrer.
 */
import supabase from './supabase.js';

const zone = document.querySelector('[data-el=auth]');
const modal = document.querySelector('[data-el=fiche]');
if (zone) init();

let sessionCourante = null;
let ressourceEnAttente = null;

async function init() {
  const { data } = await supabase.auth.getSession();
  sessionCourante = data.session;
  renderAuth();

  supabase.auth.onAuthStateChange((_e, session) => {
    sessionCourante = session;
    renderAuth();
  });

  // les boutons de ressources gardées
  document.querySelectorAll('[data-ressource]').forEach((btn) => {
    btn.addEventListener('click', () => demander(btn.dataset.ressource, btn));
  });

  modal.querySelector('[data-el=fiche-annuler]').addEventListener('click', () => {
    modal.hidden = true;
  });
  modal.querySelector('[data-el=fiche-valider]').addEventListener('click', validerFiche);
}

/* ── La porte : connexion / création ─────────────────────────────────────── */

const fr = document.documentElement.lang !== 'en';
const T = (frTxt, enTxt) => (fr ? frTxt : enTxt);

function renderAuth() {
  if (sessionCourante) {
    zone.innerHTML = `
      <div class="res-auth__connected">
        <p>${T('Connecté :', 'Signed in:')} <strong>${esc(sessionCourante.user.email)}</strong></p>
        <button class="btn btn--secondary" data-el="deconnexion">${T('Se déconnecter', 'Sign out')}</button>
      </div>`;
    zone.querySelector('[data-el=deconnexion]').addEventListener('click', async () => {
      await supabase.auth.signOut();
    });
    return;
  }

  zone.innerHTML = `
    <form class="contact-form res-auth__form" data-el="form-auth">
      <div class="form-row">
        <div class="form-group">
          <label for="auth-email">${T('Adresse électronique', 'Email address')}</label>
          <input type="email" id="auth-email" required autocomplete="email">
        </div>
        <div class="form-group">
          <label for="auth-mdp">${T('Mot de passe', 'Password')}</label>
          <input type="password" id="auth-mdp" required minlength="8" autocomplete="new-password"
                 placeholder="${T('8 caractères minimum', '8 characters minimum')}">
        </div>
      </div>
      <div class="res-auth__actions">
        <button type="submit" class="btn btn--primary" data-mode="creer">${
          T('Créer mon compte gratuit', 'Create my free account')}</button>
        <button type="submit" class="btn btn--secondary" data-mode="connexion">${
          T('J’ai déjà un compte', 'I already have an account')}</button>
      </div>
      <p class="form-status" data-el="statut"></p>
    </form>`;

  const form = zone.querySelector('[data-el=form-auth]');
  let mode = 'creer';
  form.querySelectorAll('button[data-mode]').forEach((b) =>
    b.addEventListener('click', () => { mode = b.dataset.mode; }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('#auth-email').value.trim();
    const mdp = form.querySelector('#auth-mdp').value;
    const statut = form.querySelector('[data-el=statut]');
    statut.className = 'form-status';
    statut.textContent = '…';
    try {
      if (mode === 'creer') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: mdp,
          options: { emailRedirectTo: `${window.location.origin}/ressources` },
        });
        if (error) throw error;
        if (!data.session) {
          statut.className = 'form-status success';
          statut.textContent = T(
            'Presque : un message de confirmation vient de partir — cliquez son lien, puis revenez ici.',
            'Almost there: a confirmation email is on its way — click its link, then come back here.');
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: mdp });
        if (error) throw error;
      }
    } catch (err) {
      statut.className = 'form-status error';
      statut.textContent = /invalid login/i.test(err.message)
        ? T('Adresse ou mot de passe incorrect.', 'Wrong email or password.')
        : err.message;
    }
  });
}

/* ── La demande d'une ressource ──────────────────────────────────────────── */

async function demander(nom, btn) {
  if (!sessionCourante) {
    document.getElementById('compte').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // la fiche est-elle remplie ? (une fois pour toutes)
  const { data: fiche } = await supabase
    .from('carmine_contacts')
    .select('user_id')
    .eq('user_id', sessionCourante.user.id)
    .maybeSingle();

  if (!fiche) {
    ressourceEnAttente = { nom, btn };
    modal.hidden = false;
    return;
  }
  await livrer(nom, btn);
}

async function validerFiche() {
  const prenom = document.getElementById('fiche-prenom').value.trim();
  const nomFamille = document.getElementById('fiche-nom').value.trim();
  const classe = document.getElementById('fiche-classe').value;
  const statut = modal.querySelector('[data-el=fiche-statut]');
  if (!prenom || !nomFamille || !classe) {
    statut.className = 'form-status error';
    statut.textContent = T('Les trois réponses sont nécessaires.', 'All three answers are needed.');
    return;
  }
  statut.textContent = '…';
  const { error } = await supabase.from('carmine_contacts').insert({
    user_id: sessionCourante.user.id,
    email: sessionCourante.user.email,
    first_name: prenom,
    last_name: nomFamille,
    classe,
  });
  if (error && !/duplicate/i.test(error.message)) {
    statut.className = 'form-status error';
    statut.textContent = error.message;
    return;
  }
  modal.hidden = true;
  if (ressourceEnAttente) {
    const { nom, btn } = ressourceEnAttente;
    ressourceEnAttente = null;
    await livrer(nom, btn);
  }
}

/* ── La livraison : la fonction sert le document filigrané ───────────────── */

async function livrer(nom, btn) {
  const texte = btn.textContent;
  btn.disabled = true;
  btn.textContent = '…';
  try {
    const reponse = await fetch(`/api/ressource?nom=${encodeURIComponent(nom)}`, {
      headers: { authorization: `Bearer ${sessionCourante.access_token}` },
    });
    if (!reponse.ok) throw new Error(`livraison : ${reponse.status}`);
    const blob = await reponse.blob();
    const urlBlob = URL.createObjectURL(blob);
    window.open(urlBlob, '_blank');
  } catch (err) {
    console.error('Ressource indisponible :', err);
    btn.textContent = T('Réessayer', 'Try again');
    btn.disabled = false;
    return;
  }
  btn.textContent = texte;
  btn.disabled = false;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
