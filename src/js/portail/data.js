/**
 * Accès aux données du portail.
 * Toutes les requêtes passent par les règles de sécurité définies dans supabase-portail.sql :
 * un parent ne peut lire que les dossiers auxquels il est rattaché.
 */
import supabase from '../supabase.js';
import { MILESTONES, dueDate, scheduleFor, outOfScope } from './milestones.js';

export { supabase };

/* ── Session et rôle ─────────────────────────────────────────── */

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('carmine_profiles')
    .select('id, email, full_name, role')
    .eq('id', session.user.id)
    .single();
  if (error) return { id: session.user.id, email: session.user.email, role: 'parent' };
  return data;
}

export async function signIn(email, redirectPath = '/espace-client') {
  return supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: `${window.location.origin}${redirectPath}` },
  });
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/';
}

/* ── Dossiers ────────────────────────────────────────────────── */

export async function listStudents() {
  const { data, error } = await supabase
    .from('carmine_students')
    .select('*')
    .eq('archived', false)
    .order('last_name');
  if (error) throw error;
  return data;
}

export async function getStudent(id) {
  const { data, error } = await supabase
    .from('carmine_students')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getMilestoneStates(studentId) {
  const { data, error } = await supabase
    .from('carmine_student_milestones')
    .select('*')
    .eq('student_id', studentId);
  if (error) throw error;
  const byId = {};
  for (const row of data) byId[row.milestone_id] = row;
  return byId;
}

export async function setMilestoneStatus(studentId, milestoneId, status) {
  const { error } = await supabase
    .from('carmine_student_milestones')
    .update({ status })
    .eq('student_id', studentId)
    .eq('milestone_id', milestoneId);
  if (error) throw error;
}

export async function setMilestoneNote(studentId, milestoneId, fields) {
  const { error } = await supabase
    .from('carmine_student_milestones')
    .update(fields)
    .eq('student_id', studentId)
    .eq('milestone_id', milestoneId);
  if (error) throw error;
}

/**
 * Crée un dossier et matérialise son calendrier.
 * Chaque jalon applicable devient une ligne datée, que l'on pourra faire évoluer ensuite.
 */
export async function createStudent(fields) {
  const { data: student, error } = await supabase
    .from('carmine_students')
    .insert(fields)
    .select()
    .single();
  if (error) throw error;

  // Les jalons antérieurs à la prise en charge sont créés « sans objet », jamais
  // « à faire » : une famille qui arrive en première n'est pas en retard de deux
  // ans sur des étapes de troisième qu'on ne lui avait pas demandées.
  const past = new Set(
    outOfScope(student.tracks, student.terminale_year, student.entry_class)
      .map(({ milestone }) => milestone.id)
  );

  const rows = scheduleFor(student.tracks, student.terminale_year).map(({ milestone, due }) => ({
    student_id: student.id,
    milestone_id: milestone.id,
    due_date: due.toISOString().slice(0, 10),
    status: past.has(milestone.id) ? 'sans_objet' : 'a_faire',
  }));

  if (rows.length) {
    const { error: e2 } = await supabase.from('carmine_student_milestones').insert(rows);
    if (e2) throw e2;
  }
  return student;
}

/**
 * Réaligne le calendrier après un changement de filières ou d'année de terminale :
 * ajoute les jalons devenus applicables, redate les existants, retire ceux qui ne le sont plus
 * — sans jamais supprimer un jalon déjà marqué comme fait.
 */
export async function resyncSchedule(student) {
  const states = await getMilestoneStates(student.id);
  const wanted = scheduleFor(student.tracks, student.terminale_year);
  const wantedIds = new Set(wanted.map((w) => w.milestone.id));
  const past = new Set(
    outOfScope(student.tracks, student.terminale_year, student.entry_class)
      .map(({ milestone }) => milestone.id)
  );

  const toInsert = [];
  const toUpdate = [];
  const toScope = [];
  for (const { milestone, due } of wanted) {
    const iso = due.toISOString().slice(0, 10);
    const existing = states[milestone.id];
    if (!existing) {
      toInsert.push({
        student_id: student.id,
        milestone_id: milestone.id,
        due_date: iso,
        status: past.has(milestone.id) ? 'sans_objet' : 'a_faire',
      });
    } else if (existing.due_date !== iso) {
      toUpdate.push({ id: existing.id, due_date: iso });
    }
    // Rattrape les dossiers créés avant que la prise en charge ne soit prise
    // en compte : ces jalons s'affichaient « en retard » de plusieurs années.
    if (existing && existing.status === 'a_faire' && past.has(milestone.id)) {
      toScope.push(existing.id);
    }
  }
  const toDelete = Object.values(states)
    .filter((s) => !wantedIds.has(s.milestone_id) && s.status === 'a_faire')
    .map((s) => s.id);

  if (toInsert.length) await supabase.from('carmine_student_milestones').insert(toInsert);
  for (const u of toUpdate) {
    await supabase.from('carmine_student_milestones').update({ due_date: u.due_date }).eq('id', u.id);
  }
  if (toDelete.length) await supabase.from('carmine_student_milestones').delete().in('id', toDelete);
  if (toScope.length) {
    await supabase.from('carmine_student_milestones')
      .update({ status: 'sans_objet' }).in('id', toScope);
  }

  return {
    added: toInsert.length,
    redated: toUpdate.length + toScope.length,
    removed: toDelete.length,
  };
}

/* ── Documents ───────────────────────────────────────────────── */

export async function listDocuments(studentId, milestoneId = null) {
  let q = supabase
    .from('carmine_documents')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (milestoneId) q = q.eq('milestone_id', milestoneId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function uploadDocument(studentId, milestoneId, file) {
  const safe = file.name.replace(/[^\w.\-]+/g, '_');
  const path = `${studentId}/${Date.now()}_${safe}`;

  const { error: upErr } = await supabase.storage.from('carmine-documents').upload(path, file);
  if (upErr) throw upErr;

  const session = await getSession();
  const { error } = await supabase.from('carmine_documents').insert({
    student_id: studentId,
    milestone_id: milestoneId,
    storage_path: path,
    filename: file.name,
    size_bytes: file.size,
    uploaded_by: session?.user?.id ?? null,
  });
  if (error) throw error;
}

/** Lien de téléchargement temporaire (le bucket est privé). */
export async function documentUrl(path) {
  const { data, error } = await supabase.storage
    .from('carmine-documents')
    .createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

/* ── Comptes rendus ──────────────────────────────────────────── */

export async function listNotes(studentId) {
  const { data, error } = await supabase
    .from('carmine_session_notes')
    .select('*')
    .eq('student_id', studentId)
    .order('session_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addNote(fields) {
  const { error } = await supabase.from('carmine_session_notes').insert(fields);
  if (error) throw error;
}

/* ── Agrégats de pilotage ────────────────────────────────────── */

/** Statistiques d'un dossier : avancement et nombre de retards. */
export function summarize(states, tracks, terminaleYear, today = new Date()) {
  const applicable = scheduleFor(tracks, terminaleYear);
  let done = 0;
  let late = 0;
  let total = 0;
  for (const { milestone, due } of applicable) {
    const st = states[milestone.id]?.status ?? 'a_faire';
    if (st === 'sans_objet') continue;
    total += 1;
    if (st === 'fait') done += 1;
    else if (due < today) late += 1;
  }
  return { done, late, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function milestoneById(id) {
  return MILESTONES.find((m) => m.id === id);
}

export { dueDate };
