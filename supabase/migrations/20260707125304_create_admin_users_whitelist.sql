/*
# Create admin_users whitelist table

Only emails added to this table are allowed to access the admin panel.
Even if someone signs up via Supabase Auth, they cannot login to admin
unless their email exists in this whitelist.

1. New Tables
   - `admin_users`: stores allowed admin email addresses
     - `id` (uuid, primary key)
     - `email` (text, unique, not null)
     - `created_at` (timestamp)

2. Security
   - RLS enabled
   - Only authenticated users can SELECT their own email from the whitelist
   - No INSERT/UPDATE/DELETE from client — managed via Supabase dashboard only
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_check_own_email" ON admin_users;
CREATE POLICY "admin_check_own_email" ON admin_users FOR SELECT
TO authenticated
USING (email = auth.jwt()->>'email');
