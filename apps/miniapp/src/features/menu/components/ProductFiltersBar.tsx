import React from 'react';
import { Search } from 'lucide-react';
import { ProductAvailabilityEnum } from '@turon/shared';
import { ProductFilterState } from '../types';
import { useMenuStore } from '../../../store/useMenuStore';

interface Props {
  filters: ProductFilterState;
  onChange: (filters: ProductFilterState) => void;
}

const ProductFiltersBar: React.FC<Props> = ({ filters, onChange }) => {
  const { categories } = useMenuStore();

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
          placeholder="Taom nomi bo'yicha qidirish..."
          className="w-full h-12 pl-11 pr-4 rounded-2xl border-2 border-slate-100 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:border-blue-400 transition-colors"
        />
      </div>

      {/* Filters row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {/* Category filter */}
        <select
          value={filters.categoryId}
          onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
          className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white focus:outline-none min-w-fit"
        >
          <option value="all">Barcha kategoriyalar</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Active filter */}
        <select
          value={filters.activeFilter}
          onChange={(e) => onChange({ ...filters, activeFilter: e.target.value as 'all' | 'active' | 'inactive' })}
          className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white focus:outline-none min-w-fit"
        >
          <option value="all">Barchasi</option>
          <option value="active">Faol</option>
          <option value="inactive">Nofaol</option>
        </select>

        {/* Availability filter */}
        <select
          value={filters.availabilityFilter}
          onChange={(e) => onChange({ ...filters, availabilityFilter: e.target.value as 'all' | ProductAvailabilityEnum })}
          className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white focus:outline-none min-w-fit"
        >
          <option value="all">Holati: Barcha</option>
          <option value={ProductAvailabilityEnum.AVAILABLE}>Mavjud</option>
          <option value={ProductAvailabilityEnum.TEMPORARILY_UNAVAILABLE}>Vaqtincha yo'q</option>
          <option value={ProductAvailabilityEnum.OUT_OF_STOCK}>Tugagan</option>
        </select>
      </div>
    </div>
  );
};

export default ProductFiltersBar;
