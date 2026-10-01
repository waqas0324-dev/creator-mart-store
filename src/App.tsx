import { useEffect, useState, lazy, Suspense } from 'react';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { ToastProvider } from './context/ToastContext';
import { CartDrawer } from './components/CartDrawer';
import { FloatingWhatsApp } from './components/UI/FloatingWhatsApp';
import { Navbar } from './components/Layout/Navbar';
import { Footer } from './components/Layout/Footer';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';














import { syncAdminSession } from './lib/adminAuth';
import { syncDevSession } from './lib/devAuth';

// Admin pages are loaded on-demand only — a customer browsing the shop
// never downloads any admin code, keeping the storefront's first load small.
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminProducts = lazy(() => import('./pages/admin/Products').then(m => ({ default: m.AdminProducts })));
const AdminProductForm = lazy(() => import('./pages/admin/ProductForm').then(m => ({ default: m.AdminProductForm })));
const AdminOrders = lazy(() => import('./pages/admin/Orders').then(m => ({ default: m.AdminOrders })));
const AdminCategories = lazy(() => import('./pages/admin/Categories').then(m => ({ default: m.AdminCategories })));
const DevLogin = lazy(() => import('./pages/dev/DevLogin').then(m => ({ default: m.DevLogin })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const Cart = lazy(() => import('./pages/Cart').then(m => ({ default: m.Cart })));
const Wishlist = lazy(() => import('./pages/Wishlist').then(m => ({ default: m.Wishlist })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const Payment = lazy(() => import('./pages/Payment').then(m => ({ default: m.Payment })));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess').then(m => ({ default: m.OrderSuccess })));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage').then(m => ({ default: m.TrackOrderPage })));
const NewArrivals = lazy(() => import('./pages/NewArrivals').then(m => ({ default: m.NewArrivals })));
const BestSellers = lazy(() => import('./pages/BestSellers').then(m => ({ default: m.BestSellers })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const ReturnPolicy = lazy(() => import('./pages/ReturnPolicy').then(m => ({ default: m.ReturnPolicy })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const DevPanel = lazy(() => import('./pages/dev/DevPanel').then(m => ({ default: m.DevPanel })));

const ADMIN_PAGES = ['admin', 'admin-login', 'admin-products', 'admin-categories', 'admin-orders', 'admin-product-form'];
const DEV_PAGES = ['dev-login', 'dev-panel'];

const CustomerLoadingScreen = () => (
  <div className="min-h-[50vh] flex items-center justify-center bg-white">
    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
  </div>
);

const AdminLoadingScreen = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function Router() {
  const { nav, navigate } = useNavigation();
  const [authChecked, setAuthChecked] = useState(false);
  const [adminAuthorized, setAdminAuthorized] = useState(false);
  const [devAuthChecked, setDevAuthChecked] = useState(false);
  const [devAuthorized, setDevAuthorized] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#admin') {
      navigate('admin-login');
      history.replaceState(null, '', window.location.pathname);
    }
    if (window.location.hash === '#ws-studio') {
      navigate('dev-login');
      history.replaceState(null, '', window.location.pathname);
    }
  }, [navigate]);

  useEffect(() => {
    const onAdminAuthenticated = () => setAdminAuthorized(true);
    window.addEventListener('cm-admin-authenticated', onAdminAuthenticated);
    return () => window.removeEventListener('cm-admin-authenticated', onAdminAuthenticated);
  }, []);

  useEffect(() => {
    if (!ADMIN_PAGES.includes(nav.page) || nav.page === 'admin-login') {
      setAuthChecked(true);
      if (nav.page === 'admin-login') setAdminAuthorized(false);
      return;
    }
    if (adminAuthorized) {
      setAuthChecked(true);
      return;
    }
    setAuthChecked(false);
    syncAdminSession()
      .then(ok => { setAdminAuthorized(ok); setAuthChecked(true); })
      .catch(() => { setAdminAuthorized(false); setAuthChecked(true); });
  }, [nav.page, adminAuthorized]);

  useEffect(() => {
    const onDevAuthenticated = () => setDevAuthorized(true);
    window.addEventListener('cm-dev-authenticated', onDevAuthenticated);
    return () => window.removeEventListener('cm-dev-authenticated', onDevAuthenticated);
  }, []);

  useEffect(() => {
    if (!DEV_PAGES.includes(nav.page) || nav.page === 'dev-login') {
      setDevAuthChecked(true);
      return;
    }
    if (devAuthorized) {
      setDevAuthChecked(true);
      return;
    }
    setDevAuthChecked(false);
    syncDevSession()
      .then(ok => { setDevAuthorized(ok); setDevAuthChecked(true); })
      .catch(() => { setDevAuthorized(false); setDevAuthChecked(true); });
  }, [nav.page, devAuthorized]);

  if (DEV_PAGES.includes(nav.page)) {
    return (
      <Suspense fallback={<AdminLoadingScreen />}>
        {nav.page === 'dev-login' ? (
          <DevLogin />
        ) : !devAuthChecked ? (
          <AdminLoadingScreen />
        ) : devAuthorized ? (
          <DevPanel />
        ) : (
          <DevLogin />
        )}
      </Suspense>
    );
  }

  if (ADMIN_PAGES.includes(nav.page)) {
    return (
      <Suspense fallback={<AdminLoadingScreen />}>
        {nav.page === 'admin-login' ? (
          <AdminLogin />
        ) : !authChecked ? (
          <AdminLoadingScreen />
        ) : !adminAuthorized ? (
          <AdminLogin />
        ) : (
          <>
            {nav.page === 'admin' && <AdminDashboard />}
            {nav.page === 'admin-products' && <AdminProducts />}
            {nav.page === 'admin-categories' && <AdminCategories />}
            {nav.page === 'admin-product-form' && <AdminProductForm />}
            {nav.page === 'admin-orders' && <AdminOrders />}
          </>
        )}
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<CustomerLoadingScreen />}>
          {nav.page === 'home' && <Home />}
          {nav.page === 'shop' && <Shop />}
          {nav.page === 'categories' && <CategoriesPage />}
          {nav.page === 'product' && <ProductDetail />}
          {nav.page === 'cart' && <Cart />}
          {nav.page === 'wishlist' && <Wishlist />}
          {nav.page === 'checkout' && <Checkout />}
          {nav.page === 'payment' && <Payment />}
          {nav.page === 'order-success' && <OrderSuccess />}
          {nav.page === 'track-order' && <TrackOrderPage />}
          {nav.page === 'new-arrivals' && <NewArrivals />}
          {nav.page === 'best-sellers' && <BestSellers />}
          {nav.page === 'contact' && <Contact />}
          {nav.page === 'about' && <About />}
          {nav.page === 'return-policy' && <ReturnPolicy />}
          {nav.page === 'privacy-policy' && <PrivacyPolicy />}
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <FloatingWhatsApp />
    </div>
  );
}

export default function App() {
  return (
    <NavigationProvider>
      <SiteSettingsProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <Router />
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </SiteSettingsProvider>
    </NavigationProvider>
  );
}
