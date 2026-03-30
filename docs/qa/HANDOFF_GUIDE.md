# Operational Handoff Guide: Turon Mini App Platform

## 📦 1. Product Overview (What it is)
Turon is a production-grade Telegram Mini App for restaurant food delivery. It connects three roles through a unified real-time dashboard:
1. **Customer**: Orders food via a rich visual interface.
2. **Admin**: Manages orders, menu items, and promo codes.
3. **Courier**: Navigates deliveries using a map-first interface.

---

## 🔑 2. Supported Roles & Actions

### Admin / Operator (Restoran Nazoratchisi)
- **Dashboard**: Track daily sales and key performance indicators (KPIs).
- **Order Board**: Multi-tab order list categorized by status.
- **Order Detail**: Displays items, customer info, and address.
- **Courier Selection**: List of active couriers to choose from for delivery.
- **Menu Central**: Full Manageability of categories and products.
- **Promo Central**: Creation of time-bound promo codes with usage limits.
- **Payment Verification**: Manual check for cash and transfer verify/reject.

### Courier / Delivery (Kuryer)
- **Task List**: Real-time assignment list for active couriers.
- **Map Navigation**: Yandex/Google map integration for navigation.
- **Stage Tracking**: Sequential delivery steps: Arrived -> Picked Up -> Done.

### Customer / User (Mijoz)
- **Visual Menu**: Direct browsing and searching products.
- **Cart & Promo**: Easy ordering with transparent discount logic.
- **Geolocation**: Precision map pinning for delivery.
- **Order Tracking**: Status history and notifications.

---

## 🏃 3. Daily Operational Flow (Recommended)
1. **Startup**: Admin logs in to ensure the restaurant is "Active".
2. **Order In**: Notification sound/banner informs Admin of a new order.
3. **Kitchen Handover**: Admin moves order to "Preparing".
4. **Dispatch**: Once ready, Admin assigns a Courier.
5. **Delivery**: Courier follows the map and completes the job.
6. **Closing**: Admin reviews the "Audit Logs" to ensure session integrity.

---

## 🔧 4. Common Troubleshooting
- **Order not appearing?**: Ensure the backend health check (`/health`) is green.
- **Promo not working?**: Check the "Start Date" and "Usage Limit" in Admin Panel.
- **Courier cannot see order?**: Verify the courier's `COURIER` role is active in the user profile.

---

## 🚀 5. Future Scalability (V2 & Beyond)
- **Automatic Dispatch**: Instead of manual courier assignment.
- **Real-time Map tracking**: For customers (via WebSockets/SSE).
- **Multi-Restaurant Support**: Centralized platform for multiple vendors.
- **Integrated Payments**: Click/Payme auto-verification bridges.
