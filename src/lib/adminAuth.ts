import { supabase } from './supabase';

const ADMIN_KEY = 'cm_admin_auth';

export async function adminLogin(email: string, password: string): Promise<string | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return 'Invalid email or password.';
  if (!data.session) return 'Login failed. Please try again.';

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', data.session.user.id)
    .maybeSingle();

  if (!adminRow) {
    await supabase.auth.signOut();
    return 'Access denied. You are not authorized to access the admin panel.';
  }

  localStorage.setItem(ADMIN_KEY, 'true');
  return null;
}

export async function adminLogout() {
  await supabase.auth.signOut();
  localStorage.removeItem(ADMIN_KEY);
}

export async function syncAdminSession(): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;

  if (!user?.email) {
    localStorage.removeItem(ADMIN_KEY);
    return false;
  }

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) {
    await supabase.auth.signOut();
    localStorage.removeItem(ADMIN_KEY);
    return false;
  }

  localStorage.setItem(ADMIN_KEY, 'true');
  return true;
}
