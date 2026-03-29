import React from 'react';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../../data/mockData';
import { CategoryCard, ProductCard } from '../../components/customer/CustomerComponents';
import { useAuthStore } from '../../store/useAuthStore';

export const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const firstName = user?.fullName.split(' ')[0] || 'Mijoz';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section */}
      <section className="mt-2">
        <h2 className="text-3xl font-black text-gray-900 leading-none mb-2">
          Salom, <span className="text-amber-500">{firstName}!</span>
        </h2>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Bugun nima yeymiz? 🥘</p>
      </section>

      {/* Categories Horizontal Scroll */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Bo’limlar</h3>
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter cursor-pointer">Hammasi</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
          {MOCK_CATEGORIES.map(category => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Popular Products */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Ommabop Taomlar</h3>
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter cursor-pointer">Siz uchun</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {MOCK_PRODUCTS.slice(0, 10).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      
      {/* All Products */}
       <section className="pb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Barcha Taomlar</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {MOCK_PRODUCTS.slice(10).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
};
