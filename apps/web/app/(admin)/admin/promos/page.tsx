'use client';

import { Tag } from 'lucide-react';
import { useAdminPromos } from '@/hooks/use-admin-catalog';
import { SkeletonRow } from '@/components/ui/skeleton';

export default function AdminPromosPage() {
  const { data: promos, isLoading, isError } = useAdminPromos();

  return (
    <div className="space-y-4">
      <h2 className="px-1 text-sm font-bold text-slate-900">
        Promokodlar {promos ? `(${promos.length})` : ''}
      </h2>

      {isLoading ? (
        <div className="space-y-2"><SkeletonRow /><SkeletonRow /></div>
      ) : isError ? (
        <div className="admin-card p-6 text-center text-sm text-slate-500">Yuklashda xatolik.</div>
      ) : (promos ?? []).length === 0 ? (
        <p className="admin-card p-8 text-center text-sm text-slate-400">Promokod yo'q</p>
      ) : (
        <div className="space-y-2">
          {(promos ?? []).map((p) => {
            const isPct = p.discountType?.toUpperCase().includes('PERCENT');
            return (
              <div key={p.id} className="admin-card flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ember/10 text-ember">
                  <Tag size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black uppercase tracking-wide text-slate-900">{p.code}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {isPct ? `${p.discountValue}%` : `${p.discountValue.toLocaleString('uz-UZ')} so'm`} chegirma · {p.timesUsed} marta
                  </p>
                </div>
                <span className={`admin-pill ${p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  {p.isActive ? 'Faol' : 'Nofaol'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
