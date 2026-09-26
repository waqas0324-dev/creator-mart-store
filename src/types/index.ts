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
  notes: string | null;
  owner_note: string | null;
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
  announcement_messages: string;
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
  footer_quick_home: string;
  footer_quick_shop: string;
  footer_quick_new_arrivals: string;
  footer_quick_best_sellers: string;
  footer_quick_contact: string;
  footer_quick_about: string;
  footer_quick_return: string;
  footer_quick_privacy: string;
  footer_categories: string;
  footer_copyright: string;
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
  | 'admin'
  | 'admin-login'
  | 'admin-products'
  | 'admin-categories'
  | 'admin-orders'
  | 'admin-settings'
  | 'admin-product-form'
  | 'dev-login'
  | 'dev-panel';
