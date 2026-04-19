import { useCourierStore } from '../../store/courierStore';

export function BottomPanel() {
  const { distanceLeft, timeLeft } = useCourierStore();

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 pb-5">
      <div className="rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Qolgan masofa" value={distanceLeft !== null ? `${Math.round(distanceLeft)} m` : '-'} />
          <InfoItem label="Taxminiy vaqt" value={timeLeft !== null ? `${Math.round(timeLeft / 60)} daq` : '-'} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2">
      <p className="text-[10px] font-medium text-slate-300">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
