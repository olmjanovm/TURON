'use client';

import { useSyncExternalStore } from 'react';
import type { DeviceTier } from '@/lib/device-tier';

/**
 * FAZA A5 — komponent ichida device tier'ni o'qish.
 * <html data-tier> inline skript orqali allaqachon o'rnatilgan, shu sabab
 * bu hook faqat shu atributni o'qiydi (qayta hisoblamaydi).
 *
 * Misol:
 *   const tier = useTier();
 *   {tier === 'full' && <ParticleField />}
 */
function getSnapshot(): DeviceTier {
  if (typeof document === 'undefined') return 'full';
  return (document.documentElement.dataset.tier as DeviceTier) || 'balanced';
}

function getServerSnapshot(): DeviceTier {
  // Server'da tier noma'lum — eng xavfsiz default (animatsiya kam).
  return 'balanced';
}

function subscribe(callback: () => void): () => void {
  if (typeof document === 'undefined') return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-tier'],
  });
  return () => observer.disconnect();
}

export function useTier(): DeviceTier {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
