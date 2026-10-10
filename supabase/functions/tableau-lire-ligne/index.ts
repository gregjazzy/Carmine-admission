/**
 * Tableau animé — lire une ligne de calcul écrite au stylet (Excellens O3, 10 oct. 2026).
 *
 * L'élève écrit une ligne de son calcul à la main dans la bande de l'entraînement ; le tableau envoie l'image de cette
 * seule ligne (recadrée, en noir sur blanc, petite) ; la fonction la fait lire par Claude et rend le texte lu.
 * Le modèle ne corrige rien et ne calcule rien : il recopie. La correction reste celle du tableau, ligne par ligne.
 * On ne donne jamais la ligne attendue au modèle : il lirait ce qu'il attend, et cacherait les erreurs de recopie.
 *
 * Accès : le code professeur (même empreinte que tableau-classeurs), ou l'identifiant du classeur d'un élève (secret,
 * comme son lien) : chez lui, sa tablette n'a pas le code. Pour un classeur : il doit exister, et un plafond de
 * PLAFOND lectures par jour (compteur dans eleves/<id>/lectures/<date>.json de l'espace tableau-cours).
 * caracteres : les touches du pavé de la case (les caractères possibles) ; sans eux, une ligne de calcul.
 * modele : 'haiku' (par défaut) ou 'sonnet'.
 * Déploiement : Edge Functions ▸ tableau-lire-ligne, « Verify JWT » désactivé (le site appelle avec la clé publiable).
 * Clé : le secret ANTHROPIC_API_KEY du projet.
 */
import Anthropic from 'npm:@anthropic-ai/sdk@0.68.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const EMPREINTE = '3e0bfac55aa74dfbc03d8a7c3e944895656caae5c5d587efdb6ff01aee22b376';
const normaliser = (t: string) => t.trim().toLowerCase().replace(/\s+/g, '');
async function sha256(t: string) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, '0')).join('');
}

const MODELES: Record<string, string> = { haiku: 'claude-haiku-5-5', sonnet: 'claude-sonnet-5-5' };
const MAX_BASE64 = 400_000;      // une seule ligne, déjà réduite par le navigateur : quelques dizaines de ko
const PLAFOND = 300;             // lectures par élève et par jour (environ 2 centimes au pire)
const ESPACE = 'tableau-cours';

const CONSIGNE = `Tu lis UNE ligne de calcul écrite à la main par un enfant (de 9 à 14 ans), sur une tablette.
Recopie exactement ce qui est écrit, caractère par caractère. Ne corrige rien, ne calcule rien, ne complète rien, même si le calcul est faux ou incomplet : on veut lire ce que l'enfant a écrit, pas ce qu'il aurait dû écrire.
Caractères possibles : les chiffres, la virgule décimale (à la française : 12,4), + − × ÷, les parenthèses ( ) et les crochets [ ], et parfois un = au début de la ligne (sauf si on te donne une autre liste).
Écris × pour la multiplication (même si l'enfant a écrit x ou un point) et ÷ pour la division (même s'il a écrit : ou /), − pour la soustraction. Exception : si la liste de caractères possibles contient la lettre x (ou y, n), c'est une lettre, pas une multiplication ; et si elle contient /, une barre de fraction s'écrit avec /.
Utilise exactement les caractères de la liste (∞, ∪, √, π, ;, crochets d'intervalle…) quand on te la donne.
Si un caractère est vraiment illisible, écris ? à sa place ; ne devine pas.
Réponds uniquement par la ligne recopiée, sans phrase autour.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { code, classeur, image, modele, caracteres } = await req.json();
    const prof = typeof code === 'string' && await sha256(normaliser(code)) === EMPREINTE;
    if (!prof) {                                   // un élève, chez lui : son classeur existe, et le plafond du jour
      if (typeof classeur !== 'string' || !/^[a-z0-9]{4,40}$/.test(classeur)) return json({ error: 'code' }, 401);
      const espace = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!).storage.from(ESPACE);
      const { data: liste } = await espace.list('eleves/' + classeur, { limit: 1, search: 'index.json.gz' });
      if (!liste || !liste.length) return json({ error: 'classeur' }, 401);
      const chemin = 'eleves/' + classeur + '/lectures/' + new Date().toISOString().slice(0, 10) + '.json';
      const { data: f } = await espace.download(chemin);
      const n = f ? (JSON.parse(await f.text()).n || 0) : 0;
      if (n >= PLAFOND) return json({ error: 'plafond' }, 429);
      await espace.upload(chemin, new Blob([JSON.stringify({ n: n + 1 })], { type: 'application/json' }), { upsert: true });
    }
    const liste = typeof caracteres === 'string' && caracteres.length && caracteres.length <= 200 ? caracteres : '';
    if (typeof image !== 'string' || !image.length || image.length > MAX_BASE64 || !/^[A-Za-z0-9+/=]+$/.test(image)) return json({ error: 'image' }, 400);
    const choix = MODELES[modele] ? modele : 'haiku';
    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
    const t0 = Date.now();
    const r = await client.messages.create({
      model: MODELES[choix], max_tokens: 120, system: CONSIGNE,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: image } },
        { type: 'text', text: liste ? 'Recopie cette réponse. Caractères possibles : ' + liste + ' (et les chiffres).' : 'Recopie cette ligne.' }] }],
    });
    const lu = r.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('').trim();
    return json({ lu, modele: choix, ms: Date.now() - t0, entree: r.usage.input_tokens, sortie: r.usage.output_tokens });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
