import { ShoppingCart, MessageCircle } from 'lucide-react';
import type { Product } from '../../types';
import { StarRating } from '../UI/StarRating';
import { Badge } from '../UI/Badge';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';
import { onImageError, resolveProductImage } from '../../lib/imageFallback';
import { WHATSAPP_LINK } from '../../lib/brand';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { navigate } = useNavigation();

  const whatsappMsg = encodeURIComponent(
    `Hi ABR Gadgets! I'd like to order:\n\n${product.name}\nPrice: Rs. ${product.price.toLocaleString()}\n\nIs this available?`
  );

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-orange-200 transition-all duration-300 group flex flex-col h-full">
      <div
        className="relative overflow-hidden cursor-pointer bg-gray-50 aspect-square"
        onClick={() => navigate('product', { productSlug: product.slug })}
      >
        <img
          src={resolveProductImage(product.image_url)}
          alt={product.name}
          onError={(e) => onImageError(e, product.name)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.discount_percent && (
          <Badge variant="orange" className="absolute top-2 left-2">
            -{product.discount_percent}%
          </Badge>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3
          className="text-sm font-semibold text-gray-900 hover:text-orange-500 cursor-pointer transition-colors line-clamp-2 mb-1 min-h-[2.5rem]"
          onClick={() => navigate('product', { productSlug: product.slug })}
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {product.name}
        </h3>
        {product.review_count > 0 && <StarRating rating={product.rating} count={product.review_count} />}
        <div className="flex items-center gap-2 mt-2 mb-3">
          <span className="text-orange-500 font-bold text-base">Rs. {product.price.toLocaleString()}</span>
          {product.original_price && (
            <span className="text-gray-400 line-through text-sm">Rs. {product.original_price.toLocaleString()}</span>
          )}
        </div>
        <div className="mt-auto flex gap-2">
          <button
            onClick={() => addItem(product)}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
          >
            <ShoppingCart size={14} />
            Add to Cart
          </button>
          <a
            href={`${WHATSAPP_LINK}?text=${whatsappMsg}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-9 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
            aria-label="Order on WhatsApp"
          >
            <MessageCircle size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
