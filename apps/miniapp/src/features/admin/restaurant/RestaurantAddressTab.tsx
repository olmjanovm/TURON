import React from 'react';
import { Crosshair, Loader2, Search } from 'lucide-react';
import { resolveCandidate, reverseGeocodeCoordinates, searchAddressCandidates } from '../../../features/maps/yandex';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { RestaurantAddressMap } from './RestaurantAddressMap';
import type { RestaurantSettingsModel } from './restaurantSettings.types';

interface Props {
  draft: RestaurantSettingsModel;
  onChange: (patch: Partial<RestaurantSettingsModel>) => void;
}

export function RestaurantAddressTab({ draft, onChange }: Props) {
  const [query, setQuery] = React.useState(draft.addressText);
  const [busy, setBusy] = React.useState<'gps' | 'search' | null>(null);
  const [suggestions, setSuggestions] = React.useState<Array<Awaited<ReturnType<typeof searchAddressCandidates>>[number]>>([]);
  const debouncedQuery = useDebouncedValue(query, 240);

  React.useEffect(() => {
    setQuery(draft.addressText);
  }, [draft.addressText]);

  React.useEffect(() => {
    let cancelled = false;
    const loadSuggestions = async () => {
      if (debouncedQuery.trim().length < 3) {
        setSuggestions([]);
        return;
      }
      const items = await searchAddressCandidates(debouncedQuery, 5, { lat: draft.latitude, lng: draft.longitude });
      if (!cancelled) setSuggestions(items);
    };
    void loadSuggestions();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, draft.latitude, draft.longitude]);

  const applyCandidate = async (candidate: Awaited<ReturnType<typeof searchAddressCandidates>>[number]) => {
    setBusy('search');
    try {
      const resolved = await resolveCandidate(candidate);
      if (!resolved.pin) return;
      onChange({ latitude: resolved.pin.lat, longitude: resolved.pin.lng, addressText: resolved.address || resolved.title });
      setSuggestions([]);
      setQuery(resolved.address || resolved.title);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="adminx-tab-panel space-y-3">
      <div className="adminx-form-card adminx-restaurant-card p-4">
        <div className="adminx-search-shell adminx-restaurant-search-shell">
          {busy === 'search' ? <Loader2 size={18} className="animate-spin text-[var(--adminx-color-primary-dark)]" /> : <Search size={18} className="text-[var(--adminx-color-faint)]" />}
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Manzil yozing" />
          <button
            type="button"
            onClick={() => {
              if (!navigator.geolocation) return;
              setBusy('gps');
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  const latitude = position.coords.latitude;
                  const longitude = position.coords.longitude;
                  const resolvedAddress = await reverseGeocodeCoordinates({ lat: latitude, lng: longitude });
                  onChange({ latitude, longitude, addressText: resolvedAddress || draft.addressText });
                  setBusy(null);
                },
                () => setBusy(null),
                { enableHighAccuracy: true, timeout: 10_000 },
              );
            }}
            className="adminx-chip adminx-restaurant-gps-chip border-[rgba(245,166,35,0.18)] bg-[var(--adminx-color-primary-soft)] text-[var(--adminx-color-primary-dark)]"
          >
            {busy === 'gps' ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
            GPS
          </button>
        </div>

        {suggestions.length > 0 ? (
          <div className="adminx-suggestion-list mt-2.5">
            {suggestions.map((candidate) => (
              <button key={candidate.id} type="button" onClick={() => void applyCandidate(candidate)} className="adminx-suggestion-button">
                <p className="text-sm font-black text-[var(--adminx-color-ink)]">{candidate.title}</p>
                <p className="mt-0.5 text-xs font-semibold text-[var(--adminx-color-muted)]">{candidate.address}</p>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <RestaurantAddressMap
        latitude={draft.latitude}
        longitude={draft.longitude}
        addressText={draft.addressText}
        onLocationChange={onChange}
      />
    </section>
  );
}
