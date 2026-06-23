import type { Context } from 'telegraf';
import type { InlineQueryResult } from 'telegraf/types';
import { ProductAvailabilityEnum } from '@turon/shared';
import { env } from '../../config.js';
import { prisma } from '../../lib/prisma.js';

/**
 * INLINE QUERY ARCHITECTURE — `@turonkafebot <search>` istalgan chatda menyu qidiruvi.
 *
 * Arxitektura qarorlari:
 *  - `web_app` tugma inline natijada Telegram tomonidan RUXSAT ETILMAYDI (faqat
 *    private chat). Shu sabab Direct Link Mini App `url` tugmasi ishlatiladi:
 *    https://t.me/<bot>?startapp=product_<id> → Main App'ni ochadi (FE param'ni o'qiydi).
 *  - cache_time=300s → Telegram natijani keshlaydi, backend yuki ~1/5daq (DDoS/yuk bo'g'ozi).
 *  - next_offset bilan kursorli paginatsiya (PAGE_SIZE dan oshsa keyingi sahifa).
 *  - Bandwidth optimizatsiyasi: faqat zarur ustunlar select qilinadi.
 */

const PAGE_SIZE = 12;           // Telegram bitta javobda ≤50; 12 — yengil payload
const MAX_QUERY_LEN = 64;
const CACHE_TIME_SECONDS = 300;

interface MenuRow {
  id: string;
  nameUz: string;
  nameRu: string | null;
  descriptionUz: string | null;
  price: unknown;
  oldPrice: unknown;
  imageUrl: string | null;
  category: { nameUz: string } | null;
}

function localized(uz: string | null, ru: string | null): string {
  return (uz && uz.trim()) || (ru && ru.trim()) || '';
}

function formatSom(value: number): string {
  return `${Math.round(value).toLocaleString('uz-UZ')} so'm`;
}

/** Direct Link Mini App deep-link — inline natijada ruxsat etilgan url tugma. */
function miniAppDeepLink(param: string): string {
  return `https://t.me/${env.BOT_USERNAME}?startapp=${param}`;
}

/** Faol + mavjud menyu mahsulotlarini qidiradi (paginatsiya bilan). */
async function searchMenu(query: string, offset: number): Promise<MenuRow[]> {
  const trimmed = query.trim().slice(0, MAX_QUERY_LEN);
  const where: Record<string, unknown> = {
    isActive: true,
    availabilityStatus: ProductAvailabilityEnum.AVAILABLE,
  };
  if (trimmed) {
    where.OR = [
      { nameUz: { contains: trimmed, mode: 'insensitive' } },
      { nameRu: { contains: trimmed, mode: 'insensitive' } },
      { category: { is: { nameUz: { contains: trimmed, mode: 'insensitive' } } } },
    ];
  }

  return prisma.menuItem.findMany({
    where: where as any,
    select: {
      id: true,
      nameUz: true,
      nameRu: true,
      descriptionUz: true,
      price: true,
      oldPrice: true,
      imageUrl: true,
      category: { select: { nameUz: true } },
    },
    // Bo'sh so'rovda — ommabop taomlar ("Popular Dishes") birinchi.
    orderBy: [{ isPopular: 'desc' }, { createdAt: 'desc' }],
    skip: offset,
    take: PAGE_SIZE + 1, // +1 → keyingi sahifa bor-yo'qligini aniqlash uchun
  }) as unknown as Promise<MenuRow[]>;
}

function toResult(row: MenuRow): InlineQueryResult {
  const title = localized(row.nameUz, row.nameRu) || 'Taom';
  const price = Number(row.price) || 0;
  const oldPrice = row.oldPrice != null ? Number(row.oldPrice) : null;
  const desc = localized(row.descriptionUz, null);
  const category = row.category?.nameUz ? `${row.category.nameUz} · ` : '';

  const priceLine = oldPrice && oldPrice > price
    ? `${formatSom(price)}  (${formatSom(oldPrice)})`
    : formatSom(price);

  const description = `${category}${priceLine}${desc ? ` · ${desc}` : ''}`.slice(0, 120);
  const link = miniAppDeepLink(`product_${row.id}`);

  return {
    type: 'article',
    id: row.id,
    title,
    description,
    // Natija tanlanganda chatga yuboriladigan xabar (kompakt, link bilan)
    input_message_content: {
      message_text: `🍽 <b>${title}</b>\n${priceLine}\n\n👉 <a href="${link}">TURON kafe — buyurtma berish</a>`,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    },
    ...(row.imageUrl ? { thumbnail_url: row.imageUrl } : {}),
    reply_markup: {
      inline_keyboard: [[{ text: '🛒 Buyurtma berish', url: link }]],
    },
  } as InlineQueryResult;
}

export async function handleInlineQuery(ctx: Context): Promise<void> {
  const inline = ctx.inlineQuery;
  if (!inline) return;

  const offset = Math.max(0, Number.parseInt(inline.offset || '0', 10) || 0);

  try {
    const rows = await searchMenu(inline.query || '', offset);
    const hasMore = rows.length > PAGE_SIZE;
    const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const results = pageRows.map(toResult);

    await ctx.answerInlineQuery(results, {
      cache_time: CACHE_TIME_SECONDS,
      is_personal: false,
      next_offset: hasMore ? String(offset + PAGE_SIZE) : '',
      button: {
        text: '🛒 TURON kafe — menyuni ochish',
        web_app: { url: `${(env.WEB_APP_URL || 'https://turon-miniapp.vercel.app').replace(/\/$/, '')}/` },
      },
    });
  } catch (error) {
    console.error('[Bot] inline_query failed:', error);
    // Bo'sh javob — Telegram "natija yo'q" ko'rsatadi (xato chiqib ketmaydi)
    try {
      await ctx.answerInlineQuery([], { cache_time: 10 });
    } catch { /* ignore */ }
  }
}
