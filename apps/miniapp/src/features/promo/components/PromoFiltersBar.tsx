import React from 'react';
import { Search } from 'lucide-react';
import { PromoFilterState, DiscountTypeEnum } from '../types';

interface Props {
  filters: PromoFilterState;
  onChange: (filters: PromoFilterState) => void;
}

export const PromoFiltersBar: React.FC<Props> = ({ filters, onChange }) => {
  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
          placeholder="Promokod yoki sarlavhani qidiring..."
          className="w-full h-12 pl-11 pr-4 bg-white border-2 border-slate-100 rounded-[20px] text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 transition-colors shadow-sm"
        />
      </div>

      {/* Filter Chips */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select
          value={filters.statusFilter}
          onChange={(e) => onChange({ ...filters, statusFilter: e.target.value as any })}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-600 appearance-none focus:outline-none"
        >
          <option value="all">Holat: Barchasi</option>
          <option value="active">Holat: Faol</option>
          <option value="inactive">Holat: Nofaol</option>
          <option value="expired">Holat: Tugagan</option>
        </select>

        <select
          value={filters.discountTypeFilter}
          onChange={(e) => onChange({ ...filters, discountTypeFilter: e.target.value as any })}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-600 appearance-none focus:outline-none"
        >
          <option value="all">Tur: Barchasi</option>
          <option value={DiscountTypeEnum.PERCENTAGE}>Tur: Foizli (%)</option>
          <option value={DiscountTypeEnum.FIXED}>Tur: Miqdorli</option>
        </select>
      </div>
    </div>
  );
};
