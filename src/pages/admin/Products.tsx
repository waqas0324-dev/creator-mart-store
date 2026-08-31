import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Star } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useNavigation } from '../../context/NavigationContext';
import { useAdminProducts } from '../../hooks/useProducts';
import { onImageError } from '../../lib/imageFallback';

export function AdminProducts() {
  const { navigate } = useNavigation();
  const { products, loading, deleteProduct } = useAdminProducts();
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">Products</h2>
            <p className="text-sm text-gray-500">{products.length} total products</p>
          </div>
          <button onClick={() => navigate('admin-product-form')} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={18} />Add Product
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm outline-none" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">{search ? 'No products match your search.' : 'No products yet.'}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-left">Stock</th>
                    <th className="px-4 py-3 text-left">Rating</th>
                    <th className="px-4 py-3 text-left">Tags</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={product.image_url} alt={product.name} referrerPolicy="no-referrer" onError={(e) => onImageError(e, product.name)} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate max-w-[180px]">{product.name}</p>
                            {product.discount_percent && <span className="text-xs text-orange-500 font-bold">-{product.discount_percent}% OFF</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{product.categories?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900">Rs. {product.price.toLocaleString()}</span>
                        {product.original_price && <span className="text-xs text-gray-400 line-through ml-2">Rs. {product.original_price.toLocaleString()}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>{product.stock} units</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="fill-orange-400 text-orange-400" />
                          <span className="text-xs font-semibold">{product.rating.toFixed(1)}</span>
                          <span className="text-xs text-gray-400">({product.review_count})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {product.is_featured && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded">Featured</span>}
                          {product.is_bestseller && <span className="bg-orange-100 text-orange-700 text-xs font-bold px-1.5 py-0.5 rounded">Bestseller</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => navigate('admin-product-form', { adminProductId: product.id })} className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setConfirmDelete(product.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
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

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-black text-gray-900 text-lg mb-2">Delete Product?</h3>
            <p className="text-gray-500 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors">Cancel</button>
              <button onClick={() => { deleteProduct(confirmDelete); setConfirmDelete(null); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
