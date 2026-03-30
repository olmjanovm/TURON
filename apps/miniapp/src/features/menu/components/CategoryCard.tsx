import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, ToggleLeft, ToggleRight, GripVertical } from 'lucide-react';
import { MenuCategory } from '../types';
import { useMenuStore } from '../../../store/useMenuStore';

interface Props {
  category: MenuCategory;
  productCount: number;
}

const CategoryCard: React.FC<Props> = ({ category, productCount }) => {
  const navigate = useNavigate();
  const { toggleCategoryActive } = useMenuStore();

  return (
    <div className={`bg-white rounded-2xl border ${category.isActive ? 'border-slate-100' : 'border-red-100 bg-red-50/30'} p-4 flex items-center gap-4 shadow-sm`}>
      <div className="text-slate-300 cursor-grab">
        <GripVertical size={18} />
      </div>

      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
        {category.imageUrl ? (
          <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-lg">📁</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-800 text-sm truncate">{category.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">#{category.sortOrder}</span>
          <span className="text-[10px] text-slate-300">•</span>
          <span className="text-[10px] font-bold text-slate-400">{productCount} taom</span>
          <span className="text-[10px] text-slate-300">•</span>
          <span className={`text-[10px] font-bold uppercase ${category.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
            {category.isActive ? 'Faol' : 'Nofaol'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => toggleCategoryActive(category.id)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            category.isActive ? 'text-emerald-500 bg-emerald-50' : 'text-red-400 bg-red-50'
          }`}
        >
          {category.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
        </button>
        <button
          onClick={() => navigate(`/admin/menu/categories/${category.id}/edit`)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 bg-slate-50 active:scale-95 transition-transform"
        >
          <Edit3 size={16} />
        </button>
      </div>
    </div>
  );
};

export default CategoryCard;
