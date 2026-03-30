import React from 'react';
import { PieChart } from 'lucide-react';
import { OrderStatusBreakdown } from '../types';

interface Props {
  breakdown: OrderStatusBreakdown[];
  totalOrders: number;
}

export const StatusBreakdownCard: React.FC<Props> = ({ breakdown, totalOrders }) => {
  if (breakdown.length === 0) return null;

  return (
    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center">
          <PieChart size={20} />
        </div>
        <div>
          <h3 className="font-black text-slate-800 tracking-tight">Status tahlili</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
            Buyurtmalar holati
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {breakdown.map((item) => {
          const percentage = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0;
          
          return (
            <div key={item.status} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.colorClass}`} />
                <span className="text-[13px] font-bold text-slate-600">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-black text-slate-800">{item.count}</span>
                <span className="text-[11px] font-bold text-slate-400 w-8 text-right">{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar Visual */}
      <div className="w-full h-3 bg-slate-100 rounded-full mt-4 flex overflow-hidden">
        {breakdown.map(item => (
          <div 
            key={item.status}
            className={`h-full ${item.colorClass}`} 
            style={{ width: `${totalOrders > 0 ? (item.count / totalOrders) * 100 : 0}%` }}
          />
        ))}
      </div>
    </div>
  );
};
