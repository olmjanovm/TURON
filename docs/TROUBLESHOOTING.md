# Troubleshooting Guide: Turon Mini App Platform

## 1. Authentication & Session Issues

### "Invalid initData" or 401 Unauthorized
-   **Cause**: The Telegram `initData` passed from the Mini App is invalid or the `BOT_TOKEN` in your backend `.env` is incorrect.
-   **Solution**: Double-check `@BotFather` and update `BOT_TOKEN`. Ensure the Mini App is opened from within Telegram.

### Manual JWT Expiration
-   **Cause**: The JWT from `/auth/login` has expired.
-   **Solution**: Refresh the Mini App page to trigger a new `initData` login flow.

---

## 2. Orders & Deployment Issues

### "CORS Blocked" on Frontend
-   **Cause**: The backend is not allowing requests from the frontend's origin.
-   **Solution**: Update `CORS_ORIGIN` in the backend `.env`. In development, use `*` or your local Vite URL (`http://localhost:5173`).

### Prisma Migration Failing
-   **Cause**: Database schema drift or connection issues.
-   **Solution**: Run `pnpm db:generate` followed by `pnpm db:migrate`. Ensure `DATABASE_URL` matches your local/production instance.

---

## 3. Courier & Map Issues

### Map Pin Not Saving Latitude/Longitude
-   **Cause**: Geocoding or Map Provider key is invalid.
-   **Solution**: Verify `VITE_MAP_API_KEY` in the frontend `.env`.

### Courier Cannot Update Delivery Stage
-   **Cause**: The order is not assigned to the courier or the transition violates the `StatusService` logic.
-   **Solution**: Check the `AuditLog` for error messages. Ensure the order is in the correct status (`DELIVERING`).

---

## 4. Promo & Discount Issues

### "Invalid Promo Code" in Checkout
-   **Cause**: Expiration date, usage limit, or minimum order value rules are not met.
-   **Solution**: Verify the promo rules in the Admin Panel. Check the backend `.env` for time-sync issues.

---

## 5. Development Workflow Issues

### "Module Not Found" in PNPM Monorepo
-   **Cause**: PNPM workspaces have not been linked correctly.
-   **Solution**: Run `pnpm install` in the root of the monorepo to re-link `@turon/shared`.

### Frontend Doesn't Update on Change
-   **Cause**: Vite HMR or browser caching.
-   **Solution**: Hard reload the browser. Check if `pnpm dev:miniapp` is still running.
