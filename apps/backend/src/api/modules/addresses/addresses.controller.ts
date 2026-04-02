import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../lib/prisma.js';
import { AuditService } from '../../../services/audit.service.js';

function serializeAddress(address: any) {
  return {
    id: address.id,
    label: address.title || 'Boshqa',
    title: address.title || 'Boshqa',
    addressText: address.address,
    address: address.address,
    note: address.note || '',
    latitude: Number(address.latitude),
    longitude: Number(address.longitude),
    isDefault: false,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
  };
}

export async function getAddresses(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const addresses = await prisma.deliveryAddress.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' }
  });

  return reply.send(addresses.map(serializeAddress));
}

export async function handleCreateAddress(
  request: FastifyRequest<{ Body: any }>,
  reply: FastifyReply
) {
  const user = request.user as any;
  const data = request.body as any;
  const address = await prisma.deliveryAddress.create({
    data: {
      userId: user.id,
      title: data.title || 'Manzil',
      address: data.address,
      note: data.note,
      latitude: data.latitude,
      longitude: data.longitude
    }
  });

  await AuditService.record({
    userId: user.id,
    action: 'CREATE_ADDRESS',
    entity: 'DeliveryAddress',
    entityId: address.id,
    newValue: serializeAddress(address)
  });

  return reply.status(201).send(serializeAddress(address));
}

export async function handleUpdateAddress(
  request: FastifyRequest<{ Params: { id: string }; Body: any }>,
  reply: FastifyReply
) {
  const user = request.user as any;
  const { id } = request.params;
  const data = request.body as any;

  const existingAddress = await prisma.deliveryAddress.findUnique({
    where: { id }
  });

  if (!existingAddress || existingAddress.userId !== user.id) {
    return reply.status(404).send({ error: 'Manzil topilmadi' });
  }

  const updatedAddress = await prisma.deliveryAddress.update({
    where: { id },
    data: {
      title: data.title || 'Manzil',
      address: data.address,
      note: data.note,
      latitude: data.latitude,
      longitude: data.longitude,
    }
  });

  await AuditService.record({
    userId: user.id,
    action: 'UPDATE_ADDRESS',
    entity: 'DeliveryAddress',
    entityId: updatedAddress.id,
    oldValue: serializeAddress(existingAddress),
    newValue: serializeAddress(updatedAddress)
  });

  return reply.send(serializeAddress(updatedAddress));
}

export async function handleDeleteAddress(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = request.user as any;
  const { id } = request.params;

  const address = await prisma.deliveryAddress.findUnique({
    where: { id }
  });

  if (!address || address.userId !== user.id) {
    return reply.status(403).send({ error: 'Ruxsat etilmadi' });
  }

  try {
    await prisma.deliveryAddress.delete({ where: { id } });
  } catch (error: any) {
    if (error?.code === 'P2003') {
      return reply.status(409).send({ error: 'Bu manzil buyurtmalarda ishlatilgan va hozircha o\'chirib bo\'lmaydi' });
    }

    throw error;
  }

  await AuditService.record({
    userId: user.id,
    action: 'DELETE_ADDRESS',
    entity: 'DeliveryAddress',
    entityId: id,
    oldValue: serializeAddress(address)
  });

  return reply.status(204).send();
}
