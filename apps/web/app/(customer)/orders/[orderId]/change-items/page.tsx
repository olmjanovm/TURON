'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import { useOrderDetail, useChangeOrderItems } from '@/hooks/use-customer';
import { useProducts } from '@/hooks/use-menu';
import { useRestaurantIdentity } from '@/hooks/use-restaurant-identity';

interface Line {
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChangeItemsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const { data: order } = useOrderDetail(orderId);
  const { data: products } = useProducts();
  const { cardNumber } = useRestaurantIdentity();
  const change = useChangeOrderItems(orderId);

  const [lines, setLines] = useState<Record<string, Line> | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState('');
  const [receipt, setReceipt] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (order && lines === null) {
      const init: Record<string, Line> = {};
      for (const it of order.items) {
        init[it.productId] = {
          name: it.name,
          price: it.price,
          imageUrl: it.imageUrl,
          quantity: it.quantity,
        };
      }
      setLines(init);
    }
  }, [order, lines]);

  if (!order || lines === null) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={26} className="animate-spin text-[#c62020]" />
      </div>
    );
  }

  const setQty = (id: string, qty: number) =>
    setLines((prev) => {
      const next = { ...(prev ?? {}) };
      if (qty <= 0) delete next[id];
      else next[id] = { ...next[id], quantity: qty };
      return next;
    });

  const addProduct = (p: { id: string; name: string; price: number; imageUrl?: string }) =>
    setLines((prev) => {
      const next = { ...(prev ?? {}) };
      const ex = next[p.id];
      next[p.id] = {
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl,
        quantity: (ex?.quantity ?? 0) + 1,
      };
      return next;
    });

  const entries = Object.entries(lines);
  const newSubtotal = entries.reduce((s, [, l]) => s + l.price * l.quantity, 0);
  const oldSubtotal = order.total;
  const delta = newSubtotal - oldSubtotal;
  const deliveryFee = order.deliveryFee ?? 0;
  const discount = order.discountAmount ?? 0;
  const newTotal = Math.max(0, newSubtotal + deliveryFee - discount);

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
    if (entries.length === 0) return setError("Kamida bitta mahsulot bo'lishi kerak");
    // Chek ixtiyoriy — bo'lmasa ham so'rov adminga ketadi, admin ko'rib tasdiqlaydi.
    const items = entries.map(([menuItemId, l]) => ({ menuItemId, quantity: l.quantity }));
    change.mutate(
      { items, receiptImageBase64: receipt || undefined },
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
          Admin tasdiqlagach buyurtmangiz tarkibi yangilanadi. Rahmat!
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

  const filtered = (products ?? []).filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="space-y-4 px-4 pb-40 pt-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-black text-slate-900 dark:text-slate-50">Tarkibni o&apos;zgartirish</h1>
      </div>

      {/* Joriy tanlov */}
      <div className="space-y-2">
        {entries.length === 0 && (
          <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400 dark:bg-slate-800">
            Mahsulot yo&apos;q — pastdan qo&apos;shing
          </p>
        )}
        {entries.map(([id, l]) => (
          <div
            key={id}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
              {l.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.imageUrl} alt={l.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">🍽️</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{l.name}</p>
              <p className="text-xs font-black text-slate-900 tabular-nums dark:text-slate-50">
                {(l.price * l.quantity).toLocaleString('uz-UZ')} so&apos;m
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setQty(id, l.quantity - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-slate-700 active:scale-90 dark:bg-slate-900 dark:text-slate-200"
              >
                {l.quantity === 1 ? <Trash2 size={13} className="text-rose-500" /> : <Minus size={13} />}
              </button>
              <span className="min-w-5 text-center text-sm font-black tabular-nums text-slate-900 dark:text-slate-100">
                {l.quantity}
              </span>
              <button
                type="button"
                onClick={() => setQty(id, l.quantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-slate-700 active:scale-90 dark:bg-slate-900 dark:text-slate-200"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mahsulot qo'shish */}
      <button
        type="button"
        onClick={() => setShowAdd((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#c62020]/40 bg-[#c62020]/5 py-3 text-sm font-bold text-[#c62020] active:scale-[0.99]"
      >
        <Plus size={16} /> {showAdd ? 'Yopish' : 'Mahsulot qo\'shish'}
      </button>

      {showAdd && (
        <div className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 dark:bg-slate-800">
            <Search size={15} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Qidirish..."
              className="flex-1 bg-transparent py-2.5 text-sm outline-none dark:text-slate-100"
            />
          </div>
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addProduct({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl })}
                className="flex w-full items-center gap-3 rounded-2xl p-2 text-left active:bg-slate-50 dark:active:bg-slate-800"
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">🍽️</div>
                  )}
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900 dark:text-slate-100">{p.name}</span>
                  <span className="block text-xs text-slate-500">{p.price.toLocaleString('uz-UZ')} so&apos;m</span>
                </span>
                <Plus size={16} className="shrink-0 text-[#c62020]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Row label="Mahsulotlar" value={newSubtotal} />
        {deliveryFee > 0 && <Row label="Yetkazish" value={deliveryFee} />}
        {discount > 0 && <Row label="Chegirma" value={-discount} />}
        <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />
        <Row label="Yangi jami" value={newTotal} bold />
        {delta !== 0 && (
          <div
            className={`mt-2 rounded-2xl px-3 py-2 text-sm font-bold ${
              delta > 0
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            }`}
          >
            {delta > 0
              ? `Qo'shimcha to'lov: ${delta.toLocaleString('uz-UZ')} so'm`
              : `Kamaydi: ${Math.abs(delta).toLocaleString('uz-UZ')} so'm`}
          </div>
        )}
      </div>

      {/* delta>0 → karta + chek */}
      {delta > 0 && (
        <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">
            Qo&apos;shimcha summani kartaga o&apos;tkazib, chekni yuklang. Admin tasdiqlaydi.
          </p>
          {cardNumber ? (
            <button
              type="button"
              onClick={copyCard}
              className="flex w-full items-center justify-between gap-2 rounded-2xl bg-slate-50 px-4 py-3 active:scale-[0.99] dark:bg-slate-800"
            >
              <span className="font-black tracking-wider text-slate-900 tabular-nums dark:text-slate-100">{cardNumber}</span>
              <span className="flex items-center gap-1 text-xs font-bold text-[#c62020]">
                {copied ? <><Check size={14} /> Olindi</> : <><Copy size={14} /> Nusxa</>}
              </span>
            </button>
          ) : (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              Karta raqami sozlanmagan — admin bilan bog&apos;laning.
            </p>
          )}
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
                <ImagePlus size={24} />
                <span className="text-xs font-semibold">Chek rasmini yuklash</span>
              </span>
            )}
          </button>
        </div>
      )}

      {error && <p className="text-center text-xs text-red-500">{error}</p>}

      {/* Sticky submit */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] border-t border-slate-100 bg-white/95 px-4 pt-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <button
          type="button"
          onClick={submit}
          disabled={change.isPending || entries.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] py-3.5 text-sm font-black text-white shadow-[0_12px_24px_-8px_rgba(198,32,32,0.55)] active:scale-[0.98] disabled:opacity-60"
        >
          {change.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
          So&apos;rovni yuborish
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 text-sm ${bold ? 'font-black' : ''}`}>
      <span className={bold ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500'}>{label}</span>
      <span className={`tabular-nums ${bold ? 'text-slate-900 dark:text-slate-50' : 'text-slate-700 dark:text-slate-300'}`}>
        {value.toLocaleString('uz-UZ')} so&apos;m
      </span>
    </div>
  );
}
