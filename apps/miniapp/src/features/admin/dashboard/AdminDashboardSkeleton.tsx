import React from 'react';

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-3 pb-[calc(env(safe-area-inset-bottom,0px)+112px)]">
      <div className="adminx-zone-alert adminx-home-alert animate-pulse">
        <div className="h-10 w-10 rounded-[14px] bg-[rgba(214,69,69,0.18)]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-16 rounded-full bg-black/8" />
          <div className="h-4 w-44 rounded-full bg-black/10" />
        </div>
        <div className="h-4 w-4 rounded-full bg-black/8" />
      </div>

      <div className="adminx-zone-hero adminx-panel adminx-home-hero animate-pulse p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3 w-20 rounded-full bg-white/10" />
            <div className="h-8 w-32 rounded-full bg-white/12" />
          </div>
          <div className="h-8 w-20 rounded-full bg-white/10" />
        </div>
        <div className="adminx-home-hero-grid mt-4">
          <div className="adminx-home-pending-card border-0 bg-white/90">
            <div className="h-7 w-24 rounded-full bg-black/7" />
            <div className="mt-6 h-12 w-24 rounded-[20px] bg-black/8" />
            <div className="mt-3 h-4 w-28 rounded-full bg-black/7" />
            <div className="mt-4 h-10 w-28 rounded-[16px] bg-black/6" />
          </div>
          <div className="adminx-home-kpi-stack">
            <div className="adminx-home-kpi-card border-0 bg-black/10">
              <div className="h-7 w-24 rounded-full bg-black/10" />
              <div className="mt-4 h-3 w-20 rounded-full bg-black/10" />
              <div className="mt-2 h-8 w-24 rounded-full bg-black/12" />
            </div>
            <div className="adminx-home-kpi-card border-0 bg-white/10">
              <div className="h-7 w-24 rounded-full bg-white/10" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="h-14 rounded-[14px] bg-white/10" />
                <div className="h-14 rounded-[14px] bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="adminx-home-stat-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="adminx-home-stat-card animate-pulse border border-[rgba(28,18,7,0.06)] bg-white/90"
          />
        ))}
      </div>

      <div className="adminx-home-actions-grid">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="adminx-home-action animate-pulse bg-white/90" />
        ))}
      </div>

      <div className="adminx-feed-shell adminx-home-feed-shell animate-pulse overflow-hidden p-4">
        <div className="h-5 w-32 rounded-full bg-black/8" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
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
    </div>
  );
}
