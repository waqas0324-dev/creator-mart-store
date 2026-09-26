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
  advance_flat_amount: 350,
  advance_threshold: 10000,
  advance_percent: 10,
  full_advance_discount_percent: 3,
  delivery_charge_above_threshold: 500,
  bank_title: 'Abdul Rehman',
  bank_account_number: '03044454356',
  bank_name: 'NayaPay',
  bank2_title: 'Abdul Rehman',
  bank2_name: 'United Bank Limited (UBL)',
  bank2_account_number: '01121482302930913',
  wallet_name: 'Muhammad Masood',
  wallet_number: '03024208217',
  payment_support_hours: '8:00 AM to 8:00 PM, Daily',
  payment_screenshot_note: 'After sending the payment, please share the screenshot on WhatsApp',
  cod_policy_urdu: 'آپ کا آرڈر کنفرم کرنے کے لیے صرف ڈیلیوری چارجز ایڈوانس درکار ہیں۔ پروڈکٹ کی پوری قیمت آپ ڈیلیوری کے وقت ادا کریں گے، یہ رقم اس میں سے منہا نہیں ہوگی۔',
  why_advance_note: 'Most COD refusals happen after the parcel has already been shipped, causing an unrecoverable loss. A small advance for delivery charges simply confirms your order is genuine — the rest of your product price is paid on delivery. Serious buyers have no issue with it, and if we ever cancel your order, your advance is refunded in full.',
  whatsapp_number: '03484800547',
  store_address: 'Kanganpur, Tehsil Chunian, District Kasur',
  announcement_messages: 'Free Delivery All Over Pakistan|New Products Added Every Week|Follow Us for Daily Deals & Discounts',
  facebook_url: null,
  instagram_url: null,
  tiktok_url: null,
  youtube_url: null,
  footer_description: "Pakistan's No.1 Creator Store. Premium quality products for content creators delivered nationwide.",
  footer_email: 'info@abrgadgets.pk',
  footer_stat_1_value: '10,000+', footer_stat_1_label: 'Happy Customers',
  footer_stat_2_value: '300+', footer_stat_2_label: 'Quality Products',
  footer_stat_3_value: '99%', footer_stat_3_label: 'Positive Reviews',
  footer_stat_4_value: '24/7', footer_stat_4_label: 'Customer Support',
  footer_quick_home: 'Home', footer_quick_shop: 'Shop', footer_quick_new_arrivals: 'New Arrivals', footer_quick_best_sellers: 'Best Sellers',
  footer_quick_contact: 'Contact Us', footer_quick_about: 'About Us', footer_quick_return: 'Return & Refund Policy', footer_quick_privacy: 'Privacy Policy',
  footer_categories: 'Microphones|Tripods|Ring Lights|Power Banks|Earbuds|Speakers',
  footer_copyright: 'All rights reserved.',
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
