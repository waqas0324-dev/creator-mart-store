import { supabase } from './supabase';

const ADMIN_KEY = 'cm_admin_auth';

async function fetchWithTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error('Request timed out')), ms)),
  ]);
}

export async function adminLogin(email: string, password: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fast-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, role: 'admin' }),
      }),
    );

    const payload = await response.json();
    if (!response.ok) return payload.error || 'Unable to sign in right now. Please try again.';

    const { error } = await fetchWithTimeout(
      supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      }),
    );

    if (error) return error.message || 'Login failed. Please try again.';

    localStorage.setItem(ADMIN_KEY, 'true');
    return null;
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timed out') {
      return 'Login server did not respond in time. Please try again.';
    }
    return 'Unable to sign in right now. Please try again.';
  }
}

export async function adminLogout() {
  await supabase.auth.signOut();
  localStorage.removeItem(ADMIN_KEY);
}

export async function syncAdminSession(): Promise<boolean> {
  const { data: sessionData } = await fetchWithTimeout(supabase.auth.getSession());
  const user = sessionData.session?.user;

  if (!user?.email) {
    localStorage.removeItem(ADMIN_KEY);
    return false;
  }

  const { data: adminRow } = await fetchWithTimeout(
    supabase.from('admin_users').select('id').eq('user_id', user.id).maybeSingle()
  );

  if (!adminRow) {
    await supabase.auth.signOut();
    localStorage.removeItem(ADMIN_KEY);
    return false;
  }

  localStorage.setItem(ADMIN_KEY, 'true');
  return true;
}
