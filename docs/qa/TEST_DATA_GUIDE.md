# Test Data Guide: Turon Mini App Platform

## 🟢 1. Test Users (Recommended Set)
To test all roles, ensure these three accounts are active:
1. **Admin (`admin_test`)**: Has `ADMIN` role. Use for order management and catalog control.
2. **Customer (`cust_test`)**: Has `CUSTOMER` role. Use for menu browsing and checkout.
3. **Courier (`cour_test`)**: Has `COURIER` role. Use for task assignment and map updates.

---

## 🕒 2. Demo Catalog (The Base Set)
Maintain these sample items for a consistent demo:
- **Category**: "Plov" (1st pos) / "Ichimliklar" (2nd pos).
- **Product**: "Osh Markazi (Maxsus)" - Price: 45,000 UZS.
- **Product**: "Choy (Limonli)" - Price: 8,000 UZS.

---

## 🛠️ 3. Promo Codes
Create these codes for different test scenarios:
- **TURON_WELCOME**: 10% Discount (Fixed).
- **TEST_FREE**: 100% Discount (Testing edge-cases).
- **MIN_50K**: 50% discount with a 50,000 UZS minimum.

---

## 🔄 4. Order States (Testing Status Transitions)
- **New Order**: Default `PENDING`.
- **In-Preparation**: After Admin confirmation (`PREPARING`).
- **Ready for Courier**: Once the kitchen is done (`READY_FOR_PICKUP`).
- **On the Way**: Assigned and picked up by a courier (`DELIVERING`).
- **Closed**: Successfully delivered (`DELIVERED`).

---

## ⚠️ 5. Payment Test Notes
- **Cash**: Standard flow.
- **Transfer**: Admin manual verification required.
- **External**: Click/Payme mock references (e.g., `TRN-TEST-12345`).

---

## 🗒️ 6. Test Data Cleanup
To refresh the environment:
1. Run `pnpm prisma:migrate:reset` (Dev only).
2. Use the "Clear Cart" button in the Customer profile.
3. Manually delete test `AuditLog` entries if log visibility is being demonstrated.
