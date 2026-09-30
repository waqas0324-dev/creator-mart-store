import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useProducts } from '../../hooks/useProducts';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { resolveProductImage, onImageError } from '../../lib/imageFallback';
import type { PromoSlide } from '../../types';

const DEFAULT_FEATURES = ['Fast Delivery', 'Cash on Delivery', '7 Days Return'];

export function PromotionalSlider() {
  const { navigate } = useNavigation();
  const { products, loading } = useProducts();
  const { settings } = useSiteSettings();
  const config = settings.design_settings.promoSlider;
  const [active, setActive] = useState(0);

  const fallbackSlides = useMemo<PromoSlide[]>(() => products.slice(0, 5).map((product, index) => ({
    id: `auto-${product.id}`, enabled: true, order: index, product_id: product.id, image_url: product.image_url,
    title: product.name, price: product.price, old_price: product.original_price,
    badge: product.discount_percent ? `-${product.discount_percent}%` : 'Featured',
    description: product.description?.slice(0, 150) || 'Premium creator gear for your setup.', features: DEFAULT_FEATURES,
  })), [products]);

  const configured = (config.slides || []).filter(s => s.enabled).slice().sort((a,b) => a.order - b.order);
  const slides = configured.length ? configured : fallbackSlides;

  useEffect(() => { if (active >= slides.length) setActive(0); }, [active, slides.length]);
  useEffect(() => {
    if (!config.auto_play || slides.length < 2) return;
    const timer = window.setInterval(() => setActive(prev => (prev + 1) % slides.length), Math.max(2500, config.auto_play_ms));
    return () => window.clearInterval(timer);
  }, [config.auto_play, config.auto_play_ms, slides.length]);

  if (!config.enabled || (!loading && slides.length === 0)) return null;
  const slide = slides[active];
  const product = slide.product_id ? products.find(p => p.id === slide.product_id) : undefined;
  const image = slide.image_url || product?.image_url || '';

  return <section className="bg-white py-8 sm:py-10">
    <div className="max-w-7xl mx-auto px-4">
      <div className="relative overflow-hidden shadow-sm border border-orange-100" style={{ background: config.background, color: config.text_color, borderRadius: config.radius }}>
        <div className="relative grid md:grid-cols-[1.05fr_0.95fr] items-center min-h-[390px] sm:min-h-[430px]">
          <div className="p-6 sm:p-10 lg:p-14 order-2 md:order-1">
            {config.heading && <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600 mb-2">{config.heading}</p>}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight max-w-xl">{slide.title}</h2>
            {config.subheading && <p className="text-sm text-gray-500 mt-3">{config.subheading}</p>}
            {slide.badge && <span className="inline-flex mt-4 rounded-full bg-orange-500 text-white text-xs font-black px-3 py-1">{slide.badge}</span>}
            {slide.description && <p className="text-sm sm:text-base text-gray-600 mt-4 max-w-xl leading-6">{slide.description}</p>}
            <div className="flex flex-wrap gap-2 mt-5">{slide.features.slice(0,3).filter(Boolean).map(f => <span key={f} className="rounded-full bg-white/80 border border-orange-100 px-3 py-1.5 text-xs font-bold text-gray-700">{f}</span>)}</div>
            <div className="flex items-end gap-3 mt-6"><span className="text-2xl font-black text-orange-600">Rs. {Number(slide.price || product?.price || 0).toLocaleString()}</span>{(slide.old_price || product?.original_price) && <span className="text-sm text-gray-400 line-through">Rs. {Number(slide.old_price || product?.original_price).toLocaleString()}</span>}</div>
            <button onClick={() => product?.slug && navigate('product', { productSlug: product.slug })} disabled={!product?.slug} className="mt-6 inline-flex items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-3 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50">Shop Now</button>
          </div>
          <div className="relative min-h-[270px] md:min-h-[390px] flex items-center justify-center p-6 sm:p-10 order-1 md:order-2 bg-white/45">
            {image ? <img src={resolveProductImage(image)} alt={slide.title} className="max-h-[300px] sm:max-h-[360px] md:max-h-[390px] w-full object-contain drop-shadow-xl" loading="lazy" decoding="async" onError={e => onImageError(e, slide.title)} /> : <div className="text-sm text-gray-400">Add a product image in Developer Studio.</div>}
          </div>
          {config.show_arrows && slides.length > 1 && <><button type="button" onClick={() => setActive(prev => (prev - 1 + slides.length) % slides.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-md border border-gray-200 text-gray-700 hover:text-orange-500 flex items-center justify-center z-20" aria-label="Previous slide"><ChevronLeft size={20}/></button><button type="button" onClick={() => setActive(prev => (prev + 1) % slides.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-md border border-gray-200 text-gray-700 hover:text-orange-500 flex items-center justify-center z-20" aria-label="Next slide"><ChevronRight size={20}/></button></>}
          {config.show_dots && slides.length > 1 && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">{slides.map((s,i)=><button key={s.id} type="button" onClick={()=>setActive(i)} aria-label={`Go to slide ${i+1}`} className={`h-2 rounded-full transition-all ${i===active?'w-7 bg-orange-500':'w-2 bg-gray-300'}`}/>)}</div>}
        </div>
      </div>
    </div>
  </section>;
}
