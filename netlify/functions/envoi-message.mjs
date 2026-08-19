/**
 * Relais d'envoi des messages — formulaire de contact du site et
 * signalements d'erreur de Summit.
 *
 * Pourquoi une fonction serveur : la clé API Brevo donne le droit d'envoyer
 * n'importe quel mail en notre nom. Elle ne peut donc jamais descendre dans
 * le navigateur — le site est statique, tout son code est public. Ici elle
 * vit dans les variables d'environnement Netlify (BREVO_API_KEY), et le
 * navigateur ne connaît que cette porte, qui ne sait faire qu'une chose :
 * écrire à Carmine.
 *
 * Le destinataire est fixe : personne ne peut se servir de ce relais pour
 * écrire à quelqu'un d'autre.
 */

const DESTINATAIRE = process.env.CONTACT_DESTINATAIRE || 'gregjazzy@gmail.com';
const EXPEDITEUR = process.env.CONTACT_EXPEDITEUR || 'gregjazzy@gmail.com';

// Origines autorisées à appeler ce relais : le site et Summit.
const ORIGINES = [
  'https://www.carmine-admission.com',
  'https://carmine-admission.com',
  'https://sat.carmine-admission.com',
  'https://satcarmin.netlify.app',
];

function corsHeaders(origin) {
  const autorisee =
    ORIGINES.includes(origin) || (origin && origin.startsWith('http://localhost'));
  return {
    'Access-Control-Allow-Origin': autorisee ? origin : ORIGINES[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default async (req) => {
  const origin = req.headers.get('origin') || '';
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST')
    return Response.json({ ok: false }, { status: 405, headers: cors });

  let corps;
  try {
    corps = await req.json();
  } catch {
    return Response.json({ ok: false }, { status: 400, headers: cors });
  }

  const nom = String(corps.nom || '').slice(0, 200).trim();
  const email = String(corps.email || '').slice(0, 200).trim();
  const telephone = String(corps.telephone || '').slice(0, 50).trim();
  const matiere = String(corps.matiere || '').slice(0, 200).trim();
  const message = String(corps.message || '').slice(0, 5000).trim();
  const pot = String(corps.site_web || ''); // pot de miel : un humain le laisse vide

  if (pot) return Response.json({ ok: true }, { headers: cors }); // on ne détrompe pas les robots
  if (!message || !nom)
    return Response.json({ ok: false, erreur: 'champs manquants' }, { status: 400, headers: cors });

  const cle = process.env.BREVO_API_KEY;
  if (!cle) {
    console.error('BREVO_API_KEY absente des variables Netlify');
    return Response.json({ ok: false }, { status: 500, headers: cors });
  }

  const sujet = matiere ? `${nom} — ${matiere}` : `${nom} — nouveau message`;
  const texte = [
    `Nom : ${nom}`,
    email && `Email : ${email}`,
    telephone && `Téléphone : ${telephone}`,
    matiere && `Objet : ${matiere}`,
    '',
    message,
  ]
    .filter(Boolean)
    .join('\n');

  const reponse = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': cle, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'Carmine Admission', email: EXPEDITEUR },
      to: [{ email: DESTINATAIRE }],
      // répondre au message répond directement au visiteur
      ...(email ? { replyTo: { email, name: nom } } : {}),
      subject: sujet,
      textContent: texte,
    }),
  });

  if (!reponse.ok) {
    console.error('Brevo a refusé :', reponse.status, await reponse.text());
    return Response.json({ ok: false }, { status: 502, headers: cors });
  }
  return Response.json({ ok: true }, { headers: cors });
};

export const config = { path: '/api/envoi-message' };
