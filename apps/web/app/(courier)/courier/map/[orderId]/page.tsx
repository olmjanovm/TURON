'use client';

import { use, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  useCourierOrder,
  useCourierProfile,
  useAdvanceStage,
  getNextStageAction,
  getStageIndex,
  STAGE_FLOW,
  type CourierVehicle,
} from '@/hooks/use-courier';
import { useCourierSocket } from '@/hooks/use-courier-socket';
import { RESTAURANT_DEFAULT } from '@/lib/yandex-maps';

// DeliveryNavigator faqat client'da — Yandex Maps SSR'da ishlamaydi
const DeliveryNavigator = dynamic(
  () => import('@/components/courier/map/delivery-navigator').then((m) => m.DeliveryNavigator),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0f]">
        <Loader2 size={28} className="animate-spin text-amber-400" />
      </div>
    ),
  },
);

const STAGE_LABELS: Record<string, string> = {
  IDLE: 'Buyurtmani qabul qilish',
  GOING_TO_RESTAURANT: "Restoranga yo'l olding",
  ARRIVED_AT_RESTAURANT: 'Restoranga yetding',
  PICKING_UP: 'Buyurtmani olding',
  DELIVERING: 'Mijozga olib boryapsan',
  DELIVERED: 'Topshirildi',
};

export default function CourierMapPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const { data: order, isLoading, isError } = useCourierOrder(orderId);
  const { data: profile } = useCourierProfile();
  const advance = useAdvanceStage();
  useCourierSocket();

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0d0f]">
        <Loader2 size={32} className="animate-spin text-amber-400" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0d0f] px-6 text-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-base font-bold text-white">Buyurtma topilmadi</p>
          <button
            type="button"
            onClick={() => router.replace('/courier/orders')}
            className="mt-3 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-slate-900 active:scale-95"
          >
            Ro&apos;yxatga qaytish
          </button>
        </div>
      </div>
    );
  }

  return (
    <MapView
      order={order}
      vehicleMode={profile?.vehicleMode ?? 'auto'}
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
    stage === 'IDLE' || stage === 'GOING_TO_RESTAURANT' || stage === 'ARRIVED_AT_RESTAURANT' || stage === 'PICKING_UP';
  const routeTo = goingToPickup ? pickup : destination;

  const next = getNextStageAction(stage);

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
        confirmLabel={!isDelivered && next ? next.label : undefined}
        onConfirm={!isDelivered && next ? () => onAdvance(next.next) : undefined}
        confirmBusy={advancing}
      />

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
