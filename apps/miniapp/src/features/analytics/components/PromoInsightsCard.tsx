import React from 'react';
import { Tag, TrendingDown } from 'lucide-react';
import { PromoInsightMetric } from '../types';

interface Props {
  insights: PromoInsightMetric[];
}

export const PromoInsightsCard: React.FC<Props> = ({ insights }) => {
  if (insights.length === 0) return null;

  return (
    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
          <Tag size={20} />
        </div>
        <div>
          <h3 className="font-black text-slate-800 tracking-tight">Promokodlar tahlili</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
            Chegirmalar faolligi
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((promo) => (
          <div key={promo.promoCode} className="flex items-center justify-between p-3 rounded-2xl border border-slate-50 bg-slate-50/50">
            <div className="flex flex-col">
              <span className="text-[13px] font-black text-slate-800 tracking-widest uppercase">{promo.promoCode}</span>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5">{promo.title || 'Chegirma kodi'}</span>
            </div>
            
            <div className="flex gap-4 text-right">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Soni</span>
                <span className="text-sm font-black text-slate-700">{promo.usageCount}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Chegirma</span>
                <span className="text-sm font-black text-rose-600 flex items-center gap-1">
                  <TrendingDown size={12} />
                  {promo.totalDiscountGenerated.toLocaleString()} so'm
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
