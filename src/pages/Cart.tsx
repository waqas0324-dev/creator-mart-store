import { Minus, Plus, X, ShoppingBag, Tag } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { onImageError, resolveProductImage } from '../lib/imageFallback';

export function Cart() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const { navigate } = useNavigation();
  const [coupon, setCoupon] = useState('');
  const total = subtotal;

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
            <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
            <span className="mx-2">/</span>
            <span className="font-semibold text-gray-800">Your Cart</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-2xl font-black text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-400 mb-6">Add some products to get started!</p>
          <button onClick={() => navigate('shop')} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-lg transition-colors">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="font-semibold text-gray-800">Your Cart</span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-black text-gray-900 uppercase mb-6">Your Cart</h1>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-12 bg-gray-50 px-4 py-3 text-xs font-bold uppercase text-gray-500 border-b border-gray-100">
                <div className="col-span-5">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>
              {items.map(item => (
                <div key={item.product.id} className="grid grid-cols-12 items-center px-4 py-4 border-b border-gray-50 hover:bg-gray-50/50">
                  <div className="col-span-5 flex items-center gap-3">
                    <button onClick={() => removeItem(item.product.id)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                      <X size={16} />
                    </button>
                    <img src={resolveProductImage(item.product.image_url)} alt={item.product.name} referrerPolicy="no-referrer" onError={(e) => onImageError(e, item.product.name)} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                    <p className="text-sm font-semibold text-gray-900 hover:text-orange-500 cursor-pointer transition-colors line-clamp-2" onClick={() => navigate('product', { productSlug: item.product.slug })} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.product.name}
                    </p>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-semibold text-gray-700">Rs. {item.product.price.toLocaleString()}</span>
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="px-2 py-1.5 hover:bg-gray-100">
                        <Minus size={12} />
                      </button>
                      <span className="px-2 py-1.5 text-sm font-bold border-x border-gray-200 min-w-[2rem] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="px-2 py-1.5 hover:bg-gray-100">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-bold text-orange-500">Rs. {(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 px-4 py-4 border-t border-gray-100">
                <div className="flex flex-1 items-center border border-gray-200 rounded-lg overflow-hidden">
                  <Tag size={14} className="ml-3 text-gray-400" />
                  <input type="text" placeholder="Coupon Code" value={coupon} onChange={e => setCoupon(e.target.value)} className="flex-1 px-3 py-2 text-sm outline-none" />
                </div>
                <button className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">Apply Coupon</button>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-black text-gray-900 uppercase text-sm tracking-wide mb-4">Cart Totals</h3>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-green-600">Free Shipping</span>
                </div>
                <div className="flex justify-between text-base font-black border-t border-gray-200 pt-3">
                  <span>Total</span>
                  <span className="text-orange-500">Rs. {total.toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => navigate('checkout')} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                <ShoppingBag size={18} />
                Proceed to Checkout
              </button>
              <button onClick={() => navigate('shop')} className="w-full mt-2 border-2 border-gray-200 hover:border-orange-300 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors text-sm">
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
