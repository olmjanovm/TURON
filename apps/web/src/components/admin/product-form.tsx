'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ImagePlus, Loader2, Trash2, Check } from 'lucide-react';
import { useAdminCategories, useSaveProduct, useDeleteProduct, type ProductPayload } from '@/hooks/use-admin-catalog';
import type { MenuProduct } from '@/hooks/use-menu';
import { uploadProductImage } from '@/lib/image-upload';

export function ProductForm({ initial }: { initial?: MenuProduct }) {
  const router = useRouter();
  const { data: categories } = useAdminCategories();
  const save = useSaveProduct(initial?.id);
  const del = useDeleteProduct();

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [price, setPrice] = useState<string>(initial?.price != null ? String(initial.price) : '');
  const [oldPrice, setOldPrice] = useState<string>(initial?.oldPrice != null ? String(initial.oldPrice) : '');
  const [stockQuantity, setStockQuantity] = useState<string>(initial?.stockQuantity != null ? String(initial.stockQuantity) : '100');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [isNew, setIsNew] = useState(Boolean(initial?.isNew));
  const [isPopular, setIsPopular] = useState(Boolean(initial?.isPopular));

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const priceN = Number(price) || 0;
  const oldPriceN = Number(oldPrice) || 0;
  const discountPct = oldPriceN > priceN && priceN > 0 ? Math.round((1 - priceN / oldPriceN) * 100) : 0;

  const catList = categories ?? [];
  const effectiveCategory = categoryId || catList[0]?.id || '';

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rasm yuklanmadi');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function onSubmit() {
    setError('');
    if (!name.trim()) return setError('Nom majburiy');
    if (!effectiveCategory) return setError('Kategoriya tanlang');
    if (priceN <= 0) return setError('Narx 0 dan katta bo\'lsin');

    const payload: ProductPayload = {
      categoryId: effectiveCategory,
      name: name.trim(),
      description: description.trim(),
      price: priceN,
      // Schema oldPrice'ni .optional() kutadi (null EMAS) -> yo'q bo'lsa undefined
      oldPrice: oldPriceN > 0 ? oldPriceN : undefined,
      imageUrl: imageUrl || undefined,
      isActive,
      stockQuantity: Number(stockQuantity) || 0,
      isNew,
      isPopular,
    };
    save.mutate(payload, { onSuccess: () => router.push('/admin/menu') });
  }

  return (
    <div className="space-y-4 pb-28">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
        <ChevronLeft size={18} /> Menyu
      </button>

      <h1 className="text-lg font-black text-slate-900">{initial ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h1>

      {/* Rasm */}
      <div className="admin-card p-4">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400"
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : uploading ? (
            <Loader2 size={24} className="animate-spin text-ember" />
          ) : (
            <span className="flex flex-col items-center gap-2">
              <ImagePlus size={26} />
              <span className="text-xs font-semibold">Rasm yuklash (max 5MB)</span>
            </span>
          )}
          {uploading && imageUrl && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/60">
              <Loader2 size={22} className="animate-spin text-ember" />
            </span>
          )}
        </button>
        {discountPct > 0 && (
          <p className="mt-2 inline-flex rounded-full bg-ember/10 px-2.5 py-1 text-xs font-bold text-ember">
            −{discountPct}% chegirma
          </p>
        )}
      </div>

      {/* Maydonlar */}
      <div className="admin-card space-y-3 p-4">
        <TextField label="Nomi" value={name} onChange={setName} placeholder="Taom nomi" />
        <TextArea label="Tavsif" value={description} onChange={setDescription} placeholder="Qisqacha tavsif" />
        <SelectField label="Kategoriya" value={effectiveCategory} onChange={setCategoryId} options={catList.map((c) => ({ value: c.id, label: c.name }))} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Narx (so'm)" value={price} onChange={setPrice} placeholder="0" numeric />
          <TextField label="Eski narx (chegirma)" value={oldPrice} onChange={setOldPrice} placeholder="0" numeric />
        </div>
        <TextField label="Zaxira (stok)" value={stockQuantity} onChange={setStockQuantity} placeholder="100" numeric />
      </div>

      {/* Belgilar */}
      <div className="admin-card space-y-1 p-2">
        <Toggle label="Faol (sotuvda)" value={isActive} onChange={setIsActive} />
        <Toggle label="Yangi 🆕" value={isNew} onChange={setIsNew} />
        <Toggle label="Ommabop 🔥" value={isPopular} onChange={setIsPopular} />
      </div>

      {initial && (
        <button
          type="button"
          disabled={del.isPending}
          onClick={() => {
            if (confirm('Mahsulot o\'chirilsinmi?')) del.mutate(initial.id, { onSuccess: () => router.push('/admin/menu') });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white py-3 text-sm font-bold text-rose-600 active:scale-[0.99]"
        >
          <Trash2 size={16} /> O'chirish
        </button>
      )}

      {error && <p className="text-center text-xs text-rose-600">{error}</p>}

      {/* Pastki save bar (nav yashirin, shu sabab konflikt yo'q) */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="mx-auto w-full max-w-[480px]">
          <button
            type="button"
            disabled={save.isPending || uploading}
            onClick={onSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-ember to-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-ember/30 active:scale-[0.99] disabled:opacity-60"
          >
            {save.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {initial ? 'Saqlash' : 'Qo\'shish'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, numeric }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
      <input
        value={value}
        inputMode={numeric ? 'numeric' : 'text'}
        onChange={(e) => onChange(numeric ? e.target.value.replace(/[^0-9]/g, '') : e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-ember"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-ember"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-ember"
      >
        {options.length === 0 && <option value="">—</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 active:bg-slate-50">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-slate-200'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
