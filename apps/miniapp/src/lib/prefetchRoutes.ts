/**
 * Customer route prefetcher.
 *
 * Most secondary customer pages are lazy-loaded via `React.lazy` in App.tsx
 * to keep the initial bundle small. The trade-off is that each `navigate()`
 * to one of those pages waits for a network round-trip to fetch its chunk —
 * felt by the user as 200–800ms of "page sekin yuklanmoqda" between taps.
 *
 * This module fires the dynamic `import()` calls during browser idle time
 * after the customer's first paint, so by the time they tap "Savatga
 * o'tish" / "Buyurtmalar" / etc. the chunk is already in the module cache
 * and React mounts it instantly.
 *
 * The list is intentionally narrow — only the *frequently traversed* customer
 * surfaces. Admin / courier / rare flows (map selection, address form) load
 * on demand so we don't bloat the initial work.
 */

type Importer = () => Promise<unknown>;

// Routes that the customer touches on every shopping session.
const CUSTOMER_HOT_ROUTES: Importer[] = [
  () => import('../pages/customer/ProductPage'),
  () => import('../pages/customer/CartPage'),
  () => import('../pages/customer/CheckoutPage'),
  () => import('../pages/customer/OrderSuccessPage'),
  () => import('../pages/customer/OrderDetailPage'),
  () => import('../pages/customer/SupportPage'),
  () => import('../pages/customer/SearchPage'),
  () => import('../pages/customer/CategoryPage'),
];

// Lower-priority routes — fetched after the hot ones land.
const CUSTOMER_WARM_ROUTES: Importer[] = [
  () => import('../pages/customer/AddressListPage'),
  () => import('../pages/customer/AddressFormPage'),
  () => import('../pages/customer/MapSelectionPage'),
  () => import('../pages/customer/TrackingMapPage'),
  () => import('../pages/customer/NotificationsPage'),
  () => import('../pages/customer/CustomerPromosPage'),
  () => import('../pages/customer/FavoritesPage'),
];

let prefetched = false;

/**
 * Run during browser idle time after the customer's first paint.
 * Idempotent — safe to call from every CustomerLayout mount.
 */
export function prefetchCustomerRoutes(): void {
  if (typeof window === 'undefined') return;
  if (prefetched) return;
  prefetched = true;

  const schedule =
    typeof (window as any).requestIdleCallback === 'function'
      ? (window as any).requestIdleCallback.bind(window)
      : (cb: () => void) => window.setTimeout(cb, 1500);

  // Hot routes first — these are the ones the customer hits during a normal
  // checkout flow.
  schedule(() => {
    for (const load of CUSTOMER_HOT_ROUTES) {
      // Fire and forget. Errors are non-fatal: navigation will retry the
      // import the normal way if it failed here.
      load().catch(() => {});
    }
  });

  // Warm routes a few seconds later so we don't compete with the hot batch
  // for bandwidth on slow connections.
  window.setTimeout(() => {
    schedule(() => {
      for (const load of CUSTOMER_WARM_ROUTES) {
        load().catch(() => {});
      }
    });
  }, 4000);
}
