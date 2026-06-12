'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from '@/lib/query-client';
import { TelegramAuthProvider } from './telegram-auth-provider';

/**
 * FAZA A2 — barcha client providerlar bitta joyda.
 * QueryClient har klientda bir marta yaratiladi (useState orqali barqaror).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <TelegramAuthProvider>{children}</TelegramAuthProvider>
    </QueryClientProvider>
  );
}
