export const RESTAURANT_COORDINATES = {
  name: 'Turon Kafesi',
  lat: 41.2341363,
  lng: 69.2087708,
  address: 'Turon Kafesi, Toshkent, Oʻzbekiston',
};

export const DEFAULT_CURRENCY = 'UZS';
export const DELIVERY_BASE_FEE = 5000;
export const DELIVERY_FREE_THRESHOLD = 80000;
export const DELIVERY_BASE_DISTANCE_METERS = 4000;
export const DELIVERY_EXTRA_FEE_PER_KM = 1000;
export const DELIVERY_PRICING_RULE_CODE = 'TURON_V1_80K_4KM';

// Deprecated compatibility aliases. Delivery fee must be resolved by backend quote logic.
export const DEFAULT_DELIVERY_FEE = DELIVERY_BASE_FEE;
export const MIN_ORDER_FOR_FREE_DELIVERY = DELIVERY_FREE_THRESHOLD;
