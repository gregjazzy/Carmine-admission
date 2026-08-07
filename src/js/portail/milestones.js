/**
 * Référentiel des jalons Carmine Admission.
 *
 * C'est la source de vérité du portail. À la création d'un dossier on saisit la CLASSE
 * ACTUELLE de l'élève ; le référentiel produit alors son calendrier personnel daté,
 * découpé classe par classe, de la sixième jusqu'à la rentrée universitaire.
 *
 * ─── Calcul des dates ───────────────────────────────────────────────────────────
 * L'année de terminale sert uniquement de PIVOT de calcul — ce n'est pas le début du
 * calendrier. Les jalons de troisième portent y = -3, ceux de seconde y = -2, etc.
 * `y` est l'index de l'année SCOLAIRE, relatif à la terminale :
 *     -3 = troisième · -2 = seconde · -1 = première · 0 = terminale · 1 = après le bac
 *
 * Une année scolaire d'index `y` commence en septembre de l'année civile `T + y`,
 * où `T` est l'année civile de la RENTRÉE de terminale.
 * Un mois ≥ 8 appartient donc à l'automne de cette année scolaire (année civile T+y),
 * un mois ≤ 7 au printemps qui suit (année civile T+y+1).
 *
 * Exemple, terminale rentrée en septembre 2027 (T = 2027) :
 *     { y: 0,  m: 10, d: 15 }  →  15 octobre 2027   (échéance Oxbridge)
 *     { y: 0,  m: 1,  d: 13 }  →  13 janvier 2028   (échéance UCAS principale)
 *     { y: -1, m: 6,  d: 30 }  →  30 juin 2027      (fin de première)
 *     { y: 1,  m: 9,  d: 15 }  →  15 septembre 2028 (rentrée universitaire)
 */



export const PHASES = [
  {
    key: 0,
    roman: 'I',
    title: 'Amont',
    when: 'De la sixième à la troisième',
    intro:
      "On ne prépare pas encore un dossier : on construit un élève. Choix d'établissement, niveau de langue, premiers engagements réels. C'est aussi l'année où s'ouvre le relevé de notes que liront les universités américaines.",
  },
  {
    key: 1,
    roman: 'II',
    title: 'Fondations',
    when: 'Seconde',
    intro:
      "L'année des décisions structurantes. Les spécialités choisies au printemps déterminent les cursus accessibles trois ans plus tard. On élague les activités et on lance le premier projet de fond.",
  },
  {
    key: 2,
    roman: 'III',
    title: 'Construction',
    when: 'Première',
    intro:
      "L'année la plus scrutée du dossier. Tests standardisés, distinction externe, liste d'universités, recommandeurs sollicités, et un été consacré à l'écriture.",
  },
  {
    key: 3,
    roman: 'IV',
    title: 'Candidature',
    when: 'Terminale',
    intro:
      'Quatre calendriers se superposent — britannique, américain, européen, français. Le travail devient un pilotage à la date près, où aucune échéance ne se rattrape.',
  },
  {
    key: 4,
    roman: 'V',
    title: 'Concrétisation',
    when: "Une fois l'admission obtenue",
    intro:
      "L'admission ne vaut que si elle se concrétise. Visa, conditions de notes à tenir, installation : la phase la plus sous-estimée, et celle où les délais administratifs font encore perdre des places chaque année.",
  },
];

export const MILESTONES = [
  /* ═══════════ I — AMONT ═══════════ */
  {
    id: 'A-01', phase: 0, tracks: ['uk', 'us', 'eu'], kind: 'formulaire',
    owners: ['carmine', 'parents', 'eleve'], y: -3, m: 9, d: 15,
    title: 'Entretien diagnostic et questionnaire de profil',
    when: "À l'entrée en accompagnement",
    obj: "Établir une lecture juste du profil avant toute décision : parcours, résultats, langues, engagements réels, contraintes de la famille.",
    carmine: "Un compte rendu écrit du diagnostic et une première hypothèse de trajectoire.",
    family: "Remplir le questionnaire de profil en ligne, sans filtrer ce qui vous semble anodin.",
    upload: ['Bulletins des deux dernières années', "Copie de la pièce d'identité de l'élève"],
    docs: [{ code: 'FORM', label: 'Questionnaire de profil', note: 'En ligne, 15 à 20 minutes' }],
  },
  {
    id: 'A-02', phase: 0, tracks: ['uk', 'us', 'eu'], kind: 'livrable',
    owners: ['carmine'], y: -3, m: 10, d: 1,
    title: 'Note de stratégie à long terme',
    when: 'Sous quinze jours',
    obj: "Fixer les pays et familles de cursus visés, et le raisonnement qui y conduit — pour pouvoir le réviser en connaissance de cause.",
    carmine: "Une note de quatre à six pages : hypothèses de trajectoire, conséquences sur la scolarité, calendrier général.",
    family: "La lire, la contester, la faire lire à l'élève. Une stratégie que l'élève ne s'approprie pas ne tient pas trois ans.",
  },
  {
    id: 'A-03', phase: 0, tracks: ['uk', 'us', 'eu'], kind: 'jalon', lock: true,
    owners: ['carmine', 'parents'], y: -3, m: 2, d: 15,
    title: "Choix d'établissement ou de section",
    when: "Avant les vœux d'établissement",
    obj: "Arbitrer entre système national, section internationale, OIB, IB ou cursus britannique. Ce choix détermine la manière dont le dossier sera lu à l'étranger.",
    carmine: "Une note comparative chiffrée : lisibilité du diplôme par pays, exigences, coût, réversibilité du choix.",
    family: "Nous prévenir des échéances d'inscription de l'établissement, qui tombent souvent très tôt.",
  },
  {
    id: 'A-04', phase: 0, tracks: ['uk', 'us', 'eu'], kind: 'livrable',
    owners: ['carmine', 'eleve'], y: -3, m: 10, d: 15,
    title: 'Plan linguistique',
    when: 'Revu chaque année',
    obj: "Amener l'anglais à un niveau académique — lire un cours magistral, écrire un essai argumenté — et atteindre le niveau exigé dans la seconde langue si l'Europe continentale est visée.",
    carmine: "Une feuille de route annuelle avec objectifs de niveau, ressources et points de contrôle.",
    family: "Tenir le rythme de lecture. C'est l'investissement au rendement le plus élevé de toute la préparation.",
    warn: "L'allemand C1 conditionne l'accès aux bachelors de l'ETH Zurich et de la plupart des universités allemandes publiques. Se décide quatre ans à l'avance, pas six mois.",
  },
  {
    id: 'A-05', phase: 0, tracks: ['us'], kind: 'livrable',
    owners: ['carmine', 'eleve'], y: -3, m: 6, d: 15,
    title: "Cartographie des centres d'intérêt",
    when: 'Fin de troisième',
    obj: "Identifier deux ou trois pistes d'excellence possibles, plutôt que d'accumuler des activités sans direction.",
    carmine: "Un atelier d'exploration et une note d'orientation des engagements pour les trois années suivantes.",
    family: "Accepter l'élagage. Renoncer à trois activités pour en approfondir une est contre-intuitif et décisif.",
  },
  {
    id: 'A-06', phase: 0, tracks: ['us'], kind: 'jalon', lock: true,
    owners: ['carmine', 'parents'], y: -3, m: 9, d: 5,
    title: 'Ouverture du relevé de notes américain',
    when: 'Rentrée de troisième',
    obj: "Signaler que la troisième correspond à la Grade 9 : les notes de cette année figureront dans le dossier transmis aux universités américaines.",
    carmine: "Une alerte de cadrage et un point de vigilance sur les matières qui pèseront le plus.",
    family: "En informer l'élève, simplement : savoir que l'année compte suffit généralement à changer la manière de la traiter.",
    warn: "Une année plus faible n'est jamais éliminatoire — elle s'explique, et une progression nette sur les années suivantes est un signal apprécié en soi.",
  },

  /* ═══════════ II — FONDATIONS ═══════════ */
  {
    id: 'B-01', phase: 1, tracks: ['uk', 'us', 'eu'], kind: 'jalon', lock: true,
    owners: ['carmine', 'eleve', 'parents', 'etablissement'], y: -2, m: 2, d: 20,
    title: 'Arbitrage des spécialités',
    when: 'Février – mars',
    obj: "Choisir les spécialités de première et de terminale en fonction des cursus visés, et non l'inverse.",
    carmine: "Une note d'arbitrage listant, pour chaque combinaison envisagée, les cursus qu'elle ouvre et ceux qu'elle ferme.",
    family: "Nous consulter avant de remplir les vœux, pas après.",
    warn: "Sans Mathématiques Expertes, les candidatures en mathématiques, informatique ou ingénierie à Oxford, Cambridge et Imperial ne sont pas recevables. La décision se prend à quinze ans.",
  },
  {
    id: 'B-02', phase: 1, tracks: ['us', 'uk'], kind: 'livrable',
    owners: ['carmine', 'eleve'], y: -2, m: 10, d: 10,
    title: "Plan d'activités annuel",
    when: 'Octobre',
    obj: "Distinguer ce qui doit être approfondi de ce qui doit être abandonné. Une liste longue sans profondeur ne pèse rien.",
    carmine: "Un tableau d'engagements avec, pour chacun, le niveau visé et le jalon de l'année.",
    family: "Protéger le temps nécessaire : un engagement sérieux exige des créneaux hebdomadaires stables.",
  },
  {
    id: 'B-03', phase: 1, tracks: ['us', 'uk'], kind: 'livrable',
    owners: ['eleve', 'carmine'], y: -2, m: 1, d: 15,
    title: 'Lancement du premier projet de fond',
    when: 'Janvier',
    obj: "Faire passer l'élève du statut de participant à celui d'auteur : produire quelque chose qui n'existait pas.",
    carmine: "Un cahier des charges, un calendrier de jalons et un suivi mensuel.",
    family: "Ne pas faire le projet à la place de l'élève. Un jury reconnaît immédiatement un travail d'adulte.",
  },
  {
    id: 'B-04', phase: 1, tracks: ['us'], kind: 'examen',
    owners: ['eleve'], y: -2, m: 4, d: 15,
    title: 'Test blanc diagnostic SAT',
    when: 'Printemps',
    obj: "Mesurer l'écart réel avec les scores visés, sans enjeu ni trace, pour dimensionner la préparation.",
    carmine: "Un rapport de niveau par section et un plan de préparation asymétrique.",
    family: "Aucune préparation préalable : un diagnostic préparé ne diagnostique rien.",
    warn: "Le point faible quasi systématique des élèves français est la section Reading & Writing, pas les mathématiques. La préparation doit y consacrer l'essentiel du temps.",
  },
  {
    id: 'B-05', phase: 1, tracks: ['us', 'uk'], kind: 'jalon', lock: true,
    owners: ['carmine', 'parents'], y: -2, m: 1, d: 20,
    title: "Choix des programmes d'été",
    when: 'Janvier – février',
    obj: "Retenir uniquement des programmes sélectifs ou des immersions réelles. Les séjours payants sans sélection n'apportent rien au dossier.",
    carmine: "Une sélection argumentée et l'accompagnement des candidatures correspondantes.",
    family: "Anticiper : les meilleurs programmes ferment leurs inscriptions dès janvier.",
  },
  {
    id: 'B-06', phase: 1, tracks: ['uk', 'us', 'eu'], kind: 'livrable',
    owners: ['carmine', 'parents'], y: -2, m: 6, d: 20,
    title: "Point d'étape avec les parents",
    when: 'Juin',
    obj: "Faire le bilan de l'année et valider la trajectoire avant l'année de première.",
    carmine: "Un bilan écrit et une réunion de quarante-cinq minutes.",
    family: "Y venir avec vos doutes, y compris sur la stratégie elle-même.",
  },

  /* ═══════════ III — CONSTRUCTION ═══════════ */
  {
    id: 'C-01', phase: 2, tracks: ['uk', 'us', 'eu'], kind: 'livrable',
    owners: ['carmine'], y: -1, m: 9, d: 25,
    title: 'Note de positionnement chiffrée',
    when: 'Septembre',
    obj: "Situer le profil par rapport aux médianes réelles des universités visées : académique, distinction externe, tests.",
    carmine: "Une note de positionnement avec projection à dix-huit mois et écarts à combler.",
    family: "Accepter une lecture franche. Une note complaisante ne sert personne.",
  },
  {
    id: 'C-02', phase: 2, tracks: ['uk'], kind: 'livrable',
    owners: ['carmine', 'eleve'], y: -1, m: 10, d: 10,
    title: 'Programme super-curriculaire',
    when: 'Octobre',
    obj: "Nourrir la candidature britannique par la discipline elle-même : lectures, cours en ligne, olympiades, recherche.",
    carmine: "Une bibliographie personnalisée, une sélection de cours en ligne et un calendrier de concours.",
    family: "Comprendre la distinction : au Royaume-Uni, le club de théâtre ne compte pas ; le livre lu sur le sujet, oui.",
    warn: "C'est la différence culturelle la plus mal comprise. Un dossier britannique se juge sur ce qui prolonge la discipline, pas sur la richesse de la personnalité.",
  },
  {
    id: 'C-03', phase: 2, tracks: ['us', 'uk'], kind: 'jalon', lock: true,
    owners: ['eleve'], y: -1, m: 11, d: 15,
    title: 'Inscription aux olympiades et concours',
    when: 'Octobre – décembre',
    obj: "Obtenir une reconnaissance extérieure au lycée, seul élément du dossier qu'aucun accompagnement ne peut fabriquer.",
    carmine: "La liste datée des concours pertinents et la préparation associée.",
    family: "Surveiller les dates d'inscription, souvent gérées par l'établissement et parfois oubliées.",
  },
  {
    id: 'C-04', phase: 2, tracks: ['us'], kind: 'livrable',
    owners: ['eleve', 'carmine'], y: -1, m: 12, d: 5,
    title: 'Préparation SAT ou ACT',
    when: 'Décembre – mars',
    obj: "Amener le score au niveau des médianes visées : 1520 à 1580 pour les universités les plus sélectives.",
    carmine: "Un plan hebdomadaire, des tests blancs chronométrés et une analyse d'erreurs par typologie.",
    family: "Garantir dix à douze heures hebdomadaires pendant le cycle. C'est une charge réelle qui s'ajoute au lycée.",
  },
  {
    id: 'C-05', phase: 2, tracks: ['us'], kind: 'examen', lock: true,
    owners: ['eleve'], y: -1, m: 3, d: 15,
    title: 'Première passation officielle',
    when: 'Mars ou mai',
    obj: "Obtenir un score de référence assez tôt pour disposer de deux passations supplémentaires.",
    carmine: "L'inscription vérifiée et l'analyse du score obtenu.",
    family: "Réserver la session plusieurs semaines à l'avance : les centres saturent.",
    upload: ['Confirmation d’inscription', 'Relevé de score'],
  },
  {
    id: 'C-06', phase: 2, tracks: ['uk', 'us', 'eu'], kind: 'livrable',
    owners: ['carmine', 'eleve', 'parents'], y: -1, m: 2, d: 15,
    title: "Liste longue d'universités",
    when: 'Février',
    obj: "Construire une liste d'environ vingt-cinq établissements répartis en trois zones de probabilité, puis la resserrer.",
    carmine: "Un tableau comparatif : exigences, coût réel, taux d'admission, adéquation au profil.",
    family: "Distinguer le prestige perçu de l'adéquation réelle. C'est souvent la conversation la plus difficile.",
    warn: "Une université de sécurité n'en est une que si elle est financièrement soutenable et que l'élève accepterait d'y aller.",
  },
  {
    id: 'C-07', phase: 2, tracks: ['us', 'uk', 'eu'], kind: 'livrable',
    owners: ['carmine', 'parents'], y: -1, m: 3, d: 20,
    title: 'Modélisation financière',
    when: 'Mars',
    obj: "Chiffrer le coût réel par université et identifier les dispositifs d'aide accessibles avant de figer la liste.",
    carmine: "Une simulation chiffrée par établissement, incluant aides au besoin et bourses au mérite.",
    family: "Nous donner une enveloppe honnête. Une stratégie bâtie sur un budget optimiste se défait en avril.",
    warn: "Quelques universités américaines couvrent l'intégralité du besoin, y compris pour les candidats étrangers, sans que la demande d'aide nuise à la candidature. Toutes les autres en tiennent compte.",
  },
  {
    id: 'C-08', phase: 2, tracks: ['us'], kind: 'livrable',
    owners: ['eleve', 'parents'], y: -1, m: 4, d: 15,
    title: "Visites et sessions d'information",
    when: 'Mars – juin',
    obj: "Nourrir les essais en contenu concret, et laisser une trace d'intérêt là où ce critère est explicitement pris en compte.",
    carmine: "Un journal de contacts et une trame de questions à poser.",
    family: "Privilégier les sessions en ligne bien préparées à un voyage coûteux mal exploité.",
  },
  {
    id: 'C-09', phase: 2, tracks: ['us', 'uk'], kind: 'jalon', lock: true,
    owners: ['eleve', 'etablissement'], y: -1, m: 6, d: 15,
    title: 'Demande aux professeurs recommandeurs',
    when: "Avant les vacances d'été",
    obj: "Solliciter les deux professeurs qui connaissent le mieux la manière de travailler de l'élève, assez tôt pour qu'ils écrivent avec du recul.",
    carmine: "La lettre de demande, la fiche de synthèse à leur remettre et le calendrier de relance.",
    family: "Laisser l'élève faire la demande lui-même, en personne.",
    warn: "Un professeur sollicité en septembre écrit une lettre générique. Sollicité en mai, il l'écrit avec du recul et des exemples.",
    docs: [
      { code: 'MOD', label: 'Modèle de demande de recommandation', note: 'Lettre à personnaliser' },
      { code: 'MOD', label: 'Fiche de synthèse pour le recommandeur', note: 'Une à deux pages de matière concrète' },
    ],
  },
  {
    id: 'C-10', phase: 2, tracks: ['us'], kind: 'livrable',
    owners: ['eleve', 'carmine'], y: -1, m: 4, d: 1,
    title: 'Second projet de fond',
    when: 'Avril – septembre',
    obj: "Atteindre un niveau de reconnaissance dépassant le cadre de l'établissement : prix régional, recherche encadrée, publication, structure viable.",
    carmine: "Un accompagnement mensuel et la mise en relation lorsqu'elle est possible.",
    family: "Accepter la lenteur. Un projet crédible demande douze à dix-huit mois.",
  },
  {
    id: 'C-11', phase: 2, tracks: ['uk', 'eu'], kind: 'examen',
    owners: ['eleve'], y: -1, m: 6, d: 25,
    title: "Certification d'anglais",
    when: 'Juin – juillet',
    obj: "Obtenir l'IELTS ou le TOEFL au niveau exigé, ni trop tôt ni trop tard.",
    carmine: "La vérification des exigences université par université et la préparation ciblée.",
    family: "Ne pas le passer avant la première.",
    warn: "L'IELTS et le TOEFL ne sont valables que deux ans. Passés en seconde, ils expirent avant la rentrée universitaire.",
    upload: ['Relevé de score officiel'],
  },
  {
    id: 'C-12', phase: 2, tracks: ['us'], kind: 'examen',
    owners: ['eleve'], y: -1, m: 6, d: 5,
    title: 'Seconde passation SAT ou ACT',
    when: 'Juin ou août',
    obj: "Consolider le score : la progression moyenne entre deux passations préparées se situe entre soixante et cent vingt points.",
    carmine: "L'analyse comparative et la décision de tenter ou non une troisième session.",
    upload: ['Relevé de score'],
  },
  {
    id: 'C-13', phase: 2, tracks: ['uk'], kind: 'jalon', lock: true,
    owners: ['eleve', 'carmine'], y: 0, m: 9, d: 15,
    title: "Inscription aux tests d'admission britanniques",
    when: 'De la mi-juin à la fin septembre',
    obj: "S'inscrire au test exigé par le cursus visé : MAT, PAT, TMUA, ESAT, UCAT ou LNAT selon la discipline.",
    carmine: "L'échéancier personnel, la vérification de l'inscription et l'archivage de la preuve.",
    family: "Nous transmettre la confirmation d'inscription dès réception.",
    warn: "C'est la première cause d'échec mécanique d'une candidature britannique. Une inscription manquée annule la candidature, sans recours ni session de rattrapage.",
    upload: ["Preuve d'inscription au test"],
  },
  {
    id: 'C-14', phase: 2, tracks: ['uk'], kind: 'livrable',
    owners: ['eleve', 'carmine'], y: -1, m: 7, d: 5,
    title: "Préparation du test d'admission",
    when: 'Juillet – octobre',
    obj: "Préparer un format d'épreuve sans équivalent dans le système français : problèmes ouverts, temps très contraint.",
    carmine: "Un plan de huit à douze semaines, les annales corrigées et des simulations chronométrées.",
    family: "Prévoir cette charge dans l'été. Ces épreuves ne se préparent pas en deux week-ends.",
  },
  {
    id: 'C-15', phase: 2, tracks: ['uk'], kind: 'livrable',
    owners: ['eleve', 'carmine'], y: -1, m: 7, d: 10,
    title: 'Rédaction du Personal Statement',
    when: 'Juillet – août',
    obj: "Répondre aux trois questions structurées d'UCAS en quatre mille caractères, sans redite entre les sections.",
    carmine: "Quatre à six versions commentées, du plan au texte final.",
    family: "Laisser l'élève écrire. Un texte réécrit par un adulte se repère à la première phrase.",
    warn: "Ce texte unique vaut pour les cinq vœux. Si les cinq cursus ne partagent pas une discipline commune, il devient impossible à écrire — la liste doit être construite avec cette contrainte.",
  },
  {
    id: 'C-16', phase: 2, tracks: ['us'], kind: 'livrable',
    owners: ['eleve', 'carmine'], y: -1, m: 7, d: 10,
    title: "Rédaction de l'essai principal",
    when: 'Juillet – août',
    obj: "Écrire les six cent cinquante mots du Personal Statement, seul endroit du dossier où l'élève parle en son nom.",
    carmine: "Cinq à huit versions commentées, du travail de matière jusqu'à la version finale.",
    family: "Accepter les sujets inattendus : un échec, une obsession minuscule, disent souvent plus qu'un récit de réussite.",
    warn: "L'erreur la plus fréquente est l'essai en curriculum vitæ narratif, qui répète ce que le dossier dit déjà.",
  },
  {
    id: 'C-17', phase: 2, tracks: ['us'], kind: 'livrable',
    owners: ['eleve', 'carmine'], y: 0, m: 8, d: 10,
    title: 'Essais complémentaires des candidatures anticipées',
    when: 'Août',
    obj: "Écrire les essais propres à chaque université visée en candidature anticipée, dont le classique « pourquoi nous ».",
    carmine: "Une banque d'essais pilotée par vagues, avec réutilisation raisonnée.",
    family: "Protéger le mois d'août. C'est le seul moment où ce travail est possible sans dégrader les notes.",
  },
  {
    id: 'C-18', phase: 2, tracks: ['uk', 'us', 'eu'], kind: 'livrable',
    owners: ['carmine', 'parents'], y: -1, m: 7, d: 5,
    title: "Point d'étape avec les parents",
    when: 'Juillet',
    obj: "Valider l'état du dossier avant l'année de candidature et présenter le calendrier de terminale.",
    carmine: "Un bilan écrit et le calendrier détaillé des douze mois à venir.",
  },

  /* ═══════════ IV — CANDIDATURE ═══════════ */
  {
    id: 'D-01', phase: 3, tracks: ['us'], kind: 'jalon',
    owners: ['eleve'], y: 0, m: 8, d: 1,
    title: 'Ouverture du dossier américain',
    when: '1er août',
    obj: "Créer le dossier commun aux universités américaines et reporter les données saisies l'année précédente.",
    carmine: "La vérification complète de la saisie avant tout envoi.",
  },
  {
    id: 'D-02', phase: 3, tracks: ['uk'], kind: 'jalon',
    owners: ['eleve'], y: 0, m: 9, d: 5,
    title: 'Ouverture du dossier UCAS',
    when: 'Début septembre',
    obj: "Créer le dossier britannique et le rattacher à l'établissement, condition d'envoi de la référence.",
    carmine: "La vérification du rattachement et de la saisie des qualifications.",
  },
  {
    id: 'D-03', phase: 3, tracks: ['uk', 'us', 'eu'], kind: 'livrable',
    owners: ['carmine', 'eleve', 'parents'], y: 0, m: 9, d: 15,
    title: "Liste finale d'universités",
    when: 'Septembre',
    obj: "Arrêter définitivement la liste : douze à seize aux États-Unis, cinq au Royaume-Uni, plus les candidatures européennes.",
    carmine: "Un tableau verrouillé, avec pour chaque établissement l'échéance, le test exigé et les documents requis.",
  },
  {
    id: 'D-04', phase: 3, tracks: ['us'], kind: 'livrable',
    owners: ['eleve', 'carmine'], y: 0, m: 9, d: 20,
    title: "Liste d'activités et de distinctions",
    when: 'Septembre',
    obj: "Formuler dix activités et cinq distinctions en cent cinquante caractères chacune — un exercice d'écriture à part entière.",
    carmine: "La hiérarchisation et la reformulation de chaque ligne.",
  },
  {
    id: 'D-05', phase: 3, tracks: ['us'], kind: 'document', lock: true,
    owners: ['eleve'], y: 0, m: 9, d: 10,
    title: 'Autorisation de transmission du dossier scolaire',
    when: 'Avant toute demande de lettre',
    obj: "Signer la renonciation au droit de consulter ses propres lettres de recommandation, préalable à toute sollicitation.",
    carmine: "L'explication du choix et la vérification que la signature est enregistrée avant l'envoi des invitations.",
    family: "Renoncer à ce droit est le choix de l'élève, jamais une obligation — mais une lettre que l'élève peut lire perd de sa valeur aux yeux du jury, qui le sait.",
    warn: "Étape purement administrative, régulièrement oubliée. Tant qu'elle n'est pas signée, aucun professeur ni responsable d'établissement ne peut déposer de document.",
  },
  {
    id: 'D-06', phase: 3, tracks: ['uk'], kind: 'jalon', lock: true,
    owners: ['etablissement', 'carmine'], y: 0, m: 10, d: 1,
    title: "Notes prédites et référence de l'établissement",
    when: 'Avant le 1er octobre',
    obj: "Obtenir de l'établissement des notes prédites cohérentes avec les exigences visées, et une référence structurée.",
    carmine: "La lettre de demande à la direction, une trame de référence conforme au format en vigueur, et le suivi jusqu'à obtention.",
    family: "Solliciter l'établissement tôt : la charge est lourde et concerne plusieurs élèves à la fois.",
    warn: "Une prédiction trop basse rend la candidature irrecevable ; une prédiction irréaliste fragilise la crédibilité de l'établissement. L'équilibre se négocie en amont.",
    docs: [{ code: 'MOD', label: 'Demande de notes prédites', note: 'Courrier à la direction' }],
  },
  {
    id: 'D-07', phase: 3, tracks: ['us'], kind: 'document', lock: true,
    owners: ['etablissement', 'carmine'], y: 0, m: 10, d: 15,
    title: "Documents transmis par l'établissement",
    when: 'Octobre – novembre',
    obj: "Faire déposer par l'établissement les pièces qui ne dépendent pas de l'élève : relevé de notes, rapport et profil d'établissement, lettre du responsable d'orientation, deux évaluations de professeurs.",
    carmine: "La coordination avec l'établissement, la traduction du dossier scolaire et la rédaction du profil d'établissement lorsqu'il n'existe pas.",
    family: "Prévenir l'établissement dès la rentrée : ces pièces sont nombreuses et souvent inconnues des lycées français.",
    warn: "Un lycée français n'a généralement ni profil d'établissement ni responsable d'orientation au sens américain. Ces documents sont à construire de toutes pièces — un travail de plusieurs semaines à lancer en septembre.",
  },
  {
    id: 'D-08', phase: 3, tracks: ['uk'], kind: 'jalon', lock: true,
    owners: ['eleve'], y: 0, m: 10, d: 15,
    title: 'Échéance Oxford, Cambridge, médecine',
    when: '15 octobre, 18 h heure britannique',
    obj: "Déposer la candidature UCAS pour Oxford ou Cambridge, la médecine, la dentaire et la vétérinaire.",
    carmine: "La relecture complète du dossier et l'archivage de l'accusé de dépôt.",
    family: "Ne rien planifier d'autre cette semaine-là.",
    warn: "Aucune tolérance de retard, à la minute près. On ne peut candidater à Oxford et à Cambridge la même année.",
    upload: ['Accusé de dépôt UCAS'],
  },
  {
    id: 'D-09', phase: 3, tracks: ['uk'], kind: 'document', lock: true,
    owners: ['eleve', 'carmine'], y: 0, m: 10, d: 22,
    title: 'My Cambridge Application',
    when: '22 octobre, 18 h heure britannique',
    obj: "Compléter le formulaire propre à Cambridge, exigé en plus de la candidature UCAS et sous une échéance distincte.",
    carmine: "La préparation des réponses, la sélection des travaux écrits et la vérification des exigences propres au collège visé.",
    family: "Ne pas relâcher l'attention après le 15 octobre : une seconde échéance suit immédiatement.",
    warn: "Anciennement appelé SAQ. Cambridge ne récupère plus aucun document déposé sur UCAS : tout ce que l'université doit lire passe par ce formulaire ou par le collège.",
  },
  {
    id: 'D-10', phase: 3, tracks: ['uk'], kind: 'examen', lock: true,
    owners: ['eleve'], y: 0, m: 10, d: 24,
    title: "Passage des tests d'admission",
    when: 'Fin octobre',
    obj: "Passer l'épreuve dans la fenêtre imposée. Seule la session d'automne est prise en compte par Oxford et Cambridge.",
    carmine: "La préparation finale et la logistique du centre d'examen.",
  },
  {
    id: 'D-11', phase: 3, tracks: ['uk'], kind: 'document', lock: true,
    owners: ['eleve', 'carmine'], y: 0, m: 11, d: 5,
    title: 'Travaux écrits',
    when: 'Début novembre',
    obj: "Transmettre les copies rédigées en classe exigées par certains cursus d'Oxford et de Cambridge, en lettres et sciences humaines principalement.",
    carmine: "La sélection des copies les plus révélatrices et la vérification du format imposé par chaque collège.",
    family: "Conserver les copies notées de première et de terminale : elles sont demandées telles quelles, corrections du professeur comprises.",
    upload: ['Copies notées à transmettre'],
  },
  {
    id: 'D-12', phase: 3, tracks: ['us'], kind: 'jalon', lock: true,
    owners: ['eleve'], y: 0, m: 11, d: 1,
    title: 'Échéance des candidatures anticipées',
    when: '1er novembre',
    obj: "Déposer les candidatures anticipées, dont le taux d'admission dépasse souvent deux à trois fois celui du tour ordinaire.",
    carmine: "La relecture de chaque dossier et l'archivage des accusés.",
    family: "Comprendre l'engagement : une candidature anticipée contraignante oblige à s'inscrire si l'élève est admis.",
    warn: "S'engager avant de connaître le montant de l'aide financière est un piège pour toute famille qui en dépend. Cet arbitrage se décide en septembre, pas en octobre.",
  },
  {
    id: 'D-13', phase: 3, tracks: ['us'], kind: 'jalon', lock: true,
    owners: ['eleve'], y: 0, m: 11, d: 30,
    title: 'Candidature aux universités de Californie',
    when: 'Du 1er au 30 novembre',
    obj: "Déposer le dossier commun aux campus californiens, avec quatre essais spécifiques et un portail distinct.",
    carmine: "L'accompagnement des quatre essais, très différents de l'essai principal.",
  },
  {
    id: 'D-14', phase: 3, tracks: ['us', 'uk', 'eu'], kind: 'document',
    owners: ['eleve', 'carmine'], y: 0, m: 11, d: 15,
    title: 'Dossiers artistiques et sportifs',
    when: 'Octobre – décembre',
    obj: "Constituer les pièces exigées hors dossier standard : portfolio, enregistrement d'audition, bande vidéo sportive, dossier d'éligibilité sportive.",
    carmine: "Le cadrage du portfolio, le calendrier d'enregistrement et la mise en relation avec les entraîneurs lorsque la voie sportive est ouverte.",
    family: "Anticiper de plusieurs mois : un enregistrement d'audition exigeant se prépare comme un concours.",
    warn: "La voie sportive américaine obéit à son propre calendrier, très en amont du dossier classique, et à un dossier d'éligibilité académique distinct.",
  },
  {
    id: 'D-15', phase: 3, tracks: ['uk'], kind: 'livrable',
    owners: ['eleve', 'carmine'], y: 0, m: 11, d: 10,
    title: 'Préparation aux entretiens',
    when: 'Novembre',
    obj: "Préparer un format qui n'est pas un entretien de motivation mais un mini-cours : raisonner à voix haute face à un problème inconnu.",
    carmine: "Quatre à six simulations avec des spécialistes de la discipline, chacune suivie d'un débriefing écrit.",
    family: "Prévoir des créneaux en soirée. Ces séances sont exigeantes et se répartissent sur un mois.",
  },
  {
    id: 'D-16', phase: 3, tracks: ['uk'], kind: 'jalon', lock: true,
    owners: ['eleve'], y: 0, m: 12, d: 5,
    title: 'Entretiens Oxford et Cambridge',
    when: 'Début décembre',
    obj: "Passer deux à quatre entretiens de vingt à quarante-cinq minutes, souvent à distance.",
    carmine: "La logistique, la préparation de dernière heure et le débriefing.",
  },
  {
    id: 'D-17', phase: 3, tracks: ['us'], kind: 'livrable',
    owners: ['eleve', 'carmine'], y: 0, m: 12, d: 1,
    title: 'Entretiens avec les anciens élèves',
    when: 'Novembre – février',
    obj: "Passer les entretiens proposés par les réseaux d'anciens, souvent à distance, facultatifs mais jamais neutres.",
    carmine: "Trois simulations et une grille de préparation par université.",
    family: "Répondre sous vingt-quatre heures à toute proposition d'entretien : les créneaux se ferment vite.",
    docs: [{ code: 'MOD', label: 'Message de remerciement après entretien', note: 'À envoyer sous 24 heures' }],
  },
  {
    id: 'D-18', phase: 3, tracks: ['us'], kind: 'jalon',
    owners: ['carmine'], y: 0, m: 12, d: 15,
    title: 'Résultats des candidatures anticipées',
    when: 'Mi-décembre',
    obj: "Recevoir la décision : admission, refus, ou report vers le tour ordinaire.",
    carmine: "Une note d'analyse et la révision immédiate de la stratégie selon l'issue.",
    family: "En cas d'admission contraignante, les autres candidatures doivent être retirées sous quarante-huit heures.",
    docs: [{ code: 'MOD', label: 'Lettre de retrait des candidatures', note: 'À envoyer sous 48 heures' }],
  },
  {
    id: 'D-19', phase: 3, tracks: ['us'], kind: 'jalon', lock: true,
    owners: ['eleve'], y: 0, m: 1, d: 1,
    title: 'Échéances du tour ordinaire',
    when: '1er au 5 janvier',
    obj: "Déposer l'ensemble des candidatures restantes, avec leurs essais complémentaires propres.",
    carmine: "La seconde vague d'essais et la relecture de chaque dossier.",
  },
  {
    id: 'D-20', phase: 3, tracks: ['uk'], kind: 'jalon', lock: true,
    owners: ['eleve'], y: 0, m: 1, d: 13,
    title: 'Échéance UCAS principale',
    when: 'Mi-janvier, 18 h heure britannique',
    obj: "Déposer la candidature pour l'ensemble des autres universités britanniques.",
    carmine: "La relecture finale et l'archivage de l'accusé.",
    upload: ['Accusé de dépôt UCAS'],
  },
  {
    id: 'D-21', phase: 3, tracks: ['eu'], kind: 'jalon', lock: true,
    owners: ['eleve'], y: 0, m: 1, d: 15,
    title: 'Pays-Bas et Suède',
    when: '15 janvier',
    obj: "Déposer les candidatures aux filières néerlandaises à places limitées et aux universités suédoises.",
    carmine: "La constitution du dossier et la préparation de la sélection décentralisée de février.",
    warn: "Les filières néerlandaises sans places limitées relèvent d'une seconde échéance, au 1er mai. Les confondre coûte une année.",
  },
  {
    id: 'D-22', phase: 3, tracks: ['eu'], kind: 'jalon', lock: true,
    owners: ['eleve', 'carmine'], y: 0, m: 1, d: 20,
    title: 'Vœux Parcoursup',
    when: 'Mi-janvier à mars',
    obj: "Sécuriser une voie française de haut niveau, compatible avec les candidatures internationales.",
    carmine: "La construction des vœux, les projets de formation motivés et l'articulation avec le reste du calendrier.",
    warn: "Le calendrier français chevauche les échéances britanniques et américaines. Décembre et janvier concentrent l'essentiel de la charge de l'année.",
  },
  {
    id: 'D-23', phase: 3, tracks: ['us'], kind: 'document', lock: true,
    owners: ['parents', 'carmine'], y: 0, m: 1, d: 31,
    title: "Dossiers d'aide financière",
    when: 'Janvier – février',
    obj: "Déposer les dossiers d'aide dans les délais, faute de quoi l'aide est perdue même en cas d'admission.",
    carmine: "L'accompagnement du remplissage, particulièrement détaillé pour les familles non résidentes.",
    family: "Réunir les avis d'imposition et justificatifs de patrimoine en amont.",
    upload: ["Avis d'imposition", 'Justificatifs de revenus et de patrimoine'],
  },
  {
    id: 'D-24', phase: 3, tracks: ['eu'], kind: 'jalon', lock: true,
    owners: ['eleve'], y: 0, m: 2, d: 1,
    title: 'Irlande',
    when: '1er février',
    obj: "Déposer la candidature via le portail national irlandais, dont l'échéance est nettement plus précoce que les autres.",
    carmine: "La conversion du baccalauréat au barème irlandais et le suivi du dossier.",
  },
  {
    id: 'D-25', phase: 3, tracks: ['us'], kind: 'document', lock: true,
    owners: ['etablissement'], y: 0, m: 2, d: 10,
    title: 'Relevé de notes de mi-année',
    when: 'Février',
    obj: "Faire transmettre par l'établissement les notes du premier trimestre de terminale, exigées par la quasi-totalité des universités américaines.",
    carmine: "Le rappel à l'établissement et la vérification de la transmission dossier par dossier.",
    warn: "Une chute de résultats en terminale peut entraîner le retrait d'une admission déjà accordée. Ce n'est pas théorique : cela se produit chaque année.",
  },
  {
    id: 'D-26', phase: 3, tracks: ['us'], kind: 'document',
    owners: ['eleve', 'carmine'], y: 0, m: 2, d: 20,
    title: "Lettres d'intérêt maintenu",
    when: 'Février – avril',
    obj: "Relancer utilement les universités ayant reporté leur décision ou placé la candidature en liste d'attente.",
    carmine: "Une lettre personnalisée par université, appuyée sur des éléments nouveaux.",
    warn: "Une relance sans élément nouveau nuit plus qu'elle ne sert. Une seule lettre par université.",
    docs: [
      { code: 'MOD', label: "Lettre d'intérêt maintenu — report", note: '250 à 400 mots' },
      { code: 'MOD', label: "Lettre d'intérêt maintenu — liste d'attente", note: 'Version distincte' },
    ],
  },
  {
    id: 'D-27', phase: 3, tracks: ['eu'], kind: 'jalon', lock: true,
    owners: ['eleve'], y: 0, m: 4, d: 25,
    title: 'Suisse',
    when: 'Fin avril',
    obj: "Déposer la candidature aux écoles polytechniques et universités suisses.",
    carmine: "La vérification des conditions de reconnaissance du diplôme, réévaluées chaque année.",
  },
  {
    id: 'D-28', phase: 3, tracks: ['us'], kind: 'jalon',
    owners: ['carmine'], y: 0, m: 3, d: 28,
    title: "Résultats et propositions d'aide",
    when: 'Mi-mars au 1er avril',
    obj: "Recevoir les décisions du tour ordinaire, accompagnées du détail de l'aide financière accordée.",
    carmine: "Un tableau comparatif du coût net réel par université.",
  },
  {
    id: 'D-29', phase: 3, tracks: ['us'], kind: 'livrable',
    owners: ['carmine', 'parents'], y: 0, m: 4, d: 10,
    title: "Arbitrage des offres et révision de l'aide",
    when: 'Avril',
    obj: "Comparer les offres sur le coût net réel, et demander la révision d'une aide lorsque des éléments le justifient.",
    carmine: "Une note de décision chiffrée et la rédaction de la demande de révision.",
    docs: [{ code: 'MOD', label: "Demande de révision de l'aide financière", note: 'Registre et pièces à joindre' }],
  },
  {
    id: 'D-30', phase: 3, tracks: ['us'], kind: 'jalon', lock: true,
    owners: ['parents', 'eleve'], y: 0, m: 5, d: 1,
    title: 'Décision définitive',
    when: '1er mai',
    obj: "Confirmer l'inscription et verser l'acompte auprès de l'université retenue.",
    carmine: "La vérification des modalités et le suivi des désistements auprès des autres établissements.",
  },
  {
    id: 'D-31', phase: 3, tracks: ['uk'], kind: 'jalon', lock: true,
    owners: ['eleve', 'carmine'], y: 0, m: 5, d: 20,
    title: 'Choix ferme et choix de sécurité',
    when: 'Mai – juin',
    obj: "Retenir une offre ferme et une offre de sécurité, dont les conditions de notes doivent être réellement atteignables.",
    carmine: "L'analyse des conditions et la recommandation d'arbitrage.",
  },
  {
    id: 'D-32', phase: 3, tracks: ['eu'], kind: 'jalon', lock: true,
    owners: ['eleve'], y: 0, m: 5, d: 1,
    title: 'Pays-Bas — seconde échéance',
    when: '1er mai',
    obj: "Déposer les candidatures aux filières néerlandaises sans places limitées.",
    carmine: "La vérification des exigences de mathématiques, souvent décisives.",
  },
  {
    id: 'D-33', phase: 3, tracks: ['uk', 'us', 'eu'], kind: 'examen',
    owners: ['eleve'], y: 0, m: 6, d: 15,
    title: 'Épreuves du baccalauréat',
    when: 'Juin',
    obj: "Atteindre les notes conditionnant les offres obtenues.",
    carmine: "Le suivi des conditions et la préparation du scénario de secours si une condition n'est pas tenue.",
  },
  {
    id: 'D-34', phase: 3, tracks: ['uk'], kind: 'jalon', lock: true,
    owners: ['eleve', 'carmine'], y: 0, m: 7, d: 5,
    title: 'Résultats et rattrapage britannique',
    when: 'Juillet – août',
    obj: "Confirmer l'offre au vu des résultats, ou basculer vers le dispositif de rattrapage si une condition n'est pas tenue.",
    carmine: "Une astreinte le jour des résultats : analyse immédiate, contact des universités, arbitrage sous quelques heures.",
    family: "Être joignable ce jour-là, où que vous soyez. Les places se pourvoient en quelques heures.",
    warn: "Le dispositif d'ajustement pour de meilleurs résultats qu'attendu n'existe plus. Renoncer à sa place pour viser plus haut est désormais irréversible : la place d'origine est perdue au moment du renoncement.",
  },

  /* ═══════════ V — CONCRÉTISATION ═══════════ */
  {
    id: 'E-01', phase: 4, tracks: ['uk', 'us'], kind: 'document', lock: true,
    owners: ['externe', 'carmine'], y: 0, m: 5, d: 25,
    title: "Document d'admission officiel",
    when: 'Mai – juillet',
    obj: "Obtenir le document délivré par l'université — attestation d'inscription américaine ou confirmation d'acceptation britannique — sans lequel aucune demande de visa ne peut être déposée.",
    carmine: "La vérification ligne à ligne : orthographe exacte du nom, dates, montants, intitulé du cursus.",
    family: "Signaler immédiatement toute erreur, même mineure.",
    warn: "Une divergence entre le passeport et le document d'admission bloque le rendez-vous consulaire, et la correction prend plusieurs semaines.",
    upload: ["Document d'admission reçu", 'Copie du passeport'],
  },
  {
    id: 'E-02', phase: 4, tracks: ['uk'], kind: 'document', lock: true,
    owners: ['eleve', 'carmine'], y: 0, m: 5, d: 30,
    title: 'Autorisation pour certaines filières scientifiques',
    when: "Dès l'offre ferme",
    obj: "Obtenir l'autorisation exigée pour un ensemble de cursus scientifiques et d'ingénierie sensibles, préalable indispensable au visa.",
    carmine: "La vérification de l'assujettissement du cursus et le suivi de la demande.",
    warn: "Les délais de traitement sont longs et fluctuants. Un cursus concerné et une demande tardive font perdre la rentrée, alors même que l'admission est acquise.",
  },
  {
    id: 'E-03', phase: 4, tracks: ['uk', 'us', 'eu'], kind: 'jalon', lock: true,
    owners: ['parents', 'eleve', 'externe'], y: 0, m: 6, d: 10,
    title: 'Demande de visa',
    when: "Dès réception du document d'admission",
    obj: "Obtenir le visa étudiant dans des délais consulaires qui s'allongent fortement en été.",
    carmine: "La liste des pièces pays par pays, la préparation de l'entretien consulaire et le suivi jusqu'à obtention.",
    family: "Réserver le rendez-vous dès l'ouverture des créneaux, avant même d'avoir réuni toutes les pièces.",
    warn: "Chaîne de dépendances stricte : acompte versé, puis document d'admission délivré, puis droits et redevances acquittés, puis formulaire en ligne, puis rendez-vous. Prévoir en outre la preuve de ressources exigée sur une période minimale, et le test de tuberculose imposé selon le pays de résidence.",
    upload: ['Passeport en cours de validité', 'Preuve de ressources', 'Justificatif de paiement des frais'],
  },
  {
    id: 'E-04', phase: 4, tracks: ['uk', 'us', 'eu'], kind: 'livrable',
    owners: ['parents', 'carmine'], y: 0, m: 6, d: 1,
    title: 'Logement',
    when: 'Mai – juillet',
    obj: "Sécuriser un logement, en résidence ou dans le parc privé selon la ville et les délais.",
    carmine: "Un comparatif des options et l'accompagnement des dossiers, garant compris.",
  },
  {
    id: 'E-05', phase: 4, tracks: ['uk', 'us', 'eu'], kind: 'document',
    owners: ['parents'], y: 0, m: 7, d: 15,
    title: "Formalités d'installation",
    when: 'Juillet – août',
    obj: "Régler l'assurance santé — obligatoire et coûteuse aux États-Unis —, le compte bancaire et la téléphonie.",
    carmine: "Une liste de contrôle datée, pays par pays.",
  },
  {
    id: 'E-06', phase: 4, tracks: ['us'], kind: 'livrable',
    owners: ['eleve', 'carmine'], y: 1, m: 8, d: 5,
    title: 'Choix des cours et tests de placement',
    when: 'Août',
    obj: "Construire un premier semestre soutenable : le choix des cours conditionne la moyenne de première année.",
    carmine: "Un conseil de sélection et la préparation des tests de placement.",
  },
  {
    id: 'E-07', phase: 4, tracks: ['uk', 'us', 'eu'], kind: 'livrable',
    owners: ['carmine', 'parents', 'eleve'], y: 1, m: 9, d: 30,
    title: 'Bilan de fin de mission',
    when: 'Septembre',
    obj: "Clore l'accompagnement et ouvrir l'accès au réseau des anciens.",
    carmine: "Un bilan écrit et une mise en relation avec des étudiants déjà sur place.",
  },
];

/* ═══════════════════════ Calcul des échéances ═══════════════════════ */

/**
 * Date d'échéance d'un jalon pour un élève donné.
 * @param m jalon du référentiel
 * @param terminaleStartYear année civile de la RENTRÉE de terminale (ex. 2027)
 */
export function dueDate(m, terminaleStartYear) {
  const year = terminaleStartYear + m.y + (m.m >= 8 ? 0 : 1);
  return new Date(Date.UTC(year, m.m - 1, m.d));
}


/** Seuils de rappel, en jours avant échéance. */
export const REMINDERS = [45, 21, 10, 3, 0];
export const REMINDERS_STANDARD = [21, 7, 0];

export function daysUntil(due, today = new Date()) {
  const a = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - b) / 86_400_000);
}

/**
 * Niveau d'urgence d'un jalon, tel qu'il colore la fiche et déclenche les alertes.
 * Un jalon irrattrapable (`lock`) bascule en urgent bien plus tôt qu'un jalon ordinaire.
 */
export function urgency(m, due, status, today = new Date()) {
  if (status === 'fait' || status === 'sans_objet') return 'ok';
  const d = daysUntil(due, today);
  if (d < 0) return 'retard';
  if (m.lock) {
    if (d <= 14) return 'urgent';
    if (d <= 45) return 'bientot';
    return 'ok';
  }
  if (d <= 7) return 'urgent';
  if (d <= 21) return 'bientot';
  return 'ok';
}

/** Jalons applicables à un élève, triés par échéance. */
export function scheduleFor(tracks, terminaleStartYear) {
  return MILESTONES.filter((m) => m.tracks.some((t) => tracks.includes(t)))
    .map((m) => ({ milestone: m, due: dueDate(m, terminaleStartYear) }))
    .sort((a, b) => a.due.getTime() - b.due.getTime());
}

/* ═══════════════════════ Classes et années scolaires ═══════════════════════ */

/**
 * Les classes, indexées par leur écart à la terminale.
 * C'est ce que l'on saisit à la création d'un dossier — jamais une année de terminale,
 * qui n'est qu'un pivot de calcul interne.
 */
export const CLASSES = [
  { key: 'sixieme',   label: 'Sixième',    short: '6e',  y: -6, grade: 'Grade 6' },
  { key: 'cinquieme', label: 'Cinquième',  short: '5e',  y: -5, grade: 'Grade 7' },
  { key: 'quatrieme', label: 'Quatrième',  short: '4e',  y: -4, grade: 'Grade 8' },
  { key: 'troisieme', label: 'Troisième',  short: '3e',  y: -3, grade: 'Grade 9' },
  { key: 'seconde',   label: 'Seconde',    short: '2de', y: -2, grade: 'Grade 10' },
  { key: 'premiere',  label: 'Première',   short: '1re', y: -1, grade: 'Grade 11' },
  { key: 'terminale', label: 'Terminale',  short: 'Tle', y: 0,  grade: 'Grade 12' },
  { key: 'apres',     label: 'Après le bac', short: 'Post-bac', y: 1, grade: '—' },
];


/** Année civile de la rentrée scolaire en cours (une année bascule au 1er août). */
export function currentSchoolYear(today = new Date()) {
  return today.getMonth() + 1 >= 8 ? today.getFullYear() : today.getFullYear() - 1;
}

/**
 * Déduit l'année de rentrée de terminale à partir de la classe actuelle de l'élève.
 * Un élève en seconde (y = -2) à la rentrée 2026 sera en terminale à la rentrée 2028.
 */
export function terminaleYearFromClass(classKey, schoolYear = currentSchoolYear()) {
  const c = CLASSES.find((x) => x.key === classKey);
  if (!c) throw new Error(`Classe inconnue : ${classKey}`);
  return schoolYear - c.y;
}

/** Classe correspondant à une date donnée, pour un élève dont on connaît l'année de terminale. */
export function classAt(due, terminaleStartYear) {
  const sy = currentSchoolYear(due);
  const y = sy - terminaleStartYear;
  return CLASSES.find((c) => c.y === y) ?? CLASSES[CLASSES.length - 1];
}


/**
 * Calendrier complet d'un élève, découpé classe par classe.
 * Ne renvoie que les classes qui portent au moins un jalon applicable.
 */
export function scheduleByClass(tracks, terminaleStartYear, fromClass) {
  const minY = fromClass ? (CLASSES.find((c) => c.key === fromClass)?.y ?? -6) : -6;
  const groups = new Map();

  for (const item of scheduleFor(tracks, terminaleStartYear)) {
    const c = classAt(item.due, terminaleStartYear);
    if (c.y < minY) continue;
    if (!groups.has(c.key)) {
      const sy = terminaleStartYear + c.y;
      groups.set(c.key, {
        classKey: c.key,
        label: c.label,
        fullLabel: `${c.label} · ${sy}-${sy + 1}`,
        schoolYear: sy,
        items: [],
      });
    }
    groups.get(c.key).items.push(item);
  }

  return [...groups.values()].sort((a, b) => a.schoolYear - b.schoolYear);
}

/**
 * Jalons déjà passés au moment de la prise en charge : ils ne sont pas supprimés,
 * mais marqués « hors périmètre » pour que le dossier reste honnête sans culpabiliser
 * une famille qui arrive tardivement.
 */
export function outOfScope(tracks, terminaleStartYear, fromClass) {
  const minY = CLASSES.find((c) => c.key === fromClass)?.y ?? -6;
  return scheduleFor(tracks, terminaleStartYear).filter(
    (i) => classAt(i.due, terminaleStartYear).y < minY
  );
}

export const TRACK_LABEL = {
  uk: 'Royaume-Uni',
  us: 'États-Unis',
  eu: 'Europe',
};

export const OWNER_LABEL = {
  carmine: 'Carmine',
  eleve: 'Élève',
  parents: 'Parents',
  etablissement: 'Établissement',
  externe: 'Organisme externe',
};

export const KIND_LABEL = {
  livrable: 'Livrable',
  jalon: 'Jalon',
  document: 'Document',
  examen: 'Examen',
  formulaire: 'Formulaire',
};
