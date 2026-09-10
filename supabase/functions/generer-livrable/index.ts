/**
 * Livrable généré pour un dossier ou une tâche — moteur de pilotage.
 *
 * Généralise la note de positionnement : la trame est libre (C-01, BRIEF-ESSAI…),
 * et le contexte peut porter sur une tâche précise. Écrit un BROUILLON ; la
 * relecture et la publication restent des gestes humains dans l'interface.
 * La fonction note-positionnement d'origine n'est pas modifiée.
 */
import Anthropic from 'npm:@anthropic-ai/sdk';
import { CORS, json, MODELE, ouvrirAdmin, contexteTache, decrireContexte, servir } from '../_shared/partage.ts';

servir(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const auth = await ouvrirAdmin(req);
  if (!auth.ok) return auth.reponse;
  const { user, admin, cle } = auth;

  const { student_id, trame_code, tache_id } = await req.json();
  if (!trame_code) return json({ error: 'trame_code manquant.' }, 400);

  const ctx = tache_id ? await contexteTache(admin, tache_id) : null;
  const studentId = ctx?.tache.student_id ?? student_id;
  if (!studentId) return json({ error: 'student_id ou tache_id requis.' }, 400);

  const [{ data: eleve }, { data: trame }, { data: donnees }, { data: cibles }, { data: items }] = await Promise.all([
    admin.from('carmine_students').select('*').eq('id', studentId).single(),
    admin.from('carmine_trames').select('*').eq('code', trame_code).single(),
    admin.from('carmine_donnees_eleve').select('rubrique, donnees').eq('student_id', studentId),
    admin.from('carmine_cibles_eleve').select('verdict, retenue, carmine_universites(*)').eq('student_id', studentId).order('ordre'),
    admin.from('carmine_suivi_items').select('type, titre, reference, retenu, desaccord, question').eq('student_id', studentId),
  ]);
  if (!eleve) return json({ error: 'Dossier introuvable.' }, 404);
  if (!trame) return json({ error: `Trame ${trame_code} introuvable.` }, 404);

  const contexte = [
    ctx ? decrireContexte(ctx) : `## Élève\n${eleve.first_name} ${eleve.last_name} · ${eleve.current_class} · terminale ${eleve.terminale_year} · ${(eleve.tracks ?? []).join(', ')}`,
    ``,
    `## Données saisies par la famille`,
    (donnees ?? []).length
      ? (donnees ?? []).map((d) => `### ${d.rubrique}\n${JSON.stringify(d.donnees, null, 2)}`).join('\n\n')
      : 'Aucune donnée saisie.',
    ``,
    `## Journal de l'élève (lectures, projets, essais)`,
    (items ?? []).length
      ? (items ?? []).map((i) => `- [${i.type}] ${i.titre}${i.reference ? ` (${i.reference})` : ''}${i.retenu ? `\n  Retenu : ${i.retenu}` : ''}${i.desaccord ? `\n  Désaccord : ${i.desaccord}` : ''}${i.question ? `\n  Question : ${i.question}` : ''}`).join('\n')
      : 'Journal vide.',
    ``,
    `## Universités du dossier`,
    (cibles ?? []).map((c) => {
      const u = c.carmine_universites as Record<string, unknown> | null;
      return u ? `- ${u.etablissement}${u.cursus ? ` — ${u.cursus}` : ''} (${u.pays}) · ${c.retenue ? 'retenue' : 'envisagée'} · ${c.verdict ?? ''}` : '';
    }).filter(Boolean).join('\n') || 'Aucune.',
  ].join('\n');

  const anthropic = new Anthropic({ apiKey: cle });
  const flux = anthropic.messages.stream({
    model: MODELE,
    max_tokens: 16000,
    system: [
      `Tu es le rédacteur des livrables de Carmine Admission, cabinet de conseil en admissions `
      + `universitaires internationales. Tu écris en français, pour un consultant qui relira et `
      + `corrigera avant de transmettre.`,
      ``,
      trame.consignes ?? '',
      ``,
      `# Trame à suivre`,
      trame.contenu,
    ].join('\n'),
    messages: [{ role: 'user', content: `${contexte}\n\nRédige le livrable en markdown, en suivant la trame. Ne réponds que par le livrable, sans préambule.` }],
  });
  const message = await flux.finalMessage();
  const contenu = message.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('');

  const { data: livrable, error } = await admin.from('carmine_livrables').insert({
    student_id: studentId,
    tache_id: tache_id ?? null,
    trame_code,
    titre: `${trame.titre} — ${eleve.first_name} ${eleve.last_name}${ctx?.universite ? ` — ${ctx.universite.etablissement}` : ''}`,
    contenu,
    statut: 'brouillon',
    modele: message.model,
    tokens_entree: message.usage.input_tokens,
    tokens_sortie: message.usage.output_tokens,
    genere_le: new Date().toISOString(),
    cree_par: user.id,
  }).select().single();
  if (error) return json({ error: error.message }, 500);
  return json({ livrable });
});
