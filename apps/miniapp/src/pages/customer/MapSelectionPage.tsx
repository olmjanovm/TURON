import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
  Store,
  Target,
} from 'lucide-react';
import type { AddressCandidate, RouteInfo } from '../../features/maps/MapProvider';
import { formatGeolocationAccuracy, getUserGeolocationErrorMessage } from '../../features/maps/geolocation';
import { getMapProvider } from '../../features/maps/provider';
import { DEFAULT_RESTAURANT_LOCATION } from '../../features/maps/restaurant';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';
import { useAddressStore } from '../../store/useAddressStore';

const TASHKENT_CENTER = { lat: 41.2995, lng: 69.2401 };

const MapSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { draftAddress, updateDraft } = useAddressStore();
  const { language } = useCustomerLanguage();
  const mapProvider = getMapProvider();
  const LocationPicker = mapProvider.LocationPicker;
  const skipNextSearchRef = React.useRef(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<AddressCandidate[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [resolvingSuggestionId, setResolvingSuggestionId] = React.useState<string | null>(null);
  const [searchFeedback, setSearchFeedback] = React.useState<string | null>(null);
  const [selectedPin, setSelectedPin] = React.useState({
    lat: draftAddress?.latitude || TASHKENT_CENTER.lat,
    lng: draftAddress?.longitude || TASHKENT_CENTER.lng,
  });
  const [resolvedAddress, setResolvedAddress] = React.useState(draftAddress?.addressText || '');
  const [isResolvingAddress, setIsResolvingAddress] = React.useState(false);
  const [isLocatingMe, setIsLocatingMe] = React.useState(false);
  const [locationHint, setLocationHint] = React.useState<string | null>(null);
  const [userLocationPin, setUserLocationPin] = React.useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = React.useState<RouteInfo | null>(null);

  const copy =
    language === 'ru'
      ? {
          title: 'Tochka dostavki',
          subtitle: 'Pin zafiksirovan. Dvigayte kartu pod marker.',
          searchPlaceholder: mapProvider.supportsAddressSearch
            ? 'Ulitsa, dom, orientir...'
            : 'Dlya poiska nuzhen Yandex API key',
          searching: 'Ishchem adres...',
          noResults: 'Podhodyashchiy adres ne naiden.',
          searchError: 'Ne udalos nayti adres.',
          geolocationUnsupported: 'Geolokatsiya ne podderzhivaetsya.',
          resolving: 'Utochnyaem adres...',
          selected: 'Vybrannyy adres',
          confirmBadge: 'Podtverzhdenie',
          radius: 'Radius',
          distance: 'Rasstoyanie',
          eta: 'ETA',
          precision: 'Tochnost',
          basedOnCurrent: 'Karta centrirovana po tekushchey lokacii',
          confirm: 'Dostavlyat syuda',
          calculating: 'Schitaetsya',
        }
      : {
          title: 'Yetkazish nuqtasi',
          subtitle: 'Pin markazda turadi. Xarita ostidan suriladi.',
          searchPlaceholder: mapProvider.supportsAddressSearch
            ? "Ko'cha, uy, mo'ljal..."
            : 'Qidiruv uchun Yandex API key kerak',
          searching: 'Manzil qidirilmoqda...',
          noResults: "Mos manzil topilmadi. So'rovni aniqlashtiring.",
          searchError: 'Manzilni qidirishda xatolik yuz berdi.',
          geolocationUnsupported: "Geolokatsiya qo'llab-quvvatlanmaydi.",
          resolving: 'Manzil aniqlanmoqda...',
          selected: 'Tanlangan manzil',
          confirmBadge: 'Tasdiq',
          radius: 'Radius',
          distance: 'Masofa',
          eta: 'ETA',
          precision: 'Aniqlik',
          basedOnCurrent: 'Joriy joylashuv bo`yicha markazlandi',
          confirm: 'Shu yerga yetkazilsin',
          calculating: 'Hisoblanmoqda',
        };

  React.useEffect(() => {
    if (!draftAddress) {
      navigate('/customer/addresses', { replace: true });
    }
  }, [draftAddress, navigate]);

  React.useEffect(() => {
    let isCancelled = false;

    const timeoutId = window.setTimeout(async () => {
      setIsResolvingAddress(true);
      const geocodedAddress = await mapProvider.reverseGeocode(selectedPin);

      if (!isCancelled) {
        setResolvedAddress(geocodedAddress || mapProvider.formatCoordinateAddress(selectedPin));
        setIsResolvingAddress(false);
      }
    }, 350);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [mapProvider, selectedPin]);

  React.useEffect(() => {
    if (!mapProvider.supportsAddressSearch) {
      setSearchResults([]);
      setSearchFeedback(null);
      setIsSearching(false);
      return;
    }

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    const normalizedQuery = searchQuery.trim();
    if (normalizedQuery.length < 3) {
      setSearchResults([]);
      setSearchFeedback(null);
      setIsSearching(false);
      return;
    }

    let isCancelled = false;
    setIsSearching(true);
    setSearchFeedback(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await mapProvider.searchAddresses(normalizedQuery, 5, userLocationPin || selectedPin);

        if (isCancelled) {
          return;
        }

        setSearchResults(results);
        if (results.length === 0) {
          setSearchFeedback(copy.noResults);
        }
      } catch {
        if (!isCancelled) {
          setSearchResults([]);
          setSearchFeedback(copy.searchError);
        }
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 280);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [copy.noResults, copy.searchError, mapProvider, searchQuery, selectedPin, userLocationPin]);

  if (!draftAddress) {
    return null;
  }

  const handleSearchPick = async (candidate: AddressCandidate) => {
    try {
      setResolvingSuggestionId(candidate.id);
      const resolvedCandidate = await mapProvider.resolveAddressCandidate(candidate);

      if (!resolvedCandidate.pin) {
        throw new Error("Tanlangan nuqtaning koordinatalari topilmadi.");
      }

      skipNextSearchRef.current = true;
      setSearchQuery(resolvedCandidate.address);
      setSearchResults([]);
      setSearchFeedback(null);
      setResolvedAddress(resolvedCandidate.address);
      setSelectedPin(resolvedCandidate.pin);
    } catch (error) {
      setSearchFeedback((error as Error).message);
    } finally {
      setResolvingSuggestionId(null);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!mapProvider.supportsGeolocation) {
      setSearchFeedback(copy.geolocationUnsupported);
      return;
    }

    setIsLocatingMe(true);
    setSearchFeedback(null);
    setLocationHint(null);

    void mapProvider
      .detectUserLocation()
      .then((location) => {
        setUserLocationPin(location.pin);
        setSelectedPin(location.pin);
        setSearchResults([]);

        const accuracy = formatGeolocationAccuracy(location.accuracy);
        setLocationHint(accuracy ? `${copy.precision}: ${accuracy}` : copy.basedOnCurrent);
      })
      .catch((locationError) => {
        setSearchFeedback(getUserGeolocationErrorMessage(locationError));
      })
      .finally(() => {
        setIsLocatingMe(false);
      });
  };

  const handleConfirm = () => {
    updateDraft({
      latitude: selectedPin.lat,
      longitude: selectedPin.lng,
      addressText: resolvedAddress || mapProvider.formatCoordinateAddress(selectedPin),
    });
    navigate(-1);
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-950 text-white animate-in fade-in duration-500">
      <div className="relative h-full">
        <LocationPicker
          initialCenter={selectedPin}
          onLocationSelect={setSelectedPin}
          onRouteInfoChange={setRouteInfo}
          userLocationPin={userLocationPin}
          restaurantLocationPin={DEFAULT_RESTAURANT_LOCATION.pin}
          height="100%"
          className="rounded-none border-0"
        />

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.66)_0%,rgba(2,6,23,0.08)_20%,rgba(2,6,23,0)_45%,rgba(2,6,23,0.72)_100%)]" />

        <div className="absolute left-4 right-4 top-4 z-20 space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/72 text-white backdrop-blur-md transition-transform active:scale-95"
            >
              <ChevronLeft size={22} />
            </button>

            <div className="rounded-[12px] bg-slate-900/72 px-4 py-3 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/48">{copy.title}</p>
              <p className="mt-1 text-sm font-black text-white">{copy.subtitle}</p>
            </div>
          </div>

          <div className="rounded-[12px] bg-slate-900/74 p-3 backdrop-blur-md">
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                disabled={!mapProvider.supportsAddressSearch}
                placeholder={copy.searchPlaceholder}
                className="h-12 w-full rounded-[12px] border border-white/8 bg-white/8 pl-12 pr-4 text-sm font-bold text-white placeholder:text-white/35 outline-none"
              />
            </div>

            {isSearching ? (
              <div className="mt-3 flex items-center gap-2 rounded-[12px] bg-white/8 px-4 py-3 text-sm font-bold text-white/72">
                <Loader2 size={16} className="animate-spin" />
                <span>{copy.searching}</span>
              </div>
            ) : null}

            {!isSearching && searchResults.length > 0 ? (
              <div className="mt-3 space-y-2">
                {searchResults.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => {
                      void handleSearchPick(candidate);
                    }}
                    disabled={Boolean(resolvingSuggestionId)}
                    className="flex w-full items-start gap-3 rounded-[12px] bg-white/8 px-4 py-3 text-left transition-colors active:bg-white/12 disabled:opacity-60"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#ffd600] text-slate-950">
                      {resolvingSuggestionId === candidate.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <MapPin size={16} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-black text-white">{candidate.title}</p>
                        {candidate.distanceText ? (
                          <span className="shrink-0 rounded-full border border-white/8 bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/58">
                            {candidate.distanceText}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/62">
                        {candidate.subtitle ? `${candidate.subtitle}, ${candidate.address}` : candidate.address}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {!isSearching && searchFeedback ? (
              <div className="mt-3 flex items-start gap-2 rounded-[12px] bg-amber-400/12 px-4 py-3 text-sm font-bold text-amber-200">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{searchFeedback}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="absolute bottom-[254px] right-4 z-20">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocatingMe}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/74 text-white shadow-lg backdrop-blur-md transition-transform active:scale-95 disabled:opacity-60"
          >
            {isLocatingMe ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />}
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-[24px] bg-[#161616]/94 px-4 pb-4 pt-3 shadow-[0_-24px_52px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="mx-auto h-1.5 w-14 rounded-full bg-white/18" />

          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">{copy.selected}</p>
              {isResolvingAddress ? (
                <div className="mt-2 flex items-center gap-2 text-sm font-bold text-white/70">
                  <Loader2 size={14} className="animate-spin" />
                  <span>{copy.resolving}</span>
                </div>
              ) : (
                <p className="mt-2 max-w-[250px] text-[15px] font-black leading-6 text-white">
                  {resolvedAddress || mapProvider.formatCoordinateAddress(selectedPin)}
                </p>
              )}
            </div>

            <div className="rounded-full bg-[#ffd600] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950">
              {copy.confirmBadge}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-[12px] bg-white/6 px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#ffd600] text-slate-950">
                <Target size={16} />
              </div>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/42">{copy.radius}</p>
              <p className="mt-1 text-sm font-black text-white">50m</p>
            </div>

            <div className="rounded-[12px] bg-white/6 px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/10 text-white">
                <RoutePinIcon />
              </div>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/42">{copy.distance}</p>
              <p className="mt-1 text-sm font-black text-white">{routeInfo?.distance || copy.calculating}</p>
            </div>

            <div className="rounded-[12px] bg-white/6 px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-400/18 text-emerald-300">
                <Store size={16} />
              </div>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/42">{copy.eta}</p>
              <p className="mt-1 text-sm font-black text-white">{routeInfo?.eta || copy.calculating}</p>
            </div>
          </div>

          <div className="mt-4 rounded-[12px] bg-white/6 px-4 py-3.5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">{copy.precision}</p>
            <p className="mt-2 text-sm leading-6 text-white/68">
              Nuqta taxminan 50 metr aniqlik bilan saqlanadi. Qavat, eshik kodi va qo'shimcha izoh keyingi bosqichda kiritiladi.
            </p>
            {locationHint ? <p className="mt-2 text-[11px] font-bold text-emerald-300">{locationHint}</p> : null}
            {!locationHint && userLocationPin ? (
              <p className="mt-2 text-[11px] font-bold text-white/56">{copy.basedOnCurrent}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isResolvingAddress || isLocatingMe}
            className="mt-4 flex h-[54px] w-full items-center justify-center gap-3 rounded-[12px] bg-[#ffd600] text-base font-black text-slate-950 transition-transform active:scale-[0.985] disabled:opacity-60"
          >
            <Check size={20} />
            <span>{copy.confirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function RoutePinIcon() {
  return (
    <span className="relative block h-4 w-4">
      <span className="absolute inset-0 rounded-full border-2 border-current" />
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
    </span>
  );
}

export default MapSelectionPage;
