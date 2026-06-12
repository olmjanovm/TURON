/**
 * FAZA I — Universal loading skeleton.
 *
 * QOIDA: oq/neytral fon. Hech qanday rang (qizil/sariq/qora) yo'q.
 * Toza, professional, tier-aware (lite'da shimmer o'chadi).
 */

export function Skeleton({
  className = '',
  rounded = 'rounded-lg',
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={`tier-decor skeleton-shimmer ${rounded} ${className}`}
      aria-hidden="true"
    />
  );
}

/** Bir nechta qatorli matn skeleti. */
export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          rounded="rounded-md"
          // oxirgi qator qisqaroq
        />
      ))}
    </div>
  );
}

/** Statistika katakchasi skeleti (oq karta). */
export function SkeletonStatTile() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <Skeleton className="h-3 w-20" rounded="rounded-md" />
      <Skeleton className="mt-3 h-7 w-16" rounded="rounded-md" />
    </div>
  );
}

/** Ro'yxat qatori skeleti (oq karta). */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <Skeleton className="h-10 w-10" rounded="rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-3.5 w-1/2" rounded="rounded-md" />
        <Skeleton className="mt-2 h-3 w-1/3" rounded="rounded-md" />
      </div>
      <Skeleton className="h-6 w-14" rounded="rounded-full" />
    </div>
  );
}
