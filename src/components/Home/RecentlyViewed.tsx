import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useNavigation } from '../../context/NavigationContext';
import { resolveProductImage, onImageError } from '../../lib/imageFallback';
import type { Product } from '../../types';

const KEY='abr_recently_viewed';
export function RecentlyViewed() {
  const { settings }=useSiteSettings(); const { navigate }=useNavigation(); const cfg=settings.design_settings.recentlyViewed;
  const [products,setProducts]=useState<Product[]>([]); const tick=useRef(0);
  const load=async()=>{try{const ids=JSON.parse(localStorage.getItem(KEY)||'[]') as string[];if(!ids.length){setProducts([]);return;}const {data}=await supabase.from('products').select('*, categories(id,name,slug)').in('id',ids);const map=new Map((data as Product[]||[]).map(p=>[p.id,p]));setProducts(ids.map(id=>map.get(id)).filter(Boolean).slice(0,cfg.max_items) as Product[]);}catch{setProducts([]);}};
  useEffect(()=>{load();const fn=()=>load();window.addEventListener('abr-recently-viewed-updated',fn);window.addEventListener('storage',fn);return()=>{window.removeEventListener('abr-recently-viewed-updated',fn);window.removeEventListener('storage',fn);};},[cfg.max_items]);
  useEffect(()=>{if(!cfg.auto_play||products.length<3)return;const id=window.setInterval(()=>{tick.current=(tick.current+1)%products.length;const e=document.getElementById('abr-recent-scroll');if(e)e.scrollBy({left:e.clientWidth/(window.innerWidth<640?2:window.innerWidth<1024?3:5),behavior:'smooth'});},Math.max(3000,cfg.auto_play_ms||3500));return()=>window.clearInterval(id);},[cfg.auto_play,cfg.auto_play_ms,products.length]);
  if(!cfg.enabled||!products.length)return null;
  return <section className="bg-white py-10 border-t border-gray-100"><div className="max-w-7xl mx-auto px-4">
    <div className="flex items-center justify-between mb-5"><div><div className="flex items-center gap-2 text-gray-400 text-xs font-black uppercase tracking-widest"><Eye size={15}/> Your activity</div><h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{cfg.heading}</h2></div>{products.length>1&&<div className="flex gap-2"><button aria-label="Previous recently viewed" onClick={()=>document.getElementById('abr-recent-scroll')?.scrollBy({left:-window.innerWidth/2,behavior:'smooth'})} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:text-orange-500"><ChevronLeft size={18}/></button><button aria-label="Next recently viewed" onClick={()=>document.getElementById('abr-recent-scroll')?.scrollBy({left:window.innerWidth/2,behavior:'smooth'})} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:text-orange-500"><ChevronRight size={18}/></button></div>}</div>
    <div id="abr-recent-scroll" className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{products.map(p=><button key={p.id} onClick={()=>navigate('product',{productSlug:p.slug})} className="snap-start text-left shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(20%-13px)] bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 hover:shadow-md transition-all"><div className="aspect-square bg-white flex items-center justify-center p-3"><img src={resolveProductImage(p.image_url)} alt={p.name} onError={e=>onImageError(e,p.name)} className="max-w-full max-h-full object-contain"/></div><div className="p-3"><p className="font-bold text-sm text-gray-900 line-clamp-2 min-h-[2.5rem]">{p.name}</p><div className="mt-2 flex items-center gap-2"><span className="font-black text-orange-500 text-sm">Rs. {p.price.toLocaleString()}</span>{p.original_price&&<span className="text-xs text-gray-400 line-through">Rs. {p.original_price.toLocaleString()}</span>}</div></div></button>)}</div>
  </div></section>;
}
