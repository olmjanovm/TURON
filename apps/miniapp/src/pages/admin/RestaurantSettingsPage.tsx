import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkingHoursDay {
  open: string;
  close: string;
  closed: boolean;
}

interface WorkingHours {
  mon: WorkingHoursDay;
  tue: WorkingHoursDay;
  wed: WorkingHoursDay;
  thu: WorkingHoursDay;
  fri: WorkingHoursDay;
  sat: WorkingHoursDay;
  sun: WorkingHoursDay;
}

interface RestaurantSettings {
  name: string;
  phone: string;
  addressText: string;
  longitude: number;
  latitude: number;
  workingHours: WorkingHours;
  isOpen: boolean;
  autoSchedule: boolean;
}

const DAY_LABELS: Record<keyof WorkingHours, string> = {
  mon: 'Dushanba',
  tue: 'Seshanba',
  wed: 'Chorshanba',
  thu: 'Payshanba',
  fri: 'Juma',
  sat: 'Shanba',
  sun: 'Yakshanba',
};

const DAY_ORDER: (keyof WorkingHours)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useRestaurantSettings() {
  return useQuery<RestaurantSettings>({
    queryKey: ['admin-restaurant-settings'],
    queryFn: () => api.get('/admin/restaurant/settings') as Promise<RestaurantSettings>,
  });
}

function useUpdateRestaurantSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RestaurantSettings>) =>
      api.patch('/admin/restaurant/settings', data) as Promise<RestaurantSettings>,
    onSuccess: (updated) => {
      queryClient.setQueryData(['admin-restaurant-settings'], updated);
    },
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
        active
          ? 'bg-blue-600 text-white shadow'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
    </div>
  );
}

// ── Tab: Asosiy (Basic) ───────────────────────────────────────────────────────

function TabBasic({
  settings,
  onChange,
}: {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}) {
  return (
    <div className="space-y-4">
      <LabeledInput
        label="Restoran nomi"
        value={settings.name}
        onChange={(v) => onChange({ name: v })}
        placeholder="Turon Kafesi"
      />
      <LabeledInput
        label="Telefon raqami"
        value={settings.phone}
        onChange={(v) => onChange({ phone: v })}
        placeholder="+998 90 000 00 00"
        type="tel"
      />
    </div>
  );
}

// ── Tab: Manzil (Address) ─────────────────────────────────────────────────────

function TabAddress({
  settings,
  onChange,
}: {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}) {
  return (
    <div className="space-y-4">
      <LabeledInput
        label="Manzil matni"
        value={settings.addressText}
        onChange={(v) => onChange({ addressText: v })}
        placeholder="Ko'cha, bino, shahar"
      />
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput
          label="Kenglik (Latitude)"
          value={String(settings.latitude)}
          onChange={(v) => onChange({ latitude: parseFloat(v) || settings.latitude })}
          type="number"
          placeholder="41.2341"
        />
        <LabeledInput
          label="Uzunlik (Longitude)"
          value={String(settings.longitude)}
          onChange={(v) => onChange({ longitude: parseFloat(v) || settings.longitude })}
          type="number"
          placeholder="69.2088"
        />
      </div>
      <div className="rounded-2xl overflow-hidden border border-slate-200 h-52 bg-slate-100 flex items-center justify-center">
        <div className="text-center text-slate-400 text-sm px-4">
          <p className="text-2xl mb-2">📍</p>
          <p className="font-medium">{settings.latitude.toFixed(6)}, {settings.longitude.toFixed(6)}</p>
          <p className="text-xs mt-1 text-slate-400">{settings.addressText || 'Manzil kiritilmagan'}</p>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Ish vaqti (Working Hours) ────────────────────────────────────────────

function TabWorkingHours({
  settings,
  onChange,
}: {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}) {
  const updateDay = (day: keyof WorkingHours, patch: Partial<WorkingHoursDay>) => {
    onChange({
      workingHours: {
        ...settings.workingHours,
        [day]: { ...settings.workingHours[day], ...patch },
      },
    });
  };

  return (
    <div className="space-y-2">
      {DAY_ORDER.map((day) => {
        const hours = settings.workingHours[day];
        return (
          <div
            key={day}
            className={`rounded-xl border p-3 transition-colors ${
              hours.closed ? 'border-slate-100 bg-slate-50' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">{DAY_LABELS[day]}</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-slate-500">{hours.closed ? 'Yopiq' : 'Ochiq'}</span>
                <div
                  onClick={() => updateDay(day, { closed: !hours.closed })}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                    !hours.closed ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      !hours.closed ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </label>
            </div>
            {!hours.closed && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={hours.open}
                  onChange={(e) => updateDay(day, { open: e.target.value })}
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-400 text-xs">—</span>
                <input
                  type="time"
                  value={hours.close}
                  onChange={(e) => updateDay(day, { close: e.target.value })}
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: Ko'rinish (Status) ────────────────────────────────────────────────────

function TabStatus({
  settings,
  onChange,
}: {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Auto-schedule toggle */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-800">Avtomatik jadval</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Ish vaqtiga qarab restoran holati avtomatik o'zgaradi
            </p>
          </div>
          <div
            onClick={() => onChange({ autoSchedule: !settings.autoSchedule })}
            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
              settings.autoSchedule ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                settings.autoSchedule ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Manual open/close — only editable when auto-schedule is OFF */}
      <div
        className={`rounded-2xl border p-4 transition-opacity ${
          settings.autoSchedule ? 'opacity-40 pointer-events-none border-slate-100 bg-slate-50' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-800">Qo'lda boshqarish</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {settings.isOpen ? 'Restoran hozir ochiq' : 'Restoran hozir yopiq'}
            </p>
          </div>
          <div
            onClick={() => onChange({ isOpen: !settings.isOpen })}
            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
              settings.isOpen ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                settings.isOpen ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Current status badge */}
      <div className="text-center py-3">
        <span
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            settings.isOpen || settings.autoSchedule
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              settings.isOpen || settings.autoSchedule ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          {settings.autoSchedule ? "Jadvalga ko'ra" : settings.isOpen ? 'Ochiq' : 'Yopiq'}
        </span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'basic' | 'address' | 'hours' | 'status';

export default function RestaurantSettingsPage() {
  const { data, isLoading } = useRestaurantSettings();
  const updateMutation = useUpdateRestaurantSettings();

  const [tab, setTab] = useState<Tab>('basic');
  const [draft, setDraft] = useState<RestaurantSettings | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Populate draft when data loads
  useEffect(() => {
    if (data && !draft) {
      setDraft(data);
    }
  }, [data, draft]);

  const handleChange = (patch: Partial<RestaurantSettings>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSave = async () => {
    if (!draft) return;
    await updateMutation.mutateAsync(draft);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  if (isLoading || !draft) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-10">
      {/* Header */}
      <div className="sticky top-0 bg-slate-50 pt-4 pb-3 z-10">
        <h1 className="text-lg font-bold text-slate-900 mb-3">Restoran sozlamalari</h1>

        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <TabButton active={tab === 'basic'} onClick={() => setTab('basic')}>
            Asosiy
          </TabButton>
          <TabButton active={tab === 'address'} onClick={() => setTab('address')}>
            Manzil
          </TabButton>
          <TabButton active={tab === 'hours'} onClick={() => setTab('hours')}>
            Ish vaqti
          </TabButton>
          <TabButton active={tab === 'status'} onClick={() => setTab('status')}>
            Ko'rinish
          </TabButton>
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {tab === 'basic' && <TabBasic settings={draft} onChange={handleChange} />}
        {tab === 'address' && <TabAddress settings={draft} onChange={handleChange} />}
        {tab === 'hours' && <TabWorkingHours settings={draft} onChange={handleChange} />}
        {tab === 'status' && <TabStatus settings={draft} onChange={handleChange} />}
      </div>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-50 border-t border-slate-200">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all ${
            saveSuccess
              ? 'bg-emerald-600 text-white'
              : updateMutation.isPending
                ? 'bg-blue-400 text-white cursor-wait'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
          }`}
        >
          {saveSuccess ? '✓ Saqlandi!' : updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>
    </div>
  );
}
