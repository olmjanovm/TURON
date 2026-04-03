import React from 'react';
import { ArrowLeft, Loader2, MapPin, Store } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { CourierMapView } from '../../components/courier/CourierMapView';
import { TrackingBottomSheet } from '../../components/customer/CustomerComponents';
import { ErrorStateCard } from '../../components/ui/FeedbackStates';
import { PaymentMethod } from '../../data/types';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';
import { DEFAULT_RESTAURANT_LOCATION } from '../../features/maps/restaurant';
import { estimateRouteMetrics, formatEtaMinutes, formatRouteDistance } from '../../features/maps/route';
import { useEtaCountdown } from '../../features/maps/useEtaCountdown';
import {
  getCustomerTrackingDistanceFallbackKm,
  getCustomerTrackingEtaFallbackMinutes,
  getCustomerTrackingMeta,
} from '../../features/tracking/customerTracking';
import { useRouteDetails } from '../../hooks/queries/useMaps';
import { useOrderDetails, useOrderTrackingStream } from '../../hooks/queries/useOrders';

type TrackingPanelTab = 'address' | 'order' | null;

function getPaymentLabel(method: PaymentMethod) {
  if (method === PaymentMethod.CASH) {
    return 'Naqd';
  }

  if (method === PaymentMethod.EXTERNAL_PAYMENT) {
    return 'Click / Payme';
  }

  return "Qo'lda o'tkazma";
}

const TrackingMapPage: React.FC = () => {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, isError, error, refetch } = useOrderDetails(orderId);
  const { isConnected } = useOrderTrackingStream(orderId, Boolean(orderId));
  const { language, formatText, intlLocale } = useCustomerLanguage();
  const [activePanel, setActivePanel] = React.useState<TrackingPanelTab>(null);
  const [routeInfo, setRouteInfo] = React.useState<{ distance: string; eta: string } | null>(null);

  const restaurantPin = React.useMemo(
    () => ({
      lat: order?.pickupLat ?? DEFAULT_RESTAURANT_LOCATION.pin.lat,
      lng: order?.pickupLng ?? DEFAULT_RESTAURANT_LOCATION.pin.lng,
    }),
    [order?.pickupLat, order?.pickupLng],
  );

  const destinationPin = React.useMemo(
    () => ({
      lat: order?.destinationLat ?? order?.customerAddress?.latitude ?? restaurantPin.lat,
      lng: order?.destinationLng ?? order?.customerAddress?.longitude ?? restaurantPin.lng,
    }),
    [
      order?.destinationLat,
      order?.destinationLng,
      order?.customerAddress?.latitude,
      order?.customerAddress?.longitude,
      restaurantPin.lat,
      restaurantPin.lng,
    ],
  );

  const trackingMeta = order ? getCustomerTrackingMeta(order, language) : null;
  const liveCourierPin = order?.tracking?.courierLocation
    ? {
        lat: order.tracking.courierLocation.latitude,
        lng: order.tracking.courierLocation.longitude,
      }
    : undefined;
  const courierPin =
    trackingMeta?.showCourierMarker ? liveCourierPin ?? restaurantPin : undefined;
  const currentTargetPin =
    trackingMeta?.currentTarget === 'customer' ? destinationPin : restaurantPin;
  const routeOrigin =
    trackingMeta?.shouldUseCourierRouteOrigin && courierPin ? courierPin : restaurantPin;

  const routeDetailsQuery = useRouteDetails(
    routeOrigin,
    currentTargetPin,
    Boolean(orderId && order && !trackingMeta?.isDelivered && !trackingMeta?.isCancelled),
  );

  const estimatedMetrics = React.useMemo(
    () =>
      estimateRouteMetrics(routeOrigin, currentTargetPin, {
        minimumDistanceKm: 0.3,
        minimumEtaMinutes: 3,
      }),
    [currentTargetPin, routeOrigin],
  );

  const liveEtaMinutes = order?.tracking?.courierLocation?.remainingEtaMinutes;
  const liveDistanceKm = order?.tracking?.courierLocation?.remainingDistanceKm;
  const { countdownLabel } = useEtaCountdown(
    liveEtaMinutes,
    order?.tracking?.lastEventAt || order?.courierLastEventAt || undefined,
  );

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 text-white">
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] items-center justify-center">
          <div className="rounded-[16px] border border-white/10 bg-white/[0.05] px-6 py-5 text-center shadow-2xl backdrop-blur-xl">
            <Loader2 size={28} className="mx-auto animate-spin text-amber-400" />
            <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-white/65">
              Xarita yuklanmoqda
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 px-4 py-10">
        <div className="mx-auto max-w-[430px]">
          <ErrorStateCard
            title="Tracking"
            message={(error as Error).message}
            onRetry={() => {
              void refetch();
            }}
          />
        </div>
      </div>
    );
  }

  if (!order || !trackingMeta) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto flex min-h-[80dvh] max-w-[430px] flex-col items-center justify-center text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-white/55">Tracking</p>
          <button
            type="button"
            onClick={() => navigate('/customer/orders')}
            className="mt-6 rounded-[12px] bg-white px-6 py-3 text-sm font-black text-slate-950"
          >
            Orqaga
          </button>
        </div>
      </div>
    );
  }

  const realRouteInfo = routeDetailsQuery.data ?? routeInfo;
  const fallbackEtaMinutes = getCustomerTrackingEtaFallbackMinutes(order, estimatedMetrics.etaMinutes);
  const fallbackDistanceKm = getCustomerTrackingDistanceFallbackKm(order, estimatedMetrics.distanceKm);

  const etaDisplay =
    trackingMeta.isDelivered
      ? 'Yetkazildi'
      : trackingMeta.isCancelled
        ? 'Bekor qilindi'
        : countdownLabel ||
          (typeof liveEtaMinutes === 'number' ? formatEtaMinutes(liveEtaMinutes) : null) ||
          realRouteInfo?.eta ||
          formatEtaMinutes(fallbackEtaMinutes);

  const distanceDisplay =
    typeof liveDistanceKm === 'number'
      ? formatRouteDistance(liveDistanceKm)
      : realRouteInfo?.distance || formatRouteDistance(fallbackDistanceKm);

  const updatedAt = order.tracking?.lastEventAt || order.courierLastEventAt;
  const updatedAtLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString(intlLocale, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--';

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-[430px]">
        <div className="relative min-h-[100dvh] overflow-hidden bg-slate-950">
          <div className="absolute inset-0">
            <CourierMapView
              pickup={restaurantPin}
              destination={destinationPin}
              courierPos={courierPin}
              routeFrom={routeOrigin}
              routeTo={currentTargetPin}
              height="100dvh"
              className="rounded-none border-0 shadow-none"
              onRouteInfoChange={setRouteInfo}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.14),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.16)_0%,rgba(2,6,23,0.32)_36%,rgba(2,6,23,0.74)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-slate-950/24" />
          </div>

          <div className="relative z-10 flex min-h-[100dvh] flex-col">
            <div className="px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/customer/orders/${order.id}`)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-white shadow-[0_18px_40px_rgba(2,6,23,0.42)] backdrop-blur-xl"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="min-w-0 rounded-[14px] border border-white/10 bg-slate-950/70 px-4 py-2.5 text-center shadow-[0_20px_44px_rgba(2,6,23,0.42)] backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/48">
                    {DEFAULT_RESTAURANT_LOCATION.name}
                  </p>
                  <p className="mt-1.5 text-[13px] font-black tracking-tight text-white">
                    {trackingMeta.stageLabel}
                  </p>
                </div>

                <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-right shadow-[0_18px_40px_rgba(2,6,23,0.42)] backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                    {isConnected ? 'Jonli' : 'Offline'}
                  </p>
                  <p className="mt-1 text-xs font-black text-white/90">{updatedAtLabel}</p>
                </div>
              </div>
            </div>

            <div className="pointer-events-none flex-1 px-4 pb-[272px] pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-emerald-300/30 bg-emerald-400/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                  <Store size={12} className="mr-1 inline" />
                  Restoran
                </div>
                <div className="rounded-full border border-rose-300/30 bg-rose-400/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-rose-200">
                  <MapPin size={12} className="mr-1 inline" />
                  Manzil
                </div>
                {trackingMeta.showCourierMarker ? (
                  <div className="rounded-full border border-sky-300/30 bg-sky-400/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-sky-400" />
                    {trackingMeta.courierLabel || 'Kuryer'}
                  </div>
                ) : null}
              </div>
            </div>

            <TrackingBottomSheet
              eta={etaDisplay}
              distance={distanceDisplay}
              statusLine={trackingMeta.statusLine}
              activePanel={activePanel}
              onTogglePanel={(panel) => {
                setActivePanel((current) => (current === panel ? null : panel));
              }}
              onSupport={() => navigate(`/customer/support?orderId=${order.id}`)}
              addressContent={
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/38">
                      Yetkazish manzili
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-7 text-white/78">
                      {formatText(order.customerAddress?.addressText || "Manzil ko'rsatilmagan")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/38">
                      Qabul qiluvchi
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white/78">
                      {formatText(order.customerName || 'Mijoz')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/38">
                      Izoh
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-7 text-white/78">
                      {order.note ? formatText(order.note) : "Izoh qoldirilmagan"}
                    </p>
                  </div>
                </div>
              }
              orderContent={
                <div className="space-y-4">
                  {trackingMeta.courierLabel ? (
                    <div className="rounded-[12px] border border-sky-300/18 bg-sky-400/10 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-100/72">
                        Kuryer
                      </p>
                      <p className="mt-2 text-sm font-black text-sky-50">
                        {trackingMeta.courierLabel}
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    {order.items.slice(0, 4).map((item, index) => (
                      <div key={`${item.id}-${index}`} className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-black text-white/72">
                            {item.quantity}x
                          </div>
                          <p className="truncate text-sm font-semibold text-white/78">
                            {formatText(item.name)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-black text-white">
                          {(item.price * item.quantity).toLocaleString()} so'm
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[12px] border border-white/8 bg-slate-950/42 px-4 py-3">
                    <div className="flex items-center justify-between text-sm font-semibold text-white/72">
                      <span>To'lov</span>
                      <span>{getPaymentLabel(order.paymentMethod)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white/72">Jami</span>
                      <span className="text-lg font-black text-white">
                        {order.total.toLocaleString()} so'm
                      </span>
                    </div>
                  </div>
                </div>
              }
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default TrackingMapPage;
