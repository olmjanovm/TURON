import { X } from 'lucide-react';
import { useState } from 'react';
import { closeTelegramMiniApp } from '../../lib/telegramMiniApp';

interface MiniAppCloseButtonProps {
  tone?: 'dark' | 'light';
}

export function MiniAppCloseButton({ tone = 'dark' }: MiniAppCloseButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const buttonClass =
    tone === 'light'
      ? 'flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-transform active:scale-95'
      : 'flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition-transform active:scale-95';

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className={buttonClass}
        aria-label="Mini appni yopish"
        title="Yopish"
      >
        <X size={18} />
      </button>

      {showConfirm ? (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/55 px-4 pb-8 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-[360px] overflow-hidden rounded-[22px] border border-white/10 bg-[#0d1525] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pb-2 pt-6 text-center">
              <p className="text-[18px] font-black text-white">Yopmoqchimisiz?</p>
              <p className="mt-2 text-[13px] leading-[1.55] text-white/52">
                Ilovani yopsangiz, tasdiqlanmagan ma'lumotlar saqlanmaydi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 px-4 pb-5 pt-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-[14px] border border-white/12 bg-white/[0.07] py-3.5 text-[14px] font-black text-white transition-transform active:scale-[0.97]"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={closeTelegramMiniApp}
                className="rounded-[14px] bg-red-500 py-3.5 text-[14px] font-black text-white shadow-[0_4px_24px_rgba(239,68,68,0.35)] transition-transform active:scale-[0.97]"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
