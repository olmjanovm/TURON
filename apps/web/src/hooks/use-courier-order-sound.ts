'use client';

import { useCallback } from 'react';

/**
 * Yangi buyurtma tovushi — WebAudio bilan qisqa ikki-tonli "chime" (C3-5).
 *
 * Telegram WebView autoplay'ni bloklaydi → tovush USER GESTURE'da "unlock"
 * qilinishi kerak: `unlock()` AudioContext'ni resume qiladi (online toggle /
 * app'ga birinchi teginishda). Keyin `play()` yangi buyurtma eventida ishlaydi.
 *
 * WebAudio tanlandi (asset/`new Audio` o'rniga): fayl kerak emas, Telegram
 * WebView'da ishonchli, bitta yagona ovoz — autoplay unlock semantikasi aynan
 * shu (silent resume gesture'da).
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AC();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function useCourierOrderSound() {
  /** Gesture ichida chaqir — autoplay cheklovini ochadi (silent resume). */
  const unlock = useCallback(() => {
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }, []);

  /** Yangi buyurtma — bir martalik ikki-tonli chime. */
  const play = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime;

    const tone = (freq: number, start: number, dur: number, peak: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0 + start);
      gain.gain.setValueAtTime(0.0001, t0 + start);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + dur + 0.02);
    };

    // "ding-dong" — yuqori, keyin balandroq ton (e'tibor tortadi)
    tone(880, 0, 0.18, 0.3);
    tone(1320, 0.15, 0.3, 0.32);
  }, []);

  return { unlock, play };
}
