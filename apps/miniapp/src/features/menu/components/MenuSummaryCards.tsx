import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Layers, Package, PackageX, Plus } from 'lucide-react';
import { ProductAvailabilityEnum } from '@turon/shared';
import type { MenuCategory, MenuProduct } from '../types';

interface Props {
  categories: MenuCategory[];
  products: MenuProduct[];
}

const MenuSummaryCards: React.FC<Props> = ({ categories, products }) => {
  const navigate = useNavigate();

  const totalCategories = categories.length;
  const activeProducts = products.filter((product) => product.isActive).length;
  const inactiveProducts = products.filter((product) => !product.isActive).length;
  const oosProducts = products.filter(
    (product) => product.availability === ProductAvailabilityEnum.OUT_OF_STOCK,
  ).length;

  const cards = [
    {
      label: 'Kategoriyalar',
      value: totalCategories,
      icon: Layers,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Faol taomlar',
      value: activeProducts,
      icon: Package,
      color: 'bg-emerald-50 text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
    {
      label: 'Nofaol',
      value: inactiveProducts,
      icon: PackageX,
      color: 'bg-slate-50 text-slate-500',
      iconBg: 'bg-slate-100',
    },
    {
      label: 'Tugagan',
      value: oosProducts,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
      iconBg: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`${card.color} rounded-2xl p-4 border border-white/50`}>
              <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-black">{card.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-70 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Tezkor amallar</h3>
        <button
          type="button"
          onClick={() => navigate('/admin/menu/categories/new')}
          className="w-full flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-100 active:scale-[0.98] transition-transform shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Plus size={20} />
            </div>
            <span className="font-bold text-slate-800">Kategoriya qo'shish</span>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/menu/products/new')}
          className="w-full flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-100 active:scale-[0.98] transition-transform shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Plus size={20} />
            </div>
            <span className="font-bold text-slate-800">Taom qo'shish</span>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Bo'limlar</h3>
        <button
          type="button"
          onClick={() => navigate('/admin/menu/categories')}
          className="w-full flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-100 active:scale-[0.98] transition-transform shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Layers size={20} />
            </div>
            <div className="text-left">
              <span className="font-bold text-slate-800 block">Kategoriyalar</span>
              <span className="text-xs text-slate-400">{totalCategories} ta</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/menu/products')}
          className="w-full flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-100 active:scale-[0.98] transition-transform shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Package size={20} />
            </div>
            <div className="text-left">
              <span className="font-bold text-slate-800 block">Taomlar</span>
              <span className="text-xs text-slate-400">{products.length} ta</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </button>
      </div>
    </div>
  );
};

export default MenuSummaryCards;
