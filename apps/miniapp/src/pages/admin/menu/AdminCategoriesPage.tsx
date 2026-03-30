import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useMenuStore } from '../../../store/useMenuStore';
import CategoryCard from '../../../features/menu/components/CategoryCard';

const AdminCategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { categories, getProductCountForCategory } = useMenuStore();

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Kategoriyalar</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{categories.length} ta kategoriya</p>
        </div>
        <button
          onClick={() => navigate('/admin/menu/categories/new')}
          className="h-11 px-4 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-transform"
        >
          <Plus size={18} />
          Qo'shish
        </button>
      </div>

      {sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              productCount={getProductCountForCategory(category.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-4">📁</div>
          <h3 className="font-bold text-slate-600 text-lg">Kategoriyalar topilmadi</h3>
          <p className="text-sm text-slate-400 mt-1">Yangi kategoriya qo'shish uchun tugmani bosing</p>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
