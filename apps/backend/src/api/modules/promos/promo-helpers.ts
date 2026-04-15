import { PromoDiscountTypeEnum } from '@turon/shared';

function roundCurrency(value: number) {
  return Math.max(0, Math.round(value * 100) / 100);
}

export function serializePromoForValidation(promo: any) {
  return {
    id: promo.id,
    code: promo.code,
    title: promo.title,
    discountType: promo.discountType,
    discountValue: Number(promo.discountValue),
    minOrderValue: Number(promo.minOrderValue),
  };
}

export function serializePromoForAdmin(promo: any) {
  return {
    ...serializePromoForValidation(promo),
    description: '',
    usageLimit: promo.usageLimit ?? undefined,
    timesUsed: promo.timesUsed,
    startDate: promo.startDate.toISOString(),
    endDate: promo.endDate?.toISOString(),
    isActive: promo.isActive,
    isFirstOrderOnly: promo.isFirstOrderOnly ?? false,
    targetUserId: promo.targetUserId ?? null,
    createdAt: promo.createdAt.toISOString(),
    updatedAt: promo.updatedAt.toISOString(),
  };
}

interface EvaluatePromoContext {
  /** If provided, checks targetUserId restriction */
  userId?: string;
  /** Total non-cancelled orders this user has placed (for isFirstOrderOnly check) */
  previousOrderCount?: number;
}

export function evaluatePromoForSubtotal(
  promo: any,
  subtotal: number,
  ctx: EvaluatePromoContext = {},
) {
  const normalizedSubtotal = roundCurrency(subtotal);
  const serializedPromo = promo ? serializePromoForValidation(promo) : undefined;

  if (!promo || !promo.isActive) {
    return {
      isValid: false,
      message: 'Promokod topilmadi',
      discountAmount: 0,
      promo: serializedPromo,
    };
  }

  const now = new Date();

  if (now < promo.startDate) {
    return {
      isValid: false,
      message: 'Promokod hali faollashmagan',
      discountAmount: 0,
      promo: serializedPromo,
    };
  }

  if (promo.endDate && now > promo.endDate) {
    return {
      isValid: false,
      message: 'Promokod muddati tugagan',
      discountAmount: 0,
      promo: serializedPromo,
    };
  }

  if (promo.usageLimit && promo.timesUsed >= promo.usageLimit) {
    return {
      isValid: false,
      message: 'Promokod limiti tugagan',
      discountAmount: 0,
      promo: serializedPromo,
    };
  }

  // ── Target-user restriction ───────────────────────────────────────────────
  if (promo.targetUserId && ctx.userId && promo.targetUserId !== ctx.userId) {
    return {
      isValid: false,
      message: 'Bu promokod siz uchun mo\'ljallanmagan',
      discountAmount: 0,
      promo: serializedPromo,
    };
  }

  // ── First-order-only restriction ─────────────────────────────────────────
  if (promo.isFirstOrderOnly && ctx.previousOrderCount !== undefined && ctx.previousOrderCount > 0) {
    return {
      isValid: false,
      message: 'Bu promokod faqat birinchi buyurtma uchun',
      discountAmount: 0,
      promo: serializedPromo,
    };
  }

  if (normalizedSubtotal < Number(promo.minOrderValue)) {
    return {
      isValid: false,
      message: `Promokod ishlashi uchun minimal buyurtma summasi ${Number(promo.minOrderValue).toLocaleString()} so'm bo'lishi kerak`,
      discountAmount: 0,
      promo: serializedPromo,
    };
  }

  const rawDiscount =
    promo.discountType === PromoDiscountTypeEnum.PERCENTAGE
      ? (normalizedSubtotal * Number(promo.discountValue)) / 100
      : Number(promo.discountValue);

  return {
    isValid: true,
    message: 'Promokod muvaffaqiyatli qo\'llanildi',
    discountAmount: roundCurrency(Math.min(normalizedSubtotal, rawDiscount)),
    promo: serializedPromo,
  };
}
