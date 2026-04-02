import React from 'react';
import { Radio, Route, TimerReset } from 'lucide-react';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';

type DeliveryTone = 'live' | 'warm' | 'success';
type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

const TONE_STYLES: Record<
  DeliveryTone,
  {
    shell: string;
    orbPrimary: string;
    orbSecondary: string;
    border: string;
    status: string;
    metricSurface: string;
    metricBorder: string;
    metricLabel: string;
    metricValue: string;
  }
> = {
  live: {
    shell:
      'bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.18),transparent_26%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]',
    orbPrimary: 'bg-blue-400/15',
    orbSecondary: 'bg-emerald-300/10',
    border: 'border-white/10',
    status: 'bg-white/10 text-blue-100 border border-white/10',
    metricSurface: 'bg-white/10',
    metricBorder: 'border-white/10',
    metricLabel: 'text-slate-300',
    metricValue: 'text-white',
  },
  warm: {
    shell:
      'bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.34),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.18),transparent_28%),linear-gradient(180deg,#111827_0%,#1f2937_100%)]',
    orbPrimary: 'bg-amber-300/15',
    orbSecondary: 'bg-orange-300/10',
    border: 'border-white/10',
    status: 'bg-white/10 text-amber-100 border border-white/10',
    metricSurface: 'bg-white/10',
    metricBorder: 'border-white/10',
    metricLabel: 'text-slate-300',
    metricValue: 'text-white',
  },
  success: {
    shell:
      'bg-[radial-gradient(circle_at_top,rgba(74,222,128,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.16),transparent_26%),linear-gradient(180deg,#052e16_0%,#0f172a_100%)]',
    orbPrimary: 'bg-emerald-300/15',
    orbSecondary: 'bg-amber-200/10',
    border: 'border-white/10',
    status: 'bg-white/10 text-emerald-100 border border-white/10',
    metricSurface: 'bg-white/10',
    metricBorder: 'border-white/10',
    metricLabel: 'text-slate-300',
    metricValue: 'text-white',
  },
};

function ConnectionBadge({
  connectionState,
  isConnected,
}: {
  connectionState: ConnectionState;
  isConnected: boolean;
}) {
  const { language } = useCustomerLanguage();
  const badgeClass = isConnected
    ? 'bg-emerald-50 text-emerald-700'
    : connectionState === 'reconnecting' || connectionState === 'connecting'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-slate-100 text-slate-500';
  const label =
    language === 'ru'
      ? isConnected
        ? 'Онлайн'
        : connectionState === 'reconnecting'
          ? 'Повторное подключение'
          : connectionState === 'connecting'
            ? 'Подключение'
            : 'Ожидание'
      : language === 'uz-cyrl'
        ? isConnected
          ? 'Жонли'
          : connectionState === 'reconnecting'
            ? 'Қайта уланмоқда'
            : connectionState === 'connecting'
              ? 'Уланмоқда'
              : 'Кутиляпти'
        : isConnected
          ? 'Jonli'
          : connectionState === 'reconnecting'
            ? 'Qayta ulanmoqda'
            : connectionState === 'connecting'
              ? 'Ulanmoqda'
              : 'Kutilyapti';

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${badgeClass}`}>
      <Radio size={12} className={isConnected ? 'animate-pulse' : ''} />
      <span>{label}</span>
    </div>
  );
}

function DeliveryMetricCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string | null;
  tone: DeliveryTone;
}) {
  const styles = TONE_STYLES[tone];

  return (
    <div className={`rounded-[24px] border px-4 py-4 backdrop-blur-sm ${styles.metricSurface} ${styles.metricBorder}`}>
      <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${styles.metricLabel}`}>
        {icon}
        <span>{label}</span>
      </div>
      <p className={`mt-3 text-2xl font-black tracking-tight ${styles.metricValue}`}>{value}</p>
      {hint ? <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-white/55">{hint}</p> : null}
    </div>
  );
}

export function DeliveryMarkerLegend() {
  const { language } = useCustomerLanguage();
  const labels =
    language === 'ru'
      ? {
          courier: 'Курьер',
          courierHint: 'Живая позиция',
          restaurant: 'Ресторан',
          restaurantHint: 'Точка отправки',
          destination: 'Адрес',
          destinationHint: 'Ваша точка',
        }
      : language === 'uz-cyrl'
        ? {
            courier: 'Курьер',
            courierHint: 'Жонли жойлашув',
            restaurant: 'Ресторан',
            restaurantHint: 'Жўнатиш нуқтаси',
            destination: 'Манзил',
            destinationHint: 'Сизнинг нуқта',
          }
        : {
            courier: 'Kuryer',
            courierHint: 'Jonli joylashuv',
            restaurant: 'Restoran',
            restaurantHint: "Jo'natish nuqtasi",
            destination: 'Manzil',
            destinationHint: 'Sizning nuqta',
          };

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{labels.courier}</p>
        </div>
        <p className="mt-2 text-xs font-bold text-slate-700">{labels.courierHint}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{labels.restaurant}</p>
        </div>
        <p className="mt-2 text-xs font-bold text-slate-700">{labels.restaurantHint}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{labels.destination}</p>
        </div>
        <p className="mt-2 text-xs font-bold text-slate-700">{labels.destinationHint}</p>
      </div>
    </div>
  );
}

export function DeliveryHeroCard({
  tone = 'live',
  eyebrow,
  statusLabel,
  title,
  subtitle,
  connectionState,
  isConnected,
  etaValue,
  etaHint,
  distanceValue,
  distanceHint,
  children,
}: {
  tone?: DeliveryTone;
  eyebrow: string;
  statusLabel: string;
  title: string;
  subtitle: string;
  connectionState: ConnectionState;
  isConnected: boolean;
  etaValue?: string | null;
  etaHint?: string | null;
  distanceValue?: string | null;
  distanceHint?: string | null;
  children?: React.ReactNode;
}) {
  const { language } = useCustomerLanguage();
  const styles = TONE_STYLES[tone];
  const etaLabel =
    language === 'ru' ? 'Осталось ETA' : language === 'uz-cyrl' ? 'Қолган ETA' : 'Qolgan ETA';
  const distanceLabel =
    language === 'ru' ? 'Осталось пути' : language === 'uz-cyrl' ? 'Қолган масофа' : 'Qolgan masofa';
  const fallbackValue =
    language === 'ru' ? 'Рассчитывается' : language === 'uz-cyrl' ? 'Ҳисобланмоқда' : 'Hisoblanmoqda';

  return (
    <section className={`relative overflow-hidden rounded-[36px] border p-5 text-white shadow-2xl shadow-slate-200/60 ${styles.shell} ${styles.border}`}>
      <div className={`absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl ${styles.orbPrimary}`} />
      <div className={`absolute -bottom-10 -left-8 h-28 w-28 rounded-full blur-3xl ${styles.orbSecondary}`} />

      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/55">{eyebrow}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${styles.status}`}>
                {statusLabel}
              </span>
              <ConnectionBadge connectionState={connectionState} isConnected={isConnected} />
            </div>
          </div>
        </div>

        <div className="max-w-[320px]">
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">{title}</h2>
          <p className="mt-3 text-sm font-bold leading-relaxed text-slate-200">{subtitle}</p>
        </div>

        {(etaValue || distanceValue) && (
          <div className="grid grid-cols-2 gap-3">
            <DeliveryMetricCard
              icon={<TimerReset size={14} className="text-emerald-300" />}
              label={etaLabel}
              value={etaValue || fallbackValue}
              hint={etaHint}
              tone={tone}
            />
            <DeliveryMetricCard
              icon={<Route size={14} className="text-blue-300" />}
              label={distanceLabel}
              value={distanceValue || fallbackValue}
              hint={distanceHint}
              tone={tone}
            />
          </div>
        )}

        {children}
      </div>
    </section>
  );
}
