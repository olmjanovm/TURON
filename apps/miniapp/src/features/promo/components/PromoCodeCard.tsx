import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Edit2, Trash2, Loader2 } from 'lucide-react';
import { AdminPromo, DiscountTypeEnum } from '../types';
import { PromoStatusBadge } from './PromoStatusBadge';
import { getPromoStatus } from '../discountEngine';
import { useDeleteAdminPromo } from '../../../hooks/queries/usePromos';

interface Props {
  promo: AdminPromo;
  index?: number;
}

export const PromoCodeCard: React.FC<Props> = ({ promo, index = 0 }) => {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteMutation = useDeleteAdminPromo();
  const status = getPromoStatus(promo);

  const discountText = promo.discountType === DiscountTypeEnum.PERCENTAGE
    ? `${promo.discountValue}%`
    : `${promo.discountValue.toLocaleString()} so'm`;

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(promo.id);
    setConfirmDelete(false);
  };

  if (confirmDelete) {
    return (
      <div className="rounded-[20px] border-2 border-rose-100 bg-white p-4 shadow-[0_10px_22px_rgba(244,63,94,0.08)]">
        <p className="mb-1 text-sm font-bold text-slate-800">
          <span className="uppercase tracking-widest text-rose-600">{promo.code}</span> - o&apos;chirilsinmi?
        </p>
        <p className="mb-3 text-xs text-slate-400">Bu amalni qaytarib bo'lmaydi</p>
        <div className="flex gap-2">
          <button
            onClick={() => { void handleDelete(); }}
            disabled={deleteMutation.isPending}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-500 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-60"
          >
            {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            O&apos;chirish
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="h-10 flex-1 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 transition-transform active:scale-95"
          >
            Bekor qilish
          </button>
        </div>
      </div>
    );
  }

  return (
    <article
      className="group flex items-center justify-between gap-4 rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)]"
      style={{ transitionDelay: `${Math.min(index, 8) * 30}ms` }}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
        <Tag size={24} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="truncate text-[15px] font-black uppercase tracking-widest text-slate-900">{promo.code}</h3>
          <PromoStatusBadge status={status} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="line-clamp-1 text-[12px] font-bold text-slate-500">{promo.title || 'Sarlavhasiz'}</p>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] font-bold text-slate-400">
            <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-0.5 text-indigo-600">
              Chegirma: {discountText}
            </span>
            <span>Ishlatilgan: {promo.timesUsed}{promo.usageLimit ? ` / ${promo.usageLimit}` : ''}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={() => navigate(`/admin/promos/${promo.id}/edit`)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-400 transition-colors active:scale-90 hover:bg-indigo-50 hover:text-indigo-600"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-400 transition-colors active:scale-90 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </article>
  );
};
