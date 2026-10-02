-- Harden store RLS and keep the checkout schema compatible with the current form.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where id = auth.uid()
  )
  or exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
       or lower(email) = lower(coalesce(auth.jwt()->>'email',''))
  );
$$;

drop policy if exists "orders_public_read" on public.orders;
drop policy if exists "orders_admin_update" on public.orders;
drop policy if exists "orders_admin_delete" on public.orders;
drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert" on public.orders
  for insert to anon, authenticated with check (true);
create policy "orders_admin_read" on public.orders
  for select to authenticated using (public.is_admin());
create policy "orders_admin_update" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "orders_admin_delete" on public.orders
  for delete to authenticated using (public.is_admin());

drop policy if exists "order_items_public_read" on public.order_items;
drop policy if exists "order_items_public_insert" on public.order_items;
create policy "order_items_public_insert" on public.order_items
  for insert to anon, authenticated with check (true);
create policy "order_items_admin_read" on public.order_items
  for select to authenticated using (public.is_admin());

drop policy if exists "products_admin_write" on public.products;
drop policy if exists "products_admin_update" on public.products;
drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_write" on public.products
  for insert to authenticated with check (public.is_admin());
create policy "products_admin_update" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "products_admin_delete" on public.products
  for delete to authenticated using (public.is_admin());

drop policy if exists "categories_admin_write" on public.categories;
drop policy if exists "categories_admin_update" on public.categories;
drop policy if exists "categories_admin_delete" on public.categories;
create policy "categories_admin_write" on public.categories
  for insert to authenticated with check (public.is_admin());
create policy "categories_admin_update" on public.categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "categories_admin_delete" on public.categories
  for delete to authenticated using (public.is_admin());

drop policy if exists "admin_users_authenticated_read" on public.admin_users;
create policy "admin_users_self_read" on public.admin_users
  for select to authenticated
  using (user_id = auth.uid() or lower(email) = lower(coalesce(auth.jwt()->>'email','')));

drop policy if exists "developer_users_authenticated_read" on public.developer_users;
create policy "developer_users_self_read" on public.developer_users
  for select to authenticated
  using (user_id = auth.uid() or lower(email) = lower(coalesce(auth.jwt()->>'email','')));

alter table public.orders alter column customer_city drop not null;
