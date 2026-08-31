import { Truck, Banknote, RotateCcw, ShieldCheck, ChevronRight, Zap, Star, Package } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useProducts, useCategories } from '../hooks/useProducts';
import { ProductCard } from '../components/Product/ProductCard';
import { onImageError } from '../lib/imageFallback';

export function Home() {
  const { navigate } = useNavigation();
  const { products: featuredProducts, loading: featuredLoading } = useProducts({ featured: true });
  const { products: bestSellers, loading: bestsellersLoading } = useProducts({ bestseller: true });
  const { categories, loading: categoriesLoading } = useCategories();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-[#111827] relative overflow-hidden min-h-[340px] md:min-h-[420px] flex items-center">
        {/* Full-width product image as background, right-aligned */}
        <div className="absolute inset-0 flex justify-end items-center pointer-events-none select-none">
          <img
            src="/images/files_10673984-2026-06-24T14-23-35-667Z-image.webp"
            alt=""
            className="h-full max-h-[420px] w-auto object-contain object-right opacity-95"
          />
        </div>
        {/* Gradient overlay so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/80 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 md:py-16 w-full">
          <div className="max-w-lg">
            <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">PAKISTAN NO.1</p>
            <h1 className="text-5xl md:text-6xl font-black leading-tight mb-2">
              <span className="text-orange-500">ABR</span>{' '}
              <span className="text-white">SHOP</span>
            </h1>
            <p className="text-gray-300 text-base font-medium mb-0.5">Premium Quality Products</p>
            <p className="text-gray-400 text-sm mb-6">For Content Creators</p>

            <div className="flex flex-col gap-2 mb-7">
              {['Cash on Delivery', '7 Days Return', 'Fast Delivery'].map(text => (
                <div key={text} className="flex items-center gap-2.5 text-sm text-gray-200">
                  <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  {text}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('shop')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-lg transition-all hover:scale-105 shadow-lg shadow-orange-500/30"
              >
                Shop Now
              </button>
              <button
                onClick={() => navigate('flash-deals')}
                className="border-2 border-white/30 text-white hover:border-orange-500 hover:text-orange-400 font-bold px-8 py-3 rounded-lg transition-all"
              >
                View Deals
              </button>
              {/* Discount Badge inline with buttons */}
              <div className="bg-orange-500 text-white font-black rounded-full w-20 h-20 flex flex-col items-center justify-center text-center shadow-xl shadow-orange-500/50 ml-2">
                <span className="text-[10px] leading-none uppercase">UP TO</span>
                <span className="text-2xl leading-none font-black">40%</span>
                <span className="text-[10px] leading-none uppercase">OFF</span>
              </div>
            </div>
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

      {/* Quick Nav Banners */}
      <section className="bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('flash-deals')}
            className="flex items-center gap-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-5 hover:from-orange-600 hover:to-orange-700 transition-all hover:scale-[1.02] shadow-md"
          >
            <Zap size={28} className="flex-shrink-0" />
            <div className="text-left">
              <p className="font-black text-lg leading-none">Flash Deals</p>
              <p className="text-orange-100 text-sm">Up to 40% off today!</p>
            </div>
          </button>
          <button
            onClick={() => navigate('new-arrivals')}
            className="flex items-center gap-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl p-5 hover:from-gray-900 hover:to-black transition-all hover:scale-[1.02] shadow-md"
          >
            <Package size={28} className="flex-shrink-0" />
            <div className="text-left">
              <p className="font-black text-lg leading-none">New Arrivals</p>
              <p className="text-gray-300 text-sm">Freshly stocked items</p>
            </div>
          </button>
          <button
            onClick={() => navigate('best-sellers')}
            className="flex items-center gap-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl p-5 hover:from-yellow-600 hover:to-orange-600 transition-all hover:scale-[1.02] shadow-md"
          >
            <Star size={28} className="flex-shrink-0" />
            <div className="text-left">
              <p className="font-black text-lg leading-none">Best Sellers</p>
              <p className="text-yellow-100 text-sm">Most popular products</p>
            </div>
          </button>
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
                      src={cat.image_url}
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
