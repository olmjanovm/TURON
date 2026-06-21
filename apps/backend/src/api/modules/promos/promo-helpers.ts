import { PromoDiscountTypeEnum } from '@turon/shared';

function roundCurrency(value: number) {
  return Math.max(0, Math.round(value * 100) / 100);
}

/** Promokodni normallashtirish: bo'shliqlarni olib tashlash + katta harf.
 *  "salom 30" / " SALOM30 " → "SALOM30". Bo'shliq xatosi endi muammo emas. */
export function normalizePromoCode(raw: string | null | undefined): string {
  return (raw ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

/** Levenshtein masofa (typo o'lchovi). */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function commonPrefixLen(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/**
 * "Did you mean?" — kiritilgan (noto'g'ri/muddati tugagan) kodga eng yaqin
 * HOZIR AMAL QILADIGAN promokodni topadi. Misol: "SALOM20" → "SALOM30".
 * Faqat yetarlicha yaqin bo'lsa taklif qiladi (tasodifiy emas).
 */
export function suggestPromoCode(input: string, candidateCodes: string[]): string | null {
  const norm = normalizePromoCode(input);
  if (!norm || candidateCodes.length === 0) return null;
  let best: { code: string; dist: number; prefix: number } | null = null;
  for (const code of candidateCodes) {
    if (code === norm) continue;
    const dist = levenshtein(norm, code);
    const prefix = commonPrefixLen(norm, code);
    if (
      !best ||
      dist < best.dist ||
      (dist === best.dist && prefix > best.prefix)
    ) {
      best = { code, dist, prefix };
    }
  }
  if (!best) return null;
  const maxLen = Math.max(norm.length, best.code.length);
  // Yaqinlik mezoni: kichik masofa YOKI uzun umumiy prefiks (SALOM20→SALOM30).
  const closeEnough =
    best.dist <= Math.max(2, Math.ceil(maxLen * 0.34)) ||
    (best.prefix >= 3 && best.dist <= 4);
  return closeEnough ? best.code : null;
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
