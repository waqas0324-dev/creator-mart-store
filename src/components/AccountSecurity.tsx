import { useEffect, useState } from 'react';
import { KeyRound, Mail, ShieldAlert, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Role = 'admin' | 'developer';

export function AccountSecurity({ role }: { role: Role }) {
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [activity, setActivity] = useState<{ id: string; action: string; details: Record<string, unknown>; created_at: string }[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const load = async () => {
    const { data: session } = await supabase.auth.getSession();
    const current = session.session?.user;
    if (!current?.email) return;
    setEmail(current.email);
    const { data } = await supabase.from('security_activity').select('id,action,details,created_at').order('created_at', { ascending: false }).limit(20);
    setActivity((data || []) as typeof activity);
  };

  useEffect(() => { load(); }, []);

  const log = async (action: string, details: Record<string, unknown>) => {
    const { data } = await supabase.auth.getSession();
    const actorEmail = data.session?.user?.email;
    if (actorEmail) await supabase.from('security_activity').insert({ actor_email: actorEmail, actor_role: role, action, details });
    await load();
  };

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');
    const value = newEmail.trim().toLowerCase();
    if (!value || value === email.toLowerCase()) { setError('Enter a different email address.'); return; }
    setSavingEmail(true);
    const { error: authError } = await supabase.auth.updateUser({ email: value });
    if (authError) {
      setError(authError.message);
    } else {
      await log('email_change_requested', { old_email: email, new_email: value, status: 'confirmation_required' });
      setMessage('Email change requested. Supabase will send a confirmation link to the new address. Your old email remains active until confirmation.');
      setNewEmail('');
    }
    setSavingEmail(false);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setSavingPassword(true);
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) setError(authError.message);
    else {
      await log('password_changed', { status: 'success' });
      setMessage('Password changed successfully.');
      setPassword(''); setConfirm('');
    }
    setSavingPassword(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Mail size={19} /></div>
          <div><h3 className="font-black text-gray-900">Account Email</h3><p className="text-xs text-gray-500 mt-1">Current login: {email || 'Loading…'}</p></div>
        </div>
        <form onSubmit={changeEmail} className="flex flex-col sm:flex-row gap-2">
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="New email address" className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
          <button disabled={savingEmail} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2">{savingEmail && <Loader2 size={15} className="animate-spin" />}Change Email</button>
        </form>
        <p className="text-[11px] text-gray-400 mt-2">A confirmation link is required before the new email becomes active.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><KeyRound size={19} /></div>
          <div><h3 className="font-black text-gray-900">Change Password</h3><p className="text-xs text-gray-500 mt-1">Use at least 8 characters.</p></div>
        </div>
        <form onSubmit={changePassword} className="grid sm:grid-cols-2 gap-3">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
          <button disabled={savingPassword} className="sm:col-span-2 bg-gray-900 hover:bg-black disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2">{savingPassword && <Loader2 size={15} className="animate-spin" />}Update Password</button>
        </form>
      </div>

      {(message || error) && <div className={`rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-green-50 border border-green-200 text-green-700'}`}>{error || message}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2"><ShieldAlert size={18} className="text-orange-500" /><h3 className="font-black text-gray-900">Security Activity</h3></div>
          <button onClick={load} className="text-gray-400 hover:text-gray-700"><RefreshCw size={16} /></button>
        </div>
        {activity.length === 0 ? <p className="text-sm text-gray-400">No security activity recorded yet.</p> : (
          <div className="space-y-2">
            {activity.map(item => <div key={item.id} className="flex items-start gap-3 border-b border-gray-100 last:border-0 py-2.5">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0"><p className="text-sm font-semibold text-gray-800">{item.action.replaceAll('_', ' ')}</p><p className="text-[11px] text-gray-400">{new Date(item.created_at).toLocaleString()}</p></div>
            </div>)}
          </div>
        )}
      </div>
    </div>
  );
}