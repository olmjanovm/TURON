'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { isTelegramEnvironment } from '@/lib/telegram';

export type ReportTimeframe = 'today' | 'week' | 'month' | 'year';

export interface ReportStats {
  timeframe: ReportTimeframe;
  range: { start: string; end: string };
  orders: { status: string; count: number }[];
  revenue: { total: number; discount: number };
  newCustomers: number;
}

export function useReportStats(timeframe: ReportTimeframe) {
  return useQuery<ReportStats>({
    queryKey: ['admin', 'report-stats', timeframe],
    queryFn: () => apiFetch<ReportStats>(`/api/reports/stats?timeframe=${timeframe}`),
    staleTime: 60_000,
  });
}

/** Brauzer (desktop) — blob qilib faylni yuklab oladi. */
export async function downloadReportExcel(timeframe: ReportTimeframe): Promise<void> {
  const res = await fetch(`/api/reports/export?timeframe=${timeframe}`, {
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error('Eksport xatosi');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `turon-hisobot-${timeframe}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Telegram Mini App — botdan admin chatiga hujjat sifatida yuboradi. */
export async function sendReportToTelegram(timeframe: ReportTimeframe): Promise<void> {
  await apiFetch(`/api/reports/export-telegram?timeframe=${timeframe}`, { method: 'POST' });
}

/**
 * Hisobot eksporti — muhitga qarab to'g'ri usulni tanlaydi:
 *  • Telegram Mini App ichida → bot chatga .xlsx yuboradi (blob download WebView'da
 *    ishlamaydi, qora oyna ochiladi). Qaytaradi: 'telegram'.
 *  • Oddiy brauzer (desktop) → faylni yuklab oladi. Qaytaradi: 'download'.
 */
export async function exportReport(timeframe: ReportTimeframe): Promise<'telegram' | 'download'> {
  if (isTelegramEnvironment()) {
    await sendReportToTelegram(timeframe);
    return 'telegram';
  }
  await downloadReportExcel(timeframe);
  return 'download';
}
