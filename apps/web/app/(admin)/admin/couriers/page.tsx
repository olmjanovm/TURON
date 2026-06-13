'use client';

import { useState } from 'react';
import { Phone, Power, UserPlus, Loader2, X } from 'lucide-react';
import { useCouriers, useToggleCourier, useCreateCourier } from '@/hooks/use-admin-couriers';
import { SkeletonRow } from '@/components/ui/skeleton';

export default function AdminCouriersPage() {
  const { data: couriers, isLoading, isError } = useCouriers();
  const toggle = useToggleCourier();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-slate-900">
          Kuryerlar {couriers ? `(${couriers.length})` : ''}
        </h2>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-ember to-orange-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-ember/30 active:scale-95"
        >
          <UserPlus size={14} /> Qo'shish
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : isError ? (
        <div className="admin-card p-6 text-center text-sm text-slate-500">Yuklashda xatolik.</div>
      ) : (couriers ?? []).length === 0 ? (
        <p className="admin-card p-8 text-center text-sm text-slate-400">Kuryer yo'q</p>
      ) : (
        <div className="space-y-2">
          {(couriers ?? []).map((c) => (
            <div key={c.id} className="admin-card flex items-center gap-3 p-4">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-500">
                {c.fullName.charAt(0).toUpperCase()}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${
                    c.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{c.fullName}</p>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                  {c.phoneNumber && (
                    <span className="inline-flex items-center gap-1">
                      <Phone size={11} /> {c.phoneNumber}
                    </span>
                  )}
                  <span>· {c.activeAssignments} faol</span>
                  <span>· {c.completedToday} bugun</span>
                </div>
              </div>
              <button
                type="button"
                disabled={toggle.isPending}
                onClick={() => toggle.mutate({ id: c.id, isActive: !c.isActive })}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition active:scale-90 ${
                  c.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                }`}
                aria-label="Faollashtirish"
              >
                <Power size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && <CreateCourierSheet onClose={() => setShowForm(false)} />}
    </div>
  );
}

function CreateCourierSheet({ onClose }: { onClose: () => void }) {
  const create = useCreateCourier();
  const [telegramId, setTelegramId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const submit = () => {
    if (!telegramId.trim() || !fullName.trim()) return;
    create.mutate(
      { telegramId: telegramId.trim(), fullName: fullName.trim(), phoneNumber: phoneNumber.trim() || undefined, isActive: true },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[480px] rounded-t-3xl bg-white p-5 pb-8"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 24px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Yangi kuryer</h3>
          <button onClick={onClose} className="text-slate-400"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <Field label="Telegram ID" value={telegramId} onChange={setTelegramId} placeholder="123456789" />
          <Field label="To'liq ism" value={fullName} onChange={setFullName} placeholder="Ism Familiya" />
          <Field label="Telefon" value={phoneNumber} onChange={setPhoneNumber} placeholder="+998..." />
        </div>
        {create.isError && <p className="mt-2 text-xs text-rose-600">Saqlashda xatolik.</p>}
        <button
          type="button"
          disabled={create.isPending}
          onClick={submit}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-ember to-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-ember/30 active:scale-[0.99] disabled:opacity-60"
        >
          {create.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
          Saqlash
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-ember"
      />
    </label>
  );
}
