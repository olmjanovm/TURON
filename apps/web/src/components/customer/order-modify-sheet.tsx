'use client';

import { useState } from 'react';
import {
  MapPin,
  Soup,
  CreditCard,
  MessageCircle,
  XCircle,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

/**
 * Buyurtmani o'zgartirish / bekor qilish bottom-sheet (FAZA 1).
 *
 * "Bekor qilish" tugmasi bosilganda darhol bekor qilmaydi — avval variantlar
 * chiqadi. F1'da faqat "Shunchaki bekor qilish" to'liq ishlaydi (reyting
 * ogohlantirishi bilan); qolgan 4 variant keyingi fazalarda ulanadi ("tez orada").
 */
export function OrderModifySheet({
  onClose,
  onConfirmCancel,
  onMessageAdmin,
  cancelling,
}: {
  onClose: () => void;
  onConfirmCancel: () => void;
  onMessageAdmin: () => void;
  cancelling: boolean;
}) {
  const [view, setView] = useState<'options' | 'cancel'>('options');
  const [notice, setNotice] = useState('');

  const soon = () => setNotice('Bu funksiya tez orada qo’shiladi 🔜');

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm"
      onClick={cancelling ? undefined : onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />

        {view === 'options' ? (
          <>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">Nima qilmoqchisiz?</h3>
            <p className="mb-4 mt-0.5 text-xs text-slate-500">
              Bekor qilishdan oldin — ehtimol shulardan biri yetarli
            </p>

            <div className="space-y-2">
              <OptionRow
                icon={MapPin}
                tint="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
                label="Boshqa manzilga yetkazish"
                desc="Manzilni xaritadan o’zgartirish"
                soon
                onClick={soon}
              />
              <OptionRow
                icon={Soup}
                tint="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
                label="Boshqa yoki ko’proq taom"
                desc="Mahsulot qo’shish yoki olib tashlash"
                soon
                onClick={soon}
              />
              <OptionRow
                icon={CreditCard}
                tint="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
                label="To’lov usulini o’zgartirish"
                desc="Naqd → karta (chek bilan)"
                soon
                onClick={soon}
              />
              <OptionRow
                icon={MessageCircle}
                tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                label="Adminga xabar yozish"
                desc="Operator bilan jonli suhbat"
                onClick={onMessageAdmin}
              />
              <OptionRow
                icon={XCircle}
                tint="bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300"
                label="Buyurtmani bekor qilish"
                desc="Buyurtmani to’liq bekor qilaman"
                danger
                onClick={() => {
                  setNotice('');
                  setView('cancel');
                }}
              />
            </div>

            {notice && <p className="mt-3 text-center text-xs font-semibold text-amber-600">{notice}</p>}

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-2xl py-3 text-sm font-bold text-slate-500 active:scale-[0.99]"
            >
              Yopish
            </button>
          </>
        ) : (
          <>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/15">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">Rostdan bekor qilasizmi?</h3>

            <div className="mt-3 space-y-2 rounded-2xl bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              <p>
                ⚠️ Buyurtmani tez-tez bekor qilish <b>reytingingizga</b> ta’sir qiladi.
              </p>
              <p>
                Reyting pasaysa, kelajakda <b>naqd pul</b> bilan buyurtma berish imkoni cheklanib,
                faqat <b>oldindan to’lov</b> qolishi mumkin.
              </p>
              <p>Manzil, taom yoki to’lovni o’zgartirish ham mumkin edi — ishonchingiz komilmi?</p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setView('options')}
                disabled={cancelling}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 active:scale-[0.99] disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
              >
                Orqaga
              </button>
              <button
                type="button"
                onClick={onConfirmCancel}
                disabled={cancelling}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 py-3 text-sm font-black text-white active:scale-95 disabled:opacity-60"
              >
                {cancelling ? <Loader2 size={16} className="animate-spin" /> : 'Ha, bekor qilaman'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OptionRow({
  icon: Icon,
  label,
  desc,
  tint,
  soon,
  danger,
  onClick,
}: {
  icon: typeof MapPin;
  label: string;
  desc: string;
  tint: string;
  soon?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
        danger
          ? 'border-red-200 bg-red-50/60 dark:border-red-500/30 dark:bg-red-500/10'
          : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50'
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={`text-sm font-bold ${danger ? 'text-red-600 dark:text-red-300' : 'text-slate-900 dark:text-slate-100'}`}>
            {label}
          </span>
          {soon && (
            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              tez orada
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[11px] text-slate-400">{desc}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-slate-300" />
    </button>
  );
}
