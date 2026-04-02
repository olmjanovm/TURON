import { AdminPromo, DiscountTypeEnum, PromoStatusEnum, PromoValidationResult } from './types';

export function getPromoStatus(promo: AdminPromo): PromoStatusEnum {
  const now = new Date();
  
  if (!promo.isActive) return PromoStatusEnum.INACTIVE;
  
  if (promo.usageLimit && promo.timesUsed >= promo.usageLimit) {
    return PromoStatusEnum.LIMIT_REACHED;
  }
  
  const start = new Date(promo.startDate);
  if (now < start) {
    return PromoStatusEnum.SCHEDULED;
  }
  
  if (promo.endDate) {
    const end = new Date(promo.endDate);
    if (now > end) {
      return PromoStatusEnum.EXPIRED;
    }
  }
  
  return PromoStatusEnum.ACTIVE;
}

export function validatePromo(promo: AdminPromo | undefined, subtotal: number): PromoValidationResult {
  if (!promo) {
    return {
      success: false,
      reason: 'INVALID_CODE',
      message: 'Ushbu promokod mavjud emas',
      discountAmount: 0,
      normalizedCode: '',
    };
  }

  const status = getPromoStatus(promo);

  if (status === PromoStatusEnum.INACTIVE) {
    return {
      success: false,
      reason: 'INACTIVE',
      message: 'Ushbu promokod faol emas',
      discountAmount: 0,
      normalizedCode: promo.code,
      promo,
    };
  }

  if (status === PromoStatusEnum.EXPIRED) {
    return {
      success: false,
      reason: 'EXPIRED',
      message: 'Promokodning muddati tugagan',
      discountAmount: 0,
      normalizedCode: promo.code,
      promo,
    };
  }

  if (status === PromoStatusEnum.SCHEDULED) {
    return {
      success: false,
      reason: 'NOT_STARTED',
      message: 'Ushbu promokod hali ishga tushmagan',
      discountAmount: 0,
      normalizedCode: promo.code,
      promo,
    };
  }

  if (status === PromoStatusEnum.LIMIT_REACHED) {
    return {
      success: false,
      reason: 'LIMIT_REACHED',
      message: 'Promokoddan foydalanish limiti tugagan',
      discountAmount: 0,
      normalizedCode: promo.code,
      promo,
    };
  }

  if (subtotal < promo.minOrderValue) {
    return {
      success: false,
      reason: 'MIN_ORDER_NOT_MET',
      message: `Promokod ishlashi uchun minimal buyurtma summasi ${promo.minOrderValue.toLocaleString()} so'm bo'lishi kerak`,
      discountAmount: 0,
      normalizedCode: promo.code,
      promo,
    };
  }

  // Calculate discount safely
  let discountAmount = 0;
  if (promo.discountType === DiscountTypeEnum.FIXED) {
    discountAmount = promo.discountValue;
  } else if (promo.discountType === DiscountTypeEnum.PERCENTAGE) {
    const percentage = Math.min(100, Math.max(0, promo.discountValue));
    discountAmount = Math.floor(subtotal * (percentage / 100));
  }

  // Never let discount exceed subtotal
  discountAmount = Math.min(subtotal, discountAmount);

  return {
    success: true,
    message: 'Promokod muvaffaqiyatli qo\'llanildi!',
    discountAmount,
    normalizedCode: promo.code,
    promo,
  };
}
