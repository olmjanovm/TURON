import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Megaphone, Plus } from 'lucide-react';

export default function AdminPromoPage() {
   const navigate = useNavigate();

   return (
      <div className="space-y-6 pt-2 pb-24 animate-in fade-in duration-300">
         <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-800 shadow-sm border border-gray-100 active:scale-90 transition-all">
               <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Ommaviy Xabarlar</h2>
         </div>

         <div className="space-y-4">
            <div className="turon-card bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-0 shadow-xl shadow-indigo-500/20 !p-6">
                <Megaphone size={32} className="mb-4 text-indigo-100" />
                <h3 className="text-xl font-black mb-2 leading-tight">Barcha Mijozlarga xabar yuboring</h3>
                <p className="text-sm font-medium text-indigo-100 leading-relaxed max-w-[90%]">Telegram'dagi barcha aktiv foydalanuvchilar bot orqali PUSH xabarnoma olishadi.</p>
                <button className="mt-6 w-full bg-white text-indigo-600 font-bold py-3.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                   + Yangi xabar yaratish
                </button>
            </div>

            <h3 className="font-bold text-gray-800 mt-6 pt-2">Xabarlar Tarixi</h3>
            {[1,2].map(i => (
                <div key={i} className="turon-card bg-white !p-4 border border-gray-100 shadow-sm flex items-start gap-3">
                   <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-500">
                      <Megaphone size={16} />
                   </div>
                   <div>
                      <h4 className="font-bold text-[13px] text-gray-800 leading-tight">"Bahorgi aksiya -10%" xabarnomasi</h4>
                      <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">2 405 kishiga Yuborildi • Kuni kecha</p>
                   </div>
                </div>
            ))}
         </div>
      </div>
   );
}
