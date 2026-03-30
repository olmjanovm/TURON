import React from 'react';
import { Activity, CircleDashed, Tag, CheckCircle2, ShoppingCart } from 'lucide-react';
import { RecentActivityEvent } from '../types';

interface Props {
  activities: RecentActivityEvent[];
}

export const RecentActivityCard: React.FC<Props> = ({ activities }) => {
  if (activities.length === 0) return null;

  const getIcon = (type: RecentActivityEvent['type']) => {
    switch (type) {
      case 'ORDER_CREATED': return <ShoppingCart size={14} className="text-blue-500" />;
      case 'PAYMENT_VERIFIED': return <CircleDashed size={14} className="text-amber-500" />;
      case 'ORDER_DELIVERED': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'PROMO_USED': return <Tag size={14} className="text-indigo-500" />;
      default: return null;
    }
  };

  const getBg = (type: RecentActivityEvent['type']) => {
    switch (type) {
      case 'ORDER_CREATED': return 'bg-blue-100';
      case 'PAYMENT_VERIFIED': return 'bg-amber-100';
      case 'ORDER_DELIVERED': return 'bg-emerald-100';
      case 'PROMO_USED': return 'bg-indigo-100';
      default: return 'bg-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center">
          <Activity size={20} />
        </div>
        <div>
          <h3 className="font-black text-slate-800 tracking-tight">So'nggi harakatlar</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
            Real vaqtdagi hodisalar
          </p>
        </div>
      </div>

      <div className="relative border-l-2 border-slate-100 ml-4 space-y-5">
        {activities.map((activity) => {
          const time = new Date(activity.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
          
          return (
            <div key={activity.id} className="relative pl-6">
              <span className={`absolute -left-[13px] top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center ${getBg(activity.type)}`}>
                {getIcon(activity.type)}
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-black text-slate-800">{activity.title}</span>
                  <span className="text-[11px] font-bold text-slate-400 border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded-md">
                    {time}
                  </span>
                </div>
                <span className="text-[12px] font-bold text-slate-500 mt-0.5">{activity.description}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
