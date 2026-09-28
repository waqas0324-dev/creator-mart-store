import { CheckCircle, MessageCircle } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useOrder } from '../hooks/useOrders';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { toWhatsAppNumber } from '../lib/brand';
import { STATUS_LABELS } from '../lib/orderStatus';

export function OrderSuccess() {
  const { nav, navigate } = useNavigation();
  const { order, loading } = useOrder(nav.orderId || '');
  const { settings } = useSiteSettings();
  const advanceVerified = ['confirmed', 'processing', 'shipped', 'delivered'].includes(order?.status || '');
  const effectiveAdvance = order?.advance_waived ? 0 : (order?.advance_amount || 0);

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          ORDER PLACED SUCCESSFULLY!
        </h1>
        <p className="text-gray-500 mb-5">
          Thank you for your order. Your order has been placed successfully.
        </p>

        {loading ? (
          <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2 mx-auto mb-4" />
        ) : order ? (
          <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left">
            <p className="text-sm font-bold text-gray-700 mb-3">Order Details</p>
            <div className="space-y-2">
              {[
                ['Order ID', order.order_number],
                ['Customer', order.customer_name],
                ['Phone', order.customer_phone],
                ['Product Subtotal', `Rs. ${order.subtotal.toLocaleString()}`],
                ['Delivery Charges', order.shipping > 0 ? `Rs. ${order.shipping.toLocaleString()}` : 'Free'],
                ['Order Total', `Rs. ${order.total.toLocaleString()}`],
                ['Payment', order.payment_method.replace(/_/g, ' ')],
              ].map(([key, val]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-500">{key}</span>
                  <span className={`font-bold ${key === 'Order ID' || key === 'Order Total' ? 'text-orange-500' : 'text-gray-900 capitalize'}`}>{val}</span>
                </div>
              ))}
              {(() => {
                const discount = Math.max(0, order.subtotal + order.shipping - order.total);
                return discount > 0 ? (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Full Advance Discount</span>
                    <span className="font-bold">-Rs. {discount.toLocaleString()}</span>
                  </div>
                ) : null;
              })()}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded">{STATUS_LABELS[order.status] || order.status}</span>
              </div>
              {order && (order.advance_amount > 0 || order.advance_waived) && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{advanceVerified ? "Advance Paid" : "Advance Amount"}</span>
                    <span className="font-bold text-green-600">{order.advance_waived ? 'Waived' : `Rs. ${order.advance_amount.toLocaleString()}`}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                    <span className="font-bold text-gray-700">{advanceVerified ? "Remaining Price" : "Expected Remaining Price"}</span>
                    <span className="font-black text-orange-500">Rs. {Math.max(0, order.total - effectiveAdvance).toLocaleString()}</span>
                  </div>
                </>
              )}
              {order.tracking_number && (
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Tracking / AWB</span>
                  {order.tracking_url ? (
                    <a href={order.tracking_url} target="_blank" rel="noreferrer" className="font-bold text-orange-500 underline">{order.tracking_number}</a>
                  ) : (
                    <span className="font-bold text-gray-900">{order.tracking_number}</span>
                  )}
                </div>
              )}
            </div>
            {order.order_items && order.order_items.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Items Ordered</p>
                {order.order_items.map(item => (
                  <div key={item.id} className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 truncate mr-2">{item.product_name} x{item.quantity}</span>
                    <span className="font-semibold flex-shrink-0">Rs. {item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {order && !order.advance_waived && order.advance_amount > 0 && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-left">
            <p className="text-sm font-black text-green-800">Next step: send your payment screenshot</p>
            <p className="text-xs text-green-700 mt-1">
              Send the screenshot of your Rs. {order.advance_amount.toLocaleString()} advance payment to our WhatsApp. Our admin will verify it and then change the order status to Confirmed.
            </p>
            <a
              href={`https://wa.me/${toWhatsAppNumber(settings.whatsapp_number)}?text=${encodeURIComponent(`Payment screenshot for order ${order.order_number}`)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-lg transition-colors"
            >
              <MessageCircle size={17} /> Send Screenshot on WhatsApp
            </a>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('shop')} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors">
            Continue Shopping
          </button>
          <button onClick={() => navigate('track-order')} className="w-full border-2 border-gray-200 hover:border-orange-300 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors text-sm">
            Track Your Order
          </button>
        </div>
      </div>
    </div>
  );
}
