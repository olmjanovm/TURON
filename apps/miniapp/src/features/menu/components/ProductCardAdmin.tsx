import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, Loader2, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react';
import type { MenuProduct } from '../types';
import AvailabilityBadge from './AvailabilityBadge';

interface Props {
  product: MenuProduct;
  categoryName?: string;
  onToggleActive: (product: MenuProduct) => void;
  onDeleteRequest: (product: MenuProduct) => void;
  onConfirmDelete: (product: MenuProduct) => void;
  onCancelDelete: () => void;
  isDeleteConfirmOpen?: boolean;
  isDeleting?: boolean;
  isBusy?: boolean;
}

const ProductCardAdmin: React.FC<Props> = ({
  product,
  categoryName,
  onToggleActive,
  onDeleteRequest,
  onConfirmDelete,
  onCancelDelete,
  isDeleteConfirmOpen = false,
  isDeleting = false,
  isBusy = false,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
        isDeleteConfirmOpen
          ? 'border-rose-200 ring-2 ring-rose-100'
          : product.isActive
            ? 'border-slate-100'
            : 'border-red-100 opacity-70'
      }`}
    >
      <div className="flex gap-3 p-3">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(event) => {
                (event.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl">🍽️</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-800 text-sm truncate">{product.name}</h4>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{categoryName || '—'}</p>
          <p className="text-sm font-black text-amber-600 mt-1">{product.price.toLocaleString()} so'm</p>
          <div className="flex items-center gap-2 mt-2">
            <AvailabilityBadge availability={product.availability} />
            {!product.isActive ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border bg-slate-50 text-slate-500 border-slate-200">
                Nofaol
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1 items-center justify-center">
          <button
            type="button"
            onClick={() => onToggleActive(product)}
            disabled={isBusy || isDeleteConfirmOpen}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              product.isActive ? 'text-emerald-500 bg-emerald-50' : 'text-red-400 bg-red-50'
            } disabled:opacity-60`}
          >
            {product.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/admin/menu/products/${product.id}/edit`)}
            disabled={isBusy || isDeleteConfirmOpen}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 bg-slate-50 active:scale-95 transition-transform disabled:opacity-60"
          >
            <Edit3 size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDeleteRequest(product)}
            disabled={isBusy}
            className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-60 ${
              isDeleteConfirmOpen ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-500'
            }`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isDeleteConfirmOpen ? (
        <div className="border-t border-rose-100 bg-gradient-to-br from-rose-50 via-white to-orange-50 px-3 pb-3 pt-3">
          <div className="rounded-[18px] border border-rose-100 bg-white/90 p-3 shadow-[0_10px_24px_rgba(244,63,94,0.08)]">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-500">Tasdiqlash</p>
            <p className="mt-1 text-[15px] font-black text-slate-950">{product.name} o'chirilsinmi?</p>
            <p className="mt-1 text-[12px] font-medium leading-5 text-slate-500">
              Faqat shu taom katalog va mijozlar menyusidan olib tashlanadi.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onCancelDelete}
                disabled={isDeleting}
                className="flex h-11 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white text-[13px] font-bold text-slate-900 transition active:scale-[0.98] disabled:opacity-60"
              >
                <X size={15} />
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => onConfirmDelete(product)}
                disabled={isDeleting}
                className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-rose-500 text-[13px] font-bold text-white shadow-lg shadow-rose-200 transition active:scale-[0.98] disabled:opacity-60"
              >
                {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Ha, o'chirish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProductCardAdmin;
