'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Bell, ChevronRight, Headset, Loader2, Bike,
} from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useSupportThread,
  useCourierThreads,
} from '@/hooks/use-customer';

type Tab = 'notifications' | 'admin' | 'couriers';

function shortDate(value: string) {
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function MessagesHubPage() {
  const [tab, setTab] = useState<Tab>('notifications');

  const notifs = useNotifications();
  const courierThreads = useCourierThreads();

  const unreadNotifs = (notifs.data ?? []).filter((n) => !n.isRead).length;
  const unreadCouriers = (courierThreads.data ?? []).reduce((s, c) => s + c.unreadCount, 0);

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">Xabarlar</h1>
      </div>

      {/* Kategoriya tablari */}
      <div className="flex gap-2">
        <TabBtn active={tab === 'notifications'} onClick={() => setTab('notifications')} icon={Bell} label="Bildirishnomalar" badge={unreadNotifs} />
        <TabBtn active={tab === 'admin'} onClick={() => setTab('admin')} icon={Headset} label="Admin" />
        <TabBtn active={tab === 'couriers'} onClick={() => setTab('couriers')} icon={Bike} label="Kuryerlar" badge={unreadCouriers} />
      </div>

      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'admin' && <AdminTab />}
      {tab === 'couriers' && <CouriersTab />}
    </div>
  );
}

function TabBtn({
  active, onClick, icon: Icon, label, badge,
}: {
  active: boolean; onClick: () => void; icon: typeof Bell; label: string; badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-1 flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 transition ${
        active
          ? 'border-[#c62020] bg-[#c62020]/5 dark:bg-[#c62020]/15'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
      }`}
    >
      <Icon size={18} className={active ? 'text-[#c62020]' : 'text-slate-500'} />
      <span className={`text-[11px] font-black ${active ? 'text-[#c62020]' : 'text-slate-600 dark:text-slate-300'}`}>
        {label}
      </span>
      {badge ? (
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c62020] px-1 text-[9px] font-black text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </button>
  );
}

function EmptyCard({ icon: Icon, title, desc }: { icon: typeof Bell; title: string; desc?: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Icon size={32} className="mx-auto mb-3 text-slate-300" />
      <p className="text-base font-black text-slate-900 dark:text-slate-100">{title}</p>
      {desc && <p className="mt-1 text-xs text-slate-500">{desc}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 size={24} className="animate-spin text-[#c62020]" />
    </div>
  );
}

// ── Bildirishnomalar ────────────────────────────────────────────────────────
function NotificationsTab() {
  const { data: list = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const hasUnread = list.some((n) => !n.isRead);

  if (isLoading) return <Spinner />;
  if (list.length === 0) {
    return <EmptyCard icon={Bell} title="Bildirishnoma yo‘q" desc="Yangi bildirishnomalar shu yerda ko‘rinadi." />;
  }

  return (
    <div className="space-y-2">
      {hasUnread && (
        <button
          type="button"
          onClick={() => markAll.mutate()}
          className="ml-auto block text-xs font-bold text-[#c62020] active:scale-95"
        >
          Hammasini o‘qilgan deb belgilash
        </button>
      )}
      {list.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => !n.isRead && markRead.mutate(n.id)}
          className={`block w-full rounded-3xl border bg-white p-4 text-left shadow-sm transition active:scale-[0.99] dark:bg-slate-900 ${
            n.isRead ? 'border-slate-100 dark:border-slate-800' : 'border-[#c62020]/30 ring-1 ring-[#c62020]/10'
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
              <p className="mt-1 text-[10px] text-slate-400">{shortDate(n.createdAt)}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Admin ───────────────────────────────────────────────────────────────────
function AdminTab() {
  const { data: thread, isLoading } = useSupportThread();
  const last = thread?.messages?.[thread.messages.length - 1];

  return (
    <Link
      href="/messages/admin"
      className="flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white">
        <Headset size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-900 dark:text-slate-100">Admin bilan suhbat</p>
        <p className="line-clamp-1 text-xs text-slate-500">
          {isLoading ? 'Yuklanmoqda…' : last ? `${last.senderRole === 'CUSTOMER' ? 'Siz: ' : ''}${last.text}` : 'Savolingizni yozing — yordam beramiz'}
        </p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-slate-300" />
    </Link>
  );
}

// ── Kuryerlar ─────────────────────────────────────────────────────────────--
function CouriersTab() {
  const { data: list = [], isLoading } = useCourierThreads();

  if (isLoading) return <Spinner />;
  if (list.length === 0) {
    return <EmptyCard icon={Bike} title="Kuryer suhbatlari yo‘q" desc="Buyurtma yetkazilganda kuryer bilan yozishmalar shu yerda chiqadi." />;
  }

  return (
    <div className="space-y-2">
      {list.map((c) => (
        <Link
          key={c.courierId}
          href={`/messages/courier/${c.courierId}`}
          className="flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Bike size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">{c.courierName}</p>
              <span className="shrink-0 text-[10px] text-slate-400">{shortDate(c.lastAt)}</span>
            </div>
            <p className="line-clamp-1 text-xs text-slate-500">{c.lastMessage || 'Suhbat'}</p>
          </div>
          {c.unreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#c62020] px-1.5 text-[10px] font-black text-white">
              {c.unreadCount > 9 ? '9+' : c.unreadCount}
            </span>
          )}
          <ChevronRight size={16} className="shrink-0 text-slate-300" />
        </Link>
      ))}
    </div>
  );
}
