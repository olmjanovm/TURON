# Environment Reference: Turon Mini App Platform

## 1. Backend Configuration (`apps/backend`)
These variables must be set for the Fastify API to function correctly. Ensure these are securely managed in production.

| Variable | Required? | Example Value | Description |
|:---:|:---:|:---:|:---|
| `DATABASE_URL` | Yes | `postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require` | Prisma runtime connection string. For Supabase, prefer the pooler/session URL. |
| `DIRECT_URL` | Recommended | `postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres?sslmode=require` | Direct PostgreSQL connection used by raw SQL migration and seed scripts. |
| `JWT_SECRET` | Yes | `super-secret-key-change-me` | Secret used to sign and verify session tokens. |
| `PORT` | No | `3000` | The port the backend listens on. Defaults to 3000. |
| `API_HOST` | No | `0.0.0.0` | The hostname for internal binding. |
| `BOT_TOKEN` | Yes | `1234...:bot-token` | The ID and Token from @BotFather. |
| `WEB_APP_URL` | Yes | `https://turon.app/` | The URL where the Mini App is hosted. |
| `REDIS_URL` | No | `redis://localhost:6379` | Required only if using Redis for caching or sessions. |
| `CORS_ORIGIN` | No | `*` | Allowed origins for the API. Recommend specific URL in production. |
| `RUN_TELEGRAM_BOT` | No | `true` | If `true`, launches the Telegram bot inside the API process. Use `false` when the bot runs as a separate single-replica service. |

---

## 2. Mini App Frontend (`apps/miniapp`)
Built-time configuration for the React/Vite application. In production, these are injected via `.env.production` or CI/CD secrets.
For local development in this monorepo, the mini app now reads env from the repository root via Vite `envDir`, and a package-local example file is also provided at `apps/miniapp/.env.example`.

| Variable | Required? | Example Value | Description |
|:---:|:---:|:---:|:---|
| `VITE_API_URL` | Yes | `https://api.turon.app/` | The base URL for the Backend API. |
| `VITE_TELEGRAM_BOT_NAME` | Yes | `TuronBot` | The Telegram handle of the @BotFather bot. |
| `VITE_MAPS_PROVIDER` | No | `yandex` | Supported values are `yandex` and `none`. |
| `VITE_MAP_API_KEY` | Yes for map flows | `your_yandex_maps_key_here` | Required for customer address search, reverse geocoding, and courier routing inside the Mini App. |
| `VITE_MAP_LANGUAGE` | No | `uz_UZ` | UI language passed to the Yandex Maps JavaScript API script loader. |

---

## 3. Shared Library & Build (`packages/shared`)
Currently, the shared package does not require unique environment variables, but build-time flags can be passed if needed.

## 4. Security Notes
-   **Never commit `.env` files** to your repository.
-   Use a secret manager (HashiCorp Vault, AWS Secrets Manager) in high-security production environments.
-   Ensure `JWT_SECRET` is rotated periodically and is of high entropy.
-   **Bot Token Safety**: If your bot token is leaked, revoke it immediately via `@BotFather`.
-   **Supabase + Prisma**: Use the pooler URL for `DATABASE_URL` and the direct host for `DIRECT_URL`. The raw SQL migration and seed scripts in `apps/backend/prisma` prefer `DIRECT_URL` when available.
