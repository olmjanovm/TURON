import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Home,
  Loader2,
  MapPin,
  ShoppingBag,
} from 'lucide-react';
import { PaymentMethod, PaymentStatus } from '../../data/types';
import type { Order } from '../../data/types';
import { useOrderDetails, useOrderTrackingStream } from '../../hooks/queries/useOrders';
import { ErrorStateCard } from '../../components/ui/FeedbackStates';
import { DeliveryHeroCard } from '../../components/customer/DeliveryExperience';
import { formatEtaMinutes, formatRouteDistance } from '../../features/maps/route';
import { useEtaCountdown } from '../../features/maps/useEtaCountdown';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';
import { getCustomerTrackingMeta } from '../../features/tracking/customerTracking';

const OrderSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { tr, formatText, language } = useCustomerLanguage();
  const preloadedOrder = location.state?.order as Order | undefined;
  const orderId = preloadedOrder?.id || searchParams.get('orderId') || '';
  const { data: fetchedOrder, isLoading, isError, error, refetch } = useOrderDetails(orderId);
  const { connectionState, isConnected } = useOrderTrackingStream(orderId, Boolean(orderId));
  const order = fetchedOrder || preloadedOrder;

  const trackingMeta = order ? getCustomerTrackingMeta(order, language) : null;
  const rawRemainingDistanceKm =
    typeof order?.tracking?.courierLocation?.remainingDistanceKm === 'number'
      ? order.tracking.courierLocation.remainingDistanceKm
      : typeof order?.deliveryDistanceMeters === 'number' && order.deliveryDistanceMeters > 0
        ? order.deliveryDistanceMeters / 1000
        : null;
  const remainingDistance =
    typeof rawRemainingDistanceKm === 'number'
      ? formatRouteDistance(rawRemainingDistanceKm)
      : null;

  const rawRemainingEtaMinutes =
    typeof order?.tracking?.courierLocation?.remainingEtaMinutes === 'number'
      ? order.tracking.courierLocation.remainingEtaMinutes
      : typeof order?.deliveryEtaMinutes === 'number' && order.deliveryEtaMinutes > 0
        ? order.deliveryEtaMinutes
        : null;
  const remainingEta =
    typeof rawRemainingEtaMinutes === 'number' ? formatEtaMinutes(rawRemainingEtaMinutes) : null;

  const { countdownLabel: etaCountdownLabel, isExpired: isEtaExpired } = useEtaCountdown(
    rawRemainingEtaMinutes ?? undefined,
    order?.tracking?.lastEventAt || order?.courierLastEventAt || undefined,
  );

  if (isLoading && !order) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={36} className="animate-spin text-amber-500" />
      </div>
    );
  }

  if (isError && !order) {
    return (
      <ErrorStateCard
        title={tr('title.confirmation')}
        message={(error as Error).message}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (!order || !trackingMeta) {
    return (
      <div className="flex flex-col items-center justify-center px-8 pt-20 text-center animate-in zoom-in duration-500">
        <h2 className="mb-2 text-xl font-black text-gray-900">{tr('title.confirmation')}</h2>
        <button
          onClick={() => navigate('/customer')}
          className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-[24px] bg-amber-500 font-black text-white shadow-lg shadow-amber-200"
        >
          <span>{tr('success.homeButton')}</span>
        </button>
      </div>
    );
  }

  const paymentLabel =
    order.paymentMethod === PaymentMethod.CASH
      ? tr('order.payment.cash')
      : order.paymentMethod === PaymentMethod.EXTERNAL_PAYMENT
        ? tr('order.payment.external')
        : tr('order.payment.manual');
  const paymentStatusLabel =
    order.paymentStatus === PaymentStatus.COMPLETED
      ? tr('order.payment.completed')
      : order.paymentMethod === PaymentMethod.CASH
        ? tr('order.payment.cash')
        : tr('order.payment.pending');

  return (
    <div
      className="px-6 pt-8 animate-in fade-in duration-700"
      style={{ paddingBottom: 'calc(var(--customer-nav-top-edge, 88px) + 24px)' }}
    >
      <DeliveryHeroCard
        tone={remainingEta ? 'live' : trackingMeta.isDelivered ? 'success' : 'warm'}
        eyebrow={tr('success.eyebrow')}
        statusLabel={trackingMeta.stageLabel}
        title={trackingMeta.heroTitle}
        subtitle={trackingMeta.statusLine}
        connectionState={connectionState}
        isConnected={isConnected}
        etaValue={remainingEta ? etaCountdownLabel || remainingEta : null}
        etaHint={
          remainingEta
            ? isEtaExpired
              ? language === 'ru'
                ? 'Курьер почти у вас'
                : language === 'uz-cyrl'
                  ? 'Курьер деярли етиб келди'
                  : 'Kuryer deyarli yetib keldi'
              : `ETA: ${remainingEta}`
            : tr('success.footer')
        }
        distanceValue={remainingDistance}
        distanceHint={
          remainingDistance
            ? language === 'ru'
              ? 'Оставшаяся дистанция'
              : language === 'uz-cyrl'
                ? 'Қолган масофа'
                : 'Qolgan masofa'
            : tr('success.footer')
        }
      >
        <div className="rounded-[28px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/10 bg-white/10">
                <CheckCircle2 size={34} className="text-emerald-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">
                  Buyurtma raqami
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-white">
                  #{order.orderNumber}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">
                {tr('success.liveStatus')}
              </p>
              <p className="mt-2 text-sm font-black text-white">{trackingMeta.stageLabel}</p>
            </div>
          </div>
        </div>
      </DeliveryHeroCard>

      <div className="mt-6 grid gap-4">
        <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                {tr('success.total')}
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                {order.total.toLocaleString()} so'm
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Holat</p>
              <p className="mt-1 text-sm font-black text-amber-700">{paymentStatusLabel}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                {tr('success.payment')}
              </p>
              <p className="text-sm font-bold text-slate-900">{paymentLabel}</p>
            </div>
          </div>

          {trackingMeta.courierLabel ? (
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Kuryer
                </p>
                <p className="text-sm font-bold text-slate-900">{trackingMeta.courierLabel}</p>
              </div>
            </div>
          ) : null}

          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                {tr('success.address')}
              </p>
              <p className="text-sm font-bold leading-relaxed text-slate-900">
                {formatText(order.customerAddress?.addressText || "Manzil ko'rsatilmagan")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Clock3 size={20} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                {tr('success.nextStep')}
              </p>
              <p className="text-sm font-bold text-slate-900">{trackingMeta.statusLine}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="mb-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
            {tr('success.contents')}
          </p>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-[10px] font-black text-slate-500">
                    {item.quantity}x
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{formatText(item.name)}</p>
                    <p className="text-xs text-slate-400">
                      {item.price.toLocaleString()} so'm / dona
                    </p>
                  </div>
                </div>
                <p className="text-sm font-black text-slate-900">
                  {(item.price * item.quantity).toLocaleString()} so'm
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <button
          onClick={() => navigate(`/customer/orders/${order.id}/tracking`)}
          className="flex h-16 w-full items-center justify-center gap-3 rounded-[24px] bg-slate-900 text-lg font-black text-white shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
        >
          <ShoppingBag size={24} />
          <span>{tr('success.trackButton')}</span>
        </button>

        <button
          onClick={() => navigate('/customer')}
          className="flex h-16 w-full items-center justify-center gap-3 rounded-[24px] border-2 border-slate-100 bg-white text-lg font-black text-slate-900 transition-all active:scale-[0.98]"
        >
          <Home size={24} />
          <span>{tr('success.homeButton')}</span>
        </button>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
        <span>{tr('success.footer')}</span>
        <ArrowRight size={12} />
      </div>
    </div>
  );
};

export default OrderSuccessPage;
