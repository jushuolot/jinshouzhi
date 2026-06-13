#!/usr/bin/env bash
# 清空 PocketBase 中的演示/压测数据（保留 schema 与超级管理员）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="${NUANBAN_API:-http://localhost:8090}"
KEY="${NUANBAN_SEED_KEY:-nuanban_dev_seed}"
RESEED="${1:-}"

echo "正在清空演示数据 -> $BASE"
RESP="$(curl -sS -w '\n%{http_code}' -X POST "$BASE/api/nuanban/clear-demo?key=$KEY")"
HTTP_CODE="$(echo "$RESP" | tail -1)"
BODY="$(echo "$RESP" | sed '$d')"
echo "$BODY" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  try { console.log(JSON.stringify(JSON.parse(d), null, 2)); }
  catch { console.log(d); }
});"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "错误: clear-demo HTTP $HTTP_CODE（若 404 请先: docker compose restart pocketbase）" >&2
  exit 1
fi

if [[ "$RESEED" == "--reseed" ]]; then
  echo ""
  NUANBAN_API="$BASE" "$ROOT/scripts/seed-demo.sh"
fi

echo ""
echo "完成。内存中的钱包/验证码缓存将在 PocketBase 重启后清空。"
if [[ "$RESEED" != "--reseed" ]]; then
  echo "重新写入演示账号: ./scripts/seed-demo.sh  或  ./scripts/reset-demo.sh"
fi
