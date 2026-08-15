# How to run locally

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create environment file:
   ```bash
   cp .env.example .env
   ```
3. Configure required variables in `.env`.
4. Generate/migrate database:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```
5. Start services:
   ```bash
   pnpm dev:backend
   pnpm dev:miniapp
   ```
