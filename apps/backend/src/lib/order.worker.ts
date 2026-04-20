export interface OrderJobPayload {
  idempotencyKey: string;
  userId: string;
  items: unknown[];
  deliveryAddressId: string;
  paymentMethod: string;
  note?: string;
  receiptImageBase64?: string;
}

/**
 * Order queue worker is intentionally disabled until a Redis/BullMQ runtime is
 * configured in package dependencies and environment variables.
 *
 * Keeping this module dependency-free prevents backend builds from failing while
 * the high-load order batching worker is still being designed.
 */
export const orderWorker = null;

export function startOrderWorker() {
  console.warn('[OrderWorker] Disabled: BullMQ/Redis worker is not configured yet.');
  return orderWorker;
}
