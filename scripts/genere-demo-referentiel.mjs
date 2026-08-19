/**
 * Fabrique le squelette du référentiel pour la démonstration publique.
 *
 * La démo doit montrer l'ampleur du calendrier — jamais son contenu : ce
 * script ne retient que la structure (identifiants, dates, familles, titres)
 * et écarte tout ce qui se vend — objectifs, méthode, questions, suivi.
 * Lancé avant chaque build (prebuild) ; le fichier produit n'est pas commité.
 */
import { writeFileSync } from 'node:fs';
import { MILESTONES } from '../src/js/portail/milestones.js';
import { MILESTONES_EN } from '../src/js/portail/milestones.en.js';

const CHAMPS = ['id', 'phase', 'tracks', 'kind', 'lock', 'repere', 'owners', 'y', 'm', 'd', 'finM', 'title', 'when'];

const squelette = MILESTONES.map((m) =>
  Object.fromEntries(CHAMPS.filter((k) => m[k] !== undefined).map((k) => [k, m[k]]))
);

const en = {};
for (const [id, v] of Object.entries(MILESTONES_EN)) {
  const e = {};
  if (v.title != null) e.title = v.title;
  if (v.when != null) e.when = v.when;
  if (Object.keys(e).length) en[id] = e;
}

const sortie = new URL('../src/js/portail/milestones.demo.js', import.meta.url);
writeFileSync(sortie, `/* GÉNÉRÉ par scripts/genere-demo-referentiel.mjs — ne pas éditer.
   Squelette du référentiel pour la démonstration publique : structure et
   titres seulement, jamais la méthode. */
export const DEMO_MILESTONES = ${JSON.stringify(squelette, null, 2)};

export const DEMO_EN = ${JSON.stringify(en, null, 2)};
`);
console.log(`Squelette démo : ${squelette.length} jalons, ${Object.keys(en).length} titres EN.`);
