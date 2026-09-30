import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Zap, Tag, VolumeX } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useNavigation } from '../../context/NavigationContext';
import { resolveProductImage, onImageError } from '../../lib/imageFallback';
import type { PromoSlide } from '../../types';

function buildFallbackSlides(products: any[]): PromoSlide[] {
  const preferred = products
    .map((p, originalIndex) => {
      const text = (p.name + ' ' + (p.description || '') + ' ' + (p.categories?.name || '')).toLowerCase();
      const score =
        (/(microphone|mic|boya|wireless mic|wm-)/.test(text) ? 40 : 0) +
        (/(tripod|stand|phone holder|mount)/.test(text) ? 30 : 0) +
        (/(light|ring|led|rgb|fill light)/.test(text) ? 30 : 0) +
        (/(vlog|vlogging|creator|studio|podcast)/.test(text) ? 20 : 0);
      return { p, score, originalIndex };
    })
    .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex)
    .filter(x => x.score > 0);

  const picked = (preferred.length ? preferred : products.map((p, originalIndex) => ({ p, score: 0, originalIndex }))).slice(0, 3);

  return picked.map(({ p }, i): PromoSlide => ({
    id: 'demo-' + p.id, enabled: true, order: i, product_id: p.id,
    image_url: p.image_url, title: p.name, price: p.price, old_price: p.original_price,
    badge: i === 0 ? 'TOP PICK' : i === 1 ? 'BEST VALUE' : 'FEATURED',
    description: p.description?.split('.').map((s: string) => s.trim()).filter(Boolean)[0] || 'Quality creator gear for interviews, vlogging and everyday content.',
    features: ['Versatile', 'Affordable', 'Creator friendly'],
  }));
}

export function PromotionalSlider() {
  const { settings } = useSiteSettings();
  const { products } = useProducts();
  const { navigate } = useNavigation();
  const cfg = settings.design_settings.promoSlider;
  const [index, setIndex] = useState(0);

  const slides = useMemo(() => {
    const configured = [...(cfg.slides || [])].filter(s => s.enabled).sort((a, b) => a.order - b.order);
    return configured.length ? configured : buildFallbackSlides(products);
  }, [cfg.slides, products]);

  useEffect(() => { if (index >= slides.length) setIndex(0); }, [slides.length, index]);

  useEffect(() => {
    if (!cfg.auto_play || slides.length < 2) return;
    const id = window.setInterval(() => setIndex(i => (i + 1) % slides.length), Math.max(2500, cfg.auto_play_ms || 4500));
    return () => window.clearInterval(id);
  }, [cfg.auto_play, cfg.auto_play_ms, slides.length]);

  if (!cfg.enabled || !slides.length) return null;

  const featureIcons = [Zap, Tag, VolumeX];

  return (
    <section className="bg-white py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#e8e9f0] bg-[#f5f6fb] shadow-sm min-h-[410px] sm:min-h-[430px]">
          {cfg.show_arrows && slides.length > 1 && (
            <>
              <button aria-label="Previous promotion" onClick={() => setIndex(i => (i - 1 + slides.length) % slides.length)} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 border border-gray-200 text-gray-700 shadow-md flex items-center justify-center hover:bg-white hover:text-orange-500 transition-colors">
                <ChevronLeft size={20}/>
              </button>
              <button aria-label="Next promotion" onClick={() => setIndex(i => (i + 1) % slides.length)} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 border border-gray-200 text-gray-700 shadow-md flex items-center justify-center hover:bg-white hover:text-orange-500 transition-colors">
                <ChevronRight size={20}/>
              </button>
            </>
          )}

          <div
            className="flex w-full transition-transform duration-700 ease-in-out will-change-transform"
            style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
          >
            {slides.map((slideItem) => {
              const itemProduct = products.find(p => p.id === slideItem.product_id);
              const itemImage = resolveProductImage(slideItem.image_url || itemProduct?.image_url);
              const itemGo = () => itemProduct ? navigate('product', { productSlug: itemProduct.slug }) : navigate('shop');

              return (
                <article key={slideItem.id} className="min-w-full w-full shrink-0 min-h-[410px] sm:min-h-[430px] flex items-center">
                  <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_1.05fr_0.8fr] items-center gap-2 sm:gap-4 px-10 sm:px-14 md:px-14 py-10 sm:py-12">
                    <div className="min-w-0 md:pr-3 order-1">
                      {slideItem.badge && <p className="text-[10px] sm:text-xs font-black tracking-[0.22em] text-gray-500 uppercase mb-3">{slideItem.badge}</p>}
                      <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black leading-[1.02] tracking-tight text-[#17213b]">{slideItem.title}</h2>
                      <p className="mt-4 text-sm sm:text-[15px] leading-6 text-gray-500 max-w-md">{slideItem.description}</p>
                      <div className="mt-6 flex flex-wrap gap-3">
                        {(slideItem.features || []).slice(0, 3).map((feature, i) => {
                          const Icon = featureIcons[i] || Zap;
                          return (
                            <div key={i} className="flex flex-col items-center gap-1.5 min-w-[68px]">
                              <div className="w-10 h-10 rounded-full bg-[#dfe3f1] text-[#26345d] flex items-center justify-center"><Icon size={17} strokeWidth={2.2}/></div>
                              <span className="text-[9px] font-black uppercase tracking-wider text-[#5f6880] text-center">{feature}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="order-2 flex items-center justify-center min-w-0">
                      <div className="w-full h-[210px] sm:h-[270px] md:h-[330px] flex items-center justify-center">
                        <img src={itemImage} alt={slideItem.title} onError={e => onImageError(e, slideItem.title)} className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-[0_16px_22px_rgba(15,23,42,0.12)]"/>
                      </div>
                    </div>

                    <div className="order-3 md:pl-3 flex flex-col items-start md:items-center md:text-left">
                      <div className="w-full max-w-[210px]">
                        <span className="inline-flex px-3 py-1 rounded-full bg-[#d8a53c] text-[#1d2437] text-[9px] font-black tracking-wider uppercase mb-3">{slideItem.badge === 'TOP PICK' ? 'BEST VALUE' : (slideItem.badge || 'BEST VALUE')}</span>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl sm:text-4xl font-black text-[#17213b]"><span className="text-xs font-bold mr-1 align-middle">Rs</span>{Number(slideItem.price || itemProduct?.price || 0).toLocaleString()}</span>
                        </div>
                        {slideItem.old_price && <div className="text-xs text-gray-400 mt-1 line-through">Rs {Number(slideItem.old_price).toLocaleString()}</div>}
                        <p className="mt-2 text-xs sm:text-sm leading-5 text-gray-500 max-w-[190px]">Crystal clear quality. Perfect for creators on the go.</p>
                        <button onClick={itemGo} className="mt-5 inline-flex items-center justify-center gap-2 bg-[#17213b] hover:bg-[#111827] text-white font-black px-6 py-3 rounded-lg shadow-md transition-colors">Shop Now <ArrowRight size={16}/></button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {cfg.show_dots && slides.length > 1 && (
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
              {slides.map((s, i) => (
                <button key={s.id} aria-label={'Go to slide '+(i+1)} onClick={() => setIndex(i)} className={'h-1.5 rounded-full transition-all '+(i===index?'w-7 bg-[#17213b]':'w-2 bg-gray-300')}/>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
