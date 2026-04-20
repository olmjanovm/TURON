import React from 'react';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  isVisible: boolean;
}

export function OrderProcessingOverlay({ isVisible }: Props) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/80 px-6 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex w-full max-w-[340px] flex-col items-center rounded-[32px] bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-500">
        
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-20" />
          <div className="absolute inset-2 animate-ping rounded-full bg-amber-400 opacity-40 delay-150" />
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
            <Loader2 size={32} className="animate-spin" />
          </div>
        </div>

        <h3 className="text-xl font-black tracking-tight text-slate-900">
          Buyurtma navbatda
        </h3>
        
        <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
          Tizimda yuklama yuqori. Buyurtmangiz xavfsiz qabul qilinmoqda, iltimos sahifani yopmang...
        </p>

        <div className="mt-8 w-full space-y-3 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span>Savatcha tasdiqlandi</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <Clock size={18} className="text-amber-500 animate-pulse" />
            <span>Navbat kutilmoqda...</span>
          </div>
        </div>
      </div>
    </div>
  );
}