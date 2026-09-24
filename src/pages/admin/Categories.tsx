import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useCategories } from '../../hooks/useProducts';
import { supabase } from '../../lib/supabase';
import { onImageError, resolveCategoryImage } from '../../lib/imageFallback';
import type { Category } from '../../types';

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function AdminCategories() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const openNew = () => { setEditing(null); setName(''); setImageUrl(''); setFormError(''); setShowForm(true); };
  const openEdit = (cat: Category) => { setEditing(cat); setName(cat.name); setImageUrl(cat.image_url); setFormError(''); setShowForm(true); };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setFormError('');
    const path = `categories/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      // Cache-bust so a browser that cached the old image at this bucket
      // path doesn't keep showing stale bytes after a re-upload.
      setImageUrl(`${data.publicUrl}?v=${Date.now()}`);
    } else {
      setFormError(`Image upload failed: ${error.message}`);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setFormError('');
    const payload = { name: name.trim(), slug: slugify(name), image_url: imageUrl };
    const errorMsg = editing
      ? await updateCategory(editing.id, payload)
      : await addCategory(payload);
    setSaving(false);
    if (errorMsg) {
      setFormError(`Could not save: ${errorMsg}`);
    } else {
      setShowForm(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">Categories</h2>
            <p className="text-sm text-gray-500">{categories.length} categories</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={18} />Add Category
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-lg" />)}</div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No categories yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                  <tr>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Slug</th>
                    <th className="px-4 py-3 text-left">Products</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={resolveCategoryImage(cat.image_url)} alt={cat.name} onError={(e) => onImageError(e, cat.name)} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                          <span className="font-semibold text-gray-800">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{cat.slug}</td>
                      <td className="px-4 py-3 text-gray-600">{cat.product_count}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(cat)} className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => setConfirmDelete(cat.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900 text-lg">{editing ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 mb-4" placeholder="e.g. Microphones" />

            <label className="block text-xs font-bold text-gray-500 mb-1">Image</label>
            <div className="flex items-center gap-3 mb-4">
              {imageUrl && <img src={imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-100" />}
              <label className="flex items-center gap-2 text-sm border-2 border-dashed border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-orange-300 transition-colors flex-1 justify-center">
                <Upload size={14} />{uploading ? 'Uploading...' : 'Upload Image'}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              </label>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 mb-3">
                {formError}
              </div>
            )}

            <button onClick={handleSave} disabled={saving || !name.trim()} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors">
              {saving ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-black text-gray-900 text-lg mb-2">Delete Category?</h3>
            <p className="text-gray-500 text-sm mb-5">Products in this category will keep their data, but the category will no longer be listed.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors">Cancel</button>
              <button onClick={() => { deleteCategory(confirmDelete); setConfirmDelete(null); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
