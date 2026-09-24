import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '../../types';
import { StarRating } from '../UI/StarRating';
import { Badge } from '../UI/Badge';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';
import { onImageError, resolveProductImage } from '../../lib/imageFallback';
import { WHATSAPP_LINK, BRAND_NAME } from '../../lib/brand';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { navigate } = useNavigation();

  // When a product has more than one photo, auto-cycle through them so
  // shoppers see every angle without needing to open the product page.
  const gallery = product.images && product.images.length > 1 ? product.images : [product.image_url];
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (gallery.length <= 1) return;
    const timer = setInterval(() => {
      setActiveImage(prev => (prev + 1) % gallery.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [gallery.length]);

  const whatsappMsg = encodeURIComponent(
    `Hi ${BRAND_NAME}! I'd like to order:\n\n${product.name}\nPrice: Rs. ${product.price.toLocaleString()}\n\nIs this available?`
  );

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-orange-200 transition-all duration-300 group flex flex-col h-full">
      <div
        className="relative overflow-hidden cursor-pointer bg-gray-50 aspect-square"
        onClick={() => navigate('product', { productSlug: product.slug })}
      >
        {gallery.map((img, i) => (
          <img
            key={img + i}
            src={resolveProductImage(img)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={(e) => onImageError(e, product.name)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 group-hover:scale-105 ${i === activeImage ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        {product.discount_percent && (
          <Badge variant="orange" className="absolute top-2 left-2 z-10">
            -{product.discount_percent}%
          </Badge>
        )}
        {gallery.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {gallery.map((_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all ${i === activeImage ? 'w-3 bg-orange-500' : 'w-1 bg-white/70'}`} />
            ))}
          </div>
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
        <div className="mt-auto flex gap-1.5 sm:gap-2">
          <button
            onClick={() => addItem(product)}
            className="flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-semibold py-2 px-1.5 sm:px-3 rounded-lg transition-colors"
          >
            <ShoppingCart size={13} className="flex-shrink-0" />
            <span className="truncate">Add to Cart</span>
          </button>
          <a
            href={`${WHATSAPP_LINK}?text=${whatsappMsg}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-9 flex-shrink-0 bg-[#25D366] hover:bg-[#1fbd5a] text-white rounded-lg transition-colors"
            aria-label="Order on WhatsApp"
          >
            <WhatsAppIcon size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
