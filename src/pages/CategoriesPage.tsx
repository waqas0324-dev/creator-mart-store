import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useCategories } from '../hooks/useProducts';
import { onImageError, resolveCategoryImage } from '../lib/imageFallback';
import { useSEO } from '../hooks/useSEO';
import { BRAND_NAME } from '../lib/brand';

export function CategoriesPage() {
  const { navigate } = useNavigation();
  const { categories, loading } = useCategories();

  useSEO({
    title: `All Categories | ${BRAND_NAME}`,
    description: `Browse all product categories at ${BRAND_NAME}. Choose a category to see its available products.`,
    canonical: window.location.origin + '/categories',
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500 flex items-center gap-2">
          <button onClick={() => navigate('home')} className="hover:text-orange-500 flex items-center gap-1">
            <HomeIcon size={14} /> Home
          </button>
          <span>/</span>
          <span className="font-semibold text-gray-800">All Categories</span>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">ALL CATEGORIES</h1>
            <p className="text-sm text-gray-500 mt-1">Choose a category to view its products.</p>
          </div>
          <button onClick={() => navigate('shop')} className="text-sm font-bold text-orange-500 hover:text-orange-600">Shop All Products</button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <div key={i} className="h-52 rounded-2xl bg-white border border-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {categories.map(category => (
              <button key={category.id} onClick={() => navigate('shop', { categorySlug: category.slug })} className="group bg-white rounded-2xl border border-gray-200 p-4 hover:border-orange-300 hover:shadow-lg transition-all text-left">
                <div className="w-full aspect-square rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center mb-4">
                  <img src={resolveCategoryImage(category.image_url)} alt={category.name} referrerPolicy="no-referrer" onError={(e) => onImageError(e, category.name)} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-black text-gray-900 truncate">{category.name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{category.product_count} product{category.product_count === 1 ? '' : 's'}</p>
                  </div>
                  <ChevronRight size={18} className="text-orange-500 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
