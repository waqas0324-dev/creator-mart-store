import { useState } from 'react';
import { Search, Trash2, Eye, X } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useOrders } from '../../hooks/useOrders';
import type { Order } from '../../types';

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function AdminOrders() {
  const { orders, loading, updateOrderStatus, deleteOrder } = useOrders();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = orders.filter(o => {
    const matchSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);
    const matchStatus = filterStatus ? o.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500">{orders.length} total orders</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48 bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-2">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search by order ID, customer, phone..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm outline-none" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none font-semibold text-gray-700">
            <option value="">All Status</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">{search || filterStatus ? 'No orders match your filters.' : 'No orders yet.'}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                  <tr>
                    <th className="px-4 py-3 text-left">Order ID</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">Total</th>
                    <th className="px-4 py-3 text-left">Payment</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-bold text-orange-500">{order.order_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{order.customer_name}</p>
                        <p className="text-xs text-gray-400">{order.customer_city}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{order.customer_phone}</td>
                      <td className="px-4 py-3 font-bold">Rs. {order.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 capitalize">{order.payment_method.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} className={`text-xs font-bold px-2 py-1 rounded border-0 outline-none cursor-pointer capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setViewOrder(order)} className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"><Eye size={14} /></button>
                          <button onClick={() => setConfirmDelete(order.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900 text-lg">Order {viewOrder.order_number}</h3>
              <button onClick={() => setViewOrder(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              {[
                ['Customer', viewOrder.customer_name],
                ['Phone', viewOrder.customer_phone],
                ['Email', viewOrder.customer_email || '—'],
                ['City', viewOrder.customer_city],
                ['Address', viewOrder.customer_address],
                ['Payment', viewOrder.payment_method.replace(/_/g, ' ')],
              ].map(([key, val]) => (
                <div key={key}><p className="text-xs text-gray-500 mb-0.5">{key}</p><p className="font-semibold text-gray-900 capitalize">{val}</p></div>
              ))}
            </div>
            {viewOrder.order_items && viewOrder.order_items.length > 0 && (
              <div className="border-t border-gray-100 pt-4 mb-4">
                <p className="text-xs font-bold uppercase text-gray-500 mb-2">Order Items</p>
                <div className="space-y-2">
                  {viewOrder.order_items.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.product_image && <img src={item.product_image} alt="" className="w-10 h-10 object-cover rounded-lg" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-500">Rs. {item.price.toLocaleString()} x {item.quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-orange-500">Rs. {item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-semibold">Rs. {viewOrder.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className="font-semibold text-green-600">Free</span></div>
              <div className="flex justify-between font-black text-base"><span>Total</span><span className="text-orange-500">Rs. {viewOrder.total.toLocaleString()}</span></div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase text-gray-500 mb-2">Update Status</p>
              <div className="flex gap-2 flex-wrap">
                {ORDER_STATUSES.map(s => (
                  <button key={s} onClick={() => { updateOrderStatus(viewOrder.id, s); setViewOrder({ ...viewOrder, status: s }); }} className={`text-xs font-bold px-3 py-1.5 rounded-lg capitalize transition-colors ${viewOrder.status === s ? statusColors[s] : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-black text-gray-900 text-lg mb-2">Delete Order?</h3>
            <p className="text-gray-500 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors">Cancel</button>
              <button onClick={() => { deleteOrder(confirmDelete); setConfirmDelete(null); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
