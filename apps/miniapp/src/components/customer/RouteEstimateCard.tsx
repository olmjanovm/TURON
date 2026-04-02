import React from 'react';
import { Clock3, Route } from 'lucide-react';
import type { RouteInfo } from '../../features/maps/MapProvider';

const RouteEstimateCard: React.FC<{
  routeInfo: RouteInfo;
  title: string;
  caption: string;
  badgeLabel?: string;
}> = ({ routeInfo, title, caption, badgeLabel = 'Taxmin' }) => (
  <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{caption}</p>
      </div>
      <div className="rounded-2xl bg-amber-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-600">
        {badgeLabel}
      </div>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Route size={14} />
          <span>Masofa</span>
        </div>
        <p className="mt-2 text-lg font-black tracking-tight text-slate-900">{routeInfo.distance}</p>
      </div>

      <div className="rounded-2xl bg-emerald-50 px-4 py-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
          <Clock3 size={14} />
          <span>ETA</span>
        </div>
        <p className="mt-2 text-lg font-black tracking-tight text-emerald-700">{routeInfo.eta}</p>
      </div>
    </div>
  </div>
);

export default RouteEstimateCard;
