import { supabase } from './supabase';

const DEV_KEY = 'cm_dev_auth';

export async function devLogin(email: string, password: string): Promise<string | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return 'Invalid email or password.';
  if (!data.session) return 'Login failed. Please try again.';

  const { data: devRow } = await supabase
    .from('developer_users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (!devRow) {
    await supabase.auth.signOut();
    return 'Access denied.';
  }

  localStorage.setItem(DEV_KEY, 'true');
  return null;
}

export async function devLogout() {
  await supabase.auth.signOut();
  localStorage.removeItem(DEV_KEY);
}

export async function syncDevSession(): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;

  if (!user?.email) {
    localStorage.removeItem(DEV_KEY);
    return false;
  }

  const { data: devRow } = await supabase
    .from('developer_users')
    .select('id')
    .eq('email', user.email.toLowerCase())
    .maybeSingle();

  if (!devRow) {
    localStorage.removeItem(DEV_KEY);
    return false;
  }

  localStorage.setItem(DEV_KEY, 'true');
  return true;
}
