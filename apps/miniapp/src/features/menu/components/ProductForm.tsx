import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { ProductAvailabilityEnum, ProductBadgeEnum } from '@turon/shared';
import { ProductFormData, MenuProduct } from '../types';
import { useMenuStore } from '../../../store/useMenuStore';
import ProductImageUploader from './ProductImageUploader';

interface Props {
  initialData?: MenuProduct;
  onSubmit: (data: ProductFormData) => void;
  title: string;
}

const ProductForm: React.FC<Props> = ({ initialData, onSubmit, title }) => {
  const navigate = useNavigate();
  const { categories } = useMenuStore();

  const [categoryId, setCategoryId] = useState(initialData?.categoryId || (categories[0]?.id || ''));
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price || 0);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [availability, setAvailability] = useState(initialData?.availability || ProductAvailabilityEnum.AVAILABLE);
  const [stockQuantity, setStockQuantity] = useState(initialData?.stockQuantity ?? 100);
  const [badge, setBadge] = useState(initialData?.badge || ProductBadgeEnum.NONE);
  const [weight, setWeight] = useState(initialData?.weight || '');
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder || 1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Taom nomi kiritilishi shart';
    if (!categoryId) errs.categoryId = 'Kategoriyani tanlang';
    if (price <= 0) errs.price = 'Narx musbat bo\'lishi kerak';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      categoryId,
      name: name.trim(),
      description: description.trim(),
      price,
      imageUrl,
      isActive,
      availability,
      stockQuantity,
      badge,
      weight: weight.trim() || undefined,
      sortOrder,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <button type="button" onClick={() => navigate(-1)} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
          <X size={20} />
        </button>
      </div>

      {/* Image */}
      <ProductImageUploader
        currentImageUrl={imageUrl}
        onImageChange={setImageUrl}
        onImageRemove={() => setImageUrl('')}
      />

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Taom nomi *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masalan: Tandir Somsa"
          className={`w-full h-14 px-4 rounded-2xl border-2 text-slate-800 font-medium text-base bg-white focus:outline-none transition-colors ${
            errors.name ? 'border-red-300' : 'border-slate-100 focus:border-blue-400'
          }`}
        />
        {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Tavsif</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Taom haqida qisqacha..."
          rows={3}
          className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 text-slate-800 font-medium text-sm bg-white focus:outline-none focus:border-blue-400 transition-colors resize-none"
        />
      </div>

      {/* Price */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Narx (so'm) *</label>
        <input
          type="number"
          value={price || ''}
          onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
          placeholder="12000"
          min={0}
          className={`w-full h-14 px-4 rounded-2xl border-2 text-slate-800 font-black text-lg bg-white focus:outline-none transition-colors ${
            errors.price ? 'border-red-300' : 'border-slate-100 focus:border-blue-400'
          }`}
        />
        {errors.price && <p className="text-xs text-red-500 font-medium">{errors.price}</p>}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Kategoriya *</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={`w-full h-14 px-4 rounded-2xl border-2 text-slate-800 font-medium text-base bg-white focus:outline-none transition-colors ${
            errors.categoryId ? 'border-red-300' : 'border-slate-100 focus:border-blue-400'
          }`}
        >
          <option value="">Tanlang...</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.categoryId && <p className="text-xs text-red-500 font-medium">{errors.categoryId}</p>}
      </div>

      {/* Availability */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Mavjudlik</label>
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value as ProductAvailabilityEnum)}
          className="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 text-slate-800 font-medium text-base bg-white focus:outline-none focus:border-blue-400"
        >
          <option value={ProductAvailabilityEnum.AVAILABLE}>✅ Mavjud</option>
          <option value={ProductAvailabilityEnum.TEMPORARILY_UNAVAILABLE}>⏸️ Vaqtincha yo'q</option>
          <option value={ProductAvailabilityEnum.OUT_OF_STOCK}>❌ Tugagan</option>
        </select>
      </div>

      {/* Stock Quantity */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Zaxira miqdori</label>
        <input
          type="number"
          value={stockQuantity}
          onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
          min={0}
          className="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 text-slate-800 font-medium text-base bg-white focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Badge */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Badge</label>
        <select
          value={badge}
          onChange={(e) => setBadge(e.target.value as ProductBadgeEnum)}
          className="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 text-slate-800 font-medium text-base bg-white focus:outline-none focus:border-blue-400"
        >
          <option value={ProductBadgeEnum.NONE}>Yo'q</option>
          <option value={ProductBadgeEnum.NEW}>🆕 Yangi</option>
          <option value={ProductBadgeEnum.POPULAR}>🔥 Ommabop</option>
          <option value={ProductBadgeEnum.DISCOUNT}>💰 Chegirma</option>
        </select>
      </div>

      {/* Weight */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Og'irlik</label>
        <input
          type="text"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Masalan: 250g"
          className="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 text-slate-800 font-medium text-base bg-white focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Sort Order */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Tartib raqami</label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
          min={0}
          className="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 text-slate-800 font-medium text-base bg-white focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border-2 border-slate-100">
        <div>
          <p className="font-bold text-slate-800 text-sm">Faol holat</p>
          <p className="text-xs text-slate-400 mt-0.5">Nofaol taomlar mijozlarga ko'rinmaydi</p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`w-14 h-8 rounded-full transition-colors relative ${isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}
        >
          <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-transform ${isActive ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Save size={20} />
        Saqlash
      </button>
    </form>
  );
};

export default ProductForm;
