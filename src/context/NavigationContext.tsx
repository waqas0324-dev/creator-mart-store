import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Page, PendingOrder } from '../types';

interface NavState { page: Page; productSlug?: string; categorySlug?: string; orderId?: string; adminProductId?: string; pendingOrder?: PendingOrder; searchQuery?: string; }
interface NavigationContextValue { nav: NavState; navigate: (page: Page, params?: Partial<Omit<NavState, 'page'>>) => void; }
const NavigationContext = createContext<NavigationContextValue | null>(null);

const PAGE_PATHS: Record<Page, string> = {
  home: '/', shop: '/shop', categories: '/categories', product: '/product', cart: '/cart', wishlist: '/wishlist', checkout: '/checkout', payment: '/payment',
  'order-success': '/order-success', 'track-order': '/track-order', 'new-arrivals': '/new-arrivals', 'best-sellers': '/best-sellers',
  contact: '/contact', about: '/about', 'return-policy': '/return-policy', 'privacy-policy': '/privacy-policy',
  admin: '/admin', 'admin-login': '/admin-login', 'admin-products': '/admin-products', 'admin-categories': '/admin-categories',
  'admin-orders': '/admin-orders', 'admin-product-form': '/admin-product-form', 'admin-account': '/admin-account',
  'dev-login': '/ws-studio', 'dev-panel': '/ws-studio/panel',
};
const PATH_TO_PAGE = new Map(Object.entries(PAGE_PATHS).map(([page, path]) => [path, page as Page]));

function parseLocation(): NavState {
  const url = new URL(window.location.href);
  const legacyHash = url.hash.replace(/^#/, '');
  if (legacyHash === 'dev-studio' || legacyHash === 'dev/studio') return { page: 'dev-login' };
  if (legacyHash === 'ws-studio') return { page: 'dev-login' };
  if (legacyHash) {
    const [pagePart, ...paramParts] = legacyHash.split('&');
    const legacyPage = pagePart as Page;
    if (PAGE_PATHS[legacyPage]) {
      const state: NavState = { page: legacyPage };
      for (const part of paramParts) {
        const [key, ...rest] = part.split('=');
        const value = decodeURIComponent(rest.join('='));
        if (['productSlug', 'categorySlug', 'orderId', 'adminProductId', 'searchQuery'].includes(key) && value) {
          (state as Record<string, string>)[key] = value;
        }
      }
      return state;
    }
  }
  const productMatch = url.pathname.match(/^\/product\/([^/]+)\/?$/);
  if (productMatch) {
    return { page: 'product', productSlug: decodeURIComponent(productMatch[1]), categorySlug: url.searchParams.get('category') || undefined, searchQuery: url.searchParams.get('search') || undefined };
  }
  const normalizedPath = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
  if (normalizedPath === '/dev/studio') return { page: 'dev-login' };
  if (normalizedPath === '/dev/studio/panel') return { page: 'dev-panel' };
  const exactPage = PATH_TO_PAGE.get(normalizedPath);
  if (exactPage) {
    const state: NavState = { page: exactPage };
    const categorySlug = url.searchParams.get('category');
    const searchQuery = url.searchParams.get('search');
    const orderId = url.searchParams.get('orderId');
    const adminProductId = url.searchParams.get('productId');
    if (categorySlug) state.categorySlug = categorySlug;
    if (searchQuery) state.searchQuery = searchQuery;
    if (orderId) state.orderId = orderId;
    if (adminProductId) state.adminProductId = adminProductId;
    return state;
  }
  return { page: 'home' };
}

function buildUrl(page: Page, params?: Partial<Omit<NavState, 'page'>>): string {
  let path = PAGE_PATHS[page] || '/';
  if (page === 'product' && params?.productSlug) path = '/product/' + encodeURIComponent(params.productSlug);
  const search = new URLSearchParams();
  if (params?.categorySlug) search.set('category', params.categorySlug);
  if (params?.searchQuery) search.set('search', params.searchQuery);
  if (params?.orderId) search.set('orderId', params.orderId);
  if (params?.adminProductId) search.set('productId', params.adminProductId);
  const query = search.toString();
  return query ? path + '?' + query : path;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [nav, setNav] = useState<NavState>(() => {
    const initial = parseLocation();
    const isCustomerPage = !['admin','admin-login','admin-products','admin-categories','admin-orders','admin-product-form','admin-account','dev-login','dev-panel'].includes(initial.page);
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const isReload = navigationEntry?.type === 'reload';
    return isReload && isCustomerPage ? { page: 'home' } : initial;
  });
  useEffect(() => {
    const onPopState = () => setNav(parseLocation());
    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onPopState);
    return () => { window.removeEventListener('popstate', onPopState); window.removeEventListener('hashchange', onPopState); };
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.hash && PAGE_PATHS[nav.page]) window.history.replaceState(null, '', buildUrl(nav.page, nav));
  }, [nav]);
  const navigate = useCallback((page: Page, params?: Partial<Omit<NavState, 'page'>>) => {
    setNav({ page, ...(params || {}) } as NavState);
    window.history.pushState(null, '', buildUrl(page, params));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  return <NavigationContext.Provider value={{ nav, navigate }}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
