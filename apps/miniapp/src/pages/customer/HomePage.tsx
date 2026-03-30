import React from 'react';
import { CategoryCard, ProductCard, LoadingSkeleton } from '../../components/customer/CustomerComponents';
import { useAuthStore } from '../../store/useAuthStore';
import { useCategories, useProducts } from '../../hooks/queries/useMenu';

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const userName = (user as any)?.firstName || (user as any)?.name || 'Mijoz';

  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();

  const featuredProducts = products.slice(0, 4);

  if (isLoadingCategories || isLoadingProducts) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Block */}
      <section className="bg-amber-500 rounded-[32px] p-6 text-white shadow-xl shadow-amber-100 flex items-center justify-between">
        <div className="space-y-1">
          <p className="opacity-80 font-bold text-xs uppercase tracking-widest leading-none">Xush kelibsiz!</p>
          <h2 className="text-2xl font-black tracking-tight">{userName} 👋</h2>
        </div>
        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl">
          😋
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-[15px] uppercase tracking-wide text-gray-900">Kategoriyalar</h3>
          <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">Barchasi</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
          {categories.length > 0 ? (
            categories.map((category: any) => (
              <CategoryCard key={category.id} category={category} />
            ))
          ) : (
             <p className="text-gray-400 text-sm italic">Hozircha kategoriyalar yo'q</p>
          )}
        </div>
      </section>

      {/* Popular Items */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-[15px] uppercase tracking-wide text-gray-900">Ommabop taomlar</h3>
          <span className="text-[11px] font-bold text-gray-400">Yangi</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <p className="text-gray-400 text-sm italic col-span-2 text-center">Taomlar topilmadi</p>
          )}
        </div>
      </section>
      
      {/* Banner/Info */}
      <section className="bg-gray-100 rounded-[28px] p-6 text-center border-dashed border-2 border-gray-200">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Yetkazib berish xizmati qisqa fursatda ishga tushadi!</p>
      </section>
    </div>
  );
};

export default HomePage;
