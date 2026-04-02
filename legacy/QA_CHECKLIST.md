# Comprehensive QA Checklist

This document structures the manual testing cycles ensuring the Turon Bot executes flawlessly across all environments.

## 1. Customer Flow
### A. Bot Start
- [ ] `/start` initializes state without crashing.
- [ ] Language selection loads correctly.
- [ ] Unauthorized Telegram user correctly bootstraps into a `Customer` role gracefully.
- [ ] Welcome text and primary Menu keyboards render properly.

### B. Menu Browsing
- [ ] `/menu` fires the Category lists properly.
- [ ] Category buttons navigate into Product listings safely.
- [ ] Product details (Name, Price, Image) parse and display perfectly.
- [ ] "Back" buttons return to higher categories cleanly.
- [ ] Clicking on empty categories does not crash the UI.

### C. Cart & Shopping Flow
- [ ] Adding one product generates a Cart Session dynamically.
- [ ] Adding the same product increases the integer quantity instead of duplicating lines.
- [ ] Cart Dashboard opens correctly displaying items.
- [ ] Increase/Decrease/Remove buttons accurately adjust arrays and totals.
- [ ] Cart Total recalculates live without delays.
- [ ] Hitting 0 quantity removes the item from the cart safely.

### D. Promo Mechanics
- [ ] Valid active promo code (`DEMO20`) applies modifying final totals correctly.
- [ ] Invalid promo code strings throw polite rejection messages.
- [ ] Expired promo codes throw rejection messages.
- [ ] Orders below `minOrderValue` reject the promo attachment natively.
- [ ] Checkouts recalculate correctly applying Discounts cleanly.

### E. Checkout Flow
- [ ] Engine securely blocks checkout if Cart array is `length === 0`.
- [ ] `Manual Address` flow captures text safely saving state.
- [ ] `Location Coordinates` flow captures Latitude/Longitude payloads directly mapping cleanly.
- [ ] Cash Payment path logs smoothly.
- [ ] Card Transfer pathway asks for designated Sub-Providers seamlessly.
- [ ] Final Confirmation prints clean Order Summaries natively.
- [ ] `Confirm Execute` generates Prisma DB rows wrapping atomic `$transactions`.

### F. Order Tracking
- [ ] `/my_orders` generates chronological order stack safely.
- [ ] Order Details drill-down works cleanly.
- [ ] Dynamic Statuses (`PREPARING`, `DELIVERED`, `CANCELED`) render successfully.

## 2. Admin Execution Flow
### A. Access Operations
- [ ] Normal Customers are securely bounced out of `/admin_orders` and `/admin_menu`.

### B. Order Triage
- [ ] `/admin_orders` queries and prints top 10 rows dynamically.
- [ ] Drill-down into a specific `#Order` maps deeply to user information cleanly.
- [ ] Pushing `Approve` switches state to `PENDING` alerting Customer natively.
- [ ] Pushing `Mark Preparing` alerts Customer cleanly.
- [ ] Financial `Verify Card Transfer` works securely flipping `UNPAID` to `PAID`.
- [ ] `Cancel Order` safely logs natively.

### C. Courier Allocation
- [ ] `Assign Courier` loops all active Drivers natively rendering `AVAILABLE` tags visually.
- [ ] Clicking Target Courier assigns order ID and safely pushes Telegram GPS locations natively exclusively to that selected driver!

### D. Menu Configurations
- [ ] `/admin_menu` operates successfully without regressions.
- [ ] `Add Category` Sequence saves Sort Orders correctly.
- [ ] The engine explicitly blocks the Deletion of Categories if active Products sit inside organically.
- [ ] 6-Step `Add Product` wizard correctly handles Prices (floats) and Stock (ints) without failing Constraints.
- [ ] `Soft Delete` product correctly strips `isActive` without dropping historical data.

### E. Promo & Marketing
- [ ] `/admin_promo` dashboard displays metrics correctly.
- [ ] 8-Step Wizard catches Date bounds intelligently.
- [ ] `Send Broadcast` module safely queries Customers, loops sequentially, and delivers Telegram pushes efficiently dropping block errors internally cleanly.

### F. Analytical Dashboards
- [ ] `/admin_stats` parses queries filtering by Today/Week/Month strictly safely.
- [ ] `Top Products` mapping evaluates physical items sold successfully.
- [ ] `/daily_report` acts dynamically throwing static string structures securely designed natively.
- [ ] `/system_check` tests Prisma, Telegram Webhooks, and Ports dynamically checking health effectively locally.

## 3. Courier Logistics Flow
- [ ] `/courier_orders` protects accesses correctly.
- [ ] Assigned Orders array displays matching targets completely.
- [ ] "Mark On The Way" broadcasts tracking notifications.
- [ ] "Mark Delivered" successfully flags `DELIVERED` status shutting off sequence globally whilst tagging the Courier dynamically back to `AVAILABLE`.
- [ ] GPS linking outputs `maps.google.com` strings seamlessly.

## 4. Edge Cases & Protection Layers
- [ ] Duplicate clicks on "Confirm Order" natively protected resolving natively securely.
- [ ] Negative input during Cart generation safely blocked preventing negative pricing arrays internally natively.
- [ ] Bot restarts during mid-checkout elegantly fallbacks resolving softly cleanly natively.
