#!/usr/bin/env bash
#
# TURON — ROLGA QARAB selective deploy.
# Har server FAQAT o'ziga kerakli app'ni yangilaydi va FAQAT o'ziga kerakli
# dep'larni o'rnatadi → disk + deploy vaqti tejaladi (web/miniapp/legacy
# dep'lari umuman o'rnatilmaydi: ~700MB+ farq).
#
# Ishlatish:
#   bash run.sh customer         # turon (Singapur): API (customer+admin) + socket-gateway
#   bash run.sh bot              # pyzone (Stokgolm): faqat Telegram bot
#   bash run.sh all              # hammasi (dev/zaxira)
#   bash run.sh customer clean   # node_modules'ni tozalab qaytadan o'rnatadi (disk slim)
#
# Rol berilmasa ~/.turon-role faylidan o'qiladi (har serverga bir marta yoziladi).
#
set -euo pipefail

ROLE="${1:-$(cat "$HOME/.turon-role" 2>/dev/null || echo all)}"
CLEAN="${2:-}"
REPO="${TURON_REPO:-$HOME/TURON}"
BRANCH="${TURON_BRANCH:-main}"
cd "$REPO"
echo "▶ TURON deploy — ROLE=$ROLE  branch=$BRANCH  $( [ "$CLEAN" = clean ] && echo '(CLEAN install)')"

# 1) Kodni yangilash. Manba kichik (~30MB) — og'irlik node_modules'da, uni (3) filter boshqaradi.
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

# 2) Rol → kerakli workspace'lar va PM2 jarayonlari
case "$ROLE" in
  customer) FILTERS=(--filter "@turon/backend..." --filter "@turon/socket-gateway..."); PROCS=(turon-backend turon-socket turon-bot) ;;
  bot)      FILTERS=(--filter "@turon/backend...");                                      PROCS=(turon-bot) ;;
  admin)    FILTERS=(--filter "@turon/backend...");                                      PROCS=(turon-backend) ;;
  all|*)    FILTERS=();                                                                  PROCS=(turon-backend turon-socket turon-bot) ;;
esac

# 3) Faqat kerakli dep'lar. clean = avval node_modules o'chiriladi (haqiqiy slim).
if [ "$CLEAN" = "clean" ]; then
  echo "  🧹 node_modules tozalanmoqda…"
  rm -rf node_modules apps/*/node_modules packages/*/node_modules
fi
pnpm install "${FILTERS[@]}"

# 4) Build (faqat kerakli app'lar)
if [ "$ROLE" = "all" ]; then
  pnpm -r build
else
  pnpm --filter "@turon/backend" build
  [ "$ROLE" = "customer" ] && pnpm --filter "@turon/socket-gateway" build
fi

# 5) PM2 — jarayon bor bo'lsa zero-downtime reload, bo'lmasa ogohlantirish (1-marta env bilan qo'lda start)
declare -A SCRIPTS=(
  [turon-backend]="apps/backend/start-api.mjs"
  [turon-bot]="apps/backend/start-bot.mjs"
  [turon-socket]="apps/socket-gateway/dist/server.js"
)
for p in "${PROCS[@]}"; do
  if pm2 describe "$p" >/dev/null 2>&1; then
    pm2 reload "$p" --update-env
  else
    echo "  ⚠  '$p' hali yo'q — birinchi marta env bilan qo'lda: pm2 start ${SCRIPTS[$p]} --name $p"
  fi
done
pm2 save >/dev/null 2>&1 || true
echo "✅ ROLE=$ROLE deploy tugadi"
