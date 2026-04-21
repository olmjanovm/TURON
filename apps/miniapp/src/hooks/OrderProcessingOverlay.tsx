import React from 'react';
import { CheckCircle2, Clock, Headphones, Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  isVisible: boolean;
}

export function OrderProcessingOverlay({ isVisible }: Props) {
  if (!isVisible) return null;

  const navigate = useNavigate();
  const [elapsedSec, setElapsedSec] = React.useState(0);

  React.useEffect(() => {
    if (!isVisible) return;
    setElapsedSec(0);
    const id = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isVisible]);

  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const ss = String(elapsedSec % 60).padStart(2, '0');
  const isSlow = elapsedSec >= 18;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 animate-in fade-in duration-200"
      style={{
        background: 'rgba(2,6,23,0.68)',
        backdropFilter: 'blur(10px)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
    >
      <div className="w-full max-w-[430px] overflow-hidden rounded-[26px] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-[#C62020] px-5 py-4 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/80">
            Buyurtmani rasmiylashtirish
          </p>
          <h3 className="mt-2 text-[20px] font-black tracking-tight">Buyurtma navbatda</h3>
          <p className="mt-2 text-[12px] font-semibold leading-5 text-white/85">
            Buyurtmangiz xavfsiz qabul qilinmoqda. Iltimos sahifani yopmang.
          </p>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[#f6f6f7] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#C62020]">
                <Loader2 size={18} className="animate-spin" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8c8c96]">Vaqt</p>
                <p className="mt-0.5 text-[16px] font-black text-[#202020]">
                  {mm}:{ss}
                </p>
              </div>
            </div>

            <div className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#C62020]">
              Navbat
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3 rounded-[16px] bg-white px-3 py-3 ring-1 ring-slate-900/[0.04]">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-black text-[#202020]">Savatcha tasdiqlandi</p>
                <p className="mt-0.5 text-[11px] font-semibold text-[#8c8c96]">
                  Ma'lumotlar yuborildi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[16px] bg-white px-3 py-3 ring-1 ring-slate-900/[0.04]">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isSlow ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                <Clock size={18} className={isSlow ? 'animate-pulse' : ''} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-black text-[#202020]">Server tasdiqlayapti</p>
                <p className="mt-0.5 text-[11px] font-semibold text-[#8c8c96]">
                  {isSlow ? "Biroz cho'zilyapti, lekin jarayon davom etyapti" : 'Bir oz kuting...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[16px] bg-white px-3 py-3 ring-1 ring-slate-900/[0.04]">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-black text-[#202020]">Buyurtma yaratilmoqda</p>
                <p className="mt-0.5 text-[11px] font-semibold text-[#8c8c96]">
                  Tayyor bo‘lishi bilan keyingi sahifa ochiladi
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[16px] bg-[#f6f6f7] px-4 py-3">
            <p className="text-[11px] font-semibold leading-5 text-[#8c8c96]">
              Agar internet sekin bo‘lsa 15–30 soniya davom etishi mumkin.
              {isSlow ? ' Juda uzoq bo‘lsa support’ga yozing.' : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/customer/support?topic=other')}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-[#111827] text-[13px] font-black text-white transition-transform active:scale-[0.985]"
          >
            <Headphones size={16} />
            Support
          </button>
        </div>
      </div>
    </div>
  );
}