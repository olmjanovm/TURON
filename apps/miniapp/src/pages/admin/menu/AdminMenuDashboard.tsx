import React from 'react';
import MenuSummaryCards from '../../../features/menu/components/MenuSummaryCards';
import { useAdminCategories, useAdminProducts } from '../../../hooks/queries/useMenu';

const AdminMenuDashboard: React.FC = () => {
  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError } = useAdminCategories();
  const { data: products = [], isLoading: productsLoading, isError: productsError } = useAdminProducts();

  const isLoading = categoriesLoading || productsLoading;
  const isError = categoriesError || productsError;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Menyu boshqaruvi</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">Kategoriyalar va taomlarni boshqaring</p>
      </div>

      {isError ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-widest text-rose-500">Xatolik</p>
          <p className="text-sm font-bold text-rose-700 mt-2">
            Menyu ma'lumotlarini yuklab bo'lmadi. Iltimos, qayta urinib ko'ring.
          </p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <MenuSummaryCards categories={categories} products={products} />
      )}
    </div>
  );
};

export default AdminMenuDashboard;
