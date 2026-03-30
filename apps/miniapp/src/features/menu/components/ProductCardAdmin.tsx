import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, ToggleLeft, ToggleRight } from 'lucide-react';
import { MenuProduct } from '../types';
import { useMenuStore } from '../../../store/useMenuStore';
import AvailabilityBadge from './AvailabilityBadge';

interface Props {
  product: MenuProduct;
}

const ProductCardAdmin: React.FC<Props> = ({ product }) => {
  const navigate = useNavigate();
  const { toggleProductActive, getCategoryById } = useMenuStore();
  const category = getCategoryById(product.categoryId);

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${product.isActive ? 'border-slate-100' : 'border-red-100 opacity-70'}`}>
      <div className="flex gap-3 p-3">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl">🍽️</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-800 text-sm truncate">{product.name}</h4>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{category?.name || '—'}</p>
          <p className="text-sm font-black text-amber-600 mt-1">{product.price.toLocaleString()} so'm</p>
          <div className="flex items-center gap-2 mt-2">
            <AvailabilityBadge availability={product.availability} />
            {!product.isActive && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border bg-slate-50 text-slate-500 border-slate-200">
                Nofaol
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 items-center justify-center">
          <button
            onClick={() => toggleProductActive(product.id)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              product.isActive ? 'text-emerald-500 bg-emerald-50' : 'text-red-400 bg-red-50'
            }`}
          >
            {product.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          </button>
          <button
            onClick={() => navigate(`/admin/menu/products/${product.id}/edit`)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 bg-slate-50 active:scale-95 transition-transform"
          >
            <Edit3 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCardAdmin;
