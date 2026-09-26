import { supabase } from './supabase';

const ADMIN_KEY = 'cm_admin_auth';

async function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error('Request timed out')), ms)),
  ]);
}

export async function adminLogin(email: string, password: string): Promise<string | null> {
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    );

    if (error) return error.message || 'Invalid email or password.';
    if (!data.session) return 'Login failed. Please try again.';

    const { data: adminRow, error: adminError } = await withTimeout(
      supabase.from('admin_users').select('id').eq('user_id', data.session.user.id).maybeSingle()
    );

    if (adminError) return 'Could not verify Admin Panel access. Please try again.';
    if (!adminRow) {
      await supabase.auth.signOut();
      return 'Access denied. You are not authorized to access the admin panel.';
    }

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
  const { data: sessionData } = await withTimeout(supabase.auth.getSession());
  const user = sessionData.session?.user;

  if (!user?.email) {
    localStorage.removeItem(ADMIN_KEY);
    return false;
  }

  const { data: adminRow } = await withTimeout(
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
