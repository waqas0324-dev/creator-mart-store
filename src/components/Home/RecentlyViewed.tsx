import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '../../context/NavigationContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useWishlist } from '../../context/WishlistContext';
import { resolveProductImage, onImageError } from '../../lib/imageFallback';
import type { Product } from '../../types';

const STORAGE_KEY='abr_recently_viewed';

export function RecentlyViewed() {
  const { navigate }=useNavigation(); const { settings }=useSiteSettings(); const { toggleItem,isInWishlist }=useWishlist();
  const config=settings.design_settings.recentlyViewed;
  const [ids,setIds]=useState<string[]>([]); const [products,setProducts]=useState<Product[]>([]); const [start,setStart]=useState(0);
  const read=()=>{try{const raw=localStorage.getItem(STORAGE_KEY);setIds(raw?JSON.parse(raw):[]);}catch{setIds([]);}};
  useEffect(()=>{read();const h=()=>read();window.addEventListener('abr-recently-viewed-updated',h);window.addEventListener('storage',h);return()=>{window.removeEventListener('abr-recently-viewed-updated',h);window.removeEventListener('storage',h);};},[]);
  useEffect(()=>{if(!ids.length){setProducts([]);return;}supabase.from('products').select('*, categories(id,name,slug)').in('id',ids).then(({data})=>{const map=new Map(((data as Product[])||[]).map(p=>[p.id,p]));setProducts(ids.map(id=>map.get(id)).filter(Boolean) as Product[]);});},[ids]);
  useEffect(()=>{if(!config.auto_play||products.length<2)return;const t=window.setInterval(()=>{const visible=window.innerWidth>=1024?5:window.innerWidth>=640?3:2;setStart(prev=>prev+1>Math.max(0,products.length-visible)?0:prev+1);},Math.max(2500,config.auto_play_ms));return()=>window.clearInterval(t);},[config.auto_play,config.auto_play_ms,products.length]);
  if(!config.enabled||!products.length)return null;
  const visible=window.innerWidth>=1024?5:window.innerWidth>=640?3:2; const maxStart=Math.max(0,products.length-visible); const current=products.slice(start,start+visible);
  return <section className="bg-gray-50 py-9"><div className="max-w-7xl mx-auto px-4">
    <div className="flex items-center justify-between mb-5"><div><h2 className="text-xl sm:text-2xl font-black text-gray-900">{config.heading}</h2><p className="text-xs text-gray-500 mt-1">Pick up where you left off.</p></div>{products.length>visible&&<div className="flex gap-2"><button type="button" disabled={!start} onClick={()=>setStart(Math.max(0,start-1))} className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center disabled:opacity-30"><ChevronLeft size={18}/></button><button type="button" disabled={start>=maxStart} onClick={()=>setStart(Math.min(maxStart,start+1))} className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center disabled:opacity-30"><ChevronRight size={18}/></button></div>}</div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">{current.map(p=>{const wished=isInWishlist(p.id);return <div key={p.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-gray-50"><div className="relative aspect-square bg-gray-50 overflow-hidden cursor-pointer transition-colors group-hover:bg-gray-100" onClick={()=>navigate('product',{productSlug:p.slug})}><img src={resolveProductImage(p.image_url)} alt={p.name} onError={e=>onImageError(e,p.name)} className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-[1.06]"/><button type="button" onClick={e=>{e.stopPropagation();toggleItem(p);}} className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 shadow border border-gray-100 flex items-center justify-center ${wished?'text-orange-500':'text-gray-500 opacity-0 group-hover:opacity-100'}`}><Heart size={15} fill={wished?'currentColor':'none'}/></button></div><button onClick={()=>navigate('product',{productSlug:p.slug})} className="w-full text-left p-3"><p className="text-sm font-bold text-gray-800 line-clamp-2 min-h-[2.5rem]">{p.name}</p><div className="mt-2 flex items-center gap-2"><span className="text-sm font-black text-orange-500">Rs. {p.price.toLocaleString()}</span>{p.original_price&&<span className="text-[11px] text-gray-400 line-through">Rs. {p.original_price.toLocaleString()}</span>}</div></button></div>})}</div>
  </div></section>;
}
