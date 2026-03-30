# Developer Runbook: Turon Mini App Platform

## 1. Local Development Setup
Turon is a PNPM-powered monorepo. This guide will help you get the system running on your local machine.

### Prerequisites
-   **Node.js**: v18 or newer.
-   **PNPM**: v8 or newer.
-   **PostgreSQL**: v14 or newer.
-   **Telegram Dev Bot**: Create one via `@BotFather` and enable the Mini App feature.

### First-Time Setup
1.  **Install dependencies**:
    ```bash
    pnpm install
    ```
2.  **Environment Setup**:
    ```bash
    cp .env.example .env
    ```
    *Note: Update the `DATABASE_URL` and `BOT_TOKEN` in the root `.env`.*
3.  **Database Migration**:
    ```bash
    pnpm db:generate
    ```

### Recommended Tooling
-   **Prisma Studio**: Use `pnpm db:studio` for a visual database GUI.
-   **Telegram Web App Debugger**: Use `ngrok` to expose your local frontend for testing inside the Telegram app.

---

## 2. Common Development Workflows

### Starting the Project
To run the entire system in development mode:
-   **Backend**: `pnpm dev:backend` (Runs on port 3000 by default).
-   **MiniApp**: `pnpm dev:miniapp` (Runs on port 5173 by default).

### Modifying the Database
If you need to change the domain model:
1.  Edit `apps/backend/prisma/schema.prisma`.
2.  Run `pnpm db:migrate` to update the DB and regenerate types.
3.  Restart the backend server.

### Adding New API Features
-   **Routes**: Define in `apps/backend/src/api/modules/[module]/[module].routes.ts`.
-   **Validation**: Add Zod schemas to `apps/backend/src/api/utils/schemas.ts`.
-   **Services**: Use centralized services in `apps/backend/src/services/` for business logic (e.g., `AuditService`).

### Frontend State Management
-   **Queries**: Use `apps/miniapp/src/hooks/queries/` for all backend data fetching via TanStack Query.
-   **Global State**: Use `apps/miniapp/src/store/` (Zustand) for client-side state like the cart or active delivery.

---

## 3. Safe Development Practices
-   **Always Validate**: Never trust client input; use Zod for all backend request bodies.
-   **Audit Everything**: Use `AuditService.record()` for any action that mutates significant data.
-   **Type Safety**: Ensure types are shared via `@turon/shared` to prevent frontend/backend drift.
-   **Security First**: Keep all sensitive keys in `.env` and never commit them to version control.

## 4. Troubleshooting Local Setup
-   **Prisma Type Errors?**: Run `pnpm db:generate` to refresh the client.
-   **Auth Failing?**: Ensure your `JWT_SECRET` matches on both frontend and backend and that the Telegram `initData` is being sent correctly via headers.
-   **CORS Issues?**: Verify the `API_HOST` and `WEB_APP_URL` in your `.env`.
