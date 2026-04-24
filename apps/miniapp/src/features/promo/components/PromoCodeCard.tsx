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
      <div className="rounded-[12px] border border-rose-200 bg-[#FFFFFF] p-4 shadow-[0_8px_18px_rgba(220,38,38,0.08)]">
        <p className="mb-1 text-sm font-bold text-slate-800">
          <span className="uppercase tracking-widest text-rose-600">{promo.code}</span> - o&apos;chirilsinmi?
        </p>
        <p className="mb-3 text-xs text-[#6B7280]">Bu amalni qaytarib bo&apos;lmaydi</p>
        <div className="flex gap-2">
          <button
            onClick={() => { void handleDelete(); }}
            disabled={deleteMutation.isPending}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#DC2626] text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-60"
          >
            {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            O&apos;chirish
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="h-9 flex-1 rounded-[10px] bg-[#F3F4F6] text-sm font-bold text-[#374151] transition-transform active:scale-95"
          >
            Bekor qilish
          </button>
        </div>
      </div>
    );
  }

  return (
    <article
      className="group flex items-center justify-between gap-3 rounded-[12px] border border-[#E5E7EB] bg-[#FFFFFF] p-3.5 shadow-[0_6px_16px_rgba(17,24,39,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(17,24,39,0.08)]"
      style={{ transitionDelay: `${Math.min(index, 8) * 30}ms` }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(255,212,59,0.18)] text-[#7a5600]">
        <Tag size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="truncate text-[14px] font-black uppercase tracking-[0.08em] text-[#111827]">{promo.code}</h3>
          <PromoStatusBadge status={status} />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="line-clamp-1 text-[12px] font-semibold text-[#6B7280]">{promo.title || 'Sarlavhasiz'}</p>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-[#9CA3AF]">
            <span className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-0.5 text-[#7a5600]">
              Chegirma: {discountText}
            </span>
            <span>Ishlatilgan: {promo.timesUsed}{promo.usageLimit ? ` / ${promo.usageLimit}` : ''}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={() => navigate(`/admin/promos/${promo.id}/edit`)}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E5E7EB] text-[#6B7280] transition-colors active:scale-90 hover:bg-[rgba(255,212,59,0.18)] hover:text-[#7a5600]"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E5E7EB] text-[#6B7280] transition-colors active:scale-90 hover:border-rose-200 hover:bg-rose-50 hover:text-[#DC2626]"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
};
