import React from 'react';
import { Tag, CheckCircle, Clock } from 'lucide-react';
import { usePromoStore } from '../../../store/usePromoStore';
import { getPromoStatus } from '../discountEngine';
import { PromoStatusEnum } from '../types';

export const PromoSummaryCards: React.FC = () => {
  const { promos } = usePromoStore();

  const total = promos.length;
  const activeCount = promos.filter(p => getPromoStatus(p) === PromoStatusEnum.ACTIVE).length;
  const expiredCount = promos.filter(p => getPromoStatus(p) === PromoStatusEnum.EXPIRED).length;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Total Promos */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[28px] p-5 text-white shadow-lg shadow-indigo-200">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
          <Tag size={24} className="text-white" />
        </div>
        <div>
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Jami</p>
          <p className="text-3xl font-black leading-none">{total}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-4">
        <div className="bg-white rounded-[24px] p-4 border border-emerald-100 flex items-center justify-between shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
            <CheckCircle size={20} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faol</p>
            <p className="text-xl font-black text-slate-800 leading-none mt-0.5">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-4 border border-rose-100 flex items-center justify-between shadow-sm">
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tugagan</p>
            <p className="text-xl font-black text-slate-800 leading-none mt-0.5">{expiredCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
