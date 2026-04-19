import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Plus, RefreshCw } from 'lucide-react';
import { useAdminPromos } from '../../../hooks/queries/usePromos';
import { getPromoStatus } from '../../../features/promo/discountEngine';
import { PromoFilterState } from '../../../features/promo/types';
import { PromoSummaryCards } from '../../../features/promo/components/PromoSummaryCards';
import { PromoFiltersBar } from '../../../features/promo/components/PromoFiltersBar';
import { PromoCodeCard } from '../../../features/promo/components/PromoCodeCard';

const AdminPromosPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    data: promos = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useAdminPromos();

  const [filters, setFilters] = useState<PromoFilterState>({
    statusFilter: 'all',
    discountTypeFilter: 'all',
    searchQuery: '',
  });

  const filteredPromos = useMemo(() => {
    const normalizedQuery = filters.searchQuery.trim().toLowerCase();

    return promos.filter((promo) => {
      const status = getPromoStatus(promo);
      const matchesStatus =
        filters.statusFilter === 'all' ||
        (filters.statusFilter === 'active' && status === 'ACTIVE') ||
        (filters.statusFilter === 'inactive' && status === 'INACTIVE') ||
        (filters.statusFilter === 'expired' && status === 'EXPIRED');
      const matchesDiscountType =
        filters.discountTypeFilter === 'all' || promo.discountType === filters.discountTypeFilter;
      const matchesSearch =
        !normalizedQuery ||
        promo.code.toLowerCase().includes(normalizedQuery) ||
        promo.title?.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesDiscountType && matchesSearch;
    });
  }, [filters, promos]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-10 pt-2">
      <section className="relative overflow-hidden rounded-[22px] border border-white/80 bg-white/75 p-3 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-400 via-sky-300 to-fuchsia-400" />
        <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-indigo-300/20 blur-2xl animate-pulse" />
        <div className="absolute -left-10 bottom-0 h-20 w-20 rounded-full bg-sky-300/20 blur-2xl animate-pulse" />
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/promos/new')}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-black text-white shadow-[0_12px_26px_rgba(79,70,229,0.35)] transition-all hover:shadow-[0_14px_30px_rgba(79,70,229,0.42)] active:scale-[0.98]"
          >
            <Plus size={18} />
            Qo&apos;shish
          </button>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-500 shadow-sm transition-transform active:scale-95"
            aria-label="Promokodlarni yangilash"
          >
            {isFetching ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          </button>
        </div>
      </section>

      <PromoSummaryCards promos={promos} />

      <div className="rounded-[22px] border border-white/80 bg-white/78 p-3 shadow-[0_12px_28px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <PromoFiltersBar filters={filters} onChange={setFilters} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[110px] rounded-[20px] bg-white animate-pulse shadow-sm" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="bg-rose-50 border border-rose-100 rounded-[20px] p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-black text-rose-900">Promokodlar yuklanmadi</p>
            <p className="text-xs font-bold text-rose-700 mt-1 leading-relaxed">
              {(error as Error).message}
            </p>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError && filteredPromos.length > 0 ? (
        <div className="space-y-3">
          {filteredPromos.map((promo, index) => (
            <PromoCodeCard key={promo.id} promo={promo} index={index} />
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && filteredPromos.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-slate-200 bg-white px-5 py-12 text-center">
          <p className="text-base font-black text-slate-700">Promokod topilmadi</p>
          <p className="mt-2 text-sm font-semibold text-slate-400">Filtr yoki qidiruvni o&apos;zgartiring</p>
        </div>
      ) : null}
    </div>
  );
};

export default AdminPromosPage;
