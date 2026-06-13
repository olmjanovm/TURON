'use client';

import { useCourierSocket } from '@/hooks/use-courier-socket';
import { useCourierGps } from '@/hooks/use-courier-gps';
import { useCourierNewOrderDetector } from '@/hooks/use-courier-new-order-detector';
import { OrderInterruptModal } from './order-interrupt-modal';

/**
 * Activator — CourierLayout ichida bir marta mount qilinadi.
 * - Socket.io ulanish + react-query invalidatsiya
 * - GPS emit (faqat onlineda)
 * - Yangi ASSIGNED buyurtma detektori → OrderInterruptModal
 */
export function CourierRealtime() {
  useCourierSocket();
  useCourierGps();
  useCourierNewOrderDetector();
  return <OrderInterruptModal />;
}
