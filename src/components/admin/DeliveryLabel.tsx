import type { Order } from '../../types';
import { BRAND_NAME } from '../../lib/brand';
import { useSiteSettings } from '../../context/SiteSettingsContext';

interface Props {
  order: Order;
}

/**
 * Compact one-page courier/packing label.
 * The actual courier AWB is supplied by the courier; this label keeps the
 * order ID and courier tracking data together with all key parcel details.
 */
export function DeliveryLabel({ order }: Props) {
  const { settings } = useSiteSettings();
  const itemCount = order.order_items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  const amountDue = Math.max(0, order.total - (order.advance_amount || 0));
  const isCod = order.payment_method === 'cash_on_delivery';
  const address = [order.customer_address, order.customer_area, order.customer_city].filter(Boolean).join(', ');

  return (
    <div id="print-area" className="hidden print:block bg-white text-black">
      <div className="mx-auto w-full max-w-[760px] border-2 border-black p-4 text-[11px] leading-tight">
        <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/images/logo/abr-gadgets.png" alt={BRAND_NAME} className="h-12 w-auto object-contain" />
          </div>
          <div className="text-right shrink-0">
            <p className="font-black text-sm">COURIER PARCEL</p>
            <p className="font-bold">{order.courier_name || 'Courier: Not Assigned'}</p>
            <p>{new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-[1.2fr_1fr] gap-3 border-b-2 border-black py-3">
          <div>
            <p className="text-[9px] font-black uppercase text-gray-500">Deliver To / Consignee</p>
            <p className="text-xl font-black mt-1">{order.customer_name}</p>
            <p className="text-base font-bold mt-1">{order.customer_phone}</p>
            <p className="text-sm font-semibold mt-1 leading-snug">{address}</p>
          </div>
          <div className="border-l-2 border-black pl-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <div>
                <p className="text-[9px] font-black uppercase text-gray-500">Order ID</p>
                <p className="font-black text-sm">{order.order_number}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-gray-500">Pieces</p>
                <p className="font-black text-sm">{order.parcel_pieces || 1} PCS</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-gray-500">Weight</p>
                <p className="font-black text-sm">{order.parcel_weight_kg != null ? `${order.parcel_weight_kg} kg` : 'Not set'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-gray-500">Payment</p>
                <p className="font-black text-sm">{isCod ? 'COD' : 'PAID'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1.25fr_1fr] gap-3 py-3 border-b-2 border-black">
          <div>
            <p className="text-[9px] font-black uppercase text-gray-500">Tracking / AWB / CN</p>
            <p className="font-black text-2xl tracking-wider mt-1">{order.tracking_number || 'TRACKING PENDING'}</p>
            {order.tracking_url && (
              <p className="text-[9px] mt-1 break-all">{order.tracking_url}</p>
            )}
          </div>
          <div className="border-l-2 border-black pl-3">
            <p className="text-[9px] font-black uppercase text-gray-500">Collect on Delivery</p>
            <p className="font-black text-2xl mt-1">{isCod && amountDue > 0 ? `Rs. ${amountDue.toLocaleString()}` : 'PAID'}</p>
            <p className="text-[9px] mt-1">{itemCount} item(s) · Total Rs. {order.total.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 py-3 border-b border-black">
          <div>
            <p className="text-[9px] font-black uppercase text-gray-500">From / Shipper</p>
            <p className="font-black">{BRAND_NAME}</p>
            <p>{settings.whatsapp_number}</p>
            <p>{settings.store_address}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-gray-500">Return Address</p>
            <p>{settings.store_address}</p>
          </div>
        </div>

        {order.order_items && order.order_items.length > 0 && (
          <div className="py-2 border-b border-black">
            <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Parcel Contents</p>
            <p className="font-semibold">
              {order.order_items.map(item => `${item.product_name} ×${item.quantity}`).join(' · ')}
            </p>
          </div>
        )}

        {(order.shipping_note || order.notes) && (
          <div className="py-2">
            <p className="text-[9px] font-black uppercase text-gray-500">Special Instruction</p>
            <p className="font-bold">{order.shipping_note || order.notes}</p>
          </div>
        )}

        <div className="flex justify-between items-end gap-4 pt-2 text-[9px]">
          <p>Order: {order.order_number} · {BRAND_NAME}</p>
          <p className="font-bold">Please verify customer phone, address, pieces and COD amount before dispatch.</p>
        </div>
      </div>
    </div>
  );
}
