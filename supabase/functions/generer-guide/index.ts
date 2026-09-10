/**
 * Guide d'une étape — moteur de pilotage.
 *
 * Un guide par étape et par public, généré une fois, relu par le consultant,
 * puis servi à tous les dossiers. Version famille : quoi faire, dans quel
 * ordre, les pièges, sans la méthode. Version interne : la même chose plus le
 * mode opératoire. La matière : le socle (transmis par l'appelant) et, pour
 * une exigence d'université, la fiche validée.
 */
import Anthropic from 'npm:@anthropic-ai/sdk';
import { CORS, json, MODELE, ouvrirAdmin, servir } from '../_shared/partage.ts';

const CONSIGNE = {
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
  const auth = await ouvrirAdmin(req);
  if (!auth.ok) return auth.reponse;
  const { admin, cle } = auth;

  const corps = await req.json();
  const { cle: cleGuide, audience, titre, matiere } = corps;
  const langue = String(corps.langue ?? 'fr') === 'en' ? 'en' : 'fr';
  const consigneLangue = langue === 'en' ? 'Write in English, British spelling.' : 'Tu écris en français.';
  if (!cleGuide || !['famille', 'interne'].includes(audience) || !matiere) {
    return json({ error: 'cle, audience et matiere requis.' }, 400);
  }

  const anthropic = new Anthropic({ apiKey: cle });
  const flux = anthropic.messages.stream({
    model: MODELE,
    max_tokens: 6000,
    system: `${consigneLangue}\n${langue === 'en' ? 'The section headings below are given in French: translate them into English and keep the same structure.\n' : ''}${CONSIGNE[audience as 'famille' | 'interne']}`,
    messages: [{ role: 'user', content: `# Étape : ${titre}\n\n## Matière fournie\n${matiere}\n\nRédige le guide.` }],
  });
  const message = await flux.finalMessage();
  const contenu = message.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('').trim();

  const { data, error } = await admin.from('carmine_guides').upsert({
    cle: cleGuide, audience, langue, titre, contenu, statut: 'brouillon',
    modele: message.model, genere_le: new Date().toISOString(), updated_at: new Date().toISOString(),
  }, { onConflict: 'cle,audience,langue' }).select().single();
  if (error) return json({ error: error.message }, 500);
  return json({ guide: data });
});
