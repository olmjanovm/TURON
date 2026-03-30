import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePromoStore } from '../../../store/usePromoStore';
import { PromoForm } from '../../../features/promo/components/PromoForm';
import { PromoFormData } from '../../../features/promo/types';

const AdminPromoFormPage: React.FC = () => {
  const { promoId } = useParams<{ promoId: string }>();
  const navigate = useNavigate();
  const { getPromoById, addPromo, updatePromo } = usePromoStore();

  const isEditing = Boolean(promoId);
  const promoToEdit = isEditing ? getPromoById(promoId!) : undefined;

  const handleSubmit = (data: PromoFormData) => {
    if (isEditing && promoId) {
      updatePromo(promoId, data);
    } else {
      addPromo(data);
    }
    navigate('/admin/promos');
  };

  if (isEditing && !promoToEdit) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Promokod topilmadi</h2>
        <button onClick={() => navigate('/admin/promos')} className="text-indigo-600 font-bold">
          Ortga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <PromoForm
        title={isEditing ? 'Promokodni tahrirlash' : 'Yangi promokod'}
        initialData={promoToEdit}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default AdminPromoFormPage;
