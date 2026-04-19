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
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
          placeholder="Promokod yoki sarlavhani qidiring..."
          className="h-12 w-full rounded-[16px] border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 shadow-[0_8px_20px_rgba(15,23,42,0.06)] outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select
          value={filters.statusFilter}
          onChange={(e) => onChange({ ...filters, statusFilter: e.target.value as any })}
          className="h-11 w-full appearance-none rounded-[14px] border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-600 shadow-[0_6px_16px_rgba(15,23,42,0.05)] outline-none transition-colors focus:border-indigo-300"
        >
          <option value="all">Holat: Barchasi</option>
          <option value="active">Holat: Faol</option>
          <option value="inactive">Holat: Nofaol</option>
          <option value="expired">Holat: Tugagan</option>
        </select>

        <select
          value={filters.discountTypeFilter}
          onChange={(e) => onChange({ ...filters, discountTypeFilter: e.target.value as any })}
          className="h-11 w-full appearance-none rounded-[14px] border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-600 shadow-[0_6px_16px_rgba(15,23,42,0.05)] outline-none transition-colors focus:border-indigo-300"
        >
          <option value="all">Tur: Barchasi</option>
          <option value={DiscountTypeEnum.PERCENTAGE}>Tur: Foizli (%)</option>
          <option value={DiscountTypeEnum.FIXED}>Tur: Miqdorli</option>
        </select>
      </div>
    </div>
  );
};
