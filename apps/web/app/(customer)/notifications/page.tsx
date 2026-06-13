'use client';

import { Bell, Loader2 } from 'lucide-react';
import { useNotifications, useMarkNotificationRead } from '@/hooks/use-customer';
import { useT } from '@/lib/i18n/locale-context';

function formatDate(value: string) {
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const t = useT();
  const { data: list = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">
        {t('notifications.title')}
      </h1>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#c62020]" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Bell size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-base font-black text-slate-900 dark:text-slate-100">
            {t('notifications.empty.title')}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t('notifications.empty.desc')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => !n.isRead && markRead.mutate(n.id)}
              className={`block w-full rounded-3xl border bg-white p-4 text-left shadow-sm transition active:scale-[0.99] dark:bg-slate-900 ${
                n.isRead
                  ? 'border-slate-100 dark:border-slate-800'
                  : 'border-[#c62020]/30 ring-1 ring-[#c62020]/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  n.isRead ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' : 'bg-gradient-to-br from-[#c62020] to-[#f97316] text-white'
                }`}>
                  <Bell size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">{n.title}</p>
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c62020]" />}
                  </div>
                  <p className="mt-0.5 text-xs leading-snug text-slate-600 dark:text-slate-300">{n.body}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{formatDate(n.createdAt)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
