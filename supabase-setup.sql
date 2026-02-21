-- ============================================
-- Carmine Admission — Blog Personalization
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create table
CREATE TABLE carmine_content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug text NOT NULL,
  block_key text NOT NULL,
  origin_school text,
  target_school text,
  content_fr text NOT NULL,
  content_en text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(article_slug, block_key, origin_school, target_school)
);

-- 2. Enable RLS (read-only for anon)
ALTER TABLE carmine_content_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON carmine_content_blocks
  FOR SELECT TO anon USING (true);

-- ============================================
-- 3. Sample data — Article: Jeanine Manuel
-- ============================================

-- Transition advice: LF Dubai → EJM (exact match)
INSERT INTO carmine_content_blocks (article_slug, block_key, origin_school, target_school, content_fr)
VALUES (
  'integrer-jeanine-manuel-retour-expatriation',
  'transition-advice',
  'lf-dubai',
  'ejm',
  '<h2>Preparer la transition depuis le LFI Dubai vers l''EJM</h2>
<p>En venant du Lycee Francais International de Dubai, votre enfant a l''avantage du bilinguisme et du programme francais AEFE. Les points d''attention specifiques :</p>
<ul>
  <li><strong>Le francais litteraire</strong> : le niveau de francais academique au LFI Dubai est souvent legerement en dessous des attentes de l''EJM, en particulier en dissertation et commentaire compose. Un renforcement cible est recommande.</li>
  <li><strong>L''anglais</strong> : les eleves du LFI Dubai ont generalement un bon niveau d''anglais grace a l''environnement, mais l''EJM attend un bilinguisme structure, pas seulement conversationnel. La capacite a analyser des textes litteraires en anglais est evaluee.</li>
  <li><strong>Les mathematiques</strong> : le programme AEFE est aligne, mais le rythme de l''EJM est soutenu. Verifiez que le niveau de votre enfant correspond au premier tiers de sa classe.</li>
</ul>
<p>Les bulletins du LFI Dubai sont directement lisibles par l''EJM, ce qui simplifie la constitution du dossier. Attention cependant : un 15/20 au LFI Dubai n''est pas automatiquement equivalent a un 15/20 dans un lycee parisien. L''EJM calibre son evaluation.</p>'
);

-- Transition advice: LF Londres → EJM (exact match)
INSERT INTO carmine_content_blocks (article_slug, block_key, origin_school, target_school, content_fr)
VALUES (
  'integrer-jeanine-manuel-retour-expatriation',
  'transition-advice',
  'lf-londres',
  'ejm',
  '<h2>Preparer la transition depuis le Lycee Charles de Gaulle vers l''EJM</h2>
<p>Le Lycee Charles de Gaulle a Londres prepare bien au systeme francais, mais l''EJM attend un bilinguisme plus pousse que ce que le cursus londonien offre en standard.</p>
<ul>
  <li><strong>Atout majeur</strong> : l''immersion londonienne donne souvent un anglais solide. Si votre enfant a profite de l''environnement pour developper un anglais academique (pas seulement social), c''est un avantage reel pour l''EJM.</li>
  <li><strong>Point d''attention</strong> : le Lycee Charles de Gaulle suit le programme francais strict. Les eleves sont generalement bien prepares academiquement, mais le format des tests EJM inclut des exercices specifiques en anglais litteraire qui ne font pas partie du cursus AEFE standard.</li>
  <li><strong>Mathematiques</strong> : bonne continuite avec le programme francais. Les eleves du Charles de Gaulle ont rarement des lacunes dans cette matiere.</li>
</ul>
<p>Le profil "AEFE Londres" est bien connu de l''EJM et generalement favorablement percu. La cle est de demonstrer que le bilinguisme va au-dela du cours de LV1.</p>'
);

-- Transition advice: Ecole IB → EJM (exact match)
INSERT INTO carmine_content_blocks (article_slug, block_key, origin_school, target_school, content_fr)
VALUES (
  'integrer-jeanine-manuel-retour-expatriation',
  'transition-advice',
  'ecole-ib',
  'ejm',
  '<h2>Preparer la transition depuis une ecole IB vers l''EJM</h2>
<p>Si votre enfant vient d''une ecole internationale suivant le programme IB (MYP ou Diploma), le passage vers le systeme francais de l''EJM demande une preparation specifique.</p>
<ul>
  <li><strong>Mathematiques</strong> : c''est le point critique. Le programme francais est nettement plus avance que le MYP en algebre, geometrie et demonstration. Un eleve en MYP 4-5 peut avoir deux ans de retard sur le programme francais de 3eme-seconde. Une mise a niveau intensive est indispensable.</li>
  <li><strong>Francais academique</strong> : si votre enfant a suivi un cursus principalement en anglais, le francais ecrit (dissertation, commentaire) sera le principal defi. L''EJM evalue ce niveau tres precisement aux tests d''entree.</li>
  <li><strong>Atout IB</strong> : la culture internationale et l''habitude du travail en anglais sont des points forts pour l''EJM. Le profil "ex-IB bilingue" est valorise, a condition que le niveau en francais et en maths soit au rendez-vous.</li>
</ul>
<p>Prevoyez au minimum 6 mois de preparation specifique en mathematiques (programme francais) et en francais academique avant les tests de l''EJM.</p>'
);

-- Curriculum bridge: fallback target=ejm (no specific origin)
INSERT INTO carmine_content_blocks (article_slug, block_key, origin_school, target_school, content_fr)
VALUES (
  'integrer-jeanine-manuel-retour-expatriation',
  'curriculum-bridge',
  NULL,
  'ejm',
  '<h2>Constituer un dossier solide pour l''EJM</h2>
<p>L''EJM propose le BFI depuis 2022. Les eleves integrant en seconde doivent etre prets a suivre un cursus bilingue exigeant des la rentree. Voici comment preparer votre dossier :</p>
<h3>Les bulletins scolaires</h3>
<p>Rassemblez les bulletins des trois dernieres annees. Si les notes sont dans un systeme different (lettres, pourcentages, IB), ajoutez une note d''equivalence. L''EJM a l''habitude de lire des bulletins internationaux, mais facilitez-leur le travail.</p>
<h3>La lettre de motivation</h3>
<p>L''EJM cherche des eleves qui s''inscrivent dans sa mission de comprehension internationale. Votre enfant doit expliquer concretement ce que l''expatriation lui a apporte et pourquoi l''EJM est le bon environnement pour la suite — pas un lycee interchangeable.</p>
<h3>La preparation aux tests</h3>
<p>Les tests portent sur le programme francais. Identifiez les ecarts entre le cursus actuel de votre enfant et le programme francais, et comblez-les avant les tests. En mathematiques, concentrez-vous sur les demonstrations et le formalisme francais. En francais, travaillez la dissertation et le commentaire compose.</p>'
);

-- ============================================
-- 4. Sample data — Article: EJM/Franklin/Saint-Germain
-- ============================================

-- School recommendation: LF Dubai → EJM
INSERT INTO carmine_content_blocks (article_slug, block_key, origin_school, target_school, content_fr)
VALUES (
  'ejm-franklin-saint-germain-choisir-lycee-expat',
  'school-recommendation',
  'lf-dubai',
  'ejm',
  '<h2>Notre recommandation pour votre profil LFI Dubai → EJM</h2>
<p>En venant du Lycee Francais International de Dubai et en ciblant l''EJM, votre enfant a un profil coherent. Voici les points cles :</p>
<ul>
  <li><strong>Compatibilite forte</strong> : le programme AEFE du LFI Dubai aligne bien avec les attentes academiques de l''EJM. La continuite pedagogique est la plus fluide des trois options (EJM, Franklin, Saint-Germain).</li>
  <li><strong>Le bilinguisme a prouver</strong> : l''EJM n''acceptera pas un bon niveau de LV1 comme preuve de bilinguisme. Si votre enfant n''a pas eu d''immersion anglophone significative a Dubai (ecole bilingue, activites en anglais), renforcez l''anglais academique avant les tests.</li>
  <li><strong>Alternative a considerer</strong> : si votre enfant est plus scientifique que litteraire et vise la France en post-bac, le Lycee International de Saint-Germain-en-Laye peut etre un choix plus strategique pour les prepas.</li>
</ul>'
);

-- School recommendation: fallback → Saint-Germain
INSERT INTO carmine_content_blocks (article_slug, block_key, origin_school, target_school, content_fr)
VALUES (
  'ejm-franklin-saint-germain-choisir-lycee-expat',
  'school-recommendation',
  NULL,
  'saint-germain',
  '<h2>Ce qu''il faut savoir pour cibler Saint-Germain-en-Laye</h2>
<p>Le Lycee International de Saint-Germain-en-Laye est le choix le plus strategique si vous visez les filieres francaises d''excellence (prepas, Sciences Po). Voici les criteres specifiques a votre situation :</p>
<ul>
  <li><strong>Admission via les associations de section</strong> : le processus passe par l''association de la section visee (americaine, britannique, etc.), pas directement par le lycee. Contactez l''association des que possible — les calendriers varient.</li>
  <li><strong>Le cadre public</strong> : gratuite de la scolarite (hors contribution a l''association), ce qui est un avantage considerable par rapport a l''EJM ou Franklin.</li>
  <li><strong>La localisation</strong> : si vous vous installez dans Paris intra-muros, le trajet quotidien vers Saint-Germain (40+ min en RER A) peut etre un frein reel pour un adolescent.</li>
  <li><strong>Le BFI de Saint-Germain</strong> : parfaitement reconnu en France et a l''international. Les sections americaine et britannique sont les plus demandees et les plus competitives.</li>
</ul>'
);

-- ============================================
-- 5. Sample data — Article: Retour expatriation erreurs
-- ============================================

-- Timing advice: ecole-ib → ejm
INSERT INTO carmine_content_blocks (article_slug, block_key, origin_school, target_school, content_fr)
VALUES (
  'retour-expatriation-erreurs-orientation',
  'timing-advice',
  'ecole-ib',
  'ejm',
  '<h2>Le timing ideal pour passer d''une ecole IB a l''EJM</h2>
<p>Le passage d''un cursus IB (MYP) vers l''EJM est plus complexe qu''un transfert AEFE. Le timing est donc encore plus critique :</p>
<ul>
  <li><strong>Scenario optimal</strong> : retour en fin de 4eme pour une entree en 3eme. Cela donne une annee complete pour se mettre a niveau sur le programme francais (mathematiques, francais academique) avant les choix de specialites en seconde.</li>
  <li><strong>Scenario risque</strong> : retour en seconde. L''eleve IB devra s''adapter simultanement au systeme francais, au rythme de l''EJM, et aux choix de specialites. C''est faisable, mais demande une preparation intensive en amont.</li>
  <li><strong>Preparation recommandee</strong> : commencez la mise a niveau en mathematiques (programme francais) et en francais ecrit au moins 9 mois avant l''entree visee. Les tests de l''EJM sont sur le programme francais, pas sur le MYP.</li>
</ul>'
);

-- Integration tips: fallback → ejm
INSERT INTO carmine_content_blocks (article_slug, block_key, origin_school, target_school, content_fr)
VALUES (
  'retour-expatriation-erreurs-orientation',
  'integration-tips',
  NULL,
  'ejm',
  '<h2>Le dossier d''integration EJM : ne pas sous-estimer le processus</h2>
<p>L''EJM est l''un des etablissements les plus selectifs de la region parisienne. Le processus d''admission est un veritable concours :</p>
<ul>
  <li><strong>Calendrier</strong> : inscriptions en ligne des octobre-novembre pour la rentree suivante. Les familles qui attendent janvier se retrouvent souvent sur liste d''attente.</li>
  <li><strong>Tests</strong> : francais (dissertation ou commentaire selon le niveau), anglais (comprehension et expression ecrite litteraire), mathematiques (programme francais). Les tests sont discriminants, pas diagnostiques.</li>
  <li><strong>Taux d''admission</strong> : inferieur a 20% pour les entrees en cours de scolarite. Prevoyez systematiquement Franklin et Saint-Germain comme alternatives.</li>
  <li><strong>Entretien</strong> : en francais ET en anglais. Preparez votre enfant a parler de son parcours de maniere structuree et authentique.</li>
</ul>'
);
