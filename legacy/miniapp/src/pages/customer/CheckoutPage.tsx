import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../store/CartContext';
import { createOrder } from '../../services/api';
import { MapPin, ArrowLeft, CreditCard, Banknote } from 'lucide-react';

export default function CheckoutPage() {
   const { items, clearCart } = useCart();
   const navigate = useNavigate();
   const { state } = useLocation();
   
   const [address, setAddress] = useState('');
   const [paymentMethod, setPaymentMethod] = useState<'cash'|'card'>('cash');
   const [provider, setProvider] = useState<'click'|'payme'|'uzum'>('click');
   const [loading, setLoading] = useState(false);

   const handleLocation = () => {
       if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
       setAddress('Karta orqali: Chilonzor, Bunyodkor ko\'chasi 9-dom');
   };

   const handleSubmit = async () => {
       if (!address) {
          if (window.Telegram?.WebApp) window.Telegram.WebApp.showAlert("Manzilni kiriting!");
          return;
       }
       
       setLoading(true);
       try {
          const payload = {
             items: Object.values(items).map(i => ({ productId: i.product.id, quantity: i.quantity })),
             address,
             paymentMethod,
             paymentProvider: paymentMethod === 'card' ? provider : null,
             promoCode: state?.promoCode || null
          };
          
          await createOrder(payload);
          clearCart();
          if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          
          if (window.Telegram?.WebApp) {
             window.Telegram.WebApp.showPopup({
                title: "Ajoyib! 🎉",
                message: "Buyurtmangiz muvaffaqiyatli qabul qilindi. Tez orada kuryer aloqaga chiqadi.",
                buttons: [{ type: 'close' }]
             }, () => {
                navigate('/orders', { replace: true });
             });
          } else {
             alert("Muvaffaqiyatli!");
             navigate('/orders', { replace: true });
          }
       } catch (e) {
          if (window.Telegram?.WebApp) window.Telegram.WebApp.showAlert("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
       } finally {
          setLoading(false);
       }
   };

   return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-32">
         <div className="pt-2">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-800 shadow-sm border border-gray-100 active:scale-90 transition-all">
               <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight mt-4">Xaridni<br/>Rasmiylashtirish</h2>
         </div>
         
         <section className="space-y-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={18} className="text-amber-500" /> Yetkazish Manzili</h3>
            
            <button onClick={handleLocation} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-3.5 rounded-xl border border-blue-100/50 flex items-center justify-center gap-2 active:scale-[0.99] transition-all">
               <MapPin size={18} /> Lokatsiyamni jo'natish
            </button>
            
            <textarea 
               value={address}
               onChange={e => setAddress(e.target.value)}
               placeholder="Yoki manzilni qo'lda aniq yozing (Kvartira, podyezd, qavat...)"
               className="w-full bg-white border border-gray-100 shadow-sm rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none h-24"
            />
         </section>

         <section className="space-y-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Banknote size={18} className="text-emerald-500" /> To'lov Usuli</h3>
            
            <div className="grid grid-cols-2 gap-3">
               <button 
                  onClick={() => setPaymentMethod('cash')}
                  className={`turon-card !p-4 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash' ? 'ring-2 ring-amber-500 bg-amber-50/20' : 'bg-white opacity-70'}`}
               >
                  <Banknote size={24} className={paymentMethod === 'cash' ? 'text-emerald-500' : 'text-gray-400'} />
                  <span className={`font-bold text-sm ${paymentMethod === 'cash' ? 'text-gray-800' : 'text-gray-500'}`}>Naqd Pul</span>
               </button>
               <button 
                  onClick={() => setPaymentMethod('card')}
                  className={`turon-card !p-4 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'ring-2 ring-amber-500 bg-amber-50/20' : 'bg-white opacity-70'}`}
               >
                  <CreditCard size={24} className={paymentMethod === 'card' ? 'text-blue-500' : 'text-gray-400'} />
                  <span className={`font-bold text-sm ${paymentMethod === 'card' ? 'text-gray-800' : 'text-gray-500'}`}>Karta / O'tkazma</span>
               </button>
            </div>

            {paymentMethod === 'card' && (
               <div className="grid grid-cols-3 gap-2 mt-2 p-3 bg-white rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                  {['click', 'payme', 'uzum'].map((p) => (
                     <button
                        key={p}
                        onClick={() => setProvider(p as any)}
                        className={`py-3 rounded-lg font-bold text-xs capitalize transition-all ${provider === p ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                     >
                        {p}
                     </button>
                  ))}
               </div>
            )}
         </section>
         
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-gray-100 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40">
             <button disabled={loading} onClick={handleSubmit} className="w-full h-14 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-900/20 flex items-center justify-center gap-2 text-lg active:scale-[0.98] transition-all disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : `To'lov (${state?.finalTotal?.toLocaleString() || 0} s)`}
             </button>
         </div>
      </div>
   );
}
