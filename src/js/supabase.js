import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://frufyxrhpqxhnawmrhru.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZydWZ5eHJocHF4aG5hd21yaHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjgzMjQsImV4cCI6MjA4MzcwNDMyNH0.hoNc-vWPzsgHMBNEwyhENxAiEQe2FMdeQz3D9daeZkw'
);

export default supabase;
