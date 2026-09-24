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
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Wishlist } from './pages/Wishlist';
import { Checkout } from './pages/Checkout';
import { Payment } from './pages/Payment';
import { OrderSuccess } from './pages/OrderSuccess';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { NewArrivals } from './pages/NewArrivals';
import { BestSellers } from './pages/BestSellers';
import { Contact } from './pages/Contact';
import { About } from './pages/About';
import { ReturnPolicy } from './pages/ReturnPolicy';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
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
const DevPanel = lazy(() => import('./pages/dev/DevPanel').then(m => ({ default: m.DevPanel })));

const ADMIN_PAGES = ['admin', 'admin-login', 'admin-products', 'admin-categories', 'admin-orders', 'admin-product-form'];
const DEV_PAGES = ['dev-login', 'dev-panel'];

const AdminLoadingScreen = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function Router() {
  const { nav, navigate } = useNavigation();
  const [authChecked, setAuthChecked] = useState(false);
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
    syncAdminSession()
      .then(() => setAuthChecked(true))
      .catch(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!DEV_PAGES.includes(nav.page)) return;
    syncDevSession()
      .then(ok => { setDevAuthorized(ok); setDevAuthChecked(true); })
      .catch(() => { setDevAuthorized(false); setDevAuthChecked(true); });
  }, [nav.page]);

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
        {nav.page === 'home' && <Home />}
        {nav.page === 'shop' && <Shop />}
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
