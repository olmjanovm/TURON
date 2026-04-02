import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../lib/prisma.js';
import { AuditService } from '../../../services/audit.service.js';
import {
  evaluatePromoForSubtotal,
  serializePromoForAdmin,
} from './promo-helpers.js';

export async function validatePromoCode(
  request: FastifyRequest<{ Body: { code: string; subtotal: number } }>,
  reply: FastifyReply
) {
  const { code, subtotal } = request.body;
  const promo = await prisma.promoCode.findFirst({
    where: {
      code: code.toUpperCase(),
    },
  });

  return reply.send(evaluatePromoForSubtotal(promo, subtotal));
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
