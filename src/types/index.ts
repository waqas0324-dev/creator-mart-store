export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  product_count: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  mini_description: string | null;
  tags: string[];
  seo_keywords: string;
  specifications: Array<{ key: string; value: string }>;
  price: number;
  original_price: number | null;
  category_id: string | null;
  image_url: string;
  images: string[];
  rating: number;
  review_count: number;
  stock: number;
  is_featured: boolean;
  is_bestseller: boolean;
  discount_percent: number | null;
  created_at: string;
  categories?: Category;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp: string;
  customer_email: string | null;
  customer_address: string;
  customer_city: string;
  customer_area: string | null;
  payment_method: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  coupon_code: string | null;
  advance_amount: number;
  advance_waived?: boolean;
  advance_payment_status: 'pending' | 'received';
  advance_payment_received_at: string | null;
  notes: string | null;
  owner_note: string | null;
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  parcel_pieces: number;
  parcel_weight_kg: number | null;
  shipping_note: string | null;
  payment_proof_path: string | null;
  payment_proof_status: 'not_required' | 'pending' | 'verified' | 'rejected';
  payment_proof_uploaded_at: string | null;
  payment_proof_verified_at: string | null;
  payment_proof_rejected_reason: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface PromoSlide {
  id: string; enabled: boolean; order: number; product_id: string | null;
  image_url: string; title: string; price: number; old_price: number | null;
  badge: string; description: string; features: string[];
}
export interface PromoSliderSettings {
  enabled: boolean; heading: string; subheading: string; auto_play: boolean;
  auto_play_ms: number; show_arrows: boolean; show_dots: boolean;
  backgroundColor: string; textColor: string; mutedTextColor: string;
  accentColor: string; badgeBgColor: string; badgeTextColor: string;
  arrowBgColor: string; arrowTextColor: string; buttonBgColor: string; buttonTextColor: string;
  slides: PromoSlide[];
}
export interface RecentlyViewedSettings {
  enabled: boolean; heading: string; max_items: number; auto_play: boolean; auto_play_ms: number;
}
export interface DesignSettings {
  header: { height: number; bgColor: string; textColor: string; hoverColor: string; borderColor: string; borderWidth: number; fontSize: number; fontWeight: number };
  hero: { borderWidth: number; borderColor: string; radius: number; shadow: string };
  buttons: { radius: number; fontWeight: number; hoverScale: number; transitionMs: number; bgColor: string; hoverBgColor: string; hoverTextColor: string; textColor: string; hoverShadow: string };
  animations: { enabled: boolean; style: 'none' | 'lift' | 'scale' | 'lift-scale'; hoverLift: number; clickScale: number };
  promoSlider: PromoSliderSettings;
  recentlyViewed: RecentlyViewedSettings;
  announcementBar: { height: number; backgroundColor: string; textColor: string; accentColor: string; fontSize: number; fontWeight: number; paddingX: number };

}

export interface SiteSettings {
  id: number;
  hero_eyebrow: string;
  hero_title: string;
  hero_title_accent: string;
  hero_subtitle_1: string;
  hero_subtitle_2: string;
  hero_image_url: string;
  hero_badge_text: string;
  trust_item_1: string;
  trust_item_2: string;
  trust_item_3: string;
  logo_url: string | null;
  logo_size: 'sm' | 'md' | 'lg' | 'xl';
  shipping_fee: number;
  advance_flat_amount: number;
  advance_threshold: number;
  advance_percent: number;
  full_advance_discount_percent: number;
  delivery_charge_above_threshold: number;
  bank_title: string;
  bank_account_number: string;
  bank_name: string;
  bank2_title: string;
  bank2_name: string;
  bank2_account_number: string;
  wallet_name: string;
  wallet_number: string;
  payment_support_hours: string;
  payment_screenshot_note: string;
  why_advance_note: string;
  why_advance_note_urdu: string;
  cod_policy_urdu: string;
  cod_policy_english: string;
  cod_language: 'ur' | 'en';
  whatsapp_number: string;
  store_address: string;
  store_location_url: string | null;
  announcement_messages: string;
  announcement_enabled: boolean;
  announcement_whatsapp_enabled: boolean;
  trust_badge_1_title: string;
  trust_badge_1_subtitle: string;
  trust_badge_2_title: string;
  trust_badge_2_subtitle: string;
  trust_badge_3_title: string;
  trust_badge_3_subtitle: string;
  trust_badge_4_title: string;
  trust_badge_4_subtitle: string;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  footer_description: string;
  footer_email: string;
  footer_stat_1_value: string;
  footer_stat_1_label: string;
  footer_stat_2_value: string;
  footer_stat_2_label: string;
  footer_stat_3_value: string;
  footer_stat_3_label: string;
  footer_stat_4_value: string;
  footer_stat_4_label: string;
  footer_quick_title: string;
  footer_categories_title: string;
  footer_contact_title: string;
  footer_quick_home: string;
  footer_quick_shop: string;
  footer_quick_new_arrivals: string;
  footer_quick_best_sellers: string;
  footer_quick_contact: string;
  footer_quick_about: string;
  footer_quick_return: string;
  footer_quick_privacy: string;
  footer_quick_terms: string;
  footer_quick_faq: string;
  footer_categories: string;
  footer_copyright: string;
  design_settings: DesignSettings;
}

export interface PendingOrder {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_city: string;
  customer_area: string;
  payment_method: string;
  subtotal: number;
  shipping: number;
  total: number;
}

export type Page =
  | 'home'
  | 'shop'
  | 'categories'
  | 'product'
  | 'cart'
  | 'wishlist'
  | 'checkout'
  | 'payment'
  | 'order-success'
  | 'track-order'
  | 'new-arrivals'
  | 'best-sellers'
  | 'contact'
  | 'about'
  | 'return-policy'
  | 'privacy-policy'
  | 'terms'
  | 'faq'
  | 'flash-deals'
  | 'admin'
  | 'admin-login'
  | 'admin-products'
  | 'admin-categories'
  | 'admin-orders'
  | 'admin-product-form'
  | 'admin-account'
  | 'notfound'
  | 'dev-login'
  | 'dev-panel';
