import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function CourierHistoryPage() {
   const navigate = useNavigate();
   
   const history = [
      { id: 390, customer: 'Dilshod', address: 'Qatortol', total: 55000, time: 'Bugun, 14:30' },
      { id: 385, customer: 'Zarina', address: 'Samarqand Darvoza', total: 72000, time: 'Bugun, 12:15' }
   ];

   return (
      <div className="space-y-6 pt-2 pb-24 animate-in fade-in duration-300">
         <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-800 shadow-sm border border-gray-100 active:scale-90 transition-all">
               <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Eski Yetkazmalar</h2>
         </div>

         <div className="space-y-3">
             {history.map(o => (
                <div key={o.id} className="turon-card !p-4 bg-white shadow-sm border-0 flex items-center gap-3 opacity-80">
                   <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 flex-shrink-0">
                      <CheckCircle2 size={20} />
                   </div>
                   <div className="flex-grow">
                      <h4 className="font-bold text-sm text-gray-800">#{o.id} • {o.customer}</h4>
                      <p className="text-[11px] font-medium text-gray-500">{o.address}</p>
                   </div>
                   <div className="text-right flex-shrink-0">
                      <p className="font-black text-gray-800 text-sm">{o.total.toLocaleString()} s</p>
                      <p className="text-[10px] text-gray-400 font-bold">{o.time}</p>
                   </div>
                </div>
             ))}
         </div>
      </div>
   );
}
