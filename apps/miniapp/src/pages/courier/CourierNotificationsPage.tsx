import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { UserRoleEnum } from '@turon/shared';
import NotificationList from '../../features/notifications/components/NotificationList';

const CourierNotificationsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur-xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-slate-600 shadow-sm transition-transform active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-slate-500" />
          <p className="text-[18px] font-black text-slate-900">Bildirishnomalar</p>
        </div>
      </header>

      <main className="px-4 py-4">
        <NotificationList role={UserRoleEnum.COURIER} />
      </main>
    </div>
  );
};

export default CourierNotificationsPage;
