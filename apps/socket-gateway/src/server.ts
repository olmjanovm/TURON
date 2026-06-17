import Fastify, { type FastifyRequest, type FastifyReply } from 'fastify';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis as RedisClient } from 'ioredis';
import { env } from './config.js';
import { verifyHandshake, Rooms, type SocketIdentity, type AppRole } from './auth.js';
import { recordLive, getLive, type LocationSample } from './location-buffer.js';

// ── Bootstrap Fastify ───────────────────────────────────────────────────
const fastify = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? 'info' },
  trustProxy: true,
});

fastify.get('/health', async () => ({
  ok: true,
  service: 'socket-gateway',
  version: '1.0.0',
  ts: Date.now(),
}));

// ── Redis (optional — horizontal scale + cross-service pub/sub) ─────────
let pubClient: RedisClient | null = null;
let subClient: RedisClient | null = null;
let backendBus: RedisClient | null = null;

if (env.REDIS_URL) {
  pubClient = new RedisClient(env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: true });
  subClient = pubClient.duplicate();
  backendBus = pubClient.duplicate();
  pubClient.on('error', (e) => fastify.log.error({ err: e }, 'redis pub error'));
  subClient.on('error', (e) => fastify.log.error({ err: e }, 'redis sub error'));
  backendBus.on('error', (e) => fastify.log.error({ err: e }, 'redis bus error'));
  fastify.log.info('[socket-gateway] Redis adapter enabled');
} else {
  fastify.log.warn('[socket-gateway] REDIS_URL not set — running single-instance (no Redis pub/sub)');
}

// ── Socket.io ──────────────────────────────────────────────────────────
const io = new SocketServer(fastify.server, {
  path: '/socket.io',
  cors: {
    origin: env.CORS_ORIGINS,
    credentials: true,
  },
  pingInterval: 25_000,
  pingTimeout: 20_000,
  maxHttpBufferSize: 1e5, // 100 KB — kichik GPS payloadlari uchun yetarli
});

if (pubClient && subClient) {
  io.adapter(createAdapter(pubClient, subClient));
}

// ── Auth middleware ────────────────────────────────────────────────────
io.use((socket, next) => {
  const identity = verifyHandshake(socket);
  if (!identity) return next(new Error('Unauthorized'));
  (socket.data as { identity: SocketIdentity }).identity = identity;
  next();
});

// ── Per-connection wiring ──────────────────────────────────────────────
io.on('connection', (socket) => {
  const identity = (socket.data as { identity: SocketIdentity }).identity;
  socket.join(Rooms.user(identity.userId));
  socket.join(Rooms.role(identity.role));
  fastify.log.info(`[socket] connect ${identity.role}:${identity.userId} sid=${socket.id}`);

  // ── Courier emits live GPS ───────────────────────────────────────────
  socket.on('courier:location', async (payload: unknown) => {
    if (identity.role !== 'COURIER') return;
    const p = payload as Partial<LocationSample> & { orderId?: string | null };
    if (typeof p?.lat !== 'number' || typeof p?.lng !== 'number') return;

    const sample: LocationSample = {
      courierId: identity.userId,
      orderId: typeof p.orderId === 'string' ? p.orderId : null,
      lat: p.lat,
      lng: p.lng,
      heading: typeof p.heading === 'number' ? p.heading : null,
      speed: typeof p.speed === 'number' ? p.speed : null,
      accuracy: typeof p.accuracy === 'number' ? p.accuracy : 0,
      ts: typeof p.ts === 'number' ? p.ts : Date.now(),
    };

    await recordLive(pubClient, sample);

    if (sample.orderId) {
      io.to(Rooms.order(sample.orderId)).emit('tracking:position', sample);
    }
    io.to(Rooms.role('ADMIN')).emit('tracking:position', sample);
  });

  // ── Subscribe/unsubscribe order tracking room ────────────────────────
  socket.on('order:subscribe', (orderId: string) => {
    if (typeof orderId !== 'string' || !orderId) return;
    socket.join(Rooms.order(orderId));
  });

  socket.on('order:unsubscribe', (orderId: string) => {
    if (typeof orderId !== 'string' || !orderId) return;
    socket.leave(Rooms.order(orderId));
  });

  // ── REST catch-up: last known live coord ─────────────────────────────
  socket.on('tracking:fetch', async (courierId: string, ack?: (sample: LocationSample | null) => void) => {
    if (typeof ack !== 'function') return;
    const sample = await getLive(pubClient, courierId);
    ack(sample);
  });

  socket.on('disconnect', (reason) => {
    fastify.log.info(`[socket] disconnect ${identity.role}:${identity.userId} reason=${reason}`);
  });
});

// ── Emit helpers ───────────────────────────────────────────────────────
export function emitAssignmentNew(courierId: string, payload: { orderId: string; orderNumber?: string }) {
  io.to(Rooms.user(courierId)).emit('assignment:new', payload);
}
export function emitAssignmentCancelled(courierId: string, payload: { orderId: string }) {
  io.to(Rooms.user(courierId)).emit('assignment:cancelled', payload);
}
export function emitOrderUpdated(orderId: string, payload: { orderId: string }) {
  io.to(Rooms.order(orderId)).emit('order:updated', payload);
  io.to(Rooms.role('ADMIN')).emit('order:updated', payload);
}
export function emitToUser(userId: string, event: string, payload: unknown) {
  io.to(Rooms.user(userId)).emit(event, payload);
}

/**
 * Chat delivery is recipient-targeted, not room-based.
 *
 * The gateway has no DB, so it cannot verify order participation. The backend
 * (which does) resolves the exact recipients respecting admin `targetRole`
 * privacy, then tells us which `user:<id>` rooms + `role:<role>` rooms to emit
 * to. This keeps admin→courier messages from leaking to the customer (and vice
 * versa) without any DB lookup here. On connect every socket already auto-joins
 * its own `user:` and `role:` rooms, so no explicit chat-join is needed.
 */
interface ChatTarget {
  userIds?: string[];
  roles?: AppRole[];
}

function emitToTarget(target: ChatTarget, event: string, payload: unknown) {
  const seen = new Set<string>();
  for (const uid of target.userIds ?? []) {
    if (!uid || seen.has(`u:${uid}`)) continue;
    seen.add(`u:${uid}`);
    io.to(Rooms.user(uid)).emit(event, payload);
  }
  for (const role of target.roles ?? []) {
    if (!role || seen.has(`r:${role}`)) continue;
    seen.add(`r:${role}`);
    io.to(Rooms.role(role)).emit(event, payload);
  }
}

export function emitChatMessage(target: ChatTarget, message: unknown) {
  emitToTarget(target, 'chat:message', message);
}
export function emitChatRead(target: ChatTarget, read: unknown) {
  emitToTarget(target, 'chat:read', read);
}

// ── Webhook endpoints — backend (Fastify) ushbu yo'l orqali event tashlaydi
//    Auth: X-Webhook-Secret header. Bo'sh secret bo'lsa endpoints o'chirilgan. ─
async function requireWebhookSecret(req: FastifyRequest, reply: FastifyReply) {
  if (!env.WEBHOOK_SECRET) {
    return reply.code(503).send({ error: 'Webhook disabled (WEBHOOK_SECRET not set)' });
  }
  const provided = req.headers['x-webhook-secret'];
  if (provided !== env.WEBHOOK_SECRET) {
    return reply.code(401).send({ error: 'Invalid webhook secret' });
  }
}

interface WebhookAssignmentNew {
  courierId: string;
  orderId: string;
  orderNumber?: string;
}
interface WebhookAssignmentCancelled {
  courierId: string;
  orderId: string;
}
interface WebhookOrderUpdated {
  orderId: string;
}
interface WebhookGeneric {
  userId: string;
  event: string;
  payload?: unknown;
}
interface WebhookChat {
  userIds?: string[];
  roles?: AppRole[];
  message?: unknown;
  read?: unknown;
}

fastify.post('/webhook/assignment-new', { preHandler: requireWebhookSecret }, async (req, reply) => {
  const b = req.body as WebhookAssignmentNew;
  if (!b?.courierId || !b?.orderId) return reply.code(400).send({ error: 'courierId, orderId required' });
  emitAssignmentNew(b.courierId, { orderId: b.orderId, orderNumber: b.orderNumber });
  return reply.send({ ok: true });
});

fastify.post('/webhook/assignment-cancelled', { preHandler: requireWebhookSecret }, async (req, reply) => {
  const b = req.body as WebhookAssignmentCancelled;
  if (!b?.courierId || !b?.orderId) return reply.code(400).send({ error: 'courierId, orderId required' });
  emitAssignmentCancelled(b.courierId, { orderId: b.orderId });
  return reply.send({ ok: true });
});

fastify.post('/webhook/order-updated', { preHandler: requireWebhookSecret }, async (req, reply) => {
  const b = req.body as WebhookOrderUpdated;
  if (!b?.orderId) return reply.code(400).send({ error: 'orderId required' });
  emitOrderUpdated(b.orderId, { orderId: b.orderId });
  return reply.send({ ok: true });
});

fastify.post('/webhook/emit', { preHandler: requireWebhookSecret }, async (req, reply) => {
  const b = req.body as WebhookGeneric;
  if (!b?.userId || !b?.event) return reply.code(400).send({ error: 'userId, event required' });
  emitToUser(b.userId, b.event, b.payload ?? {});
  return reply.send({ ok: true });
});

fastify.post('/webhook/chat-message', { preHandler: requireWebhookSecret }, async (req, reply) => {
  const b = req.body as WebhookChat;
  if (!b?.message) return reply.code(400).send({ error: 'message required' });
  emitChatMessage({ userIds: b.userIds, roles: b.roles }, b.message);
  return reply.send({ ok: true });
});

fastify.post('/webhook/chat-read', { preHandler: requireWebhookSecret }, async (req, reply) => {
  const b = req.body as WebhookChat;
  if (!b?.read) return reply.code(400).send({ error: 'read required' });
  emitChatRead({ userIds: b.userIds, roles: b.roles }, b.read);
  return reply.send({ ok: true });
});

// ── Redis pub/sub — webhook'ga alternativ kanal ────────────────────────
// Backend Redis'ga `turon:event:*` channellariga JSON yozsa, biz ularni
// tegishli room'larga forward qilamiz. Bu webhook'dan tezroq va tarmoq
// hop'i kam (ikkala servis bir Redis'da bo'lsa).
if (backendBus) {
  void backendBus.subscribe(
    'turon:assignment-new',
    'turon:assignment-cancelled',
    'turon:order-updated',
    'turon:emit',
    'turon:chat-message',
    'turon:chat-read',
  );
  backendBus.on('message', (channel, raw) => {
    try {
      const data = JSON.parse(raw);
      if (channel === 'turon:assignment-new' && data.courierId && data.orderId) {
        emitAssignmentNew(data.courierId, { orderId: data.orderId, orderNumber: data.orderNumber });
      } else if (channel === 'turon:assignment-cancelled' && data.courierId && data.orderId) {
        emitAssignmentCancelled(data.courierId, { orderId: data.orderId });
      } else if (channel === 'turon:order-updated' && data.orderId) {
        emitOrderUpdated(data.orderId, { orderId: data.orderId });
      } else if (channel === 'turon:emit' && data.userId && data.event) {
        emitToUser(data.userId, data.event, data.payload);
      } else if (channel === 'turon:chat-message' && data.message) {
        emitChatMessage({ userIds: data.userIds, roles: data.roles }, data.message);
      } else if (channel === 'turon:chat-read' && data.read) {
        emitChatRead({ userIds: data.userIds, roles: data.roles }, data.read);
      }
    } catch (e) {
      fastify.log.warn({ err: e, channel, raw }, 'Failed to parse redis message');
    }
  });
}

// ── Graceful shutdown ──────────────────────────────────────────────────
async function shutdown(signal: string) {
  fastify.log.info(`[shutdown] ${signal} received — closing connections`);
  try {
    io.disconnectSockets(true);
    await new Promise<void>((resolve) => io.close(() => resolve()));
    await fastify.close();
    await Promise.all([
      pubClient?.quit(),
      subClient?.quit(),
      backendBus?.quit(),
    ]);
    fastify.log.info('[shutdown] clean exit');
    process.exit(0);
  } catch (err) {
    fastify.log.error({ err }, '[shutdown] error');
    process.exit(1);
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

// ── Start ──────────────────────────────────────────────────────────────
await fastify.listen({ port: env.PORT, host: env.HOST });
fastify.log.info(`socket-gateway listening on http://${env.HOST}:${env.PORT}`);
