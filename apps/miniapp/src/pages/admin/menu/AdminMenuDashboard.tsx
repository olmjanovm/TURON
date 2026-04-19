import React from 'react';
import MenuSummaryCards from '../../../features/menu/components/MenuSummaryCards';
import { useAdminCategories, useAdminProducts } from '../../../hooks/queries/useMenu';

const AdminMenuDashboard: React.FC = () => {
  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError } = useAdminCategories();
  const { data: products = [], isLoading: productsLoading, isError: productsError } = useAdminProducts();

  const isLoading = categoriesLoading || productsLoading;
  const isError = categoriesError || productsError;

  return (
    <div className="animate-in fade-in duration-300 pb-[calc(env(safe-area-inset-bottom,0px)+96px)]">
      {isError ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-widest text-rose-500">Xatolik</p>
          <p className="text-sm font-bold text-rose-700 mt-2">
            Menyu ma'lumotlarini yuklab bo'lmadi. Iltimos, qayta urinib ko'ring.
          </p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-6">
          <div className="space-y-3 animate-pulse">
            <div className="h-16 rounded-2xl bg-slate-200" />
            <div className="h-16 rounded-2xl bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 gap-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 rounded-2xl bg-slate-200" />
            ))}
          </div>
          <div className="space-y-3 animate-pulse">
            <div className="h-14 rounded-2xl bg-slate-200" />
            <div className="h-14 rounded-2xl bg-slate-200" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <MenuSummaryCards categories={categories} products={products} />
          <p className="pb-2 text-center text-xs font-medium text-slate-400/90">@turonkafebot</p>
        </div>
      )}
    </div>
  );
};

export default AdminMenuDashboard;
