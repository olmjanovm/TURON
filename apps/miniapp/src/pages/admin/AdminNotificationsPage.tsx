import React from 'react';
import NotificationList from '../../features/notifications/components/NotificationList';
import { UserRoleEnum } from '@turon/shared';
import { useNavigate } from 'react-router-dom';

const AdminNotificationsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-12 animate-in fade-in duration-500">

      <main className="p-6">
        <NotificationList role={UserRoleEnum.ADMIN} />
      </main>
    </div>
  );
};

export default AdminNotificationsPage;
