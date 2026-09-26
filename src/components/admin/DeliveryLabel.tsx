import type { Order } from '../../types';
import { BRAND_NAME } from '../../lib/brand';
import { useSiteSettings } from '../../context/SiteSettingsContext';

interface Props {
  order: Order;
}

/**
 * The single print document used when packing an order — combines the
 * parcel address label (large, easy to read while packing) with the full
 * order details (products, pricing, payment) on one A4 sheet, so nothing
 * else needs to be printed separately.
 */
export function DeliveryLabel({ order }: Props) {
  const { settings } = useSiteSettings();
  const WHATSAPP_NUMBER = settings.whatsapp_number;
  const itemCount = order.order_items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  const amountDue = order.total - (order.advance_amount || 0);
  const showCollect = amountDue > 0;

  return (
    <div id="print-area" className="hidden print:block bg-white text-black p-8 text-sm">
      <div className="border-4 border-black p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
          <div className="flex items-center gap-2">
            <img src="/images/logo/abr-mark.png" alt="" className="h-12 object-contain" />
            <span className="font-black text-2xl tracking-wide">{BRAND_NAME}</span>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">From: {BRAND_NAME}</p>
            <p>WhatsApp: {WHATSAPP_NUMBER}</p>
          </div>
        </div>

        <div className="flex justify-between text-sm mb-5">
          <p><span className="font-bold">Order ID:</span> {order.order_number}</p>
          <p><span className="font-bold">Date:</span> {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>

        {/* Address — large and clear, for the parcel */}
        <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">Deliver To</p>
        <p className="text-2xl font-black mb-2">{order.customer_name}</p>
        <p className="text-xl font-bold mb-2">{order.customer_phone}</p>
        <p className="text-lg leading-snug mb-1">{order.customer_address}{order.customer_area ? `, ${order.customer_area}` : ''}</p>
        <p className="text-lg font-bold uppercase mb-5">{order.customer_city}</p>

        {/* Ordered products */}
        {order.order_items && order.order_items.length > 0 && (
          <div className="border-t-2 border-black pt-4 mb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Ordered Products</p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-black text-left text-xs uppercase">
                  <th className="py-1">Product</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items.map(item => (
                  <tr key={item.id} className="border-b border-gray-300">
                    <td className="py-1">{item.product_name}</td>
                    <td className="py-1 text-center">{item.quantity}</td>
                    <td className="py-1 text-right">Rs. {item.price.toLocaleString()}</td>
                    <td className="py-1 text-right">Rs. {item.subtotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end mb-4">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>Rs. {order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{order.shipping > 0 ? `Rs. ${order.shipping.toLocaleString()}` : 'Free'}</span></div>
            <div className="flex justify-between font-black text-base border-t border-black pt-1"><span>Total</span><span>Rs. {order.total.toLocaleString()}</span></div>
          </div>
        </div>

        {/* Payment + item count + COD collect amount */}
        <div className="border-t-2 border-black pt-4 grid grid-cols-2 gap-4 text-base">
          <p><span className="font-bold">Payment:</span> {order.payment_method.replace(/_/g, ' ')}</p>
          <p><span className="font-bold">Items:</span> {itemCount}</p>
          {showCollect && (
            <p className="col-span-2 text-xl font-black bg-gray-100 border-2 border-black rounded px-3 py-2 text-center">
              COLLECT: Rs. {amountDue.toLocaleString()}
            </p>
          )}
        </div>

        {order.notes && (
          <div className="border-t border-gray-300 mt-4 pt-3 text-sm">
            <span className="font-bold">Customer Note:</span> {order.notes}
          </div>
        )}
      </div>
    </div>
  );
}
