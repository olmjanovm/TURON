import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../lib/prisma.js';
import { AuditService } from '../../../services/audit.service.js';
import {
  evaluatePromoForSubtotal,
  serializePromoForAdmin,
  normalizePromoCode,
  suggestPromoCode,
} from './promo-helpers.js';

export async function validatePromoCode(
  request: FastifyRequest<{ Body: { code: string; subtotal?: number; userId?: string } }>,
  reply: FastifyReply
) {
  const { userId } = request.body;
  const subtotal = request.body.subtotal ?? 0;
  const code = normalizePromoCode(request.body.code); // bo'shliq/registr xatosini yo'q qiladi

  const promo = await prisma.promoCode.findFirst({ where: { code } });

  // Build user context for target/first-order checks when userId provided
  let previousOrderCount: number | undefined;
  if (userId && promo) {
    previousOrderCount = await prisma.order.count({
      where: { userId, status: { not: 'CANCELLED' as any } },
    });
  }

  const result = evaluatePromoForSubtotal(promo, subtotal, { userId, previousOrderCount }) as
    ReturnType<typeof evaluatePromoForSubtotal> & { suggestion?: string | null };

  // ── "Did you mean?" — noto'g'ri/muddati tugagan/topilmadi bo'lsa, hozir amal
  //    qiladigan eng yaqin promokodni taklif qil ("SALOM20" → "SALOM30").
  if (!result.isValid) {
    const now = new Date();
    const usable = await prisma.promoCode.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        AND: [{ OR: [{ targetUserId: null }, ...(userId ? [{ targetUserId: userId }] : [])] }],
      },
      select: { code: true, usageLimit: true, timesUsed: true, isFirstOrderOnly: true },
      take: 200,
    });
    const candidateCodes = usable
      .filter((p) => !p.usageLimit || p.timesUsed < p.usageLimit)
      .filter((p) => !(p.isFirstOrderOnly && (previousOrderCount ?? 0) > 0))
      .map((p) => p.code);

    const suggestion = suggestPromoCode(code, candidateCodes);
    if (suggestion) {
      result.suggestion = suggestion;
      result.message = promo
        ? `${result.message}. "${suggestion}" ni sinab ko'ring`
        : `"${code}" topilmadi. "${suggestion}" ni sinab ko'ring`;
    }
  }

  return reply.send(result);
}

export async function getAllPromos(request: FastifyRequest, reply: FastifyReply) {
  const promos = await prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return reply.send(promos.map(serializePromoForAdmin));
}

export async function handleCreatePromo(
  request: FastifyRequest<{ Body: any }>,
  reply: FastifyReply
) {
  const admin = request.user as any;
  const data = request.body as any;
  const normalizedCode = data.code.trim().toUpperCase();

  const existingPromo = await prisma.promoCode.findUnique({
    where: { code: normalizedCode },
  });

  if (existingPromo) {
    return reply.status(409).send({ error: 'Bu promokod allaqachon mavjud' });
  }

  const promo = await prisma.promoCode.create({
    data: {
      code: normalizedCode,
      title: data.title?.trim() || normalizedCode,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderValue: data.minOrderValue,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      usageLimit: data.usageLimit > 0 ? data.usageLimit : null,
      isActive: data.isActive ?? true,
      isFirstOrderOnly: data.isFirstOrderOnly ?? false,
      targetUserId: data.targetUserId ?? null,
    }
  });

  const serializedPromo = serializePromoForAdmin(promo);

  await AuditService.record({
    userId: admin.id,
    actorRole: admin.role,
    action: 'CREATE_PROMO',
    entity: 'PromoCode',
    entityId: promo.id,
    newValue: serializedPromo
  });

  return reply.status(201).send(serializedPromo);
}

export async function handleDeletePromo(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const admin = request.user as any;

  const promo = await prisma.promoCode.findUnique({
    where: { id: request.params.id },
  });

  if (!promo) {
    return reply.status(404).send({ error: 'Promokod topilmadi' });
  }

  await prisma.promoCode.delete({
    where: { id: request.params.id },
  });

  await AuditService.record({
    userId: admin.id,
    actorRole: admin.role,
    action: 'DELETE_PROMO',
    entity: 'PromoCode',
    entityId: promo.id,
    oldValue: serializePromoForAdmin(promo),
  });

  return reply.status(200).send({ success: true });
}

export async function handleUpdatePromo(
  request: FastifyRequest<{ Params: { id: string }; Body: any }>,
  reply: FastifyReply,
) {
  const admin = request.user as any;
  const data = request.body as any;
  const normalizedCode = data.code.trim().toUpperCase();

  const existingPromo = await prisma.promoCode.findUnique({
    where: { id: request.params.id },
  });

  if (!existingPromo) {
    return reply.status(404).send({ error: 'Promokod topilmadi' });
  }

  const duplicatePromo = await prisma.promoCode.findFirst({
    where: {
      code: normalizedCode,
      id: {
        not: request.params.id,
      },
    },
  });

  if (duplicatePromo) {
    return reply.status(409).send({ error: 'Bu promokod allaqachon mavjud' });
  }

  const updatedPromo = await prisma.promoCode.update({
    where: { id: request.params.id },
    data: {
      code: normalizedCode,
      title: data.title?.trim() || normalizedCode,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderValue: data.minOrderValue,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      usageLimit: data.usageLimit > 0 ? data.usageLimit : null,
      isActive: data.isActive ?? existingPromo.isActive,
      isFirstOrderOnly: data.isFirstOrderOnly ?? existingPromo.isFirstOrderOnly,
      targetUserId: data.targetUserId !== undefined ? data.targetUserId : existingPromo.targetUserId,
    },
  });

  const serializedOldPromo = serializePromoForAdmin(existingPromo);
  const serializedUpdatedPromo = serializePromoForAdmin(updatedPromo);

  await AuditService.record({
    userId: admin.id,
    actorRole: admin.role,
    action: 'UPDATE_PROMO',
    entity: 'PromoCode',
    entityId: updatedPromo.id,
    oldValue: serializedOldPromo,
    newValue: serializedUpdatedPromo,
  });

  return reply.send(serializedUpdatedPromo);
}
