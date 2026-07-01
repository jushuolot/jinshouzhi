#!/usr/bin/env bash
# 为 GitHub Pages 启用 HTTPS API（sslip.io + Caddy :443）
# 在阿里云 Workbench 执行；安全组需放行 TCP 443
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=lib/source-formal-env.sh
. "$ROOT/scripts/lib/source-formal-env.sh"
source_formal_env "$ROOT" || true

STAGING_IP="${NUANBAN_STAGING_IP:-101.200.128.82}"
HTTPS_HOST="${NUANBAN_HTTPS_API_HOST:-101-200-128-82.sslip.io}"
HTTPS_API="https://${HTTPS_HOST}/api"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.staging-https.yml)

echo "==> 启动 PocketBase（若未运行）"
"${COMPOSE[@]}" up -d pocketbase
for i in $(seq 1 40); do
  if docker exec nuanban-pocketbase wget -q --spider http://127.0.0.1:8090/api/health 2>/dev/null; then
    break
  fi
  [[ "$i" -eq 40 ]] && { echo "错误：PocketBase 未就绪"; exit 1; }
  sleep 1
done

echo "==> 启动 HTTPS API 反代（:443 · ${HTTPS_HOST}）"
"${COMPOSE[@]}" --profile staging-https up -d caddy-https
sleep 3

echo "==> 探测 HTTPS API"
if curl -sf "${HTTPS_API%/}/health" >/dev/null; then
  echo "  ✓ ${HTTPS_API}/health"
else
  echo "  ⚠ 公网探测失败。请确认："
  echo "    1) 阿里云安全组已放行 TCP 443"
  echo "    2) docker logs nuanban-caddy-https"
  echo "    3) 本机: curl -sf ${HTTPS_API}/health"
  exit 1
fi

echo ""
echo "=============================================="
echo "HTTPS API 已就绪（供 GitHub Pages 使用）"
echo ""
echo "  API:  ${HTTPS_API}"
echo ""
echo "GitHub 仓库 Variables 设置："
echo "  NUANBAN_FORMAL_API_URL=${HTTPS_API}"
echo ""
echo "或本地："
echo "  ./scripts/gh-set-formal-api.sh ${HTTPS_API}"
echo "  git push origin main   # 触发 Pages 重建"
echo "=============================================="
