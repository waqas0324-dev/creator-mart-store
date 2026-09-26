import { useEffect, useState } from 'react';
import { UserPlus, Trash2, KeyRound, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Account = { id: string; email: string; user_id: string | null };

export function AccountManagement() {
  const [admins, setAdmins] = useState<Account[]>([]);
  const [developers, setDevelopers] = useState<Account[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'developer'>('admin');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const call = async (action: string, payload = {}) => {
    const { data, error } = await supabase.functions.invoke('manage-accounts', { body: { action, ...payload } });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const load = async () => {
    try {
      const data = await call('list');
      setAdmins(data.admins || []);
      setDevelopers(data.developers || []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load accounts.'); }
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMessage(''); setError('');
    try {
      await call('create', { email, password, role });
      setMessage('Account created successfully.');
      setEmail(''); setPassword(''); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create account.'); }
    setBusy(false);
  };

  const remove = async (account: Account, accountRole: 'admin' | 'developer') => {
    if (!confirm('Delete ' + account.email + ' from ' + accountRole + ' accounts?')) return;
    setBusy(true); setMessage(''); setError('');
    try { await call('delete', { user_id: account.user_id, role: accountRole }); setMessage('Account removed.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not remove account.'); }
    setBusy(false);
  };

  const resetPassword = async (account: Account, accountRole: 'admin' | 'developer') => {
    const next = prompt('New password for ' + account.email + ' (8+ characters):');
    if (!next) return;
    setBusy(true); setMessage(''); setError('');
    try { await call('change_password', { user_id: account.user_id, role: accountRole, password: next }); setMessage('Password changed and security activity recorded.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not change password.'); }
    setBusy(false);
  };

  const AccountList = ({ title, items, accountRole }: { title: string; items: Account[]; accountRole: 'admin' | 'developer' }) => (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-900 font-bold text-sm text-white">{title}</div>
      {items.map(a => <div key={a.id} className="px-4 py-3 border-t border-gray-800 flex items-center gap-3">
        <div className="min-w-0 flex-1"><p className="text-sm text-gray-200 truncate">{a.email}</p><p className="text-[10px] text-gray-600">{a.user_id ? 'Linked authentication account' : 'Needs linking'}</p></div>
        <button disabled={busy || !a.user_id} onClick={() => resetPassword(a, accountRole)} className="p-2 text-gray-400 hover:text-purple-300 disabled:opacity-30" title="Change password"><KeyRound size={15} /></button>
        <button disabled={busy || !a.user_id} onClick={() => remove(a, accountRole)} className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-30" title="Remove account"><Trash2 size={15} /></button>
      </div>)}
      {items.length === 0 && <p className="px-4 py-4 text-xs text-gray-600">No accounts.</p>}
    </div>
  );

  return <div className="space-y-5">
    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4"><UserPlus size={18} className="text-purple-400" /><h3 className="font-black text-white">Account Management</h3></div>
      <form onSubmit={create} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500" />
        <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Temporary password (8+)" className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500" />
        <div className="flex gap-2">
          <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'developer')} className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white"><option value="admin">Admin</option><option value="developer">Developer</option></select>
          <button disabled={busy} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-4 rounded-xl flex items-center gap-2">{busy ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}Create</button>
        </div>
      </form>
      <p className="text-[11px] text-gray-500 mt-2">Account creation/removal is private to Developer Studio. Every account action is written to Security Activity.</p>
      {(message || error) && <p className={error ? 'text-xs mt-3 text-red-400' : 'text-xs mt-3 text-green-400'}>{error || message}</p>}
    </div>
    <div className="space-y-3"><AccountList title="Admin Accounts" items={admins} accountRole="admin" /><AccountList title="Developer Accounts" items={developers} accountRole="developer" /></div>
  </div>;
}