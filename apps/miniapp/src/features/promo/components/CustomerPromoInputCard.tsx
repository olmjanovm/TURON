import React, { useEffect, useState } from 'react';
import { ArrowRight, Loader2, Tag, X } from 'lucide-react';
import { useCartStore } from '../../../store/useCartStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useValidatePromo } from '../../../hooks/queries/usePromos';

interface Props {
  subtotal: number;
  compact?: boolean;
}

export const CustomerPromoInputCard: React.FC<Props> = ({ subtotal, compact = false }) => {
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const validatePromoMutation = useValidatePromo();
  const { appliedPromo, setPromo } = useCartStore();
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!appliedPromo) {
      return;
    }

    if (subtotal >= appliedPromo.minOrderValue) {
      return;
    }

    setPromo(null);
    setFeedback({
      success: false,
      message: `Promokod ishlashi uchun minimal summa ${appliedPromo.minOrderValue.toLocaleString()} so'm bo'lishi kerak`,
    });
  }, [appliedPromo, setPromo, subtotal]);

  const handleApply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      return;
    }

    try {
      const result = await validatePromoMutation.mutateAsync({ code, subtotal, userId });
      setFeedback({ success: result.isValid, message: result.message });

      if (result.isValid && result.promo) {
        setPromo({
          ...result.promo,
          discountAmount: result.discountAmount,
        });
        setCode(result.promo.code);
        return;
      }

      setPromo(null);
    } catch (error) {
      setFeedback({
        success: false,
        message: error instanceof Error ? error.message : 'Promokod tekshirilmadi',
      });
      setPromo(null);
    }
  };

  const handleRemove = () => {
    setCode('');
    setFeedback(null);
    setPromo(null);
  };

  if (appliedPromo) {
    return (
      <div className="rounded-[16px] border border-emerald-300/40 bg-emerald-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-emerald-100 text-emerald-600">
              <Tag size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700/72">Promokod faol</p>
              <p className="mt-1 text-sm font-black text-slate-950">{appliedPromo.code}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 active:scale-95 transition-transform"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-slate-200 bg-white p-3">
      {!compact ? (
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Chegirma kodi</p>
          <h3 className="mt-1.5 text-base font-black tracking-tight text-slate-950">Kod kiriting</h3>
        </div>
      ) : null}

      <form onSubmit={handleApply} className="relative flex items-center">
        <div className="pointer-events-none absolute left-4 text-slate-400">
          <Tag size={18} />
        </div>
        <input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="Kod kiriting"
          className={`h-12 w-full rounded-[12px] border bg-white pl-12 pr-12 text-sm font-bold text-slate-950 outline-none placeholder:font-semibold placeholder:text-slate-400 focus:border-amber-300 transition-colors ${feedback && !feedback.success ? 'border-red-300' : 'border-slate-200'
            }`}
        />
        <button
          type="submit"
          disabled={!code.trim() || validatePromoMutation.isPending}
          className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white disabled:bg-slate-100 disabled:text-slate-400 active:scale-95 transition-transform"
        >
          {validatePromoMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
        </button>
      </form>

      {feedback ? (
        <div className={`mt-3 rounded-[12px] px-3 py-2 text-xs font-semibold ${feedback.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {feedback.message}
        </div>
      ) : null}
    </div>
  );
};
