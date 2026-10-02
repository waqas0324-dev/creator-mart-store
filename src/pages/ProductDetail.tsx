import { useState, useEffect } from 'react';
import { ShoppingCart, Truck, Banknote, RotateCcw, ShieldCheck, Minus, Plus, Check, Star, MessageCircle, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { onImageError, resolveProductImage } from '../lib/imageFallback';
import { useNavigation } from '../context/NavigationContext';
import { useProduct, useProducts, useReviews } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

import { StarRating } from '../components/UI/StarRating';
import { Badge } from '../components/UI/Badge';
import { ProductCard } from '../components/Product/ProductCard';
import { BRAND_NAME, toWhatsAppNumber } from '../lib/brand';
import { useSEO } from '../hooks/useSEO';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { sanitizeRichHtml } from '../lib/richText';
import { extractProductSpecifications, hasExplicitProductSpecifications, removeSpecSection } from '../lib/productDescription';
import { getMiniDescription, htmlToText } from '../lib/productFields';

const cleanDescriptionHtml = (value: string, productName = '') => {
  if (!value) return '';
  // Drop leading whitespace / &nbsp; so the heading checks below see the real start.
  let out = value.replace(/^(\s|&nbsp;|&#160;|\u00a0)+/i, '');

  // The product title is already shown above the tabs. Remove a duplicate title
  // when the description starts with the same title.
  if (productName) {
    const escapedName = productName.replace(/[.*+?^\$\{\}()|[\]\\]/g, '\\$&');
    const titleRe = new RegExp('^' + escapedName + '\\s*(?:<br\\s*/?>)?\\s*', 'i');
    out = out.replace(titleRe, '');
  }

  // Case 1: a whole leading block that is just "Product Description" -> drop the block.
  const blockRe = /^<(h2|h3|h4|p)(\s[^>]*)?>\s*Product Description\s*<\/\1>\s*/i;
  if (blockRe.test(out)) return out.replace(blockRe, '').trim();

  // Case 2: "Product Description" as leading text inside the first paragraph
  // (optionally wrapped in strong/b/span) -> drop just the words, keep the paragraph.
  out = out.replace(
    /^<(p|div)(\s[^>]*)?>\s*(?:<(?:strong|b|span)[^>]*>\s*)?Product Description\s*(?:<\/(?:strong|b|span)>\s*)?/i,
    '<$1$2>'
  );
  return out.trim();
};

export function ProductDetail() {
  const { nav, navigate } = useNavigation();
  const { product, loading } = useProduct(nav.productSlug || '');
  useEffect(() => { if (!product?.id) return; try { const key='abr_recently_viewed'; const ids=JSON.parse(localStorage.getItem(key)||'[]') as string[]; const next=[product.id,...ids.filter(id=>id!==product.id)].slice(0,12); localStorage.setItem(key,JSON.stringify(next)); window.dispatchEvent(new Event('abr-recently-viewed-updated')); } catch {} }, [product?.id]);
  const { settings: waSettings } = useSiteSettings();
  const WHATSAPP_LINK = `https://wa.me/${toWhatsAppNumber(waSettings.whatsapp_number)}`;

  const images = product
    ? Array.from(new Set([product.image_url, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean)))
    : [];

  const { addItem } = useCart();
  const { showToast } = useToast();
  const { products: related } = useProducts({ categorySlug: product?.categories?.slug });
  const { reviews, loading: reviewsLoading, submitReview } = useReviews(product?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'info' | 'reviews'>('description');
  const [added, setAdded] = useState(false);
  const [reviewForm, setReviewForm] = useState({ customer_name: '', phone: '', rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  useSEO({
    title: product ? `${product.name} - Buy Online in Pakistan | ${BRAND_NAME}` : `Loading... | ${BRAND_NAME}`,
    description: product
      ? `Buy ${product.name} in Pakistan at the best price. Cash on Delivery, fast shipping, 7 days easy return. ${htmlToText(product.description || '').slice(0, 100)}`
      : `Buy premium content-creator gear online in Pakistan. Cash on Delivery available.`,
    image: product?.image_url
      ? (product.image_url.startsWith('http') ? product.image_url : window.location.origin + product.image_url)
      : undefined,
    canonical: product ? window.location.origin + '/product/' + encodeURIComponent(product.slug) : undefined,
    jsonLd: product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          image: images.length > 0 ? images : undefined,
          description: product.description ? htmlToText(product.description) : undefined,
          sku: product.id,
          brand: { '@type': 'Brand', name: BRAND_NAME },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'PKR',
            price: product.price,
            availability:
              product.stock && product.stock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            areaServed: 'PK',
          },
        }
      : undefined,
  });


  // Auto-scroll removed per request — user navigates with left/right buttons only.

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="animate-pulse grid md:grid-cols-2 gap-8">
          <div className="bg-gray-200 rounded-xl h-80" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Product not found.</p>
        <button onClick={() => navigate('shop')} className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg">
          Back to Shop
        </button>
      </div>
    );
  }

  const hasExplicitSpecifications = hasExplicitProductSpecifications(product.description || '');
  const automaticSpecifications = extractProductSpecifications(product.description || '');

  // If the description explicitly contains a Specifications section, that section
  // is the only source for the automatic table. Legacy product.specifications are
  // ignored in this case so old feature lists cannot leak into the table.
  // If there is no explicit section, preserve any manually stored legacy specs.
  const specifications = automaticSpecifications.length > 0
    ? automaticSpecifications
    : (!hasExplicitSpecifications && Array.isArray(product.specifications) ? product.specifications : []);

  // Remove the explicit specification section only when it was successfully
  // parsed into table rows. All other description content remains untouched.
  const descriptionHtml = automaticSpecifications.length > 0
    ? removeSpecSection(product.description || '')
    : (product.description || '');
  const miniDescription = getMiniDescription(product);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast('Product link copied', 'cart');
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
    showToast('Your product has been added to cart', 'cart');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          {product.categories && (
            <>
              <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('shop', { categorySlug: product.categories?.slug })}>
                {product.categories.name}
              </span>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-gray-800 font-semibold">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Images */}
            <div>
              <div className="relative bg-white rounded-xl overflow-hidden mb-3 aspect-square flex items-center justify-center">
                <img src={resolveProductImage(images[activeImage])} alt={product.name} loading="eager" fetchPriority="high" decoding="async" referrerPolicy="no-referrer" onError={(e) => onImageError(e, product.name)} className="absolute inset-0 w-full h-full object-cover" />
                <button
                  type="button"
                  aria-label="Share product"
                  onClick={handleShare}
                  className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-700 hover:text-orange-500 hover:bg-white transition-colors"
                >
                  <Share2 size={18} />
                </button>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={() => setActiveImage(prev => (prev - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-700 hover:bg-white hover:text-orange-500 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      onClick={() => setActiveImage(prev => (prev + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-700 hover:bg-white hover:text-orange-500 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)} aria-label={`View product image ${i + 1}`} className={`w-16 h-16 rounded-lg overflow-hidden border-2 bg-white transition-colors ${activeImage === i ? 'border-orange-500' : 'border-gray-200'}`}>
                      <img src={resolveProductImage(img)} alt={`Product image ${i + 1}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(e) => onImageError(e, product.name)} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              {product.review_count > 0 && <StarRating rating={product.rating} count={product.review_count} size="md" />}
              <h1 className="text-2xl font-black text-gray-900 mt-2 mb-3">{product.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-black text-orange-500">Rs. {product.price.toLocaleString()}</span>
                {product.original_price && (
                  <>
                    <span className="text-lg text-gray-400 line-through">Rs. {product.original_price.toLocaleString()}</span>
                    {product.discount_percent && <Badge variant="orange">-{product.discount_percent}%</Badge>}
                  </>
                )}
              </div>
              <p className={`text-sm font-semibold mb-1 ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {product.stock > 0 ? '● In Stock' : '● Out of Stock'}
              </p>
              {miniDescription && (
                <p className="text-sm text-gray-600 leading-6 mb-4">{miniDescription}</p>
              )}
              {product.stock > 0 && product.stock <= 10 && (
                <p className="text-sm font-bold text-orange-600 mb-4 animate-pulse">
                  Only {product.stock} left — order soon!
                </p>
              )}
              {(product.stock === 0 || product.stock > 10) && <div className="mb-4" />}
              {/* Tags removed from main area — now shown as plain text below trust badges (CM Shop style) */}

              {/* Quantity + Cart */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="Decrease quantity" className="px-3 py-2 hover:bg-gray-100 transition-colors">
                    <Minus size={16} />
                  </button>
                  <span className="px-4 py-2 font-bold text-gray-900 min-w-[3rem] text-center border-x border-gray-300">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} aria-label="Increase quantity" className="px-3 py-2 hover:bg-gray-100 transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  data-design-button="true"
            className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-lg transition-all btn-interactive bg-orange-500 hover:bg-orange-600 text-white ${added ? 'scale-[1.03]' : ''}`}
                >
                  {added ? <Check size={18} /> : <ShoppingCart size={18} />}
                  {added ? 'Added!' : 'Add to Cart'}
                </button>
              </div>
              <button onClick={() => { addItem(product, quantity); navigate('checkout'); }} data-design-button="true" className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 rounded-lg transition-colors mb-3 btn-interactive">
                Buy Now
              </button>
              <a
                href={`${WHATSAPP_LINK}?text=${encodeURIComponent(`Hi ${BRAND_NAME}! I'd like to order:\n\n${product.name}\nPrice: Rs. ${product.price.toLocaleString()}\nQuantity: ${quantity}\n\nIs this available?`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition-colors mb-4 btn-interactive"
              >
                <MessageCircle size={18} />
                Order on WhatsApp
              </a>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                {[
                  { Icon: Truck, title: 'FAST DELIVERY', sub: 'All Over Pakistan' },
                  { Icon: Banknote, title: 'CASH ON DELIVERY', sub: 'Pay When You Receive' },
                  { Icon: RotateCcw, title: '7 DAYS RETURN', sub: 'No Questions Asked' },
                  { Icon: ShieldCheck, title: '100% ORIGINAL', sub: 'Original Products' },
                ].map(({ Icon, title, sub }) => (
                  <div key={title} className="flex flex-col items-center text-center gap-1">
                    <Icon size={20} className="text-orange-500" />
                    <p className="text-xs font-bold text-gray-800 leading-tight">{title}</p>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </div>
                ))}
              </div>
              {/* Product page tags hidden for now — admin can still manage tags via ProductForm; re-enable here if needed */}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <div className="flex gap-2 border-b border-gray-200 mb-5 pb-4">
              {(['description', 'info', 'reviews'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-semibold capitalize rounded-lg transition-colors ${activeTab === tab ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {tab === 'info' ? 'Additional Information' : tab === 'reviews' ? `Reviews (${reviews.length})` : 'Description'}
                </button>
              ))}
            </div>
            {activeTab === 'description' && (
              <div className="text-sm text-gray-700 leading-relaxed max-w-4xl">
                <div className="[&_h2]:text-2xl [&_h2]:font-black [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_strong]:font-black [&_u]:underline" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(cleanDescriptionHtml(descriptionHtml, product.name)) }} />
                {specifications.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-black text-orange-500 mb-3">Specification</h3>
                    <div className="overflow-x-auto border border-gray-200 rounded-xl">
                      <table className="w-full text-sm">
                        <tbody>
                          {specifications.map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="w-1/3 px-4 py-3 font-bold text-gray-900 border-r border-gray-200">{row.key}</td>
                              <td className="px-4 py-3 text-gray-600">{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'info' && (
              <table className="text-sm">
                <tbody>
                  {[
                    ['Category', product.categories?.name || 'General'],
                    ['Stock', `${product.stock} units`],
                    ['Rating', product.review_count > 0 ? `${product.rating}/5 (${product.review_count} reviews)` : 'No reviews yet'],
                  ].map(([key, val]) => (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-2 pr-8 font-semibold text-gray-900 w-40">{key}</td>
                      <td className="py-2 text-gray-600">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === 'reviews' && (
              <div>
                {/* Summary */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div className="text-5xl font-black text-gray-900">{reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '–'}</div>
                  <div>
                    <StarRating rating={reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0} size="md" />
                    <p className="text-gray-500 text-sm mt-1">{reviews.length} customer review{reviews.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Review list */}
                {reviewsLoading ? (
                  <p className="text-gray-400 text-sm mb-6">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-gray-400 text-sm mb-6">No reviews yet. Be the first!</p>
                ) : (
                  <div className="space-y-4 mb-8">
                    {reviews.map(r => (
                      <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900 text-sm">{r.customer_name}</span>
                          <span className="text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex mb-2">
                          {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= r.rating ? 'fill-orange-400 text-orange-400' : 'fill-gray-200 text-gray-200'} />)}
                        </div>
                        <p className="text-gray-700 text-sm">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submit form */}
                <div className="border border-gray-200 rounded-xl p-5">
                  <h4 className="font-bold text-gray-900 mb-4">Write a Review</h4>
                  {reviewSuccess ? (
                    <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                      <Check size={16} /> Review submitted! Thank you.
                    </div>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setReviewSubmitting(true);
                        const err = await submitReview(reviewForm);
                        setReviewSubmitting(false);
                        if (!err) {
                          setReviewSuccess(true);
                          setReviewForm({ customer_name: '', phone: '', rating: 5, comment: '' });
                          setTimeout(() => setReviewSuccess(false), 4000);
                        }
                      }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          required
                          placeholder="Your Name *"
                          value={reviewForm.customer_name}
                          onChange={e => setReviewForm(p => ({ ...p, customer_name: e.target.value }))}
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                        />
                        <input
                          placeholder="Phone (optional)"
                          value={reviewForm.phone}
                          onChange={e => setReviewForm(p => ({ ...p, phone: e.target.value }))}
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Your Rating *</p>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(s => (
                            <button
                              key={s}
                              type="button"
                              onMouseEnter={() => setHoveredStar(s)}
                              onMouseLeave={() => setHoveredStar(0)}
                              onClick={() => setReviewForm(p => ({ ...p, rating: s }))}
                            >
                              <Star size={24} className={s <= (hoveredStar || reviewForm.rating) ? 'fill-orange-400 text-orange-400' : 'fill-gray-200 text-gray-200'} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        required
                        placeholder="Your review *"
                        rows={3}
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
                      />
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-6 py-2 rounded-lg text-sm transition-colors"
                      >
                        {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.filter(p => p.id !== product.id).length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide mb-4">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {related.filter(p => p.id !== product.id).slice(0, 5).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
