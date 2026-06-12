import React from 'react';

type SkeletonTone = 'light' | 'dark' | 'muted';

const TONE_BG: Record<SkeletonTone, string> = {
  light: 'bg-slate-100',
  dark: 'bg-white/10',
  muted: 'bg-slate-200/70',
};

export function Skeleton({
  className = '',
  rounded = 'rounded-[8px]',
  tone = 'light',
}: {
  className?: string;
  rounded?: string;
  tone?: SkeletonTone;
}) {
  return (
    <div
      className={`admin-skel-pulse ${TONE_BG[tone]} ${rounded} ${className}`}
      aria-hidden="true"
    />
  );
}

export function CourierOrderCardSkeleton() {
  return (
    <div className="w-full rounded-[12px] border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-7 w-16" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>
  );
}

export function CourierHistoryCardSkeleton() {
  return (
    <div className="w-full rounded-[12px] border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="space-y-1.5 text-right">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="mt-2 h-8" />
    </div>
  );
}

export function CustomerOrderCardSkeleton() {
  return (
    <div className="rounded-[12px] border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <Skeleton tone="dark" className="h-3 w-20" />
          <Skeleton tone="dark" className="h-5 w-28" />
          <Skeleton tone="dark" className="h-3 w-36" />
        </div>
        <Skeleton tone="dark" className="h-8 w-16" />
      </div>
    </div>
  );
}

export function StatStripSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[12px] border border-slate-200 bg-white p-2.5">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="mt-2 h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
