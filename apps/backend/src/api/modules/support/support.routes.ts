import { FastifyInstance } from 'fastify';
import {
  getSupportThread,
  postSupportMessage,
  getCourierThreads,
  getCourierThread,
  editSupportMessage,
  deleteSupportMessage,
} from './support.controller.js';
import {
  getAdminSupportThread,
  sendAdminSupportMessage,
  markAdminSupportRead,
} from './admin-support.controller.js';
import {
  AdminSupportSendSchema,
  SupportMessageSchema,
  SupportMessageIdParamSchema,
  SupportThreadQuerySchema,
  ThreadIdParamSchema,
} from '../../utils/schemas.js';
import { UserRoleEnum } from '@turon/shared';

export default async function supportRoutes(fastify: FastifyInstance) {
  fastify.get('/thread', {
    schema: {
      querystring: SupportThreadQuerySchema,
    },
  }, getSupportThread);

  fastify.post('/messages', {
    schema: {
      body: SupportMessageSchema,
    },
  }, postSupportMessage);

  // O'z admin-chat xabarini tahrirlash / o'chirish
  fastify.patch('/messages/:messageId', {
    schema: { params: SupportMessageIdParamSchema },
  }, editSupportMessage);
  fastify.delete('/messages/:messageId', {
    schema: { params: SupportMessageIdParamSchema },
  }, deleteSupportMessage);

  // ── Kuryer chatlar (xabarlar markazi #5) — KURYER bo'yicha guruhlangan ──────
  fastify.get('/courier-threads', getCourierThreads);
  fastify.get('/courier-threads/:courierId/messages', getCourierThread);

  // ── Admin support endpoints ─────────────────────────────────────────────
  // Lets admin read/reply to support threads from the panel.
  fastify.register(async (admin) => {
    admin.addHook('preHandler', admin.authorize([UserRoleEnum.ADMIN]));

    admin.get('/admin/:threadId/messages', {
      schema: { params: ThreadIdParamSchema },
    }, getAdminSupportThread);

    admin.post('/admin/:threadId/messages', {
      schema: { params: ThreadIdParamSchema, body: AdminSupportSendSchema },
    }, sendAdminSupportMessage);

    admin.post('/admin/:threadId/read', {
      schema: { params: ThreadIdParamSchema },
    }, markAdminSupportRead);
  });
}
