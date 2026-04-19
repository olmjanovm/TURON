import React from 'react';
import { PromoStatusEnum } from '../types';

export const PromoStatusBadge: React.FC<{ status: PromoStatusEnum }> = ({ status }) => {
  switch (status) {
    case PromoStatusEnum.ACTIVE:
      return <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#16A34A]">Faol</span>;
    case PromoStatusEnum.INACTIVE:
      return <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">Nofaol</span>;
    case PromoStatusEnum.EXPIRED:
      return <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#DC2626]">Tugagan</span>;
    case PromoStatusEnum.SCHEDULED:
      return <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">Kutilmoqda</span>;
    case PromoStatusEnum.LIMIT_REACHED:
      return <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">Limit tugagan</span>;
    default:
      return null;
  }
};
