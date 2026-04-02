import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  useAdminPromos,
  useCreateAdminPromo,
  useUpdateAdminPromo,
} from '../../../hooks/queries/usePromos';
import { PromoForm } from '../../../features/promo/components/PromoForm';
import { PromoFormData } from '../../../features/promo/types';

const AdminPromoFormPage: React.FC = () => {
  const { promoId } = useParams<{ promoId: string }>();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = Boolean(promoId);
  const {
    data: promos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminPromos();
  const createPromoMutation = useCreateAdminPromo();
  const updatePromoMutation = useUpdateAdminPromo();

  const promoToEdit = useMemo(
    () => (isEditing ? promos.find((promo) => promo.id === promoId) : undefined),
    [isEditing, promoId, promos],
  );

  const isSubmitting = createPromoMutation.isPending || updatePromoMutation.isPending;

  const handleSubmit = async (data: PromoFormData) => {
    setSubmitError(null);

    try {
      if (isEditing && promoId) {
        await updatePromoMutation.mutateAsync({ id: promoId, data });
      } else {
        await createPromoMutation.mutateAsync(data);
      }

      navigate('/admin/promos');
    } catch (mutationFailure) {
      setSubmitError(
        mutationFailure instanceof Error ? mutationFailure.message : 'Promokod saqlanmadi',
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle size={36} className="text-rose-500" />
        <h2 className="text-xl font-bold text-slate-800 mt-4">Promokod yuklanmadi</h2>
        <p className="text-sm text-slate-500 mt-2">{(error as Error).message}</p>
        <button
          onClick={() => {
            void refetch();
          }}
          className="mt-4 text-indigo-600 font-bold"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

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
    <div className="max-w-md mx-auto space-y-4">
      {submitError ? (
        <div className="bg-rose-50 border border-rose-100 rounded-[24px] p-4">
          <p className="text-sm font-black text-rose-900">Promokod saqlanmadi</p>
          <p className="text-xs font-bold text-rose-700 mt-1 leading-relaxed">{submitError}</p>
        </div>
      ) : null}

      <PromoForm
        title={isEditing ? 'Promokodni tahrirlash' : 'Yangi promokod'}
        initialData={promoToEdit}
        onSubmit={(data) => {
          void handleSubmit(data);
        }}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default AdminPromoFormPage;
