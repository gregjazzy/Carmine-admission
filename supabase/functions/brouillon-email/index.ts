/**
 * Brouillon d'email pour une tâche — moteur de pilotage.
 *
 * Prend la trame email du type de tâche, le contexte du dossier, et demande
 * au modèle un brouillon : objet et corps. Écrit un livrable en statut
 * « brouillon », rattaché à la tâche. L'envoi reste un geste humain, depuis
 * Gmail, après relecture.
 */
import Anthropic from 'npm:@anthropic-ai/sdk';
import { CORS, json, MODELE, ouvrirAdmin, contexteTache, decrireContexte, servir } from '../_shared/partage.ts';

servir(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const auth = await ouvrirAdmin(req);
  if (!auth.ok) return auth.reponse;
  const { user, admin, cle } = auth;

  const { tache_id } = await req.json();
  if (!tache_id) return json({ error: 'tache_id manquant.' }, 400);
  const ctx = await contexteTache(admin, tache_id);
  if (!ctx) return json({ error: 'Tâche introuvable.' }, 404);

  // La trame : celle du type de tâche, sinon la générique.
  const { data: typeCfg } = await admin.from('carmine_types_tache').select('trame_code').eq('type', ctx.tache.type).maybeSingle();
  const code = typeCfg?.trame_code ?? 'EMAIL-GENERIQUE';
  let { data: trame } = await admin.from('carmine_trames').select('*').eq('code', code).maybeSingle();
  if (!trame) ({ data: trame } = await admin.from('carmine_trames').select('*').eq('code', 'EMAIL-GENERIQUE').maybeSingle());
  if (!trame) return json({ error: 'Aucune trame email en base.' }, 500);

  // Le destinataire suit le premier intervenant de la tâche hors Carmine.
  const owners: string[] = ctx.tache.owners ?? [];
  const cible = owners.find((o) => o !== 'carmine') ?? 'parents';
  const emails = ctx.acces
    .filter((a) => (cible === 'eleve' ? a.role === 'eleve' : a.role === 'parent'))
    .map((a) => a.email);

  const anthropic = new Anthropic({ apiKey: cle });
  const reponse = await anthropic.messages.create({
    model: MODELE,
    max_tokens: 4000,
    system: [trame.consignes ?? '', '', '# Trame', trame.contenu].join('\n'),
    messages: [{
      role: 'user',
      content: `${decrireContexte(ctx)}\n\nDestinataire de ce message : ${cible}. Rédige le brouillon.`,
    }],
  });
  const texte = reponse.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('').trim();
  const [premiere, ...reste] = texte.split('\n');
  const objet = premiere.replace(/^objet\s*:\s*/i, '').trim();
  const corps = reste.join('\n').trim();

  const { data: livrable, error } = await admin.from('carmine_livrables').insert({
    student_id: ctx.tache.student_id,
    tache_id,
    trame_code: trame.code,
    titre: objet || ctx.tache.titre,
    objet: objet || ctx.tache.titre,
    contenu: corps,
    destinataire: emails.join(', ') || null,
    statut: 'brouillon',
    modele: reponse.model,
    tokens_entree: reponse.usage.input_tokens,
    tokens_sortie: reponse.usage.output_tokens,
    genere_le: new Date().toISOString(),
    cree_par: user.id,
  }).select().single();
  if (error) return json({ error: error.message }, 500);

  await admin.from('carmine_taches').update({ brouillon_id: livrable.id }).eq('id', tache_id);
  return json({ livrable });
});
