'use client';

import { useAuthStore } from '@/stores/auth-store';

/**
 * FAZA A2 — auth holatiga qulay kirish.
 * Misol: const { user, isAuthenticated, status } = useAuth();
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);

  return {
    user,
    status,
    error,
    isAuthenticated: status === 'authenticated' && user !== null,
    isLoading: status === 'authenticating',
  };
}
