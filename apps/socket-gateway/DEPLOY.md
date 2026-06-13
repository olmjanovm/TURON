# Socket Gateway — Production Deploy Qo'llanmasi

## Arxitektura

```
                                ┌─────────────────┐
        Telegram WebApp ───────►│  Vercel (Next)  │
        (apps/web)              │  HTTPS proxy    │
                                └──────┬──────────┘
                                       │ /api/* (cookie)
                                       ▼
                                ┌─────────────────┐
              ┌────WS / wss────►│  Fastify (AWS)  │
              │                  │  Postgres + JWT │
              │                  └──────┬──────────┘
              │                         │ webhook / Redis pub
              ▼                         ▼
    ┌──────────────────┐        ┌───────────────────┐
    │ Telegram WebApp  │        │ Socket Gateway    │
    │ (kuryer GPS, RT) │◄──WS───┤  (Fly/AWS/Railway)│
    └──────────────────┘        └───────┬───────────┘
                                        │ Redis (ixtiyoriy)
                                        ▼
                                  ┌───────────┐
                                  │ Redis     │
                                  └───────────┘
```

Gateway **alohida servis** sifatida ishlaydi — Vercel serverlessda emas, chunki WebSocket persistent ulanish kerak.

---

## VARIANT 1 — Fly.io (eng oson, $0 Hobby tier)

```bash
# 1. Fly CLI o'rnatish (https://fly.io/docs/hands-on/install-flyctl/)
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Loyihaga kirish va app yaratish
cd apps/socket-gateway
fly launch --copy-config --no-deploy
# (Region: fra (Frankfurt) yoki sin (Singapur — Toshkentga yaqin))

# 4. Sekretlarni o'rnatish
fly secrets set \
  JWT_SECRET="<backend bilan bir xil sekret>" \
  WEBHOOK_SECRET="$(openssl rand -hex 32)" \
  BACKEND_URL="https://turonkafe.duckdns.org"

# Ixtiyoriy: Redis qo'shish (kunlik trafik katta bo'lsa)
fly redis create
fly secrets set REDIS_URL="<fly redis URL>"

# 5. Deploy
fly deploy

# 6. URL'ni olish
fly status
# ⇒ Hostname: turon-socket.fly.dev
```

**Yakuniy URL**: `https://turon-socket.fly.dev`
**WebSocket URL**: `wss://turon-socket.fly.dev` (https → wss avto)

---

## VARIANT 2 — Railway

```bash
# 1. railway.app'da signup
# 2. New Project → Deploy from GitHub repo
# 3. Root Directory: apps/socket-gateway
# 4. Variables tabda env qo'shish (JWT_SECRET, WEBHOOK_SECRET, BACKEND_URL)
# 5. Settings → Networking → Generate Domain
```

---

## VARIANT 3 — AWS EC2 (Fastify backend yonida)

Agar backend allaqachon AWS EC2'da ishlayotgan bo'lsa, xuddi shu serverga
gateway'ni qo'yish eng arzon (yangi resurs kerak emas):

```bash
# EC2'da
git clone https://github.com/umid-weeb/TURON.git
cd TURON
corepack enable && corepack prepare pnpm@10 --activate
pnpm install --filter @turon/socket-gateway... --filter @turon/shared
pnpm --filter @turon/socket-gateway build

# Env fayl
cat > apps/socket-gateway/.env <<EOF
JWT_SECRET=<backend bilan bir xil>
WEBHOOK_SECRET=$(openssl rand -hex 32)
BACKEND_URL=http://localhost:3000   # Fastify local
CORS_ORIGINS=https://turon-miniapp.vercel.app
PORT=3030
EOF

# systemd service
sudo tee /etc/systemd/system/turon-socket.service <<EOF
[Unit]
Description=TURON Socket Gateway
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/TURON/apps/socket-gateway
EnvironmentFile=/home/ubuntu/TURON/apps/socket-gateway/.env
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now turon-socket
sudo systemctl status turon-socket
```

Nginx reverse proxy (HTTPS + WebSocket upgrade):

```nginx
server {
    listen 443 ssl http2;
    server_name socket.turonkafe.duckdns.org;
    # SSL config (Let's Encrypt) ...

    location / {
        proxy_pass http://127.0.0.1:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;  # WS uchun uzoq
    }
}
```

---

## Vercel'da web app uchun

```bash
# Vercel → Project Settings → Environment Variables
NEXT_PUBLIC_SOCKET_URL=https://turon-socket.fly.dev
```

Redeploy → web app socket'ga ulanadi.

Testlash:
```js
// Brauzer console'da:
window.location.origin === 'https://turon-miniapp.vercel.app'
// Network tab → /socket.io/ → Status 101 Switching Protocols ✓
```

---

## Backend integratsiyasi (Fastify)

Backend kuryerga buyurtma assign qilganda gateway'ga xabar yuborishi kerak.
Ikkita variant:

### Variant A — HTTP Webhook (oddiy)

`apps/backend/src/services/socket-events.service.ts` yaratish:

```ts
const GATEWAY_URL = process.env.SOCKET_GATEWAY_URL ?? 'http://localhost:3030';
const SECRET = process.env.SOCKET_WEBHOOK_SECRET ?? '';

async function post(path: string, body: unknown) {
  if (!SECRET) return; // graceful no-op
  await fetch(`${GATEWAY_URL}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-secret': SECRET,
    },
    body: JSON.stringify(body),
  }).catch((e) => console.warn('[socket-webhook] failed', e));
}

export const SocketEvents = {
  assignmentNew: (courierId: string, orderId: string, orderNumber?: string) =>
    post('/webhook/assignment-new', { courierId, orderId, orderNumber }),
  assignmentCancelled: (courierId: string, orderId: string) =>
    post('/webhook/assignment-cancelled', { courierId, orderId }),
  orderUpdated: (orderId: string) =>
    post('/webhook/order-updated', { orderId }),
};
```

Backend'da `assignCourier` controllerida:

```ts
await prisma.courierAssignment.create({ ... });
void SocketEvents.assignmentNew(courier.id, order.id, order.orderNumber);
```

Backend env qo'shish:
```
SOCKET_GATEWAY_URL=https://turon-socket.fly.dev
SOCKET_WEBHOOK_SECRET=<gateway WEBHOOK_SECRET bilan bir xil>
```

### Variant B — Redis pub/sub (Redis bor bo'lsa tezroq)

```ts
import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL!);

export const SocketEvents = {
  assignmentNew: (courierId: string, orderId: string, orderNumber?: string) =>
    redis.publish('turon:assignment-new', JSON.stringify({ courierId, orderId, orderNumber })),
  // ...
};
```

Gateway avtomatik tinglaydi.

---

## Tekshirish

```bash
# 1. Health
curl https://turon-socket.fly.dev/health
# ⇒ {"ok":true,"service":"socket-gateway",...}

# 2. WS handshake (wscat)
npm i -g wscat
wscat -c 'wss://turon-socket.fly.dev/socket.io/?EIO=4&transport=websocket' \
  --header "Cookie: turon_token=<JWT>"
# ⇒ 0{"sid":"...","upgrades":[],"pingInterval":25000,...}

# 3. Webhook
curl -X POST https://turon-socket.fly.dev/webhook/order-updated \
  -H "x-webhook-secret: <WEBHOOK_SECRET>" \
  -H "content-type: application/json" \
  -d '{"orderId":"...uuid..."}'
# ⇒ {"ok":true}
```

---

## Monitoring

- `/health` — uptime checker (UptimeRobot, BetterUptime)
- Fly.io o'zining metrics dashboard'i bor
- Loglar: `fly logs -a turon-socket`

---

## Xavfsizlik

- ✅ JWT_SECRET backend bilan bir xil (alohida key generatsiya qilinmaydi)
- ✅ WEBHOOK_SECRET tasodifiy (`openssl rand -hex 32`)
- ✅ CORS strict (faqat ishonchli originlar)
- ✅ Service JWT TTL 60s (qisqa, brute force xavfi yo'q)
- ✅ Non-root Docker user
- ⚠️ JWT_SECRET rotate qilganda backend va gateway bir vaqtda yangilang
