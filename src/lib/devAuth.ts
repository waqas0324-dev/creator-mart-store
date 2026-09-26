import { supabase } from './supabase';

const DEV_KEY = 'cm_dev_auth';

async function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error('Request timed out')), ms)),
  ]);
}

export async function devLogin(email: string, password: string): Promise<string | null> {
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    );

    if (error) return error.message || 'Invalid email or password.';
    if (!data.session) return 'Login failed. Please try again.';

    const { data: devRow, error: devError } = await withTimeout(
      supabase.from('developer_users').select('id').eq('user_id', data.session.user.id).maybeSingle()
    );

    if (devError) return 'Could not verify Developer Studio access. Please try again.';
    if (!devRow) {
      await supabase.auth.signOut();
      return 'Access denied.';
    }

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
  const { data: sessionData } = await withTimeout(supabase.auth.getSession());
  const user = sessionData.session?.user;

  if (!user?.email) {
    localStorage.removeItem(DEV_KEY);
    return false;
  }

  const { data: devRow } = await withTimeout(
    supabase.from('developer_users').select('id').eq('user_id', user.id).maybeSingle()
  );

  if (!devRow) {
    localStorage.removeItem(DEV_KEY);
    return false;
  }

  localStorage.setItem(DEV_KEY, 'true');
  return true;
}
