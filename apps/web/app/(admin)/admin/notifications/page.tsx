'use client';

import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Package } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from '@/hooks/use-admin-notifications';
import { SkeletonRow } from '@/components/ui/skeleton';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'hozir';
  if (m < 60) return `${m} daq oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return new Date(iso).toLocaleDateString('uz-UZ');
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { data: items, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const unread = (items ?? []).filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Bell size={16} className="text-ember" /> Bildirishnomalar
          {unread > 0 && (
            <span className="rounded-full bg-ember px-1.5 text-[10px] font-black text-white">{unread}</span>
          )}
        </h2>
        {unread > 0 && (
          <button
            type="button"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
            className="flex items-center gap-1 text-xs font-semibold text-sky-600 disabled:opacity-50"
          >
            <CheckCheck size={14} /> Hammasini o'qildi
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
      ) : isError ? (
        <div className="admin-card p-6 text-center text-sm text-slate-500">Yuklashda xatolik.</div>
      ) : (items ?? []).length === 0 ? (
        <p className="admin-card p-10 text-center text-sm text-slate-400">Bildirishnoma yo'q</p>
      ) : (
        <div className="space-y-2">
          {(items ?? []).map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                if (!n.isRead) markRead.mutate(n.id);
                if (n.relatedOrderId) router.push(`/admin/orders/${n.relatedOrderId}`);
              }}
              className={`admin-card admin-card-interactive flex w-full items-start gap-3 p-4 text-left ${n.isRead ? '' : 'ring-1 ring-ember/20'}`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${n.isRead ? 'bg-slate-100 text-slate-400' : 'bg-ember/10 text-ember'}`}>
                <Package size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-slate-900">{n.title}</p>
                  {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-ember" />}
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.message}</p>
                <p className="mt-1 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
