import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Loader2,
  MapPin,
  ShoppingBag,
} from 'lucide-react';
import { PaymentMethod, PaymentStatus } from '../../data/types';
import type { Order } from '../../data/types';
import { useOrderDetails } from '../../hooks/queries/useOrders';
import { ErrorStateCard } from '../../components/ui/FeedbackStates';
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
  const acceptanceDeadlineIso = getCourierAcceptanceDeadlineIso(order, isAwaitingCourierAcceptance);
  const acceptanceCountdown = useCountdown(
    acceptanceDeadlineIso,
    COURIER_ACCEPTANCE_ADMIN_WARNING_MS,
    30 * 60 * 1000,
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
  const addressText = formatText(
    order.customerAddress?.addressText || (language === 'ru' ? 'Адрес не указан' : "Manzil ko'rsatilmagan"),
  );
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className="min-h-[100dvh] bg-[#f6f6f7] text-[#202020] animate-in fade-in duration-400"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
    >
      <div
        className="mx-auto flex w-full max-w-[430px] flex-col px-4"
        style={{
          height:
            'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 24px)',
        }}
      >
        <div className="rounded-[22px] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.03]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8c8c96]">
                Buyurtma yaratildi
              </p>
              <h1 className="mt-2 text-[22px] font-black tracking-tight text-[#202020]">
                #{order.orderNumber}
              </h1>
              <p className="mt-2 text-[13px] font-semibold leading-5 text-[#8c8c96]">
                {trackingMeta.stageLabel}
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[16px] bg-[#f6f6f7] px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8c8c96]">
                Jami to'lov
              </p>
              <p className="mt-2 text-[18px] font-black tracking-tight text-[#202020]">
                {order.total.toLocaleString()} so'm
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#8c8c96]">
                {paymentLabel} • {paymentStatusLabel}
              </p>
            </div>

            <div className="rounded-[16px] bg-[#f6f6f7] px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8c8c96]">
                Holat
              </p>
              <p className="mt-2 text-[18px] font-black tracking-tight text-[#202020]">
                {isAwaitingCourierAcceptance ? (acceptanceCountdown.label || '...') : trackingMeta.stageLabel}
              </p>
              <p
                className={`mt-1 text-[11px] font-semibold ${
                  isAwaitingCourierAcceptance && acceptanceCountdown.isExpired ? 'text-amber-700' : 'text-[#8c8c96]'
                }`}
              >
                {isAwaitingCourierAcceptance
                  ? acceptanceCountdown.isExpired
                    ? language === 'ru'
                      ? 'Админ проверяет'
                      : language === 'uz-cyrl'
                        ? 'Админ текширяпти'
                        : "Admin ko'rib chiqadi"
                    : language === 'ru'
                      ? 'Курьер примет'
                      : language === 'uz-cyrl'
                        ? 'Курьер қабул қилади'
                        : 'Kuryer qabul qiladi'
                  : trackingMeta.statusLine}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex-1 overflow-hidden rounded-[22px] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.03]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-red-50 text-[#C62020]">
              <MapPin size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8c8c96]">
                Yetkazish manzili
              </p>
              <p className="mt-2 line-clamp-3 text-[14px] font-semibold leading-6 text-[#202020]">
                {addressText}
              </p>
              <p className="mt-2 text-[11px] font-semibold text-[#8c8c96]">
                {totalItems} ta mahsulot • {order.items.length} tur
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          <button
            onClick={() => navigate(`/customer/orders/${order.id}`)}
            className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[18px] bg-[#111827] text-[15px] font-black text-white transition-transform active:scale-[0.985]"
          >
            <ShoppingBag size={18} />
            <span>Buyurtma tafsilotlari</span>
          </button>

          <button
            onClick={() => navigate('/customer')}
            className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[18px] bg-white text-[15px] font-black text-[#202020] ring-1 ring-slate-900/[0.06] transition-transform active:scale-[0.985]"
          >
            <span>{tr('success.homeButton')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
