import React from 'react';
import { Tag, CheckCircle, Clock } from 'lucide-react';
import { getPromoStatus } from '../discountEngine';
import { AdminPromo, PromoStatusEnum } from '../types';

type PromoSummaryFilter = 'all' | 'active' | 'expired';

export const PromoSummaryCards: React.FC<{
  promos: AdminPromo[];
  selectedFilter: PromoSummaryFilter;
  onSelectFilter: (filter: PromoSummaryFilter) => void;
}> = ({ promos, selectedFilter, onSelectFilter }) => {
  const total = promos.length;
  const activeCount = promos.filter(p => getPromoStatus(p) === PromoStatusEnum.ACTIVE).length;
  const expiredCount = promos.filter(p => getPromoStatus(p) === PromoStatusEnum.EXPIRED).length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        type="button"
        onClick={() => onSelectFilter('all')}
        className={`rounded-[14px] border bg-[#FFFFFF] p-3 text-left shadow-[0_6px_16px_rgba(17,24,39,0.06)] transition-all duration-200 active:scale-[0.96] ${
          selectedFilter === 'all'
            ? 'border-[rgba(255,190,11,0.22)] ring-2 ring-[rgba(255,212,59,0.18)] shadow-[0_12px_24px_rgba(255,190,11,0.18)]'
            : 'border-[#E5E7EB]'
        }`}
      >
        <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(255,212,59,0.18)] text-[#7a5600]">
          <Tag size={16} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6B7280]">Jami</p>
        <p className="mt-1 text-2xl font-black leading-none text-[#111827]">{total}</p>
      </button>

      <button
        type="button"
        onClick={() => onSelectFilter('active')}
        className={`rounded-[14px] border bg-[#FFFFFF] p-3 text-left shadow-[0_6px_16px_rgba(22,163,74,0.08)] transition-all duration-200 active:scale-[0.96] ${
          selectedFilter === 'active'
            ? 'border-emerald-300 ring-2 ring-emerald-100 shadow-[0_12px_24px_rgba(16,185,129,0.22)]'
            : 'border-emerald-200'
        }`}
      >
        <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A]">
          <CheckCircle size={16} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6B7280]">Faol</p>
        <p className="mt-1 text-2xl font-black leading-none text-[#111827]">{activeCount}</p>
      </button>

      <button
        type="button"
        onClick={() => onSelectFilter('expired')}
        className={`rounded-[14px] border bg-[#FFFFFF] p-3 text-left shadow-[0_6px_16px_rgba(220,38,38,0.08)] transition-all duration-200 active:scale-[0.96] ${
          selectedFilter === 'expired'
            ? 'border-rose-300 ring-2 ring-rose-100 shadow-[0_12px_24px_rgba(244,63,94,0.22)]'
            : 'border-rose-200'
        }`}
      >
        <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-[#DC2626]">
          <Clock size={16} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6B7280]">Tugagan</p>
        <p className="mt-1 text-2xl font-black leading-none text-[#111827]">{expiredCount}</p>
      </button>
    </div>
  );
};
