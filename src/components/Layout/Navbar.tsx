import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Heart, Package, ChevronDown, Menu, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';
import { useCategories } from '../../hooks/useProducts';
import { TrackOrderModal } from '../TrackOrderModal';
import { AnnouncementBar } from './AnnouncementBar';
import type { Page } from '../../types';
import { BRAND_LOGO } from '../../lib/brand';

const NAV_LINKS: { label: string; page: Page }[] = [
  { label: 'Home', page: 'home' },
  { label: 'Shop', page: 'shop' },
  { label: 'Flash Deals', page: 'flash-deals' },
  { label: 'New Arrivals', page: 'new-arrivals' },
  { label: 'Best Sellers', page: 'best-sellers' },
  { label: 'Contact Us', page: 'contact' },
];

export function Navbar() {
  const { totalItems, openDrawer } = useCart();
  const { nav, navigate } = useNavigation();
  const { categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [trackOrderOpen, setTrackOrderOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('shop', { searchQuery: searchQuery.trim() });
    } else {
      navigate('shop');
    }
  };

  const handleCategorySelect = (slug: string) => {
    navigate('shop', { categorySlug: slug });
    setCatDropdownOpen(false);
  };

  const isActive = (page: Page) => nav.page === page;

  return (
    <>
    <header className="sticky top-0 z-50 bg-[#111827] shadow-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            className="flex items-center cursor-pointer flex-shrink-0 rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-orange-400"
            onClick={() => navigate('home')}
            aria-label="ABR Gadgets home"
          >
            <img src={BRAND_LOGO} alt="ABR Gadgets" className="w-28 sm:w-36 h-12 object-contain mix-blend-screen" />
          </button>

          {/* Category Dropdown */}
          <div className="hidden md:block relative" ref={catDropdownRef}>
            <button
              onClick={() => setCatDropdownOpen(!catDropdownOpen)}
              className="flex items-center gap-1 border border-gray-700 rounded-l-lg px-3 py-2 bg-gray-800 hover:bg-gray-700 transition-colors flex-shrink-0 text-sm text-gray-200"
            >
              <span>All Categories</span>
              <ChevronDown size={14} className={`transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {catDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[180px] max-h-64 overflow-y-auto z-50">
                <button
                  onClick={() => handleCategorySelect('')}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium"
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center justify-between"
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs text-gray-400">({cat.product_count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 border border-gray-700 border-r-0 rounded-l-lg md:rounded-l-none px-4 py-2 text-sm outline-none bg-gray-800 text-white placeholder-gray-400 focus:border-orange-400"
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-r-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Search size={16} />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTrackOrderOpen(true)}
              className="hidden md:flex flex-col items-center text-gray-300 hover:text-orange-400 transition-colors text-xs"
            >
              <Package size={20} />
              <span>Track</span>
            </button>
            <button className="hidden md:flex flex-col items-center text-gray-300 hover:text-orange-400 transition-colors text-xs">
              <Heart size={20} />
              <span>Wishlist</span>
            </button>
            <button
              onClick={openDrawer}
              className="flex flex-col items-center text-gray-300 hover:text-orange-400 transition-colors text-xs relative"
            >
              <div className="relative">
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </div>
              <span>Cart</span>
            </button>
            <button
              className="md:hidden text-gray-200"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Nav Links */}
      <nav className="bg-[#111827] border-t border-gray-800 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center overflow-x-auto">
          {NAV_LINKS.map(link => (
            <button
              key={link.page}
              onClick={() => navigate(link.page)}
              className={`py-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                isActive(link.page)
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-300 hover:text-orange-400'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#111827] border-t border-gray-800 px-4 py-3 flex flex-col gap-2">
          {NAV_LINKS.map(link => (
            <button
              key={link.page}
              onClick={() => { navigate(link.page); setMobileOpen(false); }}
              className={`text-left text-sm font-semibold py-2 border-b border-gray-800 transition-colors ${isActive(link.page) ? 'text-orange-400' : 'text-gray-200 hover:text-orange-400'}`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => { navigate('cart'); setMobileOpen(false); }}
            className="text-left text-sm font-semibold text-gray-200 hover:text-orange-400 py-2"
          >
            Cart ({totalItems})
          </button>
        </div>
      )}

      <TrackOrderModal isOpen={trackOrderOpen} onClose={() => setTrackOrderOpen(false)} />
    </header>
    <AnnouncementBar />
    </>
  );
}
