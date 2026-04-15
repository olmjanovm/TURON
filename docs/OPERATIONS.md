# Operations & Maintenance Guide: Turon Mini App Platform

## 1. Deployment Overview
Turon is a monorepo consisting of a React/Vite frontend and a Fastify/Node.js backend.

### Frontend (MiniApp)
-   **Static Hosting**: Can be hosted on Vercel, Netlify, or AWS S3/CloudFront.
-   **Build Command**: `pnpm build:miniapp`.
-   **Output**: All static files in `apps/miniapp/dist`.

### Backend (API)
-   **Platform**: Should be hosted on a Node.js-capable platform (Railway, Render, AWS ECS).
-   **Database**: PostgreSQL is required.
-   **Build**: `pnpm build:backend`.
-   **Process Manager**: `pm2` or Docker containers are recommended for production.
-   **Telegram Bot**: The bot uses **long polling** by default. Ensure **only one bot instance** is running at a time.

---

## 2. Production Maintenance Checklist

### Database Migrations
Always run migrations before deploying the new backend version:
```bash
# In production environment
pnpm --filter @turon/backend prisma:migrate
```

### Health Monitoring
Use the automated health check endpoint to monitor system uptime:
-   **Endpoint**: `https://api.yourdomain.com/health`
-   **Response**: `{ "status": "ok", "timestamp": "..." }`

### Webhook Configuration
Ensure your Telegram bot webhook points to the backend:
```bash
# Example (via Curl)
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://api.yourdomain.com/bot/webhook"
```

> Note: the current bot implementation is **polling-based** (no webhook). If you switch to webhooks later, document the exact webhook handler endpoint and TLS requirements.

### Telegram Bot Instance Safety (P0)
- Run the bot in **exactly one** process/instance (avoid multiple replicas for the same `BOT_TOKEN`).
- If you run the bot inside the API process, gate it via `RUN_TELEGRAM_BOT=true` to prevent accidental multi-launch.
- Recommended production split:
  - `api` service: `RUN_TELEGRAM_BOT=false`
  - `bot` service: `RUN_TELEGRAM_BOT=true` (single replica)

### Backups (Minimum)
- Configure **daily Postgres backups** with at least **7-day retention**.
- Perform a **restore drill** at least once before going live (verify you can restore to a fresh DB).

---

## 3. Operations & Safety

### Logging & Auditing
-   **Audit Log Table**: All sensitive actions (payment confirms, order status changes) are recorded in the `AuditLog` table.
-   **Application Logs**: Standard `pino` (Fastify's default) logs are output to stdout. In production, these should be forwarded to a log aggregator (Datadog, Papertrail).

### Manual Troubleshooting Flow
1.  **Check API Health**: Is the `/health` endpoint responding?
2.  **Verify Database Connectivity**: Can the backend connect to PostgreSQL? Check `DATABASE_URL`.
3.  **Check CORS**: Are requests from the Mini App frontend blocked? Verify `CORS_ORIGIN` in the backend.
4.  **Confirm Role Access**: Can the Admin access the dashboard? Check the `isAdmin` flag in the `User` table via Prisma Studio.
5.  **Check Bot Health**: Look for polling errors (including 409 conflicts) and verify only one bot instance is running.

### Rollback Procedures
-   **Database**: Avoid destructive migrations if possible. If a database rollback is required, ensure you have a fresh dump before running `prisma migrate resolve`.
-   **API/Frontend**: Roll back to the previous stable Git commit or Docker image tag.

---

## 4. Daily System Checks
-   [ ] Verify `/health` endpoint is responding.
-   [ ] Review `AuditLog` for any suspicious user activity.
-   [ ] Ensure `DATABASE_URL` is within connection limits.
-   [ ] Confirm `BOT_TOKEN` has not expired or been revoked.
