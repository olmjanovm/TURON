import React from 'react';
import { PromoStatusEnum } from '../types';

export const PromoStatusBadge: React.FC<{ status: PromoStatusEnum }> = ({ status }) => {
  switch (status) {
    case PromoStatusEnum.ACTIVE:
      return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200">Faol</span>;
    case PromoStatusEnum.INACTIVE:
      return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200">Nofaol</span>;
    case PromoStatusEnum.EXPIRED:
      return <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest border border-red-200">Muddati tugagan</span>;
    case PromoStatusEnum.SCHEDULED:
      return <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-200">Kutilmoqda</span>;
    case PromoStatusEnum.LIMIT_REACHED:
      return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-200">Limit tugagan</span>;
    default:
      return null;
  }
};
