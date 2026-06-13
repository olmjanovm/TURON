'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Truck, User, ChevronRight } from 'lucide-react';
import { useAdminInbox, type AdminChatEntry } from '@/hooks/use-admin-chats';
import { SkeletonRow } from '@/components/ui/skeleton';

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'hozir';
  if (m < 60) return `${m} daq`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat`;
  return new Date(iso).toLocaleDateString('uz-UZ');
}

export default function AdminChatsPage() {
  const [tab, setTab] = useState<'customer' | 'courier'>('customer');
  const { data: inbox, isLoading, isError } = useAdminInbox();

  const entries: AdminChatEntry[] =
    tab === 'customer' ? (inbox?.customerMessages ?? []) : (inbox?.courierMessages ?? []);

  const customerUnread = (inbox?.customerMessages ?? []).reduce((n, e) => n + e.unreadCount, 0);
  const courierUnread = (inbox?.courierMessages ?? []).reduce((n, e) => n + e.unreadCount, 0);

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 px-1 text-sm font-bold text-slate-900">
        <MessageCircle size={16} className="text-ember" /> Suhbatlar
      </h2>

      <div className="flex gap-2">
        <TabBtn active={tab === 'customer'} onClick={() => setTab('customer')} icon={User} label="Mijozlar" badge={customerUnread} />
        <TabBtn active={tab === 'courier'} onClick={() => setTab('courier')} icon={Truck} label="Kuryerlar" badge={courierUnread} />
      </div>

      {isLoading ? (
        <div className="space-y-2"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
      ) : isError ? (
        <div className="admin-card p-6 text-center text-sm text-slate-500">Yuklashda xatolik.</div>
      ) : entries.length === 0 ? (
        <p className="admin-card p-10 text-center text-sm text-slate-400">Suhbat yo'q</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <Link
              key={e.orderId}
              href={`/admin/chats/${encodeURIComponent(e.orderId)}?role=${tab}`}
              className="admin-card admin-card-interactive flex items-center gap-3 p-4"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${e.unreadCount > 0 ? 'bg-ember/10 text-ember' : 'bg-slate-100 text-slate-400'}`}>
                {tab === 'courier' ? <Truck size={18} /> : <User size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">#{e.orderNumber}</p>
                  <span className="text-[10px] text-slate-400">{timeAgo(e.lastAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{e.lastMessage}</p>
              </div>
              {e.unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1.5 text-[10px] font-black text-white">
                  {e.unreadCount}
                </span>
              )}
              <ChevronRight size={16} className="shrink-0 text-slate-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label, badge }: { active: boolean; onClick: () => void; icon: typeof User; label: string; badge: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-bold transition ${
        active ? 'bg-gradient-to-r from-ember to-orange-500 text-white shadow-sm shadow-ember/30' : 'border border-slate-200 bg-white text-slate-500'
      }`}
    >
      <Icon size={15} /> {label}
      {badge > 0 && <span className={`rounded-full px-1.5 text-[10px] ${active ? 'bg-white/25' : 'bg-ember text-white'}`}>{badge}</span>}
    </button>
  );
}
