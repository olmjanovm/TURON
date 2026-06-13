# @turon/socket-gateway

Realtime gateway TURON kuryer/mijoz/admin panellariga.

> **Deploy qilish**: [DEPLOY.md](./DEPLOY.md) — Fly.io / Railway / AWS EC2

## Tezkor start (lokal dev)

```bash
# Redis bilan birga:
cd apps/socket-gateway
docker compose up --build

# Yoki manual:
pnpm install
pnpm dev   # tsx watch
```

Health: http://localhost:3030/health

## Arxitektura

- **Transport**: Socket.io v4 (WebSocket + polling fallback)
- **Auth**: JWT handshake — backend bilan **bir xil** `JWT_SECRET`. Cookie (`turon_token`), `auth.token`, yoki query'dan o'qiydi
- **Scale**: `@socket.io/redis-adapter` — `REDIS_URL` o'rnatilgan bo'lsa multi-instance
- **GPS buffer**: Live coords Redis (TTL 60s) + batched DB write har 20s (eski miniapp location-write-buffer pattern). Auth: gateway service JWT imzolaydi (60s TTL)
- **Stateless**: Biznes-logika YO'Q — faqat transport. Source of truth Fastify backendda
- **Backend → Gateway events**: HTTP webhook (X-Webhook-Secret) **YOKI** Redis pub/sub kanallari (`turon:assignment-new`, `turon:assignment-cancelled`, `turon:order-updated`, `turon:emit`)
- **Graceful shutdown**: SIGTERM/SIGINT'da socketlar yopiladi, Redis ulanish flush qilinadi

## Socket hodisalari

### Client → Server

| event | payload | who |
|---|---|---|
| `courier:location` | `{ lat, lng, heading, speed, accuracy, ts, orderId? }` | COURIER |
| `order:subscribe` | `orderId: string` | CUSTOMER / ADMIN |
| `order:unsubscribe` | `orderId: string` | CUSTOMER / ADMIN |
| `tracking:fetch` | `(courierId, ack)` — REST catch-up | CUSTOMER / ADMIN |

### Server → Client

| event | room | payload |
|---|---|---|
| `assignment:new` | `user:<courierId>` | `{ orderId, orderNumber? }` |
| `assignment:cancelled` | `user:<courierId>` | `{ orderId }` |
| `order:updated` | `order:<orderId>` + `role:ADMIN` | `{ orderId }` |
| `tracking:position` | `order:<orderId>` + `role:ADMIN` | `LocationSample` |

## Room sxemasi

- `user:<userId>` — bitta foydalanuvchi (DM)
- `role:COURIER` / `role:ADMIN` — rol broadcast
- `order:<orderId>` — per-order tracking (mijoz + biriktirilgan kuryer + admin)

## HTTP endpoints

| route | auth | maqsad |
|---|---|---|
| `GET /health` | yo'q | uptime check |
| `POST /webhook/assignment-new` | X-Webhook-Secret | backend → gateway: yangi assignment |
| `POST /webhook/assignment-cancelled` | X-Webhook-Secret | backend → gateway: bekor qilingan |
| `POST /webhook/order-updated` | X-Webhook-Secret | backend → gateway: buyurtma yangilandi |
| `POST /webhook/emit` | X-Webhook-Secret | generic: `{ userId, event, payload }` |

## Env

To'liq ro'yxat: `.env.example`. Majburiy: **`JWT_SECRET`** (backenddan).
