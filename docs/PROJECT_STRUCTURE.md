# Project Structure Guide: Turon Mini App Platform

## 📦 1. Monorepo Organization
Turon is organized as a monorepo for centralized management of all three platform components:

```text
/turon-monorepo
  ├── apps/
  │   ├── miniapp/      # React/Vite Frontend
  │   ├── backend/      # Fastify API (Prisma/PostgreSQL)
  │   └── bot/          # Telegram Bot Bridge (Thin)
  ├── packages/
  │   └── shared/       # Shared Types & Logic
  ├── docs/             # Technical & Operational Docs
  ├── .env.example      # Environment Template
  ├── pnpm-workspace.yaml # Monorepo Config
  └── package.json      # Monorepo Scripts
```

---

## 🏗️ 2. Mini App Frontend (`apps/miniapp`)
Built with React, Vite, and TanStack Query, the Mini App serves all three user roles through a unified routing system.

- **`src/api/`**: Axios configuration and base API logic.
- **`src/components/`**: UI components categorized by role (`admin`, `courier`, `customer`).
- **`src/hooks/queries/`**: Data fetching logic per domain (Orders, Menu, etc.).
- **`src/store/`**: Client-side state managed by Zustand.
- **`src/pages/`**: Page-level components, organized by user role.
- **`src/features/`**: Modular logic for specific product areas (e.g., `promo`, `notifications`).

---

## ⚙️ 3. Backend API (`apps/backend`)
A high-performance Fastify service that acts as the source of truth for all business operations.

- **`prisma/`**: Database schema and migrations.
- **`src/api/app.ts`**: Fastify application entry point and module registry.
- **`src/api/modules/`**: Modularized API routes and controllers (Auth, Order, Courier, etc.).
- **`src/api/plugins/`**: Custom Fastify plugins for security, auth, and validation.
- **`src/services/`**: Centralized service layer for complex business logic (e.g., `AuditService`, `StatusService`).
- **`src/config.ts`**: Application-wide, Zod-validated configuration.

---

## 📦 4. Shared Package (`packages/shared`)
A workspace package containing all business-critical logic and types shared byBoth the frontend and backend.

- **`src/dtos/`**: Standardized data transfer objects.
- **`src/schemas/`**: Shared Zod validation schemas.
- **`src/types/`**: Enums and shared TypeScript interfaces.
- **`src/utils/`**: Shared helper functions (e.g., currency formatting, order total calculation).

---

## 🛠️ 5. Domain-Specific Logic Locations

| Logic Area | Frontend | Backend | Shared |
|:---|:---|:---|:---|
| **Orders** | `src/hooks/queries/useOrders.ts` | `src/api/modules/orders/` | `Enum: OrderStatus` |
| **Menu** | `src/hooks/queries/useMenu.ts` | `src/api/modules/menu/` | `Enum: MenuItemType` |
| **Promos** | `src/features/promo/` | `src/api/modules/promos/` | `DiscountEngine` |
| **Courier** | `src/pages/courier/` | `src/api/modules/courier/` | `Enum: DeliveryStage` |
| **Auth** | `src/store/useAuthStore.ts` | `src/api/plugins/auth.ts` | `UserRoleEnum` |
| **Maps** | `src/pages/customer/MapSelection.tsx` | N/A (Geocoding) | `LocationDTO` |
