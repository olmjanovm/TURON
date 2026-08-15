# TURON

TURON is a Telegram Mini App-based food delivery platform that combines customer ordering, admin operations, and courier delivery workflows in one production-oriented monorepo, designed for fast iteration, operational visibility, and scalable service management.

## Tech stack
- TypeScript, React, Next.js, Vite
- Fastify (backend API)
- Prisma + PostgreSQL
- PNPM monorepo workspaces
- Telegram Mini App integration

## Quick setup and run
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create environment file:
   ```bash
   cp .env.example .env
   ```
3. Fill required values in `.env`.
4. Initialize database:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```
5. Run locally:
   ```bash
   pnpm dev:backend
   pnpm dev:miniapp
   ```

## Project at a glance (HR-friendly)
- Multi-role product: customer, admin, and courier experiences in one platform.
- Monorepo architecture with shared types and validation for consistency.
- Production-focused engineering: CI workflows, documentation, and security hardening.
- Delivery/logistics support with map-based courier flow.
- Clear contributor and review templates for maintainable team collaboration.

## Screenshots / demo
- Add product screenshots here.
- Add demo video or live link here.

## Additional docs
- Local run guide: `/docs/HOW_TO_RUN_LOCALLY.md`
- Snapshot for reviewers: `/docs/PROJECT_AT_A_GLANCE.md`
