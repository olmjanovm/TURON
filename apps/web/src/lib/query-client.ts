import { QueryClient } from '@tanstack/react-query';

/**
 * FAZA A2 — TanStack Query klienti.
 * staleTime agressiv (zaif tarmoq uchun), retry chegaralangan.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 daqiqa — keraksiz refetch'larni kamaytiradi
        gcTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}
