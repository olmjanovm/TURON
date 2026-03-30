import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QuantitySelector, EmptyState } from '../../components/customer/CustomerComponents';
import { useCartStore } from '../../store/useCartStore';
import { useMenuStore } from '../../store/useMenuStore';
import { ProductAvailabilityEnum } from '@turon/shared';
import { ShoppingBag } from 'lucide-react';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProductById } = useMenuStore();
  const product = id ? getProductById(id) : undefined;
  const { addToCart, items } = useCartStore();
  
  const existingItem = items.find(item => item.id === id);
  const [quantity, setQuantity] = useState(existingItem?.quantity || 1);

  if (!product) {
    return <EmptyState message="Mahsulot topilmadi!" />;
  }

  const isAvailable = product.isActive && product.availability === ProductAvailabilityEnum.AVAILABLE;
  const isTemporarilyUnavailable = product.availability === ProductAvailabilityEnum.TEMPORARILY_UNAVAILABLE;

  const handleAddToCart = () => {
    if (!isAvailable) return;
    // Snapshot the product data into the cart item (name, price, image are frozen at add time)
    addToCart({ id: product.id, categoryId: product.categoryId, name: product.name, description: product.description, price: product.price, image: product.imageUrl }, quantity);
    navigate('/customer/cart');
  };

  return (
    <div className="animate-in slide-in-from-bottom duration-500 pb-20 relative px-1">
      {/* Product Image */}
      <div className="relative h-[300px] -mx-5 -mt-4 mb-8 overflow-hidden rounded-b-[40px] shadow-lg">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-amber-50 flex items-center justify-center text-6xl">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        
        {/* Price Tag Overlay */}
        <div className="absolute bottom-6 left-6 bg-white rounded-2xl px-5 py-3 shadow-xl border border-gray-100/20 backdrop-blur-md">
          <span className="text-2xl font-black text-amber-600 tracking-tight">{product.price.toLocaleString()} so'm</span>
        </div>

        {/* Availability overlay */}
        {!isAvailable && (
          <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur text-white px-3 py-1.5 rounded-xl text-xs font-bold uppercase">
            {isTemporarilyUnavailable ? 'Vaqtincha yo\'q' : 'Tugagan'}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="space-y-6">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">{product.name}</h2>
        <div className="inline-block px-3 py-1 bg-amber-50 rounded-lg">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Premium Sifat</span>
        </div>
        
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Taom haqida</h3>
          <p className="text-gray-600 text-lg leading-relaxed">
            {product.description} Turon kafesining eng sara ingredientlaridan tayyorlangan mazali taom.
          </p>
        </div>

        {product.weight && (
          <div className="text-sm text-gray-400">Og'irlik: {product.weight}</div>
        )}

        {/* Quantity Selector */}
        {isAvailable && (
          <div className="pt-6 space-y-4">
            <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider text-center">Miqdorini tanlang</h3>
            <div className="flex justify-center">
              <QuantitySelector 
                quantity={quantity} 
                onIncrease={() => setQuantity(q => q + 1)} 
                onDecrease={() => setQuantity(q => Math.max(1, q - 1))} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Button */}
      <div className="fixed bottom-24 left-0 right-0 px-6 z-40 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent pt-10 pb-2">
        <button 
          onClick={handleAddToCart}
          disabled={!isAvailable}
          className={`w-full h-16 rounded-[24px] font-black text-lg shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all ${
            isAvailable 
              ? 'bg-amber-500 text-white shadow-amber-200 active:bg-amber-600' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          <ShoppingBag size={24} />
          <span>{isAvailable ? 'Savatga Qo\'shish' : (isTemporarilyUnavailable ? 'Vaqtincha mavjud emas' : 'Tugagan')}</span>
        </button>
      </div>
    </div>
  );
};

export default ProductPage;
