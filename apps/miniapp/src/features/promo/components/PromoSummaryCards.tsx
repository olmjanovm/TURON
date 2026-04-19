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
      <article className="rounded-[14px] border border-[#E5E7EB] bg-[#FFFFFF] p-3 shadow-[0_6px_16px_rgba(17,24,39,0.06)] transition-transform hover:-translate-y-0.5">
        <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]">
          <Tag size={16} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6B7280]">Jami</p>
        <p className="mt-1 text-2xl font-black leading-none text-[#111827]">{total}</p>
      </article>

      <article className="rounded-[14px] border border-emerald-200 bg-[#FFFFFF] p-3 shadow-[0_6px_16px_rgba(22,163,74,0.08)] transition-transform hover:-translate-y-0.5">
        <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A]">
          <CheckCircle size={16} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6B7280]">Faol</p>
        <p className="mt-1 text-2xl font-black leading-none text-[#111827]">{activeCount}</p>
      </article>

      <article className="rounded-[14px] border border-rose-200 bg-[#FFFFFF] p-3 shadow-[0_6px_16px_rgba(220,38,38,0.08)] transition-transform hover:-translate-y-0.5">
        <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-[#DC2626]">
          <Clock size={16} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6B7280]">Tugagan</p>
        <p className="mt-1 text-2xl font-black leading-none text-[#111827]">{expiredCount}</p>
      </article>
    </div>
  );
};
