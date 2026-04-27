import React from 'react';
import '../../styles/admin-overhaul.css';
import { RefreshCw } from 'lucide-react';
import { RestaurantAddressTab } from '../../features/admin/restaurant/RestaurantAddressTab';
import { RestaurantBasicTab } from '../../features/admin/restaurant/RestaurantBasicTab';
import { RestaurantHoursTab } from '../../features/admin/restaurant/RestaurantHoursTab';
import { RestaurantSaveBar } from '../../features/admin/restaurant/RestaurantSaveBar';
import { RestaurantSettingsHero } from '../../features/admin/restaurant/RestaurantSettingsHero';
import { RestaurantStatusTab } from '../../features/admin/restaurant/RestaurantStatusTab';
import { RestaurantTabRail } from '../../features/admin/restaurant/RestaurantTabRail';
import type { RestaurantSettingsModel, RestaurantTabKey } from '../../features/admin/restaurant/restaurantSettings.types';
import {
  formatUzbekPhone,
  getRestaurantValidation,
  normalizeRestaurantSettings,
  normalizeUzbekPhone,
} from '../../features/admin/restaurant/restaurantSettings.utils';
import {
  useRestaurantOpenStatus,
  useRestaurantSettings,
  useUpdateRestaurantSettings,
} from '../../features/admin/restaurant/useRestaurantSettings';

function RestaurantSettingsSkeleton() {
  return (
    <div className="space-y-3 pb-[calc(env(safe-area-inset-bottom,0px)+104px)] animate-pulse">
      <div className="adminx-panel min-h-[196px] p-5" />
      <div className="h-12 rounded-full border border-[rgba(28,18,7,0.06)] bg-white/90" />
      <div className="adminx-form-card min-h-[280px] p-5" />
    </div>
  );
}

export default function RestaurantSettingsPage() {
  const { data, isLoading } = useRestaurantSettings();
  const { data: openStatus } = useRestaurantOpenStatus();
  const updateSettings = useUpdateRestaurantSettings();
  const [tab, setTab] = React.useState<RestaurantTabKey>('basic');
  const [draft, setDraft] = React.useState<RestaurantSettingsModel>(normalizeRestaurantSettings(null));
  const [dirty, setDirty] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (data && !dirty) setDraft(normalizeRestaurantSettings(data));
  }, [data, dirty]);

  const validation = React.useMemo(() => getRestaurantValidation(draft), [draft]);

  const handleChange = React.useCallback((patch: Partial<RestaurantSettingsModel>) => {
    setDraft((current) => ({ ...current, ...('phone' in patch && typeof patch.phone === 'string' ? { ...patch, phone: formatUzbekPhone(patch.phone) } : patch) }));
    setDirty(true);
    setSaved(false);
  }, []);

  const handleSave = async () => {
    if (!validation.ok) return;
    setSaveError(null);
    try {
      // Normalize phone before sending: "+998 90 123 45 67" → "+998901234567"
      const payload = { ...draft, phone: normalizeUzbekPhone(draft.phone) };
      const updated = await updateSettings.mutateAsync(payload);
      setDraft(normalizeRestaurantSettings(updated));
      setDirty(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Saqlab bo\'lmadi');
    }
  };

  if (isLoading && !data) return <RestaurantSettingsSkeleton />;

  return (
    <div className="adminx-page adminx-restaurant-page space-y-3 pb-[calc(env(safe-area-inset-bottom,0px)+108px)]">
      <RestaurantSettingsHero settings={draft} status={openStatus} />
      <RestaurantTabRail activeTab={tab} onChange={setTab} />

      {tab === 'basic' ? <RestaurantBasicTab draft={draft} onChange={handleChange} /> : null}
      {tab === 'address' ? <RestaurantAddressTab draft={draft} onChange={handleChange} /> : null}
      {tab === 'hours' ? <RestaurantHoursTab draft={draft} onChange={handleChange} /> : null}
      {tab === 'status' ? <RestaurantStatusTab draft={draft} status={openStatus} onChange={handleChange} /> : null}

      {!validation.ok && dirty ? (
        <div className="adminx-surface flex items-center gap-3 rounded-[22px] px-4 py-4 text-sm font-semibold text-[var(--adminx-color-muted)]">
          <RefreshCw size={16} className="text-[var(--adminx-color-primary-dark)]" />
          {validation.message}
        </div>
      ) : null}

      {saveError ? (
        <div className="adminx-surface flex items-center gap-3 rounded-[22px] border border-[rgba(214,69,69,0.18)] px-4 py-4 text-sm font-semibold text-[var(--adminx-color-danger)]">
          <RefreshCw size={16} />
          {saveError}
        </div>
      ) : null}

      <RestaurantSaveBar
        visible={dirty}
        disabled={!validation.ok}
        isSaving={updateSettings.isPending}
        isSaved={saved}
        label={tab === 'address' ? 'Manzilni saqlash' : 'Saqlash'}
        onClick={() => void handleSave()}
      />
    </div>
  );
}
