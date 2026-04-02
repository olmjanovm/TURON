import { ProductBadgeEnum } from '@turon/shared';
import type { MenuCategory, MenuProduct } from './types';

const CATEGORY_PRIORITY = [
  'osh',
  "sho'rva",
  'shorva',
  'fast food',
  'lavash',
  'burger',
  'donar',
  'pitsa',
  'pizza',
  'grill / kfc',
  'grill',
  'kfc',
  'ichimliklar',
  'shirinliklar',
  'dessert',
  'desert',
  'tortlar',
  'somsa',
  'muzqaymoq',
  'salatlar',
  'kombo',
] as const;

const CATEGORY_LABELS: Array<{ match: string[]; label: string }> = [
  { match: ['pizza', 'pitsa'], label: 'Pitsa' },
  { match: ['dessert', 'desert'], label: 'Shirinliklar' },
  { match: ['drinks', 'napitki', 'ichimliklar'], label: 'Ichimliklar' },
  { match: ['combo', 'kombo'], label: 'Fast food' },
];

const DISCOUNT_KEYWORDS = ['lavash', 'burger', 'donar', 'pizza', 'pitsa', 'somsa', 'grill', 'kfc'];
const POPULAR_KEYWORDS = ['osh', 'lavash', 'burger', 'donar', 'pizza', 'pitsa', 'somsa', 'grill', 'kfc'];
const NEW_KEYWORDS = ['tort', 'muzqaymoq', 'shirinlik', 'desert', 'dessert', 'ichimlik', 'drink'];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[`´']/g, '')
    .replace(/\s+/g, ' ');

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const roundUpPrice = (price: number, ratio: number) => Math.ceil((price * ratio) / 1000) * 1000;

export function getCustomerCategoryLabel(name: string) {
  const normalized = normalize(name);
  const matched = CATEGORY_LABELS.find((entry) => entry.match.some((token) => normalized.includes(token)));
  return matched?.label ?? name;
}

export function sortCustomerCategories(categories: MenuCategory[]) {
  return [...categories].sort((left, right) => {
    const leftLabel = normalize(getCustomerCategoryLabel(left.name));
    const rightLabel = normalize(getCustomerCategoryLabel(right.name));
    const leftPriority = CATEGORY_PRIORITY.findIndex((token) => leftLabel.includes(token));
    const rightPriority = CATEGORY_PRIORITY.findIndex((token) => rightLabel.includes(token));

    if (leftPriority !== rightPriority) {
      return (leftPriority === -1 ? Number.MAX_SAFE_INTEGER : leftPriority) - (rightPriority === -1 ? Number.MAX_SAFE_INTEGER : rightPriority);
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return leftLabel.localeCompare(rightLabel);
  });
}

export function getProductSecondaryText(product: MenuProduct) {
  const weight = product.weight?.trim() || product.weightText?.trim();
  if (weight) {
    return weight;
  }

  const [firstSentence] = product.description.split(/[.!?]/);
  return firstSentence.trim().slice(0, 44);
}

export function getProductPromotion(product: MenuProduct, categoryName?: string) {
  const normalized = normalize(`${product.name} ${categoryName ?? ''}`);
  const seed = hashString(`${product.id}:${normalized}`);
  const matchesDiscountKeyword = DISCOUNT_KEYWORDS.some((token) => normalized.includes(token));
  const matchesPopularKeyword = POPULAR_KEYWORDS.some((token) => normalized.includes(token));
  const matchesNewKeyword = NEW_KEYWORDS.some((token) => normalized.includes(token));
  const hasRealDiscount = Boolean(product.isDiscounted || product.oldPrice || product.discountPercent);

  const isDiscounted =
    hasRealDiscount ||
    product.badge === ProductBadgeEnum.DISCOUNT ||
    (matchesDiscountKeyword && seed % 3 === 0);

  if (isDiscounted) {
    const oldPrice =
      product.oldPrice && product.oldPrice > product.price
        ? product.oldPrice
        : roundUpPrice(product.price, 1.18 + (seed % 2) * 0.04);
    const discountPercent =
      product.discountPercent ??
      Math.max(10, Math.round(((oldPrice - product.price) / oldPrice) * 100));
    return {
      kind: 'discount' as const,
      badgeLabel: `-${discountPercent}%`,
      oldPrice,
      discountPercent,
    };
  }

  if (product.isPopular || product.badge === ProductBadgeEnum.POPULAR || matchesPopularKeyword || seed % 5 === 0) {
    return {
      kind: 'popular' as const,
      badgeLabel: product.badgeText || 'Top',
      oldPrice: null,
      discountPercent: null,
    };
  }

  if (product.isNew || product.badge === ProductBadgeEnum.NEW || matchesNewKeyword || seed % 7 === 0) {
    return {
      kind: 'new' as const,
      badgeLabel: product.badgeText || 'Yangi',
      oldPrice: null,
      discountPercent: null,
    };
  }

  return {
    kind: 'standard' as const,
    badgeLabel: null,
    oldPrice: null,
    discountPercent: null,
  };
}

export function buildCustomerHomeSections(products: MenuProduct[]) {
  const discounted = products
    .filter((product) => product.isDiscounted || getProductPromotion(product).kind === 'discount')
    .slice(0, 6);
  const discountedIds = new Set(discounted.map((product) => product.id));

  const popular = products
    .filter((product) => !discountedIds.has(product.id))
    .filter((product) => product.isPopular || getProductPromotion(product).kind === 'popular')
    .slice(0, 6);
  const popularIds = new Set(popular.map((product) => product.id));

  const newest = [...products]
    .filter((product) => !discountedIds.has(product.id) && !popularIds.has(product.id))
    .filter((product) => product.isNew || getProductPromotion(product).kind === 'new')
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 6);

  return {
    discounted: discounted.length ? discounted : products.slice(0, 4),
    popular: popular.length ? popular : products.slice(0, 6),
    newest: newest.length ? newest : products.slice(2, 8),
  };
}
