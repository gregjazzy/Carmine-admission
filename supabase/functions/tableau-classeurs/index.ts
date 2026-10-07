/**
 * Tableau animé — les fichiers des cours et des classeurs d'élèves (espace « tableau-cours »).
 *
 * Avant (6 oct. 2026), le site écrivait lui-même dans l'espace avec la clé publique, et une règle permettait
 * aussi de lister les dossiers eleves/ et profs/ : n'importe qui pouvait retrouver tous les classeurs.
 * Désormais seul le professeur écrit, par cette fonction, qui vérifie son code :
 *   - « autoriser » : rend une autorisation d'écrire UN fichier (lien signé d'envoi), que le navigateur utilise
 *     aussitôt ; le fichier part directement dans l'espace, sans passer par la fonction (pas de limite de taille ici) ;
 *   - « vider » : supprime les séances d'un élève (pour fermer son classeur ; l'index est réécrit par le site).
 * Les élèves lisent toujours par les adresses publiques des fichiers, qu'ils ne peuvent pas deviner.
 * Ensuite : outils/supabase-classeurs-fermer.sql (dépôt tableau-anime) retire les anciennes règles.
 *
 * Code professeur : on compare l'empreinte SHA-256 du code (en minuscules, sans espaces). Changer le code :
 * remplacer EMPREINTE par l'empreinte du nouveau code.
 * Déploiement : Edge Functions ▸ tableau-classeurs, « Verify JWT » désactivé (le site appelle avec la clé publiable).
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const ESPACE = 'tableau-cours';
const EMPREINTE = '3e0bfac55aa74dfbc03d8a7c3e944895656caae5c5d587efdb6ff01aee22b376';
const normaliser = (t: string) => t.trim().toLowerCase().replace(/\s+/g, '');
async function sha256(t: string) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, '0')).join('');
}
// un cours envoyé (à la racine, jamais remplacé), ou un fichier de classeur
const cheminCours = (c: string) => /^[a-z0-9]{10,40}\.json\.gz$/.test(c);
const cheminClasseur = (c: string) => /^(eleves|profs)\/[a-z0-9]{4,40}\/[a-z0-9-]{1,60}\.json\.gz$/.test(c);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { code, action, chemin, remplacer, eleve } = await req.json();
    if (typeof code !== 'string' || await sha256(normaliser(code)) !== EMPREINTE) return json({ error: 'code' }, 401);
    const espace = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!).storage.from(ESPACE);

    if (action === 'autoriser') {
      if (typeof chemin !== 'string' || !(cheminCours(chemin) || cheminClasseur(chemin))) return json({ error: 'chemin' }, 400);
      const upsert = cheminClasseur(chemin) && !!remplacer;           // un cours envoyé ne remplace jamais rien
      const { data, error } = await espace.createSignedUploadUrl(chemin, { upsert });
      if (error) return json({ error: error.message }, 400);
      return json({ chemin: data.path, jeton: data.token });
    }

    if (action === 'vider') {
      if (typeof eleve !== 'string' || !/^[a-z0-9]{4,40}$/.test(eleve)) return json({ error: 'eleve' }, 400);
      const { data, error } = await espace.list('eleves/' + eleve, { limit: 1000 });
      if (error) return json({ error: error.message }, 400);
      const noms = (data || []).map(f => 'eleves/' + eleve + '/' + f.name).filter(n => !n.endsWith('/index.json.gz'));
      if (noms.length) { const r = await espace.remove(noms); if (r.error) return json({ error: r.error.message }, 400); }
      return json({ supprimes: noms.length });
    }

    return json({ error: 'action' }, 400);
  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e).slice(0, 300) }, 500);
  }
});
