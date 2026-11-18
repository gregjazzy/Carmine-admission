/**
 * Prévient Bing (IndexNow) après chaque mise en ligne réussie du site.
 *
 * Netlify appelle automatiquement une fonction nommée « deploy-succeeded »
 * à la fin de chaque déploiement réussi. On relit le plan de site en ligne
 * et on envoie toutes ses adresses à IndexNow : Bing (donc ChatGPT et
 * Copilot) apprend tout de suite qu'une page est nouvelle ou modifiée.
 * Seule la production compte : les aperçus de branche sont ignorés.
 */

const HOTE = 'carmine-admission.com';
const CLE = '2d3c6ae0b77a61517d996ba85f77d92d';

export const handler = async (event) => {
  let contexte = 'production';
  try { contexte = JSON.parse(event.body || '{}').payload?.context || contexte; } catch {}
  if (contexte !== 'production') return { statusCode: 200, body: 'ignoré : ' + contexte };

  const xml = await (await fetch(`https://${HOTE}/sitemap.xml`)).text();
  const adresses = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const reponse = await fetch('https://www.bing.com/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOTE, key: CLE, keyLocation: `https://${HOTE}/${CLE}.txt`, urlList: adresses.slice(0, 10000) }),
  });
  console.log(`IndexNow : ${adresses.length} adresses envoyées, réponse ${reponse.status}`);
  return { statusCode: 200, body: String(reponse.status) };
};
