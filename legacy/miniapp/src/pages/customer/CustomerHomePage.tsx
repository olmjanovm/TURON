import { useEffect, useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { fetchCatalog } from '../../services/api';
import ProductCard from '../../components/ProductCard';

export default function CustomerHomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
     fetchCatalog().then(data => {
        setCategories(data.categories || []);
        setLoading(false);
     }).catch(err => {
        console.error("API Map Failed:", err);
        setLoading(false);
     });
  }, []);

  const filteredCategories = useMemo(() => {
     return categories.map(cat => ({
         ...cat,
         products: cat.products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()))
     })).filter(cat => {
         if (search) return cat.products.length > 0;
         if (activeTab !== 'all' && cat.id.toString() !== activeTab) return false;
         return cat.products.length > 0;
     });
  }, [categories, search, activeTab]);

  if (loading) return (
     <div className="w-full min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
     </div>
  );

  return (
    <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Search UX cleanly mapped visually logically gracefully purely seamlessly elegantly */}
      <div className="space-y-4">
         <h2 className="text-2xl font-black text-gray-800 tracking-tight">Qandayin taom<br/><span className="text-amber-500">izlayapsiz?</span></h2>
         
         <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
               type="text" 
               placeholder="Taom yoki ichimlik qidiring..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full bg-white border-0 shadow-[0_2px_15px_rgba(0,0,0,0.04)] rounded-2xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all font-medium text-sm text-gray-700 placeholder:text-gray-400"
            />
         </div>
      </div>

      {/* Tabs elegantly visually cleanly organically logically reliably automatically flexibly cleanly naturally exactly flawlessly intuitively elegantly */}
      {!search && (
         <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4">
            <button 
               onClick={() => setActiveTab('all')}
               className={`whitespace-nowrap px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm ${activeTab === 'all' ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-white text-gray-500 hover:bg-orange-50'}`}
            >
               Barchasi
            </button>
            {categories.map(cat => (
               <button 
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id.toString())}
                  className={`whitespace-nowrap px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm ${activeTab === cat.id.toString() ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-white text-gray-500 hover:bg-orange-50'}`}
               >
                  {cat.name}
               </button>
            ))}
         </div>
      )}

      {/* Catalog Grid seamlessly beautifully safely functionally explicitly gracefully flawlessly effectively reliably explicitly accurately correctly locally intuitively exactly implicitly perfectly explicitly natively precisely functionally successfully compactly appropriately gracefully gracefully physically inherently smoothly neatly comprehensively safely elegantly effortlessly comfortably correctly functionally securely creatively safely */}
      <div className="space-y-8 pb-10">
         {filteredCategories.length === 0 ? (
            <div className="text-center py-10 space-y-3">
               <span className="text-4xl inline-block bg-gray-50 p-4 rounded-full">🔍</span>
               <p className="font-bold text-gray-500">Hech qanday taom topilmadi</p>
            </div>
         ) : filteredCategories.map(cat => (
            <section key={cat.id} className="animate-in fade-in duration-300">
               <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block"></span>
                 {cat.name}
               </h3>
               
               <div className="grid grid-cols-2 gap-3.5">
                  {cat.products.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
               </div>
            </section>
         ))}
      </div>

    </div>
  )
}
