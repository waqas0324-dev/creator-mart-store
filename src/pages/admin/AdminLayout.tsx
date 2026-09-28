import { LayoutDashboard, Package, ShoppingBag, LogOut, Menu, X, type LucideIcon, Store, Loader2, Tags } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { adminLogout, syncAdminSession } from '../../lib/adminAuth';
import { Logo } from '../../components/UI/Logo';
import type { Page } from '../../types';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS: { label: string; icon: LucideIcon; page: Page }[] = [
  { label: 'Dashboard', icon: LayoutDashboard, page: 'admin' },
  { label: 'Products', icon: Package, page: 'admin-products' },
  { label: 'Categories', icon: Tags, page: 'admin-categories' },
  { label: 'Orders', icon: ShoppingBag, page: 'admin-orders' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { nav, navigate } = useNavigation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    syncAdminSession().then(ok => {
      if (!ok) {
        navigate('admin-login');
      } else {
        setAuthorized(true);
      }
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 size={32} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;

  const currentLabel = NAV_ITEMS.find(i => i.page === nav.page)?.label ||
    (nav.page === 'admin-product-form' ? 'Product Form' : 'Admin');

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-gray-900 text-white flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Logo size="sm" showTagline={false} />
          </div>
          <button className="md:hidden text-gray-400" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.page}
              onClick={() => { navigate(item.page); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${nav.page === item.page || (item.page === 'admin-products' && nav.page === 'admin-product-form') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
            >
              <item.icon size={18} />{item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-700 space-y-1">
          <button onClick={() => navigate('home')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <Store size={18} />Visit Store
          </button>
          <button
            onClick={async () => { await adminLogout(); navigate('admin-login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button className="md:hidden text-gray-600" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
          <h1 className="font-black text-gray-900 text-lg">{currentLabel}</h1>
          <div className="ml-auto">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">A</div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
