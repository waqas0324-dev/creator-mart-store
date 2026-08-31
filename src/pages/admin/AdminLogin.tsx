import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { adminLogin } from '../../lib/adminAuth';

export function AdminLogin() {
  const { navigate } = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    const err = await adminLogin(email.trim(), password);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      navigate('admin');
    }
  };

  const inputCls = 'w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition-colors placeholder-gray-500';

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg shadow-orange-500/30">
            <span className="text-white font-black text-xl">ABR</span>
          </div>
          <h1 className="text-2xl font-black text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">ABR Shop — Authorized Access Only</p>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={16} className="text-orange-400" />
            <span className="text-sm font-bold text-gray-300">Secure Login</span>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
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
                  placeholder="Enter password"
                  className={`${inputCls} pr-10`}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={16} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          <button onClick={() => navigate('home')} className="hover:text-gray-400 transition-colors">
            Back to Store
          </button>
        </p>
      </div>
    </div>
  );
}
