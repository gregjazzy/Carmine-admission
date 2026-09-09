/**
 * Accès aux données du moteur de pilotage.
 *
 * Reprend le client Supabase du site. Lit les tables existantes, écrit dans
 * les tables du moteur. Ne touche jamais à carmine_student_milestones : c'est
 * l'ancien portail qui la tient, jusqu'à la bascule.
 */
import supabase from '../supabase.js';

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
