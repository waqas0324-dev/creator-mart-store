-- ABR Gadgets product content upgrade
-- Adds separate customer-facing mini description and clickable product tags.

alter table products
  add column if not exists mini_description text;

alter table products
  add column if not exists visible_tags text[] not null default '{}';

create index if not exists products_visible_tags_gin_idx
  on products using gin (visible_tags);
