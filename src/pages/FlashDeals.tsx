import { Zap, Clock } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/Product/ProductCard';

export function FlashDeals() {
  const { navigate } = useNavigation();
  const { products, loading } = useProducts();

  const dealProducts = products.filter(p => p.discount_percent && p.discount_percent > 0);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Zap size={32} className="fill-white" />
            <h1 className="text-4xl font-black">FLASH DEALS</h1>
            <Zap size={32} className="fill-white" />
          </div>
          <p className="text-orange-100 text-lg mb-4">Limited time offers — Don't miss out!</p>
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-xl px-5 py-2">
            <Clock size={18} />
            <span className="font-bold text-sm">New deals updated daily</span>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-semibold">Flash Deals</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Discount badges legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[10, 15, 20, 25, 30, 35].map(pct => (
            <span key={pct} className="bg-orange-100 text-orange-700 font-bold text-xs px-3 py-1 rounded-full">
              Up to {pct}% off
            </span>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-64" />)}
          </div>
        ) : dealProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl">
            <Zap size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-semibold">No deals available right now. Check back soon!</p>
            <button onClick={() => navigate('shop')} className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold">
              Browse All Products
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{dealProducts.length} deals available</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {dealProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
