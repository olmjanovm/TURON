import React from 'react';
import NotificationList from '../../features/notifications/components/NotificationList';
import { UserRoleEnum } from '@turon/shared';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';

const AdminNotificationsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 pb-24 animate-in fade-in duration-500">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-slate-100 shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex items-center gap-2">
          <LayoutDashboard size={20} className="text-indigo-600" />
          <h1 className="text-lg font-black text-slate-800 tracking-tight uppercase">Admin Bildirishnomalari</h1>
        </div>
      </header>

      <main className="p-6">
        <NotificationList role={UserRoleEnum.ADMIN} />
      </main>
    </div>
  );
};

export default AdminNotificationsPage;
