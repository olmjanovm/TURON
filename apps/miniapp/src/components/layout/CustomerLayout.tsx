import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { HeaderBar, BottomNavbar } from '../customer/CustomerComponents';
import { useCartStore } from '../../store/useCartStore';

const CustomerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, getSubtotal } = useCartStore();
  
  const showResumeCart = items.length > 0 && !location.pathname.includes('/cart') && !location.pathname.includes('/checkout') && !location.pathname.includes('/success');
  
  // Dynamic title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/customer') return 'Turon Kafesi';
    if (path.includes('/customer/category')) return 'Kategoriya';
    if (path.includes('/customer/product')) return 'Taom haqida';
    if (path === '/customer/cart') return 'Savat';
    if (path === '/customer/checkout') return 'Buyurtma';
    if (path === '/customer/orders') return 'Buyurtmalarim';
    if (path.includes('/customer/addresses')) return 'Manzillar';
    if (path.includes('/customer/notifications')) return 'Xabarlar';
    return 'Turon';
  };

  const showBack = location.pathname !== '/customer';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <HeaderBar title={getPageTitle()} showBack={showBack} />
      <main className="flex-1 px-5 pt-4 overflow-x-hidden relative">
        <Outlet />
      </main>
      
      {showResumeCart && (
        <div 
          onClick={() => navigate('/customer/cart')}
          className="fixed bottom-[88px] left-4 right-4 h-14 bg-amber-500 text-white rounded-[20px] shadow-lg shadow-amber-200 flex items-center justify-between px-5 font-bold active:scale-95 transition-transform z-40 cursor-pointer"
        >
           <div className="flex items-center gap-3">
             <ShoppingBag size={20} />
             <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-widest leading-none font-black text-amber-100">Savatcha</span>
               <span className="text-sm leading-none mt-1">{getSubtotal().toLocaleString()} so'm</span>
             </div>
           </div>
           <div className="flex items-center gap-1">
             <span className="text-xs">{items.length} taom</span>
             <ChevronRight size={18} />
           </div>
        </div>
      )}

      <BottomNavbar />
    </div>
  );
};

export default CustomerLayout;
