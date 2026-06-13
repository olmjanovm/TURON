'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Loader2, MapPin, Plus, Wallet, CreditCard } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { useCustomerPrefs } from '@/stores/customer-prefs-store';
import { useAddresses, useCreateOrder, useQuoteOrder, type QuoteResult } from '@/hooks/use-customer';
import { useT } from '@/lib/i18n/locale-context';
import { useKeyboard, focusScrollIntoView } from '@/hooks/use-keyboard';

type PaymentMethod = 'CASH' | 'MANUAL_TRANSFER';
// CASH = naqd, MANUAL_TRANSFER = bank o'tkazmasi (backend nomi)

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#c62020]" /></div>}>
      <CheckoutInner />
    </Suspense>
  );
}

function CheckoutInner() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const promoFromUrl = searchParams.get('promo') ?? undefined;

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const selectedAddressId = useCustomerPrefs((s) => s.selectedAddressId);
  const setSelectedAddress = useCustomerPrefs((s) => s.setSelectedAddress);
  const { data: addresses = [] } = useAddresses();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { isOpen: kbOpen, height: kbHeight } = useKeyboard();

  const quoteMutation = useQuoteOrder();
  const createMutation = useCreateOrder();

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items],
  );

  // Auto-select default address if none chosen
  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddress({
        id: def.id,
        label: def.label,
        addressText: def.addressText,
        latitude: def.latitude ?? undefined,
        longitude: def.longitude ?? undefined,
      });
    }
  }, [addresses, selectedAddressId, setSelectedAddress]);

  // Refetch quote when inputs change
  useEffect(() => {
    if (items.length === 0) return;
    const payload = {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      addressId: selectedAddressId ?? undefined,
      promoCode: promoFromUrl,
      paymentMethod,
    };
    quoteMutation.mutate(payload, {
      onSuccess: (data) => setQuote(data),
      onError: () => {
        setQuote({
          subtotal,
          deliveryFee: 0,
          discountAmount: 0,
          total: subtotal,
        });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedAddressId, promoFromUrl, paymentMethod]);

  if (items.length === 0) {
    return (
      <div className="px-4 pt-10 text-center">
        <p className="text-base font-bold">{t('cart.empty.title')}</p>
        <Link href="/" className="mt-3 inline-block text-sm font-bold text-[#c62020]">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const handleClickSubmit = () => {
    setError(null);
    if (!selectedAddressId) {
      setError(t('checkout.error.no_address'));
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    if (!selectedAddressId) return;
    createMutation.mutate(
      {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        addressId: selectedAddressId,
        promoCode: promoFromUrl,
        paymentMethod,
        note: note.trim() || undefined,
      },
      {
        onSuccess: (order) => {
          clearCart();
          setShowConfirm(false);
          router.replace(`/checkout/success/${order.id}`);
        },
        onError: (err) => {
          setShowConfirm(false);
          setError(err instanceof Error ? err.message : t('common.error'));
        },
      },
    );
  };

  const total = quote?.total ?? subtotal;

  return (
    <div className="space-y-4 px-4 pb-32 pt-4">
      <div className="flex items-center justify-between">
        <Link
          href="/cart"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-black text-slate-900 dark:text-slate-50">{t('checkout.title')}</h1>
        <div className="w-10" />
      </div>

      {/* Address */}
      <Section title={t('checkout.address.title')}>
        {selectedAddress ? (
          <Link
            href="/addresses?select=1"
            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-800"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white">
              <MapPin size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                {selectedAddress.label}
              </p>
              <p className="line-clamp-1 text-xs text-slate-500">{selectedAddress.addressText}</p>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </Link>
        ) : (
          <Link
            href="/addresses?select=1"
            className="flex items-center justify-between rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-3 py-4 text-sm font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
          >
            <span className="flex items-center gap-2">
              <Plus size={16} /> {t('checkout.address.choose')}
            </span>
            <ChevronRight size={16} />
          </Link>
        )}
      </Section>

      {/* Payment */}
      <Section title={t('checkout.payment.title')}>
        <div className="space-y-2">
          <PayOption
            active={paymentMethod === 'CASH'}
            onClick={() => setPaymentMethod('CASH')}
            icon={Wallet}
            label={t('checkout.payment.cash')}
          />
          <PayOption
            active={paymentMethod === 'MANUAL_TRANSFER'}
            onClick={() => setPaymentMethod('MANUAL_TRANSFER')}
            icon={CreditCard}
            label={t('checkout.payment.transfer')}
          />
        </div>
      </Section>

      {/* Note */}
      <Section title={t('checkout.note.title')}>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onFocus={focusScrollIntoView}
          placeholder={t('checkout.note.placeholder')}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#c62020] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </Section>

      {/* Summary */}
      <Section title={t('checkout.summary.title')}>
        <SumRow label={t('cart.subtotal')} value={quote?.subtotal ?? subtotal} />
        {(quote?.deliveryFee ?? 0) > 0 && (
          <SumRow label={t('cart.delivery_fee')} value={quote?.deliveryFee ?? 0} />
        )}
        {(quote?.discountAmount ?? 0) > 0 && (
          <SumRow
            label={t('cart.discount')}
            value={-(quote?.discountAmount ?? 0)}
            tone="text-emerald-600 dark:text-emerald-300"
          />
        )}
        <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />
        <SumRow label={t('cart.total')} value={total} bold />
      </Section>

      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:bg-red-500/15 dark:text-red-300">
          {error}
        </div>
      )}

      <div
        className="fixed inset-x-0 z-50 mx-auto w-full max-w-[480px] border-t border-slate-100 bg-white/95 px-4 pb-3 pt-3 backdrop-blur-xl transition-[bottom] duration-200 dark:border-slate-800 dark:bg-slate-950/95"
        style={{
          bottom: kbOpen ? kbHeight : 0,
          paddingBottom: kbOpen ? 12 : 'calc(env(safe-area-inset-bottom, 0px) + 86px)',
        }}
      >
        <button
          type="button"
          onClick={handleClickSubmit}
          disabled={createMutation.isPending}
          className="flex h-14 w-full items-center justify-between gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] px-5 text-base font-black text-white shadow-[0_12px_24px_-8px_rgba(198,32,32,0.55)] active:scale-[0.98] disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <Loader2 size={20} className="mx-auto animate-spin" />
          ) : (
            <>
              <span>{t('checkout.submit')}</span>
              <span className="tabular-nums">
                {total.toLocaleString('uz-UZ')} {t('common.currency')}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Confirm sheet */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-[480px] rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-50">
              {t('checkout.confirm.title')}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('checkout.confirm.desc')}
            </p>

            <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{t('common.address')}</span>
                <span className="line-clamp-1 max-w-[60%] text-right font-bold text-slate-900 dark:text-slate-100">
                  {selectedAddress?.addressText ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{t('orders.detail.payment')}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {paymentMethod === 'CASH' ? t('checkout.payment.cash') : t('checkout.payment.transfer')}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 dark:border-slate-700" />
              <div className="flex items-center justify-between text-base font-black">
                <span className="text-slate-900 dark:text-slate-50">{t('cart.total')}</span>
                <span className="tabular-nums text-slate-900 dark:text-slate-50">
                  {total.toLocaleString('uz-UZ')} {t('common.currency')}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={createMutation.isPending}
                className="flex h-13 items-center justify-center rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-black text-slate-700 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {t('checkout.confirm.no')}
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={createMutation.isPending}
                className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 py-3.5 text-sm font-black text-white shadow-[0_8px_18px_-6px_rgba(16,185,129,0.55)] active:scale-95 disabled:opacity-60"
              >
                {createMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  t('checkout.confirm.yes')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      {children}
    </div>
  );
}

function PayOption({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Wallet;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
        active
          ? 'border-[#c62020] bg-[#c62020]/5 dark:bg-[#c62020]/15'
          : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          active
            ? 'bg-gradient-to-br from-[#c62020] to-[#f97316] text-white'
            : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'
        }`}
      >
        <Icon size={16} />
      </div>
      <span
        className={`flex-1 text-sm font-bold ${
          active ? 'text-slate-900 dark:text-slate-50' : 'text-slate-700 dark:text-slate-200'
        }`}
      >
        {label}
      </span>
      <span
        className={`h-4 w-4 shrink-0 rounded-full border-2 ${
          active ? 'border-[#c62020] bg-[#c62020]' : 'border-slate-300'
        }`}
      />
    </button>
  );
}

function SumRow({ label, value, bold, tone }: { label: string; value: number; bold?: boolean; tone?: string }) {
  const t = useT();
  return (
    <div className={`flex items-center justify-between py-1 text-sm ${bold ? 'font-black' : ''}`}>
      <span className={bold ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500'}>{label}</span>
      <span
        className={`tabular-nums ${
          tone ?? (bold ? 'text-slate-900 dark:text-slate-50' : 'text-slate-700 dark:text-slate-300')
        }`}
      >
        {value.toLocaleString('uz-UZ')} {t('common.currency')}
      </span>
    </div>
  );
}
