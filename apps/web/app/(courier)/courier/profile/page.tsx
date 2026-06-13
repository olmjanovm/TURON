'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, Save, User, Phone } from 'lucide-react';
import { useCourierProfile, useUpdateProfile } from '@/hooks/use-courier';
import { Skeleton } from '@/components/ui/skeleton';
import { focusScrollIntoView } from '@/hooks/use-keyboard';

export default function CourierProfilePage() {
  const { data: profile, isLoading, error } = useCourierProfile();
  const update = useUpdateProfile();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? '');
      setPhone(profile.phoneNumber ?? '');
    }
  }, [profile]);

  const dirty =
    profile != null && (fullName.trim() !== (profile.fullName ?? '') || phone.trim() !== (profile.phoneNumber ?? ''));

  const handleSave = () => {
    const payload: { fullName?: string; phoneNumber?: string } = {};
    if (fullName.trim() !== (profile?.fullName ?? '')) payload.fullName = fullName.trim();
    if (phone.trim() !== (profile?.phoneNumber ?? '')) payload.phoneNumber = phone.trim();
    if (Object.keys(payload).length === 0) return;
    update.mutate(payload, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 px-4 pb-6 pt-5">
        <Skeleton className="h-10 w-40" rounded="rounded-2xl" />
        <Skeleton className="h-40 w-full" rounded="rounded-3xl" />
        <Skeleton className="h-32 w-full" rounded="rounded-3xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-4 px-4 pt-5">
        <Link href="/courier" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
          <ArrowLeft size={16} /> Orqaga
        </Link>
        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <p className="text-base font-black text-slate-900">Profil yuklanmadi</p>
          <p className="mt-1 text-sm text-slate-500">{error instanceof Error ? error.message : 'Xato yuz berdi'}</p>
        </div>
      </div>
    );
  }

  const initials = profile.fullName
    ? profile.fullName.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()
    : 'K';

  return (
    <div className="space-y-4 px-4 pb-6 pt-5">
      <div className="flex items-center gap-3">
        <Link
          href="/courier"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hisob</p>
          <h1 className="text-xl font-black tracking-tight text-slate-900">Profil</h1>
        </div>
      </div>

      {/* Profile hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-lg">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #c62020, transparent 70%)' }}
        />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-2xl font-black shadow-[0_10px_24px_-8px_rgba(198,32,32,0.7)]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black">{profile.fullName}</p>
            <p className="text-xs text-white/60">@{profile.telegramUsername ?? '—'}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${profile.isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'}`}>
                {profile.isOnline ? 'Onlayn' : 'Offline'}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/70">
                {profile.totalDeliveredCount} yetkazildi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ma&apos;lumotlarni tahrirlash</p>

        <div>
          <label className="text-xs font-bold text-slate-600">To&apos;liq ism</label>
          <div className="relative mt-1">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onFocus={focusScrollIntoView}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-[#c62020]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600">Telefon raqami</label>
          <div className="relative mt-1">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={focusScrollIntoView}
              placeholder="+998 90 123 45 67"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-[#c62020]"
            />
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <p className="text-sm font-bold text-emerald-700">Saqlandi</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || update.isPending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-sm font-black text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.5)] active:scale-[0.98] disabled:opacity-40"
        >
          {update.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Save size={15} /> Saqlash</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCell label="Bugun" value={profile.completedToday ?? 0} />
        <StatCell label="Faol" value={profile.activeAssignments ?? 0} />
        <StatCell label="Jami" value={profile.totalDeliveredCount ?? 0} />
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm">
      <p className="text-xl font-black text-slate-900 tabular-nums">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}
