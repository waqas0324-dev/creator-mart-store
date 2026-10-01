alter table public.products
  add column if not exists description_html text,
  add column if not exists specifications jsonb not null default '[]'::jsonb,
  add column if not exists seo_keywords text;