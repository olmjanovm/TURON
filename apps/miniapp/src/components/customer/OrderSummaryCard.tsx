import React from 'react';
import { CreditCard, Route, ShoppingBag, Tag, Truck } from 'lucide-react';
import { PaymentMethod, type OrderQuote } from '../../data/types';
import { useCartStore } from '../../store/useCartStore';
import { useCheckoutStore } from '../../store/useCheckoutStore';
import type { RouteInfo } from '../../features/maps/MapProvider';

const OrderSummaryCard: React.FC<{
  routeInfo?: RouteInfo | null;
  quote?: OrderQuote | null;
  isQuoteLoading?: boolean;
  compact?: boolean;
}> = ({ routeInfo, quote, isQuoteLoading = false, compact = false }) => {
  const { getSubtotal, getDiscount, appliedPromo, items } = useCartStore();
  const { paymentMethod } = useCheckoutStore();

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const merchandiseTotal = Math.max(0, subtotal - discount);
  const total = quote?.total ?? merchandiseTotal;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const resolvedRouteInfo =
    quote &&
    typeof quote.deliveryDistanceMeters === 'number' &&
    typeof quote.deliveryEtaMinutes === 'number'
      ? {
          distance:
            quote.deliveryDistanceMeters < 1000
              ? `${Math.round(quote.deliveryDistanceMeters)} m`
              : `${(quote.deliveryDistanceMeters / 1000).toFixed(1)} km`,
          eta: `${quote.deliveryEtaMinutes} daq`,
          distanceMeters: quote.deliveryDistanceMeters,
          etaSeconds: quote.deliveryEtaMinutes * 60,
        }
      : routeInfo;

  const deliveryFeeLabel =
    typeof quote?.deliveryFee === 'number'
      ? `${quote.deliveryFee.toLocaleString()} so'm`
      : isQuoteLoading
        ? 'Hisoblanmoqda...'
        : 'Manzil tanlangach';

  const paymentLabel =
    paymentMethod === PaymentMethod.CASH
      ? 'Naqd pul'
      : paymentMethod === PaymentMethod.EXTERNAL_PAYMENT
        ? 'Click / Payme'
        : "Qo'lda o'tkazma";

  return (
    <section className="rounded-[12px] border border-white/8 bg-[#111827] p-3">
      {!compact ? (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/[0.06] text-white">
            <ShoppingBag size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">Hisob-kitob</p>
            <h3 className="mt-1.5 text-base font-black tracking-tight text-white">Buyurtma xulosasi</h3>
          </div>
        </div>
      ) : null}

      <div className={`${compact ? '' : 'mt-4 '}space-y-3 rounded-[12px] border border-white/8 bg-white/[0.04] p-3`}>
        <div className="flex items-center justify-between text-sm font-semibold text-white/72">
          <div className="flex items-center gap-2">
            <ShoppingBag size={15} className="text-white/40" />
            <span>Taomlar ({itemCount} ta)</span>
          </div>
          <span className="font-black text-white">{subtotal.toLocaleString()} so'm</span>
        </div>

        <div className="flex items-center justify-between text-sm font-semibold text-white/72">
          <div className="flex items-center gap-2">
            <Truck size={15} className="text-white/40" />
            <span>Yetkazish</span>
          </div>
          <span className="font-black text-white">{deliveryFeeLabel}</span>
        </div>

        {discount > 0 ? (
          <div className="flex items-center justify-between text-sm font-semibold text-emerald-300">
            <div className="flex items-center gap-2">
              <Tag size={15} />
              <span>{appliedPromo ? `Promokod (${appliedPromo.code})` : 'Chegirma'}</span>
            </div>
            <span className="font-black">-{discount.toLocaleString()} so'm</span>
          </div>
        ) : null}
      </div>

      {resolvedRouteInfo ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-[12px] border border-white/8 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/38">
              <Route size={14} />
              <span>Masofa</span>
            </div>
            <p className="mt-2 text-base font-black text-white">{resolvedRouteInfo.distance}</p>
          </div>
          <div className="rounded-[12px] border border-white/8 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/38">
              <Truck size={14} />
              <span>ETA</span>
            </div>
            <p className="mt-2 text-base font-black text-white">{resolvedRouteInfo.eta}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between rounded-[12px] border border-white/8 bg-slate-950/46 px-3 py-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">
            {quote ? 'Jami summa' : 'Taomlar jami'}
          </p>
          <p className="mt-1.5 text-[28px] font-black tracking-tight text-white">{total.toLocaleString()} so'm</p>
        </div>
        {!compact ? (
          <div className="text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.06] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/72">
              <CreditCard size={13} />
              <span>{paymentLabel}</span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default OrderSummaryCard;
