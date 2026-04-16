import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CategoryForm from '../../../features/menu/components/CategoryForm';
import DeleteConfirmationModal from '../../../components/admin/DeleteConfirmationModal';
import type { CategoryFormData } from '../../../features/menu/types';
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../../../hooks/queries/useMenu';

const AdminCategoryFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { data: categories = [], isLoading } = useAdminCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const isEdit = !!categoryId;
  const existingCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId],
  );

  const handleSubmit = async (data: CategoryFormData) => {
    setFormError(null);

    try {
      if (isEdit && categoryId) {
        await updateCategoryMutation.mutateAsync({ id: categoryId, data });
      } else {
        await createCategoryMutation.mutateAsync(data);
      }

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      navigate('/admin/menu/categories');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Kategoriyani saqlab bo\'lmadi');

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    }
  };

  const handleDelete = async () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryId) return;

    setFormError(null);

    try {
      await deleteCategoryMutation.mutateAsync(categoryId);

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      setIsConfirmOpen(false);
      navigate('/admin/menu/categories');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Kategoriyani o\'chirib bo\'lmadi');

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }

      setIsConfirmOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse pb-8">
        <div className="h-10 bg-slate-200 rounded-2xl" />
        <div className="h-14 bg-slate-200 rounded-2xl" />
        <div className="h-14 bg-slate-200 rounded-2xl" />
        <div className="h-14 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (isEdit && !existingCategory) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="font-bold text-slate-600 text-lg">Kategoriya topilmadi</h3>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <CategoryForm
        initialData={existingCategory}
        onSubmit={handleSubmit}
        title={isEdit ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
        error={formError}
        isSubmitting={createCategoryMutation.isPending || updateCategoryMutation.isPending}
        onDelete={isEdit ? handleDelete : undefined}
        isDeleting={deleteCategoryMutation.isPending}
      />

      <DeleteConfirmationModal
        isOpen={isConfirmOpen}
        title="Kategoriyani o'chirasizmi?"
        description="Bu kategoriya va uning hamma taomlariy menyudan olib tashlanadi."
        itemName={existingCategory?.name}
        isDeleting={deleteCategoryMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setIsConfirmOpen(false)}
        isDangerous
      />
    </div>
  );
};

export default AdminCategoryFormPage;
