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
    <div className="space-y-6 animate-in fade-in duration-300 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Promokodlar</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">Chegirmalarni boshqaring</p>
        </div>
        <button
          onClick={() => navigate('/admin/promos/new')}
          className="h-11 px-4 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
        >
          <Plus size={18} />
          Qo&apos;shish
        </button>
      </div>

      <PromoSummaryCards promos={promos} />

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <PromoFiltersBar filters={filters} onChange={setFilters} />
        </div>
        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          className="shrink-0 w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-500 active:scale-95 transition-transform"
          aria-label="Promokodlarni yangilash"
        >
          {isFetching ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 rounded-[24px] bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="bg-rose-50 border border-rose-100 rounded-[24px] p-4 flex items-start gap-3">
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
          {filteredPromos.map((promo) => (
            <PromoCodeCard key={promo.id} promo={promo} />
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && filteredPromos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-4">
            {'\u{1F3F7}\uFE0F'}
          </div>
          <h3 className="font-bold text-slate-600 text-lg">Promokodlar yo&apos;q</h3>
          <p className="text-sm text-slate-400 mt-1">
            Yangi chegirma kodi qo&apos;shish uchun yuqoridagi tugmani bosing
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default AdminPromosPage;
