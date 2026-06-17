'use client';

import { useEffect } from 'react';
import { useCourierSocket } from '@/hooks/use-courier-socket';
import { useCourierGps } from '@/hooks/use-courier-gps';
import { useCourierNewOrderDetector } from '@/hooks/use-courier-new-order-detector';
import { useCourierOrderSound } from '@/hooks/use-courier-order-sound';
import { useCourierSound } from '@/stores/courier-sound-store';
import { OrderInterruptModal } from './order-interrupt-modal';

/**
 * Activator — CourierLayout ichida bir marta mount qilinadi.
 * - Socket.io ulanish + react-query invalidatsiya
 * - GPS emit (faqat onlineda)
 * - Yangi ASSIGNED buyurtma detektori → OrderInterruptModal
 * - Yangi buyurtma tovushini birinchi user gesture'da "unlock" qiladi (C3-5)
 */
export function CourierRealtime() {
  useCourierSocket();
  useCourierGps();
  useCourierNewOrderDetector();

  const hydrateSound = useCourierSound((s) => s.hydrate);
  const { unlock } = useCourierOrderSound();

  // Tovush sozlamasini localStorage'dan tikla
  useEffect(() => {
    hydrateSound();
  }, [hydrateSound]);

  // Telegram WebView autoplay bloklaydi — birinchi teginishda audio'ni ochamiz.
  useEffect(() => {
    const onGesture = () => unlock();
    window.addEventListener('pointerdown', onGesture, { once: true });
    window.addEventListener('touchstart', onGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('touchstart', onGesture);
    };
  }, [unlock]);

  return <OrderInterruptModal />;
}
