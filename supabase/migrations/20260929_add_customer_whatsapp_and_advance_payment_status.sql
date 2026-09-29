alter table public.orders
  add column if not exists customer_whatsapp text,
  add column if not exists advance_payment_status text not null default 'pending',
  add column if not exists advance_payment_received_at timestamptz;

update public.orders
set customer_whatsapp = coalesce(nullif(customer_whatsapp, ''), customer_phone)
where customer_whatsapp is null or btrim(customer_whatsapp) = '';

update public.orders
set advance_payment_status = case
  when advance_amount <= 0 then 'received'
  when status in ('confirmed', 'processing', 'shipped', 'delivered') then 'received'
  else 'pending'
end;

alter table public.orders
  alter column customer_whatsapp set not null;

alter table public.orders
  drop constraint if exists orders_advance_payment_status_check;

alter table public.orders
  add constraint orders_advance_payment_status_check
  check (advance_payment_status in ('pending', 'received'));

update public.orders
set advance_payment_received_at = case
  when advance_payment_status = 'received' then coalesce(payment_proof_verified_at, created_at)
  else null
end;
