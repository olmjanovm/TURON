export enum DiscountTypeEnum {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FIXED = 'FIXED_AMOUNT',
}

export enum PromoStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  SCHEDULED = 'SCHEDULED',
  LIMIT_REACHED = 'LIMIT_REACHED',
}

export interface AdminPromo {
  id: string;
  code: string;
  title?: string;
  description?: string;
  discountType: DiscountTypeEnum;
  discountValue: number;
  minOrderValue: number;
  startDate: string; // ISO String
  endDate?: string; // ISO String (optional)
  usageLimit?: number; // 0 or undefined means unlimited
  timesUsed: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromoValidationResult {
  success: boolean;
  reason?: 'INVALID_CODE' | 'INACTIVE' | 'EXPIRED' | 'NOT_STARTED' | 'LIMIT_REACHED' | 'MIN_ORDER_NOT_MET' | 'UNKNOWN';
  message: string;
  discountAmount: number;
  normalizedCode: string;
  promo?: AdminPromo;
}

export interface PromoFormData {
  code: string;
  title: string;
  description: string;
  discountType: DiscountTypeEnum;
  discountValue: number;
  minOrderValue: number;
  startDate: string; // YYYY-MM-DD format for inputs
  endDate: string; // YYYY-MM-DD
  usageLimit: number; // 0 for unlimited
  isActive: boolean;
}

export interface PromoFilterState {
  statusFilter: 'all' | 'active' | 'inactive' | 'expired';
  discountTypeFilter: 'all' | DiscountTypeEnum;
  searchQuery: string;
}
