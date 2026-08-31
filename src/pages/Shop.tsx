import { useState, useEffect } from 'react';
import { SlidersHorizontal, Star } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useCategories } from '../hooks/useProducts';
import { ProductCard } from '../components/Product/ProductCard';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import { onImageError } from '../lib/imageFallback';

const SORT_OPTIONS = [
  { label: 'Default sorting', value: 'default' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
];

export function Shop() {
  const { nav, navigate } = useNavigation();
  const { categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState(nav.categorySlug || '');
  const [searchQuery, setSearchQuery] = useState(nav.searchQuery || '');
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState('default');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .lte('price', maxPrice);

    if (selectedCategory) {
      const { data: cat } = await supabase
        .from('categories').select('id').eq('slug', selectedCategory).single();
      if (cat) query = query.eq('category_id', cat.id);
    }

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data } = await query;
    let sorted = (data as Product[]) || [];
    switch (sortBy) {
      case 'price_asc': sorted = [...sorted].sort((a, b) => a.price - b.price); break;
      case 'price_desc': sorted = [...sorted].sort((a, b) => b.price - a.price); break;
      case 'rating': sorted = [...sorted].sort((a, b) => b.rating - a.rating); break;
    }
    setAllProducts(sorted);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [selectedCategory, searchQuery, maxPrice, sortBy]);

  useEffect(() => {
    if (nav.categorySlug !== undefined) setSelectedCategory(nav.categorySlug || '');
    if (nav.searchQuery !== undefined) setSearchQuery(nav.searchQuery || '');
  }, [nav.categorySlug, nav.searchQuery]);

  useEffect(() => {
    supabase.from('products').select('*').order('rating', { ascending: false }).limit(5)
      .then(({ data }) => setTopRated((data as Product[]) || []));
  }, []);

  const Sidebar = () => (
    <div className="space-y-4">
      {/* Categories */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wide mb-3">Categories</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => setSelectedCategory('')}
              className={`w-full text-left flex items-center justify-between py-1.5 px-2 rounded text-sm transition-colors ${selectedCategory === '' ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-700 hover:text-orange-500'}`}
            >
              <span>All Products</span>
              <span className="text-xs text-gray-400">({allProducts.length})</span>
            </button>
          </li>
          {categories.map(cat => (
            <li key={cat.id}>
              <button
                onClick={() => setSelectedCategory(cat.slug)}
                className={`w-full text-left flex items-center justify-between py-1.5 px-2 rounded text-sm transition-colors ${selectedCategory === cat.slug ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-700 hover:text-orange-500'}`}
              >
                <span>{cat.name}</span>
                <span className="text-xs text-gray-400">({cat.product_count})</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wide mb-3">Filter By Price</h3>
        <input type="range" min={200} max={15000} step={100} value={maxPrice} onChange={e => setMaxPrice(parseInt(e.target.value))} className="w-full accent-orange-500 mb-2" />
        <p className="text-xs text-gray-600 mb-3">Price: Rs. 200 — Rs. {maxPrice.toLocaleString()}</p>
        <button onClick={fetchProducts} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-1.5 rounded transition-colors">
          Filter
        </button>
      </div>

      {/* Top Rated */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wide mb-3">Top Rated Products</h3>
        <div className="space-y-3">
          {topRated.map(product => (
            <button key={product.id} onClick={() => navigate('product', { productSlug: product.slug })} className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity">
              <img src={product.image_url} alt={product.name} referrerPolicy="no-referrer" onError={(e) => onImageError(e, product.name)} className="w-10 h-10 object-cover rounded flex-shrink-0" />
              <div className="text-left flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
                <div className="flex">
                  {[1,2,3,4,5].map(i => <Star key={i} size={8} className={i <= Math.round(product.rating) ? 'fill-orange-400 text-orange-400' : 'fill-gray-200 text-gray-200'} />)}
                </div>
                <p className="text-xs text-orange-500 font-bold">Rs. {product.price.toLocaleString()}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-semibold">Shop</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-black text-gray-900 mb-5">SHOP</h1>
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="w-56 flex-shrink-0 hidden md:block">
            <Sidebar />
          </aside>

          {/* Main */}
          <main className="flex-1">
            {searchQuery && (
              <div className="flex items-center gap-2 mb-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-700">Searching for:</span>
                <span className="text-sm font-bold text-orange-600">"{searchQuery}"</span>
                <button
                  onClick={() => { setSearchQuery(''); navigate('shop'); }}
                  className="ml-auto text-xs text-orange-500 hover:text-orange-600 font-semibold"
                >
                  Clear Search
                </button>
              </div>
            )}
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 mb-4">
              <p className="text-sm text-gray-600">
                Showing <strong>{allProducts.length}</strong> results
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-orange-400"
                >
                  {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <button
                  className="md:hidden flex items-center gap-1 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5"
                  onClick={() => setShowMobileFilters(true)}
                >
                  <SlidersHorizontal size={14} />
                  Filters
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-64" />)}
              </div>
            ) : allProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-400 text-lg font-semibold">No products found</p>
                <button onClick={() => { setSelectedCategory(''); setMaxPrice(10000); }} className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-semibold">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {allProducts.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex">
          <div className="bg-black/50 flex-1" onClick={() => setShowMobileFilters(false)} />
          <div className="bg-gray-50 w-72 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} className="text-gray-500">✕</button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}
    </div>
  );
}
