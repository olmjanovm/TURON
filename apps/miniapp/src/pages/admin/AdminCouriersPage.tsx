import React from 'react';
import {
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Pencil,
  Power,
  Star,
  UserPlus,
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

function formatRelativeTime(value?: string | null) {
  if (!value) return "Hali yo'q";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(0, Math.round(diffMs / 60000));

  if (diffMin <= 0) return 'Now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} d ago`;
}

function courierStatusMeta(courier: AdminCourierDirectoryItem) {
  if (!courier.isOnline) {
    return { label: 'Offline', tone: 'slate' as const, dot: 'bg-slate-400' };
  }
  if (courier.activeAssignments > 0) {
    return { label: 'Busy', tone: 'amber' as const, dot: 'bg-amber-500' };
  }
  return { label: 'Online', tone: 'emerald' as const, dot: 'bg-emerald-500' };
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-950">Couriers</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">Directory yuklanmoqda…</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm text-slate-500"
            aria-label="Refresh"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>

        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="rounded-[28px] bg-white p-5 shadow-sm border border-slate-100 animate-pulse">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 rounded-2xl bg-slate-100" />
                <div className="min-w-0">
                  <div className="h-4 w-40 rounded bg-slate-100" />
                  <div className="mt-3 h-3 w-32 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-full bg-slate-100" />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-3 w-28 rounded bg-slate-100" />
              <div className="h-3 w-16 rounded bg-slate-100" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="h-11 rounded-full bg-slate-100" />
              <div className="h-11 rounded-full bg-slate-100" />
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-950">Couriers</h1>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {couriers.length} ta kuryer
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm text-slate-500 active:scale-95"
          aria-label="Refresh"
        >
          <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {feedback ? (
        <div className="rounded-[22px] border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          {feedback}
        </div>
      ) : null}

      {couriers.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-6 text-center">
          <p className="text-sm font-black text-slate-900">Kuryer topilmadi</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Yangi kuryer qo‘shish uchun “+” tugmasini bosing.</p>
        </div>
      ) : null}

      <section className="space-y-4">
        {couriers.map((courier) => {
          const status = courierStatusMeta(courier);
          const initials = (courier.fullName || 'K').trim().slice(0, 1).toUpperCase();
          const idTag = `#${courier.telegramId?.slice(-4) || '—'}`;
          const lastLabel = courier.isOnline ? 'Now' : formatRelativeTime(courier.lastSeenAt || courier.lastOfflineAt);
          const isTogglePending = pendingToggleId === courier.id;

          return (
            <article key={courier.id} className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 font-black">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-slate-950">{courier.fullName}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {courier.phoneNumber || "Telefon yo'q"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                    <StatusChip tone={status.tone} label={status.label} />
                  </div>
                  <p className="mt-2 text-[11px] font-bold text-slate-400">{lastLabel}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Star size={14} className="text-amber-500" />
                  <span className="text-slate-700">—</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-slate-900 font-black">{courier.totalDelivered}</span>
                  <span>deliveries</span>
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-500">
                  {idTag}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => startEditing(courier)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-[11px] font-black uppercase tracking-[0.16em] text-slate-700 active:scale-95"
                >
                  <Pencil size={15} />
                  <span>Edit</span>
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
                          setFeedback(courier.isActive ? 'Kuryer deaktivatsiya qilindi.' : 'Kuryer aktiv qilindi.');
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
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-full text-[11px] font-black uppercase tracking-[0.16em] text-white active:scale-95 disabled:opacity-60 ${
                    courier.isActive ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                >
                  {isTogglePending ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}
                  <span>{courier.isActive ? 'Deactivate' : 'Activate'}</span>
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
        className="fixed bottom-[92px] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] active:scale-95"
        aria-label="Add courier"
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
              label="Telegram username"
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
              <span>Faol kuryer sifatida qo‘shilsin</span>
            </label>
            <button
              type="button"
              onClick={handleCreate}
              disabled={createCourier.isPending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-slate-950 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-white disabled:opacity-60"
            >
              {createCourier.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              <span>Saqlash</span>
            </button>
          </div>
        </BottomSheet>
      ) : null}

      {activeModal?.type === 'edit' ? (
        <BottomSheet
          title="Edit courier"
          subtitle={formatClock(couriers.find((c) => c.id === activeModal.courierId)?.updatedAt)}
          onClose={() => setActiveModal(null)}
        >
          {(() => {
            const courier = couriers.find((c) => c.id === activeModal.courierId);
            const draft = editForms[activeModal.courierId];
            const isSaving = pendingCourierId === activeModal.courierId;

            if (!courier || !draft) {
              return (
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                  Draft tayyorlanmadi. Qayta urinib ko‘ring.
                </div>
              );
            }

            return (
              <div className="grid gap-3">
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
                  label="Telegram username"
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

                <label className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(event) =>
                      setEditForms((current) => ({
                        ...current,
                        [courier.id]: { ...current[courier.id], isActive: event.target.checked },
                      }))
                    }
                  />
                  <span>Faol kuryer</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleEditSave(courier.id)}
                  disabled={isSaving}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-slate-950 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-white disabled:opacity-60"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Save</span>
                </button>
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
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-slate-100 text-slate-500';

  return <span className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${toneClass}`}>{label}</span>;
};

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <label className="block">
    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mt-2 h-12 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none"
    />
  </label>
);

const BottomSheet: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, onClose, children }) => {
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-in fade-in duration-200">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-[390px] rounded-t-[34px] bg-white p-5 pb-7 shadow-[0_-18px_40px_rgba(15,23,42,0.18)]">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-100" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-black text-slate-950">{title}</p>
            {subtitle ? <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 active:scale-95"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export default AdminCouriersPage;
