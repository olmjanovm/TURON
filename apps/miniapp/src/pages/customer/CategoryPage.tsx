import React from 'react';
import { useParams } from 'react-router-dom';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../../data/mockData';
import { ProductCard, EmptyState } from '../../components/customer/CustomerComponents';

export const CategoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const category = MOCK_CATEGORIES.find(c => c.id === id);
  const products = MOCK_PRODUCTS.filter(p => p.categoryId === id);

  if (!category) return <EmptyState message="Bo’lim topilmadi" />;

  return (
    <div className="space-y-6">
      <div className="h-40 rounded-3xl overflow-hidden relative shadow-lg">
        <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-6 text-center">
          <h2 className="text-3xl font-black text-white uppercase tracking-widest">{category.name}</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {products.length === 0 ? (
          <div className="col-span-2">
            <EmptyState message="Ushbu bo’limda hozircha taomlar yo’q" />
          </div>
        ) : (
          products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
};
