import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMenuStore } from '../../../store/useMenuStore';
import CategoryForm from '../../../features/menu/components/CategoryForm';
import { CategoryFormData } from '../../../features/menu/types';

const AdminCategoryFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const { getCategoryById, addCategory, updateCategory } = useMenuStore();

  const isEdit = !!categoryId;
  const existingCategory = isEdit ? getCategoryById(categoryId!) : undefined;

  const handleSubmit = (data: CategoryFormData) => {
    if (isEdit && categoryId) {
      updateCategory(categoryId, data);
    } else {
      addCategory(data);
    }
    navigate('/admin/menu/categories');
  };

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
      />
    </div>
  );
};

export default AdminCategoryFormPage;
