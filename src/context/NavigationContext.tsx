import React, { createContext, useContext, useState } from 'react';
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

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [nav, setNav] = useState<NavState>({ page: 'home' });

  const navigate = (page: Page, params?: Partial<Omit<NavState, 'page'>>) => {
    setNav({ page, ...params });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
