/**
 * Accès aux données du moteur de pilotage.
 *
 * Reprend le client Supabase du site. Lit les tables existantes, écrit dans
 * les tables du moteur. Ne touche jamais à carmine_student_milestones : c'est
 * l'ancien portail qui la tient, jusqu'à la bascule.
 */
import supabase from '../supabase.js';
import { MILESTONES } from '../portail/milestones.js';
import { genererTaches, cle } from './generateur.js';

export { supabase };

/* ── Session ─────────────────────────────────────────────────── */

export async function getProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('carmine_profiles')
    .select('id, email, full_name, role')
    .eq('id', session.user.id)
    .single();
  if (error) return { id: session.user.id, email: session.user.email, role: 'parent' };
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/';
}

/* ── Universités ─────────────────────────────────────────────── */

export async function listUniversites() {
  const { data, error } = await supabase
    .from('carmine_universites')
    .select('id, pays, etablissement, cursus, nature, filiere, domaine, source, millesime, fiche_recherchee_le, note_fiche')
    .order('pays').order('etablissement').order('cursus');
  if (error) throw error;
  return data ?? [];
}

export async function getUniversite(id) {
  const { data, error } = await supabase
    .from('carmine_universites').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function updateUniversite(id, fields) {
  const { error } = await supabase.from('carmine_universites').update(fields).eq('id', id);
  if (error) throw error;
}

/** Nombre d'exigences par université et par statut, en une requête. */
export async function compteExigences() {
  const { data, error } = await supabase
    .from('carmine_exigences_universite')
    .select('universite_id, statut');
  if (error) throw error;
  const parUniversite = {};
  for (const row of data ?? []) {
    const c = (parUniversite[row.universite_id] ??= { brouillon: 0, validee: 0, perimee: 0, rejetee: 0 });
    c[row.statut] = (c[row.statut] ?? 0) + 1;
  }
  return parUniversite;
}

/* ── Exigences ───────────────────────────────────────────────── */

export async function listExigences(universiteId) {
  const { data, error } = await supabase
    .from('carmine_exigences_universite')
    .select('*')
    .eq('universite_id', universiteId)
    .order('y', { nullsFirst: true }).order('m', { nullsFirst: true }).order('d', { nullsFirst: true })
    .order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function updateExigence(id, fields) {
  const { error } = await supabase.from('carmine_exigences_universite').update(fields).eq('id', id);
  if (error) throw error;
}

export async function ajouterExigence(fields) {
  const { data, error } = await supabase
    .from('carmine_exigences_universite').insert(fields).select().single();
  if (error) throw error;
  return data;
}

export async function supprimerExigence(id) {
  const { error } = await supabase.from('carmine_exigences_universite').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Lance la recherche IA. Longue : une à trois minutes. La fonction remplace
 * les brouillons de l'université, jamais les lignes validées.
 */
export async function lancerFiche(params) {
  const { data, error } = await supabase.functions.invoke('fiche-universite', { body: params });
  if (error) {
    // L'erreur HTTP porte le corps JSON de la fonction, quand il existe.
    let detail = error.message;
    try {
      const corps = await error.context?.json?.();
      if (corps?.error) detail = corps.error;
    } catch { /* corps illisible */ }
    throw new Error(detail);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

/* ── Dossiers ────────────────────────────────────────────────── */

export async function listStudents() {
  const { data, error } = await supabase
    .from('carmine_students').select('*').eq('archived', false).order('last_name');
  if (error) throw error;
  return data ?? [];
}

export async function getStudent(id) {
  const { data, error } = await supabase.from('carmine_students').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function updateStudent(id, fields) {
  const { error } = await supabase.from('carmine_students').update(fields).eq('id', id);
  if (error) throw error;
}

/** Cibles d'un dossier avec leur université. Table partagée avec l'ancien portail, colonnes additives. */
export async function listCibles(studentId) {
  const { data, error } = await supabase
    .from('carmine_cibles_eleve')
    .select('student_id, universite_id, verdict, ordre, retenue, tour, decision, decision_le, offre, offre_le, carmine_universites(id, pays, etablissement, cursus, filiere, domaine)')
    .eq('student_id', studentId)
    .order('ordre');
  if (error) throw error;
  return (data ?? []).filter((c) => c.carmine_universites)
    .map((c) => ({ ...c, universite: c.carmine_universites }));
}

export async function addCible(studentId, universiteId, ordre = 0) {
  const { error } = await supabase
    .from('carmine_cibles_eleve')
    .insert({ student_id: studentId, universite_id: universiteId, ordre });
  if (error) throw error;
}

export async function updateCible(studentId, universiteId, fields) {
  const { error } = await supabase
    .from('carmine_cibles_eleve').update(fields)
    .eq('student_id', studentId).eq('universite_id', universiteId);
  if (error) throw error;
}

export async function removeCible(studentId, universiteId) {
  const { error } = await supabase
    .from('carmine_cibles_eleve').delete()
    .eq('student_id', studentId).eq('universite_id', universiteId);
  if (error) throw error;
}

/* ── Exigences validées et types ─────────────────────────────── */

export async function listExigencesValidees(universiteIds) {
  if (!universiteIds.length) return [];
  const { data, error } = await supabase
    .from('carmine_exigences_universite')
    .select('*, universite:carmine_universites(id, pays, etablissement, cursus, filiere)')
    .in('universite_id', universiteIds)
    .eq('statut', 'validee');
  if (error) throw error;
  return data ?? [];
}

export async function getTypes() {
  const { data, error } = await supabase.from('carmine_types_tache').select('*');
  if (error) throw error;
  const map = {};
  for (const t of data ?? []) map[t.type] = t;
  return map;
}

/* ── Tâches ──────────────────────────────────────────────────── */

export async function getTaches(studentId) {
  const { data, error } = await supabase
    .from('carmine_taches').select('*').eq('student_id', studentId).order('echeance');
  if (error) throw error;
  return data ?? [];
}

/** Toutes les tâches vivantes de tous les dossiers, par tranches de mille. */
export async function getAllTaches() {
  const TRANCHE = 1000;
  const tout = [];
  for (let debut = 0; ; debut += TRANCHE) {
    const { data, error } = await supabase
      .from('carmine_taches')
      .select('*')
      .in('statut', ['a_venir', 'a_faire', 'en_cours'])
      .order('echeance')
      .range(debut, debut + TRANCHE - 1);
    if (error) throw error;
    tout.push(...(data ?? []));
    if ((data ?? []).length < TRANCHE) return tout;
  }
}

export async function updateTache(id, fields) {
  const { error } = await supabase.from('carmine_taches').update(fields).eq('id', id);
  if (error) throw error;
}

/**
 * Aligne les tâches d'un dossier sur ce que le générateur veut, sans jamais
 * toucher une tâche commencée ou faite. Idempotent : se lance à chaque
 * ouverture du dossier et après chaque changement de cible.
 */
export async function synchroniser(student) {
  const [cibles, types, existantes, anciennes] = await Promise.all([
    listCibles(student.id), getTypes(), getTaches(student.id), anciensJalons(student.id),
  ]);
  const exigences = await listExigencesValidees(cibles.map((c) => c.universite_id));
  const voulues = genererTaches({ student, socle: MILESTONES, exigences, cibles, types });

  const parCle = new Map(existantes.map((t) => [cle(t), t]));
  const vues = new Set();
  const inserts = [];
  const updates = [];

  for (const w of voulues) {
    const k = cle(w);
    vues.add(k);
    const champs = {
      student_id: student.id, origine: w.origine, milestone_id: w.milestone_id,
      exigence_id: w.exigence_id, universite_id: w.universite_id, type: w.type,
      titre: w.titre, consigne: w.consigne, owners: w.owners, lock: w.lock,
      echeance: w.echeance, fin_periode: w.fin_periode, apparition: w.apparition,
    };
    const ex = parCle.get(k);
    if (!ex) {
      // Première génération : on reprend ce que l'ancien portail sait de cette
      // étape (statut, notes), en lecture seule. C'est le report de la bascule,
      // fait au fil de l'eau pour qu'un dossier n'arrive pas vierge.
      const ancien = w.origine === 'socle' ? anciennes[w.milestone_id] : null;
      const statut = ancien && ['en_cours', 'fait', 'sans_objet'].includes(ancien.status)
        ? ancien.status
        : (w.hors_perimetre ? 'sans_objet' : 'a_venir');
      inserts.push({
        ...champs, statut,
        public_note: ancien?.public_note ?? null,
        private_note: ancien?.private_note ?? null,
      });
      continue;
    }
    const maj = {};
    for (const f of ['echeance', 'fin_periode', 'apparition', 'titre', 'consigne', 'lock']) {
      if (JSON.stringify(ex[f] ?? null) !== JSON.stringify(champs[f] ?? null)) maj[f] = champs[f];
    }
    if (ex.statut === 'effacee') maj.statut = w.hors_perimetre ? 'sans_objet' : 'a_venir';
    if (ex.statut === 'sans_objet' && !w.hors_perimetre && w.rattrape) maj.statut = 'a_venir';
    if (ex.statut === 'a_venir' && w.hors_perimetre) maj.statut = 'sans_objet';
    // Une tâche commencée ou faite garde ses dates : on ne redate que l'attente.
    if (['en_cours', 'fait'].includes(ex.statut)) {
      delete maj.echeance; delete maj.fin_periode; delete maj.apparition;
    }
    if (Object.keys(maj).length) updates.push({ id: ex.id, maj });
  }

  const effacer = existantes
    .filter((t) => !vues.has(cle(t)) && ['a_venir', 'a_faire'].includes(t.statut))
    .map((t) => t.id);

  if (inserts.length) {
    const { error } = await supabase.from('carmine_taches').insert(inserts);
    if (error) throw error;
  }
  for (const u of updates) {
    const { error } = await supabase.from('carmine_taches').update(u.maj).eq('id', u.id);
    if (error) throw error;
  }
  if (effacer.length) {
    const { error } = await supabase.from('carmine_taches').update({ statut: 'effacee' }).in('id', effacer);
    if (error) throw error;
  }
  return { ajoutees: inserts.length, redatees: updates.length, effacees: effacer.length };
}

/** Résumé de toutes les tâches non effacées, colonnes légères, pour les listes. */
export async function getTachesResume() {
  const TRANCHE = 1000;
  const tout = [];
  for (let debut = 0; ; debut += TRANCHE) {
    const { data, error } = await supabase
      .from('carmine_taches')
      .select('id, student_id, statut, echeance, apparition, lock, titre, universite_id, owners, origine, type')
      .neq('statut', 'effacee')
      .order('echeance')
      .range(debut, debut + TRANCHE - 1);
    if (error) throw error;
    tout.push(...(data ?? []));
    if ((data ?? []).length < TRANCHE) return tout;
  }
}

/* ── Pièces, livrables, trames, accès ────────────────────────── */

export async function listDocuments(tacheId) {
  const { data, error } = await supabase
    .from('carmine_documents').select('*').eq('tache_id', tacheId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function uploadDocument(studentId, tacheId, file) {
  const safe = file.name.replace(/[^\w.\-]+/g, '_');
  const path = `${studentId}/${Date.now()}_${safe}`;
  const { error: upErr } = await supabase.storage.from('carmine-documents').upload(path, file);
  if (upErr) throw upErr;
  const { data: { session } } = await supabase.auth.getSession();
  const { error } = await supabase.from('carmine_documents').insert({
    student_id: studentId, tache_id: tacheId, storage_path: path,
    filename: file.name, size_bytes: file.size, uploaded_by: session?.user?.id ?? null,
  });
  if (error) throw error;
}

export async function documentUrl(path) {
  const { data, error } = await supabase.storage.from('carmine-documents').createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function listLivrablesTache(tacheId) {
  const { data, error } = await supabase
    .from('carmine_livrables').select('*').eq('tache_id', tacheId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listLivrablesEleve(studentId) {
  const { data, error } = await supabase
    .from('carmine_livrables').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateLivrable(id, fields) {
  if (fields.statut === 'publie') fields.publie_le = new Date().toISOString();
  const { error } = await supabase.from('carmine_livrables').update(fields).eq('id', id);
  if (error) throw error;
}

export async function getTrame(code) {
  const { data, error } = await supabase.from('carmine_trames').select('code, titre, contenu, type').eq('code', code).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listAcces(studentId) {
  const { data, error } = await supabase
    .from('carmine_acces_invites').select('email, role').eq('student_id', studentId);
  if (error) throw error;
  return data ?? [];
}

async function invoquer(nom, body) {
  const { data, error } = await supabase.functions.invoke(nom, { body });
  if (error) {
    let detail = error.message;
    try { const corps = await error.context?.json?.(); if (corps?.error) detail = corps.error; } catch { /* rien */ }
    throw new Error(detail);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export const preparerEmail = (tacheId) => invoquer('brouillon-email', { tache_id: tacheId });
export const genererLivrable = (params) => invoquer('generer-livrable', params);

/** Adresse Gmail de composition, préremplie. Le fil reste dans la boîte de Greg. */
export function lienGmail({ to, objet, corps }) {
  const p = new URLSearchParams({ view: 'cm', fs: '1', to: to ?? '', su: objet ?? '', body: corps ?? '' });
  return `https://mail.google.com/mail/?${p.toString()}`;
}

/** Crée un dossier. Le calendrier se génère à la première ouverture dans le moteur. */
export async function createStudent(fields) {
  const { data, error } = await supabase.from('carmine_students').insert(fields).select().single();
  if (error) throw error;
  return data;
}

/** Les étapes de l'ancien portail pour un élève, lues sans rien y modifier. */
async function anciensJalons(studentId) {
  const { data, error } = await supabase
    .from('carmine_student_milestones')
    .select('milestone_id, status, public_note, private_note')
    .eq('student_id', studentId);
  if (error) return {};
  const map = {};
  for (const r of data ?? []) map[r.milestone_id] = r;
  return map;
}
