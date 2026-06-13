'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const TRIGGER_THRESHOLD_PX = 70;   // shu masofadan keyin refresh ishga tushadi
const MAX_PULL_PX = 110;           // vizual sudrash maksimumi (rubber band)
const RESISTANCE = 0.5;            // 1 = 1:1, kichik = ko'proq qarshilik
const MIN_SPIN_MS = 500;           // spinner kamida shuncha ko'rinadi (jonliroq)

const haptic = (kind: 'light' | 'medium' | 'success') => {
  try {
    const tg = (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: {
      impactOccurred?: (s: string) => void;
      notificationOccurred?: (s: string) => void;
    } } } }).Telegram?.WebApp?.HapticFeedback;
    if (kind === 'success') tg?.notificationOccurred?.('success');
    else tg?.impactOccurred?.(kind);
  } catch {/* ignore */}
};

/**
 * iOS-style pull-to-refresh — global window scroll'iga bog'lanadi.
 * - Faqat sahifa eng tepasida (scrollY=0) ishga tushadi
 * - Pull > threshold → release → invalidateQueries() barchasini yangilaydi
 * - Threshold'ga yetganda medium haptic, refresh boshlanganda success haptic
 * - data-no-ptr atributli ancestor mavjud bo'lsa (masalan, xarita sahifa) o'chiriladi
 *
 * Komponent return qiladi: { pullDistance, refreshing } — indicator chizish uchun
 */
export function usePullToRefresh() {
  const qc = useQueryClient();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef<number | null>(null);
  const crossedRef = useRef(false);
  const pullingRef = useRef(false);

  useEffect(() => {
    const isPtrDisabled = (target: EventTarget | null): boolean => {
      let el = target as HTMLElement | null;
      while (el) {
        if (el.dataset?.noPtr === 'true' || el.getAttribute?.('data-no-ptr') === 'true') return true;
        el = el.parentElement;
      }
      return false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      if (window.scrollY > 0) return;
      if (isPtrDisabled(e.target)) return;
      startYRef.current = e.touches[0].clientY;
      crossedRef.current = false;
      pullingRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current == null || refreshing) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        if (pullingRef.current) setPullDistance(0);
        pullingRef.current = false;
        return;
      }

      // Rubber band — exponential resistance after threshold
      const eased = dy * RESISTANCE;
      const visual = Math.min(MAX_PULL_PX, eased);

      pullingRef.current = true;
      setPullDistance(visual);

      // Sudrash paytida sahifa scroll bo'lmasligi uchun
      if (visual > 3 && e.cancelable) {
        e.preventDefault();
      }

      if (visual >= TRIGGER_THRESHOLD_PX && !crossedRef.current) {
        crossedRef.current = true;
        haptic('medium');
      } else if (visual < TRIGGER_THRESHOLD_PX && crossedRef.current) {
        crossedRef.current = false;
        haptic('light');
      }
    };

    const onTouchEnd = () => {
      if (startYRef.current == null) {
        return;
      }
      const triggered = crossedRef.current;
      startYRef.current = null;

      if (triggered) {
        setRefreshing(true);
        setPullDistance(TRIGGER_THRESHOLD_PX);
        haptic('success');

        const startedAt = Date.now();
        void qc
          .invalidateQueries()
          .catch(() => {/* swallow — UX uchun */})
          .finally(() => {
            const elapsed = Date.now() - startedAt;
            const wait = Math.max(0, MIN_SPIN_MS - elapsed);
            window.setTimeout(() => {
              setRefreshing(false);
              setPullDistance(0);
            }, wait);
          });
      } else {
        setPullDistance(0);
      }
      pullingRef.current = false;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [qc, refreshing]);

  return { pullDistance, refreshing, triggerThreshold: TRIGGER_THRESHOLD_PX };
}
