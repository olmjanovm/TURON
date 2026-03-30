import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { CategoryFormData } from '../types';
import { MenuCategory } from '../types';
import ProductImageUploader from './ProductImageUploader';

interface Props {
  initialData?: MenuCategory;
  onSubmit: (data: CategoryFormData) => void;
  title: string;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const CategoryForm: React.FC<Props> = ({ initialData, onSubmit, title }) => {
  const navigate = useNavigate();
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder || 1);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialData) {
      setSlug(slugify(name));
    }
  }, [name, initialData]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Kategoriya nomi kiritilishi shart';
    if (sortOrder < 0) errs.sortOrder = 'Tartib raqami musbat bo\'lishi kerak';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ name: name.trim(), slug, imageUrl, sortOrder, isActive });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
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

      <ProductImageUploader
        currentImageUrl={imageUrl}
        onImageChange={setImageUrl}
        onImageRemove={() => setImageUrl('')}
      />

      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Kategoriya nomi *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masalan: Somsa"
          className={`w-full h-14 px-4 rounded-2xl border-2 text-slate-800 font-medium text-base bg-white focus:outline-none focus:ring-0 transition-colors ${
            errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-blue-400'
          }`}
        />
        {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-mono text-sm bg-slate-50 focus:outline-none focus:border-blue-400"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Tartib raqami</label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
          min={0}
          className={`w-full h-14 px-4 rounded-2xl border-2 text-slate-800 font-medium text-base bg-white focus:outline-none transition-colors ${
            errors.sortOrder ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-blue-400'
          }`}
        />
        {errors.sortOrder && <p className="text-xs text-red-500 font-medium">{errors.sortOrder}</p>}
      </div>

      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border-2 border-slate-100">
        <div>
          <p className="font-bold text-slate-800 text-sm">Faol holat</p>
          <p className="text-xs text-slate-400 mt-0.5">Nofaol kategoriyalar mijozlarga ko'rinmaydi</p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`w-14 h-8 rounded-full transition-colors relative ${isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}
        >
          <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-transform ${isActive ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

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

export default CategoryForm;
