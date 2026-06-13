/**
 * Socket gateway'ga event emit qilish — backend integratsiyasi.
 *
 * Ishlatish (masalan, admin kuryerga buyurtma assign qilganda):
 *   await prisma.courierAssignment.create({...});
 *   void SocketEvents.assignmentNew(courierId, order.id, order.orderNumber);
 *
 * Konfiguratsiya (apps/backend/.env):
 *   SOCKET_GATEWAY_URL=https://turon-socket.fly.dev
 *   SOCKET_WEBHOOK_SECRET=<gateway WEBHOOK_SECRET bilan bir xil>
 *
 * SOCKET_WEBHOOK_SECRET bo'sh bo'lsa — barcha chaqiruvlar silently no-op.
 * Bu shuni anglatadi: gateway hali deploy qilinmagan bo'lsa ham backend
 * crash bermaydi, faqat realtime ishlamaydi (REST polling fallback).
 */

const GATEWAY_URL = (process.env.SOCKET_GATEWAY_URL ?? '').replace(/\/$/, '');
const SECRET = process.env.SOCKET_WEBHOOK_SECRET ?? '';
const TIMEOUT_MS = 5_000;

async function post(path: string, body: unknown): Promise<void> {
  if (!SECRET || !GATEWAY_URL) return; // graceful no-op
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${GATEWAY_URL}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-webhook-secret': SECRET,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`[socket-events] ${path} returned ${res.status}`);
    }
  } catch (err) {
    // Tarmoq/timeout — backend yiqilmasligi kerak
    console.warn(`[socket-events] ${path} failed:`, err instanceof Error ? err.message : err);
  } finally {
    clearTimeout(timer);
  }
}

export const SocketEvents = {
  /** Buyurtma kuryerga biriktirildi — kuryer ekranida darhol interrupt modal chiqadi. */
  assignmentNew(courierId: string, orderId: string, orderNumber?: string) {
    return post('/webhook/assignment-new', { courierId, orderId, orderNumber });
  },

  /** Assignment bekor qilindi (boshqa kuryerga o'tdi yoki buyurtma bekor). */
  assignmentCancelled(courierId: string, orderId: string) {
    return post('/webhook/assignment-cancelled', { courierId, orderId });
  },

  /** Buyurtma holati o'zgardi (status, stage, payment) — barcha tinglovchilarga. */
  orderUpdated(orderId: string) {
    return post('/webhook/order-updated', { orderId });
  },

  /** Generic: bitta foydalanuvchiga ixtiyoriy event. */
  emit(userId: string, event: string, payload?: unknown) {
    return post('/webhook/emit', { userId, event, payload });
  },
};
