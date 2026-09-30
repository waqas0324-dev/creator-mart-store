import { useEffect, useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Loader2, LogIn, KeyRound } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { devLogin } from '../../lib/devAuth';
import { supabase } from '../../lib/supabase';

export function DevLogin() {
  const { navigate } = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('cm_dev_email_hint') || '' : '';

  useEffect(() => {
    let mounted = true;
    const checkRecovery = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted && data.session) {
        const hash = window.location.hash;
        if (hash.includes('type=recovery') || new URLSearchParams(window.location.search).get('type') === 'recovery') {
          setRecoveryMode(true);
        }
      }
    };
    checkRecovery();
    const { data: listener } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleRecoveryPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setUpdatingPassword(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setResetMessage('Password updated successfully. Opening Developer Studio...');
    localStorage.setItem('cm_dev_email_hint', email.trim().toLowerCase() || savedEmail);
    setTimeout(() => navigate('dev-panel'), 700);
  };

  const maskEmail = (value: string) => {
    const [name, domain] = value.split('@');
    if (!name || !domain) return value;
    return `${name.slice(0, 1)}***@${domain}`;
  };

  const handleForgotPassword = async () => {
    const targetEmail = email.trim() || savedEmail;
    setError('');
    setResetMessage('');
    if (!targetEmail) {
      setError('Enter your Developer Studio email first, then tap Forgot password.');
      return;
    }
    setResetting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: window.location.origin + '/ws-studio',
    });
    setResetting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setResetMessage('Password reset email sent. Check your inbox and spam folder.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      const err = await devLogin(email.trim(), password);
      if (err) {
        setError(err);
        return;
      }
      localStorage.setItem('cm_dev_email_hint', email.trim().toLowerCase());
      window.dispatchEvent(new Event('cm-dev-authenticated'));
      setLoading(false);
      navigate('dev-panel');
    } catch {
      setError('Unable to sign in right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500 transition-colors placeholder-gray-500';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <ShieldCheck size={26} className="text-purple-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white">Developer Studio</h1>
          <p className="text-gray-500 text-sm mt-1">Private — not part of the store admin panel</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}
          {resetMessage && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm mb-4">
              {resetMessage}
            </div>
          )}
          {savedEmail && (
            <div className="bg-purple-500/10 border border-purple-500/20 text-purple-300 px-3 py-2 rounded-lg text-xs mb-4">
              Email hint: <span className="font-bold">{maskEmail(savedEmail)}</span>
            </div>
          )}

          {recoveryMode ? (
            <form onSubmit={handleRecoveryPassword} className="space-y-4">
              <div>
                <p className="text-sm font-bold text-white mb-1">Set a new password</p>
                <p className="text-xs text-gray-500">Choose a new Developer Studio password with at least 8 characters.</p>
              </div>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" className={inputCls} autoComplete="new-password" />
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className={inputCls} autoComplete="new-password" />
              <button type="submit" disabled={updatingPassword} className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-bold py-3 rounded-xl transition-colors">
                {updatingPassword ? 'Updating password...' : 'Update Password'}
              </button>
            </form>
          ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`${inputCls} pr-10`}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || resetting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={16} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading || resetting}
              className="w-full text-xs font-semibold text-gray-400 hover:text-purple-300 py-2 flex items-center justify-center gap-2 transition-colors"
            >
              <KeyRound size={14} />
              {resetting ? 'Sending reset email...' : 'Forgot password?'}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
