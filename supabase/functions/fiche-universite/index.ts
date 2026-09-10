/**
 * Fiche d'exigences d'une université — Carmine Admission, moteur de pilotage.
 *
 * Appelée depuis /moteur par l'administration. Elle cherche sur les sites
 * officiels ce que l'université exige (tests, dates, formulaires, essais,
 * langue, aide, pièces, entretiens), et écrit chaque exigence en BROUILLON,
 * ligne par ligne, avec l'adresse de la page consultée. Rien n'est validé
 * ici : la validation reste un geste humain, dans l'interface.
 *
 * Deux appels au modèle, volontairement :
 *   1. la recherche, avec l'outil web, qui produit un rapport sourcé ;
 *   2. l'extraction, sans outil, qui transforme le rapport en lignes typées.
 * Un seul appel mêlerait recherche et mise en forme, et la moindre page
 * inaccessible ferait dérailler la structure.
 *
 * La clé Anthropic vit dans les secrets Supabase et ne quitte jamais le serveur.
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *   supabase functions deploy fiche-universite
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

const MODELE = 'claude-opus-5';

/** Portails nationaux, toujours autorisés en plus du site de l'université. */
const PORTAILS = [
  'ucas.com', 'commonapp.org', 'parcoursup.gouv.fr', 'studielink.nl', 'cao.ie',
  'collegeboard.org', 'admissionstesting.org', 'ucat.ac.uk', 'lnat.ac.uk',
  'universityofcalifornia.edu', 'coalitionforcollegeaccess.org', 'cssprofile.collegeboard.org',
];

const TYPES = [
  'profil', 'test_admission', 'inscription_test', 'depot', 'formulaire',
  'essai', 'langue', 'aide', 'piece', 'entretien', 'autre',
] as const;

/** Schéma de sortie de l'extraction. Toutes les clés sont exigées, nulles si absentes. */
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['domaine', 'note_generale', 'exigences'],
  properties: {
    domaine: { type: ['string', 'null'], description: 'Domaine du site officiel des admissions, ex. admissions.harvard.edu' },
    note_generale: { type: ['string', 'null'], description: "Ce qui n'a pas pu être classé ou vérifié, en deux ou trois phrases, en français" },
    exigences: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'type', 'libelle', 'consigne', 'longueur', 'regime', 'y', 'm', 'd', 'fin_m',
          'relatif_a', 'delai_jours', 'duree_jours', 'tour', 'source_url', 'confiance', 'note_ia',
        ],
        properties: {
          type: { type: 'string', enum: [...TYPES] },
          libelle: { type: 'string', description: 'Une ligne, en français, sans le nom de l’université' },
          consigne: { type: ['string', 'null'], description: 'Pour un essai : la question exacte, recopiée dans sa langue. Pour un test : lequel, où l’on s’inscrit. Pour un entretien : format, qui le déclenche, délai de réponse.' },
          longueur: { type: ['string', 'null'], description: 'ex. « 150 mots », « 4 000 caractères »' },
          regime: { type: 'string', enum: ['envisagee', 'retenue'] },
          y: { type: ['integer', 'null'], description: 'Année scolaire relative à la terminale : -2 seconde, -1 première, 0 terminale (année de candidature), 1 après le bac' },
          m: { type: ['integer', 'null'], description: 'Mois 1-12' },
          d: { type: ['integer', 'null'], description: 'Jour 1-31' },
          fin_m: { type: ['integer', 'null'], description: 'Mois de fin si fenêtre' },
          relatif_a: { type: ['string', 'null'], enum: ['decision', 'offre_ferme', 'admission', null] },
          delai_jours: { type: ['integer', 'null'] },
          duree_jours: { type: ['integer', 'null'], description: 'Préparation nécessaire, en jours, si l’exigence en demande une' },
          tour: { type: ['string', 'null'], enum: ['anticipe', 'ordinaire', null], description: 'Pour un dépôt ou un essai américain : anticipé (ED, EA, REA) ou ordinaire (RD). Null ailleurs.' },
          source_url: { type: ['string', 'null'], description: 'Adresse exacte de la page où l’information a été lue' },
          confiance: { type: 'string', enum: ['trouve', 'ambigu', 'non_trouve'] },
          note_ia: { type: ['string', 'null'], description: 'Ce qui reste incertain, en français' },
        },
      },
    },
  },
};

const CONSIGNE_RECHERCHE = `Tu documentes, pour un cabinet de conseil en admissions, ce qu'une université exige
d'un candidat venant du système scolaire français. Tu écris en français.

Sources admises : le site officiel de l'université (admissions, cursus, aide financière) et le
portail national du pays (UCAS, Common App, Parcoursup, Studielink, CAO, College Board). Rien
d'autre : ni blogs, ni forums, ni cabinets, ni articles de presse.

Pour chaque exigence trouvée, note l'adresse exacte de la page. Croise quand c'est possible :
la date sur le site de l'université et la même date sur le portail national. Si elles
divergent, dis-le. Si une page est inaccessible ou si tu ne trouves pas, écris « non trouvé »
avec l'adresse que tu as tentée. N'estime jamais une date ni une exigence : une case vide vaut
mieux qu'une valeur devinée.

Ce que tu cherches, dans l'ordre :
1. Conditions de profil : matières ou spécialités exigées, niveau attendu, langue.
2. Tests d'admission : lesquels, obligatoires ou non, fenêtre d'inscription, date de passage,
   politique de test (requis, facultatif, non considéré).
3. Échéances de dépôt : anticipée (avec sa nature : contraignante ou non), ordinaire, et la
   plateforme utilisée.
4. Formulaires propres à l'université, en plus de la plateforme nationale.
5. Essais propres : chaque question recopiée mot pour mot dans sa langue, avec sa longueur.
6. Certification de langue : laquelle, score global et minima par section, dispenses.
7. Aide financière pour un candidat étranger : dossier, date, politique (besoin ignoré ou
   pris en compte à l'admission, couverture du besoin total).
8. Pièces à faire produire : lettres, relevés, travaux écrits, portfolio, certificats.
9. Entretiens : format (sur place, visio, téléphone, vidéo enregistrée), qui le déclenche,
   délai de réponse.
10. Tout ce qui ne rentre pas dans ces cases, tel quel.

Rends un rapport structuré par rubrique, une adresse par information, puis une section
« Non trouvé » et une section « Incertain ».`;

const CONSIGNE_EXTRACTION = `Transforme ce rapport en lignes d'exigences, une par exigence, selon le schéma.

Conventions de date, à respecter à la lettre :
- y est l'année SCOLAIRE relative à la terminale, l'année de candidature : 0 = terminale,
  -1 = première, -2 = seconde, 1 = l'année après le bac.
- Une année scolaire va de septembre à août. Un mois >= 8 tombe à l'automne de l'année y ;
  un mois <= 7 tombe au printemps qui suit, dans la même année scolaire.
  Ainsi « 1er novembre de l'année de candidature » → y 0, m 11, d 1 ;
  « 1er janvier du cycle de candidature » → y 0, m 1, d 1 ;
  « inscription au test en juin de l'année précédant la candidature » → y -1, m 6.
- Un test passé pendant le cycle de candidature (octobre, novembre) → y 0.
- Une condition de profil (spécialités) → type profil, sans date.
- Une étape qui suit une décision (retrait après admission anticipée, ATAS après offre)
  → relatif_a et delai_jours, sans y/m/d.

Tour, pour les États-Unis seulement : « anticipe » pour une échéance ou un essai du tour
anticipé (ED, EA, REA), « ordinaire » pour le tour ordinaire (RD), null partout ailleurs.
Une université qui a les deux tours donne deux lignes de dépôt.

Régime : « envisagee » pour ce qui se prépare avant septembre de terminale (tests, essais,
langue, profil) ; « retenue » pour ce qui se dépose ou se remplit (dépôt, formulaire, aide,
pièces, entretien).

Confiance : « trouve » si l'information est lue sur une source admise avec son adresse ;
« ambigu » si deux sources divergent ou si la formulation prête à interprétation ;
« non_trouve » si le rapport le dit — dans ce cas, libelle décrit ce qui manque et
source_url l'adresse tentée, les autres champs à null.

Ne fusionne pas deux exigences distinctes. Ne crée aucune ligne que le rapport ne contient pas.
Pour un essai, consigne contient la question exacte, dans la langue du rapport.`;

Deno.serve(async (req) => {
  try { return await traiter(req); }
  catch (e) { console.error(e); const brut = e instanceof Error ? e.message : String(e); const m = brut.toLowerCase();
    const msg = m.includes('credit balance') || m.includes('insufficient') ? 'Crédit API insuffisant : ajouter du crédit sur console.anthropic.com puis relancer.'
      : m.includes('invalid x-api-key') || m.includes('authentication_error') ? 'Clé API Anthropic invalide : vérifier le secret ANTHROPIC_API_KEY.'
      : m.includes('overloaded') ? 'API temporairement saturée : réessayer dans quelques minutes.' : brut.slice(0, 300);
    return json({ error: msg }, 500); }
});

async function traiter(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const cle = Deno.env.get('ANTHROPIC_API_KEY');
  if (!cle) return json({ error: 'ANTHROPIC_API_KEY absente des secrets.' }, 500);

  const autorisation = req.headers.get('Authorization');
  if (!autorisation) return json({ error: 'Authentification requise.' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;

  // Client de l'appelant : les RLS s'appliquent, un parent ne peut pas se
  // faire passer pour l'administration.
  const appelant = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: autorisation } },
  });
  const { data: { user } } = await appelant.auth.getUser();
  if (!user) return json({ error: 'Session invalide.' }, 401);
  const { data: profil } = await appelant
    .from('carmine_profiles').select('role').eq('id', user.id).single();
  if (profil?.role !== 'admin') return json({ error: 'Réservé à l’administration.' }, 403);

  const corps = await req.json();
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // ── L'université : existante, ou créée à la volée ────────────────────────
  let universite: Record<string, unknown> | null = null;

  if (corps.universite_id) {
    const { data } = await admin.from('carmine_universites')
      .select('*').eq('id', corps.universite_id).single();
    universite = data;
  } else {
    const etablissement = String(corps.etablissement ?? '').trim();
    const cursus = String(corps.cursus ?? '').trim() || null;
    const pays = String(corps.pays ?? '').trim();
    const filiere = corps.filiere ?? null;
    if (!etablissement || !pays) return json({ error: 'Établissement et pays requis.' }, 400);

    const { data: candidates } = await admin.from('carmine_universites')
      .select('*').eq('pays', pays).eq('etablissement', etablissement);
    universite = (candidates ?? []).find((u) => (u.cursus ?? null) === cursus) ?? null;

    if (!universite) {
      const an = new Date().getFullYear();
      const nature = filiere === 'us' ? 'medianes' : filiere === 'uk' ? 'offre_type' : 'eligibilite';
      const { data: creee, error } = await admin.from('carmine_universites').insert({
        pays, etablissement, cursus, nature, filiere,
        domaine: corps.domaine ?? null,
        source: 'Site de l’établissement',
        millesime: `${an}-${String(an + 1).slice(-2)}`,
        consulte_le: new Date().toISOString().slice(0, 10),
      }).select().single();
      if (error) return json({ error: error.message }, 500);
      universite = creee;
    }
  }
  if (!universite) return json({ error: 'Université introuvable.' }, 404);

  const nom = [universite.etablissement, universite.cursus].filter(Boolean).join(' — ');
  const domaine = String(corps.domaine ?? universite.domaine ?? '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  const anthropic = new Anthropic({ apiKey: cle });

  // ── 1. Recherche ─────────────────────────────────────────────────────────
  // Sans domaine connu, on ne borne pas : la consigne fait le tri, et le
  // modèle rapporte l'adresse de chaque page. Avec un domaine, on borne au
  // site officiel plus les portails nationaux.
  const outilRecherche: Record<string, unknown> = {
    type: 'web_search_20260209', name: 'web_search', max_uses: 15,
  };
  if (domaine) outilRecherche.allowed_domains = [domaine, ...PORTAILS];

  const flux = anthropic.messages.stream({
    model: MODELE,
    max_tokens: 24000,
    system: CONSIGNE_RECHERCHE,
    // deno-lint-ignore no-explicit-any
    tools: [outilRecherche as any],
    messages: [{
      role: 'user',
      content: `Université : ${nom}\nPays : ${universite.pays}\n`
        + (domaine ? `Site officiel connu : ${domaine}\n` : '')
        + `\nCycle de candidature à documenter : le prochain cycle ouvert, avec ses dates telles `
        + `qu'elles sont publiées aujourd'hui (${new Date().toISOString().slice(0, 10)}).`,
    }],
  });
  const recherche = await flux.finalMessage();
  const rapport = recherche.content
    .filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n');
  if (!rapport.trim()) return json({ error: 'La recherche n’a rien rendu.' }, 502);

  // ── 2. Extraction ────────────────────────────────────────────────────────
  const extraction = await anthropic.messages.create({
    model: MODELE,
    max_tokens: 16000,
    system: CONSIGNE_EXTRACTION,
    // deno-lint-ignore no-explicit-any
    output_config: { format: { type: 'json_schema', schema: SCHEMA } } as any,
    messages: [{ role: 'user', content: `# Rapport de recherche — ${nom}\n\n${rapport}` }],
  });
  const texte = extraction.content
    .filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('');

  let resultat: { domaine: string | null; note_generale: string | null; exigences: Record<string, unknown>[] };
  try {
    resultat = JSON.parse(texte);
  } catch {
    return json({ error: 'Extraction illisible.', rapport }, 502);
  }

  // ── Écriture : les brouillons précédents sont remplacés, jamais les lignes
  //    validées, périmées ou rejetées.
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const an = new Date().getFullYear();
  const lignes = (resultat.exigences ?? [])
    .filter((e) => TYPES.includes(e.type as typeof TYPES[number]))
    .map((e) => ({
      universite_id: universite!.id,
      type: e.type,
      libelle: String(e.libelle ?? '').slice(0, 300) || 'Sans libellé',
      consigne: e.consigne ?? null,
      longueur: e.longueur ?? null,
      regime: e.regime === 'envisagee' ? 'envisagee' : 'retenue',
      y: e.y ?? null, m: e.m ?? null, d: e.d ?? null, fin_m: e.fin_m ?? null,
      relatif_a: e.relatif_a ?? null,
      delai_jours: e.delai_jours ?? null,
      duree_jours: e.duree_jours ?? null,
      tour: e.tour === 'anticipe' || e.tour === 'ordinaire' ? e.tour : null,
      source_url: e.source_url ?? null,
      source: e.source_url ? 'Site officiel' : null,
      millesime: `${an}-${String(an + 1).slice(-2)}`,
      verifie_le: e.confiance === 'trouve' ? aujourdhui : null,
      confiance: e.confiance ?? 'ambigu',
      note_ia: e.note_ia ?? null,
      statut: 'brouillon',
    }));

  await admin.from('carmine_exigences_universite')
    .delete().eq('universite_id', universite.id).eq('statut', 'brouillon');
  if (lignes.length) {
    const { error } = await admin.from('carmine_exigences_universite').insert(lignes);
    if (error) return json({ error: error.message, rapport }, 500);
  }

  await admin.from('carmine_universites').update({
    fiche_recherchee_le: new Date().toISOString(),
    domaine: universite.domaine ?? resultat.domaine ?? (domaine || null),
    note_fiche: resultat.note_generale ?? null,
  }).eq('id', universite.id);

  return json({
    universite_id: universite.id,
    inserees: lignes.length,
    tokens: {
      recherche: recherche.usage.input_tokens + recherche.usage.output_tokens,
      extraction: extraction.usage.input_tokens + extraction.usage.output_tokens,
    },
  });
}
