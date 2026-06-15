'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCartStore, type CartLine } from '@/stores/cart-store';
import { useValidatePromo } from '@/hooks/use-customer';
import { useT } from '@/lib/i18n/locale-context';
import { useKeyboard } from '@/hooks/use-keyboard';

interface AppliedPromo {
  code: string;
  discountAmount: number;
}

export default function CartPage() {
  const t = useT();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const clear = useCartStore((s) => s.clear);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoFocused, setPromoFocused] = useState(false);
  const validate = useValidatePromo();
  const { isOpen: kbOpen, height: kbHeight } = useKeyboard();
  // Promokod input fokuslanганda — kartani klaviatura USTIGA pin qilamiz (fixed).
  // Scroll'ga urinmaymiz (ishonchsiz edi); bu 100% ko'rinishni kafolatlaydi.
  const promoPinned = promoFocused && kbOpen;

  const handleApplyPromo = () => {
    setPromoError(null);
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    validate.mutate(code, {
      onSuccess: (data) => {
        if (data.valid) {
          const discount =
            data.discountAmount ??
            (data.discountPercent ? Math.round((total * data.discountPercent) / 100) : 0);
          setPromo({ code, discountAmount: discount });
          setPromoInput('');
        } else {
          setPromoError(data.message ?? t('cart.promo.invalid'));
        }
      },
      onError: () => setPromoError(t('cart.promo.invalid')),
    });
  };

  if (items.length === 0) {
    return (
      <div className="px-4 pt-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-black text-slate-900 dark:text-slate-50">{t('cart.title')}</h1>
          <div className="w-10" />
        </div>
        <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <ShoppingBag size={24} className="text-slate-400" />
          </div>
          <p className="text-base font-black text-slate-900 dark:text-slate-100">{t('cart.empty.title')}</p>
          <p className="mt-1 text-xs text-slate-500">{t('cart.empty.desc')}</p>
          <Link
            href="/"
            className="mt-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] px-6 text-sm font-black text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.55)] active:scale-95"
          >
            {t('cart.empty.cta')}
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = total;
  const discount = promo?.discountAmount ?? 0;
  const grand = Math.max(0, subtotal - discount);

  return (
    <div className="space-y-4 px-4 pb-32 pt-4">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-black text-slate-900 dark:text-slate-50">
          {t('cart.title')} · <span className="text-slate-400">{items.length}</span>
        </h1>
        <button
          type="button"
          onClick={() => {
            if (confirm(t('common.delete') + '?')) clear();
          }}
          aria-label="clear"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-red-500 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <CartItemRow key={item.productId} item={item} />
        ))}
      </div>

      {/* Promo — fokuslanganda klaviatura ustiga pin bo'ladi (fixed) */}
      <div
        className={`rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
          promoPinned
            ? 'fixed inset-x-0 z-[55] mx-auto w-[calc(100%-1.5rem)] max-w-[456px] shadow-2xl transition-[bottom] duration-200'
            : ''
        }`}
        style={promoPinned ? { bottom: kbHeight + 8 } : undefined}
      >
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {t('cart.promo.placeholder')}
        </p>
        {promo ? (
          <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-500/15">
            <span className="flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-300">
              <Check size={16} />
              {promo.code} · −{promo.discountAmount.toLocaleString('uz-UZ')} {t('common.currency')}
            </span>
            <button
              type="button"
              onClick={() => setPromo(null)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-500 dark:bg-slate-900"
              aria-label="remove promo"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                onFocus={() => setPromoFocused(true)}
                onBlur={() => setPromoFocused(false)}
                placeholder={t('cart.promo.placeholder')}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-900 outline-none focus:border-[#c62020] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={validate.isPending || !promoInput.trim()}
                className="rounded-2xl bg-slate-900 px-5 text-sm font-black text-white active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-900"
              >
                {validate.isPending ? <Loader2 size={14} className="animate-spin" /> : t('cart.promo.apply')}
              </button>
            </div>
            {promoError && <p className="mt-2 text-xs text-red-500">{promoError}</p>}
          </>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SumRow label={t('cart.subtotal')} value={subtotal} />
        {discount > 0 && (
          <SumRow label={t('cart.discount')} value={-discount} tone="text-emerald-600 dark:text-emerald-300" />
        )}
        <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />
        <SumRow label={t('cart.total')} value={grand} bold />
      </div>

      {/* Sticky checkout CTA — promokod yozayotganda (klaviatura ochiq) KERAK EMAS,
          shuning uchun pastga silliq yashirinadi. Faqat klaviatura + promo input qoladi.
          Klaviatura yopilsa CTA (va bottom nav) qaytadi. */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] border-t border-slate-100 bg-white/95 px-4 pb-3 pt-3 backdrop-blur-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-950/95"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 86px)',
          transform: kbOpen ? 'translateY(130%)' : 'translateY(0)',
          opacity: kbOpen ? 0 : 1,
          pointerEvents: kbOpen ? 'none' : 'auto',
        }}
      >
        <Link
          href={promo ? `/checkout?promo=${encodeURIComponent(promo.code)}` : '/checkout'}
          className="flex h-14 w-full items-center justify-between gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] px-5 text-base font-black text-white shadow-[0_12px_24px_-8px_rgba(198,32,32,0.55)] active:scale-[0.98]"
        >
          <span>{t('cart.checkout')}</span>
          <span className="tabular-nums">
            {grand.toLocaleString('uz-UZ')} {t('common.currency')}
          </span>
        </Link>
      </div>
    </div>
  );
}

function SumRow({ label, value, bold, tone }: { label: string; value: number; bold?: boolean; tone?: string }) {
  const t = useT();
  return (
    <div className={`flex items-center justify-between py-1.5 text-sm ${bold ? 'font-black' : ''}`}>
      <span className={`${bold ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500'}`}>{label}</span>
      <span
        className={`tabular-nums ${tone ?? (bold ? 'text-slate-900 dark:text-slate-50' : 'text-slate-700 dark:text-slate-300')}`}
      >
        {value.toLocaleString('uz-UZ')} {t('common.currency')}
      </span>
    </div>
  );
}

function CartItemRow({ item }: { item: CartLine }) {
  const t = useT();
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const startX = useRef<number | null>(null);
  const [translateX, setTranslateX] = useState(0);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = Math.min(0, e.touches[0].clientX - startX.current);
    setTranslateX(Math.max(dx, -88));
  };
  const onTouchEnd = () => {
    if (translateX < -60) setTranslateX(-88);
    else setTranslateX(0);
    startX.current = null;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <button
        type="button"
        onClick={() => remove(item.productId)}
        className="absolute right-0 top-0 flex h-full items-center justify-center rounded-3xl bg-red-500 px-4 text-white"
        style={{ width: 88 }}
        aria-label={t('common.delete')}
      >
        <Trash2 size={18} />
      </button>
      <div
        className="relative flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-3 shadow-sm transition-transform dark:border-slate-800 dark:bg-slate-900"
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Link href={`/product/${item.productId}`} className="flex shrink-0">
          <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl">🍽️</div>
            )}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
          <p className="mt-0.5 text-sm font-black text-slate-900 tabular-nums dark:text-slate-50">
            {(item.price * item.quantity).toLocaleString('uz-UZ')}{' '}
            <span className="text-[10px] font-medium text-slate-400">{t('common.currency')}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setQty(item.productId, item.quantity - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-slate-700 active:scale-90 dark:bg-slate-900 dark:text-slate-200"
            aria-label="-"
          >
            <Minus size={13} />
          </button>
          <span className="min-w-5 text-center text-sm font-black tabular-nums text-slate-900 dark:text-slate-100">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => setQty(item.productId, item.quantity + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-slate-700 active:scale-90 dark:bg-slate-900 dark:text-slate-200"
            aria-label="+"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
