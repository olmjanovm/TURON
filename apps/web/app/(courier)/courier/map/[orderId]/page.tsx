'use client';

import { use, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  useCourierOrder,
  useAdvanceStage,
  getNextStageAction,
  getStageIndex,
  STAGE_FLOW,
  type CourierVehicle,
} from '@/hooks/use-courier';
import { useCourierSocket } from '@/hooks/use-courier-socket';
import { useDeliverFlow } from '@/hooks/use-courier-deliver';
import { RESTAURANT_DEFAULT } from '@/lib/yandex-maps';
import { AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { isTelegramEnvironment } from '@/lib/telegram';

// HAQIQIY Yandex Maps v3 (ymaps3) — QORONG'I 3D vektor "Navigator" ko'rinishi.
// TURON JS API kaliti (referer: turon-miniapp.vercel.app). v3 yuklanmasa →
// avtomatik real Yandex v2.1 (delivery-navigator) ga qaytadi — qora ekran yo'q.
const DeliveryNavigator = dynamic(
  () => import('@/components/courier/map/yandex-v3-navigator').then((m) => m.YandexV3Navigator),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0c]">
        <Loader2 size={28} className="animate-spin text-amber-400" />
      </div>
    ),
  },
);

const STAGE_LABELS: Record<string, string> = {
  IDLE: 'Buyurtmani qabul qilish',
  GOING_TO_RESTAURANT: "Restoranga yo'l olding",
  ARRIVED_AT_RESTAURANT: 'Restoranga yetding',
  PICKED_UP: 'Buyurtmani olding',
  DELIVERING: 'Mijozga olib boryapsan',
  ARRIVED_AT_DESTINATION: 'Mijoz manziliga yetding',
  DELIVERED: 'Topshirildi',
};

export default function CourierMapPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const authStatus = useAuthStore((s) => s.status);
  const { data: order, isLoading, isError, refetch } = useCourierOrder(orderId);
  const advance = useAdvanceStage();
  useCourierSocket();

  // Auth hali tayyor emas (refresh'da cookie qayta o'rnatilmoqda) → LOADING (xato EMAS).
  // Bu "Buyurtma topilmadi" soxta xatosini oldini oladi (query auth'ni kutadi).
  const authPending =
    authStatus === 'authenticating' || (authStatus === 'idle' && isTelegramEnvironment());

  if (authPending || isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0d0f]">
        <Loader2 size={32} className="animate-spin text-amber-400" />
      </div>
    );
  }

  // Auth XATO (initData yo'q / kirish muvaffaqiyatsiz) — qayta ochishni so'raymiz
  if (authStatus === 'error') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0d0f] px-6 text-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-base font-bold text-white">Kirish amalga oshmadi</p>
          <p className="mt-1.5 text-xs text-white/60">Ilovani Telegram orqali qayta oching.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-slate-900 active:scale-95"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0d0f] px-6 text-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-base font-bold text-white">Buyurtma topilmadi</p>
          <p className="mt-1.5 text-xs text-white/60">Aloqa uzilgan bo'lishi mumkin — qayta urinib ko'ring.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-900 active:scale-95"
            >
              Qayta urinish
            </button>
            <button
              type="button"
              onClick={() => router.replace('/courier/orders')}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-black text-white active:scale-95"
            >
              Ro&apos;yxatga qaytish
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MapView
      order={order}
      vehicleMode="pedestrian"
      onBack={() => router.replace(`/courier/order/${orderId}`)}
      onAdvance={(next) => advance.mutate({ orderId, nextStage: next })}
      advancing={advance.isPending}
    />
  );
}

function MapView({
  order,
  vehicleMode,
  onBack,
  onAdvance,
  advancing,
}: {
  order: NonNullable<ReturnType<typeof useCourierOrder>['data']>;
  vehicleMode: CourierVehicle;
  onBack: () => void;
  onAdvance: (next: import('@/hooks/use-courier').DeliveryStage) => void;
  advancing: boolean;
}) {
  const stage = order.deliveryStage ?? 'IDLE';
  const isDelivered = stage === 'DELIVERED';

  const pickup = useMemo(
    () => ({
      lat: order.pickupLat ?? RESTAURANT_DEFAULT.lat,
      lng: order.pickupLng ?? RESTAURANT_DEFAULT.lng,
    }),
    [order.pickupLat, order.pickupLng],
  );
  const destination = useMemo(
    () => ({
      lat: order.destinationLat ?? order.customerAddress?.latitude ?? pickup.lat,
      lng: order.destinationLng ?? order.customerAddress?.longitude ?? pickup.lng,
    }),
    [order.destinationLat, order.destinationLng, order.customerAddress?.latitude, order.customerAddress?.longitude, pickup],
  );
  const courier = order.tracking?.courierLocation
    ? { lat: order.tracking.courierLocation.latitude, lng: order.tracking.courierLocation.longitude }
    : null;

  // Hozirgi maqsad — pickup yoki destination
  const goingToPickup =
    stage === 'IDLE' || stage === 'GOING_TO_RESTAURANT' || stage === 'ARRIVED_AT_RESTAURANT' || stage === 'PICKED_UP';
  const routeTo = goingToPickup ? pickup : destination;

  const next = getNextStageAction(stage);
  const isFinal = next?.next === 'DELIVERED';

  // Yakuniy bosqich (DELIVERED) GPS + geofence orqali yopiladi (boshqalari oddiy advance).
  const deliverFlow = useDeliverFlow(order.id, () => onBack());

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0d0f] text-white" data-no-ptr="true">
      <DeliveryNavigator
        pickup={pickup}
        destination={destination}
        courier={courier}
        routeTo={routeTo}
        vehicleMode={vehicleMode}
        orderNumber={order.orderNumber}
        onClose={onBack}
        stageLabel={STAGE_LABELS[stage] ?? stage}
        pickupLabel="Restoran (TURON)"
        destinationLabel={
          order.customerAddress?.addressText ?? order.deliveryAddress ?? order.destinationAddress ?? undefined
        }
        confirmLabel={!isDelivered && next ? next.label : undefined}
        onConfirm={
          !isDelivered && next
            ? () => (isFinal ? deliverFlow.start() : onAdvance(next.next))
            : undefined
        }
        confirmBusy={advancing || deliverFlow.isBusy}
      />

      {/* GPS geofence: uzoq → bypass, yoki xato — to'liq ekran overlay */}
      {(deliverFlow.state.phase === 'bypass' || deliverFlow.state.phase === 'error') && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/60 px-4 pb-8 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-3xl bg-[#16161a] p-5 shadow-2xl">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle size={18} className={deliverFlow.state.phase === 'bypass' ? 'text-amber-400' : 'text-red-400'} />
              <p className="text-sm font-black text-white">
                {deliverFlow.state.phase === 'bypass' ? 'Manzildan uzoqdasiz' : 'Topshirishda xatolik'}
              </p>
            </div>
            <p className="mb-4 text-xs leading-snug text-white/70">{deliverFlow.state.message}</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={deliverFlow.reset}
                disabled={deliverFlow.isBusy}
                className="flex h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-sm font-black text-white active:scale-95 disabled:opacity-50"
              >
                {deliverFlow.state.phase === 'error' ? 'Yopish' : 'Bekor'}
              </button>
              <button
                type="button"
                onClick={deliverFlow.state.phase === 'bypass' ? deliverFlow.confirmBypass : deliverFlow.start}
                disabled={deliverFlow.isBusy}
                className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black text-white active:scale-95 disabled:opacity-50 ${
                  deliverFlow.state.phase === 'bypass' ? 'bg-red-600' : 'bg-emerald-500'
                }`}
              >
                {deliverFlow.isBusy ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : deliverFlow.state.phase === 'bypass' ? (
                  'Baribir yopish'
                ) : (
                  'Qayta urinish'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage progress overlay (top) */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 mx-auto flex w-full max-w-[480px] gap-1 px-4"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 78px)' }}
      >
        {STAGE_FLOW.map((s, i) => {
          const idx = getStageIndex(stage);
          const done = i < idx || isDelivered;
          const active = i === idx && !isDelivered;
          return (
            <div
              key={s.key}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                done ? 'bg-emerald-400' : active ? 'bg-amber-400' : 'bg-white/15'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
