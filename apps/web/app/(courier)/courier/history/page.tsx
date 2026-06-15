'use client';

import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, MapPin, MessageCircle, Package, Search, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useCourierHistory, type CourierHistoryItem } from '@/hooks/use-courier';
import { useOrdersChatUnread } from '@/hooks/use-courier-chat';
import { useContactedOrders } from '@/stores/courier-contacted-store';
import { Skeleton } from '@/components/ui/skeleton';
import { focusScrollIntoView } from '@/hooks/use-keyboard';

type Filter = 'ALL' | 'DELIVERED' | 'CANCELLED';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'DELIVERED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
        <CheckCircle2 size={10} /> Topshirildi
      </span>
    );
  }
  if (status === 'CANCELLED' || status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-600">
        <XCircle size={10} /> Bekor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">
      <Clock3 size={10} /> Faol
    </span>
  );
}

export default function CourierHistoryPage() {
  const { data: history = [], isLoading } = useCourierHistory();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');

  // Admin javobi badge'i — FAQAT kuryer bog'langan buyurtmalar uchun unread poll.
  const hydrate = useContactedOrders((s) => s.hydrate);
  const contactedIds = useContactedOrders((s) => s.ids);
  useEffect(() => { hydrate(); }, [hydrate]);
  const trackedIds = useMemo(() => {
    const inHistory = new Set(history.map((h) => h.orderId));
    return contactedIds.filter((id) => inHistory.has(id));
  }, [contactedIds, history]);
  const unreadByOrder = useOrdersChatUnread(trackedIds);

  const filtered = useMemo(() => {
    let list = history;
    if (filter === 'DELIVERED') list = list.filter((h) => h.orderStatus === 'DELIVERED');
    if (filter === 'CANCELLED') list = list.filter((h) => h.orderStatus === 'CANCELLED' || h.orderStatus === 'REJECTED');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (h) =>
          h.orderNumber?.toLowerCase().includes(q) ||
          h.customerName?.toLowerCase().includes(q) ||
          h.destinationAddress?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [history, filter, search]);

  const totalEarnings = useMemo(
    () => history.filter((h) => h.orderStatus === 'DELIVERED').reduce((s, h) => s + (h.deliveryFee ?? 0), 0),
    [history],
  );

  return (
    <div className="space-y-4 px-4 pb-6 pt-5">
      <div className="flex items-center gap-3">
        <Link
          href="/courier"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hisobot</p>
          <h1 className="text-xl font-black tracking-tight text-slate-900">Mening tarixim</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-lg">
        <p className="text-xs text-white/60">Jami daromad</p>
        <p className="mt-1 text-2xl font-black tabular-nums">
          {totalEarnings.toLocaleString('uz-UZ')}
          <span className="ml-1 text-sm font-semibold text-white/60">so&apos;m</span>
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold">
            {history.filter((h) => h.orderStatus === 'DELIVERED').length} ta yetkazildi
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={focusScrollIntoView}
          placeholder="Buyurtma raqami, manzil…"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#c62020]"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: 'ALL' as Filter, label: 'Hammasi' },
          { key: 'DELIVERED' as Filter, label: 'Topshirilgan' },
          { key: 'CANCELLED' as Filter, label: 'Bekor qilingan' },
        ].map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                active
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm space-y-2">
              <Skeleton className="h-4 w-1/3" rounded="rounded-md" />
              <Skeleton className="h-3 w-2/3" rounded="rounded-md" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
          <Package size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-black text-slate-700">Hech narsa topilmadi</p>
          <p className="mt-0.5 text-xs text-slate-500">Filtrlarni o&apos;zgartiring</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((h: CourierHistoryItem) => (
            <Link
              key={h.assignmentId}
              href={`/courier/order/${h.orderId}`}
              className="block rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-slate-900">#{h.orderNumber}</p>
                  {h.customerName && (
                    <p className="text-xs text-slate-500">{h.customerName}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {(unreadByOrder[h.orderId] ?? 0) > 0 && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-[#c62020] px-2 py-0.5 text-[10px] font-black text-white"
                      aria-label="Admindan yangi javob"
                    >
                      <MessageCircle size={10} /> {unreadByOrder[h.orderId]}
                    </span>
                  )}
                  <StatusBadge status={h.orderStatus} />
                </div>
              </div>
              {h.destinationAddress && (
                <div className="mt-2 flex items-start gap-1">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
                  <p className="line-clamp-2 text-[11px] text-slate-500">{h.destinationAddress}</p>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between text-xs">
                <p className="text-slate-400">{formatDate(h.deliveredAt ?? h.cancelledAt ?? h.assignedAt)}</p>
                <p className="font-black text-slate-900 tabular-nums">
                  {((h.total ?? 0) + (h.deliveryFee ?? 0)).toLocaleString('uz-UZ')} so&apos;m
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
