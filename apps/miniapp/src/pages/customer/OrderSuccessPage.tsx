import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
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
import { useOrderDetails } from '../../hooks/queries/useOrders';
import { ErrorStateCard } from '../../components/ui/FeedbackStates';
import { DeliveryHeroCard } from '../../components/customer/DeliveryExperience';
import { formatEtaMinutes, formatRouteDistance } from '../../features/maps/route';
import { useEtaCountdown } from '../../features/maps/useEtaCountdown';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';
import { getCustomerTrackingMeta } from '../../features/tracking/customerTracking';
import { useCountdown } from '../../hooks/useCountdown';

const COURIER_ACCEPTANCE_LIMIT_MS = 2 * 60 * 60 * 1000;
const COURIER_ACCEPTANCE_ADMIN_WARNING_MS = 90 * 60 * 1000;

function getCourierAcceptanceDeadlineIso(order: Order | undefined, isAwaitingCourierAcceptance: boolean) {
  if (!order || !isAwaitingCourierAcceptance) return null;

  const startedAt =
    order.assignedAt ||
    (order.courierLastEventType === 'ASSIGNED' ? order.courierLastEventAt : null) ||
    order.createdAt;
  const startedMs = startedAt ? new Date(startedAt).getTime() : Number.NaN;

  if (!Number.isFinite(startedMs)) return null;

  return new Date(startedMs + COURIER_ACCEPTANCE_LIMIT_MS).toISOString();
}

const OrderSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { tr, formatText, language } = useCustomerLanguage();
  const preloadedOrder = location.state?.order as Order | undefined;
  const orderId = preloadedOrder?.id || searchParams.get('orderId') || '';
  const { data: fetchedOrder, isLoading, isError, error, refetch } = useOrderDetails(orderId);
  const order = fetchedOrder || preloadedOrder;

  const trackingMeta = order ? getCustomerTrackingMeta(order, language) : null;
  const isAwaitingCourierAcceptance = Boolean(trackingMeta?.isAwaitingCourierAcceptance);
  const shouldShowDeliveryEta = Boolean(
    trackingMeta?.phase &&
      ['ACCEPTED', 'ARRIVED', 'PICKED_UP', 'DELIVERING'].includes(trackingMeta.phase),
  );
  const acceptanceDeadlineIso = getCourierAcceptanceDeadlineIso(order, isAwaitingCourierAcceptance);
  const acceptanceCountdown = useCountdown(
    acceptanceDeadlineIso,
    COURIER_ACCEPTANCE_ADMIN_WARNING_MS,
    30 * 60 * 1000,
  );

  const rawRemainingDistanceKm = shouldShowDeliveryEta
    ? typeof order?.tracking?.courierLocation?.remainingDistanceKm === 'number'
      ? order.tracking.courierLocation.remainingDistanceKm
      : typeof order?.deliveryDistanceMeters === 'number' && order.deliveryDistanceMeters > 0
        ? order.deliveryDistanceMeters / 1000
        : null
    : null;
  const remainingDistance =
    typeof rawRemainingDistanceKm === 'number'
      ? formatRouteDistance(rawRemainingDistanceKm)
      : null;

  const rawRemainingEtaMinutes = shouldShowDeliveryEta
    ? typeof order?.tracking?.courierLocation?.remainingEtaMinutes === 'number'
      ? order.tracking.courierLocation.remainingEtaMinutes
      : typeof order?.deliveryEtaMinutes === 'number' && order.deliveryEtaMinutes > 0
        ? order.deliveryEtaMinutes
        : null
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
  const acceptanceMetricLabel =
    language === 'ru' ? 'Время на принятие' : language === 'uz-cyrl' ? 'Қабул қилиш вақти' : 'Qabul qilish vaqti';
  const acceptanceMetricHint =
    language === 'ru'
      ? 'Если курьер не примет заказ вовремя, администратор вмешается.'
      : language === 'uz-cyrl'
        ? 'Курьер вақтида қабул қилмаса, админ вазиятни кўриб чиқади.'
        : "Kuryer vaqtida qabul qilmasa, admin vaziyatni ko'rib chiqadi.";
  const acceptanceDistanceHint =
    language === 'ru'
      ? 'ETA появится после подтверждения курьера.'
      : language === 'uz-cyrl'
        ? 'ETA курьер тасдиқлагандан кейин чиқади.'
        : 'ETA kuryer tasdiqlagandan keyin chiqadi.';
  const acceptanceEtaStateLabel =
    language === 'ru' ? 'ETA статус' : language === 'uz-cyrl' ? 'ETA ҳолати' : 'ETA holati';
  const acceptanceEtaStateValue =
    language === 'ru' ? 'Ожидается' : language === 'uz-cyrl' ? 'Кутилмоқда' : 'Kutilmoqda';
  const orderCardClass =
    'rounded-[20px] border border-[var(--app-line)] bg-[var(--app-card)] p-5 text-[var(--app-text)] shadow-[0_12px_30px_rgba(15,23,42,0.06)]';
  const mutedLabelClass = 'text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/38';
  const bodyTextClass = 'text-slate-700 dark:text-white/76';

  return (
    <div
      className="min-h-screen bg-[var(--app-bg)] px-6 pt-8 text-[var(--app-text)] animate-in fade-in duration-700"
      style={{ paddingBottom: 'calc(var(--customer-nav-top-edge, 88px) + 24px)' }}
    >
      <DeliveryHeroCard
        tone={trackingMeta.isDelivered ? 'success' : shouldShowDeliveryEta ? 'live' : 'warm'}
        eyebrow={tr('success.eyebrow')}
        statusLabel={trackingMeta.stageLabel}
        title={trackingMeta.heroTitle}
        subtitle={trackingMeta.statusLine}
        connectionState="idle"
        isConnected={false}
        etaLabel={isAwaitingCourierAcceptance ? acceptanceMetricLabel : null}
        etaValue={
          isAwaitingCourierAcceptance
            ? acceptanceCountdown.label
            : remainingEta
              ? etaCountdownLabel || remainingEta
              : null
        }
        etaHint={
          isAwaitingCourierAcceptance
            ? acceptanceCountdown.isExpired
              ? language === 'ru'
                ? 'Время принятия истекло. Администратор проверяет заказ.'
                : language === 'uz-cyrl'
                  ? 'Қабул қилиш вақти тугади. Админ буюртмани текширяпти.'
                  : "Qabul qilish vaqti tugadi. Admin buyurtmani ko'rib chiqadi."
              : acceptanceMetricHint
            : remainingEta
            ? isEtaExpired
              ? language === 'ru'
                ? 'Курьер почти у вас'
                : language === 'uz-cyrl'
                  ? 'Курьер деярли етиб келди'
                  : 'Kuryer deyarli yetib keldi'
              : `ETA: ${remainingEta}`
            : tr('success.footer')
        }
        distanceLabel={isAwaitingCourierAcceptance ? acceptanceEtaStateLabel : null}
        distanceValue={isAwaitingCourierAcceptance ? acceptanceEtaStateValue : remainingDistance}
        distanceHint={
          isAwaitingCourierAcceptance
            ? acceptanceDistanceHint
            : remainingDistance
            ? language === 'ru'
              ? 'Оставшаяся дистанция'
              : language === 'uz-cyrl'
                ? 'Қолган масофа'
                : 'Qolgan masofa'
            : tr('success.footer')
        }
      >
        <div className="rounded-[24px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
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

      <div className="mt-6 grid gap-3">
        {/* Total + Payment status */}
        <div className={orderCardClass}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={mutedLabelClass}>
                {tr('success.total')}
              </p>
              <p className="mt-2 text-[2rem] font-black tracking-[-0.04em]">
                {order.total.toLocaleString()} so'm
              </p>
            </div>
            <div className="rounded-[12px] border border-amber-400/18 bg-amber-400/10 px-3 py-2 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-300/70">
                {tr('success.liveStatus')}
              </p>
              <p className="mt-1 text-sm font-black text-amber-200">{paymentStatusLabel}</p>
            </div>
          </div>
        </div>

        {/* Payment + Courier + Address + Next step */}
        <div className={`${orderCardClass} space-y-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/8 dark:bg-white/[0.07] dark:text-white/65">
              <CreditCard size={18} />
            </div>
            <div>
              <p className={mutedLabelClass}>
                {tr('success.payment')}
              </p>
              <p className={`mt-0.5 text-sm font-bold ${bodyTextClass}`}>{paymentLabel}</p>
            </div>
          </div>

          {trackingMeta.courierLabel ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-sky-300/12 bg-sky-400/10 text-sky-300">
                <ShoppingBag size={18} />
              </div>
              <div>
                <p className={mutedLabelClass}>
                  {language === 'ru' ? 'Курьер' : language === 'uz-cyrl' ? 'Курьер' : 'Kuryer'}
                </p>
                <p className={`mt-0.5 text-sm font-bold ${bodyTextClass}`}>{trackingMeta.courierLabel}</p>
              </div>
            </div>
          ) : null}

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/8 dark:bg-white/[0.07] dark:text-white/65">
              <MapPin size={18} />
            </div>
            <div>
              <p className={mutedLabelClass}>
                {tr('success.address')}
              </p>
              <p className={`mt-0.5 text-sm font-semibold leading-relaxed ${bodyTextClass}`}>
                {formatText(order.customerAddress?.addressText || (language === 'ru' ? "Адрес не указан" : "Manzil ko'rsatilmagan"))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/8 dark:bg-white/[0.07] dark:text-white/65">
              <Clock3 size={18} />
            </div>
            <div>
              <p className={mutedLabelClass}>
                {tr('success.nextStep')}
              </p>
              <p className={`mt-0.5 text-sm font-semibold ${bodyTextClass}`}>{trackingMeta.statusLine}</p>
            </div>
          </div>
        </div>

        {/* Order items */}
        <div className={orderCardClass}>
          <p className={`mb-4 ${mutedLabelClass}`}>
            {tr('success.contents')}
          </p>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-slate-200 bg-slate-50 text-[10px] font-black text-slate-500 dark:border-white/8 dark:bg-white/[0.07] dark:text-white/60">
                    {item.quantity}x
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${bodyTextClass}`}>{formatText(item.name)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-white/38">
                      {item.price.toLocaleString()} so'm / dona
                    </p>
                  </div>
                </div>
                <p className="text-sm font-black">
                  {(item.price * item.quantity).toLocaleString()} so'm
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={() => navigate(`/customer/orders/${order.id}`)}
          className="flex h-[56px] w-full items-center justify-center gap-3 rounded-[16px] bg-slate-950 text-base font-black text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-all active:scale-[0.98] dark:bg-white dark:text-slate-950 dark:shadow-[0_8px_24px_rgba(255,255,255,0.12)]"
        >
          <ShoppingBag size={20} />
          <span>Buyurtma tafsilotlari</span>
        </button>

        <button
          onClick={() => navigate('/customer')}
          className="flex h-[56px] w-full items-center justify-center gap-3 rounded-[16px] border border-slate-200 bg-white text-base font-black text-slate-600 transition-all active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.05] dark:text-white/75"
        >
          <Home size={20} />
          <span>{tr('success.homeButton')}</span>
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/24">
        <span>{tr('success.footer')}</span>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
