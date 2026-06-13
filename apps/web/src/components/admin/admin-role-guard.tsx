'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRoleEnum } from '@turon/shared';
import { useAuth } from '@/hooks/use-auth';

export function AdminRoleGuard({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'error' || (status === 'authenticated' && user?.role !== UserRoleEnum.ADMIN)) {
      router.replace('/');
    }
  }, [status, user, router]);

  // Still loading auth — let the admin skeleton handle it
  if (status === 'idle' || status === 'authenticating') return null;
  // Auth error or wrong role — redirect in progress
  if (status === 'error' || user?.role !== UserRoleEnum.ADMIN) return null;

  return <>{children}</>;
}
