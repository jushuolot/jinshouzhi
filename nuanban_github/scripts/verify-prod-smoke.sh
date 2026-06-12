#!/usr/bin/env bash
# 部署后外网冒烟（默认阿里云 IP）
set -euo pipefail

BASE="${NUANBAN_SMOKE_BASE:-http://101.200.128.82}"
API="${BASE}/api"

echo "==> health"
curl -sf "${API}/health" | head -c 120
echo ""

echo "==> student login 13800000001"
TOKEN="$(curl -sf -X POST "${API}/nuanban/phone-login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000001","code":"000000"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).token||'')}catch{console.log('')}})")"
if [[ -z "$TOKEN" ]]; then
  echo "错误: phone-login 失败" >&2
  exit 1
fi
echo "    token OK"

AVATAR="$(curl -sf -X POST "${API}/nuanban/phone-login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000001","code":"000000"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).user?.avatarUrl||'')}catch{console.log('')}})")"
if [[ "$AVATAR" == undefined://* ]]; then
  echo "错误: avatarUrl 含 undefined scheme → 请更新 hooks 并 restart pocketbase" >&2
  exit 1
fi
if [[ -n "$AVATAR" ]]; then
  echo "    avatarUrl: ${AVATAR:0:72}..."
fi

echo "==> elder login + profile orgName"
ELDER_TOKEN="$(curl -sf -X POST "${API}/nuanban/phone-login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000005","code":"000000"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).token||'')}catch{console.log('')}})")"
ORG="$(curl -sf "${API}/nuanban/elder/profile" \
  -H "Authorization: Bearer ${ELDER_TOKEN}" \
  -H "X-Active-Role: elder" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).orgName||'')}catch{console.log('')}})")"
echo "    orgName: ${ORG:-（空）}"

echo ""
echo "完成 · ${BASE}/#/pages/common/login"
