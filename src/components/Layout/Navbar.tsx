import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Heart, Package, ChevronDown, Menu, X, LayoutGrid } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNavigation } from '../../context/NavigationContext';
import { useCategories } from '../../hooks/useProducts';
import { TrackOrderModal } from '../TrackOrderModal';
import { AnnouncementBar } from './AnnouncementBar';
import type { Page } from '../../types';
import { Logo } from '../UI/Logo';
import { useSiteSettings } from '../../context/SiteSettingsContext';

// Below `lg` (1024px) — phones AND tablets — everything collapses into the
// hamburger menu. Only screens 1024px+ get the full desktop nav bar.
const NAV_LINKS: { label: string; page: Page }[] = [
  { label: 'Home', page: 'home' },
  { label: 'Shop', page: 'shop' },
  { label: 'New Arrivals', page: 'new-arrivals' },
  { label: 'Best Sellers', page: 'best-sellers' },
];

export function Navbar() {
  const { totalItems, openDrawer } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { nav, navigate } = useNavigation();
  const { categories } = useCategories();
  const { settings } = useSiteSettings();
  const hd = settings.design_settings.header;
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
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

  // Close the mobile menu automatically if the window is resized past the
  // tablet breakpoint (e.g. rotating a tablet, or a device toolbar resize).
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('shop', { searchQuery: searchQuery.trim() });
    } else {
      navigate('shop');
    }
    setMobileOpen(false);
  };

  const handleCategorySelect = (slug: string) => {
    navigate('shop', { categorySlug: slug });
    setCatDropdownOpen(false);
    setMobileCatOpen(false);
    setMobileOpen(false);
  };

  const isActive = (page: Page) => nav.page === page;

  return (
    <>
    <header className="sticky top-0 z-50 shadow-lg" style={{ backgroundColor: hd.bgColor, borderBottom: hd.borderWidth + "px solid " + hd.borderColor, color: hd.textColor }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3" style={{ minHeight: hd.height }}>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            className="flex items-center cursor-pointer flex-shrink-0 focus:outline-none"
            onClick={() => navigate('home')}
            aria-label="ABR Gadgets home"
          >
            <Logo size="sm" className="sm:hidden" showTagline={false} />
            <Logo size="md" className="hidden sm:block" showTagline={false} />
          </button>

          {/* Category Dropdown — desktop/laptop only (1024px+) */}
          <div className="hidden lg:block relative flex-shrink-0" ref={catDropdownRef}>
            <button
              onClick={() => setCatDropdownOpen(!catDropdownOpen)}
              className="flex items-center gap-1 border border-gray-700 rounded-l-lg px-3 py-2 bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-gray-200 whitespace-nowrap"
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

          {/* Search — grows on small screens, capped on wide desktops so it doesn't stretch the whole row */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl flex min-w-0">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 border border-gray-700 border-r-0 rounded-l-lg lg:rounded-l-none px-3 sm:px-4 py-2 text-sm outline-none bg-gray-800 text-white placeholder-gray-400 focus:border-orange-400"
            />
            <button
              type="submit"
              aria-label="Search"
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-5 py-2 rounded-r-lg text-sm font-semibold transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <Search size={16} />
              <span className="hidden md:inline">Search</span>
            </button>
          </form>

          {/* Actions — full icon row only on desktop/laptop (1024px+) */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-auto lg:ml-0">
            <button
              onClick={() => setTrackOrderOpen(true)}
              className="hidden lg:flex flex-col items-center text-gray-300 hover:text-orange-400 transition-colors text-xs"
            >
              <Package size={20} />
              <span>Track Order</span>
            </button>
            <button
              onClick={() => navigate('wishlist')}
              className="hidden lg:flex flex-col items-center text-gray-300 hover:text-orange-400 transition-colors text-xs relative"
            >
              <div className="relative">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span>Wishlist</span>
            </button>
            <button
              onClick={openDrawer}
              aria-label="Cart"
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
              <span className="hidden sm:inline">Cart</span>
            </button>
            <button
              className="lg:hidden text-gray-200"
              aria-label="Menu"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop/Laptop Nav Links (1024px+) */}
      <nav className="border-t hidden lg:block" style={{ backgroundColor: hd.bgColor, borderColor: hd.borderColor }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-1">
          {NAV_LINKS.map(link => (
            <button
              key={link.page}
              onClick={() => navigate(link.page)}
              className={`py-3 px-5 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${
                isActive(link.page)
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-200 hover:text-orange-400'
              }`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => navigate('contact')}
            className={`py-3 px-5 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${
              isActive('contact')
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-gray-200 hover:text-orange-400'
            }`}
          >
            Contact Us
          </button>
        </div>
      </nav>

      {/* Mobile + Tablet Menu (below 1024px) — has EVERYTHING: nav links,
          category browsing, wishlist, track order, contact, cart */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#111827] border-t border-gray-800 px-4 py-3 flex flex-col gap-1 max-h-[75vh] overflow-y-auto">
          {NAV_LINKS.map(link => (
            <button
              key={link.page}
              onClick={() => { navigate(link.page); setMobileOpen(false); }}
              className={`text-left text-sm font-semibold py-2.5 border-b border-gray-800 transition-colors ${isActive(link.page) ? 'text-orange-400' : 'text-gray-200 hover:text-orange-400'}`}
            >
              {link.label}
            </button>
          ))}

          {/* Category browsing */}
          <div className="border-b border-gray-800">
            <button
              onClick={() => setMobileCatOpen(v => !v)}
              className="w-full flex items-center justify-between text-left text-sm font-semibold py-2.5 text-gray-200 hover:text-orange-400 transition-colors"
            >
              <span className="flex items-center gap-2"><LayoutGrid size={16} /> Categories</span>
              <ChevronDown size={16} className={`transition-transform ${mobileCatOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileCatOpen && (
              <div className="pb-2 pl-6 flex flex-col gap-1.5">
                <button onClick={() => handleCategorySelect('')} className="text-left text-sm text-gray-400 hover:text-orange-400 py-1 transition-colors">
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className="text-left text-sm text-gray-400 hover:text-orange-400 py-1 flex items-center justify-between transition-colors"
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs text-gray-500">({cat.product_count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => { setTrackOrderOpen(true); setMobileOpen(false); }}
            className="flex items-center gap-2 text-left text-sm font-semibold py-2.5 border-b border-gray-800 text-gray-200 hover:text-orange-400 transition-colors"
          >
            <Package size={16} /> Track Order
          </button>
          <button
            onClick={() => { navigate('wishlist'); setMobileOpen(false); }}
            className="flex items-center gap-2 text-left text-sm font-semibold py-2.5 border-b border-gray-800 text-gray-200 hover:text-orange-400 transition-colors"
          >
            <Heart size={16} /> Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}
          </button>
          <button
            onClick={() => { navigate('contact'); setMobileOpen(false); }}
            className={`text-left text-sm font-semibold py-2.5 border-b border-gray-800 transition-colors ${isActive('contact') ? 'text-orange-400' : 'text-gray-200 hover:text-orange-400'}`}
          >
            Contact Us
          </button>
          <button
            onClick={() => { navigate('cart'); setMobileOpen(false); }}
            className="flex items-center gap-2 text-left text-sm font-semibold text-gray-200 hover:text-orange-400 py-2.5"
          >
            <ShoppingCart size={16} /> Cart ({totalItems})
          </button>
        </div>
      )}

      <TrackOrderModal isOpen={trackOrderOpen} onClose={() => setTrackOrderOpen(false)} />
    </header>
    <AnnouncementBar />
    </>
  );
}
