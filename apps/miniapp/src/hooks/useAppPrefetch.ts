import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api'; // O'zingizdagi to'g'ri API yo'lini tekshiring

export function useAppPrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const prefetchData = async () => {
      try {
        // 1. Mijozning buyurtmalar tarixini fonda keshga yozib qo'yamiz
        await queryClient.prefetchQuery({
          queryKey: ['orders', 'my-orders'],
          queryFn: () => api.get('/orders/my').then((res) => res.data),
          staleTime: 1000 * 60 * 2, // 2 daqiqa eskimaydi deb hisoblaymiz
        });
      } catch (err) {
        console.warn('[Prefetch] Orqa fonda tortishda xatolik', err);
      }
    };

    // UI qotmasligi uchun browser bo'sh vaqtida (Idle) bajarish (iOS fallback bilan)
    const requestIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));
    
    requestIdle(() => {
      prefetchData();
    });
  }, [queryClient]);
}