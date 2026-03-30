import React from 'react';
import { Bike, CheckCircle2, PackageSearch } from 'lucide-react';
import { CourierPerformanceMetric } from '../types';

interface Props {
  performance: CourierPerformanceMetric[];
}

export const CourierPerformanceCard: React.FC<Props> = ({ performance }) => {
  if (performance.length === 0) return null;

  return (
    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-teal-50 text-teal-500 rounded-xl flex items-center justify-center">
          <Bike size={20} />
        </div>
        <div>
          <h3 className="font-black text-slate-800 tracking-tight">Kuryerlar faolligi</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
            Yetkazib berish tahlili
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {performance.map(courier => (
          <div key={courier.courierId} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold uppercase text-[10px]">
                {courier.courierName.substring(0, 2)}
              </div>
              <span className="text-[13px] font-black text-slate-800">{courier.courierName}</span>
            </div>
            
            <div className="flex gap-4">
               <div className="flex flex-col items-center">
                 <span className="text-[10px] font-bold text-slate-400">Jarayonda</span>
                 <span className="text-[13px] font-black text-amber-500 flex items-center gap-1">
                   <PackageSearch size={12}/>{courier.activeDeliveries}
                 </span>
               </div>
               <div className="flex flex-col items-center">
                 <span className="text-[10px] font-bold text-slate-400">Tugatilgan</span>
                 <span className="text-[13px] font-black text-teal-600 flex items-center gap-1">
                   <CheckCircle2 size={12}/>{courier.deliveredOrders}
                 </span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
