import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../store/CartContext';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { validatePromo } from '../../services/api';

export default function CartPage() {
   const { items, updateQuantity, removeItem, totalPrice } = useCart();
   const navigate = useNavigate();
   const [promo, setPromo] = useState('');
   const [discount, setDiscount] = useState(0);
   const [promoLoading, setPromoLoading] = useState(false);
   const [promoError, setPromoError] = useState('');

   const cartArray = Object.values(items);

   const handlePromo = async () => {
      setPromoError('');
      if (!promo) return;
      setPromoLoading(true);
      try {
         const res = await validatePromo(promo);
         if (res.valid) {
            setDiscount(res.discountValue);
         } else {
            setPromoError(res.error || 'Qidirgan promokodingiz yaroqsiz');
            setDiscount(0);
         }
      } catch (err) {
         setPromoError('Tizim xatosi. Qayta urinib ko\'ring');
      } finally {
         setPromoLoading(false);
      }
   };

   if (cartArray.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner border border-orange-100">🛒</div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Savatchangiz bo'sh</h2>
            <p className="text-sm font-medium text-gray-500 mt-2 mb-8 leading-relaxed">
               Iltimos, avval menudan mazali taomlarni xarid qilish uchun tanlang.
            </p>
            <button onClick={() => navigate('/customer')} className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-amber-500/20 transition-all">
               Menuga qaytish
            </button>
         </div>
      );
   }

   const finalTotal = Math.max(0, totalPrice - discount);

   return (
      <div className="space-y-6 pt-4 pb-32 animate-in slide-in-from-right-4 duration-300">
         <h2 className="text-2xl font-black text-gray-800 tracking-tight">Savatcha</h2>
         
         <div className="space-y-3">
            {cartArray.map(({product, quantity}) => (
               <div key={product.id} className="turon-card !p-3 flex items-center gap-4 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] border-0">
                  <div className="w-20 h-20 bg-orange-50 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl">🍲</div>
                  <div className="flex-grow space-y-1">
                     <h4 className="font-bold text-sm text-gray-800 leading-tight">{product.name}</h4>
                     <p className="font-black text-amber-500 text-[13px]">{Number(product.price).toLocaleString()} s</p>
                  </div>

                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                     <button onClick={() => removeItem(product.id)} className="text-gray-300 hover:text-red-500 active:scale-90 transition-colors">
                        <Trash2 size={16} />
                     </button>
                     <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-100">
                        <button onClick={() => updateQuantity(product.id, -1)} className="text-gray-500 hover:text-gray-800 w-5 h-5 flex items-center justify-center active:scale-90 transition-all"><Minus size={14} strokeWidth={3} /></button>
                        <span className="w-5 text-center text-xs font-black text-gray-800">{quantity}</span>
                        <button disabled={product.stockQuantity <= quantity} onClick={() => updateQuantity(product.id, 1)} className="text-amber-500 hover:text-amber-600 disabled:opacity-50 w-5 h-5 flex items-center justify-center active:scale-90 transition-all"><Plus size={14} strokeWidth={3} /></button>
                     </div>
                  </div>
               </div>
            ))}
         </div>

         <div className="turon-card !p-4 bg-white shadow-sm border-0">
            <h3 className="font-bold text-gray-800 text-sm mb-3">Promokod</h3>
            <div className="flex gap-2">
               <input 
                  type="text" 
                  value={promo}
                  onChange={e => setPromo(e.target.value)}
                  placeholder="Kodni kiriting..."
                  className="flex-grow bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/20" 
               />
               <button 
                 onClick={handlePromo}
                 disabled={!promo || promoLoading}
                 className="bg-gray-900 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl active:scale-95 transition-all text-sm"
               >
                 Tadbik
               </button>
            </div>
            {promoError && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{promoError}</p>}
            {discount > 0 && <p className="text-emerald-500 text-xs font-bold mt-2 ml-1">✓ {discount.toLocaleString()} so'm chegirma qilindi</p>}
         </div>

         <div className="turon-card !p-4 bg-white shadow-sm border-0 space-y-3">
            <div className="flex justify-between text-sm font-medium text-gray-500">
               <span>Asosiy summa</span>
               <span>{totalPrice.toLocaleString()} s</span>
            </div>
            {discount > 0 && (
               <div className="flex justify-between text-sm font-medium text-emerald-500">
                  <span>Chegirma (Promo)</span>
                  <span>- {discount.toLocaleString()} s</span>
               </div>
            )}
            <div className="pt-3 flex justify-between font-black text-gray-800 text-lg border-t border-dashed border-gray-200">
               <span>Jami To'lov</span>
               <span>{finalTotal.toLocaleString()} s</span>
            </div>
         </div>

         <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-gray-100 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40">
             <button onClick={() => navigate('/checkout', { state: { promoCode: promo, discount, finalTotal } })} className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 text-lg active:scale-[0.98] transition-all">
                Rasmiylashtirish <ArrowRight size={20} className="mt-0.5" />
             </button>
         </div>

      </div>
   );
}
