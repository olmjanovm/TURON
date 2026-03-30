# 🚀 TURON Monorepo Deployment Guide

This project is a **pnpm monorepo** designed for professional, long-term maintenance. This document provides clear instructions for deploying the various components.

## 📦 Monorepo Structure
- **`apps/miniapp`**: React + Vite Telegram Mini App (Frontend)
- **`apps/backend`**: Fastify API + Telegram Bot + Prisma (All Backend)
- **`packages/shared`**: Shared TypeScript types, enums, and constants.

---

## 🌐 Deploying Frontend (Vercel)

Vercel is the recommended platform for the Telegram Mini App.

### Vercel Dashboard Settings:
1. **Root Directory**: Select `apps/miniapp`.
2. **Build Settings**:
   - **Build Command**: `pnpm build` (Vercel will automatically look up the monorepo root for `pnpm-lock.yaml`).
   - **Install Command**: `pnpm install`.
   - **Output Directory**: `dist` (In the context of `apps/miniapp`).
3. **Environment Variables**:
   - `VITE_API_URL`: URL of your deployed backend.

### Automatic Detection:
Vercel should automatically detect the `pnpm` workspace. If you encounter issues, ensure `Enable Corepack` is checked in your team settings or add `"packageManager": "pnpm@X.X.X"` to your root `package.json`.

---

## ⚙️ Deploying Backend (Railway)

Railway is recommended for the Node.js backend and Postgres database.

### Railway Dashboard Settings:
1. **Source Directory**: Use the root of the repository.
2. **Start Command**: `pnpm --filter @turon/backend dev` (for development) or `pnpm --filter @turon/backend start` (for production).
3. **Build Command**: `pnpm install && pnpm build`.
4. **Environment Variables**:
   - `DATABASE_URL`: Your Postgres connection string.
   - `BOT_TOKEN`: Your Telegram Bot API token.
   - `JWT_SECRET`: Secret for user authentication.
   - `WEB_APP_URL`: URL where the Mini App is hosted.

### Database Setup:
Before starting the backend, remember to run the migrations:
```bash
pnpm db:migrate
pnpm db:seed
```

---

## 🛠️ Local Development

To get started locally, follow these steps:

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Generate Database Client**:
   ```bash
   pnpm db:generate
   ```

3. **Run Services**:
   - **Miniapp**: `pnpm dev:miniapp`
   - **Backend**: `pnpm dev:backend` (Runs both API and Bot simultaneously)

4. **Shared Code**:
   When you change something in `packages/shared`, you may need to run:
   ```bash
   pnpm --filter @turon/shared build
   ```
   *Most modern dev servers (Vite/TSX) handle the `.ts` files directly via workspace paths, so a manual rebuild is rarely needed.*
