/**
 * Intégrer un compte rendu — Carmine Admission, moteur de pilotage.
 *
 * L'administration colle le message d'un parent, ses notes après un appel,
 * ou le message d'un prospect. Le modèle en tire une proposition structurée :
 * le dossier à créer ou à mettre à jour, les universités nommées (reconnues
 * dans le référentiel, inconnues, écartées), ce qui est déjà fait ou commencé,
 * les notes et souhaits, les questions à la famille et les vérifications qui
 * reviennent à Carmine. Rien n'est appliqué ici : la proposition est rendue
 * et enregistrée, l'administration coche, corrige, applique dans l'écran.
 */
import Anthropic from 'npm:@anthropic-ai/sdk';
import { CORS, json, MODELE, ouvrirAdmin, servir } from '../_shared/partage.ts';

const CLASSES = ['', 'sixieme', 'cinquieme', 'quatrieme', 'troisieme', 'seconde', 'premiere', 'terminale', 'apres'];

/** Aucun champ « ou nul » : l'API limite les unions à seize par schéma. Vide = inconnu. */
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['dossier', 'universites', 'faits', 'notes_privees', 'souhaits', 'questions_famille', 'verifications_carmine', 'ambiguites', 'resume'],
  properties: {
    resume: { type: 'string', description: 'La situation en deux ou trois phrases, en français, factuelles' },
    dossier: {
      type: 'object',
      additionalProperties: false,
      required: ['action', 'first_name', 'last_name', 'current_class', 'terminale_year', 'tracks', 'school', 'city', 'contact_email', 'contact_nom'],
      properties: {
        action: { type: 'string', enum: ['creer', 'maj', 'aucun'], description: 'creer si aucun dossier n’est donné, maj si le texte apporte une information nouvelle sur un dossier existant, aucun sinon' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        current_class: { type: 'string', enum: CLASSES, description: 'Classe actuelle dans le système français ; vide si non dite' },
        terminale_year: { type: 'string', description: 'Année civile de la rentrée de terminale, déduite de la classe et de la date du jour ; vide si la classe est inconnue' },
        tracks: { type: 'array', items: { type: 'string', enum: ['uk', 'us', 'eu', 'fr'] }, description: 'Filières visées, déduites des pays ou universités nommés' },
        school: { type: 'string' },
        city: { type: 'string' },
        contact_email: { type: 'string', description: 'Adresse du parent ou du prospect si elle figure dans le texte' },
        contact_nom: { type: 'string', description: 'Nom du parent ou de l’auteur du message si connu' },
      },
    },
    universites: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['nom', 'cursus', 'pays', 'universite_id', 'statut', 'regime', 'tour', 'commentaire'],
        properties: {
          nom: { type: 'string', description: 'Nom tel que dans le référentiel si reconnue, sinon tel que dans le texte' },
          cursus: { type: 'string', description: 'Cursus si nommé ou si le référentiel le distingue ; vide sinon' },
          pays: { type: 'string', enum: ['', 'US', 'Royaume-Uni', 'Pays-Bas', 'Irlande', 'Suisse', 'Suède', 'Canada', 'Autre'] },
          universite_id: { type: 'string', description: 'Identifiant du référentiel si l’université y figure (reconnue ou écartée), vide sinon' },
          statut: { type: 'string', enum: ['reconnue', 'inconnue', 'ecartee'], description: 'reconnue : dans le référentiel ; inconnue : nommée mais absente du référentiel, fiche à lancer ; ecartee : nommée pour dire qu’on n’y va pas' },
          regime: { type: 'string', enum: ['envisagee', 'retenue'], description: 'retenue seulement si le texte dit que la candidature est décidée ou déposée' },
          tour: { type: 'string', enum: ['', 'anticipe', 'ordinaire'] },
          commentaire: { type: 'string', description: 'Ce que le texte dit de cette université, ou pourquoi elle est écartée ; vide sinon' },
        },
      },
    },
    faits: {
      type: 'array',
      description: 'Ce qui est déjà fait ou commencé, rapproché d’une étape du socle ou d’une tâche du dossier quand c’est possible',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['libelle', 'milestone_id', 'tache_id', 'statut', 'date', 'note'],
        properties: {
          libelle: { type: 'string', description: 'Le fait, en une ligne, en français' },
          milestone_id: { type: 'string', description: 'Identifiant du socle (ex. C-05) si le fait correspond à une étape ; vide sinon' },
          tache_id: { type: 'string', description: 'Identifiant d’une tâche du dossier si elle est donnée et correspond ; vide sinon' },
          statut: { type: 'string', enum: ['fait', 'en_cours'] },
          date: { type: 'string', description: 'AAAA-MM-JJ si la date est dite ; vide sinon' },
          note: { type: 'string', description: 'Détail utile (score, version, qui), vide sinon' },
        },
      },
    },
    notes_privees: { type: 'array', items: { type: 'string' }, description: 'Ce qui ne rentre dans aucune case et que le consultant doit garder : contexte familial, contraintes, ton' },
    souhaits: { type: 'array', items: { type: 'string' }, description: 'Ce que la famille ou l’élève dit vouloir : domaine, pays, budget, campus, rythme' },
    questions_famille: { type: 'array', items: { type: 'string' }, description: 'Faits que seule la famille détient et qu’il faut lui demander : spécialités, bulletins et rang, qui a été sollicité au lycée, aide demandée, préférences' },
    verifications_carmine: { type: 'array', items: { type: 'string' }, description: 'Ce que le cabinet vérifie lui-même : exigences de langue et de tests, choix de l’anticipé, retraits, socle de la liste. Jamais demandé à la famille' },
    ambiguites: { type: 'array', items: { type: 'string' }, description: 'Ce que le texte dit sans le préciser : « on a commencé le SAT », « Cambridge » sans cursus, une date absente' },
  },
};

const CONSIGNE = `Tu lis, pour un cabinet de conseil en admissions universitaires internationales, un message
de parent, des notes prises après un appel, ou le message d'un prospect, à propos d'un lycéen du
système français. Tu en tires une proposition structurée selon le schéma. Tu écris en français.

Règles :
- Tu ne rapportes que ce que le texte dit. Ce qu'il ne dit pas reste vide. Ce qu'il dit sans
  le préciser va dans ambiguites.
- Une université n'est « reconnue » que si elle figure dans le référentiel fourni, avec son
  identifiant recopié exactement. « Cambridge » sans cursus, quand le référentiel en distingue
  plusieurs, est reconnue sur l'établissement avec cursus vide, et l'ambiguïté est notée.
- Un fait n'est rapproché d'une étape du socle que si la correspondance est nette. « On a
  commencé le SAT » peut vouloir dire un test blanc, une préparation ou une inscription :
  ambiguïté, pas de milestone_id.
- Sépare toujours les questions à la famille, faits qu'elle seule détient, des vérifications
  qui reviennent au cabinet. On ne demande jamais à une famille ce qu'elle paie pour qu'on vérifie.
- Une arrivée tardive n'est pas un drame : ne l'écris nulle part.
- La date du jour est donnée : déduis-en l'année de terminale à partir de la classe actuelle
  (année scolaire de septembre à août ; un élève de première en septembre 2026 a sa rentrée de
  terminale en 2027).`;

servir(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const auth = await ouvrirAdmin(req);
  if (!auth.ok) return auth.reponse;
  const { user, admin, cle } = auth;

  const corps = await req.json();
  const texte = String(corps.texte ?? '').trim();
  const source = ['parent', 'appel', 'prospect'].includes(corps.source) ? corps.source : 'parent';
  const studentId = corps.student_id ? String(corps.student_id) : null;
  const socle: { id: string; title: string; kind: string }[] = Array.isArray(corps.socle) ? corps.socle : [];
  if (texte.length < 20) return json({ error: 'Le texte est trop court pour être analysé.' }, 400);

  const [{ data: universites }, eleve, cibles, taches] = await Promise.all([
    admin.from('carmine_universites').select('id, pays, etablissement, cursus, filiere').order('pays').order('etablissement'),
    studentId ? admin.from('carmine_students').select('*').eq('id', studentId).single().then((r) => r.data) : Promise.resolve(null),
    studentId ? admin.from('carmine_cibles_eleve').select('universite_id, retenue, tour, carmine_universites(etablissement, cursus)').eq('student_id', studentId).then((r) => r.data ?? []) : Promise.resolve([]),
    studentId ? admin.from('carmine_taches').select('id, titre, milestone_id, type, statut, echeance').eq('student_id', studentId).in('statut', ['a_venir', 'a_faire', 'en_cours']).order('echeance').then((r) => r.data ?? []) : Promise.resolve([]),
  ]);

  const contexte = [
    `Date du jour : ${new Date().toISOString().slice(0, 10)}`,
    `Source du texte : ${source === 'parent' ? 'message d’un parent' : source === 'appel' ? 'notes du consultant après un appel' : 'message d’un prospect'}`,
    '',
    eleve
      ? `## Dossier existant\n${eleve.first_name} ${eleve.last_name} · classe ${eleve.current_class} · rentrée de terminale ${eleve.terminale_year} · filières ${(eleve.tracks ?? []).join(', ')} · ${eleve.school ?? ''} ${eleve.city ?? ''}`
        + `\nUniversités déjà dans le dossier : ${(cibles as Record<string, unknown>[]).map((c) => { const u = c.carmine_universites as Record<string, string> | null; return `${u?.etablissement ?? ''}${u?.cursus ? ` — ${u.cursus}` : ''} (${c.retenue ? 'retenue' : 'envisagée'}${c.tour ? `, ${c.tour}` : ''})`; }).join(' ; ') || 'aucune'}`
        + `\nTâches vivantes du dossier (id · titre · étape · statut) :\n${(taches as Record<string, string>[]).map((x) => `- ${x.id} · ${x.titre} · ${x.milestone_id ?? ''} · ${x.statut}`).join('\n') || '- aucune'}`
      : '## Aucun dossier : proposer la création.',
    '',
    `## Étapes du socle (identifiant · intitulé · nature)\n${socle.map((m) => `- ${m.id} · ${m.title} · ${m.kind}`).join('\n')}`,
    '',
    `## Référentiel des universités (identifiant · pays · établissement · cursus)\n${(universites ?? []).map((u) => `- ${u.id} · ${u.pays} · ${u.etablissement}${u.cursus ? ` — ${u.cursus}` : ''}`).join('\n')}`,
    '',
    `## Texte à analyser\n${texte}`,
  ].join('\n');

  const anthropic = new Anthropic({ apiKey: cle });
  const flux = anthropic.messages.stream({
    model: MODELE,
    max_tokens: 8000,
    system: CONSIGNE,
    // deno-lint-ignore no-explicit-any
    output_config: { format: { type: 'json_schema', schema: SCHEMA } } as any,
    messages: [{ role: 'user', content: contexte }],
  });
  const message = await flux.finalMessage();
  const brut = message.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('');
  let proposition: Record<string, unknown>;
  try { proposition = JSON.parse(brut); } catch { return json({ error: 'Analyse illisible.' }, 502); }

  // Une université « reconnue » doit exister : on ne fait pas confiance à un identifiant recopié de travers.
  const ids = new Set((universites ?? []).map((u) => u.id));
  for (const u of (proposition.universites as Record<string, string>[]) ?? []) {
    if (u.statut === 'reconnue' && !ids.has(u.universite_id)) { u.statut = 'inconnue'; u.universite_id = ''; }
    if (u.statut === 'ecartee' && !ids.has(u.universite_id)) u.universite_id = '';
  }

  const { data: cr, error } = await admin.from('carmine_comptes_rendus').insert({
    student_id: studentId, source, texte, proposition, cree_par: user.id,
  }).select('id').single();
  if (error) return json({ error: error.message }, 500);

  return json({ id: cr.id, proposition, tokens: message.usage.input_tokens + message.usage.output_tokens });
});
