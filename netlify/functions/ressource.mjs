/**
 * Livraison des ressources « contre compte » — la porte réelle.
 *
 * Le document ne vit ni dans le dépôt ni parmi les fichiers publics du site :
 * il dort dans un coffre privé Supabase Storage. Cette fonction est le seul
 * chemin qui y mène, et elle exige trois choses avant de servir :
 *
 *   1. un compte connecté (jeton vérifié auprès de Supabase) ;
 *   2. la fiche de qualification remplie (prénom, nom, classe) ;
 *   3. rien d'autre — pas de paiement à cet étage.
 *
 * Le document part filigrané au nom du compte qui le prend, et chaque
 * téléchargement s'inscrit au journal : c'est le fichier de prospection.
 *
 * Secrets côté Netlify : SUPABASE_SERVICE_KEY (clé service — écrit le journal
 * et lit le coffre ; jamais dans le navigateur).
 */

const SUPABASE_URL = 'https://drfgfpyxviflnqegvwde.supabase.co';
const CLE_PUBLIQUE = 'sb_publishable__xUMoGjeA-1UotBXw0e-KQ_I6pfzQs_';

/** Catalogue : ce que la fonction accepte de servir, et depuis où. */
const CATALOGUE = {
  'guide-ecg': {
    chemin: 'guide-ecg.html', // dans le bucket privé « ressources »
    type: 'text/html; charset=utf-8',
    titre: 'Guide des ECG',
  },
};

export default async (req) => {
  const url = new URL(req.url);
  const nom = url.searchParams.get('nom');
  const fiche = CATALOGUE[nom];
  if (!fiche) return Response.json({ ok: false, erreur: 'ressource inconnue' }, { status: 404 });

  const jeton = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jeton) return Response.json({ ok: false, erreur: 'connexion requise' }, { status: 401 });

  const service = process.env.SUPABASE_SERVICE_KEY;
  if (!service) {
    console.error('SUPABASE_SERVICE_KEY absente des variables Netlify');
    return Response.json({ ok: false }, { status: 500 });
  }

  // 1. Le jeton est-il un vrai compte ? On demande à Supabase, pas au jeton.
  const quiEstCe = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: CLE_PUBLIQUE, authorization: `Bearer ${jeton}` },
  });
  if (!quiEstCe.ok) return Response.json({ ok: false, erreur: 'session invalide' }, { status: 401 });
  const utilisateur = await quiEstCe.json();

  // 2. La fiche de qualification est-elle remplie ?
  const entetesService = {
    apikey: service,
    authorization: `Bearer ${service}`,
    'content-type': 'application/json',
  };
  const contact = await fetch(
    `${SUPABASE_URL}/rest/v1/carmine_contacts?user_id=eq.${utilisateur.id}&select=first_name,last_name`,
    { headers: entetesService }
  ).then((r) => r.json());
  if (!Array.isArray(contact) || !contact.length) {
    return Response.json({ ok: false, erreur: 'fiche requise' }, { status: 403 });
  }

  // 3. Le document, depuis le coffre privé.
  const coffre = await fetch(
    `${SUPABASE_URL}/storage/v1/object/ressources/${fiche.chemin}`,
    { headers: entetesService }
  );
  if (!coffre.ok) {
    console.error('Coffre :', coffre.status, await coffre.text());
    return Response.json({ ok: false, erreur: 'document indisponible' }, { status: 502 });
  }
  let corps = await coffre.text();

  // 4. Le filigrane, au nom du compte — dans le contenu, pas par-dessus.
  const qui = `${contact[0].first_name} ${contact[0].last_name}`.trim() || utilisateur.email;
  const marque = `Remis à ${qui} — ${utilisateur.email} — usage personnel — carmine-admission.com`;
  const filigrane = `
<style>
  body::before {
    content: "${marque.replace(/"/g, '\\"')}  •  ${marque.replace(/"/g, '\\"')}";
    position: fixed; inset: -50%; z-index: 9999; pointer-events: none;
    display: flex; align-items: center; justify-content: center;
    transform: rotate(-30deg);
    font: 600 15px/8 system-ui, sans-serif; letter-spacing: .06em;
    color: rgba(60, 60, 80, 0.11); white-space: pre-wrap; text-align: center;
  }
  @media print { body::before { color: rgba(60, 60, 80, 0.16); } }
</style>
<div style="position:sticky;top:0;z-index:9998;background:#1f2a44;color:#fdfcf9;font:500 12px/1.5 system-ui,sans-serif;padding:8px 16px;text-align:center">
  Document remis à ${qui} — usage personnel · carmine-admission.com
</div>`;
  corps = corps.includes('<body')
    ? corps.replace(/<body([^>]*)>/i, `<body$1>${filigrane}`)
    : filigrane + corps;

  // 5. Au journal — le fichier de prospection s'écrit tout seul.
  await fetch(`${SUPABASE_URL}/rest/v1/carmine_downloads`, {
    method: 'POST',
    headers: entetesService,
    body: JSON.stringify({ user_id: utilisateur.id, ressource: nom }),
  }).catch(() => {}); // un journal muet ne doit pas priver de lecture

  return new Response(corps, {
    headers: {
      'content-type': fiche.type,
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex',
    },
  });
};

export const config = { path: '/api/ressource' };
