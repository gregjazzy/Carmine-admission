/**
 * Fiche d'exigences d'une université — Carmine Admission, moteur de pilotage.
 *
 * Appelée depuis /moteur par l'administration. Elle cherche sur les sites
 * officiels ce que l'université exige (tests, dates, formulaires, essais,
 * langue, aide, pièces, entretiens), et écrit chaque exigence en BROUILLON,
 * ligne par ligne, avec l'adresse de la page consultée. Rien n'est validé
 * ici : la validation reste un geste humain, dans l'interface.
 *
 * Découpée en étapes courtes, enchaînées par le navigateur, parce qu'une
 * fonction Supabase est coupée au bout de 150 secondes :
 *   « preparer »   : trouve ou crée l'université, rend son identifiant ;
 *   « recherche »  : une rubrique à la fois (trois au total), avec l'outil
 *                    web, rend un rapport sourcé ;
 *   « extraction » : sans outil, transforme les rapports en lignes typées
 *                    et écrit les brouillons.
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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

/**
 * Schéma de sortie de l'extraction. Aucun champ « ou nul » : l'API limite les
 * unions à seize par schéma. Tout est texte, vide quand l'information manque ;
 * les nombres sont convertis côté serveur.
 */
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['domaine', 'note_generale', 'positionnement', 'exigences'],
  properties: {
    domaine: { type: 'string', description: 'Domaine du site officiel des admissions, ex. admissions.harvard.edu ; vide si inconnu' },
    note_generale: { type: 'string', description: "En français, quatre à six phrases : le coût annuel et la politique d'aide pour un étranger ; les règles d'exclusivité du tour anticipé ; puis ce qui n'a pas pu être classé ou vérifié" },
    positionnement: {
      type: 'object',
      additionalProperties: false,
      description: 'Le niveau attendu, tel que publié. Chaîne vide à chaque champ non lu. Les nombres en chiffres, sans unité.',
      required: [
        'taux_admission', 'sat_lecture_25', 'sat_lecture_75', 'sat_maths_25', 'sat_maths_75',
        'act_25', 'act_75', 'sat_moyen', 'politique_test', 'offre_type', 'equivalence_bac', 'source_url', 'confiance',
      ],
      properties: {
        taux_admission: { type: 'string', description: 'Entre 0 et 1, ex. « 0.09 » pour 9 %' },
        sat_lecture_25: { type: 'string' }, sat_lecture_75: { type: 'string' },
        sat_maths_25: { type: 'string' }, sat_maths_75: { type: 'string' },
        act_25: { type: 'string' }, act_75: { type: 'string' },
        sat_moyen: { type: 'string' },
        politique_test: { type: 'string', description: 'ex. « requis », « facultatif », « non considéré », en français' },
        offre_type: { type: 'string', description: 'ex. « A*A*A (A-level) · 42 points, 7 7 6 au niveau supérieur (IB) »' },
        equivalence_bac: { type: 'string', description: 'Ce que l’université publie pour le baccalauréat français, ex. « 17/20 avec 18 en mathématiques »' },
        source_url: { type: 'string' },
        confiance: { type: 'string', enum: ['trouve', 'ambigu', 'non_trouve'] },
      },
    },
    exigences: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'type', 'libelle', 'libelle_en', 'consigne', 'longueur', 'regime', 'y', 'm', 'd', 'fin_m',
          'relatif_a', 'delai_jours', 'duree_jours', 'tour', 'source_url', 'confiance', 'note_ia',
        ],
        properties: {
          type: { type: 'string', enum: [...TYPES] },
          libelle: { type: 'string', description: 'Une ligne, en français, sans le nom de l’université' },
          libelle_en: { type: 'string', description: 'The same line in English, without the university name' },
          consigne: { type: 'string', description: 'Pour un essai : la question exacte, recopiée dans sa langue. Pour un test : lequel, où l’on s’inscrit. Pour un entretien : format, qui le déclenche, délai de réponse. Vide sinon.' },
          longueur: { type: 'string', description: 'ex. « 150 mots », « 4 000 caractères » ; vide sinon' },
          regime: { type: 'string', enum: ['envisagee', 'retenue'] },
          y: { type: 'string', description: 'Année scolaire relative à la terminale : « -2 » seconde, « -1 » première, « 0 » terminale (année de candidature), « 1 » après le bac ; vide sans date' },
          m: { type: 'string', description: 'Mois 1-12, vide sans date' },
          d: { type: 'string', description: 'Jour 1-31, vide si inconnu' },
          fin_m: { type: 'string', description: 'Mois de fin si fenêtre, vide sinon' },
          relatif_a: { type: 'string', enum: ['', 'decision', 'offre_ferme', 'admission'] },
          delai_jours: { type: 'string', description: 'Entier en jours, vide sinon' },
          duree_jours: { type: 'string', description: 'Préparation nécessaire, en jours, si l’exigence en demande une ; vide sinon' },
          tour: { type: 'string', enum: ['', 'anticipe', 'ordinaire'], description: 'Pour un dépôt ou un essai américain : anticipé (ED, EA, REA) ou ordinaire (RD). Vide ailleurs.' },
          source_url: { type: 'string', description: 'Adresse exacte de la page où l’information a été lue ; vide si aucune' },
          confiance: { type: 'string', enum: ['trouve', 'ambigu', 'non_trouve'] },
          note_ia: { type: 'string', description: 'Ce qui reste incertain, en français ; vide sinon' },
        },
      },
    },
  },
};

/** Texte vide → null ; sinon le texte. */
const txt = (v: unknown): string | null => (v == null || String(v).trim() === '' ? null : String(v).trim());
/** Texte vide → null ; sinon l'entier. */
const ent = (v: unknown): number | null => { const t = txt(v); if (t == null) return null; const n = parseInt(t, 10); return Number.isFinite(n) ? n : null; };
/** Texte vide → null ; sinon le nombre. */
const num = (v: unknown): number | null => { const t = txt(v); if (t == null) return null; const n = parseFloat(t.replace(',', '.').replace('%', '')); return Number.isFinite(n) ? (n > 1 ? n / 100 : n) : null; };

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

Tu ne traites que la rubrique indiquée dans la demande, rien d'autre : les autres rubriques
font l'objet d'autres recherches. Six recherches web au plus : va droit aux pages
d'admission, ne relance pas une recherche pour confirmer ce qui est déjà lu.

Rends un rapport structuré par point, une adresse par information, puis une section
« Non trouvé » et une section « Incertain ».`;

/** Les trois rubriques de recherche, une par appel. */
const RUBRIQUES = [
  { titre: 'profil, tests et échéances', points: `1. Conditions de profil : matières ou spécialités exigées, niveau attendu, langue.
2. Tests d'admission : lesquels, obligatoires ou non, fenêtre d'inscription, date de passage,
   politique de test (requis, facultatif, non considéré).
3. Échéances de dépôt : anticipée (avec sa nature : contraignante ou non), ordinaire, et la
   plateforme utilisée. Règles d'exclusivité du tour anticipé : ED contraignant, REA qui
   interdit les autres anticipés, EA libre.` },
  { titre: 'formulaires, essais et entretiens', points: `4. Formulaires propres à l'université, en plus de la plateforme nationale.
5. Essais propres : chaque question recopiée mot pour mot dans sa langue, avec sa longueur.
9. Entretiens : format (sur place, visio, téléphone, vidéo enregistrée), qui le déclenche,
   délai de réponse.` },
  { titre: 'langue, aide financière et pièces', points: `6. Certification de langue : laquelle, score global et minima par section, dispenses.
7. Aide financière pour un candidat étranger : dossier, date, politique (besoin ignoré ou
   pris en compte à l'admission, couverture du besoin total), et le coût annuel total publié
   (frais de scolarité, logement, repas).
8. Pièces à faire produire : lettres, relevés, travaux écrits, portfolio, certificats.
10. Tout ce qui ne rentre pas dans ces cases, tel quel.` },
  { titre: 'niveau attendu', points: `11. Sélectivité : taux d'admission ou taux d'offres publié, avec le cycle concerné.
12. Royaume-Uni et Europe : l'offre type (A-level, IB) du cursus, et l'équivalence publiée pour le
    baccalauréat français (note globale sur 20, notes exigées dans les spécialités). Ne convertis
    jamais toi-même : ne rapporte que ce que l'université publie pour le bac français.
13. États-Unis : fourchettes de scores SAT (lecture, mathématiques) et ACT du 25e au 75e centile
    des admis ou des inscrits, score moyen, politique de test, sur le site ou dans le Common
    Data Set de l'université. Notes attendues (GPA, rang) si l'université en publie.` },
];

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
- Un essai, une pièce ou un formulaire qui se rend avec le dossier n'a PAS de date propre :
  laisse y, m, d vides, la ligne s'accroche à l'échéance de dépôt de l'université et le
  moteur calcule quand commencer. Ne date que ce qui a sa propre échéance publiée.
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

Positionnement : remplis le bloc avec les chiffres lus dans la rubrique « niveau attendu »,
null partout où rien n'a été lu. Les conditions de spécialités et l'équivalence bac donnent
aussi une ligne de type profil, pour que le conseiller la valide.

Ce qui fait une ligne : une action ou une date pour un candidat venant d'un lycée français.
Dépôts, aide financière, tests et inscriptions, essais propres avec leur question, langue,
lettres et pièces, entretien, formulaires obligatoires, conditions de spécialités. Douze à
dix-huit lignes pour une université ordinaire, rarement plus.

Font aussi une ligne, parce qu'il y a un geste et une date : l'envoi des scores de test
(type piece ; avec le dossier si l'université exige le rapport officiel à la candidature,
après l'admission avec relatif_a admission si l'auto-déclaration suffit ; code établissement
et canal dans consigne) ; la réponse de l'admis et le dépôt de confirmation (type autre,
relatif_a admission ou date publiée) ; la traduction certifiée des bulletins et diplômes
(type piece, sans date).

Ce qui ne fait pas une ligne, et va dans note_generale en une phrase chacun : les frais de
dossier, les voies réservées (QuestBridge, programmes internes, candidats scolarisés à
domicile), les options d'essai qui ne s'appliquent pas à un lycéen français, et tout ce
qui n'est qu'une information sans geste à faire. Une exigence lue à plusieurs endroits donne
une seule ligne, avec la meilleure source. Un « non trouvé » ne fait une ligne que si
l'information manquante bloquerait le dossier (date de dépôt, question d'essai, score de
langue) ; les autres manques vont dans note_generale.

Ne crée aucune ligne que le rapport ne contient pas. Pour un essai, consigne contient la
question exacte, dans la langue du rapport.`;

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
  const etape = String(corps.etape ?? '');

  if (etape === 'preparer') return await preparer(admin, corps);

  const { data: universite } = await admin.from('carmine_universites')
    .select('*').eq('id', corps.universite_id ?? '').single();
  if (!universite) return json({ error: 'Université introuvable.' }, 404);

  const nom = [universite.etablissement, universite.cursus].filter(Boolean).join(' — ');
  const domaine = String(corps.domaine ?? universite.domaine ?? '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const anthropic = new Anthropic({ apiKey: cle });

  if (etape === 'recherche') return await rechercher(anthropic, universite, nom, domaine, Number(corps.rubrique ?? 0));
  if (etape === 'extraction') return await extraire(anthropic, admin, universite, nom, domaine, corps.rapports, corps.seulement_niveau === true);
  return json({ error: 'Étape inconnue.' }, 400);
}

// deno-lint-ignore no-explicit-any
type Admin = ReturnType<typeof createClient<any>>;

/** L'université : existante, ou créée à la volée. */
async function preparer(admin: Admin, corps: Record<string, unknown>): Promise<Response> {
  if (corps.universite_id) {
    const { data } = await admin.from('carmine_universites')
      .select('id, etablissement, cursus').eq('id', corps.universite_id).single();
    if (!data) return json({ error: 'Université introuvable.' }, 404);
    return json({ universite_id: data.id });
  }
  const etablissement = String(corps.etablissement ?? '').trim();
  const cursus = String(corps.cursus ?? '').trim() || null;
  const pays = String(corps.pays ?? '').trim();
  const filiere = corps.filiere ?? null;
  if (!etablissement || !pays) return json({ error: 'Établissement et pays requis.' }, 400);

  const { data: candidates } = await admin.from('carmine_universites')
    .select('*').eq('pays', pays).eq('etablissement', etablissement);
  const existante = (candidates ?? []).find((u) => (u.cursus ?? null) === cursus) ?? null;
  if (existante) return json({ universite_id: existante.id });

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
  return json({ universite_id: creee.id });
}

/** Une rubrique de recherche, bornée au site officiel et aux portails. */
async function rechercher(
  anthropic: Anthropic, universite: Record<string, unknown>, nom: string, domaine: string, rubrique: number,
): Promise<Response> {
  const r = RUBRIQUES[rubrique];
  if (!r) return json({ error: 'Rubrique inconnue.' }, 400);

  const outilRecherche: Record<string, unknown> = {
    type: 'web_search_20260209', name: 'web_search', max_uses: 6,
  };
  if (domaine) outilRecherche.allowed_domains = [domaine, ...PORTAILS];

  const flux = anthropic.messages.stream({
    model: MODELE,
    max_tokens: 8000,
    system: CONSIGNE_RECHERCHE,
    // deno-lint-ignore no-explicit-any
    tools: [outilRecherche as any],
    messages: [{
      role: 'user',
      content: `Université : ${nom}\nPays : ${universite.pays}\n`
        + (domaine ? `Site officiel connu : ${domaine}\n` : '')
        + `\nRubrique à documenter : ${r.titre}.\n${r.points}\n`
        + `\nCycle de candidature à documenter : le prochain cycle ouvert, avec ses dates telles `
        + `qu'elles sont publiées aujourd'hui (${new Date().toISOString().slice(0, 10)}).`,
    }],
  });
  const recherche = await flux.finalMessage();
  const rapport = recherche.content
    .filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n');
  if (!rapport.trim()) return json({ error: 'La recherche n’a rien rendu.' }, 502);

  return json({
    rubrique, titre: r.titre,
    rapport: `## ${r.titre}\n\n${rapport}`,
    tokens: recherche.usage.input_tokens + recherche.usage.output_tokens,
  });
}

/** Extraction des lignes et écriture des brouillons. */
async function extraire(
  anthropic: Anthropic, admin: Admin, universite: Record<string, unknown>, nom: string, domaine: string,
  rapports: unknown, seulementNiveau = false,
): Promise<Response> {
  const textes = Array.isArray(rapports) ? rapports.map(String).filter((x) => x.trim()) : [];
  if (!textes.length) return json({ error: 'Aucun rapport à extraire.' }, 400);
  const rapport = textes.join('\n\n');

  const flux = anthropic.messages.stream({
    model: MODELE,
    max_tokens: 16000,
    system: CONSIGNE_EXTRACTION,
    // deno-lint-ignore no-explicit-any
    output_config: { format: { type: 'json_schema', schema: SCHEMA } } as any,
    messages: [{ role: 'user', content: `# Rapport de recherche — ${nom}\n\n${rapport}` }],
  });
  const extraction = await flux.finalMessage();
  const texte = extraction.content
    .filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('');

  let resultat: {
    domaine: string | null; note_generale: string | null;
    positionnement?: Record<string, unknown> | null; exigences: Record<string, unknown>[];
  };
  try {
    resultat = JSON.parse(texte);
  } catch {
    return json({ error: 'Extraction illisible.', rapport }, 502);
  }

  // Les brouillons précédents sont remplacés, jamais les lignes validées,
  // périmées ou rejetées.
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const an = new Date().getFullYear();
  const lignes = (resultat.exigences ?? [])
    .filter((e) => TYPES.includes(e.type as typeof TYPES[number]))
    .map((e) => ({
      universite_id: universite.id,
      type: e.type,
      libelle: (txt(e.libelle) ?? 'Sans libellé').slice(0, 300),
      libelle_en: txt(e.libelle_en)?.slice(0, 300) ?? null,
      consigne: txt(e.consigne),
      longueur: txt(e.longueur),
      regime: e.regime === 'envisagee' ? 'envisagee' : 'retenue',
      y: ent(e.y), m: ent(e.m), d: ent(e.d), fin_m: ent(e.fin_m),
      relatif_a: txt(e.relatif_a),
      delai_jours: ent(e.delai_jours),
      duree_jours: ent(e.duree_jours),
      tour: e.tour === 'anticipe' || e.tour === 'ordinaire' ? e.tour : null,
      source_url: txt(e.source_url),
      source: txt(e.source_url) ? 'Site officiel' : null,
      millesime: `${an}-${String(an + 1).slice(-2)}`,
      verifie_le: e.confiance === 'trouve' ? aujourdhui : null,
      confiance: e.confiance ?? 'ambigu',
      note_ia: txt(e.note_ia),
      statut: 'brouillon',
    }));

  // En mode « seulement niveau », les brouillons existants ne bougent pas :
  // seules les colonnes de l'université sont remplies.
  if (!seulementNiveau) {
    await admin.from('carmine_exigences_universite')
      .delete().eq('universite_id', universite.id).eq('statut', 'brouillon');
    if (lignes.length) {
      const { error } = await admin.from('carmine_exigences_universite').insert(lignes);
      if (error) return json({ error: error.message, rapport }, 500);
    }
  }

  // Niveau attendu : les chiffres lus remplissent les colonnes de l'université.
  // Un chiffre déjà en base venant d'une source de référence (College Scorecard)
  // n'est pas écrasé par une lecture « ambigu » ; une lecture « trouve » le rafraîchit.
  const pos = resultat.positionnement ?? null;
  const niveau: Record<string, unknown> = {};
  if (pos && pos.confiance !== 'non_trouve') {
    const ecrase = pos.confiance === 'trouve';
    const lus: Record<string, unknown> = {
      taux_admission: num(pos.taux_admission),
      sat_lecture_25: ent(pos.sat_lecture_25), sat_lecture_75: ent(pos.sat_lecture_75),
      sat_maths_25: ent(pos.sat_maths_25), sat_maths_75: ent(pos.sat_maths_75),
      act_25: ent(pos.act_25), act_75: ent(pos.act_75), sat_moyen: ent(pos.sat_moyen),
      politique_test: txt(pos.politique_test), offre_type: txt(pos.offre_type),
    };
    for (const [c, v] of Object.entries(lus)) {
      if (v != null && (ecrase || universite[c] == null)) niveau[c] = v;
    }
    const bac = txt(pos.equivalence_bac);
    if (bac != null && (ecrase || universite.eligibilite == null)) niveau.eligibilite = bac;
    const srcPos = txt(pos.source_url);
    if (Object.keys(niveau).length && srcPos) {
      niveau.source_url = srcPos;
      niveau.source = 'Site de l’établissement';
      niveau.consulte_le = aujourdhui;
    }
  }

  await admin.from('carmine_universites').update(seulementNiveau ? niveau : {
    ...niveau,
    fiche_recherchee_le: new Date().toISOString(),
    domaine: universite.domaine ?? txt(resultat.domaine) ?? (domaine || null),
    note_fiche: txt(resultat.note_generale),
  }).eq('id', universite.id);

  return json({
    universite_id: universite.id,
    inserees: seulementNiveau ? 0 : lignes.length,
    niveau: Object.keys(niveau).filter((k) => !['source', 'source_url', 'consulte_le'].includes(k)).length,
    tokens: extraction.usage.input_tokens + extraction.usage.output_tokens,
  });
}
