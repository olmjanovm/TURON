'use client';

import { useAuth } from '@/hooks/use-auth';

/** FAZA A2 — auth holatini ko'rsatuvchi kichik island (skelet validatsiyasi). */
export function AuthStatusBadge() {
  const { user, status, error, isLoading } = useAuth();

  const text =
    status === 'authenticated' && user
      ? `✅ ${user.fullName} · ${user.role}`
      : isLoading
        ? '⏳ Kirilmoqda…'
        : status === 'error'
          ? `⚠️ ${error}`
          : '👤 Telegram tashqarisida (mehmon)';

  return (
    <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80">
      {text}
    </span>
  );
}
