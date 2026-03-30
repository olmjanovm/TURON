# System Architecture: Turon Mini App Platform

## 1. High-Level Overview
Turon is designed as a **Thin-Bot, Thick-API** architecture. This decoupling allows for a rich, high-fidelity experience in the Telegram Mini App (TMA) while using a standard, high-performance REST API as the source of truth.

### Key Components
- **MiniApp (Frontend)**: React/Vite application serving all three roles (Customer, Admin, Courier).
- **Backend (API)**: Fastify-based Node.js service providing security, validation, and business logic.
- **Bot Bridge**: A minimal Telegraf-based entry point to verify Telegram `initData` and generate deep links.
- **Database**: PostgreSQL with Prisma ORM for structured, type-safe data persistence.
- **Audit Logging**: Integrated service that records all sensitive mutations for platform transparency.

---

## 2. Role-Based Flow Design

### Customer Flow (The Ordering Engine)
- **Menu Management**: Categorized products with variant and availability support.
- **Cart Logic**: Pure frontend state (Zustand) with backend-validated checkout.
- **Auth**: Seamless Telegram `initData` verification converted into a standard JWT session.

### Courier Flow (Map-First Logistics)
- **Yandex-Inspired UX**: Specialized map-driven interface optimized for delivery.
- **Stage Management**: Strict sequential transitions (`GOING_TO_RESTAURANT` -> `ARRIVED` -> `PICKED_UP` -> `DELIVERING` -> `DELIVERED`).
- **Resiliency**: An "active task" resume banner ensures the courier can return to their delivery even if the app was closed.

### Admin Flow (Command & Control)
- **KPI Monitoring**: Real-time sales and order volume statistics.
- **Status Machine**: Formalized `OrderStatus` transitions with automatic audit logging at every step.
- **Platform Management**: Dedicated pages for menu editing, promo code creation, and user management.

---

## 3. Core Business Models

### Order Lifecycle
1.  **PENDING**: Waiting for Admin confirmation.
2.  **PREPARING**: Kitchen is actively working on the order.
3.  **READY_FOR_PICKUP**: Waiting for a courier assignment.
4.  **DELIVERING**: Courier has picked up the order and is on the way.
5.  **DELIVERED**: Successfully completed handover.
6.  **CANCELLED**: Terminated order with associated audit log.

### Promo & Discount Engine
- **Validation**: Promo codes are validated on the backend against expiration dates and usage limits.
- **Deterministic**: Discount logic is centralized in `@turon/shared` to ensure consistent calculations on both client and server.
- **Snapshots**: Every order stores a snapshot of the discount applied at the time of creation to prevent retrospective data drift.

---

## 4. Key Security Boundaries
- **Zod Gateway**: No data enters the backend without passing a strict Zod schema validation.
- **Role Guards**: Backend `authorize` middleware enforces role-specific module access.
- **Audit Service**: Sensitive actions (e.g., status changes, user edits) trigger a record in the `AuditLog` table, capturing who, what, and when.

---

## 5. Future Scalability
- **Web/Mobile Expansion**: The API-first design allows for easy expansion into generic web or native iOS/Android apps beyond Telegram.
- **Automated Dispatch**: Architecture is ready to support algorithmic courier assignment (e.g., nearest available).
- **Real-Time Map Hub**: High-frequency coordinate updates for live customer tracking via WebSockets or SSE.
