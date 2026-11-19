/**
 * Écoles connues de la page des offres (admission-ecoles-paris?ecole=<code>).
 *
 * fr  : nom précédé de la préposition qui va bien (titre « Préparer l'admission … »)
 * en  : nom tel qu'il suit « to » (titre « Preparing for admission to … »)
 * cles: morceaux d'adresse d'article qui désignent l'école (mots entiers,
 *       séparés par des tirets). Sert à retrouver l'école de l'article d'où
 *       part un formulaire de contact.
 */
export const ECOLES = {
  'jeannine-manuel': { fr: 'à Jeannine Manuel', en: 'Jeannine Manuel', cles: ['jeannine-manuel'] },
  'ecole-alsacienne': { fr: "à l'École alsacienne", en: 'the École alsacienne', cles: ['ecole-alsacienne'] },
  'franklin': { fr: 'à Franklin', en: 'Franklin', cles: ['franklin'] },
  'stanislas': { fr: 'à Stanislas', en: 'Stanislas', cles: ['stanislas'] },
  'sevigne': { fr: 'au Collège Sévigné', en: 'Collège Sévigné', cles: ['sevigne'] },
  'saint-jean-de-passy': { fr: 'à Saint-Jean-de-Passy', en: 'Saint-Jean-de-Passy', cles: ['saint-jean-de-passy'] },
  'la-tour': { fr: 'à La Tour', en: 'La Tour', cles: ['la-tour'] },
  'henri-iv': { fr: 'à Henri-IV', en: 'Henri-IV', cles: ['henri-iv'] },
  'louis-le-grand': { fr: 'à Louis-le-Grand', en: 'Louis-le-Grand', cles: ['louis-le-grand'] },
  'ecole-des-roches': { fr: "à l'École des Roches", en: 'the École des Roches', cles: ['ecole-des-roches'] },
  'eib': { fr: "à l'EIB", en: 'EIB', cles: ['eib'] },
  'american-school-of-paris': { fr: "à l'American School of Paris", en: 'the American School of Paris', cles: ['american-school-of-paris'] },
  'british-school-of-paris': { fr: 'à la British School of Paris', en: 'the British School of Paris', cles: ['british-school-of-paris'] },
  'international-school-of-paris': { fr: "à l'International School of Paris", en: 'the International School of Paris', cles: ['international-school-of-paris'] },
  'lycee-international': { fr: 'au Lycée international de Saint-Germain-en-Laye', en: 'the Lycée international de Saint-Germain-en-Laye', cles: ['lycee-international'] },
  'le-rosey': { fr: 'au Rosey', en: 'Le Rosey', cles: ['rosey'] },
  'aiglon': { fr: 'à Aiglon College', en: 'Aiglon College', cles: ['aiglon'] },
  'rosenberg': { fr: "à l'Institut Rosenberg", en: 'Institut Rosenberg', cles: ['rosenberg'] },
  'zuoz': { fr: 'au Lyceum Alpinum Zuoz', en: 'Lyceum Alpinum Zuoz', cles: ['zuoz'] },
  'beau-soleil': { fr: 'au Collège Beau Soleil', en: 'Collège Beau Soleil', cles: ['beau-soleil'] },
  'tasis': { fr: 'à TASIS', en: 'TASIS', cles: ['tasis'] },
  'eton': { fr: 'à Eton College', en: 'Eton College', cles: ['eton'] },
  'wycombe-abbey': { fr: 'à Wycombe Abbey', en: 'Wycombe Abbey', cles: ['wycombe-abbey'] },
  'north-london-collegiate': { fr: 'à North London Collegiate School', en: 'North London Collegiate School', cles: ['north-london-collegiate', 'nlcs'] },
  'charterhouse': { fr: 'à Charterhouse', en: 'Charterhouse', cles: ['charterhouse'] },
  'millfield': { fr: 'à Millfield', en: 'Millfield', cles: ['millfield'] },
  'gordonstoun': { fr: 'à Gordonstoun', en: 'Gordonstoun', cles: ['gordonstoun'] },
  'downe-house': { fr: 'à Downe House', en: 'Downe House', cles: ['downe-house'] },
  'godolphin-and-latymer': { fr: 'à Godolphin and Latymer', en: 'Godolphin and Latymer', cles: ['godolphin'] },
  'edinburgh-academy': { fr: "à l'Edinburgh Academy", en: 'the Edinburgh Academy', cles: ['edinburgh-academy'] },
  'lycee-charles-de-gaulle': { fr: 'au Lycée Charles de Gaulle de Londres', en: 'the Lycée Charles de Gaulle in London', cles: ['charles-de-gaulle'] },
  'phillips-exeter': { fr: 'à Phillips Exeter', en: 'Phillips Exeter', cles: ['exeter'] },
  'andover': { fr: 'à Phillips Academy Andover', en: 'Phillips Academy Andover', cles: ['andover'] },
  'deerfield': { fr: 'à Deerfield Academy', en: 'Deerfield Academy', cles: ['deerfield'] },
  'choate': { fr: 'à Choate Rosemary Hall', en: 'Choate Rosemary Hall', cles: ['choate'] },
  'milton': { fr: 'à Milton Academy', en: 'Milton Academy', cles: ['milton-academy'] },
  'loomis-chaffee': { fr: 'à Loomis Chaffee', en: 'Loomis Chaffee', cles: ['loomis-chaffee'] },
  'blair': { fr: 'à Blair Academy', en: 'Blair Academy', cles: ['blair-academy'] },
  'concord': { fr: 'à Concord Academy', en: 'Concord Academy', cles: ['concord-academy'] },
  'mercersburg': { fr: 'à Mercersburg Academy', en: 'Mercersburg Academy', cles: ['mercersburg-academy'] },
  'northfield-mount-hermon': { fr: 'à Northfield Mount Hermon', en: 'Northfield Mount Hermon', cles: ['northfield-mount-hermon', 'nmh'] },
  'noble-and-greenough': { fr: 'à Noble and Greenough', en: 'Noble and Greenough', cles: ['noble-and-greenough'] },
  'roxbury-latin': { fr: 'à Roxbury Latin', en: 'Roxbury Latin', cles: ['roxbury-latin'] },
  'harvard-westlake': { fr: 'à Harvard-Westlake', en: 'Harvard-Westlake', cles: ['harvard-westlake'] },
  'sidwell-friends': { fr: 'à Sidwell Friends', en: 'Sidwell Friends', cles: ['sidwell-friends'] },
  'fieldston': { fr: 'à Fieldston', en: 'Fieldston', cles: ['fieldston'] },
  'poly-prep': { fr: 'à Poly Prep', en: 'Poly Prep', cles: ['poly-prep'] },
  'newark-academy': { fr: 'à Newark Academy', en: 'Newark Academy', cles: ['newark-academy'] },
  'greenwich-academy': { fr: 'à Greenwich Academy', en: 'Greenwich Academy', cles: ['greenwich-academy'] },
  'pace-academy': { fr: 'à Pace Academy', en: 'Pace Academy', cles: ['pace-academy'] },
  'ransom-everglades': { fr: 'à Ransom Everglades', en: 'Ransom Everglades', cles: ['ransom-everglades'] },
  'montgomery-bell': { fr: 'à Montgomery Bell Academy', en: 'Montgomery Bell Academy', cles: ['montgomery-bell-academy'] },
  'columbus-academy': { fr: 'à Columbus Academy', en: 'Columbus Academy', cles: ['columbus-academy'] },
  'davidson-academy': { fr: 'à la Davidson Academy', en: 'the Davidson Academy', cles: ['davidson-academy'] },
  'stuyvesant': { fr: 'à Stuyvesant', en: 'Stuyvesant', cles: ['stuyvesant'] },
  'bronx-science': { fr: 'à Bronx Science', en: 'Bronx Science', cles: ['bronx-science'] },
  'brooklyn-tech': { fr: 'à Brooklyn Tech', en: 'Brooklyn Tech', cles: ['brooklyn-tech'] },
  'thomas-jefferson': { fr: 'à Thomas Jefferson (TJHSST)', en: 'Thomas Jefferson (TJHSST)', cles: ['tjhsst', 'thomas-jefferson'] },
  'ncssm': { fr: 'à la NCSSM', en: 'NCSSM', cles: ['ncssm'] },
  'imsa': { fr: "à l'IMSA", en: 'IMSA', cles: ['imsa'] },
  'bergen-county-academies': { fr: 'aux Bergen County Academies', en: 'Bergen County Academies', cles: ['bergen-county-academies'] },
  'lycee-francais-new-york': { fr: 'au Lycée français de New York', en: 'the Lycée Français de New York', cles: ['lycee-francais-new-york'] },
  'university-of-toronto-schools': { fr: 'à University of Toronto Schools', en: 'University of Toronto Schools', cles: ['university-of-toronto-schools', 'uts-toronto'] },
  'lycee-francais-madrid': { fr: 'au Lycée français de Madrid', en: 'the Lycée Français de Madrid', cles: ['lycee-francais-madrid'] },
  'lfib': { fr: 'au Lycée français international de Bangkok', en: 'the Lycée Français International de Bangkok', cles: ['lfib'] },
  'bangkok-patana': { fr: 'à Bangkok Patana School', en: 'Bangkok Patana School', cles: ['bangkok-patana'] },
  'raffles': { fr: 'à Raffles Institution', en: 'Raffles Institution', cles: ['raffles'] },
  'uwcsea': { fr: 'à UWCSEA', en: 'UWCSEA', cles: ['uwcsea'] },
  'hkis': { fr: 'à Hong Kong International School', en: 'Hong Kong International School', cles: ['hkis', 'hong-kong-international-school'] },
  'cdnis': { fr: 'à CDNIS', en: 'CDNIS', cles: ['cdnis'] },
  'gsis': { fr: 'à la German Swiss International School', en: 'German Swiss International School', cles: ['gsis', 'german-swiss-international-school'] },
  'isf-academy': { fr: "à l'ISF Academy", en: 'the ISF Academy', cles: ['isf-academy'] },
  'asij': { fr: "à l'American School in Japan", en: 'the American School in Japan', cles: ['asij', 'american-school-in-japan'] },
  'james-ruse': { fr: 'à James Ruse', en: 'James Ruse', cles: ['james-ruse'] },
  'aditya-birla': { fr: "à l'Aditya Birla World Academy", en: 'the Aditya Birla World Academy', cles: ['aditya-birla'] },
  'michaelhouse': { fr: 'à Michaelhouse', en: 'Michaelhouse', cles: ['michaelhouse'] },
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
  return trouvees.length === 1 ? trouvees[0] : null;
}
