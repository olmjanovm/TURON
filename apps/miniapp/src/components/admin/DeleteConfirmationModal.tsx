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
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm md:items-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[420px] rounded-t-[28px] bg-white shadow-2xl md:rounded-[28px]"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="space-y-4 px-6 py-6">
          {/* Header with icon */}
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isDangerous ? 'bg-orange-50' : 'bg-amber-50'}`}>
              <AlertTriangle size={24} className={isDangerous ? 'text-orange-500' : 'text-amber-500'} />
            </div>
            <div className="flex-1 pt-1">
              <h2 className="text-[18px] font-black tracking-tight text-slate-950">{title}</h2>
              <p className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-500">
                {description}
              </p>
              {itemName && (
                <p className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-[12px] font-bold text-slate-900">
                  {itemName}
                </p>
              )}
            </div>
            <button
              onClick={onCancel}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          {/* Warning message */}
          {isDangerous && (
            <div className="rounded-[14px] border border-orange-200 bg-orange-50 px-3 py-2.5">
              <p className="text-[12px] font-bold text-orange-700">
                ⚠️ Bu amalni qaytarib bo'lmaydi. Hamma bog'liq ma'lumotlar o'chiriladi.
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-12 rounded-[14px] border border-slate-200 bg-white text-[14px] font-bold text-slate-900 transition active:scale-[0.98] disabled:opacity-60"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className={`h-12 rounded-[14px] text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 ${
              isDangerous
                ? 'bg-orange-500 shadow-lg shadow-orange-200 hover:bg-orange-600'
                : 'bg-rose-500 shadow-lg shadow-rose-200 hover:bg-rose-600'
            }`}
          >
            {isDeleting && <Loader2 size={16} className="animate-spin" />}
            O'chirish
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
