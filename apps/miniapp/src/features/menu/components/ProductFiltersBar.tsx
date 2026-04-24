import React from 'react';
import { Search } from 'lucide-react';
import { ProductAvailabilityEnum } from '@turon/shared';
import type { MenuCategory, ProductFilterState } from '../types';

interface Props {
  categories: MenuCategory[];
  filters: ProductFilterState;
  onChange: (filters: ProductFilterState) => void;
}

const ProductFiltersBar: React.FC<Props> = ({ categories, filters, onChange }) => {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(event) => onChange({ ...filters, searchQuery: event.target.value })}
          placeholder="Taom nomi bo'yicha qidirish..."
          className="w-full h-12 pl-11 pr-4 rounded-2xl border-2 border-slate-100 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:border-[rgba(255,190,11,0.52)] transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <select
          value={filters.categoryId}
          onChange={(event) => onChange({ ...filters, categoryId: event.target.value })}
          className="col-span-2 h-11 w-full min-w-0 rounded-xl border border-[var(--admin-pro-line)] bg-white/92 px-3 text-[13px] font-bold text-slate-600 focus:outline-none md:col-span-1"
        >
          <option value="all">Barcha kategoriyalar</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={filters.activeFilter}
          onChange={(event) =>
            onChange({
              ...filters,
              activeFilter: event.target.value as 'all' | 'active' | 'inactive',
            })
          }
          className="h-11 w-full min-w-0 rounded-xl border border-[var(--admin-pro-line)] bg-white/92 px-3 text-[13px] font-bold text-slate-600 focus:outline-none"
        >
          <option value="all">Barchasi</option>
          <option value="active">Faol</option>
          <option value="inactive">Nofaol</option>
        </select>

        <select
          value={filters.availabilityFilter}
          onChange={(event) =>
            onChange({
              ...filters,
              availabilityFilter: event.target.value as 'all' | ProductAvailabilityEnum,
            })
          }
          className="h-11 w-full min-w-0 rounded-xl border border-[var(--admin-pro-line)] bg-white/92 px-3 text-[13px] font-bold text-slate-600 focus:outline-none"
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
