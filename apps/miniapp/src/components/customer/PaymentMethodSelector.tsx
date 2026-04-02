import React from 'react';
import { Banknote, CheckCircle2, CreditCard, Smartphone } from 'lucide-react';
import { PaymentMethod } from '../../data/types';
import { useCheckoutStore } from '../../store/useCheckoutStore';

const methods = [
  {
    id: PaymentMethod.CASH,
    label: 'Naqd pul',
    description: 'Buyurtma topshirilganda tolaysiz',
    note: 'MVP uchun eng sodda va ishonchli usul',
    icon: Banknote,
    accent: 'from-emerald-400 to-emerald-500',
    disabled: false,
  },
  {
    id: PaymentMethod.EXTERNAL_PAYMENT,
    label: 'Click / Payme',
    description: 'Tashqi ilova orqali tolash',
    note: 'Qaytgach admin tomonidan tekshiriladi',
    icon: Smartphone,
    accent: 'from-sky-400 to-indigo-500',
    disabled: false,
  },
  {
    id: PaymentMethod.MANUAL_TRANSFER,
    label: "Qo'lda o'tkazma",
    description: 'Karta raqamiga alohida tolov',
    note: 'Keyingi bosqichda faollashadi',
    icon: CreditCard,
    accent: 'from-slate-500 to-slate-600',
    disabled: true,
  },
];

const PaymentMethodSelector: React.FC = () => {
  const { paymentMethod, setPaymentMethod } = useCheckoutStore();

  return (
    <div className="space-y-3">
      {methods.map((method) => {
        const Icon = method.icon;
        const isSelected = paymentMethod === method.id;

        return (
          <button
            key={method.id}
            type="button"
            disabled={method.disabled}
            onClick={() => setPaymentMethod(method.id as PaymentMethod)}
            className={`relative flex w-full items-center gap-3 rounded-[12px] border p-3 text-left transition-all active:scale-[0.985] ${
              method.disabled
                ? 'cursor-not-allowed border-white/8 bg-white/[0.03] opacity-60'
                : isSelected
                  ? 'border-amber-300/25 bg-amber-400/10 shadow-[0_12px_24px_rgba(245,158,11,0.14)]'
                  : 'border-white/8 bg-white/[0.04]'
            }`}
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br ${isSelected ? 'from-amber-300 to-orange-500 text-slate-950' : `${method.accent} text-white`}`}>
              <Icon size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black tracking-tight text-white">{method.label}</h4>
                {method.disabled ? (
                  <span className="rounded-full border border-white/8 bg-white/[0.06] px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/56">
                    keyin
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs font-semibold text-white/62">{method.description}</p>
              <p className="mt-1.5 text-[11px] font-semibold text-white/38">{method.note}</p>
            </div>

            {isSelected ? (
              <div className="absolute right-4 top-4 text-amber-300">
                <CheckCircle2 size={22} />
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

export default PaymentMethodSelector;
