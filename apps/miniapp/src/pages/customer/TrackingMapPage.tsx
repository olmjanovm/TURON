import React from 'react';
import { ArrowLeft, Clock3, MapPin, MessageCircleMore, PackageCheck, Route } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DeliveryHeroCard, DeliveryMarkerLegend } from '../../components/customer/DeliveryExperience';
import { ErrorStateCard } from '../../components/ui/FeedbackStates';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';
import type { RouteInfo } from '../../features/maps/MapProvider';
import { getMapProvider } from '../../features/maps/provider';
import {
  createRouteInfo,
  createZeroRouteInfo,
  estimateRouteMetrics,
  formatArrivalTime,
  formatEtaMinutes,
} from '../../features/maps/route';
import { DEFAULT_RESTAURANT_LOCATION } from '../../features/maps/restaurant';
import { useEtaCountdown } from '../../features/maps/useEtaCountdown';
import {
  getCustomerTrackingDistanceFallbackKm,
  getCustomerTrackingEtaFallbackMinutes,
  getCustomerTrackingMeta,
} from '../../features/tracking/customerTracking';
import { ORDER_TRACKING_FEATURE_ENABLED } from '../../features/tracking/config';
import { useOrderDetails, useOrderTrackingStream } from '../../hooks/queries/useOrders';

const TrackingMapPage: React.FC = () => {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const mapProvider = React.useMemo(() => getMapProvider(), []);
  const RouteMap = mapProvider.RouteMap;
  const { language, formatText } = useCustomerLanguage();
  const { data: order, isLoading, isError, error, refetch } = useOrderDetails(orderId);
  const { connectionState, isConnected } = useOrderTrackingStream(orderId, Boolean(orderId));
  const [mapRouteInfo, setMapRouteInfo] = React.useState<RouteInfo | null>(null);

  const backPath = orderId ? `/customer/orders/${orderId}` : '/customer/orders';

  const pickupPin = React.useMemo(
    () => ({
      lat: order?.pickupLat ?? DEFAULT_RESTAURANT_LOCATION.pin.lat,
      lng: order?.pickupLng ?? DEFAULT_RESTAURANT_LOCATION.pin.lng,
    }),
    [order?.pickupLat, order?.pickupLng],
  );

  const destinationPin = React.useMemo(
    () => ({
      lat: order?.destinationLat ?? order?.customerAddress?.latitude ?? pickupPin.lat,
      lng: order?.destinationLng ?? order?.customerAddress?.longitude ?? pickupPin.lng,
    }),
    [
      order?.customerAddress?.latitude,
      order?.customerAddress?.longitude,
      order?.destinationLat,
      order?.destinationLng,
      pickupPin.lat,
      pickupPin.lng,
    ],
  );

  const courierPin = React.useMemo(
    () =>
      order?.tracking?.courierLocation
        ? {
            lat: order.tracking.courierLocation.latitude,
            lng: order.tracking.courierLocation.longitude,
          }
        : undefined,
    [order?.tracking?.courierLocation],
  );

  const trackingMeta = React.useMemo(
    () => (order ? getCustomerTrackingMeta(order, language) : null),
    [language, order],
  );

  const routeFrom = React.useMemo(() => {
    if (trackingMeta?.shouldUseCourierRouteOrigin && courierPin) {
      return courierPin;
    }

    return pickupPin;
  }, [courierPin, pickupPin, trackingMeta?.shouldUseCourierRouteOrigin]);

  const routeTo = React.useMemo(() => {
    if (trackingMeta?.shouldUseCourierRouteOrigin && courierPin) {
      return trackingMeta.currentTarget === 'restaurant' ? pickupPin : destinationPin;
    }

    return destinationPin;
  }, [courierPin, destinationPin, pickupPin, trackingMeta]);

  const fallbackRouteInfo = React.useMemo(() => {
    if (!order || !trackingMeta) {
      return createZeroRouteInfo();
    }

    if (trackingMeta.isDelivered || trackingMeta.isCancelled) {
      return createZeroRouteInfo();
    }

    const estimatedMetrics = estimateRouteMetrics(routeFrom, routeTo, {
      minimumDistanceKm: 0,
      minimumEtaMinutes: 0,
      roadFactor: 1.18,
      averageSpeedKmh: 26,
    });

    return createRouteInfo({
      distanceKm: getCustomerTrackingDistanceFallbackKm(order, estimatedMetrics.distanceKm),
      etaMinutes: getCustomerTrackingEtaFallbackMinutes(order, estimatedMetrics.etaMinutes),
      source: mapProvider.id === 'mock' ? 'mock' : 'estimate',
    });
  }, [mapProvider.id, order, routeFrom, routeTo, trackingMeta]);

  const displayRouteInfo = mapRouteInfo ?? fallbackRouteInfo;

  const heroConnectionState =
    courierPin || isConnected ? 'connected' : connectionState;
  const heroIsConnected = Boolean(courierPin) || isConnected;

  const remainingEtaMinutes =
    order && trackingMeta && !trackingMeta.isDelivered && !trackingMeta.isCancelled
      ? typeof order.tracking?.courierLocation?.remainingEtaMinutes === 'number'
        ? order.tracking.courierLocation.remainingEtaMinutes
        : getCustomerTrackingEtaFallbackMinutes(order, fallbackRouteInfo.etaSeconds ? fallbackRouteInfo.etaSeconds / 60 : 0)
      : 0;

  const { countdownLabel, isExpired } = useEtaCountdown(
    remainingEtaMinutes,
    order?.tracking?.lastEventAt || order?.courierLastEventAt || order?.createdAt,
  );

  const etaValue =
    remainingEtaMinutes > 0
      ? countdownLabel || formatEtaMinutes(remainingEtaMinutes)
      : displayRouteInfo.eta;
  const arrivalTime =
    remainingEtaMinutes > 0 ? formatArrivalTime(remainingEtaMinutes) : null;

  const liveTrackingHint = trackingMeta?.isDelivered
    ? "Buyurtma topshirildi."
    : trackingMeta?.isCancelled
      ? "Buyurtma bekor qilingan."
      : courierPin
        ? "Kuryer joylashuvi kelishi bilan xarita shu yerda jonli yangilanadi."
        : ORDER_TRACKING_FEATURE_ENABLED
          ? "Kuryer joylashuvi kelishi bilan marker avtomatik paydo bo'ladi."
          : "Hozircha status va yo'nalish ko'rsatiladi. Jonli lokatsiya yoqilganda shu ekran avtomatik boyiydi.";

  const routeCaption =
    trackingMeta?.currentTarget === 'restaurant' && courierPin
      ? "Kuryer avval restoranga boradi, keyin sizning manzilingizga yo'l oladi."
      : "Marshrut restoran va sizning manzilingiz orasida hisoblandi.";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-white">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.05] px-6 py-5 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.22em] text-white/65">
            Tracking yuklanmoqda
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 py-10">
        <ErrorStateCard
          title="Buyurtma kuzatuvi"
          message={(error as Error).message}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  if (!order || !trackingMeta) {
    return (
      <div className="px-4 py-10">
        <ErrorStateCard
          title="Buyurtma kuzatuvi"
          message="Buyurtma topilmadi yoki kuzatuv ma'lumoti tayyor emas."
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 text-white"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
      }}
    >
      <div className="mx-auto max-w-[430px] space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white"
            aria-label="Orqaga"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/72">
            Buyurtma #{order.orderNumber}
          </div>
        </div>

        <DeliveryHeroCard
          tone={trackingMeta.isDelivered ? 'success' : courierPin ? 'live' : 'warm'}
          eyebrow="Buyurtma kuzatuvi"
          statusLabel={trackingMeta.stageLabel}
          title={trackingMeta.heroTitle}
          subtitle={trackingMeta.statusLine}
          connectionState={heroConnectionState}
          isConnected={heroIsConnected}
          etaValue={etaValue}
          etaHint={isExpired && remainingEtaMinutes > 0 ? 'Kuryer deyarli yetib keldi' : arrivalTime ? `Yetib kelishi: ${arrivalTime}` : liveTrackingHint}
          distanceValue={displayRouteInfo.distance}
          distanceHint={routeCaption}
        >
          <div className="rounded-[28px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-white/10">
                  <PackageCheck size={28} className="text-emerald-300" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
                    Holat
                  </p>
                  <p className="mt-2 text-lg font-black tracking-tight text-white">
                    {trackingMeta.stageLabel}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
                  To'lov
                </p>
                <p className="mt-2 text-sm font-black text-white/88">
                  {order.paymentStatus === 'COMPLETED'
                    ? 'Tasdiqlangan'
                    : order.paymentMethod === 'CASH'
                      ? 'Naqd'
                      : 'Tekshiruvda'}
                </p>
              </div>
            </div>
          </div>
        </DeliveryHeroCard>

        <section className="overflow-hidden rounded-[32px] border border-white/8 bg-[#111827] shadow-[0_18px_42px_rgba(2,6,23,0.28)]">
          <RouteMap
            pickup={pickupPin}
            destination={destinationPin}
            courierPos={trackingMeta.showCourierMarker ? courierPin : undefined}
            routeFrom={routeFrom}
            routeTo={routeTo}
            height="360px"
            className="rounded-none border-0 shadow-none"
            followMode={Boolean(courierPin)}
            heading={order.tracking?.courierLocation?.heading}
            onRouteInfoChange={setMapRouteInfo}
          />
        </section>

        <DeliveryMarkerLegend />

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-[24px] border border-white/8 bg-white/[0.05] p-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
              <Route size={14} />
              <span>Yo'nalish</span>
            </div>
            <p className="mt-3 text-lg font-black text-white">{displayRouteInfo.distance}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-white/58">{routeCaption}</p>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-white/[0.05] p-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
              <Clock3 size={14} />
              <span>Yetib kelish</span>
            </div>
            <p className="mt-3 text-lg font-black text-white">{etaValue}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-white/58">
              {arrivalTime ? `Taxminiy vaqt: ${arrivalTime}` : liveTrackingHint}
            </p>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/8 bg-white/[0.05] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-white/8 bg-white/[0.07] text-white/70">
              <MapPin size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/38">
                Yetkazish manzili
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/82">
                {formatText(order.customerAddress?.addressText || "Manzil ko'rsatilmagan")}
              </p>
              <p className="mt-3 text-xs font-semibold leading-5 text-white/54">
                Xaritada faqat shu buyurtmaga tegishli manzil va tracking ma'lumoti ko'rsatiladi.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate(`/customer/orders/${order.id}`)}
            className="flex h-[54px] items-center justify-center gap-2 rounded-[16px] bg-white text-sm font-black text-slate-950 transition-transform active:scale-[0.985]"
          >
            <PackageCheck size={18} />
            <span>Tafsilotlar</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/customer/support?orderId=${order.id}`)}
            className="flex h-[54px] items-center justify-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.05] text-sm font-black text-white/82 transition-transform active:scale-[0.985]"
          >
            <MessageCircleMore size={18} />
            <span>Support</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackingMapPage;
