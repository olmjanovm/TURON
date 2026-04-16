import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import CategoryCard from '../../../features/menu/components/CategoryCard';
import DeleteConfirmationModal from '../../../components/admin/DeleteConfirmationModal';
import {
  useAdminCategories,
  useAdminProducts,
  useDeleteCategory,
  useSetCategoryActive,
} from '../../../hooks/queries/useMenu';
import type { MenuCategory } from '../../../features/menu/types';

const AdminCategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [pageError, setPageError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<MenuCategory | null>(null);

  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError } = useAdminCategories();
  const { data: products = [], isLoading: productsLoading } = useAdminProducts();
  const setCategoryActiveMutation = useSetCategoryActive();
  const deleteCategoryMutation = useDeleteCategory();

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => left.sortOrder - right.sortOrder),
    [categories],
  );

  const isBusy = setCategoryActiveMutation.isPending || deleteCategoryMutation.isPending;
  const isLoading = categoriesLoading || productsLoading;

  const handleToggleActive = async (category: MenuCategory) => {
    setPageError(null);

    try {
      await setCategoryActiveMutation.mutateAsync({
        id: category.id,
        isActive: !category.isActive,
      });

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Kategoriya holatini yangilab bo\'lmadi');

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    }
  };

  const handleDelete = async (category: MenuCategory) => {
    setCategoryToDelete(category);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setPageError(null);

    try {
      await deleteCategoryMutation.mutateAsync(categoryToDelete.id);

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      setIsConfirmOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Kategoriyani o\'chirib bo\'lmadi');

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Kategoriyalar</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{sortedCategories.length} ta kategoriya</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/menu/categories/new')}
          className="h-11 px-4 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-transform"
        >
          <Plus size={18} />
          Qo'shish
        </button>
      </div>

      {pageError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-rose-500">Xatolik</p>
          <p className="text-sm font-bold text-rose-700 mt-1 leading-relaxed">{pageError}</p>
        </div>
      ) : null}

      {categoriesError ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-sm font-bold text-rose-700">Kategoriyalarni yuklab bo'lmadi.</p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : sortedCategories.length > 0 ? (
        <div className="space-y-3">
          {sortedCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              productCount={products.filter((product) => product.categoryId === category.id).length}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              isBusy={isBusy}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-4">📁</div>
          <h3 className="font-bold text-slate-600 text-lg">Kategoriyalar topilmadi</h3>
          <p className="text-sm text-slate-400 mt-1">Yangi kategoriya qo'shish uchun tugmani bosing</p>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={isConfirmOpen}
        title="Kategoriyani o'chirilsinmi?"
        description={
          categoryToDelete && products.some((product) => product.categoryId === categoryToDelete.id)
            ? 'Bu kategoriyadagi barcha taomlar ham menyudan olib tashlanadi.'
            : 'Kategoriya menyudan butunlay olib tashlanadi.'
        }
        itemName={categoryToDelete?.name}
        isDeleting={deleteCategoryMutation.isPending}
        confirmLabel="Ha, o'chirish"
        warningText="Bu amalni qaytarib bo'lmaydi. Kategoriya bilan bog'liq ma'lumotlar o'chadi."
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => {
          setIsConfirmOpen(false);
          setCategoryToDelete(null);
        }}
        isDangerous
      />
    </div>
  );
};

export default AdminCategoriesPage;
