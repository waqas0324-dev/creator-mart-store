import { useEffect, useState } from 'react';
import { CartProvider } from './context/CartContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { ToastProvider } from './context/ToastContext';
import { CartDrawer } from './components/CartDrawer';
import { Navbar } from './components/Layout/Navbar';
import { Footer } from './components/Layout/Footer';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Payment } from './pages/Payment';
import { OrderSuccess } from './pages/OrderSuccess';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { FlashDeals } from './pages/FlashDeals';
import { NewArrivals } from './pages/NewArrivals';
import { BestSellers } from './pages/BestSellers';
import { Contact } from './pages/Contact';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminProducts } from './pages/admin/Products';
import { AdminProductForm } from './pages/admin/ProductForm';
import { AdminOrders } from './pages/admin/Orders';
import { syncAdminSession } from './lib/adminAuth';

const ADMIN_PAGES = ['admin', 'admin-login', 'admin-products', 'admin-orders', 'admin-product-form'];

function Router() {
  const { nav, navigate } = useNavigation();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#admin') {
      navigate('admin-login');
      history.replaceState(null, '', window.location.pathname);
    }
  }, [navigate]);

  useEffect(() => {
    syncAdminSession().then(() => setAuthChecked(true));
  }, []);

  if (nav.page === 'admin-login') return <AdminLogin />;

  if (ADMIN_PAGES.includes(nav.page)) {
    if (!authChecked) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    if (nav.page === 'admin') return <AdminDashboard />;
    if (nav.page === 'admin-products') return <AdminProducts />;
    if (nav.page === 'admin-product-form') return <AdminProductForm />;
    if (nav.page === 'admin-orders') return <AdminOrders />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        {nav.page === 'home' && <Home />}
        {nav.page === 'shop' && <Shop />}
        {nav.page === 'product' && <ProductDetail />}
        {nav.page === 'cart' && <Cart />}
        {nav.page === 'checkout' && <Checkout />}
        {nav.page === 'payment' && <Payment />}
        {nav.page === 'order-success' && <OrderSuccess />}
        {nav.page === 'track-order' && <TrackOrderPage />}
        {nav.page === 'flash-deals' && <FlashDeals />}
        {nav.page === 'new-arrivals' && <NewArrivals />}
        {nav.page === 'best-sellers' && <BestSellers />}
        {nav.page === 'contact' && <Contact />}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function App() {
  return (
    <NavigationProvider>
      <CartProvider>
        <ToastProvider>
          <Router />
        </ToastProvider>
      </CartProvider>
    </NavigationProvider>
  );
}
