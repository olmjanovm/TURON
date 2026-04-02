import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save, Trash2, X } from 'lucide-react';
import type { CategoryFormData, MenuCategory } from '../types';

interface Props {
  initialData?: MenuCategory;
  onSubmit: (data: CategoryFormData) => Promise<void> | void;
  title: string;
  error?: string | null;
  isSubmitting?: boolean;
  onDelete?: () => Promise<void> | void;
  isDeleting?: boolean;
}

const CategoryForm: React.FC<Props> = ({
  initialData,
  onSubmit,
  title,
  error,
  isSubmitting = false,
  onDelete,
  isDeleting = false,
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState(initialData?.name || '');
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder || 1);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = 'Kategoriya nomi kiritilishi shart';
    }

    if (sortOrder < 0) {
      nextErrors.sortOrder = 'Tartib raqami musbat bo\'lishi kerak';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate() || isSubmitting) {
      return;
    }

    await onSubmit({
      name: name.trim(),
      sortOrder,
      isActive,
    });
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

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-rose-500">Xatolik</p>
          <p className="text-sm font-bold text-rose-700 mt-1 leading-relaxed">{error}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Eslatma</p>
        <p className="text-sm font-bold text-slate-600 mt-1 leading-relaxed">
          Kategoriya rasmi mahsulot kartalaridagi birinchi rasm asosida ko'rsatiladi.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">
          Kategoriya nomi *
        </label>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Masalan: Somsa"
          className={`w-full h-14 px-4 rounded-2xl border-2 text-slate-800 font-medium text-base bg-white focus:outline-none transition-colors ${
            errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-blue-400'
          }`}
        />
        {errors.name ? <p className="text-xs text-red-500 font-medium">{errors.name}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">
          Tartib raqami
        </label>
        <input
          type="number"
          value={sortOrder}
          onChange={(event) => setSortOrder(parseInt(event.target.value, 10) || 0)}
          min={0}
          className={`w-full h-14 px-4 rounded-2xl border-2 text-slate-800 font-medium text-base bg-white focus:outline-none transition-colors ${
            errors.sortOrder
              ? 'border-red-300 focus:border-red-500'
              : 'border-slate-100 focus:border-blue-400'
          }`}
        />
        {errors.sortOrder ? (
          <p className="text-xs text-red-500 font-medium">{errors.sortOrder}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border-2 border-slate-100">
        <div>
          <p className="font-bold text-slate-800 text-sm">Faol holat</p>
          <p className="text-xs text-slate-400 mt-0.5">Nofaol kategoriyalar mijozlarga ko'rinmaydi</p>
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
          disabled={isSubmitting || isDeleting}
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
            Kategoriyani o'chirish
          </button>
        ) : null}
      </div>
    </form>
  );
};

export default CategoryForm;
