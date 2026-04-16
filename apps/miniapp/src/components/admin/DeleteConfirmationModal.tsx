import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemName?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  warningText?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  itemName,
  isDeleting = false,
  onConfirm,
  onCancel,
  isDangerous = true,
  confirmLabel = "Ha, o'chirish",
  cancelLabel = 'Bekor qilish',
  warningText,
}) => {
  if (!isOpen) {
    return null;
  }

  const accentClasses = isDangerous
    ? {
        badge: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100',
        icon: 'text-rose-500',
        stripe: 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400',
        warning: 'border-rose-200 bg-rose-50 text-rose-700',
        button: 'bg-rose-500 shadow-lg shadow-rose-200 hover:bg-rose-600',
        eyebrow: 'text-rose-500',
      }
    : {
        badge: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
        icon: 'text-amber-500',
        stripe: 'bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300',
        warning: 'border-amber-200 bg-amber-50 text-amber-700',
        button: 'bg-amber-500 shadow-lg shadow-amber-200 hover:bg-amber-600',
        eyebrow: 'text-amber-500',
      };

  const defaultWarningText = isDangerous
    ? "Bu amalni qaytarib bo'lmaydi. Bog'liq ma'lumotlar ham o'chiriladi."
    : "Amalni tasdiqlashdan oldin ma'lumotlarni yana bir bor tekshiring.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 px-3 pb-3 backdrop-blur-md md:items-center md:p-6"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[430px] overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className={`h-1.5 w-full ${accentClasses.stripe}`} />

        <div className="space-y-5 px-6 pb-6 pt-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] ${accentClasses.badge}`}
            >
              <AlertTriangle size={24} className={accentClasses.icon} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className={`text-[11px] font-black uppercase tracking-[0.24em] ${accentClasses.eyebrow}`}>
                Tasdiqlash
              </p>
              <h2 className="mt-1 text-[22px] font-black leading-tight tracking-tight text-slate-950">
                {title}
              </h2>
              <p className="mt-2 text-[14px] font-medium leading-6 text-slate-500">{description}</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          {itemName ? (
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Tanlangan obyekt</p>
              <p className="mt-1 truncate text-[15px] font-bold text-slate-900">{itemName}</p>
            </div>
          ) : null}

          <div className={`rounded-[20px] border px-4 py-3 ${accentClasses.warning}`}>
            <p className="text-[13px] font-semibold leading-5">{warningText ?? defaultWarningText}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="h-12 rounded-[16px] border border-slate-200 bg-white text-[14px] font-bold text-slate-900 transition active:scale-[0.98] disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className={`flex h-12 items-center justify-center gap-2 rounded-[16px] text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60 ${accentClasses.button}`}
            >
              {isDeleting && <Loader2 size={16} className="animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
