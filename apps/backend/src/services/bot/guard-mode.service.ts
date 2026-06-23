import type { Context, Telegram } from 'telegraf';
import { env } from '../../config.js';
import { prisma } from '../../lib/prisma.js';

/**
 * GUARD MODE — VIP/maxsus kanal-guruhga `chat_join_request` darvozaboni.
 *
 * Oqim:
 *  1. Foydalanuvchi kanalga qo'shilishni so'raydi → `chat_join_request` keladi.
 *  2. So'rov DB'ga PENDING yoziladi (audit/holat).
 *  3. Foydalanuvchiga private DM — Mini App (web_app) tugmasi bilan: ro'yxatdan/
 *     loyallikdan o'ting. (web_app tugma PRIVATE chatda ruxsat etilgan.)
 *  4. Mini App ro'yxatni yakunlagach API `approvePendingJoinRequests` chaqiradi →
 *     `approveChatJoinRequest(chat_id, user_id)`.
 *
 * Resilience: foydalanuvchi botni bloklagan bo'lsa DM 403 beradi → DM_FAILED
 * sifatida belgilanadi va log qilinadi, lekin so'rov PENDING qoladi (keyin
 * foydalanuvchi o'zi botni ochib Mini App orqali tasdiqlay oladi).
 */

function guardWebAppUrl(): string {
  const base = (env.WEB_APP_URL || 'https://turon-miniapp.vercel.app').replace(/\/$/, '');
  // guard=1 → FE boot'da POST /guard/approve chaqiradi (faqat shu kontekstda)
  return `${base}/?guard=1`;
}

function isForbidden(error: unknown): boolean {
  const code = (error as { response?: { error_code?: number }; code?: number })?.response?.error_code
    ?? (error as { code?: number })?.code;
  return code === 403;
}

/** chat_join_request handleri (bot process). */
export async function handleChatJoinRequest(ctx: Context): Promise<void> {
  const req = ctx.chatJoinRequest;
  if (!req) return;

  const chatId = req.chat.id;
  const from = req.from;

  // Faqat sozlangan VIP kanalni qo'riqlaymiz (berilgan bo'lsa).
  if (env.VIP_CHANNEL_ID && String(chatId) !== env.VIP_CHANNEL_ID.trim()) {
    return;
  }

  const fullName = [from.first_name, from.last_name].filter(Boolean).join(' ') || null;

  // 1) Holatni yozamiz (ilova foydalanuvchisi bo'lsa bog'laymiz).
  let userId: string | null = null;
  try {
    const appUser = await prisma.user.findUnique({
      where: { telegramId: BigInt(from.id) },
      select: { id: true },
    });
    userId = appUser?.id ?? null;

    await prisma.channelJoinRequest.upsert({
      where: { chatId_userTelegramId: { chatId: BigInt(chatId), userTelegramId: BigInt(from.id) } },
      update: { status: 'PENDING', username: from.username ?? null, fullName, userId, decidedAt: null },
      create: {
        chatId: BigInt(chatId),
        userTelegramId: BigInt(from.id),
        userId,
        username: from.username ?? null,
        fullName,
        status: 'PENDING',
      },
    });
  } catch (error) {
    console.error('[Guard] join request persist failed:', error);
  }

  // 2) Foydalanuvchiga private DM — Mini App tugmasi bilan.
  try {
    await ctx.telegram.sendMessage(
      from.id,
      '🔐 <b>TURON VIP</b>\n\nQo‘shilish so‘rovingiz qabul qilindi. Tasdiqlash uchun '
        + 'ilovada ro‘yxatdan / loyallik dasturidan o‘ting — so‘ng avtomatik qabul qilinasiz.',
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '✅ Ro‘yxatdan o‘tish', web_app: { url: guardWebAppUrl() } }]],
        },
      },
    );
  } catch (error) {
    if (isForbidden(error)) {
      console.warn(`[Guard] user ${from.id} has blocked the bot (403). DM skipped.`);
      try {
        await prisma.channelJoinRequest.update({
          where: { chatId_userTelegramId: { chatId: BigInt(chatId), userTelegramId: BigInt(from.id) } },
          data: { status: 'DM_FAILED' },
        });
      } catch { /* ignore */ }
    } else {
      console.error('[Guard] join request DM failed:', error);
    }
  }
}

/**
 * Mini App signali — foydalanuvchining KUTILAYOTGAN join so'rov(lar)ini tasdiqlaydi.
 * Faqat o'z telegramId'si bo'yicha (API auth orqali) — xavfsiz.
 * Returns: tasdiqlangan so'rovlar soni.
 */
export async function approvePendingJoinRequests(
  telegram: Telegram,
  params: { userTelegramId: bigint; userId?: string | null },
): Promise<number> {
  const pending = await prisma.channelJoinRequest.findMany({
    where: { userTelegramId: params.userTelegramId, status: 'PENDING' },
    select: { id: true, chatId: true },
  });

  let approved = 0;
  for (const row of pending) {
    try {
      await telegram.approveChatJoinRequest(Number(row.chatId), Number(params.userTelegramId));
      await prisma.channelJoinRequest.update({
        where: { id: row.id },
        data: { status: 'APPROVED', decidedAt: new Date(), userId: params.userId ?? undefined },
      });
      approved += 1;
    } catch (error) {
      // Allaqachon qabul qilingan / so'rov eskirgan bo'lishi mumkin — log + davom.
      console.warn(`[Guard] approveChatJoinRequest failed (chat=${row.chatId}):`, error);
      // Telegram "request already processed" bersa — holatni APPROVED deb yopamiz.
      const desc = (error as { response?: { description?: string } })?.response?.description ?? '';
      if (/not found|already|HIDE_REQUESTER/i.test(desc)) {
        await prisma.channelJoinRequest.update({
          where: { id: row.id },
          data: { status: 'APPROVED', decidedAt: new Date() },
        }).catch(() => {});
      }
    }
  }
  return approved;
}
