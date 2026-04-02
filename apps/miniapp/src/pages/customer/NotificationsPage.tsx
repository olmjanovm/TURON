import React from 'react';
import NotificationList from '../../features/notifications/components/NotificationList';
import { UserRoleEnum } from '@turon/shared';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';

const CustomerNotificationsPage: React.FC = () => {
  const { language } = useCustomerLanguage();
  const copy =
    language === 'ru'
      ? {
          badge: 'Сообщения',
          title: 'Уведомления',
          subtitle: 'Здесь появляются статусы заказа и системные сообщения.',
        }
      : language === 'uz-cyrl'
        ? {
            badge: 'Хабарлар',
            title: 'Билдиришномалар',
            subtitle: 'Буюртма статуслари ва тизим хабарлари шу ерда чиқади.',
          }
        : {
            badge: 'Xabarlar',
            title: 'Bildirishnomalar',
            subtitle: 'Buyurtma statuslari va tizim xabarlari shu yerda chiqadi.',
          };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-500">
      <section className="glass-panel rounded-[34px] p-5 shadow-[0_18px_42px_rgba(148,101,60,0.12)]">
        <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-400">{copy.badge}</p>
        <h2 className="mt-2 text-[2rem] font-black leading-none tracking-tight text-slate-900">{copy.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">{copy.subtitle}</p>
      </section>

      <div className="glass-panel rounded-[34px] p-4 shadow-[0_18px_42px_rgba(148,101,60,0.12)]">
        <NotificationList role={UserRoleEnum.CUSTOMER} />
      </div>
    </div>
  );
};

export default CustomerNotificationsPage;
