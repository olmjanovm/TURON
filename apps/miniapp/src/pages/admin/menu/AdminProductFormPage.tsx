import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMenuStore } from '../../../store/useMenuStore';
import ProductForm from '../../../features/menu/components/ProductForm';
import { ProductFormData } from '../../../features/menu/types';

const AdminProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { getProductById, addProduct, updateProduct } = useMenuStore();

  const isEdit = !!productId;
  const existingProduct = isEdit ? getProductById(productId!) : undefined;

  const handleSubmit = (data: ProductFormData) => {
    if (isEdit && productId) {
      updateProduct(productId, data);
    } else {
      addProduct(data);
    }
    navigate('/admin/menu/products');
  };

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
        initialData={existingProduct}
        onSubmit={handleSubmit}
        title={isEdit ? 'Taomni tahrirlash' : 'Yangi taom'}
      />
    </div>
  );
};

export default AdminProductFormPage;
