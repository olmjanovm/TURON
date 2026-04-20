import { Queue } from 'bullmq';
import { redis } from '../lib/redis.js';

/**
 * High-load Order Creation Queue
 */
export const orderQueue = new Queue('order-processing', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3, // Agar xatolik bo'lsa 3 marta qayta urinadi
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true, // Xotirani to'ldirmaslik uchun bajarilganlarni o'chiradi
    removeOnFail: false, // Xato bo'lganlarni admin ko'rishi uchun qoldiradi
  },
});