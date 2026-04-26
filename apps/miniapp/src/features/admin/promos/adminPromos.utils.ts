import { getPromoStatus } from '../../promo/discountEngine';
import { AdminPromo, DiscountTypeEnum, PromoStatusEnum } from '../../promo/types';

export type AdminPromoStatusFilter = 'all' | 'active' | 'scheduled' | 'expired' | 'inactive';
export type AdminPromoDiscountFilter = 'all' | DiscountTypeEnum;

export function resolvePromoStatusFilter(rawValue: string | null): AdminPromoStatusFilter {
  if (!rawValue) return 'all';
  return ['all', 'active', 'scheduled', 'expired', 'inactive'].includes(rawValue) ? (rawValue as AdminPromoStatusFilter) : 'all';
}

export function resolvePromoDiscountFilter(rawValue: string | null): AdminPromoDiscountFilter {
  if (!rawValue) return 'all';
  return rawValue === DiscountTypeEnum.PERCENTAGE || rawValue === DiscountTypeEnum.FIXED_AMOUNT
    ? rawValue
    : 'all';
}

export function formatPromoMoney(value: number) {
  return `${value.toLocaleString('uz-UZ')} so'm`;
}

export function formatPromoDate(value?: string) {
  if (!value) return 'Cheklanmagan';
  return new Date(value).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatPromoDateTime(value?: string) {
  if (!value) return 'Cheklanmagan';
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getPromoDiscountLabel(promo: AdminPromo) {
  return promo.discountType === DiscountTypeEnum.PERCENTAGE
    ? `${promo.discountValue}%`
    : formatPromoMoney(promo.discountValue);
}

export function getPromoStatusMeta(promo: AdminPromo) {
  const status = getPromoStatus(promo);

  switch (status) {
    case PromoStatusEnum.ACTIVE:
      return {
        status,
        label: 'Faol',
        className: 'border-[rgba(36,159,99,0.18)] bg-[rgba(240,255,246,0.98)] text-[var(--adminx-color-success)]',
      };
    case PromoStatusEnum.SCHEDULED:
      return {
        status,
        label: 'Kutilmoqda',
        className: 'border-[rgba(45,108,223,0.18)] bg-[rgba(239,245,255,0.98)] text-[var(--adminx-color-info)]',
      };
    case PromoStatusEnum.EXPIRED:
      return {
        status,
        label: 'Tugagan',
        className: 'border-[rgba(214,69,69,0.14)] bg-[rgba(255,244,242,0.95)] text-[var(--adminx-color-danger)]',
      };
    case PromoStatusEnum.LIMIT_REACHED:
      return {
        status,
        label: 'Limit',
        className: 'border-[rgba(245,166,35,0.2)] bg-[rgba(255,247,232,0.96)] text-[var(--adminx-color-primary-dark)]',
      };
    case PromoStatusEnum.INACTIVE:
    default:
      return {
        status,
        label: 'Nofaol',
        className: 'border-[rgba(28,18,7,0.08)] bg-white text-[var(--adminx-color-muted)]',
      };
  }
}

function getPromoPriority(promo: AdminPromo) {
  const status = getPromoStatus(promo);
  switch (status) {
    case PromoStatusEnum.ACTIVE:
      return 0;
    case PromoStatusEnum.SCHEDULED:
      return 1;
    case PromoStatusEnum.LIMIT_REACHED:
      return 2;
    case PromoStatusEnum.INACTIVE:
      return 3;
    case PromoStatusEnum.EXPIRED:
    default:
      return 4;
  }
}

export function sortPromosForAdmin(promos: AdminPromo[]) {
  return [...promos].sort((left, right) => {
    const priority = getPromoPriority(left) - getPromoPriority(right);
    if (priority !== 0) return priority;
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function matchesPromoSearch(promo: AdminPromo, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [promo.code, promo.title, promo.description]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalized));
}

export function matchesPromoStatus(promo: AdminPromo, filter: AdminPromoStatusFilter) {
  const status = getPromoStatus(promo);
  switch (filter) {
    case 'active':
      return status === PromoStatusEnum.ACTIVE;
    case 'scheduled':
      return status === PromoStatusEnum.SCHEDULED;
    case 'expired':
      return status === PromoStatusEnum.EXPIRED || status === PromoStatusEnum.LIMIT_REACHED;
    case 'inactive':
      return status === PromoStatusEnum.INACTIVE;
    case 'all':
    default:
      return true;
  }
}

export function matchesPromoDiscount(promo: AdminPromo, filter: AdminPromoDiscountFilter) {
  return filter === 'all' ? true : promo.discountType === filter;
}

export function buildPromoSummary(promos: AdminPromo[]) {
  const active = promos.filter((promo) => getPromoStatus(promo) === PromoStatusEnum.ACTIVE).length;
  const scheduled = promos.filter((promo) => getPromoStatus(promo) === PromoStatusEnum.SCHEDULED).length;
  const expired = promos.filter((promo) => {
    const status = getPromoStatus(promo);
    return status === PromoStatusEnum.EXPIRED || status === PromoStatusEnum.LIMIT_REACHED;
  }).length;
  const totalUsage = promos.reduce((sum, promo) => sum + (promo.timesUsed || 0), 0);

  return {
    total: promos.length,
    active,
    scheduled,
    expired,
    totalUsage,
  };
}
