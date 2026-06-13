import Fastify from 'fastify';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis as RedisClient } from 'ioredis';
import { env } from './config.js';
import { verifyHandshake, Rooms, type SocketIdentity } from './auth.js';
import { recordLive, getLive, type LocationSample } from './location-buffer.js';

// ── Bootstrap Fastify (used for health checks + future REST hooks) ──────
const fastify = Fastify({ logger: { level: 'info' } });

fastify.get('/health', async () => ({
  ok: true,
  service: 'socket-gateway',
  ts: Date.now(),
}));

// ── Redis (optional — horizontal scale) ────────────────────────────────
let pubClient: RedisClient | null = null;
let subClient: RedisClient | null = null;

if (env.REDIS_URL) {
  pubClient = new RedisClient(env.REDIS_URL);
  subClient = pubClient.duplicate();
  fastify.log.info('[socket-gateway] Redis adapter enabled');
} else {
  fastify.log.warn('[socket-gateway] REDIS_URL not set — running single-instance');
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

  // Default rooms by role + user
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

    // Fan-out to subscribers of this order (customer + admin watchers)
    if (sample.orderId) {
      io.to(Rooms.order(sample.orderId)).emit('tracking:position', sample);
    }
    io.to(Rooms.role('ADMIN')).emit('tracking:position', sample);
  });

  // ── Subscribe to an order's tracking feed (customer / admin) ─────────
  socket.on('order:subscribe', (orderId: string) => {
    if (typeof orderId !== 'string' || !orderId) return;
    socket.join(Rooms.order(orderId));
  });

  socket.on('order:unsubscribe', (orderId: string) => {
    if (typeof orderId !== 'string' || !orderId) return;
    socket.leave(Rooms.order(orderId));
  });

  // ── REST catch-up: return last known live coord ──────────────────────
  socket.on('tracking:fetch', async (courierId: string, ack?: (sample: LocationSample | null) => void) => {
    if (typeof ack !== 'function') return;
    const sample = await getLive(pubClient, courierId);
    ack(sample);
  });

  socket.on('disconnect', (reason) => {
    fastify.log.info(`[socket] disconnect ${identity.role}:${identity.userId} reason=${reason}`);
  });
});

// ── Public helpers — usable by Fastify routes if mounted here ──────────
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

// ── Start ──────────────────────────────────────────────────────────────
await fastify.listen({ port: env.PORT, host: env.HOST });
fastify.log.info(`socket-gateway listening on :${env.PORT}`);
