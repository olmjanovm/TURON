import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useMenuStore } from '../../../store/useMenuStore';
import { ProductFilterState } from '../../../features/menu/types';
import ProductCardAdmin from '../../../features/menu/components/ProductCardAdmin';
import ProductFiltersBar from '../../../features/menu/components/ProductFiltersBar';

const AdminProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { filterProducts } = useMenuStore();

  const [filters, setFilters] = useState<ProductFilterState>({
    categoryId: 'all',
    activeFilter: 'all',
    availabilityFilter: 'all',
    searchQuery: '',
  });

  const filteredProducts = filterProducts(filters);

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Taomlar</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{filteredProducts.length} ta topildi</p>
        </div>
        <button
          onClick={() => navigate('/admin/menu/products/new')}
          className="h-11 px-4 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-transform"
        >
          <Plus size={18} />
          Qo'shish
        </button>
      </div>

      <ProductFiltersBar filters={filters} onChange={setFilters} />

      {filteredProducts.length > 0 ? (
        <div className="space-y-3">
          {filteredProducts.map(product => (
            <ProductCardAdmin key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-4">🍽️</div>
          <h3 className="font-bold text-slate-600 text-lg">Taomlar topilmadi</h3>
          <p className="text-sm text-slate-400 mt-1">Filtrlarni o'zgartiring yoki yangi taom qo'shing</p>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
