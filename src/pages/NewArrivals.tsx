import { Sparkles } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import type { Product } from '../types';
import { ProductCard } from '../components/Product/ProductCard';

export function NewArrivals() {
  const { navigate } = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProducts((data as Product[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Banner */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles size={28} className="text-orange-400" />
            <h1 className="text-4xl font-black">NEW ARRIVALS</h1>
            <Sparkles size={28} className="text-orange-400" />
          </div>
          <p className="text-gray-300 text-lg">Freshly stocked — just in for you!</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-semibold">New Arrivals</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-64" />)}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{products.length} new products</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product, i) => (
                <div key={product.id} className="relative">
                  {i < 6 && (
                    <span className="absolute top-2 right-2 z-10 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
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
