import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, ExternalLink, CheckCircle } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

export default function CourierOrderDetailPage() {
   const { id } = useParams();
   const navigate = useNavigate();

   const order = { 
      id: id, customer: 'Sardor', phone: '+998901234567', 
      address: 'Chilonzor 9-kv, 12-dom, 45-x', coords: '41.3111,69.2401', 
      total: 45000, paymentMethod: 'Naqd', isPaid: false, status: 'DELIVERING',
      items: [
         { name: 'Palov To\'yoshi', qty: 1, price: 35000 },
         { name: 'Pepsi 1L', qty: 1, price: 10000 }
      ]
   };

   const openMap = () => {
      window.open(`https://yandex.com/maps/?pt=${order.coords.split(',')[1]},${order.coords.split(',')[0]}&z=17&l=map`);
   };

   const finishOrder = () => {
      if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showConfirm("Buyurtma haqiqatdan hamb yetkazib berildimi?", (ok: boolean) => {
             if (ok) {
                if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                navigate('/courier');
             }
          });
      } else {
          alert('Yetkazildi');
          navigate('/courier');
      }
   };

   return (
      <div className="space-y-6 pt-2 pb-32 animate-in slide-in-from-right-4 duration-300">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-800 shadow-sm border border-gray-100 active:scale-90 transition-all">
                  <ArrowLeft size={20} />
               </button>
               <div>
                  <h2 className="text-xl font-black text-gray-800 tracking-tight">Buyurtma #{order.id}</h2>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 inline-block px-1.5 rounded ${order.status === 'DELIVERING' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                     {order.status}
                  </p>
               </div>
            </div>
         </div>

         <div className="turon-card !p-0 shadow-sm border-0 border-l-4 border-l-gray-900 overflow-hidden">
            <div className="p-4 space-y-4">
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Mijoz</p>
                  <h3 className="text-xl font-black text-gray-800">{order.customer}</h3>
                  <a href={`tel:${order.phone}`} className="flex items-center gap-2 mt-2 w-max bg-gray-50 px-3 py-2 rounded-xl text-sm font-bold text-gray-800 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all">
                     <Phone size={14} className="text-emerald-500" /> Qong'iroq Qilish
                  </a>
               </div>
               
               <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Manzil</p>
                  <p className="font-bold text-gray-800 text-sm leading-snug">{order.address}</p>
                  <button onClick={openMap} className="mt-3 w-full bg-blue-50 text-blue-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-sm">
                     <MapPin size={16} /> Xaritada Kadrni Ochish <ExternalLink size={14} />
                  </button>
               </div>
               
               <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">To'lov</p>
                     <p className="font-black text-gray-800 text-lg">{order.total.toLocaleString()} s</p>
                  </div>
                  <div className={`px-4 py-2 ${order.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} rounded-xl text-center`}>
                     <p className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1 text-inherit opacity-70">Turi</p>
                     <p className="font-black text-sm text-inherit">{order.paymentMethod}</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="turon-card !p-4 bg-white shadow-sm border-0">
            <h3 className="font-bold text-gray-800 text-sm mb-3">Tarkibi</h3>
            <div className="space-y-3">
               {order.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm font-medium">
                     <span className="text-gray-600">{i.qty} x {i.name}</span>
                     <span className="text-gray-800 font-bold">{i.price.toLocaleString()} s</span>
                  </div>
               ))}
            </div>
         </div>

         <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-gray-100 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40 space-y-2">
             <button onClick={finishOrder} className="w-full h-14 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-900/20 flex items-center justify-center gap-2 text-lg active:scale-[0.98] transition-all">
                <CheckCircle size={20} className="mt-0.5" /> Yetkazildi deb belgilash
             </button>
         </div>
      </div>
   );
}
