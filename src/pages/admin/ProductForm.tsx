import { useState, useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { Save, ArrowLeft, Loader2, Upload, Star, Link as LinkIcon, Plus } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useNavigation } from '../../context/NavigationContext';
import { useCategories } from '../../hooks/useProducts';
import { supabase } from '../../lib/supabase';
import { onImageError } from '../../lib/imageFallback';
import type { Product } from '../../types';
import { sanitizeRichHtml } from '../../lib/richText';

const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');


function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const command = (name: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(name, false, arg);
    onChange(sanitizeRichHtml(ref.current?.innerHTML || ''));
  };
  const button = (label: string, onClick: () => void) => (
    <button type="button" onMouseDown={e => e.preventDefault()} onClick={onClick}>{label}</button>
  );
  return <div><div>{button('Bold', () => command('bold'))}{button('Underline', () => command('underline'))}{button('Center', () => command('justifyCenter'))}</div><div ref={ref} contentEditable suppressContentEditableWarning onInput={() => onChange(sanitizeRichHtml(ref.current?.innerHTML || ''))}>{value}</div></div>;
}

export function AdminProductForm() {
  const { nav, navigate } = useNavigation();
  const { categories } = useCategories();
  const isEdit = !!nav.adminProductId;

  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', original_price: '', category_id: '',
    image_url: '', rating: '4.0', review_count: '0', stock: '100',
    is_featured: false, is_bestseller: false, discount_percent: '',
  });
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isEdit || !nav.adminProductId) return;
    supabase.from('products').select('*').eq('id', nav.adminProductId).single().then(({ data }) => {
      if (data) {
        const p = data as Product;
        setForm({
          name: p.name, slug: p.slug, description: p.description || '',
          price: String(p.price), original_price: String(p.original_price || ''),
          category_id: p.category_id || '', image_url: p.image_url,
          rating: String(p.rating), review_count: String(p.review_count),
          stock: String(p.stock), is_featured: p.is_featured, is_bestseller: p.is_bestseller,
          discount_percent: String(p.discount_percent || ''),
        });
        const savedImages = Array.isArray(p.images) ? p.images : [];
        const unifiedImages = Array.from(new Set([p.image_url, ...savedImages].filter(Boolean)));
        setGalleryImages(unifiedImages);
      }
      setFetchLoading(false);
    });
  }, [isEdit, nav.adminProductId]);

  const update = (field: string, value: string | boolean) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Keep the selling price in sync with Original Price + Discount %,
      // so the admin never has to calculate the discounted price by hand —
      // and removing the discount correctly brings back the original price.
      if (field === 'original_price' || field === 'discount_percent') {
        const orig = Number(field === 'original_price' ? value : prev.original_price);
        const disc = Number(field === 'discount_percent' ? value : prev.discount_percent);
        if (orig > 0) {
          next.price = disc > 0 ? String(Math.round(orig - (orig * disc) / 100)) : String(orig);
        }
      }
      return next;
    });
  };

  const handleGalleryUpload = async (files: FileList) => {
    setGalleryUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) continue;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = `products/${fileName}`;
      const { error } = await supabase.storage.from('product-images').upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
        uploaded.push(publicUrl);
      }
    }
    setGalleryImages(prev => [...prev, ...uploaded]);
    setGalleryUploading(false);
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    setGalleryImages(prev => {
      if (index <= 0 || index >= prev.length) return prev;
      const next = [...prev];
      const [primary] = next.splice(index, 1);
      next.unshift(primary);
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.price || isNaN(Number(form.price))) e.price = 'Valid price is required';
    if (galleryImages.length === 0) e.image_url = 'At least one product image is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const payload = {
      name: form.name.trim(), slug: form.slug || generateSlug(form.name),
      description: form.description.trim(), price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      category_id: form.category_id || null,
      image_url: galleryImages[0] || '',
      images: galleryImages,
      rating: Number(form.rating), review_count: Number(form.review_count),
      stock: Number(form.stock), is_featured: form.is_featured, is_bestseller: form.is_bestseller,
      discount_percent: form.discount_percent ? Number(form.discount_percent) : null,
    };

    const { error } = isEdit
      ? await supabase.from('products').update(payload).eq('id', nav.adminProductId!)
      : await supabase.from('products').insert(payload);

    setLoading(false);
    if (error) { setErrors({ general: error.message }); }
    else { setSuccess(isEdit ? 'Product updated!' : 'Product added!'); setTimeout(() => navigate('admin-products'), 1500); }
  };

  const inputCls = (field: string) => `w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${errors[field] ? 'border-red-400' : 'border-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-100'}`;

  if (fetchLoading) {
    return <AdminLayout><div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-orange-500" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('admin-products')} className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-black text-gray-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
            <p className="text-sm text-gray-500">{isEdit ? 'Update product details' : 'Fill in the details to add a product'}</p>
          </div>
        </div>

        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-semibold mb-4">{success}</div>}
        {errors.general && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">{errors.general}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Product Images</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Add all product photos here. The first image is automatically the main product image; all images appear in the product gallery.
              </p>
            </div>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleGalleryUpload(e.target.files);
                  e.currentTarget.value = '';
                }
              }}
            />

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={galleryUploading}
              className="w-full border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-xl py-8 flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {galleryUploading ? (
                <><Loader2 size={24} className="animate-spin text-orange-500" /><span className="text-sm font-semibold text-gray-600">Uploading images...</span></>
              ) : (
                <><Upload size={24} className="text-gray-400" /><span className="text-sm font-semibold text-gray-600">Click to upload product images</span><span className="text-xs text-gray-400">Select multiple JPG, PNG or WebP images — up to 5MB each</span></>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">or add by URL</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={e => setImageUrlInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const url = imageUrlInput.trim();
                      if (url) {
                        setGalleryImages(prev => Array.from(new Set([...prev, url])));
                        setImageUrlInput('');
                      }
                    }
                  }}
                  placeholder="https://example.com/product-image.jpg"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const url = imageUrlInput.trim();
                  if (!url) return;
                  setGalleryImages(prev => Array.from(new Set([...prev, url])));
                  setImageUrlInput('');
                }}
                className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
              >
                <Plus size={16} /> Add URL
              </button>
            </div>

            {galleryImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {galleryImages.map((img, i) => (
                  <div key={img + i} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <div className="aspect-square">
                      <img
                        src={img}
                        alt={`Product image ${i + 1}`}
                        onError={(e) => onImageError(e, 'Preview')}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {i === 0 && (
                      <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                        MAIN
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(i)}
                      disabled={i === 0}
                      className="absolute bottom-2 left-2 bg-white/95 hover:bg-white text-gray-800 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm disabled:opacity-60"
                    >
                      {i === 0 ? 'Main Image' : 'Set as Main'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(i)}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {errors.image_url && <p className="text-red-500 text-xs mt-1">{errors.image_url}</p>}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Basic Information</h3>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => { update('name', e.target.value); if (!isEdit) update('slug', generateSlug(e.target.value)); }} className={inputCls('name')} placeholder="e.g. Boya BY-M1 Collar Microphone" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">URL Slug</label>
                <input type="text" value={form.slug} onChange={e => update('slug', e.target.value)} className={inputCls('slug')} placeholder="auto-generated" />
                <p className="text-[11px] text-gray-400 mt-1">Used to create the product page URL.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                <select value={form.category_id} onChange={e => update('category_id', e.target.value)} className={inputCls('category_id')}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4} className={`${inputCls('description')} resize-none`} placeholder="Product description..." />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Pricing & Inventory</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Price (Rs.) — auto-calculated, or type to override', field: 'price', placeholder: '1490', required: true },
                { label: 'Original Price (Rs.)', field: 'original_price', placeholder: '1990' },
                { label: 'Discount %', field: 'discount_percent', placeholder: '25' },
                { label: 'Stock', field: 'stock', placeholder: '100' },
              ].map(({ label, field, placeholder, required }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
                  <input type="number" value={(form as Record<string, string | boolean>)[field] as string} onChange={e => update(field, e.target.value)} className={inputCls(field)} placeholder={placeholder} />
                  {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Ratings & Tags</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Rating (0-5)</label>
                <input type="number" value={form.rating} onChange={e => update('rating', e.target.value)} className={inputCls('rating')} step="0.1" min="0" max="5" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Review Count</label>
                <input type="number" value={form.review_count} onChange={e => update('review_count', e.target.value)} className={inputCls('review_count')} min="0" />
              </div>
            </div>
            <div className="flex gap-6">
              {[
                { label: 'Featured Product', field: 'is_featured' },
                { label: 'Best Seller', field: 'is_bestseller' },
              ].map(({ label, field }) => (
                <label key={field} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(form as Record<string, string | boolean>)[field] as boolean} onChange={e => update(field, e.target.checked)} className="accent-orange-500 w-4 h-4" />
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('admin-products')} className="px-6 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-gray-300 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold px-8 py-2.5 rounded-xl transition-colors">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
