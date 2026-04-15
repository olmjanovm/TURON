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
      <div className="rounded-[12px] border border-emerald-300/18 bg-emerald-400/10 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-emerald-400/18 text-emerald-100">
              <Tag size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200/72">Promokod faol</p>
              <p className="mt-1 text-sm font-black text-white">{appliedPromo.code}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.08] text-white/74"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-white/8 bg-white/[0.04] p-3">
      {!compact ? (
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">Chegirma kodi</p>
          <h3 className="mt-1.5 text-base font-black tracking-tight text-white">Kod kiriting</h3>
        </div>
      ) : null}

      <form onSubmit={handleApply} className="relative flex items-center">
        <div className="pointer-events-none absolute left-4 text-white/36">
          <Tag size={18} />
        </div>
        <input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="Kod kiriting"
          className={`h-12 w-full rounded-[12px] border bg-white/[0.04] pl-12 pr-12 text-sm font-bold text-white outline-none placeholder:font-semibold placeholder:text-white/28 ${
            feedback && !feedback.success ? 'border-red-300/20' : 'border-white/8'
          }`}
        />
        <button
          type="submit"
          disabled={!code.trim() || validatePromoMutation.isPending}
          className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-950 disabled:bg-white/10 disabled:text-white/32"
        >
          {validatePromoMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
        </button>
      </form>

      {feedback ? (
        <div className={`mt-3 rounded-[12px] px-3 py-2 text-xs font-semibold ${feedback.success ? 'bg-emerald-400/12 text-emerald-200' : 'bg-red-400/10 text-red-200'}`}>
          {feedback.message}
        </div>
      ) : null}
    </div>
  );
};
