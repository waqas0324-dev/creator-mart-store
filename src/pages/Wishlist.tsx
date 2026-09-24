import { Heart, ShoppingCart, X } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { onImageError, resolveProductImage } from '../lib/imageFallback';

export function Wishlist() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();
  const { navigate } = useNavigation();

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
            <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
            <span className="mx-2">/</span>
            <span className="font-semibold text-gray-800">Wishlist</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <Heart size={64} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-2xl font-black text-gray-700 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-400 mb-6">Tap the heart on any product to save it for later.</p>
          <button onClick={() => navigate('shop')} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-lg transition-colors">
            Browse Products
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
          <span className="font-semibold text-gray-800">Wishlist</span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-black text-gray-900 uppercase mb-6">Your Wishlist ({items.length})</h1>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {items.map(product => (
            <div key={product.id} className="flex items-center gap-4 p-4">
              <img
                src={resolveProductImage(product.image_url)}
                alt={product.name}
                referrerPolicy="no-referrer"
                onError={(e) => onImageError(e, product.name)}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                onClick={() => navigate('product', { productSlug: product.slug })}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold text-gray-900 hover:text-orange-500 cursor-pointer transition-colors line-clamp-2"
                  onClick={() => navigate('product', { productSlug: product.slug })}
                >
                  {product.name}
                </p>
                <p className="text-orange-500 font-bold text-sm mt-1">Rs. {product.price.toLocaleString()}</p>
              </div>
              <button
                onClick={() => addItem(product)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex-shrink-0"
              >
                <ShoppingCart size={14} />
                <span className="hidden sm:inline">Add to Cart</span>
              </button>
              <button
                onClick={() => removeItem(product.id)}
                aria-label="Remove from wishlist"
                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
