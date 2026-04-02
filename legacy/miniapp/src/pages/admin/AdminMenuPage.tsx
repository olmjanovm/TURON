import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Archive } from 'lucide-react';

export default function AdminMenuPage() {
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState('categories');

   return (
      <div className="space-y-6 pt-2 pb-24 animate-in fade-in duration-300">
         <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-800 shadow-sm border border-gray-100 active:scale-90 transition-all">
               <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Menyuni Boshqarish</h2>
         </div>

         <div className="flex bg-gray-100 p-1 rounded-2xl w-full mx-auto">
            <button onClick={() => setActiveTab('categories')} className={`flex-1 py-2 font-bold text-sm rounded-xl transition-all ${activeTab === 'categories' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Kategoriyalar</button>
            <button onClick={() => setActiveTab('products')} className={`flex-1 py-2 font-bold text-sm rounded-xl transition-all ${activeTab === 'products' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Taomlar</button>
         </div>

         {activeTab === 'categories' ? (
            <div className="space-y-4 animate-in fade-in">
               <button className="w-full bg-white border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50/50 text-amber-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
                  <Plus size={18} /> Yangi Kategoriya
               </button>
               
               {['Milliy Taomlar', 'Fast Food', 'Ichimliklar'].map((c, i) => (
                  <div key={i} className="turon-card flex justify-between items-center bg-white shadow-sm border-0 border-l-4 border-l-amber-500 p-4">
                     <div>
                        <h4 className="font-bold text-gray-800">{c}</h4>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">12 Taom</p>
                     </div>
                     <div className="flex gap-2">
                        <button className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"><Edit2 size={14}/></button>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="space-y-4 animate-in fade-in">
               <button className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-gray-900/20">
                  <Plus size={18} /> Yangi Taom Qo'shish
               </button>
               
               <div className="relative">
                  <input type="text" placeholder="Taom Qidirish..." className="w-full bg-white border border-gray-100 shadow-sm rounded-xl py-3 px-4 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
               </div>

               {[1,2,3].map(i => (
                  <div key={i} className="turon-card flex gap-4 p-3 bg-white shadow-sm border border-gray-100/50 items-center">
                     <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🍲</div>
                     <div className="flex-grow">
                        <h4 className="font-bold text-sm text-gray-800">Qozonkabob #{i}</h4>
                        <p className="text-[12px] font-black text-amber-500 mt-1">45,000 s</p>
                     </div>
                     <div className="flex flex-col gap-2">
                        <button className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center active:scale-90 transition-all"><Edit2 size={14}/></button>
                        <button className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center active:scale-90 transition-all"><Archive size={14}/></button>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}
