import React from 'react';
import NotificationList from '../../features/notifications/components/NotificationList';
import { UserRoleEnum } from '@turon/shared';

const AdminNotificationsPage: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <section className="admin-pro-card admin-hero-card p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">Admin center</p>
        <h2 className="mt-2 text-xl font-black tracking-tight text-white">Signal va bildirishnomalar</h2>
        <p className="mt-1 text-sm font-medium text-white/70">
          Buyurtma, tizim va operatsion ogohlantirishlar shu yerda jamlangan.
        </p>
      </section>

      <main className="pt-5">
        <NotificationList role={UserRoleEnum.ADMIN} />
      </main>
    </div>
  );
};

export default AdminNotificationsPage;
