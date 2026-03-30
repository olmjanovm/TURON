# Stakeholder Demo Script: Turon Mini App Platform

## 🟢 1. Demo Preparation
- **Users**: Admin (`admin1`), Customer (`cust1`), Courier (`cour1`).
- **Data**: At least one active category and product.
- **Environment**: Deployed TMA or running local dev server.
- **Goal**: Show a 5-minute unified flow from Hunger to Handover.

---

## 🕒 2. Demo order (The Unified Flow)

### Step 1: Customer Intuitive Interface (2 min)
- **Action**: Open Mini App as Customer.
- **Talk**: "Welcome to Turon. Notice this is not a basic bot; it's a visually rich Mini App. As a customer, I see a vibrant menu that looks premium."
- **Action**: Add 2 items to Cart. Show interactive cart resume banner.
- **Action**: Apply Promo Code "TURON2026". Show real-time discount.
- **Action**: Go to Checkout. Show Map Pin selection.
- **Action**: Select "Cash" and Click "Confirm".
- **Talk**: "Order created. Now I'm redirected to my order status page where I can track the progress."

### Step 2: Admin Operational Control (1.5 min)
- **Action**: Switch to `/admin` dashboard.
- **Talk**: "As a restaurant manager, I immediately see the new order. The interface is optimized for speed on mobile tablets or phones."
- **Action**: Open Order. Click "Prepare".
- **Action**: Click "Assign Courier" and select an active courier.
- **Talk**: "I've now moved the order into the kitchen and assigned a delivery partner, all with two taps."

### Step 3: Courier Operational Efficiency (1 min)
- **Action**: Switch to `/courier` dashboard.
- **Talk**: "Now we're in the shoes of our courier. A task notification has popped up."
- **Action**: Open Order. Open the Map.
- **Talk**: "The courier sees a map-first, Yandex-style flow. They can navigate directly to the pickup and delivery points."
- **Action**: Click "Picked Up" -> "Arrived" -> "Delivered".
- **Talk**: "The courier follows a guided sequence to ensure the customer is updated at every step."

### Step 4: Final Verification (0.5 min)
- **Action**: Switch back to `/customer/orders`.
- **Talk**: "Back to the customer—notice the status has moved through every stage and now shows as 'Delivered'. Zero friction, total transparency."

---

## 🛠️ 3. Strong Product Values to Highlight
- **Visual UX**: Modern, fast, and feels like a native app.
- **Admin Control**: Power and analytics right in the Mini App.
- **Safety**: Robust status transitions and payment tracking.
- **Scalability**: Architecture ready for multi-restaurant support.

---

## ⚠️ 4. Troubleshooting / Backup Path
- **Network delay?**: Explain that TMA handles caching and server-state sync reliably.
- **Broken link?**: Use the bottom navigation to re-enter the module.
- **Role confusion?**: Use the Debug profile switch (if enabled) to toggle roles during demo.
