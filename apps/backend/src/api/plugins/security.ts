import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { env } from '../../config.js';

/**
 * JWT payload'idan `id`'ni VERIFY qilmasdan o'qish (rate-limit kaliti uchun).
 * Maqsad — har FOYDALANUVCHIni alohida bucket'ga qo'yish. Imzoni tekshirmaymiz
 * (bu yengil; soxta id bilan o'z limitini buzgan foydalanuvchi faqat o'ziga
 * zarar qiladi). Token bo'lmasa → IP'ga qaytamiz.
 */
function decodeJwtUserId(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { id?: unknown };
    return typeof payload?.id === 'string' ? payload.id : null;
  } catch {
    return null;
  }
}

function rateLimitKey(req: FastifyRequest): string {
  const auth = req.headers['authorization'];
  const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
  const uid = decodeJwtUserId(token);
  // Authenticated → per-user; aks holda → per-IP (trustProxy bilan haqiqiy IP).
  return uid ? `user:${uid}` : `ip:${req.ip}`;
}

export default fp(async function securityPlugin(fastify: FastifyInstance) {
  // 1. Security Headers
  await fastify.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  });

  // 2. Rate Limiting — HAR FOYDALANUVCHI alohida (Vercel proxy hammani bitta
  //    IP'ga yig'adi; kalitni JWT user id'dan olamiz → "Yuborilmadi" 429'lar yo'q).
  await fastify.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: '1 minute',
    keyGenerator: rateLimitKey,
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `So'rovlar soni vaqtincha oshib ketdi. Iltimos ${context.after} kutib turing.`
    })
  });
});
