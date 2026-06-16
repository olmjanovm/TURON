'use client';

import { use, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Copy, CreditCard, ImagePlus, Loader2, ShieldCheck } from 'lucide-react';
import { useOrderDetail, useChangePaymentMethod } from '@/hooks/use-customer';
import { useRestaurantIdentity } from '@/hooks/use-restaurant-identity';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChangePaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const { data: order } = useOrderDetail(orderId);
  const { cardNumber } = useRestaurantIdentity();
  const change = useChangePaymentMethod(orderId);

  const [receipt, setReceipt] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const amount = order ? order.total + (order.deliveryFee ?? 0) - (order.discountAmount ?? 0) : 0;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      setReceipt(await fileToBase64(file));
    } catch {
      setError("Rasm o'qilmadi");
    }
  };

  const copyCard = () => {
    if (!cardNumber) return;
    navigator.clipboard?.writeText(cardNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const submit = () => {
    setError('');
    // Chek ixtiyoriy — bo'lmasa ham so'rov adminga ketadi, admin hal qiladi.
    change.mutate(
      { amount, receiptImageBase64: receipt || '' },
      {
        onSuccess: () => setSent(true),
        onError: (e) => setError(e instanceof Error ? e.message : 'Yuborilmadi'),
      },
    );
  };

  if (sent) {
    return (
      <div className="px-4 pt-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15">
          <ShieldCheck size={30} />
        </div>
        <h1 className="text-lg font-black text-slate-900 dark:text-slate-50">So&apos;rov yuborildi ✅</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
          Admin chekni tekshirib tasdiqlagach, to&apos;lov usuli <b>kartaga</b> o&apos;zgaradi.
          Buni kutib turishingiz shart emas. Rahmat!
        </p>
        <button
          type="button"
          onClick={() => router.push(`/orders/${orderId}`)}
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] px-6 text-sm font-black text-white active:scale-95"
        >
          Buyurtmaga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pb-28 pt-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-black text-slate-900 dark:text-slate-50">Kartaga o&apos;tkazish</h1>
      </div>

      {/* Summa */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">To&apos;lov summasi</p>
        <p className="mt-1 text-2xl font-black text-slate-900 tabular-nums dark:text-slate-50">
          {amount.toLocaleString('uz-UZ')} <span className="text-sm font-semibold text-slate-400">so&apos;m</span>
        </p>
      </div>

      {/* Karta raqami */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <CreditCard size={14} /> Karta raqami
        </p>
        {cardNumber ? (
          <button
            type="button"
            onClick={copyCard}
            className="flex w-full items-center justify-between gap-2 rounded-2xl bg-slate-50 px-4 py-3 active:scale-[0.99] dark:bg-slate-800"
          >
            <span className="font-black tracking-wider text-slate-900 tabular-nums dark:text-slate-100">{cardNumber}</span>
            <span className="flex items-center gap-1 text-xs font-bold text-[#c62020]">
              {copied ? <><Check size={14} /> Nusxa olindi</> : <><Copy size={14} /> Nusxa</>}
            </span>
          </button>
        ) : (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            Karta raqami hali sozlanmagan. Iltimos, admin bilan bog&apos;laning.
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Yuqoridagi kartaga <b>{amount.toLocaleString('uz-UZ')} so&apos;m</b> o&apos;tkazing, so&apos;ng chek rasmini yuklang.
        </p>
      </div>

      {/* Chek yuklash */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">To&apos;lov cheki (ixtiyoriy)</p>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800"
        >
          {receipt ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={receipt} alt="chek" className="h-full w-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-2">
              <ImagePlus size={26} />
              <span className="text-xs font-semibold">Chek rasmini yuklash</span>
            </span>
          )}
        </button>
      </div>

      {error && <p className="text-center text-xs text-red-500">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={change.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] py-3.5 text-sm font-black text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.55)] active:scale-[0.98] disabled:opacity-60"
      >
        {change.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
        Adminга yuborish
      </button>
      <p className="text-center text-[11px] text-slate-400">
        Admin chekni tekshirib tasdiqlaydi. Tasdiqlangach to&apos;lov usuli kartaga o&apos;zgaradi.
      </p>
    </div>
  );
}
