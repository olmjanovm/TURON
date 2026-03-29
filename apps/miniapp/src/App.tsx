import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useTelegram } from './hooks/useTelegram';
import { useAuthStore } from './store/useAuthStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserRoleEnum } from '@turon/shared';
import axios from 'axios';

// --- Placeholder Components ---
const LoadingScreen = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-amber-50">
    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-amber-800 font-medium">Turon Kafesi yuklanmoqda...</p>
  </div>
);

const AuthErrorScreen = ({ message }: { message: string }) => (
  <div className="h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 text-2xl">⚠️</div>
    <h2 className="text-xl font-bold text-red-800 mb-2">Identifikatsiya xatosi</h2>
    <p className="text-red-600">{message}</p>
  </div>
);

const UnauthorizedScreen = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
    <h2 className="text-xl font-bold text-gray-800 mb-2">Ruxsat etilmadi</h2>
    <p className="text-gray-600">Sizda ushbu sahifaga kirish huquqi yo'q.</p>
  </div>
);

// --- Pages ---
const CustomerHome = () => <div className="p-4"><h1>🛒 Mijoz Sahifasi</h1></div>;
const AdminHome = () => <div className="p-4"><h1>🏢 Admin Paneli</h1></div>;
const CourierHome = () => <div className="p-4"><h1>🚚 Kurer Sahifasi</h1></div>;
const CourierOrders = () => <div className="p-4"><h1>📦 Kurer Buyurtmalari</h1></div>;
const CourierMap = () => <div className="p-4"><h1>🗺️ Yetkazib berish xaritasi</h1></div>;

// --- Main App Logic ---
const AuthGateway: React.FC = () => {
  const { initData, ready, expand } = useTelegram();
  const { setAuth, user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function bootstrap() {
      if (!initData) {
        setError('Telegram muhiti topilmadi. Iltimos, bot orqali kiring.');
        setLoading(false);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await axios.post(`${apiUrl}/auth/telegram`, { initData });
        
        const { user: authUser, token } = response.data;
        setAuth(authUser, token);
        
        ready();
        expand();
        
        // Auto-redirect based on role
        if (authUser.role === UserRoleEnum.ADMIN) navigate('/admin');
        else if (authUser.role === UserRoleEnum.COURIER) navigate('/courier');
        else navigate('/customer');
        
      } catch (err: any) {
        setError(err.response?.data?.error || 'Server bilan bog\'lanishda xato yuz berdi.');
      } finally {
        setLoading(false);
      }
    }

    if (!isAuthenticated) {
      bootstrap();
    } else {
      setLoading(false);
      // Already authed, redirect from root if necessary
      if (location.pathname === '/') {
          if (user?.role === UserRoleEnum.ADMIN) navigate('/admin');
          else if (user?.role === UserRoleEnum.COURIER) navigate('/courier');
          else navigate('/customer');
      }
    }
  }, [initData, isAuthenticated, user, navigate, ready, expand, setAuth]);

  if (loading) return <LoadingScreen />;
  if (error) return <AuthErrorScreen message={error} />;

  return null;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthGateway />} />
        
        {/* Customer Routes */}
        <Route path="/customer" element={
          <ProtectedRoute allowedRoles={[UserRoleEnum.CUSTOMER, UserRoleEnum.ADMIN]}>
            <CustomerHome />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[UserRoleEnum.ADMIN]}>
            <AdminHome />
          </ProtectedRoute>
        } />

        {/* Courier Routes */}
        <Route path="/courier" element={
          <ProtectedRoute allowedRoles={[UserRoleEnum.COURIER, UserRoleEnum.ADMIN]}>
            <CourierHome />
          </ProtectedRoute>
        } />
        <Route path="/courier/orders" element={
          <ProtectedRoute allowedRoles={[UserRoleEnum.COURIER, UserRoleEnum.ADMIN]}>
            <CourierOrders />
          </ProtectedRoute>
        } />
        <Route path="/courier/map/:orderId" element={
          <ProtectedRoute allowedRoles={[UserRoleEnum.COURIER, UserRoleEnum.ADMIN]}>
            <CourierMap />
          </ProtectedRoute>
        } />

        <Route path="/auth-error" element={<AuthErrorScreen message="Seans muddati tugagan yoki xato." />} />
        <Route path="/unauthorized" element={<UnauthorizedScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
