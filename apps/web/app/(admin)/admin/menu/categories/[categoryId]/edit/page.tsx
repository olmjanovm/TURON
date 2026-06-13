'use client';

import { use } from 'react';
import { useAdminCategories } from '@/hooks/use-admin-catalog';
import { CategoryForm } from '@/components/admin/category-form';
import { Skeleton, SkeletonRow } from '@/components/ui/skeleton';

export default function EditCategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = use(params);
  const { data: categories, isLoading, isError } = useAdminCategories();
  const category = categories?.find((c) => c.id === categoryId);

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="aspect-video w-full" rounded="rounded-3xl" /><SkeletonRow /></div>;
  }
  if (isError || !category) {
    return <div className="admin-card p-6 text-center text-sm text-slate-500">Kategoriya topilmadi.</div>;
  }
  return <CategoryForm initial={category} />;
}
