import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

export interface ConfirmOptions {
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirm, setConfirm] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const resolvedDuration = duration ?? (type === 'error' ? 4500 : 3000);
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-2), { id, message, type, duration: resolvedDuration }]);
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirm({ ...options, resolve });
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {confirm ? (
        <ConfirmSheet
          options={confirm}
          onResult={(result) => {
            confirm.resolve(result);
            setConfirm(null);
          }}
        />
      ) : null}
    </ToastContext.Provider>
  );
};

// ─── Single Toast ─────────────────────────────────────────────────────────────

const SingleToast: React.FC<{ toast: ToastItem; onRemove: (id: string) => void }> = ({
  toast,
  onRemove,
}) => {
  useEffect(() => {
    const timer = window.setTimeout(() => onRemove(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />,
    error: <AlertCircle size={16} className="shrink-0 text-rose-400" />,
    warning: <AlertTriangle size={16} className="shrink-0 text-amber-400" />,
    info: <Info size={16} className="shrink-0 text-sky-400" />,
  };

  const borderMap: Record<ToastType, string> = {
    success: 'border-emerald-400/20',
    error: 'border-rose-400/25',
    warning: 'border-amber-400/20',
    info: 'border-sky-400/20',
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border bg-[#111827]/96 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-in slide-in-from-top-2 duration-200 ${borderMap[toast.type]}`}
    >
      <div className="mt-0.5">{iconMap[toast.type]}</div>
      <p className="flex-1 text-[13px] font-semibold leading-snug text-white">{toast.message}</p>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/35 transition-colors active:text-white"
        aria-label="Yopish"
      >
        <X size={13} />
      </button>
    </div>
  );
};

// ─── Toast Container ──────────────────────────────────────────────────────────

const ToastContainer: React.FC<{ toasts: ToastItem[]; onRemove: (id: string) => void }> = ({
  toasts,
  onRemove,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex flex-col gap-2 px-4"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
        maxWidth: '430px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <SingleToast toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};

// ─── Confirm Sheet ────────────────────────────────────────────────────────────

const ConfirmSheet: React.FC<{
  options: ConfirmOptions;
  onResult: (result: boolean) => void;
}> = ({ options, onResult }) => {
  const {
    message,
    detail,
    confirmLabel = 'Tasdiqlash',
    cancelLabel = "Bekor qilish",
    isDanger = false,
  } = options;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/65 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={() => onResult(false)}
      />

      {/* Bottom sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-[9999] rounded-t-[28px] border-t border-white/10 bg-[#0f172a] px-5 animate-in slide-in-from-bottom-4 duration-200"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)' }}
      >
        <div className="mx-auto mt-3 mb-7 h-[4px] w-12 rounded-full bg-white/12" />
        <p className="text-center text-[1.1rem] font-black leading-snug text-white">{message}</p>
        {detail ? (
          <p className="mt-2.5 text-center text-[13px] font-medium leading-relaxed text-white/52">
            {detail}
          </p>
        ) : null}
        <div className="mt-7 grid gap-3">
          <button
            type="button"
            onClick={() => onResult(true)}
            className={`flex h-[52px] w-full items-center justify-center rounded-[14px] text-[15px] font-black text-white transition-transform active:scale-[0.98] ${
              isDanger
                ? 'bg-rose-500 shadow-[0_8px_24px_rgba(239,68,68,0.28)]'
                : 'bg-white !text-slate-950 shadow-[0_8px_24px_rgba(255,255,255,0.08)]'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={() => onResult(false)}
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.05] text-[15px] font-semibold text-white/65 transition-transform active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </>
  );
};
