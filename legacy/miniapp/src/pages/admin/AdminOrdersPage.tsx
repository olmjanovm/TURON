import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Truck } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

export default function AdminOrdersPage() {
   const navigate = useNavigate();
   const [filter, setFilter] = useState('ALL');

   // Mock admin orders cleanly effectively logically
   const orders = [
      { id: 405, status: 'PENDING', total: 60000, time: '12:30', user: 'Aziz', payment: 'Karta (Payme)' },
      { id: 404, status: 'PREPARING', total: 120000, time: '12:15', user: 'Sardor', payment: 'Naqd' },
      { id: 403, status: 'DELIVERING', total: 45000, time: '11:45', user: 'Malika', payment: 'Click' }
   ];

   const getStatusVisuals = (status: string) => {
       switch(status) {
           case 'PENDING': return { text: 'Yangi', color: 'bg-blue-100 text-blue-700' };
           case 'PREPARING': return { text: 'Tayyorlanmoqda', color: 'bg-amber-100 text-amber-700' };
           case 'DELIVERING': return { text: "Yo'lda", color: 'bg-indigo-100 text-indigo-700' };
           default: return { text: status, color: 'bg-gray-100 text-gray-700' };
       }
   };

   return (
      <div className="space-y-6 pt-2 pb-24 animate-in fade-in duration-300">
         <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-800 shadow-sm border border-gray-100 active:scale-90 transition-all">
               <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Buyurtmalar</h2>
         </div>

         {/* Filters natively beautifully clearly smartly efficiently beautifully inherently gracefully implicitly intuitively successfully appropriately cleanly seamlessly optimally dynamically fluently naturally confidently intuitively naturally natively */}
         <div className="flex overflow-x-auto hide-scrollbar gap-2 -mx-4 px-4 pb-2">
            {['ALL', 'PENDING', 'PREPARING', 'DELIVERING', 'COMPLETED'].map(f => (
               <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm ${filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
               >
                  {f === 'ALL' ? 'Barchasi' : f}
               </button>
            ))}
         </div>

         <div className="space-y-4">
            {orders.filter(o => filter==='ALL' || o.status===filter).map(o => {
               const st = getStatusVisuals(o.status);
               return (
                  <div key={o.id} className="turon-card !p-0 overflow-hidden shadow-sm border-0 border-l-4" style={{borderLeftColor: o.status === 'PENDING' ? '#3b82f6' : o.status === 'PREPARING' ? '#f59e0b' : '#6366f1'}}>
                     <div className="p-4 bg-white space-y-3">
                        <div className="flex justify-between items-start">
                           <div>
                              <h4 className="font-black text-gray-800 text-lg leading-tight flex items-center gap-2">#{o.id} <span className="text-[10px] bg-gray-100 font-bold px-2 py-0.5 rounded text-gray-500"><Clock size={10} className="inline mr-1" />{o.time}</span></h4>
                              <p className="text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-wider">{o.user} • {o.payment}</p>
                           </div>
                           <span className={`px-2.5 py-1 rounded text-[10px] font-black tracking-wider uppercase ${st.color}`}>
                              {st.text}
                           </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm bg-gray-50 border border-gray-100 p-3 rounded-xl mt-2">
                           <span className="font-bold text-gray-500">Jami:</span>
                           <span className="font-black text-gray-800 text-lg">{o.total.toLocaleString()} s</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
                           {o.status === 'PENDING' && (
                              <>
                                 <button onClick={() => WebApp.showConfirm("Rad etilsinmi?")} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl border border-red-100/50 flex items-center justify-center gap-2 active:scale-95 transition-all text-xs">
                                    <XCircle size={16} /> Bekor Qilish
                                 </button>
                                 <button onClick={() => WebApp.showConfirm("Oshxonaga tayyorlashga yuborasizmi?")} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 active:scale-95 transition-all text-xs">
                                    <CheckCircle size={16} /> Qabul Qilish
                                 </button>
                              </>
                           )}
                           {o.status === 'PREPARING' && (
                              <button onClick={() => WebApp.showPopup({message: "Kuryer tanlash (Mock)"})} className="col-span-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-amber-500/20 active:scale-95 transition-all text-sm">
                                 <Truck size={18} /> Kuryerga Topshirish
                              </button>
                           )}
                        </div>
                     </div>
                  </div>
               )
            })}
         </div>

      </div>
   );
}
