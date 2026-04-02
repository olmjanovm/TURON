import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Loader2,
  MapPin,
  Navigation,
  Package,
  Phone,
  Route,
  ShieldCheck,
  Store,
  TimerReset,
  User,
} from 'lucide-react';
import { DeliveryStage, PaymentMethod } from '../../data/types';
import type { CourierOrderPreview, Order } from '../../data/types';
import {
  COURIER_STAGE_BUTTONS,
  DELIVERY_STAGE_FLOW,
  getCourierStageProgressIndex,
  getDeliveryStageAction,
  getDeliveryStageIndex,
  getDeliveryStageMeta,
  getNextCourierStage,
} from '../../features/courier/deliveryStage';

export function getCourierPaymentLabel(paymentMethod: PaymentMethod) {
  switch (paymentMethod) {
    case PaymentMethod.CASH:
      return 'Naqd pul';
    case PaymentMethod.EXTERNAL_PAYMENT:
      return 'Click / Payme';
    default:
      return "Qo'lda o'tkazma";
  }
}

function getOrderCardAccent(stage: DeliveryStage = DeliveryStage.IDLE) {
  const currentIndex = getCourierStageProgressIndex(stage);

  if (currentIndex >= 3) {
    return 'from-violet-500 via-indigo-600 to-slate-900';
  }

  if (currentIndex >= 1) {
    return 'from-amber-400 via-orange-500 to-slate-900';
  }

  return 'from-sky-500 via-indigo-600 to-slate-900';
}

function getStageSurfaceClasses(
  state: 'completed' | 'current' | 'available' | 'upcoming',
  theme: 'light' | 'dark',
) {
  if (theme === 'dark') {
    switch (state) {
      case 'completed':
        return 'border-emerald-300/25 bg-emerald-400/12 text-emerald-100';
      case 'current':
        return 'border-sky-300/28 bg-sky-400/12 text-sky-100';
      case 'available':
        return 'border-amber-300/25 bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950 shadow-lg shadow-orange-900/20';
      case 'upcoming':
      default:
        return 'border-white/8 bg-white/[0.05] text-white/38';
    }
  }

  switch (state) {
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'current':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'available':
      return 'border-amber-200 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-100';
    case 'upcoming':
    default:
      return 'border-slate-200 bg-slate-50 text-slate-400';
  }
}

export function CourierStageButtons({
  currentStage,
  onStageSelect,
  isUpdating = false,
  theme = 'dark',
}: {
  currentStage: DeliveryStage;
  onStageSelect: (nextStage: DeliveryStage) => void;
  isUpdating?: boolean;
  theme?: 'light' | 'dark';
}) {
  const currentIndex = getCourierStageProgressIndex(currentStage);
  const nextStage = getNextCourierStage(currentStage);

  return (
    <div className="grid grid-cols-2 gap-2">
      {COURIER_STAGE_BUTTONS.map((button, index) => {
        const isCompleted = currentIndex > index;
        const isCurrent = currentIndex === index;
        const isAvailable = nextStage === button.target;
        const surfaceClasses = getStageSurfaceClasses(
          isCompleted ? 'completed' : isCurrent ? 'current' : isAvailable ? 'available' : 'upcoming',
          theme,
        );
        const isDisabled = !isAvailable || isUpdating;
        const isLast = index === COURIER_STAGE_BUTTONS.length - 1;

        return (
          <button
            key={button.key}
            type="button"
            onClick={() => {
              if (isAvailable) {
                onStageSelect(button.target);
              }
            }}
            disabled={isDisabled}
            aria-pressed={isCurrent}
            className={`rounded-[22px] border px-3 py-3 text-left transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-100 ${surfaceClasses} ${isLast ? 'col-span-2' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                {isCompleted ? 'Tayyor' : isCurrent ? 'Joriy' : isAvailable ? 'Bosish mumkin' : 'Keyin'}
              </span>
              {isCompleted ? (
                <CheckCircle2 size={15} />
              ) : isUpdating && isAvailable ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <span className="text-[11px] font-black">{index + 1}</span>
              )}
            </div>
            <p className="mt-2 text-[12px] font-black leading-snug">{button.label}</p>
          </button>
        );
      })}
    </div>
  );
}

export const CourierOrderCard: React.FC<{
  order: CourierOrderPreview;
  onClick: () => void;
}> = ({ order, onClick }) => {
  const stageMeta = getDeliveryStageMeta(order.deliveryStage);
  const createdAt = new Date(order.createdAt).toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const accentGradient = getOrderCardAccent(order.deliveryStage);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-[32px] border border-slate-200 bg-white p-5 text-left shadow-[0_20px_48px_rgba(15,23,42,0.08)] transition-transform active:scale-[0.985]"
    >
      <div className={`rounded-[28px] bg-gradient-to-br ${accentGradient} p-4 text-white shadow-xl`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">
              Faol topshiriq
            </p>
            <h4 className="mt-2 text-2xl font-black tracking-tight">#{order.orderNumber}</h4>
            <p className="mt-2 truncate text-sm font-semibold text-white/78">{order.customerName}</p>
          </div>
          <div className={`shrink-0 rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${stageMeta.badgeClass}`}>
            {stageMeta.label}
          </div>
        </div>

        <div className="mt-4 rounded-[22px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <MapPin size={16} className="mt-0.5 shrink-0 text-amber-200" />
            <p className="line-clamp-2 text-sm font-semibold leading-relaxed text-white/82">
              {order.destinationAddress || "Manzil ko'rsatilmagan"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.18em] text-white/65">
          <span>{createdAt}</span>
          <span>{order.itemCount} ta mahsulot</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-[20px] border border-slate-100 bg-slate-50 px-3 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">To'lov</p>
          <p className="mt-2 text-[12px] font-black text-slate-900">
            {order.paymentMethod === PaymentMethod.CASH ? 'Naqd' : 'Onlayn'}
          </p>
        </div>
        <div className="rounded-[20px] border border-slate-100 bg-slate-50 px-3 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Holat</p>
          <p className="mt-2 text-[12px] font-black text-slate-900">{stageMeta.description}</p>
        </div>
        <div className="rounded-[20px] border border-slate-100 bg-slate-50 px-3 py-3 text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Jami</p>
          <p className="mt-2 text-[12px] font-black text-slate-900">{order.total.toLocaleString()} so'm</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
          <Navigation size={14} className="text-sky-500" />
          <span>Operatsion ko'rinish</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-900">
          <span>Batafsil</span>
          <ChevronRight size={16} className="transition-transform group-active:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
};

export const DeliveryBottomPanel: React.FC<{
  order: Order;
  currentStage: DeliveryStage;
  onAction: (nextStage: DeliveryStage) => void;
  onCall: () => void;
  onOpenDetails: () => void;
  onExpandedChange?: (expanded: boolean) => void;
  isUpdating?: boolean;
  canCall?: boolean;
  routeTitle: string;
  routeDescription: string;
  pickupLabel: string;
  destinationLabel: string;
  distance: string;
  eta: string;
  distanceLabel?: string;
  etaLabel?: string;
  isEtaLive?: boolean;
}> = ({
  order,
  currentStage,
  onAction,
  onCall,
  onOpenDetails,
  onExpandedChange,
  isUpdating = false,
  canCall = true,
  routeTitle,
  routeDescription,
  pickupLabel,
  destinationLabel,
  distance,
  eta,
  distanceLabel = 'Qolgan masofa',
  etaLabel = 'Qolgan ETA',
  isEtaLive = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const stageMeta = getDeliveryStageMeta(currentStage);
  const primaryAction = getDeliveryStageAction(currentStage);
  const stageIndex = getDeliveryStageIndex(currentStage);

  React.useEffect(() => {
    if (currentStage === DeliveryStage.DELIVERED) {
      setIsExpanded(true);
    }
  }, [currentStage]);

  React.useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50">
      <div className="pointer-events-auto mx-auto w-full max-w-[430px] px-4 pb-[calc(env(safe-area-inset-bottom)+14px)]">
        <div className="overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/88 shadow-[0_36px_90px_rgba(2,6,23,0.6)] backdrop-blur-2xl">
          <div className="px-5 pt-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div className="h-1.5 w-12 shrink-0 rounded-full bg-white/12" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">
                    Courier ops
                  </p>
                  <p className="mt-1 truncate text-sm font-black text-white/86">{routeTitle}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.06] text-white/72 transition-transform active:scale-95"
                aria-label={isExpanded ? 'Panelni yig\'ish' : 'Panelni kengaytirish'}
              >
                {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-white/[0.05] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
                    Yetib borish vaqti
                  </p>
                  <p className="mt-3 text-[34px] font-black leading-none tracking-[-0.05em] text-white">
                    {eta}
                  </p>
                </div>

                <div className={`rounded-[20px] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${stageMeta.badgeClass}`}>
                  {stageMeta.label}
                </div>
              </div>

              <p className="mt-4 max-w-[320px] text-sm font-semibold leading-relaxed text-white/72">
                {routeDescription}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[20px] border border-white/8 bg-slate-950/50 px-4 py-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                    <TimerReset size={14} className="text-amber-300" />
                    <span>{etaLabel}</span>
                    {isEtaLive ? <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" /> : null}
                  </div>
                  <p className="mt-3 text-lg font-black text-white">{eta}</p>
                </div>
                <div className="rounded-[20px] border border-white/8 bg-slate-950/50 px-4 py-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                    <Route size={14} className="text-sky-300" />
                    <span>{distanceLabel}</span>
                  </div>
                  <p className="mt-3 text-lg font-black text-white">{distance}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-200">
                    <Store size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Restoran</p>
                    <p className="truncate text-sm font-black text-white/88">{pickupLabel}</p>
                  </div>
                </div>
                <ArrowRight size={16} className="shrink-0 text-white/35" />
                <div className="flex min-w-0 items-center gap-3">
                  <div className="min-w-0 text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Mijoz</p>
                    <p className="truncate text-sm font-black text-white/88">{destinationLabel}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-400/12 text-rose-200">
                    <MapPin size={18} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onCall}
                disabled={!canCall}
                className="flex h-14 items-center justify-center gap-2 rounded-[22px] border border-white/8 bg-white/[0.06] text-[11px] font-black uppercase tracking-[0.18em] text-white transition-transform active:scale-[0.98] disabled:opacity-45"
              >
                <Phone size={16} />
                <span>Qo'ng'iroq</span>
              </button>
              <button
                type="button"
                onClick={onOpenDetails}
                className="flex h-14 items-center justify-center gap-2 rounded-[22px] border border-white/8 bg-white/[0.06] text-[11px] font-black uppercase tracking-[0.18em] text-white transition-transform active:scale-[0.98]"
              >
                <Package size={16} />
                <span>Tafsilot</span>
              </button>
            </div>

            {primaryAction.next ? (
              <div className="mt-4 rounded-[24px] border border-amber-300/12 bg-amber-400/10 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/75">
                  Hozirgi vazifa
                </p>
                <p className="mt-2 text-sm font-black text-white">{primaryAction.label}</p>
              </div>
            ) : null}

            <div className="mt-4">
              <CourierStageButtons
                currentStage={currentStage}
                onStageSelect={onAction}
                isUpdating={isUpdating}
                theme="dark"
              />
            </div>
          </div>

          {isExpanded ? (
            <div className="mt-5 border-t border-white/8 bg-slate-950/70 px-5 pb-5 pt-4">
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {DELIVERY_STAGE_FLOW.map((step, index) => {
                  const isCompleted = index <= stageIndex;
                  const isCurrent = index === stageIndex;

                  return (
                    <div
                      key={step.key}
                      className={`min-w-[92px] rounded-[20px] border px-3 py-3 text-center ${
                        isCompleted
                          ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
                          : 'border-white/8 bg-white/[0.04] text-white/45'
                      }`}
                    >
                      <div
                        className={`mx-auto mb-2 h-2.5 w-2.5 rounded-full ${
                          isCurrent ? 'bg-amber-300' : isCompleted ? 'bg-emerald-300' : 'bg-white/15'
                        }`}
                      />
                      <p className="text-[10px] font-black uppercase tracking-[0.18em]">{step.title}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-3">
                <div className="rounded-[22px] border border-white/8 bg-white/[0.05] p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-white/80">
                      <User size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                        Mijoz
                      </p>
                      <p className="truncate text-sm font-black text-white">{order.customerName || 'Mijoz'}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold leading-relaxed text-white/72">
                    {order.customerAddress?.addressText || "Manzil ko'rsatilmagan"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.05] p-4">
                    <div className="mb-2 flex items-center gap-2 text-white/45">
                      <CreditCard size={15} className="text-amber-300" />
                      <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                        To'lov
                      </span>
                    </div>
                    <p className="text-sm font-black text-white">{getCourierPaymentLabel(order.paymentMethod)}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.05] p-4">
                    <div className="mb-2 flex items-center gap-2 text-white/45">
                      <ShieldCheck size={15} className="text-emerald-300" />
                      <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                        Jami
                      </span>
                    </div>
                    <p className="text-sm font-black text-white">{order.total.toLocaleString()} so'm</p>
                  </div>
                </div>

                {order.note ? (
                  <div className="rounded-[22px] border border-amber-300/20 bg-amber-400/10 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/75">
                      Kuryer uchun izoh
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-white/82">{order.note}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const RouteInfoPanel: React.FC<{
  title: string;
  subtitle: string;
  fromLabel: string;
  toLabel: string;
  stageLabel: string;
  distance: string;
  eta: string;
  distanceLabel?: string;
  etaLabel?: string;
  isEtaLive?: boolean;
}> = ({
  title,
  subtitle,
  fromLabel,
  toLabel,
  stageLabel,
  distance,
  eta,
  distanceLabel = 'Masofa',
  etaLabel = 'ETA',
  isEtaLive = false,
}) => (
  <div className="absolute left-4 right-4 top-24 z-40 rounded-[30px] border border-white/10 bg-slate-950/80 p-4 text-white shadow-[0_24px_64px_rgba(2,6,23,0.5)] backdrop-blur-xl">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Faol marshrut</p>
        <p className="mt-2 text-lg font-black text-white">{title}</p>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-white/68">{subtitle}</p>
      </div>
      <div className="rounded-[18px] border border-white/10 bg-white/[0.06] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/85">
        {stageLabel}
      </div>
    </div>

    <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.05] px-4 py-3">
      <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
        <span>Yo'nalish</span>
        <span className="text-white/72">
          {fromLabel} <ArrowRight size={12} className="inline" /> {toLabel}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-[18px] bg-slate-950/50 px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
            <Route size={13} className="text-sky-300" />
            <span>{distanceLabel}</span>
          </div>
          <p className="mt-2 text-base font-black text-white">{distance}</p>
        </div>
        <div className="rounded-[18px] bg-slate-950/50 px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
            <TimerReset size={13} className="text-amber-300" />
            <span>{etaLabel}</span>
            {isEtaLive ? <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" /> : null}
          </div>
          <p className="mt-2 text-base font-black text-white">{eta}</p>
        </div>
      </div>
    </div>
  </div>
);
