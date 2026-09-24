-- ============================================================================
-- ABR Gadgets — Full Production Database Schema
-- Run this ONCE in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- CATEGORIES
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  created_at timestamptz not null default now()
);

-- PRODUCTS
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price integer not null,
  original_price integer,
  category_id uuid references categories(id) on delete set null,
  image_url text not null,
  images text[] not null default '{}',
  rating real not null default 0,
  review_count integer not null default 0,
  stock integer not null default 0,
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  discount_percent integer,
  created_at timestamptz not null default now()
);

-- ORDERS
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_address text not null,
  customer_city text not null,
  customer_area text,
  payment_method text not null,
  subtotal integer not null,
  shipping integer not null default 0,
  total integer not null,
  status text not null default 'new',
  coupon_code text,
  notes text,
  owner_note text,
  created_at timestamptz not null default now()
);

-- ORDER ITEMS
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_image text,
  price integer not null,
  quantity integer not null,
  subtotal integer not null,
  created_at timestamptz not null default now()
);

-- REVIEWS
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  customer_name text not null,
  phone text,
  rating real not null,
  comment text,
  created_at timestamptz not null default now()
);

-- ADMIN WHITELIST — only emails listed here (and logged in via Supabase Auth)
-- can access the admin panel. Manage this table yourself in the Table Editor.
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reviews enable row level security;
alter table admin_users enable row level security;

-- Categories & Products: anyone can read (storefront), only logged-in admin can write
create policy "categories_public_read" on categories for select using (true);
create policy "categories_admin_write" on categories for insert with check (auth.role() = 'authenticated');
create policy "categories_admin_update" on categories for update using (auth.role() = 'authenticated');
create policy "categories_admin_delete" on categories for delete using (auth.role() = 'authenticated');

create policy "products_public_read" on products for select using (true);
create policy "products_admin_write" on products for insert with check (auth.role() = 'authenticated');
create policy "products_admin_update" on products for update using (auth.role() = 'authenticated');
create policy "products_admin_delete" on products for delete using (auth.role() = 'authenticated');

-- Orders: customers can create + look up their own order (checkout has no login),
-- only admin can update/delete
create policy "orders_public_insert" on orders for insert with check (true);
create policy "orders_public_read" on orders for select using (true);
create policy "orders_admin_update" on orders for update using (auth.role() = 'authenticated');
create policy "orders_admin_delete" on orders for delete using (auth.role() = 'authenticated');

create policy "order_items_public_insert" on order_items for insert with check (true);
create policy "order_items_public_read" on order_items for select using (true);

-- Reviews: anyone can read + submit a review
create policy "reviews_public_read" on reviews for select using (true);
create policy "reviews_public_insert" on reviews for insert with check (true);

-- Admin whitelist: only readable by a logged-in session (checked right after login)
create policy "admin_users_authenticated_read" on admin_users for select using (auth.role() = 'authenticated');

-- ============================================================================
-- STORAGE BUCKET for product images
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects for select using (bucket_id = 'product-images');
create policy "product_images_admin_upload" on storage.objects for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
create policy "product_images_admin_update" on storage.objects for update using (bucket_id = 'product-images' and auth.role() = 'authenticated');
create policy "product_images_admin_delete" on storage.objects for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated');
