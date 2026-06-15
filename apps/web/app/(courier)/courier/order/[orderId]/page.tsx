'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronRight, Headset, Loader2, Map, MapPin, Package, Phone, Send, X,
} from 'lucide-react';
import {
  useCourierOrder,
  useAdvanceStage,
  useDeclineOrder,
  useReportProblem,
  getNextStageAction,
} from '@/hooks/use-courier';
import { StageTracker } from '@/components/courier/stage-tracker';
import { AdminContactSheet } from '@/components/courier/admin-contact-sheet';
import { focusScrollIntoView } from '@/hooks/use-keyboard';

const PAYMENT_LABEL: Record<string, string> = {
  CASH: 'Naqd',
  CARD: 'Karta',
  BANK_TRANSFER: 'O\'tkazma',
  CLICK: 'Click',
  PAYME: 'Payme',
};

export default function CourierOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const { data: order, isLoading, isError, error, refetch } = useCourierOrder(orderId);
  const advance = useAdvanceStage();
  const decline = useDeclineOrder();
  const reportProblem = useReportProblem();
  const [problemText, setProblemText] = useState('');
  const [problemSent, setProblemSent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-[#c62020]" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-4 px-4 pt-5">
        <Link href="/courier/orders" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
          <ArrowLeft size={16} /> Orqaga
        </Link>
        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <p className="text-base font-black text-slate-900">Bu buyurtma eskirgan</p>
          <p className="mt-1 text-sm text-slate-500">
            Buyurtmani ochib bo&apos;lmadi. Ma&apos;lumot kerak bo&apos;lsa, admin bilan bog&apos;laning.
          </p>
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] px-5 py-2.5 text-sm font-black text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.5)] active:scale-95"
          >
            <Headset size={16} /> Admin bilan bog&apos;lanish
          </button>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 active:scale-95"
          >
            Qayta urinish
          </button>
        </div>

        {contactOpen && (
          <AdminContactSheet orderId={orderId} expired onClose={() => setContactOpen(false)} />
        )}
      </div>
    );
  }

  const isAssigned = order.courierAssignmentStatus === 'ASSIGNED';
  const stage = order.deliveryStage ?? 'IDLE';
  const isDelivered = stage === 'DELIVERED';
  const nextAct = getNextStageAction(stage);
  const isLastAction = nextAct?.next === 'DELIVERED';
  const total = (order.total ?? 0) + (order.deliveryFee ?? 0);
  const address = order.customerAddress?.addressText ?? order.deliveryAddress;

  const handleAdvance = () => {
    if (!nextAct || advance.isPending) return;
    if (isLastAction && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    advance.mutate(
      { orderId: order.id, nextStage: nextAct.next },
      {
        onSuccess: () => {
          if (nextAct.next === 'DELIVERED') {
            setTimeout(() => router.push('/courier/orders'), 1200);
          }
        },
      },
    );
  };

  const handleDecline = () => {
    if (!confirm('Buyurtmani rad qilasizmi?')) return;
    decline.mutate(order.id, {
      onSuccess: () => router.push('/courier/orders'),
    });
  };

  const handleAccept = () => {
    advance.mutate({ orderId: order.id, nextStage: 'GOING_TO_RESTAURANT' });
  };

  const handleProblem = () => {
    const text = problemText.trim();
    if (text.length < 5) return;
    reportProblem.mutate(
      { orderId: order.id, text },
      {
        onSuccess: () => {
          setProblemText('');
          setProblemSent(true);
        },
      },
    );
  };

  return (
    <div className="space-y-4 px-4 pb-6 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/courier/orders"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-lg font-black text-slate-900">#{order.orderNumber}</p>
          {order.customerName && (
            <p className="truncate text-xs text-slate-500">{order.customerName}</p>
          )}
        </div>
        {!isAssigned && !isDelivered ? (
          <Link
            href={`/courier/map/${order.id}`}
            aria-label="Xarita"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.45)] active:scale-95"
          >
            <Map size={18} />
          </Link>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Stage tracker */}
      {!isAssigned && (
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Holat</p>
          <StageTracker current={stage} />
        </div>
      )}

      {/* Accept / Decline (for new orders) */}
      {isAssigned ? (
        <div className="space-y-2">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black text-amber-900">Yangi buyurtma keldi</p>
            <p className="mt-0.5 text-xs text-amber-800/80">
              Qabul qilsangiz, marshrut boshlanadi. Rad etsangiz, boshqa kuryerga yuboriladi.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDecline}
              disabled={decline.isPending}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 active:scale-95 disabled:opacity-50"
            >
              {decline.isPending ? <Loader2 size={16} className="animate-spin" /> : <><X size={16} /> Rad etish</>}
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={advance.isPending}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-sm font-black text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.55)] active:scale-95 disabled:opacity-50"
            >
              {advance.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Qabul qilish</>}
            </button>
          </div>
        </div>
      ) : !isDelivered ? (
        confirming ? (
          <div className="space-y-2 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
              <p className="text-sm font-black text-amber-900">Haqiqatan topshirdingizmi?</p>
              <p className="mt-0.5 text-xs text-amber-800/80">Bu amaliyotni bekor qilib bo&apos;lmaydi</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 active:scale-95"
              >
                Yo&apos;q
              </button>
              <button
                type="button"
                onClick={handleAdvance}
                disabled={advance.isPending}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-black text-white shadow-[0_8px_18px_-6px_rgba(16,185,129,0.55)] active:scale-95 disabled:opacity-50"
              >
                {advance.isPending ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={17} /> Ha, topshirdim</>}
              </button>
            </div>
          </div>
        ) : (
          nextAct && (
            <button
              type="button"
              onClick={handleAdvance}
              disabled={advance.isPending}
              className={`flex h-16 w-full items-center justify-center gap-2 rounded-3xl text-base font-black shadow-lg active:scale-[0.98] disabled:opacity-50 ${
                isLastAction
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_12px_24px_-8px_rgba(198,32,32,0.55)]'
              }`}
            >
              {advance.isPending ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <>
                  <span>{nextAct.label}</span>
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          )
        )
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <CheckCircle2 size={28} className="shrink-0 text-emerald-600" />
            <div>
              <p className="text-base font-black text-emerald-900">Buyurtma topshirildi</p>
              <p className="text-xs text-emerald-700">Muvaffaqiyatli yakunlandi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-black text-slate-700 shadow-sm active:scale-[0.99]"
          >
            <Headset size={16} className="text-[#c62020]" /> Bu buyurtma haqida admin bilan bog&apos;lanish
          </button>
        </div>
      )}

      {/* Customer */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mijoz</p>
            <p className="mt-0.5 text-base font-black text-slate-900">{order.customerName || 'Mijoz'}</p>
            {address && (
              <div className="mt-1.5 flex items-start gap-1.5">
                <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
                <p className="text-xs leading-snug text-slate-500">{address}</p>
              </div>
            )}
          </div>
          {order.customerPhone && (
            <a
              href={`tel:${order.customerPhone}`}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.5)] active:scale-95"
            >
              <Phone size={18} />
            </a>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-bold text-slate-500">To&apos;lov:</p>
          <p className="text-xs font-black text-slate-900">
            {PAYMENT_LABEL[order.paymentMethod ?? ''] ?? order.paymentMethod ?? '—'}
          </p>
          <p className="ml-auto text-sm font-black text-slate-900 tabular-nums">
            {total.toLocaleString('uz-UZ')} so&apos;m
          </p>
        </div>

        {order.note && (
          <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Izoh</p>
            <p className="mt-0.5 text-xs text-amber-900">{order.note}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Buyurtma · {order.items.length} ta
        </p>
        <div className="space-y-2">
          {order.items.map((it, idx) => (
            <div key={`${it.id}-${idx}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <Package size={14} className="text-slate-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-900">{it.name}</p>
                <p className="text-[11px] text-slate-500">{it.price.toLocaleString('uz-UZ')} so&apos;m</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-500">{it.quantity}×</p>
                <p className="text-sm font-black text-slate-900 tabular-nums">
                  {(it.price * it.quantity).toLocaleString('uz-UZ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Problem report */}
      {!isDelivered && !isAssigned && (
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-500" />
            <p className="text-sm font-black text-slate-900">Muammo bormi?</p>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Manzil topilmasa yoki mijoz bilan aloqa bo&apos;lmasa yozing
          </p>
          {problemSent ? (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <p className="text-sm font-bold text-emerald-700">Operatorga yuborildi</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                onFocus={focusScrollIntoView}
                placeholder="Muammoni yozing..."
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#c62020]"
              />
              <button
                type="button"
                onClick={handleProblem}
                disabled={reportProblem.isPending || problemText.trim().length < 5}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.5)] disabled:opacity-40"
              >
                {reportProblem.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          )}
        </div>
      )}

      {contactOpen && (
        <AdminContactSheet
          orderId={order.id}
          orderNumber={order.orderNumber}
          onClose={() => setContactOpen(false)}
        />
      )}
    </div>
  );
}
