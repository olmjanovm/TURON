import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, History, ChevronLeft } from 'lucide-react';
import { useCustomerStore } from '../../store/useCustomerStore';

const HeaderBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = location.pathname !== '/customer';

  const getTitle = () => {
    if (location.pathname === '/customer') return 'Turon Kafesi';
    if (location.pathname === '/customer/cart') return 'Savatcha';
    if (location.pathname.includes('/category/')) return 'Bo’lim';
    if (location.pathname.includes('/product/')) return 'Taom';
    return 'Turon';
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-4 z-50">
      {canGoBack && (
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full mr-2 active:scale-95 transition-transform"
        >
          <ChevronLeft size={24} className="text-gray-800" />
        </button>
      )}
      <h1 className="text-xl font-black text-gray-900 tracking-tight">{getTitle()}</h1>
    </div>
  );
};

const BottomNavbar: React.FC = () => {
  const { getTotalItems } = useCustomerStore();
  const totalItems = getTotalItems();

  const navItems = [
    { to: '/customer', icon: Home, label: 'Asosiy' },
    { to: '/customer/cart', icon: ShoppingBag, label: 'Savatcha', badge: totalItems },
    { to: '/customer/orders', icon: History, label: 'Buyurtmalar' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50 pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `
            flex flex-col items-center justify-center w-20 h-full relative transition-colors
            ${isActive ? 'text-amber-500' : 'text-gray-400'}
          `}
        >
          <div className="relative">
            <item.icon size={24} fill={item.to === window.location.pathname.replace('/customer','') ? 'currentColor' : 'none'} />
            {item.badge > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {item.badge}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-16">
      <HeaderBar />
      <main className="max-w-2xl mx-auto px-4 py-4">
        <Outlet />
      </main>
      <BottomNavbar />
    </div>
  );
};
