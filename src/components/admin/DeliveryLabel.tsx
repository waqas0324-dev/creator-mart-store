import type { Order } from '../../types';
import { BRAND_NAME } from '../../lib/brand';
import { useSiteSettings } from '../../context/SiteSettingsContext';

interface Props {
  order: Order;
}

export function DeliveryLabel({ order }: Props) {
  const { settings } = useSiteSettings();
  const itemCount = order.order_items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  const remainingPrice = Math.max(0, order.total - (order.advance_amount || 0));
  const isCod = order.payment_method === 'cash_on_delivery';
  const address = [order.customer_address, order.customer_area, order.customer_city].filter(Boolean).join(', ');
  const firstItem = order.order_items?.[0];

  return (
    <div id="print-area" className="hidden print:block bg-white text-slate-900">
      <div className="mx-auto w-full max-w-[820px] overflow-hidden rounded-[18px] border border-slate-300 bg-white shadow-none print:rounded-none">
        {/* Brand header */}
        <div className="flex items-center justify-between gap-5 bg-[#111827] px-6 py-5 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 min-w-[170px] items-center justify-center rounded-xl bg-white px-3 py-2">
              <img
                src="/images/logo/abr-gadgets.png"
                alt={BRAND_NAME}
                className="max-h-12 w-auto max-w-[160px] object-contain"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300">Official Delivery Label</p>
              <p className="mt-1 text-lg font-black">{BRAND_NAME}</p>
              <p className="text-[10px] text-slate-300">Creator Gear & Gadgets</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-300">Order</p>
            <p className="mt-1 text-2xl font-black tracking-wide">{order.order_number}</p>
            <p className="mt-1 text-[10px] text-slate-300">
              {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Consignee + parcel */}
        <div className="grid grid-cols-[1.45fr_1fr] border-b border-slate-200">
          <div className="px-6 py-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Deliver To</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{order.customer_name}</p>
            <p className="mt-1 text-lg font-bold text-slate-700">{order.customer_phone}</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{address}</p>
          </div>
          <div className="border-l border-slate-200 bg-slate-50 px-5 py-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Parcel Details</p>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] uppercase text-slate-400">Pieces</p>
                <p className="font-black text-slate-900">{order.parcel_pieces || 1} PCS</p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-400">Weight</p>
                <p className="font-black text-slate-900">{order.parcel_weight_kg != null ? `${order.parcel_weight_kg} kg` : '—'}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-400">Payment</p>
                <p className="font-black text-slate-900">{isCod ? 'CASH ON DELIVERY' : 'PAID'}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-400">Items</p>
                <p className="font-black text-slate-900">{itemCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking + collection */}
        <div className="grid grid-cols-2 gap-0 border-b border-slate-200">
          <div className="px-6 py-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Tracking ID</p>
            <p className="mt-2 text-xl font-black tracking-wide text-slate-900">
              {order.tracking_number || 'To be assigned'}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">Add courier tracking ID when available.</p>
          </div>
          <div className="border-l border-slate-200 bg-orange-50 px-6 py-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">
              {isCod ? 'Remaining Price' : 'Payment Status'}
            </p>
            <p className="mt-1 text-3xl font-black text-orange-600">
              {isCod ? `Rs. ${remainingPrice.toLocaleString()}` : 'PAID'}
            </p>
            {isCod && order.advance_amount > 0 && (
              <p className="mt-1 text-xs font-semibold text-green-700">
                Advance received: Rs. {order.advance_amount.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Product */}
        {firstItem && (
          <div className="border-b border-slate-200 px-6 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Package Contents</p>
            <div className="mt-3 flex items-center gap-4">
              <img
                src={firstItem.product_image ? firstItem.product_image : '/images/logo/abr-mark.png'}
                alt=""
                className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-base font-black text-slate-900">{firstItem.product_name}</p>
                <p className="text-xs text-slate-500">
                  Quantity: {firstItem.quantity} · Product value: Rs. {firstItem.subtotal.toLocaleString()}
                </p>
                {order.order_items && order.order_items.length > 1 && (
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    + {order.order_items.length - 1} additional product line(s)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Address / shipper */}
        <div className="grid grid-cols-2 border-b border-slate-200">
          <div className="px-6 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">From</p>
            <p className="mt-1 font-black">{BRAND_NAME}</p>
            <p className="text-xs text-slate-600">{settings.whatsapp_number}</p>
            <p className="text-xs text-slate-600">{settings.store_address}</p>
          </div>
          <div className="border-l border-slate-200 px-6 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Return Address</p>
            <p className="mt-1 text-xs font-semibold text-slate-700">{settings.store_address}</p>
          </div>
        </div>

        {(order.shipping_note || order.notes) && (
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Special Instruction</p>
            <p className="mt-1 text-xs font-bold text-slate-800">{order.shipping_note || order.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 bg-slate-100 px-6 py-3 text-[9px] text-slate-500">
          <span>{BRAND_NAME} · {order.order_number}</span>
          <span className="font-bold text-slate-700">Verify name · phone · address · pieces · remaining price before dispatch.</span>
        </div>
      </div>
    </div>
  );
}
