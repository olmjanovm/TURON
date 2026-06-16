'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CourierOrderDetail } from '@/hooks/use-courier';

/**
 * Yetkazishni yakunlash (DELIVERED) oqimi.
 *
 * NEGA alohida hook: backend `POST /courier/order/:id/deliver` MAJBURIY
 * `gpsLatitude`/`gpsLongitude` (Zod) talab qiladi va server tomonda geofencing
 * bor (≤300m). `useAdvanceStage` esa tanasiz POST yuborardi → har doim 400
 * (kuryer buyurtmani umuman "topshirdim" deb yopa olmasdi). Bu hook:
 *  1. bir martalik aniq GPS oladi,
 *  2. tanani yuboradi,
 *  3. server "uzoqdasiz" (requiresBypass) desa — bypass tasdig'ini so'raydi,
 *  4. bypass bilan qayta yuboradi (admin alert serverda avtomatik ketadi).
 */
export interface DeliverFlowState {
  phase: 'idle' | 'locating' | 'sending' | 'bypass' | 'error' | 'done';
  message?: string;
}

interface PositionLite {
  lat: number;
  lng: number;
  accuracy?: number;
}

function getCurrentPositionOnce(timeoutMs = 10_000): Promise<PositionLite> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('GPS bu qurilmada mavjud emas'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'GPS ruxsati berilmagan. Topshirish uchun joylashuvga ruxsat bering.'
              : 'GPS aniqlanmadi. Ochiq joyda qayta urining.',
          ),
        ),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 5_000 },
    );
  });
}

type DeliverResult =
  | { ok: true; data: CourierOrderDetail }
  | { ok: false; requiresBypass: boolean; error: string };

async function postDeliver(
  orderId: string,
  body: { gpsLatitude: number; gpsLongitude: number; gpsAccuracy?: number; bypassGpsRestriction?: boolean },
): Promise<DeliverResult> {
  // Apparels: apiFetch 400 tanasidagi `requiresBypass` flagini yutib yuboradi
  // (faqat message qoldiradi). Shu sabab bu yerda xom fetch — flagni o'qiymiz.
  const res = await fetch(`/api/courier/order/${orderId}/deliver`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* bo'sh/no-json javob */
  }
  if (res.ok) return { ok: true, data: json as CourierOrderDetail };
  const obj = json as { error?: string; requiresBypass?: boolean } | null;
  return {
    ok: false,
    requiresBypass: obj?.requiresBypass === true,
    error: obj?.error || `Topshirishda xatolik (${res.status})`,
  };
}

export function useDeliverFlow(orderId: string, onDone?: (order: CourierOrderDetail) => void) {
  const qc = useQueryClient();
  const [state, setState] = useState<DeliverFlowState>({ phase: 'idle' });

  const run = useCallback(
    async (bypass: boolean) => {
      try {
        setState({ phase: 'locating' });
        const pos = await getCurrentPositionOnce();
        setState({ phase: 'sending' });
        const result = await postDeliver(orderId, {
          gpsLatitude: pos.lat,
          gpsLongitude: pos.lng,
          gpsAccuracy: pos.accuracy,
          bypassGpsRestriction: bypass,
        });

        if (result.ok) {
          qc.setQueryData(['courier', 'order', orderId], result.data);
          qc.invalidateQueries({ queryKey: ['courier'] });
          setState({ phase: 'done' });
          onDone?.(result.data);
          return;
        }
        if (result.requiresBypass) {
          setState({ phase: 'bypass', message: result.error });
          return;
        }
        setState({ phase: 'error', message: result.error });
      } catch (e) {
        setState({ phase: 'error', message: e instanceof Error ? e.message : 'Xatolik' });
      }
    },
    [orderId, qc, onDone],
  );

  return {
    state,
    isBusy: state.phase === 'locating' || state.phase === 'sending',
    /** Birinchi urinish (bypass'siz). */
    start: () => run(false),
    /** "Uzoqdasiz" ogohlantirishidan keyin baribir yopish. */
    confirmBypass: () => run(true),
    reset: () => setState({ phase: 'idle' }),
  };
}
