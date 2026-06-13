'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

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

/** Excel eksport — proxy body'ni blob qilib client'da yuklab oladi. */
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
