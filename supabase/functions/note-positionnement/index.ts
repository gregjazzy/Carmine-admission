/**
 * Génération assistée d'un livrable — Carmine Admission.
 *
 * Appelée depuis /pilotage par l'administration. Elle rassemble les données
 * saisies par la famille, les cibles du dossier et les médianes du référentiel,
 * demande à Claude un BROUILLON, et l'enregistre en statut « brouillon ».
 * Rien n'est publié ici : la relecture et la publication restent des gestes
 * humains, dans l'interface.
 *
 * La clé Anthropic vit dans les secrets Supabase et ne quitte jamais le serveur.
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *   supabase functions deploy note-positionnement
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@0.68.0';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

/** Résumé lisible d'un établissement, adapté à la nature de sa référence. */
function decrireCible(u: Record<string, unknown>): string {
  const taux = u.taux_admission != null
    ? `admission ${((u.taux_admission as number) * 100).toFixed(1)} %`
    : 'taux d’admission non publié';

  if (u.nature === 'medianes') {
    const tests = u.sat_lecture_25 == null
      ? `tests non applicables (${u.politique_test})`
      : `SAT lecture ${u.sat_lecture_25}-${u.sat_lecture_75}, maths ${u.sat_maths_25}-${u.sat_maths_75}, `
        + `ACT ${u.act_25}-${u.act_75} (${u.politique_test})`;
    return `- ${u.etablissement} (${u.pays}) — ${taux} · ${tests} · source ${u.source}, millésime ${u.millesime}`;
  }

  const reference = u.seuil_points ?? u.offre_type ?? u.eligibilite ?? 'référence non renseignée';
  const cursus = u.cursus ? ` — ${u.cursus}` : '';
  return `- ${u.etablissement}${cursus} (${u.pays}) — ${taux} · ${reference} · source ${u.source}, millésime ${u.millesime}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const cle = Deno.env.get('ANTHROPIC_API_KEY');
  if (!cle) return json({ error: 'ANTHROPIC_API_KEY absente des secrets.' }, 500);

  const autorisation = req.headers.get('Authorization');
  if (!autorisation) return json({ error: 'Authentification requise.' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;

  // Premier client : celui de l'appelant. Les RLS s'appliquent, donc ce test
  // vaut vérification — un parent ne peut pas se faire passer pour l'admin.
  const appelant = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: autorisation } },
  });

  const { data: { user } } = await appelant.auth.getUser();
  if (!user) return json({ error: 'Session invalide.' }, 401);

  const { data: profil } = await appelant
    .from('carmine_profiles').select('role').eq('id', user.id).single();
  if (profil?.role !== 'admin') {
    return json({ error: 'Génération réservée à l’administration.' }, 403);
  }

  const { student_id, trame_code = 'C-01' } = await req.json();
  if (!student_id) return json({ error: 'student_id manquant.' }, 400);

  // Second client : service role, pour lire les trames que même l'admin ne lit
  // qu'à travers les RLS, et pour écrire le livrable.
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const [{ data: eleve }, { data: trame }, { data: donnees }, { data: cibles }] = await Promise.all([
    admin.from('carmine_students').select('*').eq('id', student_id).single(),
    admin.from('carmine_trames').select('*').eq('code', trame_code).single(),
    admin.from('carmine_donnees_eleve').select('rubrique, donnees').eq('student_id', student_id),
    admin.from('carmine_cibles_eleve')
      .select('verdict, carmine_universites(*)')
      .eq('student_id', student_id).order('ordre'),
  ]);

  if (!eleve) return json({ error: 'Dossier introuvable.' }, 404);
  if (!trame) return json({ error: `Trame ${trame_code} introuvable.` }, 404);

  const universites = (cibles ?? []).map((c) => c.carmine_universites).filter(Boolean);
  const millesimes = [...new Set(universites.map((u) => u.millesime))].join(', ') || '—';

  const contexte = [
    `## Dossier`,
    `Élève : ${eleve.first_name} ${eleve.last_name}`,
    `Classe actuelle : ${eleve.current_class} · prise en charge en ${eleve.entry_class}`,
    `Rentrée de terminale : ${eleve.terminale_year}`,
    `Pays visés : ${(eleve.tracks ?? []).join(', ') || 'non renseigné'}`,
    `Établissement : ${eleve.school ?? 'non renseigné'} · ${eleve.city ?? ''}`,
    ``,
    `## Données saisies par la famille`,
    (donnees ?? []).length
      ? (donnees ?? []).map((d) => `### ${d.rubrique}\n${JSON.stringify(d.donnees, null, 2)}`).join('\n\n')
      : 'Aucune donnée saisie. Laisse « [à compléter] » partout où un chiffre manque.',
    ``,
    `## Établissements visés et références publiées`,
    universites.length
      ? universites.map(decrireCible).join('\n')
      : 'Aucune cible sélectionnée. Ne remplis pas le tableau de positionnement.',
  ].join('\n');

  const anthropic = new Anthropic({ apiKey: cle });

  // Streaming : la note est longue et le modèle réfléchit avant d'écrire.
  // En non-streaming, la requête risquerait d'expirer avant la fin.
  const flux = anthropic.messages.stream({
    model: 'claude-opus-5',
    max_tokens: 32000,
    system: [
      `Tu es le rédacteur des livrables de Carmine Admission, cabinet de conseil en `
      + `admissions universitaires internationales. Tu écris en français, pour un `
      + `consultant qui relira et corrigera avant de transmettre à la famille.`,
      ``,
      trame.consignes ?? '',
      ``,
      `# Trame à suivre`,
      trame.contenu,
    ].join('\n'),
    messages: [{
      role: 'user',
      content: `${contexte}\n\nRédige la note en markdown, en suivant la trame. `
        + `Ne réponds que par la note elle-même, sans préambule ni commentaire.`,
    }],
  });

  const message = await flux.finalMessage();
  const contenu = message.content
    .filter((b) => b.type === 'text').map((b) => b.text).join('');

  const { data: livrable, error } = await admin.from('carmine_livrables').insert({
    student_id,
    trame_code,
    titre: `${trame.titre} — ${eleve.first_name} ${eleve.last_name}`,
    contenu,
    statut: 'brouillon',
    modele: message.model,
    millesime_ref: millesimes,
    tokens_entree: message.usage.input_tokens,
    tokens_sortie: message.usage.output_tokens,
    genere_le: new Date().toISOString(),
    cree_par: user.id,
  }).select().single();

  if (error) return json({ error: error.message }, 500);
  return json({ livrable });
});
