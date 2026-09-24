import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Page, PendingOrder } from '../types';

interface NavState {
  page: Page;
  productSlug?: string;
  categorySlug?: string;
  orderId?: string;
  adminProductId?: string;
  pendingOrder?: PendingOrder;
  searchQuery?: string;
}

interface NavigationContextValue {
  nav: NavState;
  navigate: (page: Page, params?: Partial<Omit<NavState, 'page'>>) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

// Only these keys are safe/meaningful to persist in the URL (pendingOrder is
// a transient in-memory object passed between Checkout/Payment, not a link).
const URL_PARAM_KEYS: (keyof NavState)[] = ['productSlug', 'categorySlug', 'orderId', 'adminProductId', 'searchQuery'];

function serializeToHash(nav: NavState): string {
  const parts: string[] = [nav.page];
  for (const key of URL_PARAM_KEYS) {
    const value = nav[key];
    if (value) parts.push(`${key}=${encodeURIComponent(String(value))}`);
  }
  return '#' + parts.join('&');
}

function parseHash(hash: string): NavState {
  const clean = hash.replace(/^#/, '');
  if (!clean) return { page: 'home' };
  const [pagePart, ...paramParts] = clean.split('&');
  const state: NavState = { page: (pagePart || 'home') as Page };
  for (const part of paramParts) {
    const [key, ...rest] = part.split('=');
    const value = decodeURIComponent(rest.join('='));
    if ((URL_PARAM_KEYS as string[]).includes(key) && value) {
      (state as Record<string, string>)[key] = value;
    }
  }
  return state;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [nav, setNav] = useState<NavState>(() => parseHash(window.location.hash));

  // Keep the browser URL in sync whenever nav state changes (so a page can
  // be reloaded, bookmarked, or shared — and so #admin-login etc. actually work).
  useEffect(() => {
    const targetHash = serializeToHash(nav);
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
  }, [nav]);

  // Support the browser's Back/Forward buttons, and also make a manually
  // typed/edited URL hash (e.g. pasting a link) actually take effect.
  useEffect(() => {
    const handleHashChange = () => {
      setNav(parseHash(window.location.hash));
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigate = useCallback((page: Page, params?: Partial<Omit<NavState, 'page'>>) => {
    setNav({ page, ...params });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <NavigationContext.Provider value={{ nav, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
