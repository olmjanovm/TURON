import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  Map,
  MapPin,
  Package,
  Phone,
  Route,
  ShoppingBag,
  TimerReset,
  User,
} from 'lucide-react';
import { DeliveryStage } from '../../data/types';
import { CourierMapView } from '../../components/courier/CourierMapView';
import {
  CourierStageButtons,
  getCourierPaymentLabel,
} from '../../components/courier/CourierComponents';
import { ErrorStateCard } from '../../components/ui/FeedbackStates';
import { useCourierOrderDetails, useUpdateCourierOrderStage } from '../../hooks/queries/useOrders';
import { estimateRouteInfo } from '../../features/maps/route';
import { DEFAULT_RESTAURANT_LOCATION } from '../../features/maps/restaurant';
import {
  DELIVERY_STAGE_FLOW,
  getCourierStageProgressIndex,
  getDeliveryRouteMeta,
  getDeliveryStageMeta,
} from '../../features/courier/deliveryStage';

const CourierOrderDetailPage: React.FC = () => {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, isError, error, refetch } = useCourierOrderDetails(orderId);
  const updateStageMutation = useUpdateCourierOrderStage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <Loader2 size={28} className="mx-auto animate-spin text-sky-600" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.22em] text-slate-500">
            Topshiriq yuklanmoqda
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorStateCard
        title="Buyurtma yuklanmadi"
        message={(error as Error).message}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h3 className="mb-2 text-xl font-black tracking-tight text-slate-900">Buyurtma topilmadi</h3>
        <button
          onClick={() => navigate('/courier/orders')}
          className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-600"
        >
          Ro'yxatga qaytish
        </button>
      </div>
    );
  }

  const currentStage = order.deliveryStage ?? DeliveryStage.IDLE;
  const stageMeta = getDeliveryStageMeta(currentStage);
  const routeMeta = getDeliveryRouteMeta(currentStage);
  const pickup = {
    lat: order.pickupLat ?? DEFAULT_RESTAURANT_LOCATION.pin.lat,
    lng: order.pickupLng ?? DEFAULT_RESTAURANT_LOCATION.pin.lng,
  };
  const destination = {
    lat: order.destinationLat ?? order.customerAddress?.latitude ?? pickup.lat,
    lng: order.destinationLng ?? order.customerAddress?.longitude ?? pickup.lng,
  };
  const courierPin = order.tracking?.courierLocation
    ? {
        lat: order.tracking.courierLocation.latitude,
        lng: order.tracking.courierLocation.longitude,
      }
    : pickup;
  const routeTo =
    currentStage === DeliveryStage.IDLE ||
    currentStage === DeliveryStage.GOING_TO_RESTAURANT ||
    currentStage === DeliveryStage.ARRIVED_AT_RESTAURANT
      ? pickup
      : destination;
  const routeInfo = estimateRouteInfo(courierPin, routeTo, {
    minimumDistanceKm: 0.1,
    minimumEtaMinutes: 1,
  });
  const createdAt = new Date(order.createdAt).toLocaleString('uz-UZ', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  const stageIndex = getCourierStageProgressIndex(currentStage);

  const handleCall = () => {
    if (!order.customerPhone) {
      window.alert('Mijozning telefon raqami mavjud emas');
      return;
    }

    window.location.href = `tel:${order.customerPhone}`;
  };

  const handleStageSelect = (nextStage: DeliveryStage) => {
    if (updateStageMutation.isPending) {
      return;
    }

    updateStageMutation.mutate(
      { id: order.id, stage: nextStage },
      {
        onSuccess: () => {
          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
          }

          if (nextStage === DeliveryStage.DELIVERED) {
            window.setTimeout(() => navigate('/courier/orders'), 1400);
          }
        },
      },
    );
  };

  return (
    <div className="space-y-6 px-6 py-6 pb-40 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/courier/orders')}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-transform active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-right">
          <h2 className="text-xl font-black tracking-tight text-slate-900">#{order.orderNumber}</h2>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{createdAt}</p>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.18),transparent_22%),linear-gradient(135deg,#0f172a_0%,#111827_100%)] px-6 py-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.2)]">
        <div className="absolute -right-10 top-4 h-28 w-28 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-sky-300/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/50">
                Operatsion topshiriq
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                {order.customerName || 'Mijoz'}
              </h3>
              <p className="mt-2 max-w-[260px] text-sm font-semibold leading-relaxed text-white/72">
                {order.customerAddress?.addressText || "Manzil ko'rsatilmagan"}
              </p>
            </div>
            <div className={`rounded-[20px] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${stageMeta.badgeClass}`}>
              {stageMeta.label}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">ETA</p>
              <p className="mt-2 text-lg font-black text-white">{routeInfo.eta}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Masofa</p>
              <p className="mt-2 text-lg font-black text-white">{routeInfo.distance}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Jami</p>
              <p className="mt-2 text-lg font-black text-white">{order.total.toLocaleString()} so'm</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={handleCall}
              disabled={!order.customerPhone}
              className="flex h-14 items-center justify-center gap-3 rounded-[22px] border border-white/10 bg-white/10 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              <Phone size={16} />
              <span>Qo'ng'iroq</span>
            </button>
            <button
              onClick={() => navigate(`/courier/map/${order.id}`)}
              className="flex h-14 items-center justify-center gap-3 rounded-[22px] bg-amber-400 text-[11px] font-black uppercase tracking-[0.18em] text-slate-950 shadow-xl shadow-amber-900/20 transition-transform active:scale-[0.98]"
            >
              <Map size={16} />
              <span>Xaritada ochish</span>
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Marshrut preview</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-black text-slate-900">{routeMeta.title}</p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">{routeMeta.description}</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              {stageIndex + 1}/{DELIVERY_STAGE_FLOW.length}
            </div>
          </div>
        </div>
        <CourierMapView
          pickup={pickup}
          destination={destination}
          courierPos={courierPin}
          routeFrom={courierPin}
          routeTo={routeTo}
          height="260px"
          className="rounded-none border-0 shadow-none"
        />
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Route size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Bosqichlar</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Bosqichni to'g'ri va ketma-ket yangilang
            </p>
          </div>
        </div>

        <CourierStageButtons
          currentStage={currentStage}
          onStageSelect={handleStageSelect}
          isUpdating={updateStageMutation.isPending}
          theme="light"
        />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <TimerReset size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">ETA</p>
              <p className="mt-1 text-lg font-black text-slate-900">{routeInfo.eta}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Route size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Masofa</p>
              <p className="mt-1 text-lg font-black text-slate-900">{routeInfo.distance}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">To'lov</p>
              <p className="mt-1 text-sm font-black text-slate-900">{getCourierPaymentLabel(order.paymentMethod)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Status</p>
              <p className="mt-1 text-sm font-black text-slate-900">{stageMeta.description}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <User size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mijoz va manzil</p>
            <p className="mt-1 text-base font-black text-slate-900">{order.customerName || 'Mijoz'}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[24px] bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-black text-slate-900">{order.customerAddress?.label || 'Manzil'}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {order.customerAddress?.addressText || "Manzil ko'rsatilmagan"}
                </p>
              </div>
            </div>
          </div>

          {order.note ? (
            <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-500">Izoh</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-800">{order.note}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Package size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Buyurtma tarkibi</p>
            <p className="mt-1 text-base font-black text-slate-900">{order.items.length} ta mahsulot</p>
          </div>
        </div>

        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[10px] font-black text-slate-500 shadow-sm">
                  {item.quantity}x
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">{item.name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{item.price.toLocaleString()} so'm</p>
                </div>
              </div>
              <p className="text-sm font-black text-slate-900">
                {(item.price * item.quantity).toLocaleString()} so'm
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CourierOrderDetailPage;
