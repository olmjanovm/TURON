/**
 * Socket gateway config — env-driven.
 * JWT_SECRET must match the Fastify backend so tokens issued by /auth/telegram
 * verify cleanly here.
 */

const required = (name: string): string => {
  const val = process.env[name];
  if (!val || val.trim() === '') {
    throw new Error(`[socket-gateway] Missing required env: ${name}`);
  }
  return val;
};

export const env = {
  PORT: Number(process.env.PORT ?? 3030),
  HOST: process.env.HOST ?? '0.0.0.0',

  JWT_SECRET: required('JWT_SECRET'),
  AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME ?? 'turon_token',

  // CORS — list of allowed origins, comma-separated
  CORS_ORIGINS: (process.env.CORS_ORIGINS ?? 'https://turon-miniapp.vercel.app,http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Redis (optional — enables horizontal scale)
  REDIS_URL: process.env.REDIS_URL ?? '',

  // Backend REST URL for cross-service calls (e.g., persist GPS in DB)
  BACKEND_URL: process.env.BACKEND_URL ?? 'https://turonkafe.duckdns.org',

  // GPS persistence: how often we write live coords to DB (ms)
  GPS_DB_FLUSH_MS: Number(process.env.GPS_DB_FLUSH_MS ?? 20_000),
  GPS_REDIS_TTL_S: Number(process.env.GPS_REDIS_TTL_S ?? 60),

  // Webhook secret — backend gateway'ga event emit qilganda yuboradi
  // (X-Webhook-Secret header). Bo'sh bo'lsa webhook endpoints o'chiriladi.
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET?.trim() ?? '',
};
