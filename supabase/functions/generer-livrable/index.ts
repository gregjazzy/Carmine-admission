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

/** Ce que l'université publie comme niveau, en une ligne, ou l'aveu que rien n'est renseigné. */
function decrireNiveau(u: Record<string, unknown>): string {
  const parts: string[] = [];
  if (u.taux_admission != null) parts.push(`admission ${((u.taux_admission as number) * 100).toFixed(1)} %`);
  if (u.sat_lecture_25 != null) parts.push(`SAT lecture ${u.sat_lecture_25}-${u.sat_lecture_75}, maths ${u.sat_maths_25}-${u.sat_maths_75}`);
  if (u.act_25 != null) parts.push(`ACT ${u.act_25}-${u.act_75}`);
  if (u.sat_moyen != null) parts.push(`SAT moyen ${u.sat_moyen}`);
  if (u.politique_test) parts.push(`tests : ${u.politique_test}`);
  if (u.offre_type) parts.push(`offre type ${u.offre_type}`);
  if (u.eligibilite) parts.push(`bac français attendu : ${u.eligibilite}`);
  if (u.seuil_points != null) parts.push(`seuil ${u.seuil_points}`);
  if (!parts.length) return 'Niveau non renseigné : écris « [niveau non renseigné] » dans le tableau, ne devine rien.';
  return `${parts.join(' · ')} · source ${u.source ?? 'non précisée'}, millésime ${u.millesime ?? '?'}`;
}

/**
 * Grille de lecture du cabinet, appliquée à tous les élèves de la même façon.
 * Les seuils sont ceux retenus par Carmine, pas des chiffres publiés par les
 * universités américaines, qui n'en publient aucun. À réviser avec l'expérience.
 */
const GRILLE_LECTURE = `## Grille de lecture des notes françaises (règle du cabinet)
Traduction telle que les bureaux d'admission américains la pratiquent (AACRAO EDGE) :
16 à 20 = A, 14 à 15,9 = B, 12 à 13,9 = C ; 18 est exceptionnel en France, dis-le.
Ce qui compte pour une université américaine, dans l'ordre : le rang dans la classe, la
difficulté des spécialités, la progression sur trois ans, puis le score de test face à la
fourchette publiée. Aucune université américaine ne publie de seuil en notes françaises :
le positionnement est un jugement, formule-le comme tel.
Paliers du cabinet pour les États-Unis, selon le taux d'admission :
- moins de 10 % : moyenne 17 ou plus, 5 % du haut de la classe, spécialités à 18, SAT dans
  la moitié haute de la fourchette publiée ;
- 10 à 25 % : moyenne 15,5 ou plus, 10 % du haut, SAT dans la fourchette ;
- plus de 25 % : moyenne 14 ou plus, quart du haut, SAT au moins au 25e centile ou test facultatif.
Royaume-Uni : compare d'abord au bac français attendu publié par l'université. À défaut,
équivalences du cabinet : A*A*A ≈ 17/20 avec 18 dans les spécialités du cursus, AAA ≈ 16 avec 17,
AAB ≈ 15 avec 16, ABB ≈ 14 avec 15.
Quand une donnée manque (rang, score, niveau de l'université), écris-le, ne l'estime pas.`;

servir(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const auth = await ouvrirAdmin(req);
  if (!auth.ok) return auth.reponse;
  const { user, admin, cle } = auth;

  const corps = await req.json();
  const { student_id, trame_code, tache_id, compte_rendu_id } = corps;
  const langue = String(corps.langue ?? 'fr') === 'en' ? 'en' : 'fr';
  const consigneLangue = langue === 'en' ? 'Write in English, British spelling.' : 'Tu écris en français.';
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

  // Le compte rendu qui a ouvert ou relancé le dossier : son texte et ce qu'on en a tiré.
  let compteRendu = '';
  if (compte_rendu_id) {
    const { data: cr } = await admin.from('carmine_comptes_rendus').select('source, texte, proposition, created_at').eq('id', compte_rendu_id).maybeSingle();
    if (cr) {
      const p = (cr.proposition ?? {}) as Record<string, unknown>;
      compteRendu = [
        `## Compte rendu du ${String(cr.created_at).slice(0, 10)} (${cr.source})`,
        cr.texte,
        '',
        `### Ce qui en a été tiré`,
        `Questions à la famille : ${((p.questions_famille as string[]) ?? []).join(' · ') || 'aucune'}`,
        `Vérifications Carmine : ${((p.verifications_carmine as string[]) ?? []).join(' · ') || 'aucune'}`,
        `Ambiguïtés : ${((p.ambiguites as string[]) ?? []).join(' · ') || 'aucune'}`,
        `Souhaits : ${((p.souhaits as string[]) ?? []).join(' · ') || 'aucun'}`,
        `Contact : ${(p.dossier as Record<string, string>)?.contact_nom ?? ''} ${(p.dossier as Record<string, string>)?.contact_email ?? ''}`,
      ].join('\n');
    }
  }
  const { data: tachesDossier } = await admin.from('carmine_taches')
    .select('titre, statut, echeance, owners, milestone_id, type')
    .eq('student_id', studentId).in('statut', ['a_venir', 'a_faire', 'en_cours', 'fait']).order('echeance');

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
    compteRendu,
    ``,
    `## Calendrier du dossier (tâches, par échéance)`,
    (tachesDossier ?? []).length
      ? (tachesDossier ?? []).map((x) => `- ${x.echeance} · ${x.titre} · ${x.statut} · ${(x.owners ?? []).join('/')}`).join('\n')
      : 'Aucune tâche générée.',
    ``,
    `## Universités du dossier et niveau publié`,
    (cibles ?? []).map((c) => {
      const u = c.carmine_universites as Record<string, unknown> | null;
      return u ? `- ${u.etablissement}${u.cursus ? ` — ${u.cursus}` : ''} (${u.pays}) · ${c.retenue ? 'retenue' : 'envisagée'}${c.verdict ? ` · ${c.verdict}` : ''}\n  ${decrireNiveau(u)}` : '';
    }).filter(Boolean).join('\n') || 'Aucune.',
    ``,
    GRILLE_LECTURE,
  ].join('\n');

  const anthropic = new Anthropic({ apiKey: cle });
  const flux = anthropic.messages.stream({
    model: MODELE,
    max_tokens: 16000,
    system: [
      `Tu es le rédacteur des livrables de Carmine Admission, cabinet de conseil en admissions `
      + `universitaires internationales. ${consigneLangue} Pour un consultant qui relira et `
      + `corrigera avant de transmettre.`,
      ``,
      trame.consignes ?? '',
      ``,
      `# Trame à suivre`,
      trame.contenu,
    ].join('\n'),
    messages: [{ role: 'user', content: `${contexte}\n\nRédige le livrable en markdown, en suivant la trame${langue === 'en' ? ', in English' : ''}. Ne réponds que par le livrable, sans préambule.` }],
  });
  const message = await flux.finalMessage();
  let contenu = message.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('').trim();
  let objet: string | null = null;
  if (trame.type === 'email') {
    const [premiere, ...reste] = contenu.split('\n');
    objet = premiere.replace(/^objet\s*:\s*/i, '').trim();
    contenu = reste.join('\n').trim();
  }

  const { data: livrable, error } = await admin.from('carmine_livrables').insert({
    student_id: studentId,
    tache_id: tache_id ?? null,
    trame_code,
    titre: objet || `${trame.titre} — ${eleve.first_name} ${eleve.last_name}${ctx?.universite ? ` — ${ctx.universite.etablissement}` : ''}`,
    objet,
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
