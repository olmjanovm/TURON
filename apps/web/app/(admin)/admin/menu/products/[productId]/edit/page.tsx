'use client';

import { use } from 'react';
import { useProduct } from '@/hooks/use-admin-catalog';
import { ProductForm } from '@/components/admin/product-form';
import { Skeleton, SkeletonRow } from '@/components/ui/skeleton';

export default function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);
  const { data: product, isLoading, isError } = useProduct(productId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-video w-full" rounded="rounded-3xl" />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }
  if (isError || !product) {
    return <div className="admin-card p-6 text-center text-sm text-slate-500">Mahsulot topilmadi.</div>;
  }
  return <ProductForm initial={product} />;
}
