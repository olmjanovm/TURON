import React, { useState } from 'react';
import { Plus, Minus, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../store/CartContext';
import type { Product } from '../store/CartContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const [showDrawer, setShowDrawer] = useState(false);
  const qty = items[product.id]?.quantity || 0;

  return (
    <>
      <div onClick={() => setShowDrawer(true)} className="turon-card flex flex-col gap-2 relative group overflow-hidden cursor-pointer">
        <div className="aspect-square bg-orange-50/50 rounded-xl flex items-center justify-center text-5xl shadow-inner border border-orange-100/50 relative overflow-hidden">
           {product.imageUrl && product.imageUrl.startsWith('http') ? (
               <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
           ) : (
               <span>🍲</span>
           )}
           {product.stockQuantity <= 0 && (
             <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
               <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Tugagan</span>
             </div>
           )}
        </div>
        <h4 className="font-bold text-[13px] leading-tight text-gray-800 mt-1">{product.name}</h4>
        <p className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed flex-grow">{product.description}</p>
        
        <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
           <strong className="text-amber-500 text-[13px] tracking-wide">{Number(product.price).toLocaleString()} s</strong>
           
           {qty === 0 ? (
              <button 
                disabled={product.stockQuantity <= 0}
                onClick={() => addItem(product)}
                className="bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-600 w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-all active:scale-95"
              >
                 <Plus size={16} strokeWidth={3} />
              </button>
           ) : (
              <div className="flex items-center gap-2 bg-amber-50/80 rounded-lg px-1.5 py-1 border border-amber-100/50">
                <button onClick={() => updateQuantity(product.id, -1)} className="w-6 h-6 flex items-center justify-center text-amber-600 active:scale-90 transition-all font-black"><Minus size={14} /></button>
                <span className="w-4 text-center text-xs font-black text-amber-600">{qty}</span>
                <button onClick={() => updateQuantity(product.id, 1)} className="w-6 h-6 flex items-center justify-center text-amber-600 active:scale-90 transition-all font-black"><Plus size={14} /></button>
              </div>
           )}
        </div>
      </div>

      {showDrawer && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDrawer(false)}></div>
           <div className="bg-white rounded-t-3xl relative z-10 animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] overflow-y-auto flex flex-col pointer-events-auto">
              
              <div className="sticky top-0 right-0 p-4 flex justify-end">
                 <button onClick={() => setShowDrawer(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 active:scale-90 transition-all">
                   <X size={18} />
                 </button>
              </div>
              
              <div className="p-6 pt-0 space-y-5">
                 <div className="w-32 h-32 mx-auto bg-orange-50 rounded-2xl flex items-center justify-center text-6xl shadow-inner border border-orange-100 my-4 shadow-orange-100/50">
                    {product.imageUrl && product.imageUrl.startsWith('http') ? <img src={product.imageUrl} className="w-full h-full object-cover rounded-2xl" /> : '🍲'}
                 </div>
                 <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">{product.name}</h2>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed px-4">{product.description}</p>
                 </div>
                 
                 <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-6 flex justify-between items-center">
                    <div>
                       <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-0.5">Narxi</p>
                       <p className="text-2xl font-black text-amber-500">{Number(product.price).toLocaleString()} so'm</p>
                    </div>
                 </div>

                 <button 
                   disabled={product.stockQuantity <= 0}
                   onClick={() => {
                      if(qty === 0) addItem(product);
                      else updateQuantity(product.id, 1);
                      setShowDrawer(false);
                   }} 
                   className="w-full bg-gray-900 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                 >
                   <ShoppingBag size={18} />
                   {product.stockQuantity <= 0 ? "Vaqtincha tugagan" : (qty > 0 ? "Yana 1 ta qo'shish" : "Savatchaga qo'shish")}
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  )
}
