# TURON — Multi-Agent Repo (3 Claude)

Bu repo'ni 3 ta muvofiqlashtirilgan Claude agent quradi. Sen ulardan birisan.

## Ish boshlashdan oldin (MAJBURIY)
1. `git pull --rebase origin main`
2. Repo ildizidagi **`TEAM.md`** faylini o'qi — bu jamoa stoli (lane'lar, qoidalar, sardor direktivalari, xabarlar).
3. O'z lane'ingni aniqla va **FAQAT** o'sha papkalarda ishla:
   - **Claude 1** → admin + infra/backend + `prisma/` (🧭 SARDOR/lead)
   - **Claude 2** → customer + `vercel.json` / `next.config`
   - **Claude 3** → courier (`app/(courier)/**`, `src/**/courier*`, `src/lib/socket.ts`)
4. Push'dan oldin yana `git pull --rebase origin main`.

## Qoidalar (qisqa)
- Boshqa lane'ning fayllariga **tegma**. Kerak bo'lsa `TEAM.md` → "So'rovlar"ga yoz.
- `prisma/schema.prisma` — **faqat Claude 1** o'zgartiradi.
- Commit prefiksi: `[admin]` / `[customer]` / `[courier]` / `[infra]`.
- Kichik, tez-tez commit. Push'dan oldin doim rebase.

To'liq qoidalar va jonli jamoa holati → **`TEAM.md`**.
