import type { Order } from '../../types';
import { BRAND_NAME } from '../../lib/brand';
import { useSiteSettings } from '../../context/SiteSettingsContext';

interface Props {
  order: Order;
}

export function DeliveryLabel({ order }: Props) {
  const { settings } = useSiteSettings();
  const itemCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const effectiveAdvance = order.advance_waived ? 0 : (order.advance_amount || 0);
  const remainingPrice = Math.max(0, order.total - effectiveAdvance);
  const advanceDiscount = Math.max(0, order.subtotal + order.shipping - order.total);
  const isCod = order.payment_method === 'cash_on_delivery';
  const address = [order.customer_address, order.customer_area, order.customer_city].filter(Boolean).join(', ');

  return (
    <div id="print-area" className="hidden print:block bg-white text-slate-900">
      <div className="mx-auto w-full max-w-[820px] overflow-hidden border border-slate-300 bg-white shadow-none print:break-inside-avoid">
        <div className="flex items-stretch justify-between border-b-4 border-orange-500 bg-[#111827] text-white">
          <div className="flex min-w-0 items-center gap-4 px-6 py-4">
            <img
              src="/images/logo/abr-gadgets-transparent.png"
              alt={BRAND_NAME}
              className="max-h-14 w-auto max-w-[190px] object-contain"
            />
            <div className="border-l border-slate-600 pl-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-orange-300">Dispatch Label</p>
              <p className="mt-1 text-lg font-black">{BRAND_NAME}</p>
              <p className="text-[9px] text-slate-300">Creator Gear & Gadgets</p>
            </div>
          </div>
          <div className="min-w-[210px] bg-orange-500 px-5 py-4 text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-100">
              {isCod ? 'Cash on Delivery' : 'Paid in Full'}
            </p>
            <p className="mt-1 text-2xl font-black">
              {isCod ? `Rs. ${remainingPrice.toLocaleString()}` : 'PAID'}
            </p>
            <p className="text-[9px] font-semibold text-orange-100">
              {isCod ? (order.advance_waived ? 'Collect on delivery · No advance' : 'Collect on delivery') : 'Full advance received'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[1.55fr_1fr] border-b border-slate-200">
          <div className="px-6 py-5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-500">Deliver To — Customer</p>
            <div className="mt-3 grid grid-cols-[82px_1fr] gap-x-3 gap-y-2 text-xs">
              <span className="font-bold text-slate-400">Name</span>
              <span className="font-black text-slate-900">{order.customer_name || '—'}</span>
              <span className="font-bold text-slate-400">Phone</span>
              <span className="font-bold text-slate-800">{order.customer_phone || '—'}</span>
              <span className="font-bold text-slate-400">Email</span>
              <span className="font-semibold break-all text-slate-700">{order.customer_email || '—'}</span>
              <span className="font-bold text-slate-400">Address</span>
              <span className="font-semibold leading-relaxed text-slate-700">{address || '—'}</span>
            </div>
          </div>
          <div className="border-l border-slate-200 bg-slate-50 px-5 py-5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-500">Order Reference</p>
            <p className="mt-1 text-xl font-black tracking-wide text-slate-900">{order.order_number}</p>
            <p className="mt-2 text-[9px] uppercase text-slate-400">Order Date</p>
            <p className="text-sm font-bold text-slate-700">
              {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 border-b border-slate-200">
          <div className="px-5 py-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-orange-500">Tracking ID</p>
            <p className="mt-1 text-lg font-black tracking-wide text-slate-900">{order.tracking_number || 'Not assigned yet'}</p>
          </div>
          <div className="border-l border-slate-200 px-5 py-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-orange-500">Pieces / Weight</p>
            <p className="mt-1 text-lg font-black text-slate-900">
              {order.parcel_pieces || 1} PCS · {order.parcel_weight_kg != null ? `${order.parcel_weight_kg} kg` : 'Weight pending'}
            </p>
          </div>
          <div className="border-l border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-orange-500">Payment</p>
            <p className="mt-1 text-lg font-black text-slate-900">{isCod ? 'COD' : 'FULL ADVANCE'}</p>
          </div>
        </div>

        <div className="border-b border-slate-200">
          <div className="bg-slate-100 px-5 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Package Contents</p>
          </div>
          <div className="divide-y divide-slate-100">
            {(order.order_items || []).map(item => (
              <div key={item.id} className="grid grid-cols-[1fr_90px_110px] items-center gap-3 px-5 py-3 text-sm">
                <p className="font-bold text-slate-800">{item.product_name}</p>
                <p className="text-center font-semibold text-slate-500">Qty {item.quantity}</p>
                <p className="text-right font-black text-slate-900">Rs. {item.subtotal.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1.15fr] border-b border-slate-200">
          <div className="px-5 py-4">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-500">Ship From</p>
            <p className="mt-1 font-black text-slate-900">{BRAND_NAME}</p>
            <p className="text-xs font-semibold text-slate-600">{settings.whatsapp_number}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{settings.store_address}</p>
          </div>
          <div className="border-l border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-500">Payment Summary</p>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between"><span>Product subtotal</span><span className="font-bold">Rs. {order.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span className="font-bold">{order.shipping > 0 ? `Rs. ${order.shipping.toLocaleString()}` : 'Free'}</span></div>
              {advanceDiscount > 0 && (
                <div className="flex justify-between text-green-700"><span>Full advance discount</span><span className="font-bold">-Rs. {advanceDiscount.toLocaleString()}</span></div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-1 font-black"><span>Order total</span><span>Rs. {order.total.toLocaleString()}</span></div>
              {isCod && (
                <div className="flex justify-between text-green-700">
                  <span>{order.advance_waived ? 'Advance' : 'Advance received'}</span>
                  <span className="font-bold">{order.advance_waived ? 'Waived' : `Rs. ${(order.advance_amount || 0).toLocaleString()}`}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-orange-200 pt-1 text-sm font-black text-orange-600">
                <span>{isCod ? 'Collect on delivery' : 'Paid'}</span>
                <span>{isCod ? `Rs. ${remainingPrice.toLocaleString()}` : `Rs. ${order.total.toLocaleString()}`}</span>
              </div>
            </div>
          </div>
        </div>

        {(order.shipping_note || order.notes || order.advance_waiver_note) && (
          <div className="border-b border-slate-200 bg-amber-50 px-5 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">Dispatch Note</p>
            <p className="mt-1 text-xs font-bold text-slate-800">
              {order.shipping_note || order.notes || order.advance_waiver_note}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 bg-slate-900 px-5 py-3 text-[9px] text-slate-300">
          <span>{BRAND_NAME} · {order.order_number}</span>
          <span className="font-bold text-white">Verify recipient · phone · address · pieces · collection amount before dispatch.</span>
        </div>
      </div>
    </div>
  );
}
