import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Heart, ShoppingCart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { resolveProductImage, onImageError } from '../../lib/imageFallback';
import type { Product } from '../../types';

const KEY='abr_recently_viewed';

export function RecentlyViewed() {
  const { settings }=useSiteSettings();
  const { navigate }=useNavigation();
  const { addItem }=useCart();
  const { toggleItem, isInWishlist }=useWishlist();
  const { showToast }=useToast();
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

  if(!cfg.enabled||!products.length)return null;

  const scrollTo=(index:number)=>{
    const safe=(index+products.length)%products.length;
    setActive(safe);
    const e=document.getElementById('abr-recent-scroll');
    const card=e?.querySelector<HTMLElement>('[data-recent-card]');
    if(e&&card)e.scrollTo({left:safe*(card.offsetWidth+16),behavior:'smooth'});
  };

  const move=(direction:number)=>{if(products.length>1)scrollTo(active+direction);};

  return <section className="bg-white py-10 border-t border-gray-100">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 text-gray-400 text-xs font-black uppercase tracking-widest"><Eye size={15}/> Your activity</div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{cfg.heading}</h2>
        </div>
        {products.length>1&&<div className="flex gap-2">
          <button aria-label="Previous recently viewed" onClick={()=>move(-1)} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:text-orange-500 hover:border-orange-300 transition-colors"><ChevronLeft size={18}/></button>
          <button aria-label="Next recently viewed" onClick={()=>move(1)} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:text-orange-500 hover:border-orange-300 transition-colors"><ChevronRight size={18}/></button>
        </div>}
      </div>

      <div id="abr-recent-scroll" className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p,i)=>{
          const wished=isInWishlist(p.id);
          const width=products.length===1?'w-full sm:max-w-sm':'w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(20%-13px)]';
          return <article key={p.id} data-recent-card className={`snap-start shrink-0 ${width} bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 hover:shadow-md transition-all`}>
            <div className="relative aspect-square bg-white flex items-center justify-center p-3">
              <button type="button" aria-label={wished?'Remove from wishlist':'Add to wishlist'} onClick={()=>toggleItem(p)} className={`absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-white/95 border border-gray-200 shadow-sm flex items-center justify-center transition-colors ${wished?'text-orange-500':'text-gray-500 hover:text-orange-500'}`}>
                <Heart size={17} fill={wished?'currentColor':'none'}/>
              </button>
              <button type="button" onClick={()=>navigate('product',{productSlug:p.slug})} className="w-full h-full flex items-center justify-center">
                <img src={resolveProductImage(p.image_url)} alt={p.name} loading="lazy" decoding="async" onError={e=>onImageError(e,p.name)} className="max-w-full max-h-full object-contain"/>
              </button>
            </div>
            <div className="p-3">
              <button type="button" onClick={()=>navigate('product',{productSlug:p.slug})} className="text-left w-full">
                <p className="font-bold text-sm text-gray-900 line-clamp-2 min-h-[2.5rem] hover:text-orange-500">{p.name}</p>
              </button>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-black text-orange-500 text-sm">Rs. {p.price.toLocaleString()}</span>
                {p.original_price&&<span className="text-xs text-gray-400 line-through">Rs. {p.original_price.toLocaleString()}</span>}
              </div>
              <button type="button" onClick={()=>{addItem(p);showToast('Your product has been added to cart','cart');}} className="mt-3 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                <ShoppingCart size={14}/> Add to Cart
              </button>
            </div>
          </article>;
        })}
      </div>

      {products.length>1&&<div className="flex justify-center gap-1.5 mt-3">
        {products.map((_,i)=><button key={i} aria-label={`Go to recently viewed item ${i+1}`} onClick={()=>scrollTo(i)} className={`h-1.5 rounded-full transition-all ${i===active?'w-7 bg-orange-500':'w-2 bg-gray-300'}`}/>)}
      </div>}
    </div>
  </section>;
}
