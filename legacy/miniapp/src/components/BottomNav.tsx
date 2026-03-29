import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Settings } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Basic mobile route mapping naturally visually
  const navItems = [
    { label: 'Asosiy', icon: Home, path: '/customer' },
    { label: 'Savat', icon: ShoppingBag, path: '/cart' },
    { label: 'Sozlamalar', icon: Settings, path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-gray-100 flex items-center justify-around z-50 pb-2 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] selection:bg-transparent">
        {navItems.map((item, idx) => {
          const isActive = location.pathname.includes(item.path);
          const Icon = item.icon;
          return (
            <button 
               key={idx}
               onClick={() => navigate(item.path)}
               className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${isActive ? 'text-amber-500 translate-y-[-2px]' : 'text-gray-400 hover:text-gray-600'}`}
            >
               <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-sm' : ''} />
               <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
            </button>
          )
        })}
    </nav>
  );
}
