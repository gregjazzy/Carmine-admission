/**
 * Série de guides — usage interne, ponctuel.
 *
 * Génère les deux versions du guide d'une étape du socle, sans session
 * utilisateur : protégée par un jeton de série posé dans les secrets
 * (SERIE_TOKEN), retiré une fois la série faite. La matière est envoyée par
 * l'appelant, jamais lue depuis le navigateur public.
 */
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { CORS, json, MODELE, servir } from '../_shared/partage.ts';

const CONSIGNE: Record<string, string> = {
  famille: `Tu écris, pour une famille accompagnée par Carmine Admission, le guide pratique d'une étape
de candidature universitaire. Français clair, tutoiement pour l'élève quand l'étape lui revient,
vouvoiement pour les parents. Pas de jargon non expliqué, pas de tirets cadratins, pas de majuscules
d'insistance. Une page au plus, en markdown, avec exactement ces sections :

## Ce qu'il faut faire
Une liste numérotée d'actions concrètes, dans l'ordre, chacune en une ligne, avec qui la fait.

## Combien de temps, et quand
Deux ou trois phrases : durée réelle, moment où commencer par rapport à l'échéance.

## Ce qu'on remet, et à qui
Ce que l'élève ou la famille dépose dans l'espace, ce que Carmine remet, ce que l'établissement produit.

## Les pièges
Trois à cinq, tirés de la matière fournie, jamais inventés.

## Comment savoir que c'est fait
Un critère net.

N'ajoute rien qui ne soit pas dans la matière fournie : ni date, ni exigence, ni chiffre. Ce qui
manque reste absent. Ne dévoile pas le mode opératoire interne s'il est fourni : il sert à
comprendre, pas à être recopié.`,
  interne: `Tu écris, pour le consultant de Carmine Admission, le guide interne d'une étape : ce qu'il
fait, ce qu'il fait faire, ce qu'il vérifie. Français direct, tutoiement, pas de tirets cadratins.
Une page et demie au plus, en markdown, avec exactement ces sections :

## Ce que tu fais
Liste numérotée, dans l'ordre, avec le livrable à produire et le geste dans le portail.

## Ce que tu fais faire
À l'élève, aux parents, à l'établissement : quoi, avec quel modèle ou quelle trame.

## Calendrier réel
Durée, gras, moment de démarrage, ce qui se joue avant et après.

## Les pièges
Ceux de la matière fournie, plus ceux que le mode opératoire signale.

## Mode opératoire
Le mode opératoire fourni, réorganisé si utile, sans rien inventer.

## Critère de clôture
Ce qui doit être vrai pour cocher « fait ».

N'invente ni date, ni exigence, ni chiffre. Ce qui manque reste absent.`,
};

servir(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const jeton = Deno.env.get('SERIE_TOKEN');
  const cle = Deno.env.get('ANTHROPIC_API_KEY');
  if (!jeton || !cle) return json({ error: 'Série fermée.' }, 403);
  if (req.headers.get('Authorization') !== `Bearer ${jeton}`) return json({ error: 'Jeton invalide.' }, 403);

  const { cle: cleGuide, titre, matiere, audiences = ['famille', 'interne'], ping, depot } = await req.json();
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  if (ping) {
    const { count, error } = await admin.from('carmine_guides').select('*', { count: 'exact', head: true });
    return json({ ok: !error, guides: count ?? 0, error: error?.message ?? null });
  }
  // Mode dépôt : un texte rédigé ailleurs, posé tel quel, sans appel au modèle.
  // Ne remplace jamais un guide validé.
  if (depot) {
    const { audience, contenu } = depot as { audience: string; contenu: string };
    if (!cleGuide || !titre || !audience || !contenu) return json({ error: 'cle, titre, depot.audience, depot.contenu requis.' }, 400);
    const { data: existant } = await admin.from('carmine_guides').select('id, statut').eq('cle', cleGuide).eq('audience', audience).maybeSingle();
    if (existant?.statut === 'valide') return json({ cle: cleGuide, audience, ignore: 'déjà validé' });
    const { error } = await admin.from('carmine_guides').upsert({
      cle: cleGuide, audience, titre, contenu, statut: 'brouillon',
      modele: 'claude-fable-5-1 (session)', genere_le: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: 'cle,audience' });
    if (error) return json({ error: error.message }, 500);
    return json({ cle: cleGuide, audience, longueur: contenu.length });
  }
  if (!cleGuide || !titre || !matiere) return json({ error: 'cle, titre, matiere requis.' }, 400);

  const anthropic = new Anthropic({ apiKey: cle });
  const faits: Record<string, number> = {};
  for (const audience of audiences as string[]) {
    const { data: existant } = await admin.from('carmine_guides').select('id, statut').eq('cle', cleGuide).eq('audience', audience).maybeSingle();
    if (existant?.statut === 'valide') { faits[audience] = -1; continue; } // jamais écraser un guide validé
    let message;
    try {
      const flux = anthropic.messages.stream({
        model: MODELE, max_tokens: 6000, system: CONSIGNE[audience],
        messages: [{ role: 'user', content: `# Étape : ${titre}\n\n## Matière fournie\n${matiere}\n\nRédige le guide.` }],
      });
      message = await flux.finalMessage();
    } catch (e) {
      return json({ error: `Anthropic : ${(e as Error).message}` }, 502);
    }
    const contenu = message.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('').trim();
    const { error } = await admin.from('carmine_guides').upsert({
      cle: cleGuide, audience, titre, contenu, statut: 'brouillon',
      modele: message.model, genere_le: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: 'cle,audience' });
    if (error) return json({ error: error.message }, 500);
    faits[audience] = contenu.length;
  }
  return json({ cle: cleGuide, faits });
});
