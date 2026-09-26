import { Star, Trophy } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/Product/ProductCard';
import { useSEO } from '../hooks/useSEO';
import { BRAND_NAME } from '../lib/brand';

export function BestSellers() {
  const { navigate } = useNavigation();
  const { products, loading } = useProducts({ bestseller: true });

  useSEO({
    title: `Best Sellers - Top Rated Creator Gear | ${BRAND_NAME}`,
    description: `Our most loved and highest rated content-creator gear in Pakistan. Cash on Delivery, fast shipping, easy returns.`,
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Banner */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy size={28} />
            <h1 className="text-4xl font-black">BEST SELLERS</h1>
            <Trophy size={28} />
          </div>
          <p className="text-yellow-100 text-lg">Our most loved & highest rated products</p>
          <div className="flex items-center justify-center gap-1 mt-3">
            {[1,2,3,4,5].map(i => <Star key={i} size={20} className="fill-white text-white" />)}
            <span className="ml-2 font-bold">Top Rated by Customers</span>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-semibold">Best Sellers</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-64" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 font-semibold">No bestsellers yet.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{products.length} bestselling products</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product, i) => (
                <div key={product.id} className="relative">
                  {i < 3 && (
                    <span className={`absolute top-2 left-2 z-10 text-white text-xs font-black px-2 py-0.5 rounded-full ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-orange-600'}`}>
                      #{i + 1}
                    </span>
                  )}
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
