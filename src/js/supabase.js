import { createClient } from '@supabase/supabase-js';

// Clé publiable : elle est destinée au navigateur. La sécurité des données
// repose entièrement sur les policies RLS définies dans supabase-portail.sql.
const supabase = createClient(
  'https://drfgfpyxviflnqegvwde.supabase.co',
  'sb_publishable__xUMoGjeA-1UotBXw0e-KQ_I6pfzQs_',
  {
    // PKCE. Sans lui, un lien de courriel suffit à ouvrir la session, et les
    // antivirus des messageries — Gmail au premier chef — visitent chaque lien
    // pour l'analyser : le lien à usage unique était consommé avant que son
    // destinataire ne clique dessus. Ici le navigateur qui demande le lien
    // conserve un secret ; sans ce secret le lien ne vaut rien, et le visiter
    // ne le consomme pas.
    //
    // En contrepartie, le lien doit être ouvert sur l'appareil qui l'a demandé.
    auth: { flowType: 'pkce' },
  }
);

export default supabase;
