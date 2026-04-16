import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductForm from '../../../features/menu/components/ProductForm';
import DeleteConfirmationModal from '../../../components/admin/DeleteConfirmationModal';
import type { ProductFormData } from '../../../features/menu/types';
import {
  useAdminCategories,
  useAdminProducts,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from '../../../hooks/queries/useMenu';

const AdminProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading } = useAdminCategories();
  const { data: products = [], isLoading: productsLoading } = useAdminProducts();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const isEdit = !!productId;
  const existingProduct = useMemo(
    () => products.find((product) => product.id === productId),
    [products, productId],
  );

  const handleSubmit = async (data: ProductFormData) => {
    setFormError(null);

    try {
      if (isEdit && productId) {
        await updateProductMutation.mutateAsync({ id: productId, data });
      } else {
        await createProductMutation.mutateAsync(data);
      }

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      navigate('/admin/menu/products');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Taomni saqlab bo\'lmadi');

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    }
  };

  const handleDelete = async () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productId) return;

    setFormError(null);

    try {
      await deleteProductMutation.mutateAsync(productId);

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      setIsConfirmOpen(false);
      navigate('/admin/menu/products');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Taomni o\'chirib bo\'lmadi');

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }

      setIsConfirmOpen(false);
    }
  };

  if (categoriesLoading || productsLoading) {
    return (
      <div className="space-y-4 animate-pulse pb-8">
        <div className="h-10 bg-slate-200 rounded-2xl" />
        <div className="h-48 bg-slate-200 rounded-2xl" />
        <div className="h-14 bg-slate-200 rounded-2xl" />
        <div className="h-20 bg-slate-200 rounded-2xl" />
        <div className="h-14 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (isEdit && !existingProduct) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="font-bold text-slate-600 text-lg">Taom topilmadi</h3>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <ProductForm
        categories={categories}
        initialData={existingProduct}
        onSubmit={handleSubmit}
        title={isEdit ? 'Taomni tahrirlash' : 'Yangi taom'}
        error={formError}
        isSubmitting={createProductMutation.isPending || updateProductMutation.isPending}
        onDelete={isEdit ? handleDelete : undefined}
        isDeleting={deleteProductMutation.isPending}
      />

      <DeleteConfirmationModal
        isOpen={isConfirmOpen}
        title="Taomni o'chirilsinmi?"
        description="Taom katalog va mijozlar menyusidan butunlay olib tashlanadi."
        itemName={existingProduct?.name}
        isDeleting={deleteProductMutation.isPending}
        confirmLabel="Ha, o'chirish"
        warningText="Bu amalni qaytarib bo'lmaydi. Taom qayta tiklanmaydi."
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setIsConfirmOpen(false)}
        isDangerous
      />
    </div>
  );
};

export default AdminProductFormPage;
