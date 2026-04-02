import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAddressStore } from '../../store/useAddressStore';
import { AddressCard, AddressEmptyState } from '../../components/customer/AddressComponents';
import { ErrorStateCard } from '../../components/ui/FeedbackStates';
import { useAddresses, useDeleteAddress } from '../../hooks/queries/useAddresses';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';

const AddressListPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useCustomerLanguage();
  const { selectedAddressId, selectAddress, setInitialDraft } = useAddressStore();
  const { data: addresses = [], isLoading, isError, error, refetch } = useAddresses();
  const deleteAddressMutation = useDeleteAddress();

  const copy =
    language === 'ru'
      ? {
          badge: 'Адреса',
          title: 'Точки доставки',
          subtitle: 'Выберите удобный адрес или добавьте новый.',
          add: 'Добавить новый адрес',
          confirmDelete: 'Удалить этот адрес?',
          loading: 'Адреса загружаются',
          errorTitle: 'Не удалось загрузить адреса',
        }
      : language === 'uz-cyrl'
        ? {
            badge: 'Манзиллар',
            title: 'Етказиш нуқталари',
            subtitle: 'Ўзингизга қулай манзилни танланг ёки янгисини қўшинг.',
            add: 'Янги манзил қўшиш',
            confirmDelete: 'Ушбу манзилни ўчириб ташламоқчимисиз?',
            loading: 'Манзиллар юкланмоқда',
            errorTitle: 'Манзиллар юкланмади',
          }
        : {
            badge: 'Manzillar',
            title: 'Yetkazish nuqtalari',
            subtitle: "O'zingizga qulay bo'lgan manzilni tanlang yoki yangisini qo'shing.",
            add: "Yangi manzil qo'shish",
            confirmDelete: "Ushbu manzilni o'chirib tashlamoqchimisiz?",
            loading: 'Manzillar yuklanmoqda',
            errorTitle: 'Manzillar yuklanmadi',
          };

  useEffect(() => {
    if (addresses.length === 0) {
      if (selectedAddressId) {
        selectAddress(null);
      }
      return;
    }

    const hasSelectedAddress = addresses.some((address) => address.id === selectedAddressId);
    if (!selectedAddressId || !hasSelectedAddress) {
      selectAddress(addresses[0].id);
    }
  }, [addresses, selectedAddressId, selectAddress]);

  const handleAddNew = () => {
    setInitialDraft();
    navigate('/customer/address/new');
  };

  const handleEdit = (id: string) => {
    const address = addresses.find((item) => item.id === id);
    if (address) {
      setInitialDraft(address);
      navigate('/customer/address/new');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm(copy.confirmDelete)) {
      deleteAddressMutation.mutate(id, {
        onSuccess: () => {
          if (selectedAddressId === id) {
            selectAddress(null);
          }
        },
        onError: (mutationError: Error) => {
          window.alert(mutationError.message);
        },
      });
    }
  };

  const handleSelect = (id: string) => {
    selectAddress(id);
    if (window.history.length > 1) {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorStateCard
        title={copy.errorTitle}
        message={(error as Error).message}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-28 animate-in fade-in slide-in-from-right duration-300">
      <section className="glass-panel rounded-[34px] p-5 shadow-[0_18px_42px_rgba(148,101,60,0.12)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-400">{copy.badge}</p>
            <h2 className="mt-2 text-[2rem] font-black leading-none tracking-tight text-slate-900">{copy.title}</h2>
            <p className="mt-3 max-w-[270px] text-sm leading-6 text-slate-500">{copy.subtitle}</p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#f59e0b_0%,#f97316_100%)] text-white shadow-[0_18px_30px_rgba(249,115,22,0.22)] transition-transform active:scale-95"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </section>

      {addresses.length > 0 ? (
        <div className="space-y-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              isSelected={selectedAddressId === address.id}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          <button
            onClick={handleAddNew}
            className="glass-panel mt-2 flex h-16 w-full items-center justify-center gap-3 rounded-[28px] font-black text-slate-600 shadow-[0_18px_42px_rgba(148,101,60,0.12)] transition-transform active:scale-[0.985]"
          >
            <Plus size={20} />
            <span>{copy.add}</span>
          </button>
        </div>
      ) : (
        <AddressEmptyState onAdd={handleAddNew} />
      )}

      {isLoading ? (
        <div className="text-center text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
          {copy.loading}
        </div>
      ) : null}
    </div>
  );
};

export default AddressListPage;
