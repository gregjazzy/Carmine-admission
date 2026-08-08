import { createClient } from '@supabase/supabase-js';

// Clé publiable : elle est destinée au navigateur. La sécurité des données
// repose entièrement sur les policies RLS définies dans supabase-portail.sql.
const supabase = createClient(
  'https://drfgfpyxviflnqegvwde.supabase.co',
  'sb_publishable__xUMoGjeA-1UotBXw0e-KQ_I6pfzQs_'
);

export default supabase;
