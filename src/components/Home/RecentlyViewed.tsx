import { useEffect, useState } from 'react';
import { Eye, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useNavigation } from '../../context/NavigationContext';
import { useWishlist } from '../../context/WishlistContext';
import { resolveProductImage, onImageError } from '../../lib/imageFallback';
import type { Product } from '../../types';

const KEY='abr_recently_viewed';

export function RecentlyViewed() {
  const { settings }=useSiteSettings();
  const { navigate }=useNavigation();
  const { toggleItem, isInWishlist }=useWishlist();
  const cfg=settings.design_settings.recentlyViewed;
  const [products,setProducts]=useState<Product[]>([]);
  const [active,setActive]=useState(0);

  const load=async()=>{
    try{
      const ids=JSON.parse(localStorage.getItem(KEY)||'[]') as string[];
      if(!ids.length){setProducts([]);setActive(0);return;}
      const {data}=await supabase.from('products').select('*, categories(id,name,slug)').in('id',ids);
      const map=new Map((data as Product[]||[]).map(p=>[p.id,p]));
      const next=ids.map(id=>map.get(id)).filter(Boolean).slice(0,cfg.max_items) as Product[];
      setProducts(next);
      setActive(prev=>Math.min(prev,Math.max(0,next.length-1)));
    }catch{
      setProducts([]);
      setActive(0);
    }
  };

  useEffect(()=>{
    load();
    const fn=()=>load();
    window.addEventListener('abr-recently-viewed-updated',fn);
    window.addEventListener('storage',fn);
    return()=>{
      window.removeEventListener('abr-recently-viewed-updated',fn);
      window.removeEventListener('storage',fn);
    };
  },[cfg.max_items]);

  useEffect(()=>{
    if(!cfg.auto_play||products.length<2)return;
    const interval=Math.min(5000,Math.max(2000,cfg.auto_play_ms||4000));
    const id=window.setInterval(()=>{
      setActive(prev=>{
        const next=(prev+1)%products.length;
        const scroller=document.getElementById('abr-recent-scroll');
        const item=scroller?.querySelector<HTMLElement>('[data-recent-item]');
        if(scroller&&item) scroller.scrollTo({left:next*(item.offsetWidth+32),behavior:'smooth'});
        return next;
      });
    },interval);
    return()=>window.clearInterval(id);
  },[cfg.auto_play,cfg.auto_play_ms,products.length]);

  if(!cfg.enabled||!products.length)return null;

  return <section className="bg-white py-7 sm:py-8 border-t border-gray-100">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm font-bold border-b border-gray-200 pb-3 mb-4">
        <Eye size={15} className="text-gray-400"/>
        <h2 className="font-bold text-gray-700">{cfg.heading || 'Recently Viewed Products'}</h2>
      </div>

      <div id="abr-recent-scroll" className="flex gap-8 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p,i)=>{
          const wished=isInWishlist(p.id);
          return <div key={p.id} data-recent-item className="relative shrink-0 w-[155px] sm:w-[190px] lg:w-[220px]">
            <button
              type="button"
              onClick={()=>navigate('product',{productSlug:p.slug})}
              className="group w-full text-left"
              aria-label={p.name}
            >
              <div className="relative h-24 sm:h-28 lg:h-32 flex items-center justify-center">
                <img
                  src={resolveProductImage(p.image_url)}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  onError={e=>onImageError(e,p.name)}
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <p className="mt-2 text-xs sm:text-sm font-semibold text-gray-700 leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors">
                {p.name}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-orange-500">Rs. {p.price.toLocaleString()}</span>
                {p.original_price&&<span className="text-[10px] sm:text-xs text-gray-400 line-through">Rs. {p.original_price.toLocaleString()}</span>}
              </div>
            </button>
            <button
              type="button"
              aria-label={wished?'Remove from wishlist':'Add to wishlist'}
              onClick={()=>toggleItem(p)}
              className={`absolute top-0 right-0 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors ${wished?'text-orange-500':''}`}
            >
              <Heart size={15} fill={wished?'currentColor':'none'}/>
            </button>
          </div>;
        })}
      </div>
    </div>
  </section>;
}
