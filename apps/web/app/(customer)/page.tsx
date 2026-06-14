import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { fetchMenuCategories, fetchMenuProducts } from '@/lib/server/menu';
import CustomerHomePage from './customer-page-client';

/**
 * Customer home — RSC (Server Component).
 *
 *  • Menu (categories + products) Edge'da 60s'ga keshlanadi (next.revalidate)
 *  • QueryClient'ga prefetch qilamiz va HydrationBoundary orqali hydrate
 *  • Klientdagi useCategories/useProducts darrov cache'dan o'qiydi —
 *    bironta network call'siz first paint
 *
 *  Auth gating va boshqa client-only logic CustomerHomePage'da qoldi
 *  (use-auth, telegram detection, role redirects).
 */
export default async function Page() {
  const qc = new QueryClient();

  await Promise.all([
    qc.prefetchQuery({
      queryKey: ['menu', 'categories'],
      queryFn: fetchMenuCategories,
    }),
    qc.prefetchQuery({
      queryKey: ['menu', 'products'],
      queryFn: fetchMenuProducts,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <CustomerHomePage />
    </HydrationBoundary>
  );
}
