import React from 'react';
import { Tag, CheckCircle, Clock } from 'lucide-react';
import { getPromoStatus } from '../discountEngine';
import { AdminPromo, PromoStatusEnum } from '../types';

export const PromoSummaryCards: React.FC<{ promos: AdminPromo[] }> = ({ promos }) => {
  const total = promos.length;
  const activeCount = promos.filter(p => getPromoStatus(p) === PromoStatusEnum.ACTIVE).length;
  const expiredCount = promos.filter(p => getPromoStatus(p) === PromoStatusEnum.EXPIRED).length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <article className="group rounded-[20px] border border-indigo-200 bg-gradient-to-br from-indigo-500 to-violet-600 p-4 text-white shadow-[0_14px_28px_rgba(79,70,229,0.26)] transition-transform hover:-translate-y-0.5">
        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
          <Tag size={18} className="text-white" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/80">Jami</p>
        <p className="mt-1 text-3xl font-black leading-none">{total}</p>
      </article>

      <article className="rounded-[20px] border border-emerald-200 bg-white p-4 shadow-[0_10px_22px_rgba(16,185,129,0.10)] transition-transform hover:-translate-y-0.5">
        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <CheckCircle size={18} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Faol</p>
        <p className="mt-1 text-3xl font-black leading-none text-slate-900">{activeCount}</p>
      </article>

      <article className="rounded-[20px] border border-rose-200 bg-white p-4 shadow-[0_10px_22px_rgba(244,63,94,0.08)] transition-transform hover:-translate-y-0.5">
        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <Clock size={18} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Tugagan</p>
        <p className="mt-1 text-3xl font-black leading-none text-slate-900">{expiredCount}</p>
      </article>
    </div>
  );
};
