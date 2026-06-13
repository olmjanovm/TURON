'use client';

import { use } from 'react';
import { useAdminPromos } from '@/hooks/use-admin-catalog';
import { PromoForm } from '@/components/admin/promo-form';
import { SkeletonRow } from '@/components/ui/skeleton';

export default function EditPromoPage({ params }: { params: Promise<{ promoId: string }> }) {
  const { promoId } = use(params);
  const { data: promos, isLoading, isError } = useAdminPromos();
  const promo = promos?.find((p) => p.id === promoId);

  if (isLoading) {
    return <div className="space-y-2"><SkeletonRow /><SkeletonRow /></div>;
  }
  if (isError || !promo) {
    return <div className="admin-card p-6 text-center text-sm text-slate-500">Promokod topilmadi.</div>;
  }
  return <PromoForm initial={promo} />;
}
