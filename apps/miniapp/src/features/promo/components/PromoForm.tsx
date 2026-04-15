import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { AdminPromo, DiscountTypeEnum, PromoFormData } from '../types';

interface Props {
  initialData?: AdminPromo;
  onSubmit: (data: PromoFormData) => void;
  title: string;
  isSubmitting?: boolean;
}

export const PromoForm: React.FC<Props> = ({
  initialData,
  onSubmit,
  title,
  isSubmitting = false,
}) => {
  const navigate = useNavigate();

  const [code, setCode] = useState(initialData?.code || '');
  const [titleStr, setTitleStr] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [discountType, setDiscountType] = useState<DiscountTypeEnum>(initialData?.discountType || DiscountTypeEnum.PERCENTAGE);
  const [discountValue, setDiscountValue] = useState(initialData?.discountValue || 0);
  const [minOrderValue, setMinOrderValue] = useState(initialData?.minOrderValue || 0);
  
  // Dates formatting to YYYY-MM-DD for input[type="date"]
  const [startDate, setStartDate] = useState(
    initialData?.startDate 
      ? new Date(initialData.startDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  
  const [endDate, setEndDate] = useState(
    initialData?.endDate 
      ? new Date(initialData.endDate).toISOString().split('T')[0] 
      : ''
  );
  
  const [usageLimit, setUsageLimit] = useState(initialData?.usageLimit || 0);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [isFirstOrderOnly, setIsFirstOrderOnly] = useState(initialData?.isFirstOrderOnly ?? false);
  const [targetUserId, setTargetUserId] = useState(initialData?.targetUserId ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!code.trim()) errs.code = 'Promokod kiritilishi shart';
    if (discountValue <= 0) errs.discountValue = 'Chegirma qiymati musbat bo\'lishi kerak';
    if (discountType === DiscountTypeEnum.PERCENTAGE && discountValue > 100) errs.discountValue = 'Foiz 100 dan oshmasligi kerak';
    if (endDate && new Date(endDate) < new Date(startDate)) errs.endDate = 'Tugash sanasi boshlanishidan kichik bo\'lmasligi kerak';
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    onSubmit({
      code: code.trim().toUpperCase(),
      title: titleStr.trim(),
      description: description.trim(),
      discountType,
      discountValue,
      minOrderValue,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate + 'T23:59:59.999Z').toISOString() : '',
      usageLimit,
      isActive,
      isFirstOrderOnly,
      targetUserId: targetUserId.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <button type="button" onClick={() => navigate(-1)} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
          <X size={20} />
        </button>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Promokod *</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Masalan: MEGA50"
            className={`w-full h-14 px-4 rounded-2xl border-2 text-slate-800 font-black tracking-widest text-lg bg-white focus:outline-none transition-colors uppercase ${
              errors.code ? 'border-red-300' : 'border-slate-100 focus:border-indigo-400'
            }`}
          />
          {errors.code && <p className="text-xs text-red-500 font-medium">{errors.code}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Sarlavha (Keling, tushunarli bo'lsin)</label>
          <input
            type="text"
            value={titleStr}
            onChange={(e) => setTitleStr(e.target.value)}
            placeholder="Masalan: Yangi mijozlarga aksiya"
            className="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 text-slate-800 font-medium text-base bg-white focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {/* Discount Configuration */}
      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">Chegirma sozlamalari</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Turi *</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountTypeEnum)}
              className="w-full h-12 px-3 rounded-xl border border-slate-200 text-slate-800 font-bold bg-white focus:outline-none focus:border-indigo-400"
            >
              <option value={DiscountTypeEnum.PERCENTAGE}>Foizli (%)</option>
              <option value={DiscountTypeEnum.FIXED}>Miqdorli</option>
            </select>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Qiymat *</label>
            <input
              type="number"
              value={discountValue || ''}
              onChange={(e) => setDiscountValue(parseInt(e.target.value) || 0)}
              className={`w-full h-12 px-3 rounded-xl border font-bold bg-white focus:outline-none focus:border-indigo-400 ${
                errors.discountValue ? 'border-red-300' : 'border-slate-200'
              }`}
            />
          </div>
        </div>
        {errors.discountValue && <p className="text-xs text-red-500 font-medium">{errors.discountValue}</p>}

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Minimal buyurtma (so'm)</label>
          <input
            type="number"
            value={minOrderValue || ''}
            onChange={(e) => setMinOrderValue(parseInt(e.target.value) || 0)}
            className="w-full h-12 px-3 rounded-xl border border-slate-200 font-bold bg-white focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Boshlanish sanasi</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-12 px-3 rounded-xl border border-slate-200 font-bold bg-white focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Tugash sanasi (ixtiyoriy)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full h-12 px-3 rounded-xl border font-bold bg-white focus:outline-none focus:border-indigo-400 ${
                errors.endDate ? 'border-red-300' : 'border-slate-200'
              }`}
            />
          </div>
        </div>
        {errors.endDate && <p className="text-xs text-red-500 font-medium">{errors.endDate}</p>}

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Foydalanish limiti (0 = cheksiz)</label>
          <input
            type="number"
            value={usageLimit || ''}
            onChange={(e) => setUsageLimit(parseInt(e.target.value) || 0)}
            className="w-full h-12 px-3 rounded-xl border border-slate-200 font-bold bg-white focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border-2 border-slate-100">
        <div>
          <p className="font-bold text-slate-800 text-sm">Faol holat</p>
          <p className="text-xs text-slate-400 mt-0.5">O'chirilgan promokod foydalanuvchilarga ishlamaydi</p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`w-14 h-8 rounded-full transition-colors relative ${isActive ? 'bg-indigo-500' : 'bg-slate-200'}`}
        >
          <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-transform ${isActive ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* First-order-only Toggle */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border-2 border-slate-100">
        <div>
          <p className="font-bold text-slate-800 text-sm">Faqat birinchi buyurtma</p>
          <p className="text-xs text-slate-400 mt-0.5">Foydalanuvchi oldin buyurtma bergan bo'lsa ishlamaydi (FIRST50 kabi)</p>
        </div>
        <button
          type="button"
          onClick={() => setIsFirstOrderOnly(!isFirstOrderOnly)}
          className={`w-14 h-8 rounded-full transition-colors relative ${isFirstOrderOnly ? 'bg-emerald-500' : 'bg-slate-200'}`}
        >
          <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-transform ${isFirstOrderOnly ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* VIP Target User */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase">Mijoz ID (VIP promo — ixtiyoriy)</label>
        <input
          type="text"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value.trim())}
          placeholder="UUID (bo'sh = hamma uchun)"
          className="w-full h-12 px-3 rounded-xl border border-slate-200 font-mono text-sm bg-white focus:outline-none focus:border-indigo-400 text-slate-700"
        />
        <p className="text-[10px] text-slate-400">To'ldirilsa faqat shu foydalanuvchi ishlata oladi</p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Save size={20} />
        {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
      </button>
    </form>
  );
};
