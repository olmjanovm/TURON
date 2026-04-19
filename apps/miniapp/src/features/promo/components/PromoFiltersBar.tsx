import React from 'react';
import { Search } from 'lucide-react';
import { PromoFilterState, DiscountTypeEnum } from '../types';

interface Props {
  filters: PromoFilterState;
  onChange: (filters: PromoFilterState) => void;
}

export const PromoFiltersBar: React.FC<Props> = ({ filters, onChange }) => {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_190px_190px]">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
          placeholder="Promokod yoki sarlavhani qidiring..."
          className="h-10 w-full rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] pl-10 pr-3 text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#2563EB]"
        />
      </div>

      <select
        value={filters.statusFilter}
        onChange={(e) => onChange({ ...filters, statusFilter: e.target.value as any })}
        className="h-10 w-full appearance-none rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-[13px] font-semibold text-[#374151] outline-none transition-colors focus:border-[#2563EB]"
      >
        <option value="all">Holat: Barchasi</option>
        <option value="active">Holat: Faol</option>
        <option value="inactive">Holat: Nofaol</option>
        <option value="expired">Holat: Tugagan</option>
      </select>

      <select
        value={filters.discountTypeFilter}
        onChange={(e) => onChange({ ...filters, discountTypeFilter: e.target.value as any })}
        className="h-10 w-full appearance-none rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-[13px] font-semibold text-[#374151] outline-none transition-colors focus:border-[#2563EB]"
      >
        <option value="all">Tur: Barchasi</option>
        <option value={DiscountTypeEnum.PERCENTAGE}>Tur: Foizli (%)</option>
        <option value={DiscountTypeEnum.FIXED}>Tur: Miqdorli</option>
      </select>
    </div>
  );
};
