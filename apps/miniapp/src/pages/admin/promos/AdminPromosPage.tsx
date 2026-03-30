import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { usePromoStore } from '../../../store/usePromoStore';
import { PromoFilterState, DiscountTypeEnum } from '../../../features/promo/types';
import { PromoSummaryCards } from '../../../features/promo/components/PromoSummaryCards';
import { PromoFiltersBar } from '../../../features/promo/components/PromoFiltersBar';
import { PromoCodeCard } from '../../../features/promo/components/PromoCodeCard';

const AdminPromosPage: React.FC = () => {
  const navigate = useNavigate();
  const { ensureSeeded, filterPromos } = usePromoStore();

  const [filters, setFilters] = useState<PromoFilterState>({
    statusFilter: 'all',
    discountTypeFilter: 'all',
    searchQuery: '',
  });

  useEffect(() => {
    ensureSeeded();
  }, [ensureSeeded]);

  const filteredPromos = filterPromos(filters);

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
          Qo'shish
        </button>
      </div>

      <PromoSummaryCards />
      
      <PromoFiltersBar filters={filters} onChange={setFilters} />

      {filteredPromos.length > 0 ? (
        <div className="space-y-3">
          {filteredPromos.map(promo => (
            <PromoCodeCard key={promo.id} promo={promo} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-4">🏷️</div>
          <h3 className="font-bold text-slate-600 text-lg">Promokodlar yo'q</h3>
          <p className="text-sm text-slate-400 mt-1">Yangi chegirma kodi qo'shish uchun yuqoridagi tugmani bosing</p>
        </div>
      )}
    </div>
  );
};

export default AdminPromosPage;
