import React from 'react';
import { Trophy, ArrowUp } from 'lucide-react';
import { TopProductMetric } from '../types';

interface Props {
  products: TopProductMetric[];
}

export const TopProductsCard: React.FC<Props> = ({ products }) => {
  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
          <Trophy size={20} />
        </div>
        <div>
          <h3 className="font-black text-slate-800 tracking-tight">Top Taomlar</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
            Eng ko'p sotilgan
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {products.map((item, index) => (
          <div key={item.productId} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <span className={`w-6 text-center text-[11px] font-black uppercase tracking-widest ${
                index < 3 ? 'text-amber-500' : 'text-slate-400'
              }`}>
                #{index + 1}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-700">{item.name}</span>
                <span className="text-[11px] font-bold text-emerald-500 mt-0.5">
                  +{item.revenueGenerated.toLocaleString()} so'm
                </span>
              </div>
            </div>
            
            <div className="bg-slate-50 w-12 h-10 rounded-xl flex items-center justify-center text-slate-700 font-black">
              {item.quantitySold}<span className="text-[10px] text-slate-400 ml-0.5 mt-0.5">x</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
