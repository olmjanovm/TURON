import { SkeletonStatTile, SkeletonRow } from '@/components/ui/skeleton';

/** Marshrut darajasidagi oq skeleton (navigatsiya paytida darhol ko'rinadi). */
export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <SkeletonStatTile />
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
