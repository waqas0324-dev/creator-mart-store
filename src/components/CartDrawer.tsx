import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';

export function CartDrawer() {
  const { items, removeItem, updateQuantity, subtotal, totalItems, drawerOpen, closeDrawer } = useCart();
  const { navigate } = useNavigation();

  const handleCheckout = () => {
    closeDrawer();
    navigate('checkout');
  };

  const handleViewCart = () => {
    closeDrawer();
    navigate('cart');
  };

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[998] transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[999] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-orange-500" />
            <h2 className="font-black text-gray-900 text-lg">
              Cart <span className="text-orange-500">({totalItems})</span>
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <ShoppingBag size={48} className="opacity-30" />
              <p className="font-semibold">Your cart is empty</p>
              <button
                onClick={() => { closeDrawer(); navigate('shop'); }}
                className="text-sm text-orange-500 hover:text-orange-600 font-bold"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map(item => (
                <div key={item.product.id} className="flex gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4
                      className="text-sm font-semibold text-gray-900 leading-tight cursor-pointer hover:text-orange-500"
                      style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {item.product.name}
                    </h4>
                    <p className="text-orange-500 font-bold text-sm mt-1">
                      Rs. {item.product.price.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-1 hover:bg-gray-100 text-gray-600 transition-colors"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 py-1 text-xs font-bold border-x border-gray-200 min-w-[1.75rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-1 hover:bg-gray-100 text-gray-600 transition-colors"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700">
                          Rs. {(item.product.price * item.quantity).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 flex-shrink-0 bg-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">Shipping</span>
              <span className="text-sm font-semibold text-green-600">Free</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-black text-gray-900">Total</span>
              <span className="font-black text-orange-500 text-lg">
                Rs. {subtotal.toLocaleString()}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors mb-2"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={handleViewCart}
              className="w-full border-2 border-gray-200 hover:border-orange-300 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              View Full Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
