import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { SiteSettings } from '../types';

const DEFAULTS: SiteSettings = {
  id: 1,
  hero_eyebrow: 'Pakistan No.1',
  hero_title: 'Creator Store',
  hero_title_accent: 'Creator',
  hero_subtitle_1: 'Premium Quality Products',
  hero_subtitle_2: 'For Content Creators',
  hero_image_url: '/images/hero-banner-full.jpg',
  hero_badge_text: '40%',
  trust_item_1: 'Cash on Delivery',
  trust_item_2: '7 Days Return',
  trust_item_3: 'Fast Delivery',
  logo_url: null,
  logo_size: 'md',
  shipping_fee: 250,
  advance_flat_amount: 500,
  advance_threshold: 15000,
  advance_percent: 10,
  full_advance_discount_percent: 3,
  bank_title: 'Abdul Rehman',
  bank_account_number: 'PK00NAYP0000000000000000',
  bank_name: 'NayaPay',
  wallet_name: 'Abdul Rehman',
  wallet_number: '03044454356',
  payment_support_hours: '10:30 AM to 7:30 PM, Saturday to Thursday',
  facebook_url: null,
  instagram_url: null,
  tiktok_url: null,
  youtube_url: null,
};

interface SiteSettingsContextValue {
  settings: SiteSettings;
  loading: boolean;
  updateSettings: (payload: Partial<SiteSettings>) => Promise<string | null>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(() => {
    return supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data as SiteSettings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const updateSettings = useCallback(async (payload: Partial<SiteSettings>) => {
    const { error } = await supabase.from('site_settings').update(payload).eq('id', 1);
    await fetchSettings();
    return error?.message || null;
  }, [fetchSettings]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  return ctx;
}
