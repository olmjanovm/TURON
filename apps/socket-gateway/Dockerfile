# ─── Build stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /repo

# Workspace fayllarini ko'chiramiz (pnpm uchun)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/socket-gateway/package.json ./apps/socket-gateway/

# pnpm o'rnatish + workspace dep'larni cache bilan o'rnatish
RUN corepack enable && corepack prepare pnpm@10 --activate
RUN pnpm install --frozen-lockfile --filter @turon/socket-gateway... --filter @turon/shared

# Manba kodlari + build
COPY packages/shared ./packages/shared
COPY apps/socket-gateway ./apps/socket-gateway
RUN pnpm --filter @turon/socket-gateway build

# Production node_modules — devDeps tashlab yuboriladi
RUN pnpm --filter @turon/socket-gateway --prod deploy /app

# ─── Runtime stage ───────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Faqat kerakli artifaktlar
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /repo/apps/socket-gateway/dist ./dist
COPY --from=builder /repo/apps/socket-gateway/package.json ./package.json

# Non-root foydalanuvchi
RUN addgroup -S app && adduser -S app -G app
USER app

ENV NODE_ENV=production
ENV PORT=3030
EXPOSE 3030

# Health check (Docker / orchestrator uchun)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1

CMD ["node", "dist/server.js"]
