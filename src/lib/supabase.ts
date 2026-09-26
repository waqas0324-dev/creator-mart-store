import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase credentials. Create a .env file with VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_ANON_KEY (see .env.example and SUPABASE-SETUP.md).'
  );
}

// Current supabase-js uses a lockless auth coordination path by default.
// Keep the client on that path instead of injecting a legacy custom lock.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
