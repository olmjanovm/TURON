import React from 'react';
import { Edit2, Loader2, Tag, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../../../components/admin/DeleteConfirmationModal';
import { useDeleteAdminPromo } from '../../../hooks/queries/usePromos';
import type { AdminPromo } from '../../promo/types';
import {
  formatPromoDate,
  formatPromoMoney,
  getPromoDiscountLabel,
  getPromoStatusMeta,
} from './adminPromos.utils';

interface AdminPromoRowProps {
  promo: AdminPromo;
  index: number;
}

export function AdminPromoRow({ promo, index }: AdminPromoRowProps) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteAdminPromo();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const statusMeta = getPromoStatusMeta(promo);

  return (
    <>
      <article className="adminx-promo-row" style={{ ['--i' as string]: index } as React.CSSProperties}>
        <div className="flex items-start gap-3">
          <div className="adminx-promo-avatar">
            <Tag size={16} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[15px] font-black uppercase tracking-[0.08em] text-[var(--adminx-color-ink)]">
                    {promo.code}
                  </p>
                  <span className={`inline-flex min-h-7 items-center rounded-full border px-3 text-[10px] font-black uppercase tracking-[0.16em] ${statusMeta.className}`}>
                    {statusMeta.label}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-[13px] font-semibold text-[var(--adminx-color-muted)]">
                  {promo.title || 'Sarlavhasiz'}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[15px] font-black text-[var(--adminx-color-ink)]">{getPromoDiscountLabel(promo)}</p>
                <p className="mt-1 text-[11px] font-semibold text-[var(--adminx-color-faint)]">Min {formatPromoMoney(promo.minOrderValue)}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="adminx-promo-mini">
                <span>Ishlatilgan</span>
                <strong>{promo.timesUsed}{promo.usageLimit ? ` / ${promo.usageLimit}` : ''}</strong>
              </div>
              <div className="adminx-promo-mini">
                <span>Davr</span>
                <strong>{formatPromoDate(promo.startDate)} - {formatPromoDate(promo.endDate)}</strong>
              </div>
              <div className="adminx-promo-mini">
                <span>Tur</span>
                <strong>{promo.discountType === 'PERCENTAGE' ? 'Foiz' : 'Summali'}</strong>
              </div>
              <div className="adminx-promo-mini">
                <span>Segment</span>
                <strong>{promo.isFirstOrderOnly ? 'Birinchi buyurtma' : 'Hamma uchun'}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => navigate(`/admin/promos/${promo.id}/edit`)}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-[14px] border border-[rgba(28,18,7,0.08)] bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--adminx-color-ink)]"
          >
            <Edit2 size={14} />
            Tahrirlash
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex min-h-10 items-center justify-center rounded-[14px] border border-[rgba(214,69,69,0.14)] bg-[rgba(255,244,242,0.95)] px-3 text-[var(--adminx-color-danger)]"
            aria-label="Promokodni o'chirish"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </article>

      <DeleteConfirmationModal
        isOpen={confirmDelete}
        title="Promokodni o'chirish"
        description="Promokod aktiv oqimdan olib tashlanadi."
        itemName={promo.code}
        isDeleting={deleteMutation.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void deleteMutation.mutateAsync(promo.id).then(() => setConfirmDelete(false))}
        confirmLabel={deleteMutation.isPending ? 'O\'chirilmoqda' : 'O\'chirish'}
      />
    </>
  );
}
