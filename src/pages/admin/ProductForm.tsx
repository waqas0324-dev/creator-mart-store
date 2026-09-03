import { useState, useEffect, useRef } from 'react';
import { Save, ArrowLeft, Loader2, Upload, Link as LinkIcon } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useNavigation } from '../../context/NavigationContext';
import { useCategories } from '../../hooks/useProducts';
import { supabase } from '../../lib/supabase';
import { onImageError } from '../../lib/imageFallback';
import type { Product } from '../../types';

const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function AdminProductForm() {
  const { nav, navigate } = useNavigation();
  const { categories } = useCategories();
  const isEdit = !!nav.adminProductId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', original_price: '', category_id: '',
    image_url: '', rating: '4.0', review_count: '0', stock: '100',
    is_featured: false, is_bestseller: false, discount_percent: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');

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
        if (p.image_url) setImageMode('url');
      }
      setFetchLoading(false);
    });
  }, [isEdit, nav.adminProductId]);

  const update = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image_url: 'Please select an image file' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image_url: 'Image must be under 5MB' }));
      return;
    }

    setUploading(true);
    setErrors(prev => { const { image_url, ...rest } = prev; return rest; });

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      setErrors(prev => ({ ...prev, image_url: 'Upload failed. Please try again.' }));
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    update('image_url', publicUrl);
    setUploading(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.price || isNaN(Number(form.price))) e.price = 'Valid price is required';
    if (!form.image_url.trim()) e.image_url = 'Image is required';
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
      category_id: form.category_id || null, image_url: form.image_url.trim(),
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
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Basic Information</h3>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => { update('name', e.target.value); if (!isEdit) update('slug', generateSlug(e.target.value)); }} className={inputCls('name')} placeholder="e.g. Boya BY-M1 Collar Microphone" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Slug (URL)</label>
                <input type="text" value={form.slug} onChange={e => update('slug', e.target.value)} className={inputCls('slug')} placeholder="auto-generated" />
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
                { label: 'Price (Rs.)', field: 'price', placeholder: '1490', required: true },
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
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Product Image</h3>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${imageMode === 'upload' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Upload size={14} /> Upload
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${imageMode === 'url' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <LinkIcon size={14} /> URL
              </button>
            </div>

            {imageMode === 'upload' ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-xl py-8 flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <><Loader2 size={24} className="animate-spin text-orange-500" /><span className="text-sm font-semibold text-gray-600">Uploading...</span></>
                  ) : (
                    <><Upload size={24} className="text-gray-400" /><span className="text-sm font-semibold text-gray-600">Click to upload image</span><span className="text-xs text-gray-400">JPG, PNG, WebP up to 5MB</span></>
                  )}
                </button>
                {form.image_url && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                      <img src={form.image_url} alt="Preview" onError={(e) => onImageError(e, 'Preview')} className="w-full h-full object-cover" />
                    </div>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-orange-500 hover:text-orange-600 font-semibold">Change</button>
                  </div>
                )}
                {errors.image_url && <p className="text-red-500 text-xs mt-1">{errors.image_url}</p>}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Image URL <span className="text-red-500">*</span></label>
                <input type="text" value={form.image_url} onChange={e => update('image_url', e.target.value)} className={inputCls('image_url')} placeholder="https://images.pexels.com/..." />
                {errors.image_url && <p className="text-red-500 text-xs mt-1">{errors.image_url}</p>}
                {form.image_url && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                    <img src={form.image_url} alt="Preview" onError={(e) => onImageError(e, 'Preview')} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
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
