import React from 'react';
import { useState, useEffect } from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import type { Product } from '../../types';
import { StarRating } from '../UI/StarRating';
import { Badge } from '../UI/Badge';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';
import { onImageError, resolveProductImage } from '../../lib/imageFallback';
import { BRAND_NAME, toWhatsAppNumber } from '../../lib/brand';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { navigate } = useNavigation();
  const { settings } = useSiteSettings();
  const { showToast } = useToast();
  const { toggleItem, isInWishlist } = useWishlist();
  const design = settings.design_settings;
  const wished = isInWishlist(product.id);
  const whatsappLink = `https://wa.me/${toWhatsAppNumber(settings.whatsapp_number)}`;

  // Keep the first product image as the only initial network request.
  // Secondary gallery images are prefetched only after the card is visible
  // long enough to matter, preventing the home page from downloading every
  // hidden gallery image at once.
  const gallery = product.images && product.images.length > 1 ? product.images : [product.image_url];
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (gallery.length <= 1) return;
    let timer: number | undefined;
    const preload = () => {
      gallery.slice(1).forEach(src => {
        const img = new Image();
        img.decoding = 'async';
        img.src = resolveProductImage(src);
      });
    };
    const start = () => {
      timer = window.setTimeout(preload, 2500);
    };
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback(start);
    } else {
      start();
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [gallery.length, gallery.join('|')]);

  useEffect(() => {
    if (gallery.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveImage(prev => (prev + 1) % gallery.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [gallery.length]);

  const whatsappMsg = encodeURIComponent(
    `Hi ${BRAND_NAME}! I'd like to order:\n\n${product.name}\nPrice: Rs. ${product.price.toLocaleString()}\n\nIs this available?`
  );

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200/90 group flex flex-col h-full transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.10)] hover:border-gray-300">
      <div
        className="relative overflow-hidden cursor-pointer bg-white aspect-square transition-colors duration-300"
        onClick={() => navigate('product', { productSlug: product.slug })}
      >
        <img
          key={gallery[activeImage] + activeImage}
          src={resolveProductImage(gallery[activeImage])}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={(e) => onImageError(e, product.name)}
          className="absolute inset-0 w-full h-full object-contain p-1 sm:p-2 transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
        <button
          type="button"
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => { e.stopPropagation(); toggleItem(product); }}
          className={`absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-white/95 border border-gray-200 shadow-sm flex items-center justify-center transition-all duration-200 ${wished ? 'text-orange-500' : 'text-gray-500 opacity-0 group-hover:opacity-100 hover:text-orange-500'}`}
        >
          <Heart size={17} fill={wished ? 'currentColor' : 'none'} />
        </button>
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
      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        <h3
          className="text-sm font-semibold text-gray-900 hover:text-orange-500 cursor-pointer transition-colors line-clamp-2 mb-1 min-h-[2.5rem] leading-5"
          onClick={() => navigate('product', { productSlug: product.slug })}
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {product.name}
        </h3>
        {product.review_count > 0 && <StarRating rating={product.rating} count={product.review_count} />}
        <div className="flex items-center gap-2 mt-2 mb-3">
          <span className="text-orange-500 font-black text-base">Rs. {product.price.toLocaleString()}</span>
          {product.original_price && (
            <span className="text-gray-400 line-through text-sm">Rs. {product.original_price.toLocaleString()}</span>
          )}
        </div>
        <div className="mt-auto flex gap-1.5 sm:gap-2">
          <button
            onClick={() => { addItem(product); showToast('Your product has been added to cart', 'cart'); }}
            className="flex-1 min-w-0 h-10 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-1.5 sm:px-3 rounded-lg btn-interactive"
            data-design-animation={design.animations.style}
            data-design-button="true"
            style={{
              backgroundColor: design.buttons.bgColor,
              color: design.buttons.textColor,
              borderRadius: design.buttons.radius,
              fontWeight: design.buttons.fontWeight,
              transitionDuration: design.buttons.transitionMs + 'ms',
            } as React.CSSProperties}
          >
            <ShoppingCart size={13} className="flex-shrink-0" />
            <span className="truncate">Add to Cart</span>
          </button>
          <a
            href={`${whatsappLink}?text=${whatsappMsg}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-10 h-10 flex-shrink-0 bg-[#25D366] hover:bg-[#1fbd5a] text-white rounded-lg transition-colors"
            aria-label="Order on WhatsApp"
          >
            <WhatsAppIcon size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
