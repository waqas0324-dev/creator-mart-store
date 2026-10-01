-- Backward-compatible migration: adds mini description + tags to products.
-- Safe to run multiple times; does not touch existing data.
ALTER TABLE products ADD COLUMN IF NOT EXISTS mini_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
