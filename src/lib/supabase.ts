import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase credentials. Create a .env file with VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_ANON_KEY (see .env.example and SUPABASE-SETUP.md).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    // Do not let another browser tab hold the login operation hostage.
    // Each tab can authenticate immediately; Supabase still persists the session.
    lock: async (_name, _acquireTimeout, fn) => await fn(),
  },
});
