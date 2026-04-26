import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import '../../../styles/admin-overhaul.css';
import { DiscountTypeEnum } from '../../../features/promo/types';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useAdminPromos } from '../../../hooks/queries/usePromos';
import { AdminPromoRow } from '../../../features/admin/promos/AdminPromoRow';
import { AdminPromosSkeleton } from '../../../features/admin/promos/AdminPromosSkeleton';
import { AdminPromosToolbar } from '../../../features/admin/promos/AdminPromosToolbar';
import {
  buildPromoSummary,
  matchesPromoDiscount,
  matchesPromoSearch,
  matchesPromoStatus,
  resolvePromoDiscountFilter,
  resolvePromoStatusFilter,
  sortPromosForAdmin,
  type AdminPromoDiscountFilter,
  type AdminPromoStatusFilter,
} from '../../../features/admin/promos/adminPromos.utils';

export default function AdminPromosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = React.useState(() => searchParams.get('q') ?? '');
  const [statusFilter, setStatusFilter] = React.useState<AdminPromoStatusFilter>(() =>
    resolvePromoStatusFilter(searchParams.get('status')),
  );
  const [discountFilter, setDiscountFilter] = React.useState<AdminPromoDiscountFilter>(() =>
    resolvePromoDiscountFilter(searchParams.get('discountType')),
  );

  const debouncedQuery = useDebouncedValue(searchInput, 220);
  const { data: promos = [], isLoading, isError, error, isFetching, refetch } = useAdminPromos();

  React.useEffect(() => {
    const urlQuery = searchParams.get('q') ?? '';
    const urlStatus = resolvePromoStatusFilter(searchParams.get('status'));
    const urlDiscount = resolvePromoDiscountFilter(searchParams.get('discountType'));

    setSearchInput((current) => (current === urlQuery ? current : urlQuery));
    setStatusFilter((current) => (current === urlStatus ? current : urlStatus));
    setDiscountFilter((current) => (current === urlDiscount ? current : urlDiscount));
  }, [searchParams]);

  React.useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);

    if (debouncedQuery.trim()) nextParams.set('q', debouncedQuery.trim());
    else nextParams.delete('q');

    if (statusFilter !== 'all') nextParams.set('status', statusFilter);
    else nextParams.delete('status');

    if (discountFilter !== 'all') nextParams.set('discountType', discountFilter);
    else nextParams.delete('discountType');

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedQuery, statusFilter, discountFilter, searchParams, setSearchParams]);

  const sortedPromos = React.useMemo(() => sortPromosForAdmin(promos), [promos]);
  const filteredPromos = React.useMemo(
    () =>
      sortedPromos.filter(
        (promo) =>
          matchesPromoStatus(promo, statusFilter) &&
          matchesPromoDiscount(promo, discountFilter) &&
          matchesPromoSearch(promo, debouncedQuery),
      ),
    [sortedPromos, statusFilter, discountFilter, debouncedQuery],
  );
  const summary = React.useMemo(() => buildPromoSummary(sortedPromos), [sortedPromos]);

  if (isLoading) {
    return <AdminPromosSkeleton />;
  }

  if (isError) {
    return (
      <div className="adminx-page pb-[calc(env(safe-area-inset-bottom,0px)+108px)]">
        <div className="adminx-surface flex min-h-[340px] flex-col items-center justify-center rounded-[24px] px-6 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[rgba(255,244,242,0.95)] text-[var(--adminx-color-danger)]">
            <AlertCircle size={28} />
          </div>
          <h2 className="mt-5 text-xl font-black tracking-[-0.04em] text-[var(--adminx-color-ink)]">Promokodlar ochilmadi</h2>
          <p className="mt-2 max-w-[260px] text-sm font-semibold text-[var(--adminx-color-muted)]">
            {error instanceof Error ? error.message : 'Server bilan aloqa tiklanmadi'}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,var(--adminx-color-primary)_0%,var(--adminx-color-primary-dark)_100%)] px-5 text-sm font-black text-[var(--adminx-color-dark)] shadow-[var(--adminx-shadow-glow)]"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="adminx-page space-y-3 pb-[calc(env(safe-area-inset-bottom,0px)+108px)]">
      <AdminPromosToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchClear={() => setSearchInput('')}
        statusFilter={statusFilter}
        onStatusFilterChange={(next) => {
          setStatusFilter(next);
          window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
        }}
        discountFilter={discountFilter}
        onDiscountFilterChange={(next) => setDiscountFilter(next)}
        summary={summary}
        onRefresh={() => void refetch()}
        onCreate={() => navigate('/admin/promos/new')}
        isFetching={isFetching}
      />

      {filteredPromos.length === 0 ? (
        <div className="adminx-surface flex flex-col items-center justify-center rounded-[24px] px-6 py-16 text-center">
          <h3 className="text-lg font-black tracking-[-0.03em] text-[var(--adminx-color-ink)]">Promokod topilmadi</h3>
          <p className="mt-2 text-sm font-semibold text-[var(--adminx-color-muted)]">Qidiruv yoki filtrni o'zgartiring</p>
          {(debouncedQuery.trim() || statusFilter !== 'all' || discountFilter !== 'all') ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setStatusFilter('all');
                setDiscountFilter('all');
              }}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[16px] border border-[rgba(28,18,7,0.08)] bg-white px-5 text-sm font-black text-[var(--adminx-color-ink)]"
            >
              Tozalash
            </button>
          ) : null}
        </div>
      ) : (
        <section className="space-y-2.5">
          {filteredPromos.map((promo, index) => (
            <AdminPromoRow key={promo.id} promo={promo} index={index} />
          ))}
        </section>
      )}
    </div>
  );
}
