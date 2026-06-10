#!/usr/bin/env bash
# 生产/演示服务器：创建管理员 → 导入集合 → 写入演示数据
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.staging.yml)
BASE="${NUANBAN_API:-http://127.0.0.1:8090}"
EMAIL="${NUANBAN_ADMIN_EMAIL:-admin@nuanban.dev}"
PASS="${NUANBAN_ADMIN_PASS:-Nuanban2025!}"

echo "==> 1/5 创建/重置超级管理员"
"${COMPOSE[@]}" run --rm --entrypoint /pb/pocketbase pocketbase \
  superuser upsert "$EMAIL" "$PASS" --dir=/pb_data

echo "==> 2/5 重启 PocketBase（加载 hooks）"
"${COMPOSE[@]}" restart pocketbase
for i in $(seq 1 40); do
  if curl -sf "$BASE/api/health" >/dev/null 2>&1; then break; fi
  [[ "$i" -eq 40 ]] && { echo "PocketBase 未就绪"; exit 1; }
  sleep 1
done

echo "==> 3/5 导入数据模型 pb_schema.json"
TOKEN="$(curl -sS -X POST "$BASE/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"${EMAIL}\",\"password\":\"${PASS}\"}" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).token||'')}catch{console.log('')}})")"

if [[ -z "$TOKEN" ]]; then
  echo "错误：超级管理员登录失败，请检查邮箱密码: $EMAIL"
  exit 1
fi

IMPORT_BODY="$(node -e "
const fs=require('fs');
const cols=JSON.parse(fs.readFileSync('packages/pocketbase/pb_schema.json','utf8'));
console.log(JSON.stringify({collections:cols,deleteMissing:false}));
")"

HTTP_CODE="$(curl -sS -o /tmp/pb-import.json -w '%{http_code}' -X PUT "$BASE/api/collections/import" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$IMPORT_BODY")"

if [[ "$HTTP_CODE" != "204" && "$HTTP_CODE" != "200" ]]; then
  echo "集合导入 HTTP $HTTP_CODE:"
  cat /tmp/pb-import.json 2>/dev/null || true
  echo "(若已导入过可忽略，继续 seed)"
fi

echo "==> 4/5 重启 PocketBase"
"${COMPOSE[@]}" restart pocketbase
sleep 3

echo "==> 5/5 写入演示数据"
NUANBAN_API="$BASE" "$ROOT/scripts/seed-demo.sh"

echo ""
echo "初始化完成。后台: ${BASE%/api}/_/  邮箱: $EMAIL  密码: $PASS"
