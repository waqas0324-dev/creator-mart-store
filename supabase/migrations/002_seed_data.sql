-- ============================================================================
-- ABR Gadgets — Starter Catalog (optional but recommended)
-- Run this AFTER 001_full_schema.sql. Safe to skip/edit — you can also add
-- everything yourself from the Admin Panel instead.
-- ============================================================================

insert into categories (name, slug, image_url) values
  ('Microphones', 'microphones', '/images/categories/microphones.jpg'),
  ('Tripods', 'tripods', '/images/categories/tripods.jpg'),
  ('Ring Lights', 'ring-lights', '/images/categories/ring-lights.jpg'),
  ('Power Banks', 'power-banks', '/images/categories/power-banks.jpg'),
  ('Phone Holders', 'phone-holders', '/images/categories/phone-holders.jpg'),
  ('Earbuds', 'earbuds', '/images/categories/earbuds.jpg'),
  ('Cables', 'cables', '/images/categories/cables.jpg'),
  ('Speakers', 'speakers', '/images/categories/speakers.jpg')
on conflict (slug) do nothing;

insert into products (name, slug, description, price, original_price, category_id, image_url, images, rating, review_count, stock, is_featured, is_bestseller, discount_percent)
select 'Lavalier Collar Microphone', 'lavalier-collar-microphone',
  'Omni-directional lavalier microphone, perfect for video recording, interviews, YouTube, and vlogging. Delivers high-quality sound and is compatible with smartphones, DSLR cameras, and PCs.',
  1490, 1990, id, '/images/categories/microphones.jpg',
  array['/images/categories/microphones.jpg','/images/products/mic-illustration.jpg'],
  5.0, 2, 50, true, true, 25
from categories where slug = 'microphones';

insert into products (name, slug, description, price, original_price, category_id, image_url, images, rating, review_count, stock, is_featured, is_bestseller, discount_percent)
select 'Aluminum Tripod Stand 3366', 'aluminum-tripod-stand-3366',
  'Lightweight aluminum tripod stand, adjustable height, ideal for cameras and phones.',
  1699, 1999, id, '/images/categories/tripods.jpg',
  array['/images/categories/tripods.jpg','/images/products/df06491e.jpg'],
  4.5, 1, 40, true, true, 15
from categories where slug = 'tripods';

insert into products (name, slug, description, price, original_price, category_id, image_url, images, rating, review_count, stock, is_featured, is_bestseller, discount_percent)
select '26cm Ring Light With Stand', '26cm-ring-light-with-stand',
  'Adjustable brightness ring light with tripod stand, perfect for content creators and video calls.',
  2199, 2699, id, '/images/categories/ring-lights.jpg',
  array['/images/categories/ring-lights.jpg','/images/products/ringlight-illustration.jpg'],
  5.0, 3, 6, true, true, 10
from categories where slug = 'ring-lights';

insert into products (name, slug, description, price, original_price, category_id, image_url, images, rating, review_count, stock, is_featured, is_bestseller, discount_percent)
select '10000mAh Power Bank', '10000mah-power-bank',
  'Fast-charging compact power bank with dual USB output, keeps your devices charged on the go.',
  1899, 2299, id, '/images/categories/power-banks.jpg',
  array['/images/categories/power-banks.jpg','/images/products/5a8d426b.jpg'],
  4.5, 2, 60, true, true, 25
from categories where slug = 'power-banks';

insert into products (name, slug, description, price, original_price, category_id, image_url, images, rating, review_count, stock, is_featured, is_bestseller, discount_percent)
select 'Mobile Holder Stand', 'mobile-holder-stand',
  'Adjustable desktop mobile holder stand, great for video calls and content recording.',
  650, 850, id, '/images/categories/phone-holders.jpg',
  array['/images/categories/phone-holders.jpg','/images/products/phoneholder-illustration.jpg'],
  4.0, 1, 70, true, true, null
from categories where slug = 'phone-holders';

insert into products (name, slug, description, price, original_price, category_id, image_url, images, rating, review_count, stock, is_featured, is_bestseller, discount_percent)
select 'Wireless Earbuds Pro', 'wireless-earbuds-pro',
  'True wireless earbuds with noise isolation and long battery life.',
  2999, 3999, id, '/images/categories/earbuds.jpg',
  array['/images/categories/earbuds.jpg','/images/products/69d27c5c.jpg'],
  5.0, 1, 45, true, false, null
from categories where slug = 'earbuds';

insert into products (name, slug, description, price, original_price, category_id, image_url, images, rating, review_count, stock, is_featured, is_bestseller, discount_percent)
select '3-in-1 Fast Charging Cable', '3-in-1-fast-charging-cable',
  'Durable braided charging cable with three connector types — charge any device with one cable.',
  799, 1099, id, '/images/categories/cables.jpg',
  array['/images/categories/cables.jpg','/images/products/eec31136.jpg'],
  4.5, 1, 90, false, false, 27
from categories where slug = 'cables';

insert into products (name, slug, description, price, original_price, category_id, image_url, images, rating, review_count, stock, is_featured, is_bestseller, discount_percent)
select 'Portable Bluetooth Speaker', 'portable-bluetooth-speaker',
  'Compact wireless speaker with rich bass, perfect for content creation and on-the-go listening.',
  2499, 3199, id, '/images/categories/speakers.jpg',
  array['/images/categories/speakers.jpg','/images/products/speaker-illustration.jpg'],
  5.0, 2, 30, true, false, 22
from categories where slug = 'speakers';
