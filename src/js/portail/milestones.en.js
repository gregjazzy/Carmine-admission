/**
 * English layer for the milestone reference.
 * Loaded on demand — French visitors never download it.
 *
 * Only the human-readable fields are translated; ids, dates and structure live in
 * milestones.js and stay language-neutral.
 */

export const PHASES_EN = {
  0: { title: 'Groundwork', when: 'Years 7 to 9 (6e – 3e)',
    intro: "No application is being written yet: a student is being built. School and track choices, language level, first genuine commitments. This is also the year the transcript US universities will read quietly opens." },
  1: { title: 'Foundations', when: 'Year 10 (Seconde)',
    intro: 'The year of decisions that shape everything else. The specialist subjects chosen in spring determine which courses remain open three years later. Activities are pruned and the first substantial project begins.' },
  2: { title: 'Building', when: 'Year 11 (Première)',
    intro: 'The most closely examined year of the file. Standardised tests, external recognition, the university list, referees approached, and a summer given over to writing.' },
  3: { title: 'Application', when: 'Year 12 (Terminale)',
    intro: 'Four calendars overlap — British, American, European and French. The work becomes date-by-date navigation, where no deadline can be recovered.' },
  4: { title: 'Taking up the place', when: 'Once the offer is in hand',
    intro: 'An offer only counts if it is taken up. Visa, grade conditions to meet, settling in: the most underestimated phase, and the one where administrative delays still cost places every year.' },
};

export const UI_EN = {
  // Connexion
  loginEyebrow: 'Client area',
  loginTitle: "Follow your child's application",
  loginIntro: 'Enter the address you gave us. We will send you a sign-in link — there is no password to remember.',
  emailLabel: 'Email address',
  emailPlaceholder: 'you@example.com',
  loginSubmit: 'Send my link',
  loginSending: 'Sending…',
  loginSent: 'Link sent. Check your inbox — it is valid for one hour.',
  loginFailed: 'Sending failed',
  noFile: 'No application is linked to this address yet.<br>Write to us and we will give you access straight away.',
  discover: 'Explore our work',
  noFileYet: 'No file yet?',

  // Dossier
  file: 'File',
  nextDeadline: 'Next deadline',
  nothingDue: 'Nothing needs your attention',
  nothingExpected: 'Nothing on your side at this step.',
  nothingDueSub: 'Your next deadlines will appear here as soon as something requires you.',
  focusTitle: 'What needs you right now',
  journey: 'The journey, step by step',
  currentYear: 'Current year',
  steps: 'steps',
  whoLabel: 'Who acts',
  allOwners: 'All',
  ownerYou: 'You',
  ownerChild: 'Your child',
  ownerCarmine: 'Carmine',
  nextNone: 'Nothing requires your attention',
  progressCount: (done, total, late) =>
    `${done} of ${total}${late ? ` · ${late} overdue` : ''}`,
  step: 'step',
  sessionNotes: 'Session notes',
  signOut: 'Sign out',
  consolidated: 'Consolidated calendar',
  allTracks: 'All tracks',
  pastTitle: 'steps predating the start of our work together',
  pastIntro: 'These steps come before our engagement began. They appear here for the record and do not represent a delay.',
  fileFollowed: 'File',

  // Panneau
  purpose: 'What this step is for',
  weProduce: 'What we produce',
  weExpect: 'What we need from you',
  people: 'Who is involved',
  watchOut: 'Worth knowing.',
  methodTitle: 'How to run it — internal',
  loading: 'Loading…',
  questionsTitle: 'Questions to ask',
  trameMissing: 'This template is not in the database yet.',
  questionsCopy: 'Copy to pass on',
  questionsCopied: 'Copied',
  questionsIntro: 'To be adapted to the university in question, then passed on. Remind the student to note the name of whoever answers: an essay quoting a specific answer stands apart from one quoting a brochure.',
  wishesTitle: 'Universities you are drawn to',
  wishesIntro: 'List them freely, even the uncertain ones: this is where the conversation starts, not a commitment. A university missing from our reference tables belongs here just as much.',
  wishesIntroAdmin: 'The wishes the family has entered, as written. To be turned into targets below, or discussed.',
  wishesEmpty: 'No wishes entered yet.',
  wishesToDocument: (n) => `${n} institution${n > 1 ? 's' : ''} to document in the reference table.`,
  wishPlaceholder: 'Name of a university',
  selectionTitle: 'The selection retained',
  retained: 'Retained',
  retenuesCount: (n, total) => `${n} of ${total} under consideration retained.`,
  selectionEmpty: 'No university retained yet.',
  pickUniversity: 'Choose from the reference table…',
  admissionRate: 'Admission',
  testsNotApplicable: 'tests not applicable',
  bands: { ambitieuse: 'Reaches', plausible: 'Targets', probable: 'Likelies' },

  journalTitles: { lecture: 'Reading log', projet: 'Project notebook', essai: 'Essay bank', contact: 'Contact log' },
  journalIntros: {
    lecture: 'Three lines per book or course is enough. This log is what makes the Personal Statement writable in July — and it is exactly what the interview will probe.',
    projet: 'This notebook is not there to report to us: it is there for you, in October, when you have to tell this project in six hundred and fifty words. Note what you did and what you take from it. We read it together in session to dig, never to check.',
    essai: 'Every draft counts. Keep track of what works and what you cut: the essay bank is reused from one university to the next.',
    contact: 'One line per session attended or exchange had. What you note here will reappear word for word in the autumn “why us” essays.',
  },
  journalFields: {
    retenu: 'What I take from it',
    desaccord: 'What I disagree with',
    question: 'The question it opens',
  },
  journalHints: {
    retenu: 'The one idea you would keep if you could keep only one.',
    desaccord: 'Even partial disagreement. This is what you will be asked to defend.',
    question: 'What you would want to dig into next.',
  },
  journalEmpty: {
    lecture: 'Nothing yet. Add the first reading below — a title is enough to start.',
    projet: 'Nothing yet. Note below what you did the last time you worked on it.',
    essai: 'Nothing yet. Add a first essay below.',
    contact: 'Nothing yet. Note below the first session you attended.',
  },
  journalNew: { lecture: 'Title of the book, article or course', projet: 'What you did this time', essai: 'Essay title', contact: 'University and type of contact' },
  journalRefHint: 'Author, platform or link — optional',
  journalAdd: 'Add',
  journalRemove: 'Remove',
  journalAnnotated: 'annotated',
  journalToAnnotate: 'to annotate',
  journalCount: (done, total) => `${done} of ${total} annotated`,

  deadlineNature: 'The nature of this deadline',
  deadlineNatureBody: 'This date cannot be recovered. It stays at the top of your area as it draws closer.',
  documents: 'Documents',
  expectedDocs: 'Documents needed',
  templates: 'Related templates',
  dropFile: 'Upload a file',
  dropHint: 'PDF, image or document — click or drag here',
  noDocs: 'No documents uploaded.',
  uploading: 'Uploading…',
  progress: 'Progress',
  parentMessage: 'Message shown to parents',
  privateNote: 'Internal note — never visible to parents',
  save: 'Save',
  saved: 'Saved',
  savedAuto: 'Saved automatically',
  close: 'Close',
  whereWeAre: 'Where we stand',

  // Statuts
  status: { a_faire: 'To do', en_cours: 'In progress', fait: 'Done', sans_objet: 'Not applicable' },

  // Délais
  today: 'today',
  fromDate: 'From',
  tomorrow: 'tomorrow',
  overdueOne: 'one day overdue',
  overdue: (n) => `${n} days overdue`,
  inDays: (n) => `in ${n} days`,
  inOneMonth: 'in a month',
  inMonths: (n) => `in ${n} months`,

  // Classes
  classes: {
    sixieme: 'Year 7', cinquieme: 'Year 8', quatrieme: 'Year 9', troisieme: 'Year 10',
    seconde: 'Year 11', premiere: 'Year 12', terminale: 'Year 13', apres: 'After school',
  },
  tracks: { uk: 'United Kingdom', us: 'United States', eu: 'Europe' },
  kinds: { livrable: 'Deliverable', jalon: 'Milestone', document: 'Document', examen: 'Exam', formulaire: 'Form' },
  owners: { carmine: 'Carmine', eleve: 'Student', parents: 'Parents', etablissement: 'School', externe: 'External body' },

  // Pilotage
  steering: 'Steering',
  newFile: 'New file',
  needsAction: 'What needs action',
  files: 'Files',
  allClear: 'Nothing requires attention. Everything is on track.',
  student: 'Student', stepCol: 'Step', dueCol: 'Due', delayCol: 'Delay', statusCol: 'Status',
  overdueCount: 'overdue',
  allFiles: 'All files',
  resync: 'Realign calendar',
  addNote: 'Add a session note',
  createTitle: 'Create a file',
  createIntro: 'The full calendar is generated automatically from the current school year, all the way to the start of university.',
  firstName: 'First name',
  lastName: 'Surname',
  currentClass: 'Current year group',
  tracksLabel: 'Target countries',
  school: 'School',
  city: 'City',
  createSubmit: 'Create the file',
  creating: 'Creating…',
  cancel: 'Cancel',
  pickTrack: 'Select at least one track.',
  failed: 'Failed',
  noFiles: 'No files yet. Create the first one.',
  adminOnly: 'This page is restricted to administration.',
  goToClient: 'Go to your area',
  goToPilotage: 'Dashboard',
  notePromptTitle: 'Session note title',
  notePromptBody: 'Content',
  notePromptVisible: 'Make this note visible to parents?',
  noteVisible: 'visible to parents',
  notePrivate: 'private',
  summary: (n, late, urgent) =>
    `${n} active file${n > 1 ? 's' : ''}` +
    (late ? ` · ${late} overdue` : '') +
    ` · ${urgent} deadline${urgent > 1 ? 's' : ''} approaching`,
  hiddenRows: (n) => `${n} further deadlines not shown.`,
  resynced: (a, r, d) => `Calendar realigned: ${a} added, ${r} redated, ${d} removed.`,
};

/** Traductions des jalons, indexées par identifiant. */
export const MILESTONES_EN = {
  'A-01': {
    title: 'Diagnostic meeting and profile questionnaire',
    when: 'At the start of our work together',
    obj: 'To establish an accurate reading of the profile before any decision is taken: schooling, results, languages, genuine commitments, family constraints.',
    carmine: 'A written record of the diagnostic and a first hypothesis for the path ahead.',
    family: 'Complete the online profile questionnaire without filtering out what seems unremarkable to you.',
  },
  'A-02': {
    title: 'Long-term strategy note', when: 'Within a fortnight',
    obj: 'To settle the target countries and families of courses, and the reasoning behind them — so that it can later be revised knowingly.',
    carmine: 'A four to six page note: possible paths, consequences for schooling, overall calendar.',
    family: "Read it, challenge it, have your child read it. A strategy the student does not own will not survive three years.",
  },
  'A-03': {
    title: 'Choice of school or stream', when: 'Before school applications close',
    obj: 'To decide between the national system, an international section, the IB or a British curriculum. This choice determines how the file will be read abroad.',
    carmine: 'A costed comparison: how each qualification reads country by country, requirements, cost, and how reversible the choice is.',
    family: 'Tell us when the school application deadlines fall — they often come very early.',
  },
  'A-04': {
    title: 'Language plan', when: 'Reviewed each year',
    obj: 'To bring English to an academic level — following a lecture, writing a reasoned essay — and, if continental Europe is in view, to reach the level required in a second language.',
    carmine: 'An annual roadmap with target levels, resources and checkpoints.',
    family: 'Keep up the reading. It is the highest-yielding investment in the whole preparation.',
    warn: 'German at C1 governs access to undergraduate degrees at ETH Zurich and most German public universities. That is decided four years ahead, not six months.',
  },
  'A-05': {
    title: 'Mapping the student’s interests', when: 'End of Year 10',
    obj: 'To identify two or three genuine avenues of excellence rather than accumulating activities without direction.',
    carmine: 'An exploration workshop and a note steering commitments for the next three years.',
    family: 'Accept the pruning. Dropping three activities to go deeper into one is counter-intuitive and decisive.',
  },
  'A-06': {
    title: 'The US transcript starts counting', when: 'Start of Year 10',
    obj: 'To tell the student, from the start of Year 10, that their marks now count: American universities will read them.',
    carmine: 'A framing alert and a note on the subjects that will carry the most weight.',
    family: 'Simply tell your child. Knowing the year counts is usually enough to change how it is treated.',
    warn: 'A weaker year is never disqualifying — it can be explained, and clear improvement across later years is itself a valued signal.',
  },
  'B-01': {
    title: 'Choosing specialist subjects', when: 'February – March',
    obj: 'To choose the specialist subjects for the final two years according to the courses in view, rather than the other way round.',
    carmine: 'A decision note setting out, for each possible combination, which courses it opens and which it closes.',
    family: 'Consult us before the form is submitted, not after.',
    warn: 'Without Mathématiques Expertes, applications in mathematics, computer science or engineering to Oxford, Cambridge and Imperial are not admissible. The decision is made at fifteen.',
  },
  'B-02': {
    title: 'Annual activity plan', when: 'October',
    obj: 'To separate what should be deepened from what should be dropped. A long list without depth carries no weight.',
    carmine: 'A commitments table setting out, for each, the level aimed at and the year’s milestone.',
    family: 'Protect the time it needs: a serious commitment requires stable weekly slots.',
  },
  'B-03': {
    title: 'Launching a substantial project', when: 'January',
    obj: 'To move the student from participant to author: to produce something that did not exist before.',
    carmine: 'A brief, a schedule of milestones and monthly follow-up.',
    family: "Don't do the project for your child. An admissions reader recognises adult work immediately.",
  },
  'B-04': {
    title: 'Diagnostic SAT sitting', when: 'Spring',
    obj: 'To measure the real gap to target scores, with nothing at stake and no record, in order to size the preparation.',
    carmine: 'A section-by-section report and an asymmetric preparation plan.',
    family: 'No preparation beforehand: a rehearsed diagnostic diagnoses nothing.',
    warn: 'The near-universal weak point for French students is Reading & Writing, not mathematics. Preparation must spend most of its time there.',
  },
  'B-05': {
    title: 'Choosing summer programmes', when: 'January – February',
    obj: 'To keep only selective programmes or genuine immersions. Paid-for stays without selection add nothing to the file.',
    carmine: 'A reasoned shortlist and support with the applications.',
    family: 'Move early: the best programmes close applications in January.',
  },
  'B-06': {
    title: 'Progress meeting with parents', when: 'June',
    obj: 'To review the year and confirm the path before Year 12.',
    carmine: 'A written review and a forty-five minute meeting.',
    family: 'Come with your doubts, including about the strategy itself.',
  },
  'C-01': {
    title: 'Costed positioning note', when: 'September',
    obj: 'To place the profile against the real medians of the universities in view: academic record, external recognition, tests.',
    carmine: 'A positioning note with an eighteen-month projection and the gaps to close.',
    family: 'Accept a frank reading. A flattering note serves no one.',
  },
  'C-02': {
    title: 'Super-curricular programme', when: 'October',
    obj: 'To feed the British application through the subject itself: reading, online courses, olympiads, research.',
    carmine: 'A personal reading list, a selection of online courses and a competition calendar.',
    family: 'Understand the distinction: in the UK the drama club does not count; the book read on the subject does.',
    warn: 'Nothing counts on its own: an activity is taken into account only if you show what it brings to this specific course. '
      + 'Applying for economics? A Piketty read and argued with, a microeconomics MOOC, the economics olympiad: that carries weight by itself. '
      + 'Football captain, student union president, 200 hours of volunteering: that carries none, unless you make the link yourself — '
      + 'a part-time job can serve if it shows rigour useful in economics. In the United States it is the reverse: those commitments count in their own right. '
      + 'The interview probes the same thing: you are given an economics problem you have never seen, and they watch how you reason. '
      + 'One exception: medicine, dentistry, veterinary science and nursing also assess empathy, ethics and hands-on experience.',
    methode: [
      'What they fill in: five questions, never a blank page. Target subjects, what they have already read or followed, '
      + 'reading level in academic English, hours genuinely available per week, and what interests them inside the subject — '
      + '"economics" is not enough, "inequality" is.',
      'What you produce: five to eight titles ranked from the most accessible to the most demanding, two or three MOOCs, '
      + 'and the competition calendar with its registration dates, which then feeds C-03, an unrecoverable deadline.',
      'The step everyone misses: for each item the student writes three to five lines — what they take from it, what they '
      + 'disagree with, the question it opened. That log is the raw material. Ten books read without notes is nine months lost.',
      'How you assess it: not with a grade. Coverage is mechanical and visible in the portal. Depth is tested aloud in session — '
      + '"what does Piketty get wrong?". If they cannot answer, the reading does not count. That is precisely what the interview will ask.',
      'Where it goes: nowhere outside. No university will read it. It feeds C-15, sections 2 and 3 of the Personal Statement, '
      + 'and the November interview preparation.',
    ].join('\n'),
  },
  'C-03': {
    title: 'Entering academic competitions', when: 'October – December',
    obj: 'To secure recognition from outside the school — the one element of the file no adviser can manufacture.',
    carmine: 'A dated list of relevant competitions and the preparation that goes with them.',
    family: 'Watch the entry dates, often handled by the school and sometimes forgotten.',
    warn: 'Entering counts for nothing in itself — it merely buys the right to compete, and once the date has passed '
      + 'the option is closed for a year. What counts afterwards differs by country: in the UK, having competed feeds '
      + 'the application even without a result, provided you can recount what you were looking for. In the United States, '
      + 'only distinction really counts.',
    methode: [
      'Not to be confused with C-13. Competitions (AMC, BMO, Concours général) build external distinction. Admissions '
      + 'tests (MAT, TMUA, ESAT, STEP, LNAT, UCAT) condition the application itself: different calendar, different '
      + 'purpose, different milestone.',
      'From a French curriculum, available without special arrangements: Concours général in Year 13, the national '
      + 'mathematics olympiad in Year 12, the physics, chemistry and geosciences olympiads, Algoréa for computing. '
      + 'That is the default set to propose.',
      'For the United States: AMC 10/12 in November, qualification for the AIME in February, then the USAMO. F=ma then '
      + 'USAPhO in physics, USABO in biology, USACO in computing. The difficulty is not the level but the venue: a French '
      + 'school abroad is not always an approved AMC centre — check in September, not in November.',
      'For the United Kingdom: the UKMT Senior Mathematical Challenge in early October, BMO1 in November, BMO2 in '
      + 'January. The physics, biology and chemistry olympiads run on neighbouring calendars.',
      'Entry windows shift every year and usually go through the school. One reminder at the entry deadline is enough: '
      + 'what is at stake there is the option, not the performance.',
    ].join('\n'),
  },
  'C-04': {
    title: 'SAT or ACT preparation', when: 'December – March',
    obj: 'To bring the score up to the medians in view: 1520 to 1580 for the most selective universities.',
    carmine: 'A weekly plan, timed practice tests and error analysis by type.',
    family: 'Expect a significant investment of time: this preparation genuinely adds to the school week.',
    methode: [
      'The volume follows the gap to close, never a flat weekly figure — a number the family does not keep teaches them '
      + 'that our numbers are decorative. Recovering fifty to eighty points takes around thirty hours in total; going '
      + 'from 1350 to 1500 takes eighty to a hundred and twenty.',
      'It is the timed test that produces progress, not practice without a clock. A student who has never sat under real '
      + 'conditions loses points on the day that they already possess: one full test every three weeks, and error '
      + 'analysis by type rather than by exercise.',
      'Seventy per cent of the effort on reading and writing. That is where a French-speaking profile gains points, and '
      + 'it is counter-intuitive for a family who assume maths is the lever.',
    ].join('\n')
  },
  'C-05': {
    title: 'First SAT or ACT sitting', when: 'March or May',
    obj: 'To secure a baseline score early enough to leave room for two further sittings.',
    carmine: 'Registration checked and the resulting score analysed.',
    family: 'Book the session weeks ahead: centres fill up.',
  },
  'C-06': {
    title: 'Universities under consideration', when: 'February',
    obj: 'To draw up the list of universities the student is considering applying to. Everything else in the year follows from it: which tests to sit, which essays to write, what budget to plan for.',
    carmine: 'A comparison table: requirements, real cost, admission rates, fit with the profile.',
    family: 'Separate perceived prestige from genuine fit. This is often the hardest conversation.',
    methode: [
      'This is not a fallback list, it is the perimeter that governs the rest of the year. Financial modelling (C-07), '
      + 'visits (C-08) and supplemental essays (C-17) have no object until it is settled.',
      'Twenty-five in February to reach twelve or sixteen American, five British and Europe by September (D-03). The '
      + 'asymmetry is what justifies starting wide: adding a university in November costs extra essays and extra '
      + 'deadlines, removing one costs nothing.',
      'February because time is needed: to visit, to attend information sessions, to record demonstrated interest, and '
      + 'to fix what can still be fixed before the summer.',
    ].join('\n'),
    warn: 'The three bands: reaches, where admission stays improbable even with an excellent file; targets, where the '
      + 'profile sits inside the admitted range; and likelies, where admission is close to certain. It is that last '
      + 'band that gets neglected, and it is the one that protects the year: a university belongs there only if the '
      + 'family can genuinely afford it and the student would go without resentment. A list without that floor is not '
      + 'a list, it is a bet.',
  },
  'C-07': {
    title: 'Costs and aid', when: 'March',
    obj: 'To establish, for each university under consideration, the published annual cost and the aid genuinely available to an international applicant — before the list is fixed, not after.',
    carmine: 'For each institution: the published annual cost, its aid policy towards international applicants, and the effect of an aid request on the application.',
    family: 'Give us an honest figure. A strategy built on an optimistic budget falls apart in April.',
    warn: 'A few American universities meet the full demonstrated need of international applicants without the request for aid counting against the application. Every other university takes it into account: asking for aid can cost the place. '
      + 'A word on the net price calculators you will find online: they are built for US residents and, for a French applicant, return either nothing or a wrong figure. We work only from published amounts.',
  },
  'C-08': {
    title: 'Information sessions and contact', when: 'March – June',
    obj: 'To attend the information sessions of the universities in view and make contact with them: this is where the substance of the “why us” essays comes from.',
    carmine: 'The contact log below and the framework of questions that goes with it.',
    questions: [
      'What does a first-year student on this course actually take in the first semester?',
      'From when can an undergraduate join a laboratory or a research project?',
      'When is the specialism chosen, and on what basis?',
      'What sets this department apart from one at a comparable university?',
      'What are graduates of this course doing two years after leaving?',
      'What merit scholarships exist for international applicants, and is a separate application needed?',
      'Does an applicant’s demonstrated interest enter into your admission decision?',
    ],
    family: 'A well-prepared online session beats an expensive trip that goes unused.',
    warn: 'Two separate mechanisms are at work here. The first: a “why us” essay only stands out through specifics — a named '
      + 'course, a laboratory, a professor whose work has been read — and an information session is what supplies them. '
      + 'The second: some universities record demonstrated interest and weigh it in the decision, others explicitly ignore it; '
      + 'their Common Data Set says so plainly. An expensive trip to a university that takes no account of it buys nothing — '
      + 'except the student’s conviction, which is worth something, but costs less online.',
  },
  'C-09': {
    title: 'Approaching teachers for references', when: 'Before the summer break',
    obj: "To approach the two teachers who best know how the student works, early enough for them to write with perspective.",
    carmine: 'The request letter, the summary sheet to hand them, and the follow-up schedule.',
    family: 'Let the student make the request in person, themselves.',
    warn: 'A teacher approached in September writes a generic letter. Approached in May, they write it with perspective and examples.',
  },
  'C-10': {
    title: 'Substantial project — aiming beyond the school', when: 'April – September',
    obj: 'To carry the project already under way to recognition beyond the school: a regional prize, supervised research, a publication, a viable organisation.',
    carmine: 'Monthly support and introductions where they are possible.',
    family: 'Choose a project a single summer can carry to its first result. Misjudged ambition produces nothing you can point to in October.',
    warn: 'April is not a late date; it is what puts the bulk of the work on the summer — the only block of free time before applications. '
      + 'That leaves six months until the first deadlines: enough for a supervised research paper, a competition entry that yields a result, '
      + 'or a documented contribution to an existing organisation. Not enough to found an organisation and demonstrate its impact. '
      + 'A project run in Year 11 could spread; this phase narrows. '
      + 'And it is normally the same work carried further, not a second subject: two shallow projects weigh less than one '
      + 'taken through to recognition. A new one is opened only when the previous is dead.',
    methode: [
      'For a student taken on in Year 12, this is their first project, not their second — B-03 falls outside their '
      + 'scope and is marked not applicable. Never present this milestone as catching up: they have missed nothing '
      + 'that was asked of them.',
      'What separates it from B-03 is ambition, not rank. B-03 teaches a student to finish something; this one aims '
      + 'at recognition outside the school — a jury, a review panel, or a real audience.',
      'Calibrate on six months, not on the ambition the student announces. A project with no first result by October '
      + 'will appear nowhere in the file.',
      'How many projects: one, if it lands. Two unrelated subjects cancel each other out — an admissions reader looks '
      + 'for coherence, not a portfolio. A paper, a competition won and an organisation built around the same subject, '
      + 'on the other hand, are not three projects but one spike with three proofs: those reinforce each other.',
      'Do not mistake the apex for the file. The activities list has ten lines: alongside the project there must be '
      + 'commitments held over time and a position of responsibility somewhere. That is B-02 work, not this milestone.',
      'Finally, the safety net. A project sometimes dies — the supervisor withdraws, the competition is cancelled, the '
      + 'result never comes. A student followed since Year 11 has time to recover; one who arrived in Year 12 does not. '
      + 'For them, prefer a narrow scope certain to land over a second undertaking.',
    ].join('\n'),
  },
  'C-11': {
    title: 'English certification', when: 'June – July',
    obj: 'To sit the IELTS or TOEFL at the right moment: the score is valid for two years only, and sitting it too early lets it expire before the application.',
    carmine: 'Requirements checked university by university, and targeted preparation.',
    family: 'Do not sit it before Year 12.',
    methode: [
      'Orders of magnitude, to be confirmed university by university. At the top: IELTS 7.0 to 7.5, TOEFL 100 to 110. '
      + 'Less selective courses: IELTS 6.5, TOEFL 90. Oxford asks 7.0 at standard level and 7.5 at higher level; '
      + 'Cambridge sits around 7.5.',
      'The trap is not the overall score but the per-section minima. An overall 7.0 with 6.0 in writing is refused '
      + 'wherever 6.5 per section is required. Check all four sections, not the average.',
      'The waiver exists and is often missed. Many American universities drop the requirement if the student has been '
      + 'schooled for several years in an English-taught curriculum, or if their SAT reading and writing score clears a '
      + 'threshold. A student from an international section or an English-speaking school sometimes has nothing to sit — '
      + 'check before billing for preparation.',
      'The exact requirement for each course is in the reference table, column “language requirement”. It shifts every '
      + 'year: never quote it to a family from memory.',
    ].join('\n'),
    warn: 'IELTS and TOEFL are valid for two years only. Taken in Year 11, they expire before the university term begins.',
  },
  'C-12': {
    title: 'Second SAT or ACT sitting', when: 'June or August',
    obj: 'To consolidate the score: the average gain between two prepared sittings is sixty to a hundred and twenty points.',
    carmine: 'Comparative analysis and the decision on whether a third sitting is worthwhile.',
  },
  'C-13': {
    title: 'Registering for UK admissions tests', when: 'Mid-June to late September',
    obj: 'To register for the test required by the course in view: MAT, PAT, TMUA, ESAT, UCAT or LNAT depending on the subject.',
    carmine: 'A personal schedule, registration verified, and proof of it filed.',
    family: 'Send us the registration confirmation as soon as you receive it.',
    warn: 'This is the leading cause of mechanical failure in a British application. A missed registration voids the application, with no appeal and no resit.',
    methode: [
      'Three separate windows, to be checked in June as they shift every cycle. The UCAT opens earliest — registration '
      + 'around mid-May, booking from June, sat between July and late September — and its slots run out. The MAT, PAT, '
      + 'TMUA and ESAT are registered between late August and late September for a late-October sitting. The LNAT opens '
      + 'in early September, but Oxford requires it to be sat by mid-October.',
      'The real friction is not the date but the centre. Registration goes through an approved test centre, and a '
      + 'French school abroad is not always one. Identify the centre and book the seat before working on preparation: '
      + 'a registration made impossible for want of a centre is discovered too late.',
      'File the registration proof as soon as it arrives, in this milestone documents. In any dispute with a centre or '
      + 'a university, it is the only thing that counts.',
      'A student applying to two courses may face two papers: check each UCAS choice separately, not just the first.',
    ].join('\n'),
  },
  'C-14': {
    title: 'Preparing for the MAT, TMUA, UCAT or LNAT', when: 'July – October',
    obj: 'To prepare the paper required by the course in view — MAT, PAT, TMUA, ESAT, UCAT or LNAT — a format with no equivalent in the French system: open problems under severe time pressure.',
    carmine: 'An eight to twelve week plan, worked past papers and timed simulations.',
    family: 'Build this into the summer. These papers cannot be prepared in two weekends.',
    methode: [
      'Which test for which course: MAT for mathematics at Oxford and Imperial, TMUA at Cambridge and in several '
      + 'economics departments, PAT for physics and engineering at Oxford, ESAT for sciences and engineering at '
      + 'Cambridge, UCAT for medicine and dentistry, LNAT for law. A student applying to two different courses may have '
      + 'two papers to prepare.',
      'These are not knowledge tests but reasoning tests on a deliberately narrow syllabus. A student who excels in '
      + 'continuous assessment can collapse on them: they have never met a problem without a taught method. That gap is '
      + 'what to work on, not the syllabus.',
      'Eight to twelve weeks, timed past papers from the second week onwards, and marking on the reasoning rather than '
      + 'the answer — several of these papers credit written working.',
      'Two calendars, and this is the commonest confusion. The UCAT alone comes before the application: booking from '
      + 'June, sat between July and late September, score submitted with the 15 October application. Six to eight weeks '
      + 'of preparation, so starting in May or June — and slots run out.',
      'The MAT, PAT, TMUA and ESAT are sat in late October, that is AFTER the 15 October UCAS submission. You apply '
      + 'first and are tested afterwards. Eight to twelve weeks of preparation from July, which is what fixes this '
      + 'milestone.',
      'The LNAT sits in between: open from September, but Oxford requires it by mid-October while other faculties '
      + 'accept it into January. It includes an essay almost nobody prepares, and which is read.',
      'These windows shift every cycle and registration goes through an approved centre: check them in June, not in '
      + 'September. That is what C-13 is for, and why it is marked unrecoverable.',
    ].join('\n'),
  },
  'C-15': {
    title: 'Writing the personal statement', when: 'July – August',
    obj: "To answer UCAS's three structured questions in four thousand characters, with no repetition between sections.",
    carmine: 'Four to six annotated drafts, from outline to final text.',
    family: 'Let the student write. A text rewritten by an adult shows in the first sentence.',
    warn: 'This single text serves all five choices. If the five courses share no common discipline it becomes impossible to write — the list must be built with that constraint in mind.',
  },
  'C-16': {
    title: 'Writing the main essay', when: 'July – August',
    obj: 'To write the six hundred and fifty words of the Common App personal essay — the single application shared by more than a thousand American universities, and the one place where the student speaks for themselves.',
    carmine: 'Five to eight annotated drafts, from raw material through to the final version.',
    family: 'Accept unexpected subjects: a failure, a tiny obsession, often say more than an account of success.',
    warn: 'The most common mistake is the essay as narrated CV, repeating what the file already says.',
  },
  'C-17': {
    title: 'Supplemental essays for early applications', when: 'August',
    obj: 'To write the essays specific to each university applied to early, including the familiar "why us".',
    carmine: 'An essay bank managed in waves, with considered reuse.',
    family: 'Protect August. It is the only time this work is possible without grades suffering.',
  },
  'C-18': {
    title: 'Progress meeting with parents', when: 'July',
    obj: 'To confirm the state of the file before the application year and set out the calendar ahead.',
    carmine: 'A written review and a detailed calendar for the next twelve months.',
  },
  'D-01': { title: 'US application opens', when: '1 August',
    obj: 'To create the Common App — the single application shared by more than a thousand American universities — and carry over the data prepared last year.',
    carmine: 'A full check of everything entered before anything is submitted.',
    family: 'Let the student create the account in their own name, on a lasting email address — not the school one, which closes at the end of the year. Your part is the application fees and, later, the aid applications.',
    warn: 'The account belongs to the student and to no one else. All correspondence from universities arrives there: an account held by a parent means missed deadlines, and the personal essay loses its point if it is not written by the person signing it. Parents have no account of their own on the Common App, unlike recommenders, who do.' },
  'D-02': { title: 'UCAS application opens', when: 'Early September',
    obj: 'To create the UCAS application — the national platform through which every British undergraduate application passes — and link it to the school, without which the reference cannot be sent.',
    carmine: 'Verification of the school link and of the qualifications entered.',
    family: 'As with the American application, the account is the student’s, on a lasting address. We will need the school link code, which the school provides.',
    warn: 'Five choices at most, and a single personal statement for all five: no university sees the others, but the text has to work for each of them. Applying to distant subjects therefore rules out writing a convincing one. And without the school link the reference is never sent — it is that link, not the data entry, that most often blocks applications in October.' },
  'D-03': { title: 'Final university list', when: 'September',
    obj: 'To settle the list for good: twelve to sixteen in the US, five in the UK, plus European applications.',
    carmine: 'A locked table giving, for each institution, the deadline, the test required and the documents needed.' },
  'D-04': { title: 'Activities and honours list', when: 'September',
    obj: 'To phrase the activities and honours in the Common App fields: ten activity lines at most, five honours, a hundred and fifty characters to describe each — a writing exercise in its own right.',
    carmine: 'Every line ranked and reworded.',
    family: 'Help the student remember what they never think to mention: a summer job, a responsibility at home, something practised since childhood. Students almost always under-report.',
    warn: 'Ten is a ceiling, not a target. Five solid lines weigh more than a list of ten with half of it padding: filler is spotted at once, and every weak line undermines the ones around it. You enter what you have; you do not invent what is missing. Order matters too — the first line is read, the tenth sometimes is not.' },
  'D-05': {
    title: 'Signing the FERPA release', when: 'Before any letter is requested',
    obj: 'To waive the right to read one’s own letters of recommendation, a precondition for approaching anyone.',
    carmine: 'The choice explained, and confirmation that the signature is registered before invitations go out.',
    family: 'Waiving this right is the student’s choice, never an obligation — but a letter the student can read carries less weight with readers, who know it.',
    warn: 'A purely administrative step, regularly forgotten. Until it is signed, no teacher or school officer can submit anything.',
    methode: [
      'The choice can no longer be changed once the first invitation has gone out. It is the only genuinely '
      + 'irreversible point of this milestone: check it before, not after.',
      'Where to find it, asked on every file: the section only appears in the Common App once at least one university '
      + 'has been added to the list. A student looking for it earlier will not find it and will assume a bug.',
      'The argument for parents, since “waiving a right” alarms them. Waiving is the norm, and an admissions reader '
      + 'who sees a letter not covered by the waiver reads it as written under supervision — it loses its value. Many '
      + 'American teachers decline to write without it. And the parent has no right of access in any case: the right '
      + 'belongs to the student, not the family.',
      'Do not sign on the student’s behalf, or from their account. The signature carries their declaration; one '
      + 'affixed by a third party is a false statement on an American application.',
    ].join('\n'),
  },
  'D-06': {
    title: 'Predicted grades and school reference', when: 'Before 1 October',
    obj: 'To obtain predicted grades consistent with the requirements in view, and a structured reference.',
    carmine: 'The request letter to the head, a reference framework in the current format, and follow-up until it is in hand.',
    family: 'Approach the school early: the workload is heavy and covers several students at once.',
    warn: 'Predictions set too low make the application inadmissible; unrealistic ones undermine the school’s credibility. The balance is negotiated in advance.',
  },
  'D-07': {
    title: 'Documents submitted by the school', when: 'October – November',
    obj: 'To have the school submit everything outside the student’s control: transcript, school report and profile, counsellor letter, two teacher evaluations.',
    carmine: 'Coordination with the school, translation of the academic record, and drafting of the school profile where none exists.',
    family: 'Warn the school from the start of term: these documents are numerous and largely unknown in French lycées.',
    warn: 'A French lycée generally has neither a school profile nor a counsellor in the American sense. These documents must be built from scratch — several weeks of work to be started in September.',
  },
  'D-08': {
    title: 'Oxford, Cambridge and medicine deadline', when: '15 October, 6pm UK time',
    obj: 'To submit the UCAS application for Oxford or Cambridge, medicine, dentistry and veterinary science.',
    carmine: 'A full read-through of the application and the submission receipt filed.',
    family: 'Plan nothing else that week.',
    warn: 'No latitude whatsoever, down to the minute. Oxford and Cambridge cannot both be applied to in the same year.',
  },
  'D-09': {
    title: 'My Cambridge Application', when: '22 October, 6pm UK time',
    obj: 'To complete the form specific to Cambridge, required in addition to the UCAS application and under its own separate deadline.',
    carmine: 'Answers prepared, written work selected, and the requirements of the chosen college checked.',
    family: 'Do not relax after 15 October: a second deadline follows immediately.',
    warn: 'Formerly the SAQ. Cambridge no longer retrieves anything uploaded to UCAS: everything the university needs to read goes through this form or the college.',
  },
  'D-10': { title: 'Sitting the admissions tests', when: 'Late October',
    obj: 'To sit the paper within the fixed window. Only the autumn session counts for Oxford and Cambridge.',
    carmine: 'Final preparation and test-centre logistics.' },
  'D-11': {
    title: 'Written work', when: 'Early November',
    obj: 'To submit the marked classwork required by certain Oxford and Cambridge courses, mainly in arts and humanities.',
    carmine: 'The most revealing pieces selected, and the format required by each college checked.',
    family: 'Keep marked work from the final two years: it is asked for exactly as it is, teacher’s corrections included.',
  },
  'D-12': {
    title: 'Early application deadlines', when: '1 November',
    obj: 'To submit early applications, where admission rates are often two to three times those of the regular round.',
    carmine: 'Each application read through and every receipt filed.',
    family: 'Understand the commitment: a binding early application obliges the student to enrol if admitted.',
    warn: 'Committing before knowing the size of the financial aid award is a trap for any family that depends on it. That decision is made in September, not October.',
  },
  'D-13': { title: 'University of California application', when: '1 – 30 November',
    obj: 'To submit the application common to the California campuses, with four specific essays through a separate portal.',
    carmine: 'Support with the four essays, which are very different from the main one.' },
  'D-14': {
    title: 'Arts portfolios and athletic recruitment', when: 'October – December',
    obj: 'To assemble what falls outside the standard file: portfolio, audition recording, athletic footage, academic eligibility file.',
    carmine: 'The portfolio scoped, a recording schedule, and introductions to coaches where the athletic route is open.',
    family: 'Start months ahead: a demanding audition recording is prepared like a competition.',
    warn: 'The American athletic route runs on its own calendar, well ahead of the standard file, and requires a separate academic eligibility file.',
  },
  'D-15': {
    title: 'Interview preparation', when: 'November',
    obj: 'To prepare for a format that is not a motivational interview but a miniature tutorial: reasoning aloud in front of an unfamiliar problem.',
    carmine: 'Four to six mock interviews with subject specialists, each followed by a written debrief.',
    family: 'Set aside evening slots. These sessions are demanding and spread over a month.',
  },
  'D-16': { title: 'Oxford and Cambridge interviews', when: 'Early December',
    obj: 'To practise reasoning aloud on an unfamiliar problem, then sit the interviews: this is where the place is decided, the file having only opened the door.',
    carmine: 'Logistics, last-hour preparation and the debrief.' },
  'D-17': {
    title: 'Alumni interviews', when: 'November – February',
    obj: 'To take the interviews offered by alumni networks, usually remote, optional but never neutral.',
    carmine: 'Three mock interviews and a preparation framework per university.',
    family: 'Reply within twenty-four hours to any interview offer: slots close quickly.',
  },
  'D-18': {
    title: 'Early application results', when: 'Mid-December',
    obj: 'To read the decision, then rework the regular round straight away: the next deadlines fall within a fortnight.',
    carmine: 'An analysis note and immediate revision of the strategy according to the outcome.',
    family: 'If the offer is binding, all other applications must be withdrawn within forty-eight hours.',
  },
  'D-19': { title: 'Regular round deadlines', when: '1 – 5 January',
    obj: 'To submit all remaining applications, each with its own supplemental essays.',
    carmine: 'The second wave of essays and a read-through of every application.' },
  'D-20': { title: 'Main UCAS deadline', when: 'Mid-January, 6pm UK time',
    obj: 'To file the application for the remaining British universities: five choices in all, and none of them sees the others.',
    carmine: 'A final read-through and the receipt filed.' },
  'D-21': {
    title: 'Netherlands and Sweden', when: '15 January',
    obj: 'To file the Dutch capped-place and Swedish applications: these courses close months before the rest.',
    carmine: 'The file assembled and February’s decentralised selection prepared.',
    warn: 'Dutch programmes without capped places fall under a second deadline, on 1 May. Confusing the two costs a year.',
  },
  'D-22': {
    title: 'Parcoursup choices', when: 'Mid-January to March',
    obj: 'To secure a high-level French route, compatible with the international applications.',
    carmine: 'Choices built, motivation statements written, and the whole articulated with the rest of the calendar.',
    warn: 'The French calendar overlaps the British and American deadlines. December and January carry most of the year’s load.',
  },
  'D-23': {
    title: 'Financial aid applications', when: 'January – February',
    obj: 'To file aid applications on time, failing which the aid is lost even where admission is granted.',
    carmine: 'Support with completion, which is particularly detailed for non-resident families.',
    family: 'Gather tax assessments and evidence of income and assets in advance.',
  },
  'D-24': { title: 'Ireland', when: '1 February',
    obj: 'To apply through the Irish national portal, whose deadline falls markedly earlier than the others.',
    carmine: 'Conversion of the baccalauréat to the Irish points scale and follow-up of the application.' },
  'D-25': {
    title: 'Mid-year report', when: 'February',
    obj: 'To have the school send first-term final-year grades, required by almost every American university.',
    carmine: 'The reminder to the school and confirmation of transmission, application by application.',
    warn: 'A drop in final-year results can lead to an offer already made being withdrawn. This is not theoretical: it happens every year.',
  },
  'D-26': {
    title: 'Letters of continued interest', when: 'February – April',
    obj: 'To follow up usefully with universities that have deferred a decision or placed the application on a waiting list.',
    carmine: 'A letter tailored to each university, resting on genuinely new material.',
    warn: 'A follow-up with nothing new does more harm than good. One letter per university, no more.',
  },
  'D-27': { title: 'Switzerland', when: 'Late April',
    obj: 'To file the Swiss federal institute application, where admission rests on diploma conditions rather than on a file to argue.',
    carmine: 'Verification of qualification recognition conditions, which are reassessed each year.' },
  'D-28': { title: 'Results and aid awards', when: 'Mid-March to 1 April',
    obj: 'To gather the decisions and the detail of the aid awarded: this is what reveals the real net cost, and turns the list into a choice.',
    carmine: 'A comparison table of the real net cost per university.' },
  'D-29': {
    title: 'Weighing offers and appealing aid', when: 'April',
    obj: 'To compare offers on real net cost, and to ask for an award to be reviewed where the circumstances justify it.',
    carmine: 'A costed decision note and the drafting of the review request.',
  },
  'D-30': { title: 'Final decision', when: '1 May',
    obj: 'To pay the deposit to the chosen university: that act, and only that act, secures the place.',
    carmine: 'Verification of the arrangements and follow-through on withdrawals elsewhere.' },
  'D-31': { title: 'Firm and insurance choices', when: 'May – June',
    obj: 'To settle on a firm offer and an insurance offer, whose grade conditions must be genuinely attainable.',
    carmine: 'Analysis of the conditions and a recommendation.' },
  'D-32': { title: 'Netherlands — second deadline', when: '1 May',
    obj: 'To file the Dutch applications outside the capped-place courses, whose deadline falls later than the first wave.',
    carmine: 'Verification of mathematics requirements, which are often decisive.' },
  'D-33': { title: 'Baccalauréat examinations', when: 'June',
    obj: 'To achieve the grades on which the offers depend.',
    carmine: 'Conditions tracked and a fallback plan prepared should one not be met.' },
  'D-34': {
    title: 'Results day and UK clearing', when: 'July – August',
    obj: 'To confirm the offer against the results, or move to clearing if a condition is not met.',
    carmine: 'Cover on results day: immediate analysis, universities contacted, decisions taken within hours.',
    family: 'Be reachable that day, wherever you are. Places go within hours.',
    warn: 'Adjustment for better-than-expected results no longer exists. Self-releasing to aim higher is now irreversible: the original place is lost the moment it is released.',
  },
  'E-01': {
    title: 'Official admission document', when: 'May – July',
    obj: 'To obtain the document issued by the university — the American certificate of eligibility or the British confirmation of acceptance — without which no visa application can be lodged.',
    carmine: 'A line-by-line check: exact spelling of the name, dates, amounts, course title.',
    family: 'Report any error immediately, however minor.',
    warn: 'Any divergence between passport and admission document blocks the consular appointment, and correcting it takes weeks.',
  },
  'E-02': {
    title: 'ATAS clearance for certain science courses', when: 'As soon as the offer is firm',
    obj: 'To obtain the clearance required for a range of sensitive science and engineering courses, a precondition for the visa.',
    carmine: 'Verification of whether the course is caught, and follow-up of the application.',
    warn: 'Processing times are long and variable. A course that is caught plus a late application costs the term, even though the offer is secure.',
  },
  'E-03': {
    title: 'Visa application', when: 'As soon as the admission document arrives',
    obj: 'To obtain the student visa within consular timescales that lengthen sharply over the summer.',
    carmine: 'The document list country by country, preparation for the consular interview, and follow-up until issue.',
    family: 'Book the appointment as soon as slots open, before you have gathered every document.',
    warn: 'A strict chain of dependencies: deposit paid, then admission document issued, then fees and surcharges settled, then the online form, then the appointment. Allow also for the proof of funds required over a minimum period, and the tuberculosis test imposed depending on country of residence.',
  },
  'E-04': { title: 'Accommodation', when: 'May – July',
    obj: 'To file housing applications as soon as the offer arrives: halls often fill up before the visa is even granted.',
    carmine: 'A comparison of the options and support with applications, guarantor included.' },
  'E-05': { title: 'Settling-in formalities', when: 'July – August',
    obj: 'To settle health insurance — mandatory and expensive in the United States — the bank account and the phone.',
    carmine: 'A dated checklist, country by country.' },
  'E-06': { title: 'Course selection and placement tests', when: 'August',
    obj: 'To build a sustainable first semester: course choices shape the first-year average.',
    carmine: 'Advice on selection and preparation for placement tests.' },
  'E-07': { title: 'End-of-engagement review', when: 'September',
    obj: 'To close the engagement and open access to the alumni network.',
    carmine: 'A written review and introductions to students already on the ground.' },
};
