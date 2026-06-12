import React from 'react';

/**
 * Admin dashboard loading skeleton — OQ/NEYTRAL.
 * Avvalgi rang-barang (pushti alert + qora hero) versiya olib tashlandi:
 * endi barcha bloklar oq kartada slate-200 pulse bilan ko'rinadi.
 */
function Pulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-slate-200 ${className}`} />;
}

function Card({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-3 pb-[calc(env(safe-area-inset-bottom,0px)+112px)]">
      {/* Alert qatori */}
      <Card className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-[14px] bg-slate-200" />
        <div className="flex-1 space-y-2">
          <Pulse className="h-3 w-16" />
          <Pulse className="h-4 w-44" />
        </div>
        <div className="h-4 w-4 animate-pulse rounded-full bg-slate-200" />
      </Card>

      {/* Hero / daromad bloki */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Pulse className="h-3 w-20" />
            <Pulse className="h-8 w-32" />
          </div>
          <Pulse className="h-8 w-20" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[16px] border border-slate-100 bg-slate-50 p-3">
              <Pulse className="h-3 w-12" />
              <Pulse className="mt-3 h-6 w-10" />
            </div>
          ))}
        </div>
      </Card>

      {/* Statistika gridi */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <Pulse className="h-3 w-16" />
            <Pulse className="mt-3 h-7 w-12" />
          </Card>
        ))}
      </div>

      {/* Tezkor harakatlar */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-20" />
        ))}
      </div>

      {/* So'nggi buyurtmalar */}
      <Card>
        <Pulse className="h-5 w-32" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-[16px] bg-slate-200" />
              <div className="flex-1 space-y-2">
                <Pulse className="h-4 w-32" />
                <Pulse className="h-3 w-24" />
              </div>
              <Pulse className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
