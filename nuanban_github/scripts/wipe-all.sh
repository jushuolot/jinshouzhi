#!/usr/bin/env bash
# 清空全部业务数据：用户、订单、老人、服务项、储值卡余额（内存）等
# 保留 PocketBase 超级管理员与集合结构；不自动 seed 演示数据
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="${NUANBAN_API:-http://localhost:8090}"
KEY="${NUANBAN_SEED_KEY:-nuanban_dev_seed}"

echo "警告: 将清空全部用户、订单、金额缓存与业务数据（仅保留后台管理员与表结构）"
read -r -p "继续? [y/N] " ans
[[ "${ans:-}" =~ ^[yY]$ ]] || exit 0

echo "==> 清空数据 -> $BASE"
RESP="$(curl -sS -w '\n%{http_code}' -X POST "$BASE/api/nuanban/wipe-all?key=$KEY")"
HTTP_CODE="$(echo "$RESP" | tail -1)"
BODY="$(echo "$RESP" | sed '$d')"
echo "$BODY" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  try { console.log(JSON.stringify(JSON.parse(d), null, 2)); }
  catch { console.log(d); }
});"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "错误: wipe-all HTTP $HTTP_CODE（若 404 请: docker compose restart pocketbase）" >&2
  exit 1
fi

echo ""
echo "==> 重启 PocketBase（清空扫呗演示账户等进程内缓存）"
docker compose -f "$ROOT/docker-compose.yml" restart pocketbase
sleep 2
curl -sf "$BASE/api/health" >/dev/null && echo "API 就绪"
echo ""
echo "完成。请自行注册/录入学校、机构、服务项与用户。"
