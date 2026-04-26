import React from 'react';
import { Plus, RefreshCw, Search, X } from 'lucide-react';
import { DiscountTypeEnum } from '../../promo/types';
import type { AdminPromoDiscountFilter, AdminPromoStatusFilter } from './adminPromos.utils';

interface AdminPromosToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  statusFilter: AdminPromoStatusFilter;
  onStatusFilterChange: (value: AdminPromoStatusFilter) => void;
  discountFilter: AdminPromoDiscountFilter;
  onDiscountFilterChange: (value: AdminPromoDiscountFilter) => void;
  summary: {
    total: number;
    active: number;
    scheduled: number;
    expired: number;
    totalUsage: number;
  };
  onRefresh: () => void;
  onCreate: () => void;
  isFetching: boolean;
}

const STATUS_OPTIONS: Array<{ value: AdminPromoStatusFilter; label: string }> = [
  { value: 'all', label: 'Hammasi' },
  { value: 'active', label: 'Faol' },
  { value: 'scheduled', label: 'Kutilmoqda' },
  { value: 'expired', label: 'Tugagan' },
  { value: 'inactive', label: 'Nofaol' },
];

const DISCOUNT_OPTIONS: Array<{ value: AdminPromoDiscountFilter; label: string }> = [
  { value: 'all', label: 'Turi' },
  { value: DiscountTypeEnum.PERCENTAGE, label: '%' },
  { value: DiscountTypeEnum.FIXED_AMOUNT, label: 'So\'m' },
];

export function AdminPromosToolbar({
  searchValue,
  onSearchChange,
  onSearchClear,
  statusFilter,
  onStatusFilterChange,
  discountFilter,
  onDiscountFilterChange,
  summary,
  onRefresh,
  onCreate,
  isFetching,
}: AdminPromosToolbarProps) {
  return (
    <section className="adminx-surface rounded-[22px] px-4 py-4">
      <div className="flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-[16px] border border-[rgba(28,18,7,0.08)] bg-white/95 px-4 py-3 shadow-[var(--adminx-shadow-soft)]">
          <Search size={17} className="text-[var(--adminx-color-faint)]" />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Kod yoki sarlavha"
            className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[var(--adminx-color-ink)] outline-none placeholder:text-[var(--adminx-color-faint)]"
          />
          {searchValue ? (
            <button
              type="button"
              onClick={onSearchClear}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(28,18,7,0.08)] bg-white text-[var(--adminx-color-muted)]"
            >
              <X size={14} />
            </button>
          ) : null}
        </label>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[rgba(28,18,7,0.08)] bg-white text-[var(--adminx-color-ink)] shadow-[var(--adminx-shadow-soft)]"
          aria-label="Yangilash"
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
        </button>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,var(--adminx-color-primary)_0%,var(--adminx-color-primary-dark)_100%)] text-[var(--adminx-color-dark)] shadow-[var(--adminx-shadow-glow)]"
          aria-label="Promokod qo'shish"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <div className="adminx-promo-stat"><span>Jami</span><strong>{summary.total}</strong></div>
        <div className="adminx-promo-stat"><span>Faol</span><strong>{summary.active}</strong></div>
        <div className="adminx-promo-stat"><span>Kutilmoqda</span><strong>{summary.scheduled}</strong></div>
        <div className="adminx-promo-stat"><span>Ishlatilgan</span><strong>{summary.totalUsage}</strong></div>
      </div>

      <div className="adminx-stat-rail mt-3">
        {STATUS_OPTIONS.map((option, index) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onStatusFilterChange(option.value)}
            className="adminx-promo-filter"
            data-active={statusFilter === option.value}
            style={{ ['--i' as string]: index } as React.CSSProperties}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        {DISCOUNT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onDiscountFilterChange(option.value)}
            className="adminx-promo-chip"
            data-active={discountFilter === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
