import { z } from 'zod';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  BOT_TOKEN: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  CORS_ORIGIN: z.string().default('*'),
  // Endi rate-limit HAR FOYDALANUVCHI bo'yicha (security plugin keyGenerator).
  // 100 juda past edi (polling+GPS) — per-user 240/daq (~4/s) bemalol yetadi.
  RATE_LIMIT_MAX: z.coerce.number().default(240),
  WEB_APP_URL: z.string().url().optional(),
  ADMIN_CHAT_ID: z.string().optional(),
  ADMIN_IDS: z.string().optional(),
  REDIS_URL: z.string().url().optional(), // BullMQ: e.g. redis://localhost:6379 or upstash URL
  // Bot username — inline natijalardagi t.me/<bot>?startapp=... deep-link uchun
  // (web_app tugma inline natijada RUXSAT ETILMAYDI → Direct Link Mini App ishlatamiz).
  BOT_USERNAME: z.string().default('turonkafebot'),
  // Guard Mode: chat_join_request gatekeeping qilinadigan VIP kanal/guruh id'si
  // (manfiy, masalan -1001234567890). Bo'sh bo'lsa — barcha join so'rovlari kuzatiladi.
  VIP_CHANNEL_ID: z.string().optional(),
  // AI yo'l-yo'riq yordamchisi (kuryer) — BEPUL modellar, FAQAT server-side.
  // Gemini birlamchi (o'zbekchada kuchli), Groq zaxira (tez). Ikkalasi ham bo'sh
  // bo'lsa — ORS burilishlaridan mahalliy o'zbekcha qadamlar (AIsiz) qaytariladi.
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
});

const _env = configSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data as z.infer<typeof configSchema>;
