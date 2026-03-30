# Environment Reference: Turon Mini App Platform

## 1. Backend Configuration (`apps/backend`)
These variables must be set for the Fastify API to function correctly. Ensure these are securely managed in production.

| Variable | Required? | Example Value | Description |
|:---:|:---:|:---:|:---|
| `DATABASE_URL` | Yes | `postgresql://user:pass@localhost:5432/db` | The Prisma connection string for PostgreSQL. |
| `JWT_SECRET` | Yes | `super-secret-key-change-me` | Secret used to sign and verify session tokens. |
| `PORT` | No | `3000` | The port the backend listens on. Defaults to 3000. |
| `API_HOST` | No | `localhost` | The hostname for internal binding. |
| `BOT_TOKEN` | Yes | `8759...1bBUk` | The ID and Token from @BotFather. |
| `WEB_APP_URL` | Yes | `https://turon.app/` | The URL where the Mini App is hosted. |
| `REDIS_URL` | No | `redis://localhost:6379` | Required only if using Redis for caching or sessions. |
| `CORS_ORIGIN` | No | `*` | Allowed origins for the API. Recommend specific URL in production. |

---

## 2. Mini App Frontend (`apps/miniapp`)
Built-time configuration for the React/Vite application. In production, these are injected via `.env.production` or CI/CD secrets.

| Variable | Required? | Example Value | Description |
|:---:|:---:|:---:|:---|
| `VITE_API_URL` | Yes | `https://api.turon.app/` | The base URL for the Backend API. |
| `VITE_TELEGRAM_BOT_NAME` | Yes | `TuronBot` | The Telegram handle of the @BotFather bot. |
| `VITE_MAPS_PROVIDER` | No | `yandex` | One of `yandex`, `google`, or `none`. |
| `VITE_MAP_API_KEY` | No | `your_api_key_here` | API key for the chosen map provider. |

---

## 3. Shared Library & Build (`packages/shared`)
Currently, the shared package does not require unique environment variables, but build-time flags can be passed if needed.

## 4. Security Notes
-   **Never commit `.env` files** to your repository.
-   Use a secret manager (HashiCorp Vault, AWS Secrets Manager) in high-security production environments.
-   Ensure `JWT_SECRET` is rotated periodically and is of high entropy.
-   **Bot Token Safety**: If your bot token is leaked, revoke it immediately via `@BotFather`.
