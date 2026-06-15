'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Power, Phone } from 'lucide-react';
import { useCouriers, useUpdateCourier } from '@/hooks/use-admin-couriers';
import { TextField, SaveBar } from '@/components/admin/form-fields';
import { SkeletonRow } from '@/components/ui/skeleton';

export default function EditCourierPage({ params }: { params: Promise<{ courierId: string }> }) {
  const { courierId } = use(params);
  const router = useRouter();
  const { data: couriers, isLoading } = useCouriers();
  const update = useUpdateCourier();
  const courier = couriers?.find((c) => c.id === courierId);

  const [fullName, setFullName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (isLoading) return <div className="space-y-2"><SkeletonRow /><SkeletonRow /></div>;
  if (!courier) return <div className="admin-card p-6 text-center text-sm text-slate-500">Kuryer topilmadi.</div>;

  const name = fullName ?? courier.fullName;
  const phoneVal = phone ?? courier.phoneNumber ?? '';

  function save() {
    setError('');
    update.mutate(
      { id: courier!.id, fullName: name.trim(), phoneNumber: phoneVal.trim() || undefined },
      {
        onSuccess: () => router.push('/admin/couriers'),
        onError: (e) => setError(e instanceof Error ? e.message : "Saqlashda xatolik. Qayta urinib ko'ring."),
      },
    );
  }

  function setActive(isActive: boolean) {
    setError('');
    update.mutate(
      { id: courier!.id, isActive },
      { onError: (e) => setError(e instanceof Error ? e.message : "O'zgartirib bo'lmadi. Qayta urinib ko'ring.") },
    );
  }

  return (
    <div className="space-y-4 pb-28">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
        <ChevronLeft size={18} /> Kuryerlar
      </button>

      {/* Holat — online/active */}
      <div className="admin-card flex items-center gap-3 p-4">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg font-black text-slate-500">
          {courier.fullName.charAt(0).toUpperCase()}
          <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white ${courier.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">{courier.fullName}</p>
          <p className="text-[11px] text-slate-400">
            {courier.isOnline ? '🟢 Onlayn' : '⚪️ Oflayn'} · {courier.activeAssignments} faol · {courier.totalDelivered} jami
          </p>
        </div>
      </div>

      {/* Online/Offline (isActive) — bir tugma bilan */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={update.isPending}
          onClick={() => setActive(true)}
          className={`flex flex-col items-center gap-1.5 rounded-3xl border p-4 transition active:scale-[0.99] ${courier.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'}`}
        >
          <Power size={20} /> <span className="text-sm font-bold">Faol (online)</span>
        </button>
        <button
          type="button"
          disabled={update.isPending}
          onClick={() => setActive(false)}
          className={`flex flex-col items-center gap-1.5 rounded-3xl border p-4 transition active:scale-[0.99] ${!courier.isActive ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 bg-white text-slate-500'}`}
        >
          <Power size={20} /> <span className="text-sm font-bold">Nofaol (offline)</span>
        </button>
      </div>

      {/* Tahrir */}
      <div className="admin-card space-y-3 p-4">
        <TextField label="To'liq ism" value={name} onChange={setFullName} placeholder="Ism Familiya" />
        <TextField label="Telefon" value={phoneVal} onChange={setPhone} placeholder="+998..." />
      </div>

      {courier.phoneNumber && (
        <a href={`tel:${courier.phoneNumber}`} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-sky-600 active:scale-[0.99]">
          <Phone size={16} /> Qo'ng'iroq qilish
        </a>
      )}

      {error && <p className="text-center text-xs text-rose-600">{error}</p>}
      <SaveBar label="Saqlash" onClick={save} loading={update.isPending} />
    </div>
  );
}
