import React from 'react';

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-4 pb-[calc(env(safe-area-inset-bottom,0px)+112px)]">
      <div className="adminx-zone-hero adminx-panel min-h-[248px] animate-pulse p-6">
        <div className="h-4 w-28 rounded-full bg-white/10" />
        <div className="mt-5 grid gap-4 md:grid-cols-[1.25fr_1fr]">
          <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
            <div className="h-5 w-36 rounded-full bg-white/12" />
            <div className="mt-5 h-16 w-24 rounded-[20px] bg-white/12" />
            <div className="mt-4 h-4 w-32 rounded-full bg-white/10" />
          </div>
          <div className="rounded-[24px] border border-black/10 bg-black/10 p-5">
            <div className="h-4 w-24 rounded-full bg-black/10" />
            <div className="mt-6 h-12 w-40 rounded-[20px] bg-black/12" />
            <div className="mt-4 h-4 w-20 rounded-full bg-black/10" />
          </div>
        </div>
      </div>

      <div className="adminx-stat-rail">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="adminx-stat-pill animate-pulse border border-[rgba(28,18,7,0.06)] bg-white/90"
          />
        ))}
      </div>

      <div className="adminx-feed-shell animate-pulse overflow-hidden p-5">
        <div className="h-5 w-32 rounded-full bg-black/8" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-[16px] bg-black/6" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded-full bg-black/7" />
                <div className="h-3 w-24 rounded-full bg-black/5" />
              </div>
              <div className="h-4 w-20 rounded-full bg-black/7" />
            </div>
          ))}
        </div>
      </div>

      <div className="adminx-action-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="adminx-action-tile animate-pulse bg-white/90" />
        ))}
      </div>
    </div>
  );
}
