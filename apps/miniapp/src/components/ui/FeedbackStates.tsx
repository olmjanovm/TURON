import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Turon tizimi yuklanmoqda...' }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6 drop-shadow-md" />
    <p className="text-amber-800 font-bold tracking-widest uppercase text-sm">{message}</p>
  </div>
);

export const ErrorStateCard: React.FC<{ title?: string; message: string; onRetry?: () => void }> = ({ 
  title = "Xatolik yuz berdi", 
  message, 
  onRetry 
}) => (
  <div className="flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300">
    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 border border-red-100 shadow-sm">
      <AlertCircle size={32} />
    </div>
    <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-2">{title}</h3>
    <p className="text-sm font-medium text-slate-500 mb-6 max-w-xs">{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="w-full h-12 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 active:bg-red-100 transition-colors"
      >
        <RefreshCw size={18} />
         қайта уриниш
      </button>
    )}
  </div>
);

export const UnauthorizedState: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center animate-in fade-in duration-300">
      <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white">
        <ShieldAlert size={36} />
      </div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Ruxsat etilmagan</h2>
      <p className="text-sm font-medium text-slate-500 mb-8 max-w-[280px]">
        Sizda ushbu sahifaga kirish huquqi yo'q yoki profilingiz tasdiqlanmagan.
      </p>
      <button 
        onClick={() => navigate('/')}
        className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black tracking-widest uppercase text-sm shadow-xl shadow-slate-200 active:scale-95 transition-transform"
      >
        Bosh sahifaga qaytish
      </button>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center animate-in slide-in-from-bottom-4 duration-300">
      <div className="relative mb-8">
        <h1 className="text-8xl font-black text-slate-200">404</h1>
        <div className="absolute inset-0 flex items-center justify-center text-amber-500">
          <AlertTriangle size={48} className="drop-shadow-md" />
        </div>
      </div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Sahifa topilmadi</h2>
      <p className="text-sm font-medium text-slate-500 mb-8 max-w-[280px]">
        Siz izlayotgan sahifa mavjud emas yoki nomi o'zgartirilgan bo'lishi mumkin.
      </p>
      <button 
        onClick={() => navigate('/', { replace: true })}
        className="h-14 px-8 bg-amber-500 text-white rounded-2xl font-black tracking-widest uppercase text-sm shadow-xl shadow-amber-200 active:bg-amber-600 active:scale-95 transition-transform flex items-center gap-2"
      >
        <Home size={18} />
        Bosh sahifaga o'tish
      </button>
    </div>
  );
};
