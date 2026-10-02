import { Home, ShoppingBag } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export function NotFound() {
  const { navigate } = useNavigation();

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-16">
      <div className="text-center max-w-md">
        <div className="text-8xl sm:text-9xl font-black text-orange-500 leading-none mb-4">404</div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('home')}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-lg transition-colors"
          >
            <Home size={18} />
            Go Home
          </button>
          <button
            onClick={() => navigate('shop')}
            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-bold px-6 py-3 rounded-lg border border-gray-300 transition-colors"
          >
            <ShoppingBag size={18} />
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
