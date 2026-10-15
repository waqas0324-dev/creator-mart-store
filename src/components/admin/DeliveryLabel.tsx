import type { Order } from '../../types';
import { BRAND_NAME } from '../../lib/brand';
import { useSiteSettings } from '../../context/SiteSettingsContext';

interface Props {
  order: Order;
}

/**
 * Dispatch label — PRINT-FIRST design.
 *
 * Why this looks the way it does:
 * Browsers/printers skip CSS background colours by default ("Background
 * graphics" off), so white text on a dark/orange header printed as
 * invisible/faint text, and the light-grey (slate-400) field labels
 * (Name / Phone / WhatsApp / Email / Address) printed almost unreadable.
 * The logo files are also dark-background designs (white letters), so the
 * brand is set in bold text instead of an image — text always prints sharp.
 * All customer DATA (name, phone, address, amounts) is pure black at
 * maximum weight — black is the sharpest colour a printer has, light
 * colours are what look blurry/faint. One deep dark-orange accent is
 * used ONLY for section headings: dark enough to print strong, and it
 * keeps the ABR brand colour without touching readability.
 * Font is Arial: the sharpest print font — simple letterforms every
 * printer renders cleanly, no thin decorative strokes to blur.
 */
export function DeliveryLabel({ order }: Props) {
  const { settings } = useSiteSettings();
  const effectiveAdvance = order.advance_payment_status === 'received' ? (order.advance_amount || 0) : 0;
  const remainingPrice = Math.max(0, order.total - effectiveAdvance);
  const advanceDiscount = Math.max(0, order.subtotal + order.shipping - order.total);
  const isCod = order.payment_method === 'cash_on_delivery';
  const isAdvancePaid = !isCod && order.advance_payment_status === 'received';
  const deliveryPaid = !isCod || order.advance_payment_status === 'received';
  const address = [order.customer_address, order.customer_area, order.customer_city].filter(Boolean).join(', ');

  return (
    <div id="print-area" className="hidden print:block bg-white text-black" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <style>{`
        @page { margin: 8mm; }
        @media print {
          #print-area, #print-area * {
            color: #000 !important;
            background: #fff !important;
            background-color: #fff !important;
            border-color: #000 !important;
            box-shadow: none !important;
            text-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* The ONE accent colour: deep dark orange, headings only. */
          #print-area .label-accent {
            color: #9A3412 !important;
          }
        }
      `}</style>
      <div className="mx-auto w-full max-w-[720px] border-2 border-black bg-white text-black print:break-inside-avoid">
        {/* Header: brand text left, payment box right — all black on white */}
        <div className="flex items-start justify-between gap-4 border-b-2 border-black px-5 py-4">
          <div>
            <p className="label-accent text-[11px] font-black uppercase tracking-[0.2em] text-[#9A3412]">Dispatch Label</p>
            <p className="mt-1 text-[26px] font-black leading-none text-black">{BRAND_NAME}</p>
            <p className="mt-1 text-[11px] font-bold text-black">Creator Gear &amp; Gadgets</p>
          </div>
          <div className="shrink-0 border-2 border-black px-4 py-2 text-right">
            <p className="label-accent text-[11px] font-black uppercase tracking-[0.15em] text-[#9A3412]">
              {isCod ? 'Cash on Delivery' : (isAdvancePaid ? 'Payment: Full Advance' : 'Payment Pending')}
            </p>
            <p className="mt-1 text-[28px] font-black leading-none text-black">
              {isCod ? `Rs. ${remainingPrice.toLocaleString()}` : (isAdvancePaid ? 'Rs. 0' : `Rs. ${order.total.toLocaleString()}`)}
            </p>
            <p className="mt-1 text-[11px] font-black text-black">
              {isCod ? 'COLLECT ON DELIVERY' : (isAdvancePaid ? 'NOTHING TO COLLECT ✓' : 'ADVANCE PENDING')}
            </p>
          </div>
        </div>

        {/* Ship From (left) + Deliver To (right) */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          <div className="px-5 py-4">
            <p className="label-accent text-[12px] font-black uppercase tracking-[0.2em] text-[#9A3412]">Ship From</p>
            <p className="mt-2 text-[16px] font-black text-black">{BRAND_NAME}</p>
            <p className="mt-1 text-[14px] font-black text-black">{settings.whatsapp_number}</p>
            <p className="mt-1 text-[14px] font-black leading-relaxed text-black">{settings.store_address}</p>
          </div>
          <div className="border-l-2 border-black px-5 py-4">
            <p className="label-accent text-[12px] font-black uppercase tracking-[0.2em] text-[#9A3412]">Deliver To — Customer</p>
            <div className="mt-2 grid grid-cols-[86px_1fr] gap-x-3 gap-y-2.5 text-[13px]">
              <span className="font-black text-black">NAME</span>
              <span className="text-[18px] font-black leading-tight text-black">{order.customer_name || '—'}</span>
              <span className="font-black text-black">PHONE</span>
              <span className="text-[16px] font-black text-black">{order.customer_phone || '—'}</span>
              <span className="font-black text-black">WHATSAPP</span>
              <span className="text-[15px] font-black text-black">{order.customer_whatsapp || order.customer_phone || '—'}</span>
              <span className="font-black text-black">EMAIL</span>
              <span className="break-all text-[14px] font-black text-black">{order.customer_email || '—'}</span>
              <span className="font-black text-black">ADDRESS</span>
              <span className="text-[15px] font-black leading-relaxed text-black">{address || '—'}</span>
            </div>
          </div>
        </div>

        {/* Order meta */}
        <div className="flex items-center justify-between border-b-2 border-black px-5 py-2 text-[13px]">
          <p><span className="font-black text-black">ORDER: </span><span className="font-black text-black">{order.order_number}</span></p>
          <p><span className="font-black text-black">DATE: </span><span className="font-black text-black">{new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
        </div>

        {/* Package contents */}
        <div className="border-b-2 border-black">
          <p className="label-accent border-b border-black px-5 py-2 text-[12px] font-black uppercase tracking-[0.2em] text-[#9A3412]">Package Contents</p>
          <div className="divide-y divide-black">
            {(order.order_items || []).map(item => (
              <div key={item.id} className="grid grid-cols-[1fr_90px_110px] items-center gap-3 px-5 py-3 text-[14px]">
                <p className="text-[15px] font-black text-black">{item.product_name}</p>
                <p className="text-center font-bold text-black">Qty {item.quantity}</p>
                <p className="text-right font-black text-black">Rs. {item.subtotal.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment summary at the very bottom */}
        <div className="px-5 py-4">
          <p className="label-accent text-[12px] font-black uppercase tracking-[0.2em] text-[#9A3412]">Payment Summary</p>
          <div className="mt-2 space-y-1.5 text-[13px]">
            <div className="flex justify-between"><span className="font-bold text-black">Product subtotal</span><span className="font-black text-black">Rs. {order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between">
              <span className="font-bold text-black">Delivery</span>
              <span className="font-black text-black">
                {order.shipping > 0
                  ? `Rs. ${order.shipping.toLocaleString()} · ${deliveryPaid ? 'PAID' : 'PENDING'}`
                  : 'FREE'}
              </span>
            </div>
            {advanceDiscount > 0 && (
              <div className="flex justify-between"><span className="font-bold text-black">Full advance discount</span><span className="font-black text-black">-Rs. {advanceDiscount.toLocaleString()}</span></div>
            )}
            <div className="flex justify-between border-t-2 border-black pt-1.5 text-[15px] font-black"><span className="text-black">Order total</span><span className="text-black">Rs. {order.total.toLocaleString()}</span></div>
            {isCod && effectiveAdvance > 0 && (
              <div className="flex justify-between"><span className="font-bold text-black">Advance received</span><span className="font-black text-black">Rs. {effectiveAdvance.toLocaleString()} ✓</span></div>
            )}
            <div className="flex justify-between border-2 border-black px-2 py-1.5 text-[15px] font-black">
              <span className="text-black">{isCod ? 'COLLECT ON DELIVERY' : 'PAID'}</span>
              <span className="text-black">{isCod ? `Rs. ${remainingPrice.toLocaleString()}` : `Rs. ${order.total.toLocaleString()}`}</span>
            </div>
          </div>
        </div>

        {(order.shipping_note || order.notes) && (
          <div className="border-t-2 border-black px-5 py-2">
            <p className="label-accent text-[12px] font-black uppercase tracking-[0.2em] text-[#9A3412]">Dispatch Note</p>
            <p className="mt-1 text-[13px] font-bold text-black">{order.shipping_note || order.notes}</p>
          </div>
        )}

        <div className="border-t-2 border-black px-5 py-2 text-[11px] font-bold text-black">
          {BRAND_NAME} · {order.order_number} — Verify recipient, phone, address, pieces and collection amount before dispatch.
        </div>
      </div>
    </div>
  );
}
