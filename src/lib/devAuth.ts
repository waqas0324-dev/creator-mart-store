import { supabase } from './supabase';

const DEV_KEY = 'cm_dev_auth';

async function fetchWithTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error('Request timed out')), ms)),
  ]);
}

export async function devLogin(email: string, password: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fast-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, role: 'developer' }),
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

    localStorage.setItem(DEV_KEY, 'true');
    return null;
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timed out') {
      return 'Login server did not respond in time. Please try again.';
    }
    return 'Unable to sign in right now. Please try again.';
  }
}

export async function devLogout() {
  await supabase.auth.signOut();
  localStorage.removeItem(DEV_KEY);
}

export async function syncDevSession(): Promise<boolean> {
  const { data: sessionData } = await fetchWithTimeout(supabase.auth.getSession());
  const user = sessionData.session?.user;

  if (!user?.email) {
    localStorage.removeItem(DEV_KEY);
    return false;
  }

  const { data: devRow } = await fetchWithTimeout(
    supabase.from('developer_users').select('id').eq('user_id', user.id).maybeSingle()
  );

  if (!devRow) {
    localStorage.removeItem(DEV_KEY);
    return false;
  }

  localStorage.setItem(DEV_KEY, 'true');
  return true;
}
