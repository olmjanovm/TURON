import WebApp from '@twa-dev/sdk';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 animate-in fade-in duration-500">
       <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 border-8 border-red-50/50 shadow-inner">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
       </div>
       <h1 className="text-2xl font-black text-gray-800 mb-2">Sessiya yaroqsiz</h1>
       <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed max-w-xs">
         Telegram ma'lumotlaringiz tasdiqlanmadi yoki ruxsat yo'q. Ilovani yopib qaytadan kiring.
       </p>
       <button 
         onClick={() => WebApp.close()} 
         className="bg-gray-900 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg w-full max-w-xs active:scale-95 transition-all"
       >
          Ilovani Yopish
       </button>
    </div>
  )
}
