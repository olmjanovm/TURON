import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save, Trash2, X } from 'lucide-react';
import type { MenuCategory, MenuProduct, ProductFormData } from '../types';
import ProductImageUploader from './ProductImageUploader';

interface Props {
  categories: MenuCategory[];
  initialData?: MenuProduct;
  onSubmit: (data: ProductFormData) => Promise<void> | void;
  title: string;
  error?: string | null;
  isSubmitting?: boolean;
  onDelete?: () => Promise<void> | void;
  isDeleting?: boolean;
}

const ProductForm: React.FC<Props> = ({
  categories,
  initialData,
  onSubmit,
  title,
  error,
  isSubmitting = false,
  onDelete,
  isDeleting = false,
}) => {
  const navigate = useNavigate();

  const [categoryId, setCategoryId] = useState(initialData?.categoryId || categories[0]?.id || '');
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price || 0);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [stockQuantity, setStockQuantity] = useState(initialData?.stockQuantity ?? 100);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = 'Taom nomi kiritilishi shart';
    }

    if (!categoryId) {
      nextErrors.categoryId = 'Kategoriyani tanlang';
    }

    if (price <= 0) {
      nextErrors.price = 'Narx musbat bo\'lishi kerak';
    }

    if (stockQuantity < 0) {
      nextErrors.stockQuantity = 'Zaxira miqdori manfiy bo\'lishi mumkin emas';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate() || isSubmitting || isDeleting) {
      return;
    }

    await onSubmit({
      categoryId,
      name: name.trim(),
      description: description.trim(),
      price,
      imageUrl,
      isActive,
      stockQuantity,
    });
  };

  const categoryMissing = categories.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"
        >
          <X size={20} />
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-rose-500">Xatolik</p>
          <p className="text-sm font-bold text-rose-700 mt-1 leading-relaxed">{error}</p>
        </div>
      ) : null}

      {categoryMissing ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Diqqat</p>
          <p className="text-sm font-bold text-amber-700 mt-1 leading-relaxed">
            Avval kamida bitta kategoriya yarating, keyin taom qo'shing.
          </p>
        </div>
      ) : null}

      <ProductImageUploader
        currentImageUrl={imageUrl}
        onImageChange={setImageUrl}
        onImageRemove={() => setImageUrl('')}
      />

      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Taom nomi *</label>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Masalan: Tandir somsa"
          className={`w-full h-14 px-4 rounded-2xl border-2 text-slate-800 font-medium text-base bg-white focus:outline-none transition-colors ${
            errors.name ? 'border-red-300' : 'border-slate-100 focus:border-blue-400'
          }`}
        />
        {errors.name ? <p className="text-xs text-red-500 font-medium">{errors.name}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Tavsif</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Taom haqida qisqacha..."
          rows={3}
          className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 text-slate-800 font-medium text-sm bg-white focus:outline-none focus:border-blue-400 transition-colors resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Narx (so'm) *</label>
        <input
          type="number"
          value={price || ''}
          onChange={(event) => setPrice(parseInt(event.target.value, 10) || 0)}
          min={0}
          placeholder="12000"
          className={`w-full h-14 px-4 rounded-2xl border-2 text-slate-800 font-black text-lg bg-white focus:outline-none transition-colors ${
            errors.price ? 'border-red-300' : 'border-slate-100 focus:border-blue-400'
          }`}
        />
        {errors.price ? <p className="text-xs text-red-500 font-medium">{errors.price}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Kategoriya *</label>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          disabled={categoryMissing}
          className={`w-full h-14 px-4 rounded-2xl border-2 text-slate-800 font-medium text-base bg-white focus:outline-none transition-colors ${
            errors.categoryId ? 'border-red-300' : 'border-slate-100 focus:border-blue-400'
          }`}
        >
          <option value="">Tanlang...</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId ? (
          <p className="text-xs text-red-500 font-medium">{errors.categoryId}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">
          Zaxira miqdori
        </label>
        <input
          type="number"
          value={stockQuantity}
          onChange={(event) => setStockQuantity(parseInt(event.target.value, 10) || 0)}
          min={0}
          className={`w-full h-14 px-4 rounded-2xl border-2 text-slate-800 font-medium text-base bg-white focus:outline-none transition-colors ${
            errors.stockQuantity ? 'border-red-300' : 'border-slate-100 focus:border-blue-400'
          }`}
        />
        {errors.stockQuantity ? (
          <p className="text-xs text-red-500 font-medium">{errors.stockQuantity}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border-2 border-slate-100">
        <div>
          <p className="font-bold text-slate-800 text-sm">Faol holat</p>
          <p className="text-xs text-slate-400 mt-0.5">Nofaol taomlar mijozlarga ko'rinmaydi</p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`w-14 h-8 rounded-full transition-colors relative ${
            isActive ? 'bg-emerald-500' : 'bg-slate-200'
          }`}
        >
          <div
            className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-transform ${
              isActive ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={categoryMissing || isSubmitting || isDeleting}
          className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:bg-blue-300 disabled:shadow-none disabled:active:scale-100"
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          Saqlash
        </button>

        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete()}
            disabled={isSubmitting || isDeleting}
            className="w-full h-12 rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            Taomni o'chirish
          </button>
        ) : null}
      </div>
    </form>
  );
};

export default ProductForm;
