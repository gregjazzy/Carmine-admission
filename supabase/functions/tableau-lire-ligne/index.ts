/**
 * Tableau animé — lire une ligne de calcul écrite au stylet (Excellens O3, 10 oct. 2026).
 *
 * L'élève écrit une ligne de son calcul à la main dans la bande de l'entraînement ; le tableau envoie l'image de cette
 * seule ligne (recadrée, en noir sur blanc, petite) ; la fonction la fait lire par Claude et rend le texte lu.
 * Le modèle ne corrige rien et ne calcule rien : il recopie. La correction reste celle du tableau, ligne par ligne.
 * On ne donne jamais la ligne attendue au modèle : il lirait ce qu'il attend, et cacherait les erreurs de recopie.
 *
 * Phase d'essai : protégée par le code professeur (même empreinte que tableau-classeurs), le temps de mesurer la
 * lecture sur de vraies écritures d'enfant. modele : 'haiku' (par défaut) ou 'sonnet', pour comparer.
 * Déploiement : Edge Functions ▸ tableau-lire-ligne, « Verify JWT » désactivé (le site appelle avec la clé publiable).
 * Clé : le secret ANTHROPIC_API_KEY du projet.
 */
import Anthropic from 'npm:@anthropic-ai/sdk@0.68.0';

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

const CONSIGNE = `Tu lis UNE ligne de calcul écrite à la main par un enfant (de 9 à 14 ans), sur une tablette.
Recopie exactement ce qui est écrit, caractère par caractère. Ne corrige rien, ne calcule rien, ne complète rien, même si le calcul est faux ou incomplet : on veut lire ce que l'enfant a écrit, pas ce qu'il aurait dû écrire.
Caractères possibles : les chiffres, la virgule décimale (à la française : 12,4), + − × ÷, les parenthèses ( ) et les crochets [ ], et parfois un = au début de la ligne.
Écris × pour la multiplication (même si l'enfant a écrit x ou un point) et ÷ pour la division (même s'il a écrit : ou /), − pour la soustraction.
Si un caractère est vraiment illisible, écris ? à sa place ; ne devine pas.
Réponds uniquement par la ligne recopiée, sans phrase autour.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { code, image, modele } = await req.json();
    if (typeof code !== 'string' || await sha256(normaliser(code)) !== EMPREINTE) return json({ error: 'code' }, 401);
    if (typeof image !== 'string' || !image.length || image.length > MAX_BASE64 || !/^[A-Za-z0-9+/=]+$/.test(image)) return json({ error: 'image' }, 400);
    const choix = MODELES[modele] ? modele : 'haiku';
    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
    const t0 = Date.now();
    const r = await client.messages.create({
      model: MODELES[choix], max_tokens: 120, system: CONSIGNE,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: image } },
        { type: 'text', text: 'Recopie cette ligne.' }] }],
    });
    const lu = r.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('').trim();
    return json({ lu, modele: choix, ms: Date.now() - t0, entree: r.usage.input_tokens, sortie: r.usage.output_tokens });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
