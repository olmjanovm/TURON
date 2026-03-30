# Architectural Decision Record (ADR): Turon Mini App Platform

## ADR 1: Thin-Bot / Thick-API Architecture
-   **Status**: Accepted
-   **Context**: Telegram bots often use "Scenes" or "States" for business logic. This is hard to maintain and lacks rich visual UX.
-   **Decision**: We chose to use a minimal Telegram bot as a bridge to a rich React-based Mini App (Frontend) and a standard Fastify REST API (Backend).
-   **Consequences**: 
    -   High-fidelity UI (React).
    -   Standard backend development workflows (Fastify/Prisma).
    -   Easier expansion to web/mobile later.

---

## ADR 2: Centralized Business Logic in Backend
-   **Status**: Accepted
-   **Context**: Frontend-calculated totals and discounts are vulnerable to tampering and data drift.
-   **Decision**: We enforce all business-critical logic (order total calculation, promo validation, stock checking) on the backend.
-   **Consequences**:
    -   Improved data integrity and security.
    -   Single source of truth for financial calculations.

---

## ADR 3: Map-First Courier UX
-   **Status**: Accepted
-   **Context**: Courier apps often focus on lists, leading to poor operational efficiency.
-   **Decision**: We implemented a map-centric, Yandex-style delivery interface for couriers, focusing on navigation and stage tracking.
-   **Consequences**:
    -   Better driver orientation and routing.
    -   Higher delivery speed and success rates.

---

## ADR 4: Zod-Based Validation Layer
-   **Status**: Accepted
-   **Context**: Loose API typing and manual validation lead to runtime errors and security holes.
-   **Decision**: We use Zod for both request/response validation on the backend and shared DTO definition.
-   **Consequences**:
    -   Type-safe API contracts between frontend and backend.
    -   Automatic, robust validation of every request.

---

## ADR 5: Audit-First Operational Tracking
-   **Status**: Accepted
-   **Context**: Debugging status transition failures and operational disputes is difficult without history.
-   **Decision**: We implemented a centralized `AuditService` that records all significant data mutations.
-   **Consequences**:
    -   Full transparency for platform operators.
    -   Easier debugging of state-machine failures.
