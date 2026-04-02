import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RequireAuth from '../components/RequireAuth';
import { useAuth } from '../store/AuthContext';

import AppLayout from '../layouts/AppLayout';
import CustomerHomePage from '../pages/customer/CustomerHomePage';
import CartPage from '../pages/customer/CartPage';
import CheckoutPage from '../pages/customer/CheckoutPage';
import OrdersHistoryPage from '../pages/customer/OrdersHistoryPage';

import AdminHomePage from '../pages/admin/AdminHomePage';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminMenuPage from '../pages/admin/AdminMenuPage';
import AdminPromoPage from '../pages/admin/AdminPromoPage';
import AdminBroadcastPage from '../pages/admin/AdminBroadcastPage';
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage';

import CourierHomePage from '../pages/courier/CourierHomePage';
import CourierOrderDetailPage from '../pages/courier/CourierOrderDetailPage';
import CourierHistoryPage from '../pages/courier/CourierHistoryPage';
import UnauthorizedPage from '../pages/shared/UnauthorizedPage';

import { initTelegramWebApp } from '../utils/telegram';

function AuthGateway() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Yuklanmoqda...');

  useEffect(() => {
    if (!loading) {
      try {
         setStatus('Identifikatsiya qilinmoqda...');
         initTelegramWebApp();
         
         if (role) {
             setStatus(`Yo'naltirilmoqda: ${role}...`);
             navigate(`/${role}`, { replace: true });
         } else {
             setStatus('Ruxsat berilmadi.');
             navigate('/unauthorized', { replace: true });
         }
      } catch (err) {
         console.error('Critical Gateway Crash:', err);
         setStatus('Xatolik yuz berdi. Konsolni tekshiring.');
      }
    }
  }, [role, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <div className="flex flex-col items-center p-8 text-center">
        <h1 className="text-3xl font-black text-amber-500 mb-2 drop-shadow-sm">Turon Kafesi</h1>
        <p className="text-sm font-bold text-amber-600/60 mb-8 tracking-widest uppercase">{status}</p>
        
        <div className="relative">
          <div className="w-12 h-12 border-4 border-amber-500/20 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthGateway />} />
        
        {/* Secure Authed Shell explicitly nesting protected boundaries cohesively nicely visibly */}
        <Route element={<AppLayout />}>
           <Route path="/customer" element={<CustomerHomePage />} />
           <Route path="/cart" element={<CartPage />} />
           <Route path="/checkout" element={<CheckoutPage />} />
           <Route path="/orders" element={<OrdersHistoryPage />} />
           
           <Route path="/admin" element={<RequireAuth allowedRoles={['admin']}><AdminHomePage /></RequireAuth>} />
           <Route path="/admin/orders" element={<RequireAuth allowedRoles={['admin']}><AdminOrdersPage /></RequireAuth>} />
           <Route path="/admin/menu" element={<RequireAuth allowedRoles={['admin']}><AdminMenuPage /></RequireAuth>} />
           <Route path="/admin/promo" element={<RequireAuth allowedRoles={['admin']}><AdminPromoPage /></RequireAuth>} />
           <Route path="/admin/broadcast" element={<RequireAuth allowedRoles={['admin']}><AdminBroadcastPage /></RequireAuth>} />
           <Route path="/admin/analytics" element={<RequireAuth allowedRoles={['admin']}><AdminAnalyticsPage /></RequireAuth>} />
           
           <Route path="/courier" element={<RequireAuth allowedRoles={['courier', 'admin']}><CourierHomePage /></RequireAuth>} />
           <Route path="/courier/order/:id" element={<RequireAuth allowedRoles={['courier', 'admin']}><CourierOrderDetailPage /></RequireAuth>} />
           <Route path="/courier/history" element={<RequireAuth allowedRoles={['courier', 'admin']}><CourierHistoryPage /></RequireAuth>} />
           <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
