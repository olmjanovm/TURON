import React, { useState } from 'react';
import { Tag, ArrowRight, X, Check } from 'lucide-react';
import { usePromoStore } from '../../../store/usePromoStore';
import { validatePromo } from '../discountEngine';
import { PromoValidationResult } from '../types';
import { useCartStore } from '../../../store/useCartStore';

interface Props {
  subtotal: number;
}

export const CustomerPromoInputCard: React.FC<Props> = ({ subtotal }) => {
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<PromoValidationResult | null>(null);
  
  const { getPromoByCode } = usePromoStore();
  const { appliedPromo, setPromo } = useCartStore();

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const promo = getPromoByCode(code);
    const result = validatePromo(promo, subtotal);
    
    setFeedback(result);
    
    if (result.success && result.promo) {
      setPromo(result.promo);
    } else {
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
      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <Tag size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Promokod faol</p>
            <p className="font-black text-slate-800">{appliedPromo.code}</p>
          </div>
        </div>
        <button 
          onClick={handleRemove}
          className="w-10 h-10 bg-white/50 text-emerald-700 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
        >
          <X size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleApply} className="relative flex items-center">
        <div className="absolute left-4 text-slate-400">
          <Tag size={20} />
        </div>
        <input 
          type="text" 
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Promokodni kiriting"
          className={`w-full h-14 pl-12 pr-14 bg-white border-2 rounded-2xl text-[15px] font-black uppercase tracking-widest text-slate-800 placeholder:text-slate-400 placeholder:normal-case placeholder:font-medium placeholder:tracking-normal focus:outline-none transition-colors ${
            feedback && !feedback.success ? 'border-red-200 focus:border-red-400' : 'border-slate-100 focus:border-indigo-400'
          }`}
        />
        <button 
          type="submit"
          disabled={!code.trim()}
          className="absolute right-2 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center disabled:bg-slate-200 disabled:text-slate-400 active:scale-90 transition-all"
        >
          <ArrowRight size={20} />
        </button>
      </form>
      
      {feedback && !feedback.success && (
        <div className="flex items-start gap-2 text-red-500 px-1">
          <X size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-xs font-bold leading-tight">{feedback.message}</p>
        </div>
      )}
    </div>
  );
};
