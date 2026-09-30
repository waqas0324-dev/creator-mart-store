import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useNavigation } from '../../context/NavigationContext';
import { resolveProductImage, onImageError } from '../../lib/imageFallback';
import type { PromoSlide } from '../../types';

export function PromotionalSlider() {
  const { settings } = useSiteSettings();
  const { products } = useProducts();
  const { navigate } = useNavigation();
  const cfg = settings.design_settings.promoSlider;
  const [index, setIndex] = useState(0);
  const slides = useMemo(() => {
    const configured = [...(cfg.slides || [])].filter(s => s.enabled).sort((a,b) => a.order - b.order);
    if (configured.length) return configured;
    return products.slice(0, 5).map((p, i): PromoSlide => ({
      id: 'auto-' + p.id, enabled: true, order: i, product_id: p.id, image_url: p.image_url,
      title: p.name, price: p.price, old_price: p.original_price,
      badge: p.discount_percent ? '-' + p.discount_percent + '%' : 'FEATURED',
      description: p.description?.split('.').map(s => s.trim()).filter(Boolean)[0] || 'Quality creator gear for your everyday setup.',
      features: p.description?.split('.').map(s => s.trim()).filter(Boolean).slice(0,3) || ['Quality build','Creator friendly','Nationwide delivery'],
    }));
  }, [cfg.slides, products]);
  useEffect(() => { if (index >= slides.length) setIndex(0); }, [slides.length, index]);
  useEffect(() => {
    if (!cfg.auto_play || slides.length < 2) return;
    const id = window.setInterval(() => setIndex(i => (i + 1) % slides.length), Math.max(2500, cfg.auto_play_ms || 4500));
    return () => window.clearInterval(id);
  }, [cfg.auto_play, cfg.auto_play_ms, slides.length]);
  if (!cfg.enabled || !slides.length) return null;
  const slide = slides[index];
  const product = products.find(p => p.id === slide.product_id);
  const go = () => product ? navigate('product', { productSlug: product.slug }) : navigate('shop');
  return <section className="bg-white py-10">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div><div className="flex items-center gap-2 text-orange-500 text-xs font-black uppercase tracking-widest"><Sparkles size={15}/> ABR Gadgets</div><h2 className="text-2xl font-black text-gray-900 mt-1">{cfg.heading}</h2><p className="text-sm text-gray-500 mt-1">{cfg.subheading}</p></div>
        {cfg.show_arrows && slides.length > 1 && <div className="flex gap-2"><button aria-label="Previous promotion" onClick={() => setIndex(i => (i - 1 + slides.length) % slides.length)} className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:border-orange-400 hover:text-orange-500 shadow-sm flex items-center justify-center"><ChevronLeft size={20}/></button><button aria-label="Next promotion" onClick={() => setIndex(i => (i + 1) % slides.length)} className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:border-orange-400 hover:text-orange-500 shadow-sm flex items-center justify-center"><ChevronRight size={20}/></button></div>}
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-gray-50 shadow-sm">
        <div className="grid md:grid-cols-[0.9fr_1.1fr] min-h-[340px]">
          <div className="p-6 sm:p-9 flex items-center justify-center bg-white/70"><div className="w-full h-[260px] sm:h-[320px] flex items-center justify-center"><img src={resolveProductImage(slide.image_url || product?.image_url)} alt={slide.title} onError={e=>onImageError(e,slide.title)} className="max-w-full max-h-full w-auto h-auto object-contain mix-blend-multiply drop-shadow-xl" /></div></div>
          <div className="p-6 sm:p-10 flex flex-col justify-center">
            {slide.badge && <span className="w-fit px-3 py-1 rounded-full bg-orange-500 text-white text-[11px] font-black tracking-wide mb-3">{slide.badge}</span>}
            <h3 className="text-2xl sm:text-4xl font-black text-gray-900 leading-tight">{slide.title}</h3>
            <p className="text-gray-600 mt-3 text-sm sm:text-base max-w-xl">{slide.description}</p>
            <div className="flex flex-wrap gap-2 mt-4">{(slide.features || []).slice(0,3).map((f,i)=><span key={i} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700">{f}</span>)}</div>
            <div className="flex items-center gap-3 mt-5"><span className="text-2xl font-black text-orange-500">Rs. {Number(slide.price || product?.price || 0).toLocaleString()}</span>{slide.old_price && <span className="text-sm text-gray-400 line-through">Rs. {Number(slide.old_price).toLocaleString()}</span>}</div>
            <button onClick={go} className="mt-5 w-fit inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20">Shop Now <ArrowRight size={18}/></button>
          </div>
        </div>
        {cfg.show_dots && slides.length > 1 && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">{slides.map((s,i)=><button key={s.id} aria-label={'Go to slide '+(i+1)} onClick={()=>setIndex(i)} className={'h-1.5 rounded-full transition-all '+(i===index?'w-7 bg-orange-500':'w-2 bg-gray-300')}/>)}</div>}
      </div>
    </div>
  </section>;
}
