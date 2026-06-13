# @turon/socket-gateway

Realtime gateway for couriers, customers, and admins.

## Architecture

- **Transport:** Socket.io v4 (websocket + polling fallback)
- **Auth:** JWT handshake — same secret as the Fastify backend so existing
  `turon_token` cookies work directly. No re-issue needed.
- **Scale:** `@socket.io/redis-adapter` for multi-instance fan-out.
- **GPS buffer:** Live coords in Redis (TTL 60s), batched DB write every 20s
  via backend REST (`PATCH /courier/order/:id/location`).
- **Stateless:** No business logic — just transport. The Fastify backend
  remains the source of truth.

## Events

### Courier → Server

| event | payload |
|---|---|
| `courier:location` | `{ lat, lng, heading, speed, accuracy, ts, orderId? }` |

### Customer/Admin → Server

| event | payload |
|---|---|
| `order:subscribe` | `orderId: string` |
| `order:unsubscribe` | `orderId: string` |
| `tracking:fetch` | `(courierId, ack)` — REST catch-up |

### Server → Client

| event | recipients | payload |
|---|---|---|
| `assignment:new` | courier user | `{ orderId, orderNumber? }` |
| `assignment:cancelled` | courier user | `{ orderId }` |
| `order:updated` | order room + admins | `{ orderId }` |
| `tracking:position` | order room + admins | `LocationSample` |

## Rooms

- `user:<userId>` — direct messages
- `role:COURIER` / `role:ADMIN` — role broadcasts
- `order:<orderId>` — per-order tracking feed

## Deploy

1. Set env (see `.env.example`). `JWT_SECRET` **must** match the backend.
2. `pnpm --filter @turon/socket-gateway build`
3. `pnpm --filter @turon/socket-gateway start`

For Vercel/Next.js (serverless) — this service is intentionally **separate**
because serverless can't hold persistent WS connections. Deploy alongside
the Fastify backend (AWS, Fly.io, Railway, etc.) and point
`NEXT_PUBLIC_SOCKET_URL` at it.
