# 🛰️ TURON — Jamoa muvofiqlashtirish stoli (Team Board)

> 3 ta Claude agent bitta repo ustida ishlaydi. Bu fayl — bizning umumiy "stol".
> Biz jonli chatlasha olmaymiz; **butun aloqa shu fayl + git orqali** (async).
>
> **HAR SESSIYA BOSHIDA:** `git pull --rebase origin main` → shu faylni o'qi → "Sardor direktivalari"ni bajar.
> **HAR SESSIYA OXIRIDA:** o'z STATUS bo'limingni yangila → commit → `git pull --rebase` → push.

---

## 👥 Jamoa va lane'lar (qat'iy chegaralar)

| Agent | Rol | FAQAT shu papkalarga tegadi |
|---|---|---|
| **Claude 1** | 🧭 **SARDOR** + Admin + Infra/Backend | `app/(admin)/**`, `src/components/admin/**`, `src/hooks/use-admin-*`, `prisma/schema.prisma`, `app/api/[...path]/route.ts`, `apps/backend/**` |
| **Claude 2** | Customer | `app/(customer)/**`, customer komponent/hook, `vercel.json`, `next.config.*` |
| **Claude 3** | Courier | `app/(courier)/**`, `src/components/courier/**`, `src/hooks/use-courier-*`, `src/stores/courier-*`, `src/lib/socket.ts` |

### Umumiy fayllar — KELISHMASDAN tegma
`package.json` / `pnpm-lock.yaml`, `src/lib/*` (umumiy), `src/components/ui/*`, `prisma/schema.prisma` (faqat Claude 1). Kerak bo'lsa → pastdagi **So'rovlar** bo'limiga yoz.

---

## 🔒 Oltin qoidalar
1. **Faqat o'z lane'ingda ishla.** Boshqa lane'ning faylini "tuzataman" deb o'zgartirma — buzasan.
2. **`prisma/schema.prisma` — faqat Claude 1.** Schema o'zgarishi kerak bo'lsa, So'rovlar bo'limiga yoz.
3. **Push'dan oldin DOIM:** `git pull --rebase origin main` → konflikt yech → push.
4. **Kichik, tez-tez commit.** Commit prefiksi majburiy: `[admin]` / `[customer]` / `[courier]` / `[infra]`.
5. **Boshqa lane'ga kirish kerak bo'lsa** → So'rovlar bo'limiga yoz, Sardor (Claude 1) hal qiladi.

---

## 🔁 Sync ritual (har sessiya)
- **Boshida:** `git pull --rebase origin main` → `TEAM.md` o'qi → Sardor direktivalarini ko'r.
- **Oxirida:** STATUS yangila → `[lane] xabar` bilan commit → `git pull --rebase` → push.

---

## 🧭 SARDOR DIREKTIVALARI
> (Faqat Claude 1 yozadi. Hamma bajaradi.)

- `[2026-06-14]` Lane'lar belgilandi (yuqoridagi jadval). Har kim o'z hududida qoladi.
- `[2026-06-14]` **Claude 2 → Customer.** Endi courier'ga TEGMA (DeliveryNavigator endi Claude 3 ники).
- `[2026-06-14]` **Claude 3 → Courier.** Birinchi vazifa: courier holatini audit qil, rejani STATUS bo'limingga yoz. Hech narsani buzma — avval o'rgan.
- `[2026-06-14]` **Claude 2:** Vercel region → `sin1` (Singapur). Backend endi Singapurда, latency tushiramiz.
- `[2026-06-14]` **Hamma:** `prisma/schema.prisma`ga hech kim tegmaydi (`fallback_sent_at` ustunini Claude 1 hal qiladi).

---

## 📊 STATUS
> Har agent FAQAT o'z bo'limini yangilaydi. Sana + 1-2 qator.

### Claude 1 — Admin / Infra (sardor)
- `[2026-06-14]` Backend + bot Singapurga ko'chdi (`turonkafe.duckdns.org`, HTTPS). Backend↔DB ~200ms → ~5ms (~97% tez). Bot handover tekshirilmoqda (/start javobi).
- Admin panel: Next.js+TS, premium dizayn, asosiy funksiyalar tayyor.

### Claude 2 — Customer
- _(Claude 2 shu yerga yozadi)_

### Claude 3 — Courier
- _(Claude 3 shu yerga yozadi)_

---

## ✉️ SO'ROVLAR / SAVOLLAR (async "chat")
> Format: `[sana] KIMDAN → KIMGA: xabar`  ·  Javob ostiga qo'shiladi.

- `[2026-06-14] Sardor → hamma:` Shu faylni o'qib, o'z STATUS bo'limingizni to'ldiring va lane'ingizda qoling. Savol/so'rovni shu yerga yozing.
