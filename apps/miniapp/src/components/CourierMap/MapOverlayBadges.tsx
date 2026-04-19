import { useCourierStore } from '../../store/courierStore';

function formatDistanceMeters(value: number | null) {
  if (value === null || Number.isNaN(value)) return "Masofa yo'q";
  if (value >= 1000) return `${(value / 1000).toFixed(1)} km`;
  return `${Math.round(value)} m`;
}

function formatTimeSeconds(value: number | null) {
  if (value === null || Number.isNaN(value)) return "Vaqt yo'q";
  const minutes = Math.max(1, Math.round(value / 60));
  return `${minutes} daqiqa`;
}

export function MapOverlayBadges() {
  const { distanceLeft, timeLeft } = useCourierStore();

  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-30 flex items-center justify-between gap-2">
      <div className="rounded-xl border border-white/20 bg-slate-950/65 px-3 py-2 backdrop-blur-md">
        <p className="text-[10px] font-semibold tracking-wide text-slate-300">Masofa</p>
        <p className="mt-0.5 text-sm font-bold text-white">{formatDistanceMeters(distanceLeft)}</p>
      </div>
      <div className="rounded-xl border border-white/20 bg-slate-950/65 px-3 py-2 backdrop-blur-md">
        <p className="text-[10px] font-semibold tracking-wide text-slate-300">Vaqt</p>
        <p className="mt-0.5 text-sm font-bold text-white">{formatTimeSeconds(timeLeft)}</p>
      </div>
    </div>
  );
}
