import React from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Minus, ShoppingBag, X } from 'lucide-react';
import { Product, Category } from '../../data/mockData';
import { useCustomerStore } from '../../store/useCustomerStore';

export const CategoryCard: React.FC<{ category: Category }> = ({ category }) => (
  <NavLink 
    to={`/customer/category/${category.id}`}
    className="flex flex-col items-center min-w-[70px] space-y-2 group active:scale-95 transition-transform"
  >
    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm group-active:border-amber-500">
      <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
    </div>
    <span className="text-[10px] font-bold text-gray-700 uppercase text-center overflow-hidden w-full px-1">{category.name}</span>
  </NavLink>
);

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart, cart } = useCustomerStore();
  const quantityInCart = cart.find(item => item.id === product.id)?.quantity || 0;

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full active:scale-98 transition-transform">
      <NavLink to={`/customer/product/${product.id}`} className="relative h-40 overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg shadow-sm">
          <span className="text-xs font-black text-amber-600 truncate">{product.price.toLocaleString()} so'm</span>
        </div>
      </NavLink>
      
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-[10px] text-gray-400 line-clamp-2 mb-3 flex-1">{product.description}</p>
        
        <button 
          onClick={() => addToCart(product)}
          className={`
            w-full h-10 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors
            ${quantityInCart > 0 ? 'bg-amber-100 text-amber-600' : 'bg-amber-500 text-white shadow-lg shadow-amber-100'}
          `}
        >
          {quantityInCart > 0 ? (
            <>
              <ShoppingBag size={14} />
              Savatchada ({quantityInCart})
            </>
          ) : (
            <>
              <Plus size={14} />
              Qo’shish
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const QuantitySelector: React.FC<{ 
  quantity: number; 
  onIncrease: () => void; 
  onDecrease: () => void; 
}> = ({ quantity, onIncrease, onDecrease }) => (
  <div className="flex items-center bg-gray-100 p-1 rounded-2xl">
    <button 
      onClick={onDecrease}
      className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-800 active:scale-90 transition-transform"
    >
      <Minus size={18} />
    </button>
    <span className="px-4 font-black text-lg min-w-[40px] text-center">{quantity}</span>
    <button 
      onClick={onIncrease}
      className="w-10 h-10 bg-amber-500 rounded-xl shadow-sm flex items-center justify-center text-white active:scale-90 transition-transform"
    >
      <Plus size={18} />
    </button>
  </div>
);

export const ProductGrid: React.FC<{ products: Product[] }> = ({ products }) => (
  <div className="grid grid-cols-2 gap-4">
    {products.map(product => (
      <ProductCard key={product.id} product={product} />
    ))}
  </div>
);

export const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
    <div className="w-20 h-20 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mb-6">
      <X size={40} />
    </div>
    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{message}</p>
  </div>
);
