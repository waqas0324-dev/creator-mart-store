import { Truck, Banknote, RotateCcw, ShieldCheck, ChevronRight, Star } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useProducts, useCategories } from '../hooks/useProducts';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { ProductCard } from '../components/Product/ProductCard';
import { onImageError, resolveCategoryImage } from '../lib/imageFallback';

export function Home() {
  const { navigate } = useNavigation();
  const { products: featuredProducts, loading: featuredLoading } = useProducts({ featured: true });
  const { products: bestSellers, loading: bestsellersLoading } = useProducts({ bestseller: true });
  const { categories, loading: categoriesLoading } = useCategories();
  const { settings: hero } = useSiteSettings();
  const design = hero.design_settings;

  return (
    <div>
      {/* Hero Section — a single self-contained banner image, with the
          call-to-action buttons in a strip right below it */}
      <section className="bg-white" style={{ border: design.hero.borderWidth + "px solid " + design.hero.borderColor, borderRadius: design.hero.radius, boxShadow: design.hero.shadow === "none" ? "none" : "0 10px 30px rgba(0,0,0,0.12)" }}>
        <img
          src={hero.hero_image_url}
          alt="ABR Gadgets — Gear Up Your Creativity"
          className="w-full h-auto block"
        />
        <div className="bg-[#111827] py-4">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('shop')}
              className="text-white px-8 py-3 transition-all hover:scale-105 active:scale-[0.98] shadow-lg shadow-orange-500/30" style={{ backgroundColor: design.buttons.bgColor, color: design.buttons.textColor, borderRadius: design.buttons.radius, fontWeight: design.buttons.fontWeight, transitionDuration: design.buttons.transitionMs + "ms" }}
            >
              Shop Now
            </button>
            <button
              onClick={() => navigate('best-sellers')}
              className="border-2 border-white/30 text-white hover:border-orange-500 hover:text-orange-400 font-bold px-8 py-3 rounded-lg transition-all"
            >
              View Deals
            </button>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { Icon: Truck, title: 'FAST DELIVERY', sub: 'All Over Pakistan' },
            { Icon: Banknote, title: 'CASH ON DELIVERY', sub: 'Pay When You Receive' },
            { Icon: RotateCcw, title: '7 DAYS RETURN', sub: 'No Questions Asked' },
            { Icon: ShieldCheck, title: '100% ORIGINAL', sub: 'Original Products' },
          ].map(({ Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-orange-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="bg-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">Featured Categories</h2>
            <button onClick={() => navigate('shop')} className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-semibold transition-colors">
              View All <ChevronRight size={16} />
            </button>
          </div>
          {categoriesLoading ? (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {[...Array(8)].map((_, i) => <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-24" />)}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigate('shop', { categorySlug: cat.slug })}
                  className="group bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-orange-300 hover:shadow-md hover:bg-white transition-all duration-200 flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-orange-300 transition-colors">
                    <img
                      src={resolveCategoryImage(cat.image_url)}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => onImageError(e, cat.name)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-800 leading-tight">{cat.name}</p>
                    <p className="text-xs text-gray-400">{cat.product_count}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">Featured Products</h2>
            <button onClick={() => navigate('shop')} className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-semibold transition-colors">
              View All <ChevronRight size={16} />
            </button>
          </div>
          {featuredLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-64" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {featuredProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="bg-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Star size={20} className="fill-orange-500 text-orange-500" />
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">Best Sellers</h2>
            </div>
            <button onClick={() => navigate('best-sellers')} className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-semibold transition-colors">
              View All <ChevronRight size={16} />
            </button>
          </div>
          {bestsellersLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-64" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {bestSellers.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
