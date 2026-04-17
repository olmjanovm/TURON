import type { ProductSnapshot } from '../../data/types';
import type { MenuCategory, MenuProduct } from './types';

type QueryRule = {
  keywords: string[];
  query: string;
};

const CATEGORY_QUERY_RULES: QueryRule[] = [
  { keywords: ['donar', 'doner', 'kebab', 'shawarma'], query: 'shawarma,kebab,wrap,food' },
  { keywords: ['lavash', 'wrap', 'roll'], query: 'lavash,wrap,street-food' },
  { keywords: ['pizza'], query: 'pizza,cheese,food' },
  { keywords: ['burger'], query: 'burger,fast-food' },
  { keywords: ['ichimlik', 'drink', 'juice', 'cola', 'coffee'], query: 'drinks,juice,cafe' },
  { keywords: ['salat', 'salad'], query: 'salad,fresh,food' },
  { keywords: ['desert', 'dessert', 'cake', 'sweet'], query: 'dessert,cake,bakery' },
  { keywords: ['kombo', 'combo', 'set'], query: 'food-platter,fast-food,table' },
];

const PRODUCT_QUERY_RULES: QueryRule[] = [
  { keywords: ['donar', 'doner', 'kebab', 'shawarma'], query: 'shawarma,kebab,wrap,food' },
  { keywords: ['lavash', 'wrap', 'roll'], query: 'lavash,wrap,street-food' },
  { keywords: ['pizza', 'pepperoni', 'margarita'], query: 'pizza,cheese,food' },
  { keywords: ['burger', 'cheeseburger'], query: 'burger,fast-food' },
  { keywords: ['cola', 'pepsi', 'juice', 'drink', 'mojito', 'coffee'], query: 'drinks,juice,cafe' },
  { keywords: ['salat', 'salad', 'greens'], query: 'salad,fresh,food' },
  { keywords: ['desert', 'dessert', 'cake', 'sweet', 'ice cream'], query: 'dessert,cake,bakery' },
  { keywords: ['combo', 'family', 'set'], query: 'food-platter,fast-food,table' },
  { keywords: ['chicken', 'tovuq'], query: 'grilled-chicken,food' },
  { keywords: ['beef', 'mol', 'gosht'], query: 'beef,steak,food' },
  { keywords: ['spicy', 'achchiq'], query: 'spicy,street-food' },
  { keywords: ['cheese', 'pishloq'], query: 'cheese,fast-food' },
];

const CURATED_IMAGE_POOLS = {
  shawarma: [
    'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80',
  ],
  lavash: [
    'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1530469912745-a215c6b256ea?auto=format&fit=crop&w=1200&q=80',
  ],
  pizza: [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?auto=format&fit=crop&w=1200&q=80',
  ],
  burger: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=1200&q=80',
  ],
  drink: [
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80',
  ],
  salad: [
    'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
  ],
  dessert: [
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80',
  ],
  combo: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
  ],
  chicken: [
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=1200&q=80',
  ],
  beef: [
    'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
  ],
  spicy: [
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=1200&q=80',
  ],
  cheese: [
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=1200&q=80',
  ],
  generic: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  ],
} as const;

const GENERIC_CATEGORY_QUERIES = [
  'restaurant-food,plating',
  'street-food,gourmet',
  'fast-food,table',
  'fresh-meal,cafe',
];

const GENERIC_PRODUCT_QUERIES = [
  'food,close-up',
  'restaurant-meal,gourmet',
  'street-food,plate',
  'fresh-food,dish',
];

const POSTER_PALETTES = [
  { from: '#f59e0b', to: '#f97316', accent: '#fff2d7' },
  { from: '#b45309', to: '#78350f', accent: '#fde68a' },
  { from: '#fb7185', to: '#be123c', accent: '#ffe4e6' },
  { from: '#14b8a6', to: '#0f766e', accent: '#ccfbf1' },
  { from: '#7c3aed', to: '#4c1d95', accent: '#ede9fe' },
];

const normalise = (value: string) => value.trim().toLowerCase();

const INVALID_REMOTE_HOSTS = new Set([
  'example.com',
  'www.example.com',
  'images.example.com',
  'localhost',
  '127.0.0.1',
]);

const hasRemoteUrl = (value?: string | null) => {
  if (typeof value !== 'string') {
    return false;
  }

  const normalizedValue = value.trim();
  if (!/^https?:\/\//i.test(normalizedValue)) {
    return false;
  }

  try {
    const parsed = new URL(normalizedValue);
    return !INVALID_REMOTE_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
};

const hashString = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const pickBySeed = <T,>(items: readonly T[], seed: string): T => items[hashString(seed) % items.length];

function pickCuratedImagePool(query: string) {
  const normalizedQuery = normalise(query);

  if (normalizedQuery.includes('shawarma') || normalizedQuery.includes('kebab') || normalizedQuery.includes('donar')) {
    return CURATED_IMAGE_POOLS.shawarma;
  }
  if (normalizedQuery.includes('lavash') || normalizedQuery.includes('wrap')) {
    return CURATED_IMAGE_POOLS.lavash;
  }
  if (normalizedQuery.includes('pizza')) {
    return CURATED_IMAGE_POOLS.pizza;
  }
  if (normalizedQuery.includes('burger')) {
    return CURATED_IMAGE_POOLS.burger;
  }
  if (
    normalizedQuery.includes('drink') ||
    normalizedQuery.includes('juice') ||
    normalizedQuery.includes('cola') ||
    normalizedQuery.includes('coffee')
  ) {
    return CURATED_IMAGE_POOLS.drink;
  }
  if (normalizedQuery.includes('salad')) {
    return CURATED_IMAGE_POOLS.salad;
  }
  if (normalizedQuery.includes('dessert') || normalizedQuery.includes('cake') || normalizedQuery.includes('bakery')) {
    return CURATED_IMAGE_POOLS.dessert;
  }
  if (normalizedQuery.includes('combo') || normalizedQuery.includes('platter') || normalizedQuery.includes('set')) {
    return CURATED_IMAGE_POOLS.combo;
  }
  if (normalizedQuery.includes('chicken')) {
    return CURATED_IMAGE_POOLS.chicken;
  }
  if (normalizedQuery.includes('beef') || normalizedQuery.includes('steak')) {
    return CURATED_IMAGE_POOLS.beef;
  }
  if (normalizedQuery.includes('spicy')) {
    return CURATED_IMAGE_POOLS.spicy;
  }
  if (normalizedQuery.includes('cheese')) {
    return CURATED_IMAGE_POOLS.cheese;
  }

  return CURATED_IMAGE_POOLS.generic;
}

const buildRandomFoodUrl = (query: string, seed: string) =>
  pickBySeed(pickCuratedImagePool(query), `${query}:${seed}`);

const findQuery = (name: string, rules: QueryRule[], genericQueries: string[], seed: string) => {
  const normalizedName = normalise(name);
  const matchedRule = rules.find((rule) =>
    rule.keywords.some((keyword) => normalizedName.includes(keyword)),
  );

  return matchedRule?.query ?? pickBySeed(genericQueries, seed);
};

const createPosterDataUrl = (label: string, seed: string) => {
  const palette = pickBySeed(POSTER_PALETTES, seed);
  const safeLabel = label.replace(/[<>&]/g, '').trim().slice(0, 18) || 'Turon';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.from}" />
          <stop offset="100%" stop-color="${palette.to}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" rx="54" fill="url(#bg)" />
      <circle cx="980" cy="140" r="180" fill="rgba(255,255,255,0.16)" />
      <circle cx="230" cy="760" r="220" fill="rgba(255,255,255,0.12)" />
      <text x="86" y="458" fill="#ffffff" font-size="110" font-weight="700" font-family="Arial, sans-serif">${safeLabel}</text>
      <text x="86" y="530" fill="${palette.accent}" font-size="34" font-family="Arial, sans-serif" letter-spacing="4">Turon Kafesi</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const getCategoryImageUrl = (category: Pick<MenuCategory, 'id' | 'name' | 'imageUrl'>) => {
  if (hasRemoteUrl(category.imageUrl)) {
    return category.imageUrl.trim();
  }

  return getCategoryPosterUrl(category);
};

export const getProductImageUrl = (
  product: Pick<MenuProduct, 'id' | 'name' | 'imageUrl' | 'categoryId'>,
  categoryName?: string,
) => {
  if (hasRemoteUrl(product.imageUrl)) {
    return product.imageUrl.trim();
  }

  return getProductPosterUrl(product);
};

export const getCartItemImageUrl = (item: Pick<ProductSnapshot, 'id' | 'name' | 'image'>) => {
  if (hasRemoteUrl(item.image)) {
    return item.image.trim();
  }

  return getProductPosterUrl(item);
};

export const getCategoryPosterUrl = (category: Pick<MenuCategory, 'id' | 'name'>) =>
  createPosterDataUrl(category.name, `category:${category.id}:${category.name}`);

export const getProductPosterUrl = (
  product: Pick<MenuProduct, 'id' | 'name'> | Pick<ProductSnapshot, 'id' | 'name'>,
) => createPosterDataUrl(product.name, `product:${product.id}:${product.name}`);
