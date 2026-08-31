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
  notes: string | null;
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
  | 'checkout'
  | 'payment'
  | 'order-success'
  | 'track-order'
  | 'flash-deals'
  | 'new-arrivals'
  | 'best-sellers'
  | 'contact'
  | 'login'
  | 'account'
  | 'admin'
  | 'admin-login'
  | 'admin-products'
  | 'admin-orders'
  | 'admin-product-form';
