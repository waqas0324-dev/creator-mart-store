import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Save, Trash2 } from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { supabase } from '../../lib/supabase';
import type { Product, PromoSlide } from '../../types';

export function PromoSlideManager() {
  const { settings, updateSettings }=useSiteSettings(); const [products,setProducts]=useState<Product[]>([]); const [slides,setSlides]=useState<PromoSlide[]>([]); const [saving,setSaving]=useState(false);
  useEffect(()=>{setSlides([...(settings.design_settings.promoSlider.slides||[])].sort((a,b)=>a.order-b.order));},[settings.design_settings.promoSlider.slides]);
  useEffect(()=>{supabase.from('products').select('id,name,slug,price,original_price,discount_percent,image_url,images,rating,review_count,category_id,created_at,categories(id,name,slug)').order('name').then(({data})=>setProducts((data as Product[])||[]));},[]);
  const save=async(next:PromoSlide[])=>{setSaving(true);const ordered=next.map((s,i)=>({...s,order:i}));await updateSettings({design_settings:{...settings.design_settings,promoSlider:{...settings.design_settings.promoSlider,slides:ordered}});setSlides(ordered);setSaving(false);};
  const add=()=>{const p=products[0];const s:PromoSlide={id:`admin-${Date.now()}`,enabled:true,order:slides.length,product_id:p?.id||null,image_url:p?.image_url||'',title:p?.name||'New Slide',price:p?.price||0,old_price:p?.original_price||null,badge:p?.discount_percent?`-${p.discount_percent}%`:'New',description:p?.description?.slice(0,150)||'',features:['Fast Delivery','Cash on Delivery','7 Days Return']};save([...slides,s]);};
  const update=(id:string,patch:Partial<PromoSlide>)=>setSlides(prev=>prev.map(s=>s.id===id?{...s,...patch}:s));
  const choose=(s:PromoSlide,id:string)=>{const p=products.find(x=>x.id===id);if(p)update(s.id,{product_id:p.id,image_url:p.image_url,title:p.name,price:p.price,old_price:p.original_price,badge:p.discount_percent?`-${p.discount_percent}%`:'New',description:p.description?.slice(0,150)||''});};
  const move=(i:number,d:-1|1)=>{const j=i+d;if(j<0||j>=slides.length)return;const n=[...slides];[n[i],n[j]]=[n[j],n[i]];setSlides(n.map((s,k)=>({...s,order:k})));};
  return <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3"><div><h3 className="font-black text-gray-900">Promotional Slides</h3><p className="text-xs text-gray-500 mt-1">Content-only controls. Design and technical settings stay in Developer Studio.</p></div><button onClick={add} className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg"><Plus size={14}/> Add Slide</button></div>
    <div className="p-5 space-y-4">{slides.length===0&&<div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center">No custom slides yet. Add one to start managing promotional content.</div>}
      {slides.map((s,i)=><div key={s.id} className="border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between gap-3"><div><p className="font-bold text-gray-900">Slide {i+1}</p><p className="text-[11px] text-gray-400">Content controls only</p></div><div className="flex items-center gap-1"><button onClick={()=>move(i,-1)} disabled={i===0} className="p-1.5 rounded bg-gray-100 disabled:opacity-30"><ChevronUp size={15}/></button><button onClick={()=>move(i,1)} disabled={i===slides.length-1} className="p-1.5 rounded bg-gray-100 disabled:opacity-30"><ChevronDown size={15}/></button><button onClick={()=>save(slides.filter(x=>x.id!==s.id))} className="p-1.5 rounded bg-red-50 text-red-500"><Trash2 size={15}/></button></div></div>
        <div className="grid sm:grid-cols-2 gap-3"><label className="sm:col-span-2 text-xs font-bold text-gray-500">Product<select value={s.product_id||''} onChange={e=>choose(s,e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"><option value="">Select product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-500 sm:col-span-2"><input type="checkbox" checked={s.enabled} onChange={e=>update(s.id,{enabled:e.target.checked})} className="accent-orange-500"/> Enabled</label>
          <label className="text-xs font-bold text-gray-500">Title<input value={s.title} onChange={e=>update(s.id,{title:e.target.value})} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"/></label><label className="text-xs font-bold text-gray-500">Price<input type="number" value={s.price} onChange={e=>update(s.id,{price:Number(e.target.value)||0})} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"/></label>
          <label className="text-xs font-bold text-gray-500">Old Price<input type="number" value={s.old_price??''} onChange={e=>update(s.id,{old_price:e.target.value===''?null:Number(e.target.value)})} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"/></label><label className="text-xs font-bold text-gray-500">Badge<input value={s.badge} onChange={e=>update(s.id,{badge:e.target.value})} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"/></label>
          <label className="sm:col-span-2 text-xs font-bold text-gray-500">Description<textarea value={s.description} onChange={e=>update(s.id,{description:e.target.value})} rows={3} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y"/></label>
        </div>
        <div className="flex justify-end"><button onClick={()=>save(slides)} disabled={saving} className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold px-3 py-2 rounded-lg"><Save size={14}/>{saving?'Saving…':'Save Slide'}</button></div>
      </div>)}
    </div>
  </div>;
}
