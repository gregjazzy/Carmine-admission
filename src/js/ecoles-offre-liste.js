/**
 * Écoles connues de la page des offres (admission-ecoles-paris?ecole=<code>).
 *
 * fr  : nom précédé de la préposition qui va bien (titre « Préparer l'admission … »)
 * en  : nom tel qu'il suit « to » (titre « Preparing for admission to … »)
 * grille: grille de prix (fr = écoles en France et lycées français, int = autres
 *       écoles étrangères, us = écoles privées et sélectives américaines à dossier).
 *       Décidé avec Greg le 19 nov. 2026.
 * cles: morceaux d'adresse d'article qui désignent l'école (mots entiers,
 *       séparés par des tirets). Sert à retrouver l'école de l'article d'où
 *       part un formulaire de contact.
 */
export const ECOLES = {
  // Groupe, pas une école : famille qui hésite entre plusieurs écoles de Paris
  // (Greg, 19 nov. 2026). Titre et présentation propres, grille France.
  // Aucune clé : jamais déduit d'une seule adresse d'article (voir lienOffre).
  'paris': {
    grille: 'fr', cles: [], consultation: true,
    titre: {
      fr: "Quelle école pour votre enfant à Paris ?",
      en: 'Which school is right for your child in Paris?',
    },
    intro: {
      fr: "Greg Mittelette, fondateur de Carmine, connaît de l'intérieur les écoles les plus sélectives de Paris : depuis près de quinze ans, il suit leurs meilleurs élèves, et chaque année il prépare une quinzaine de candidats pour chacune d'elles, de Jeannine Manuel à Franklin, de Stanislas à l'École alsacienne. Il sait ce que chacune exige vraiment, le rythme qu'elle impose, le meilleur moment pour y entrer et où elle mène ensuite ses élèves. Il aide les familles à choisir celle qui correspond à leur enfant, puis prépare l'enfant à ses tests et à son entretien.",
      en: "Greg Mittelette, founder of Carmine, knows the most selective schools in Paris from the inside: for nearly fifteen years, he has worked with their top pupils, and every year he prepares some fifteen candidates for each of them, from Jeannine Manuel to Franklin, from Stanislas to the École alsacienne. He knows what each one really demands, the pace it sets, the best moment to join and where it leads its pupils next. He helps families choose the one that suits their child, then prepares the child for its tests and interview.",
    },
  },
  'jeannine-manuel': { grille: 'fr', fr: 'à Jeannine Manuel', en: 'Jeannine Manuel', cles: ['jeannine-manuel'] },
  'ecole-alsacienne': { grille: 'fr', fr: "à l'École alsacienne", en: 'the École alsacienne', cles: ['ecole-alsacienne'] },
  'franklin': { grille: 'fr', fr: 'à Franklin', en: 'Franklin', cles: ['franklin'] },
  'stanislas': { grille: 'fr', fr: 'à Stanislas', en: 'Stanislas', cles: ['stanislas'] },
  'sevigne': { grille: 'fr', fr: 'au Collège Sévigné', en: 'Collège Sévigné', cles: ['sevigne'] },
  'saint-jean-de-passy': { grille: 'fr', fr: 'à Saint-Jean-de-Passy', en: 'Saint-Jean-de-Passy', cles: ['saint-jean-de-passy'] },
  'la-tour': { grille: 'fr', fr: 'à La Tour', en: 'La Tour', cles: ['la-tour'] },
  'henri-iv': { grille: 'fr', fr: 'à Henri-IV', en: 'Henri-IV', cles: ['henri-iv'] },
  'louis-le-grand': { grille: 'fr', fr: 'à Louis-le-Grand', en: 'Louis-le-Grand', cles: ['louis-le-grand'] },
  'ecole-des-roches': { grille: 'fr', fr: "à l'École des Roches", en: 'the École des Roches', cles: ['ecole-des-roches'] },
  'eib': { grille: 'fr', fr: "à l'EIB", en: 'EIB', cles: ['eib'] },
  'american-school-of-paris': { grille: 'fr', fr: "à l'American School of Paris", en: 'the American School of Paris', cles: ['american-school-of-paris'] },
  'british-school-of-paris': { grille: 'fr', fr: 'à la British School of Paris', en: 'the British School of Paris', cles: ['british-school-of-paris'] },
  'international-school-of-paris': { grille: 'fr', fr: "à l'International School of Paris", en: 'the International School of Paris', cles: ['international-school-of-paris'] },
  'lycee-international': { grille: 'fr', fr: 'au Lycée international de Saint-Germain-en-Laye', en: 'the Lycée international de Saint-Germain-en-Laye', cles: ['lycee-international'] },
  'le-rosey': { grille: 'int', fr: 'au Rosey', en: 'Le Rosey', cles: ['rosey'] },
  'aiglon': { grille: 'int', fr: 'à Aiglon College', en: 'Aiglon College', cles: ['aiglon'] },
  'rosenberg': { grille: 'int', fr: "à l'Institut Rosenberg", en: 'Institut Rosenberg', cles: ['rosenberg'] },
  'zuoz': { grille: 'int', fr: 'au Lyceum Alpinum Zuoz', en: 'Lyceum Alpinum Zuoz', cles: ['zuoz'] },
  'beau-soleil': { grille: 'int', fr: 'au Collège Beau Soleil', en: 'Collège Beau Soleil', cles: ['beau-soleil'] },
  'tasis': { grille: 'int', fr: 'à TASIS', en: 'TASIS', cles: ['tasis'] },
  'eton': { grille: 'int', fr: 'à Eton College', en: 'Eton College', cles: ['eton'] },
  'wycombe-abbey': { grille: 'int', fr: 'à Wycombe Abbey', en: 'Wycombe Abbey', cles: ['wycombe-abbey'] },
  'north-london-collegiate': { grille: 'int', fr: 'à North London Collegiate School', en: 'North London Collegiate School', cles: ['north-london-collegiate', 'nlcs'] },
  'charterhouse': { grille: 'int', fr: 'à Charterhouse', en: 'Charterhouse', cles: ['charterhouse'] },
  'harrow': { grille: 'int', fr: 'à Harrow', en: 'Harrow School', cles: ['harrow'] },
  'millfield': { grille: 'int', fr: 'à Millfield', en: 'Millfield', cles: ['millfield'] },
  'gordonstoun': { grille: 'int', fr: 'à Gordonstoun', en: 'Gordonstoun', cles: ['gordonstoun'] },
  'downe-house': { grille: 'int', fr: 'à Downe House', en: 'Downe House', cles: ['downe-house'] },
  'godolphin-and-latymer': { grille: 'int', fr: 'à Godolphin and Latymer', en: 'Godolphin and Latymer', cles: ['godolphin'] },
  'edinburgh-academy': { grille: 'int', fr: "à l'Edinburgh Academy", en: 'the Edinburgh Academy', cles: ['edinburgh-academy'] },
  'lycee-charles-de-gaulle': { grille: 'fr', fr: 'au Lycée Charles de Gaulle de Londres', en: 'the Lycée Charles de Gaulle in London', cles: ['charles-de-gaulle'] },
  'phillips-exeter': { grille: 'us', fr: 'à Phillips Exeter', en: 'Phillips Exeter', cles: ['exeter'] },
  'andover': { grille: 'us', fr: 'à Phillips Academy Andover', en: 'Phillips Academy Andover', cles: ['andover'] },
  'deerfield': { grille: 'us', fr: 'à Deerfield Academy', en: 'Deerfield Academy', cles: ['deerfield'] },
  'choate': { grille: 'us', fr: 'à Choate Rosemary Hall', en: 'Choate Rosemary Hall', cles: ['choate'] },
  'milton': { grille: 'us', fr: 'à Milton Academy', en: 'Milton Academy', cles: ['milton-academy'] },
  'loomis-chaffee': { grille: 'us', fr: 'à Loomis Chaffee', en: 'Loomis Chaffee', cles: ['loomis-chaffee'] },
  'blair': { grille: 'us', fr: 'à Blair Academy', en: 'Blair Academy', cles: ['blair-academy'] },
  'concord': { grille: 'us', fr: 'à Concord Academy', en: 'Concord Academy', cles: ['concord-academy'] },
  'mercersburg': { grille: 'us', fr: 'à Mercersburg Academy', en: 'Mercersburg Academy', cles: ['mercersburg-academy'] },
  'northfield-mount-hermon': { grille: 'us', fr: 'à Northfield Mount Hermon', en: 'Northfield Mount Hermon', cles: ['northfield-mount-hermon', 'nmh'] },
  'noble-and-greenough': { grille: 'us', fr: 'à Noble and Greenough', en: 'Noble and Greenough', cles: ['noble-and-greenough'] },
  'roxbury-latin': { grille: 'us', fr: 'à Roxbury Latin', en: 'Roxbury Latin', cles: ['roxbury-latin'] },
  'harvard-westlake': { grille: 'us', fr: 'à Harvard-Westlake', en: 'Harvard-Westlake', cles: ['harvard-westlake'] },
  'sidwell-friends': { grille: 'us', fr: 'à Sidwell Friends', en: 'Sidwell Friends', cles: ['sidwell-friends'] },
  'fieldston': { grille: 'us', fr: 'à Fieldston', en: 'Fieldston', cles: ['fieldston'] },
  'poly-prep': { grille: 'us', fr: 'à Poly Prep', en: 'Poly Prep', cles: ['poly-prep'] },
  'unis': { grille: 'us', fr: "à l'UNIS", en: 'UNIS', cles: ['unis'] },
  'newark-academy': { grille: 'us', fr: 'à Newark Academy', en: 'Newark Academy', cles: ['newark-academy'] },
  'greenwich-academy': { grille: 'us', fr: 'à Greenwich Academy', en: 'Greenwich Academy', cles: ['greenwich-academy'] },
  'pace-academy': { grille: 'us', fr: 'à Pace Academy', en: 'Pace Academy', cles: ['pace-academy'] },
  'ransom-everglades': { grille: 'us', fr: 'à Ransom Everglades', en: 'Ransom Everglades', cles: ['ransom-everglades'] },
  'montgomery-bell': { grille: 'us', fr: 'à Montgomery Bell Academy', en: 'Montgomery Bell Academy', cles: ['montgomery-bell-academy'] },
  'columbus-academy': { grille: 'us', fr: 'à Columbus Academy', en: 'Columbus Academy', cles: ['columbus-academy'] },
  'davidson-academy': { grille: 'us', fr: 'à la Davidson Academy', en: 'the Davidson Academy', cles: ['davidson-academy'] },
  'stuyvesant': { grille: 'int', fr: 'à Stuyvesant', en: 'Stuyvesant', cles: ['stuyvesant'] },
  'bronx-science': { grille: 'int', fr: 'à Bronx Science', en: 'Bronx Science', cles: ['bronx-science'] },
  'brooklyn-tech': { grille: 'int', fr: 'à Brooklyn Tech', en: 'Brooklyn Tech', cles: ['brooklyn-tech'] },
  'thomas-jefferson': { grille: 'us', fr: 'à Thomas Jefferson (TJHSST)', en: 'Thomas Jefferson (TJHSST)', cles: ['tjhsst', 'thomas-jefferson'] },
  'ncssm': { grille: 'us', fr: 'à la NCSSM', en: 'NCSSM', cles: ['ncssm'] },
  'imsa': { grille: 'us', fr: "à l'IMSA", en: 'IMSA', cles: ['imsa'] },
  'bergen-county-academies': { grille: 'int', fr: 'aux Bergen County Academies', en: 'Bergen County Academies', cles: ['bergen-county-academies'] },
  'lycee-francais-new-york': { grille: 'fr', fr: 'au Lycée français de New York', en: 'the Lycée Français de New York', cles: ['lycee-francais-new-york'] },
  'university-of-toronto-schools': { grille: 'int', fr: 'à University of Toronto Schools', en: 'University of Toronto Schools', cles: ['university-of-toronto-schools', 'uts-toronto'] },
  'lycee-francais-madrid': { grille: 'fr', fr: 'au Lycée français de Madrid', en: 'the Lycée Français de Madrid', cles: ['lycee-francais-madrid'] },
  'lfib': { grille: 'fr', fr: 'au Lycée français international de Bangkok', en: 'the Lycée Français International de Bangkok', cles: ['lfib'] },
  'bangkok-patana': { grille: 'int', fr: 'à Bangkok Patana School', en: 'Bangkok Patana School', cles: ['bangkok-patana'] },
  'raffles': { grille: 'int', fr: 'à Raffles Institution', en: 'Raffles Institution', cles: ['raffles'] },
  'uwcsea': { grille: 'int', fr: 'à UWCSEA', en: 'UWCSEA', cles: ['uwcsea'] },
  'hkis': { grille: 'int', fr: 'à Hong Kong International School', en: 'Hong Kong International School', cles: ['hkis', 'hong-kong-international-school'] },
  'cdnis': { grille: 'int', fr: 'à CDNIS', en: 'CDNIS', cles: ['cdnis'] },
  'gsis': { grille: 'int', fr: 'à la German Swiss International School', en: 'German Swiss International School', cles: ['gsis', 'german-swiss-international-school'] },
  'isf-academy': { grille: 'int', fr: "à l'ISF Academy", en: 'the ISF Academy', cles: ['isf-academy'] },
  'asij': { grille: 'int', fr: "à l'American School in Japan", en: 'the American School in Japan', cles: ['asij', 'american-school-in-japan'] },
  'james-ruse': { grille: 'int', fr: 'à James Ruse', en: 'James Ruse', cles: ['james-ruse'] },
  'aditya-birla': { grille: 'int', fr: "à l'Aditya Birla World Academy", en: 'the Aditya Birla World Academy', cles: ['aditya-birla'] },
  'michaelhouse': { grille: 'int', fr: 'à Michaelhouse', en: 'Michaelhouse', cles: ['michaelhouse'] },
};

/**
 * Code de l'école dont parle l'article à cette adresse, ou null : aucune école,
 * ou plusieurs (« aiglon-ou-le-rosey ») — la page affiche alors son titre général.
 */
export function ecoleDeLArticle(chemin) {
  const nom = String(chemin).split('/').pop().replace(/\.html$/, '');
  const mots = `-${nom}-`;
  const trouvees = Object.keys(ECOLES).filter((code) =>
    ECOLES[code].cles.some((c) => mots.includes(`-${c}-`)),
  );
  if (trouvees.length === 1) return trouvees[0];
  // Plusieurs écoles de France citées, ou article sur les écoles de Paris :
  // la page de groupe « paris ».
  if (trouvees.length > 1 && trouvees.every((c) => ECOLES[c].grille === 'fr')) return 'paris';
  if (trouvees.length === 0 && mots.includes('-paris-')) return 'paris';
  return null;
}
