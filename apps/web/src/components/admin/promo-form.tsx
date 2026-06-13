'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { useSavePromo, useDeletePromo, type PromoPayload, type AdminPromo } from '@/hooks/use-admin-catalog';
import { TextField, SelectField, Toggle, SaveBar } from './form-fields';

export function PromoForm({ initial }: { initial?: AdminPromo }) {
  const router = useRouter();
  const save = useSavePromo(initial?.id);
  const del = useDeletePromo();

  const [code, setCode] = useState(initial?.code ?? '');
  const [discountType, setDiscountType] = useState(initial?.discountType ?? 'PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(String(initial?.discountValue ?? ''));
  const [minOrderValue, setMinOrderValue] = useState(String(initial?.minOrderValue ?? 0));
  const [usageLimit, setUsageLimit] = useState(String(initial?.usageLimit ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [isFirstOrderOnly, setIsFirstOrderOnly] = useState(Boolean(initial?.isFirstOrderOnly));
  const [error, setError] = useState('');

  function submit() {
    setError('');
    if (!code.trim()) return setError('Kod majburiy');
    const dv = Number(discountValue) || 0;
    if (dv <= 0) return setError('Chegirma qiymati 0 dan katta bo\'lsin');
    const payload: PromoPayload = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: dv,
      minOrderValue: Number(minOrderValue) || 0,
      usageLimit: Number(usageLimit) || 0,
      isActive,
      isFirstOrderOnly,
      startDate: initial ? undefined : new Date().toISOString(),
    };
    save.mutate(payload, { onSuccess: () => router.push('/admin/promos') });
  }

  return (
    <div className="space-y-4 pb-28">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
        <ChevronLeft size={18} /> Promokodlar
      </button>
      <h1 className="text-lg font-black text-slate-900">{initial ? 'Promokodni tahrirlash' : 'Yangi promokod'}</h1>

      <div className="admin-card space-y-3 p-4">
        <TextField label="Kod" value={code} onChange={(v) => setCode(v.toUpperCase())} placeholder="TURON10" />
        <SelectField
          label="Chegirma turi"
          value={discountType}
          onChange={setDiscountType}
          options={[
            { value: 'PERCENTAGE', label: 'Foiz (%)' },
            { value: 'FIXED_AMOUNT', label: "So'mda (fixed)" },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField label={discountType === 'PERCENTAGE' ? 'Foiz' : "Summa (so'm)"} value={discountValue} onChange={setDiscountValue} placeholder="10" numeric />
          <TextField label="Min. buyurtma" value={minOrderValue} onChange={setMinOrderValue} placeholder="0" numeric />
        </div>
        <TextField label="Limit (0 = cheksiz)" value={usageLimit} onChange={setUsageLimit} placeholder="0" numeric />
      </div>

      <div className="admin-card space-y-1 p-2">
        <Toggle label="Faol" value={isActive} onChange={setIsActive} />
        <Toggle label="Faqat birinchi buyurtmaga" value={isFirstOrderOnly} onChange={setIsFirstOrderOnly} />
      </div>

      {initial && (
        <button
          type="button"
          disabled={del.isPending}
          onClick={() => { if (confirm('Promokod o\'chirilsinmi?')) del.mutate(initial.id, { onSuccess: () => router.push('/admin/promos') }); }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white py-3 text-sm font-bold text-rose-600 active:scale-[0.99]"
        >
          <Trash2 size={16} /> O'chirish
        </button>
      )}

      {error && <p className="text-center text-xs text-rose-600">{error}</p>}
      <SaveBar label={initial ? 'Saqlash' : 'Qo\'shish'} onClick={submit} loading={save.isPending} />
    </div>
  );
}
