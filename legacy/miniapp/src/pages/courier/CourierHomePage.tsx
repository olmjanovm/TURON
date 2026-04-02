import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle2, History } from 'lucide-react';

export default function CourierHomePage() {
   const navigate = useNavigate();
   
   const activeOrders = [
      { id: 403, customer: 'Azizbek', address: 'Chilonzor 9-kv, 12-dom, 45-x', coords: [41.3111, 69.2401], total: 45000, paymentMethod: 'Naqd', isPaid: false, status: 'PREPARING' },
      { id: 404, customer: 'Sardor', address: 'Shayxontohur, Qoratosh 12', coords: [41.3200, 69.2550], total: 120000, paymentMethod: 'Karta', isPaid: true, status: 'DELIVERING' }
   ];

   return (
      <div className="space-y-6 pt-4 pb-24 animate-in fade-in duration-300">
         <div className="flex items-center justify-between">
            <div>
               <h2 className="text-2xl font-black text-gray-800 tracking-tight">Kuryer Paneli</h2>
               <p className="text-sm font-bold text-gray-400 mt-1">Aktiv buyurtmalar: {activeOrders.length}</p>
            </div>
            <button onClick={() => navigate('/courier/history')} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 active:scale-95 transition-all outline-none">
               <History size={20} />
            </button>
         </div>

         <div className="grid grid-cols-2 gap-3">
             <div className="turon-card !bg-amber-500 text-white !border-0 p-4 shadow-xl shadow-amber-500/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100 mb-1">Oshxonada</p>
                <h3 className="text-3xl font-black leading-none">{activeOrders.filter(o => o.status === 'PREPARING').length}</h3>
             </div>
             <div className="turon-card !bg-emerald-500 text-white !border-0 p-4 shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                <CheckCircle2 size={50} className="absolute -bottom-2 -right-2 text-white/20" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 mb-1">Yetkazildi</p>
                <h3 className="text-3xl font-black leading-none">12</h3>
             </div>
         </div>

         <div className="space-y-4 pt-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
               Yetkazish jarayonida
            </h3>
            
            {activeOrders.map(o => (
               <div key={o.id} onClick={() => navigate(`/courier/order/${o.id}`)} className="turon-card !p-0 overflow-hidden shadow-sm active:scale-[0.98] transition-all cursor-pointer border-0">
                   <div className="p-4 bg-white border-l-4" style={{borderLeftColor: o.status === 'PREPARING' ? '#f59e0b' : '#3b82f6'}}>
                      <div className="flex justify-between items-start mb-3">
                         <div>
                            <h4 className="font-black text-xl text-gray-800 leading-none">#{o.id}</h4>
                            <p className="font-bold text-xs text-gray-500 mt-1.5">{o.customer}</p>
                         </div>
                         <div className="text-right">
                            <p className="font-black text-gray-800">{o.total.toLocaleString()} s</p>
                            <p className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-1 inline-block tracking-wider ${o.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                               {o.paymentMethod}
                            </p>
                         </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-3 mt-1">
                         <div className="p-1.5 bg-white rounded-lg shadow-sm">
                           <MapPin className={o.status === 'PREPARING' ? 'text-amber-500' : 'text-blue-500'} size={18} />
                         </div>
                         <div className="flex-grow">
                            <p className="font-bold text-sm text-gray-800 line-clamp-2 leading-snug tracking-tight">{o.address}</p>
                         </div>
                         <div className="text-gray-400 mt-1">❯</div>
                      </div>
                   </div>
               </div>
            ))}
         </div>
      </div>
   );
}
