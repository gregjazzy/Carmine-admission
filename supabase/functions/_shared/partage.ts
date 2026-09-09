/**
 * Socle commun des fonctions du moteur : CORS, réponse JSON, vérification du
 * rôle administrateur par le client de l'appelant, client service role.
 * Importé par chemin relatif : chaque fonction est déployée avec son dossier,
 * Supabase embarque les fichiers voisins référencés.
 */
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

export const MODELE = 'claude-opus-5';

/** Vérifie la session et le rôle ; rend l'utilisateur et le client service role. */
export async function ouvrirAdmin(req: Request): Promise<
  { ok: true; user: { id: string }; admin: SupabaseClient; cle: string } | { ok: false; reponse: Response }
> {
  const cle = Deno.env.get('ANTHROPIC_API_KEY');
  if (!cle) return { ok: false, reponse: json({ error: 'ANTHROPIC_API_KEY absente des secrets.' }, 500) };
  const autorisation = req.headers.get('Authorization');
  if (!autorisation) return { ok: false, reponse: json({ error: 'Authentification requise.' }, 401) };
  const url = Deno.env.get('SUPABASE_URL')!;
  const appelant = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: autorisation } },
  });
  const { data: { user } } = await appelant.auth.getUser();
  if (!user) return { ok: false, reponse: json({ error: 'Session invalide.' }, 401) };
  const { data: profil } = await appelant.from('carmine_profiles').select('role').eq('id', user.id).single();
  if (profil?.role !== 'admin') return { ok: false, reponse: json({ error: 'Réservé à l’administration.' }, 403) };
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  return { ok: true, user, admin, cle };
}

/** Le contexte d'une tâche : élève, université, cible, exigence, accès. */
export async function contexteTache(admin: SupabaseClient, tacheId: string) {
  const { data: tache } = await admin.from('carmine_taches').select('*').eq('id', tacheId).single();
  if (!tache) return null;
  const [{ data: eleve }, { data: universite }, { data: exigence }, { data: acces }, { data: cible }] = await Promise.all([
    admin.from('carmine_students').select('*').eq('id', tache.student_id).single(),
    tache.universite_id
      ? admin.from('carmine_universites').select('*').eq('id', tache.universite_id).single()
      : Promise.resolve({ data: null }),
    tache.exigence_id
      ? admin.from('carmine_exigences_universite').select('*').eq('id', tache.exigence_id).single()
      : Promise.resolve({ data: null }),
    admin.from('carmine_acces_invites').select('email, role').eq('student_id', tache.student_id),
    tache.universite_id
      ? admin.from('carmine_cibles_eleve').select('*').eq('student_id', tache.student_id).eq('universite_id', tache.universite_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return { tache, eleve, universite, exigence, acces: acces ?? [], cible };
}

export function decrireContexte(ctx: NonNullable<Awaited<ReturnType<typeof contexteTache>>>): string {
  const { tache, eleve, universite, exigence, acces, cible } = ctx;
  const parents = acces.filter((a) => a.role === 'parent').map((a) => a.email);
  const eleveMails = acces.filter((a) => a.role === 'eleve').map((a) => a.email);
  return [
    `## Élève`,
    `Prénom : ${eleve?.first_name} · Nom : ${eleve?.last_name} · Classe actuelle : ${eleve?.current_class} · Rentrée de terminale : ${eleve?.terminale_year}`,
    `Établissement : ${eleve?.school ?? 'non renseigné'} · Filières : ${(eleve?.tracks ?? []).join(', ')}`,
    `Adresses parents : ${parents.join(', ') || 'non renseignées'} · Adresse élève : ${eleveMails.join(', ') || 'non renseignée'}`,
    ``,
    `## Tâche`,
    `Titre : ${tache.titre}`,
    `Type : ${tache.type} · Destinataires prévus : ${(tache.owners ?? []).join(', ')} · Irrattrapable : ${tache.lock ? 'oui' : 'non'}`,
    `Apparaît le : ${tache.apparition} · Échéance : ${tache.echeance}${tache.fin_periode ? ` · Fin de période : ${tache.fin_periode}` : ''}`,
    tache.consigne ? `Consigne : ${tache.consigne}` : '',
    tache.public_note ? `Message déjà laissé aux parents : ${tache.public_note}` : '',
    ``,
    universite ? `## Université\n${universite.etablissement}${universite.cursus ? ` — ${universite.cursus}` : ''} (${universite.pays})${cible ? ` · ${cible.retenue ? 'retenue' : 'envisagée'}${cible.tour ? ` · tour ${cible.tour}` : ''}` : ''}` : '',
    exigence ? `## Exigence (fiche validée)\n${exigence.libelle}${exigence.consigne ? `\nConsigne : ${exigence.consigne}` : ''}${exigence.longueur ? `\nLongueur : ${exigence.longueur}` : ''}${exigence.source_url ? `\nSource : ${exigence.source_url}` : ''}` : '',
  ].filter((l) => l !== '').join('\n');
}
