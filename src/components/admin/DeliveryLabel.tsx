import type { Order } from '../../types';
import { BRAND_NAME } from '../../lib/brand';
import { useSiteSettings } from '../../context/SiteSettingsContext';

interface Props {
  order: Order;
}

export function DeliveryLabel({ order }: Props) {
  const { settings } = useSiteSettings();
  const effectiveAdvance = order.advance_payment_status === 'received' ? (order.advance_amount || 0) : 0;
  const remainingPrice = Math.max(0, order.total - effectiveAdvance);
  const advanceDiscount = Math.max(0, order.subtotal + order.shipping - order.total);
  const isCod = order.payment_method === 'cash_on_delivery';
  const isAdvancePaid = !isCod && order.advance_payment_status === 'received';
  const deliveryPaid = !isCod || order.advance_payment_status === 'received';
  const address = [order.customer_address, order.customer_area, order.customer_city].filter(Boolean).join(', ');

  return (
    <div id="print-area" className="hidden print:block bg-white text-slate-900">
      <div className="mx-auto w-full max-w-[720px] overflow-hidden rounded-sm border-2 border-slate-800 bg-white shadow-none print:break-inside-avoid">
        <div className="flex items-stretch justify-between bg-[#111827] text-white">
          <div className="flex min-w-0 items-center gap-4 px-6 py-4">
            <img
              src="/images/logo/abr-gadgets-transparent.png"
              alt={BRAND_NAME}
              className="max-h-14 w-auto max-w-[190px] object-contain"
            />
            <div className="border-l-2 border-orange-500 pl-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-orange-300">Dispatch Label</p>
              <p className="mt-1 text-xl font-black tracking-tight">{BRAND_NAME}</p>
              <p className="text-[9px] font-medium tracking-wide text-slate-300">Creator Gear & Gadgets</p>
            </div>
          </div>
          <div className="flex min-w-[220px] flex-col justify-center bg-orange-500 px-6 py-4 text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-100">
              {isCod ? 'Cash on Delivery' : (isAdvancePaid ? 'Payment: Full Advance' : 'Payment Pending')}
            </p>
            <p className="mt-1 text-3xl font-black tracking-tight drop-shadow-sm">
              {isCod ? `Rs. ${remainingPrice.toLocaleString()}` : (isAdvancePaid ? 'Rs. 0' : `Rs. ${order.total.toLocaleString()}`)}
            </p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-100">
              {isCod ? 'Collect on delivery' : (isAdvancePaid ? 'Nothing to collect ✓' : 'Advance pending verification')}
            </p>
          </div>
        </div>
        <div className="h-1 bg-orange-500" />

        <div className="grid grid-cols-2">
          <div className="px-5 py-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-600">Ship From</p>
            <p className="mt-2 text-sm font-black text-slate-900">{BRAND_NAME}</p>
            <p className="mt-1 text-xs font-bold text-slate-700">{settings.whatsapp_number}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{settings.store_address}</p>
          </div>
          <div className="border-l-2 border-orange-100 bg-white px-5 py-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-600">Deliver To — Customer</p>
            <div className="mt-3 grid grid-cols-[72px_1fr] gap-x-3 gap-y-2.5 text-xs">
              <span className="font-bold uppercase text-slate-400 text-[10px]">Name</span>
              <span className="text-sm font-black text-slate-900">{order.customer_name || '—'}</span>
              <span className="font-bold uppercase text-slate-400 text-[10px]">Phone</span>
              <span className="text-sm font-black text-slate-900">{order.customer_phone || '—'}</span>
              <span className="font-bold uppercase text-slate-400 text-[10px]">WhatsApp</span>
              <span className="font-bold text-slate-800">{order.customer_whatsapp || order.customer_phone || '—'}</span>
              <span className="font-bold uppercase text-slate-400 text-[10px]">Email</span>
              <span className="font-semibold break-all text-slate-700">{order.customer_email || '—'}</span>
              <span className="font-bold uppercase text-slate-400 text-[10px]">Address</span>
              <span className="font-semibold leading-relaxed text-slate-700">{address || '—'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-y-2 border-slate-800 bg-slate-900 px-5 py-2 text-xs text-white">
          <p><span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Order </span><span className="font-black tracking-wide text-orange-400">{order.order_number}</span></p>
          <p><span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Date </span><span className="font-bold text-white">{new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
        </div>

        <div className="border-b border-slate-200">
          <div className="bg-slate-100 px-5 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Package Contents</p>
          </div>
          <div className="divide-y divide-slate-100">
            {(order.order_items || []).map(item => (
              <div key={item.id} className="grid grid-cols-[1fr_90px_110px] items-center gap-3 px-5 py-4 text-sm">
                <p className="font-bold text-slate-800">{item.product_name}</p>
                <p className="text-center font-semibold text-slate-500">Qty {item.quantity}</p>
                <p className="text-right font-black text-slate-900">Rs. {item.subtotal.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-5">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-600">Payment Summary</p>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-600">Product subtotal</span><span className="font-bold text-slate-900">Rs. {order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Delivery</span>
              <span className="font-bold">
                {order.shipping > 0 ? (
                  <>
                    <span className={`mr-2 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${deliveryPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {deliveryPaid ? '✓ Paid' : 'Pending'}
                    </span>
                    <span className="text-slate-900">Rs. {order.shipping.toLocaleString()}</span>
                  </>
                ) : (
                  <span className="text-slate-900">Free</span>
                )}
              </span>
            </div>
            {advanceDiscount > 0 && (
              <div className="flex justify-between text-green-700"><span>Full advance discount</span><span className="font-bold">-Rs. {advanceDiscount.toLocaleString()}</span></div>
            )}
            <div className="flex justify-between border-t border-slate-300 pt-1.5 text-sm font-black"><span>Order total</span><span>Rs. {order.total.toLocaleString()}</span></div>
            {isCod && effectiveAdvance > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Advance received</span>
                <span className="font-bold">Rs. {effectiveAdvance.toLocaleString()} ✓</span>
              </div>
            )}
            <div className="mt-1 flex justify-between rounded-sm bg-slate-900 px-3 py-2 text-sm font-black text-white">
              <span className="uppercase tracking-wide text-[11px]">{isCod ? 'Collect on delivery' : 'Paid'}</span>
              <span className="text-orange-400">{isCod ? `Rs. ${remainingPrice.toLocaleString()}` : `Rs. ${order.total.toLocaleString()}`}</span>
            </div>
          </div>
        </div>

        {(order.shipping_note || order.notes) && (
          <div className="border-t border-slate-200 bg-amber-50 px-5 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">Dispatch Note</p>
            <p className="mt-1 text-xs font-bold text-slate-800">
              {order.shipping_note || order.notes}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 bg-slate-900 px-5 py-3 text-[9px] text-slate-300">
          <span className="font-bold">{BRAND_NAME} · {order.order_number}</span>
          <span className="font-bold text-white">Verify recipient · phone · address · pieces · collection amount before dispatch.</span>
        </div>
      </div>
    </div>
  );
}
