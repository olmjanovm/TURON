import React from 'react';
import {
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Pencil,
  Power,
  UserPlus,
  X,
} from 'lucide-react';
import {
  useAdminCourierDirectory,
  useCreateCourierByAdmin,
  useUpdateCourierByAdmin,
} from '../../hooks/queries/useCouriers';
import type { AdminCourierDirectoryItem } from '../../data/types';

function formatClock(value?: string | null) {
  if (!value) {
    return "Hali yo'q";
  }

  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function courierStatusMeta(courier: AdminCourierDirectoryItem) {
  if (!courier.isOnline) {
    return { label: 'Nofaol', tone: 'slate' as const };
  }
  if (courier.activeAssignments > 0) {
    return { label: 'Band', tone: 'amber' as const };
  }
  return { label: 'Faol', tone: 'emerald' as const };
}

const AdminCouriersPage: React.FC = () => {
  const { data: couriers = [], isLoading, error, refetch, isFetching } = useAdminCourierDirectory();
  const createCourier = useCreateCourierByAdmin();
  const updateCourier = useUpdateCourierByAdmin();
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [activeModal, setActiveModal] = React.useState<
    | { type: 'create' }
    | { type: 'edit'; courierId: string }
    | null
  >(null);
  const [pendingCourierId, setPendingCourierId] = React.useState<string | null>(null);
  const [pendingToggleId, setPendingToggleId] = React.useState<string | null>(null);
  const [createForm, setCreateForm] = React.useState({
    telegramId: '',
    fullName: '',
    phoneNumber: '',
    telegramUsername: '',
    isActive: true,
  });
  const [editForms, setEditForms] = React.useState<Record<string, {
    fullName: string;
    phoneNumber: string;
    telegramUsername: string;
    isActive: boolean;
  }>>({});
  const hasOpenModal = activeModal !== null;

  React.useEffect(() => {
    if (hasOpenModal) {
      document.body.setAttribute('data-admin-modal-open', '1');
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.removeAttribute('data-admin-modal-open');
        document.body.style.overflow = '';
      };
    }

    document.body.removeAttribute('data-admin-modal-open');
    document.body.style.overflow = '';

    return () => {
      document.body.removeAttribute('data-admin-modal-open');
      document.body.style.overflow = '';
    };
  }, [hasOpenModal]);

  const handleCreate = () => {
    setFeedback(null);

    if (!createForm.telegramId.trim() || !createForm.fullName.trim()) {
      setFeedback("Telegram ID va ism kiritilishi shart.");
      return;
    }

    createCourier.mutate(createForm, {
      onSuccess: () => {
        setFeedback("Yangi kuryer qo'shildi.");
        setCreateForm({
          telegramId: '',
          fullName: '',
          phoneNumber: '',
          telegramUsername: '',
          isActive: true,
        });
        setActiveModal(null);
      },
      onError: (mutationError) => {
        setFeedback(mutationError instanceof Error ? mutationError.message : "Kuryerni yaratib bo'lmadi");
      },
    });
  };

  const startEditing = (courier: AdminCourierDirectoryItem) => {
    setEditForms((current) => ({
      ...current,
      [courier.id]: {
        fullName: courier.fullName,
        phoneNumber: courier.phoneNumber || '',
        telegramUsername: courier.telegramUsername || '',
        isActive: courier.isActive,
      },
    }));
    setActiveModal({ type: 'edit', courierId: courier.id });
  };

  const handleEditSave = (courierId: string) => {
    const draft = editForms[courierId];

    if (!draft?.fullName.trim()) {
      setFeedback("Kuryer ismi bo'sh bo'lmasligi kerak.");
      return;
    }

    setPendingCourierId(courierId);
    updateCourier.mutate(
      {
        id: courierId,
        payload: draft,
      },
      {
        onSuccess: () => {
          setFeedback("Kuryer ma'lumotlari yangilandi.");
          setActiveModal(null);
          setPendingCourierId(null);
        },
        onError: (mutationError) => {
          setFeedback(mutationError instanceof Error ? mutationError.message : "Kuryerni yangilab bo'lmadi");
          setPendingCourierId(null);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 pb-24">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-11 w-11 rounded-xl bg-slate-100" />
                <div className="min-w-0">
                  <div className="h-4 w-40 rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-32 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-7 w-20 rounded-lg bg-slate-100" />
            </div>
            <div className="mt-3 h-3 w-44 rounded bg-slate-100" />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-3 w-28 rounded bg-slate-100" />
              <div className="h-3 w-16 rounded bg-slate-100" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="h-10 rounded-xl bg-slate-100" />
              <div className="h-10 rounded-xl bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[32px] border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertCircle size={30} />
        </div>
        <h3 className="mt-5 text-xl font-black tracking-tight text-slate-900">Kuryerlar yuklanmadi</h3>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
          {(error as Error).message}
        </p>
        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-900 px-5 text-xs font-black uppercase tracking-[0.18em] text-white"
        >
          <RefreshCw size={15} />
          <span>Qayta urinish</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition active:scale-95"
          aria-label="Yangilash"
        >
          <RefreshCw size={17} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {feedback ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
          {feedback}
        </div>
      ) : null}

      {couriers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-black text-slate-900">Kuryer topilmadi</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Yangi kuryer qo'shish uchun pastdagi + tugmasini bosing.</p>
        </div>
      ) : null}

      <section className="space-y-4">
        {couriers.map((courier) => {
          const status = courierStatusMeta(courier);
          const initials = (courier.fullName || 'K').trim().slice(0, 1).toUpperCase();
          const idTag = `#${courier.telegramId?.slice(-4) || '----'}`;
          const isTogglePending = pendingToggleId === courier.id;
          const toggleLabel = courier.isActive ? "Faolsizlantirish" : "Faollashtirish";
          const toggleClass = courier.isActive
            ? 'border border-rose-200 bg-white text-rose-700'
            : 'border border-emerald-200 bg-white text-emerald-700';

          return (
            <article
              key={courier.id}
              className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.07)] transition hover:shadow-[0_18px_42px_rgba(37,99,235,0.14)]"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-100 font-black text-blue-700">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[20px] font-black leading-tight tracking-tight text-slate-950">{courier.fullName}</p>
                  </div>
                </div>
                <StatusChip tone={status.tone} label={status.label} />
              </div>

              {/* Second row */}
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                <p className="text-[14px] font-medium text-slate-600">
                  {courier.phoneNumber || "Telefon kiritilmagan"}
                </p>
              </div>

              {/* Third row (stats) */}
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <StatChip label="Faol" value={`${courier.activeAssignments} ta`} />
                <StatChip label="Yetkazgan" value={`${courier.totalDelivered} ta`} />
                <StatChip label="ID" value={idTag} />
              </div>

              {/* Bottom row (actions) */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => startEditing(courier)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.3)] transition active:scale-95"
                >
                  <Pencil size={15} />
                  <span>Tahrirlash</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFeedback(null);
                    setPendingToggleId(courier.id);
                    updateCourier.mutate(
                      { id: courier.id, payload: { isActive: !courier.isActive } },
                      {
                        onSuccess: () => {
                          setFeedback(courier.isActive ? 'Kuryer faolsizlantirildi.' : 'Kuryer faollashtirildi.');
                          setPendingToggleId(null);
                        },
                        onError: (mutationError) => {
                          setFeedback(
                            mutationError instanceof Error ? mutationError.message : "Holatni o'zgartirib bo'lmadi",
                          );
                          setPendingToggleId(null);
                        },
                      },
                    );
                  }}
                  disabled={isTogglePending}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold transition active:scale-95 disabled:opacity-60 ${toggleClass}`}
                >
                  {isTogglePending ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}
                  <span>{toggleLabel}</span>
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <button
        type="button"
        onClick={() => {
          setFeedback(null);
          setActiveModal({ type: 'create' });
        }}
        className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_20px_42px_rgba(15,23,42,0.28)] transition active:scale-95"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 82px)' }}
        aria-label="Kuryer qo'shish"
      >
        <Plus size={20} />
      </button>

      {activeModal?.type === 'create' ? (
        <BottomSheet
          title="Yangi kuryer"
          onClose={() => setActiveModal(null)}
        >
          <div className="grid gap-3">
            <InputField
              label="Telegram ID"
              value={createForm.telegramId}
              onChange={(value) => setCreateForm((current) => ({ ...current, telegramId: value }))}
              placeholder="123456789"
            />
            <InputField
              label="Telegram nomi"
              value={createForm.telegramUsername}
              onChange={(value) => setCreateForm((current) => ({ ...current, telegramUsername: value }))}
              placeholder="@ali_mirza"
            />
            <InputField
              label="Ism-familya"
              value={createForm.fullName}
              onChange={(value) => setCreateForm((current) => ({ ...current, fullName: value }))}
              placeholder="Ali Mirza"
            />
            <InputField
              label="Telefon"
              value={createForm.phoneNumber}
              onChange={(value) => setCreateForm((current) => ({ ...current, phoneNumber: value }))}
              placeholder="+998901234567"
            />
            <label className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={createForm.isActive}
                onChange={(event) => setCreateForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              <span>Faol kuryer sifatida qo'shilsin</span>
            </label>
            <button
              type="button"
              onClick={handleCreate}
              disabled={createCourier.isPending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {createCourier.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              <span>Saqlash</span>
            </button>
          </div>
        </BottomSheet>
      ) : null}

      {activeModal?.type === 'edit' ? (
        <BottomSheet
          title="Kuryerni tahrirlash"
          subtitle={formatClock(couriers.find((c) => c.id === activeModal.courierId)?.updatedAt)}
          onClose={() => setActiveModal(null)}
          footer={(() => {
            const courier = couriers.find((c) => c.id === activeModal.courierId);
            const isSaving = pendingCourierId === activeModal.courierId;

            if (!courier) return null;

            return (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 active:scale-[0.99]"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={() => handleEditSave(courier.id)}
                  disabled={isSaving}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.24)] active:scale-[0.99] disabled:opacity-60"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Saqlash</span>
                </button>
              </div>
            );
          })()}
        >
          {(() => {
            const courier = couriers.find((c) => c.id === activeModal.courierId);
            const draft = editForms[activeModal.courierId];

            if (!courier || !draft) {
              return (
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                  Ma'lumot tayyorlanmadi. Qayta urinib ko'ring.
                </div>
              );
            }

            return (
              <div className="grid gap-4">
                <InputField
                  label="Ism-familya"
                  value={draft.fullName}
                  onChange={(value) =>
                    setEditForms((current) => ({
                      ...current,
                      [courier.id]: { ...current[courier.id], fullName: value },
                    }))
                  }
                />
                <InputField
                  label="Telegram nomi"
                  value={draft.telegramUsername}
                  onChange={(value) =>
                    setEditForms((current) => ({
                      ...current,
                      [courier.id]: { ...current[courier.id], telegramUsername: value },
                    }))
                  }
                />
                <InputField
                  label="Telefon"
                  value={draft.phoneNumber}
                  onChange={(value) =>
                    setEditForms((current) => ({
                      ...current,
                      [courier.id]: { ...current[courier.id], phoneNumber: value },
                    }))
                  }
                />

                <ToggleField
                  label="Kuryer holati"
                  checked={draft.isActive}
                  onChange={(checked) =>
                    setEditForms((current) => ({
                      ...current,
                      [courier.id]: { ...current[courier.id], isActive: checked },
                    }))
                  }
                />
              </div>
            );
          })()}
        </BottomSheet>
      ) : null}
    </div>
  );
};

const StatusChip: React.FC<{ tone: 'emerald' | 'amber' | 'slate'; label: string }> = ({
  tone,
  label,
}) => {
  const toneClass =
    tone === 'emerald'
      ? 'border border-emerald-200 bg-emerald-500 text-white shadow-[0_6px_16px_rgba(16,185,129,0.28)]'
      : tone === 'amber'
        ? 'border border-amber-200 bg-amber-500 text-white shadow-[0_6px_16px_rgba(245,158,11,0.28)]'
        : 'border border-slate-300 bg-slate-500 text-white';

  return <span className={`inline-flex rounded-xl px-3 py-1.5 text-[12px] font-black ${toneClass}`}>{label}</span>;
};

const StatChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
    <p className="text-[11px] font-bold tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-black text-slate-800">{value}</p>
  </div>
);

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <label className="block">
    <span className="text-xs font-bold text-slate-600">{label}</span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[15px] font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
    />
  </label>
);

const ToggleField: React.FC<{
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{checked ? 'Faol' : 'Nofaol'}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full p-1 transition ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  </div>
);

const BottomSheet: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, subtitle, onClose, children, footer }) => {
  const [sheetHeight, setSheetHeight] = React.useState('92dvh');

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  React.useEffect(() => {
    const computeHeight = () => {
      const vv = window.visualViewport;
      if (!vv) {
        setSheetHeight('92dvh');
        return;
      }
      const nextHeight = Math.max(420, Math.floor(vv.height - 8));
      setSheetHeight(`${nextHeight}px`);
    };

    computeHeight();
    window.visualViewport?.addEventListener('resize', computeHeight);
    window.visualViewport?.addEventListener('scroll', computeHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', computeHeight);
      window.visualViewport?.removeEventListener('scroll', computeHeight);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center animate-in fade-in duration-200">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[3px]"
        onClick={onClose}
        aria-label="Yopish"
      />
      <div
        className="relative flex w-full max-w-[430px] flex-col rounded-t-[30px] border border-slate-200/80 bg-slate-50 shadow-[0_-20px_48px_rgba(15,23,42,0.18)]"
        style={{ height: sheetHeight, maxHeight: '92dvh' }}
      >
        <div className="px-5 pb-3 pt-3">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-black text-slate-950">{title}</p>
              {subtitle ? <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 active:scale-95"
              aria-label="Yopish"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer ? (
          <div
            className="border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminCouriersPage;
