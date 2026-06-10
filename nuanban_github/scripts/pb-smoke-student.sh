#!/usr/bin/env bash
# 验证学生端关键 API（部署后 hooks / 演示数据是否正常）
set -euo pipefail

BASE="${NUANBAN_API:-http://127.0.0.1:8090}"
API="${BASE%/}/api"

TOKEN="$(curl -sf -X POST "$API/nuanban/phone-login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000001","code":""}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).token||'')}catch{console.log('')}})")"

if [[ -z "$TOKEN" ]]; then
  echo "错误：phone-login 未返回 token"
  exit 1
fi

AUTH=(-H "Authorization: Bearer $TOKEN" -H "X-Active-Role: student")
FAIL=0

check() {
  local name="$1" url="$2"
  local code body
  body="$(mktemp)"
  code="$(curl -sS -o "$body" -w '%{http_code}' "$url" "${AUTH[@]}")"
  if [[ "$code" == "200" ]]; then
    echo "  OK  $name (HTTP $code)"
  else
    echo "  FAIL $name (HTTP $code)"
    head -c 200 "$body" 2>/dev/null || true
    echo ""
    FAIL=1
  fi
  rm -f "$body"
}

echo "学生 API 冒烟测试 -> $API"
check "profile" "$API/nuanban/student/profile"
check "pending" "$API/nuanban/student/orders/pending"
check "elders/nearby" "$API/nuanban/student/elders/nearby?lat=31.23&lng=121.47"
check "withdrawal" "$API/nuanban/student/withdrawal"

if [[ "$FAIL" -ne 0 ]]; then
  echo "若出现 assertActiveRoleHeader is not defined：git pull 后 docker compose restart pocketbase"
  exit 1
fi
echo "全部通过"
