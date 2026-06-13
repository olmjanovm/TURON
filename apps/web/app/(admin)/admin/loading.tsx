import { SkeletonStatTile, SkeletonRow } from '@/components/ui/skeleton';

/**
 * Admin guruh darajasidagi OQ loading skeleton.
 * Har qanday admin sahifaga o'tilganda (menu/couriers/promos h.k.) ko'rinadi.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <div className="h-28 w-full animate-pulse rounded-3xl bg-slate-200" />
      <div className="grid grid-cols-3 gap-3">
        <SkeletonStatTile />
        <SkeletonStatTile />
        <SkeletonStatTile />
      </div>
      <div className="space-y-2">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}
