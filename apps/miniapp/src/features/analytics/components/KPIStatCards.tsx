import React from 'react';
import { ShoppingBag, XCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { KPIMetrics } from '../types';

interface Props {
  metrics: KPIMetrics;
}

export const KPIStatCards: React.FC<Props> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Total Revenue */}
      <div className="col-span-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[28px] p-5 text-white shadow-lg shadow-indigo-200">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="bg-white/10 px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-widest text-white/90">
            Daromad
          </span>
        </div>
        <div>
          <p className="text-3xl font-black leading-none">{metrics.totalRevenue.toLocaleString()}</p>
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-2">{metrics.totalOrders} Jami buyurtmalar</p>
        </div>
      </div>

      {/* Active Orders */}
      <div className="bg-white rounded-[24px] p-4 border border-blue-100 shadow-sm flex flex-col justify-between h-28">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
            <ShoppingBag size={16} />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faol</span>
        </div>
        <p className="text-2xl font-black text-slate-800">{metrics.activeOrders}</p>
      </div>

      {/* Delivered Orders */}
      <div className="bg-white rounded-[24px] p-4 border border-emerald-100 shadow-sm flex flex-col justify-between h-28">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <CheckCircle size={16} />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yetkazilgan</span>
        </div>
        <p className="text-2xl font-black text-slate-800">{metrics.deliveredOrders}</p>
      </div>

      {/* Cancelled */}
      <div className="bg-white rounded-[24px] p-4 border border-rose-100 shadow-sm flex flex-col justify-between h-28">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
            <XCircle size={16} />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bekor</span>
        </div>
        <p className="text-2xl font-black text-slate-800">{metrics.cancelledOrders}</p>
      </div>

       {/* Average Order Value */}
       <div className="bg-white rounded-[24px] p-4 border border-amber-100 shadow-sm flex flex-col justify-between h-28">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
             <span className="font-black text-sm">~</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">O'rtacha sum</span>
        </div>
        <p className="text-[17px] font-black text-slate-800 truncate">{metrics.averageOrderValue.toLocaleString()}</p>
      </div>
    </div>
  );
};
