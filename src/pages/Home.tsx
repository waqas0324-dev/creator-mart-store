import React from 'react';
import { Truck, Banknote, RotateCcw, ShieldCheck, ChevronRight, Star } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useProducts, useCategories } from '../hooks/useProducts';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useSEO } from '../hooks/useSEO';
import { BRAND_NAME } from '../lib/brand';
import { ProductCard } from '../components/Product/ProductCard';
import { PromotionalSlider } from '../components/Home/PromotionalSlider';
import { onImageError, resolveCategoryImage } from '../lib/imageFallback';

export function Home() {
  const { navigate } = useNavigation();
  const { products: featuredProducts, loading: featuredLoading } = useProducts({ featured: true });
  const { products: bestSellers, loading: bestsellersLoading } = useProducts({ bestseller: true });
  const { categories, loading: categoriesLoading } = useCategories();
  const { settings: hero } = useSiteSettings();
  const design = hero.design_settings;
  const featuredCategories = categories.filter(cat => !['vlogging-kit', 'blogging-kit'].includes(cat.slug)).slice(0, 6);

  useSEO({
    title: `ABR Gadget | ${BRAND_NAME} - Creator Gear & Gadgets in Pakistan`,
    description: 'ABR Gadget (ABR Gadgets) — shop microphones, ring lights, tripods, phone holders, power banks and creator gear in Pakistan with Cash on Delivery, nationwide delivery and easy returns.',
    image: hero.hero_image_url,
    canonical: window.location.origin + '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: BRAND_NAME,
      alternateName: ['ABR Gadget', 'ABR Shop'],
      url: window.location.origin,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${window.location.origin}/shop?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  });

  return (
    <div>
      {/* Hero Section — a single self-contained banner image, with the
          call-to-action buttons in a strip right below it */}
      <section className={design.animations.enabled ? "bg-white design-hero-animate" : "bg-white"} style={{ borderWidth: design.hero.borderWidth, borderStyle: "solid", borderColor: design.hero.borderColor, borderRadius: design.hero.radius, boxShadow: design.hero.shadow === "none" ? "none" : "0 10px 30px rgba(0,0,0,0.12)", boxSizing: "border-box" }}>
        <div style={{ borderRadius: design.hero.radius, overflow: "hidden" }}>
          <img
            src={hero.hero_image_url}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            alt="ABR Gadgets — Gear Up Your Creativity"
            className="w-full h-auto block"
          />
        </div>
        <div className="bg-[#111827] py-4">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('shop')}
              className={design.animations.enabled ? "text-white px-8 py-3 design-interactive shadow-lg shadow-orange-500/30" : "text-white px-8 py-3 shadow-lg shadow-orange-500/30"} style={{ backgroundColor: design.buttons.bgColor, color: design.buttons.textColor, borderRadius: design.buttons.radius, fontWeight: design.buttons.fontWeight, transitionDuration: design.buttons.transitionMs + "ms", "--design-hover-scale": design.buttons.hoverScale, "--design-click-scale": design.animations.clickScale, "--design-hover-lift": design.animations.hoverLift, "--design-transition": design.buttons.transitionMs + "ms" } as React.CSSProperties}
            >
              Shop Now
            </button>
            <button
              onClick={() => navigate('best-sellers')}
              className={design.animations.enabled ? "border-2 border-white/30 text-white hover:border-orange-500 hover:text-orange-400 font-bold px-8 py-3 rounded-lg design-interactive" : "border-2 border-white/30 text-white hover:border-orange-500 hover:text-orange-400 font-bold px-8 py-3 rounded-lg"} style={{ "--design-hover-scale": design.buttons.hoverScale, "--design-click-scale": design.animations.clickScale, "--design-hover-lift": design.animations.hoverLift, "--design-transition": design.buttons.transitionMs + "ms" } as React.CSSProperties}
            >
              View Deals
            </button>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-gray-100 shadow-sm overflow-visible">
        <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-4 items-center">
          {[
            { Icon: Truck, title: hero.trust_badge_1_title, sub: hero.trust_badge_1_subtitle },
            { Icon: Banknote, title: hero.trust_badge_2_title, sub: hero.trust_badge_2_subtitle },
            { Icon: RotateCcw, title: hero.trust_badge_3_title, sub: hero.trust_badge_3_subtitle },
            { Icon: ShieldCheck, title: hero.trust_badge_4_title, sub: hero.trust_badge_4_subtitle },
          ].map(({ Icon, title, sub }) => (
            <div key={title} className="min-w-0 flex items-center gap-3 py-1">
              <div className="w-11 h-11 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-orange-500" />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight text-gray-900">{title}</p>
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
            <button onClick={() => navigate('categories')} className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-semibold transition-colors">
              View All <ChevronRight size={16} />
            </button>
          </div>
          {categoriesLoading ? (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-24" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
              {featuredCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigate('shop', { categorySlug: cat.slug })}
                  className="group bg-slate-50 rounded-2xl p-2.5 sm:p-3 border border-slate-200 hover:border-orange-200 hover:shadow-sm hover:bg-white transition-all duration-300 flex flex-col items-center gap-2 overflow-hidden min-w-0 min-h-[142px] sm:min-h-[154px]"
                >
                  <div className="relative w-[92px] h-[92px] sm:w-[108px] sm:h-[108px] md:w-[118px] md:h-[118px] rounded-full overflow-hidden border border-slate-200 bg-white shadow-inner group-hover:border-orange-300 transition-colors flex-shrink-0">
                    <img
                      src={resolveCategoryImage(cat.image_url)}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => onImageError(e, cat.name)}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain rounded-full p-0"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-800 leading-tight break-words">{cat.name}</p>
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

      <PromotionalSlider />
      <section className="bg-orange-500 py-7"><div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-white"><div><p className="text-xs font-black uppercase tracking-widest text-orange-100">ABR Gadgets</p><h2 className="text-xl sm:text-2xl font-black">Gear up your creativity</h2><p className="text-sm text-orange-50 mt-1">Creator gear, gadgets and accessories delivered across Pakistan.</p></div><button onClick={()=>navigate('shop')} className="bg-white text-orange-600 font-black px-6 py-3 rounded-xl hover:bg-orange-50 shadow-lg">Shop All Products</button></div></section>

    </div>
  );
}
