#!/usr/bin/env bash
# 阿里云服务器：拉代码 → 重启后端 → 导入集合 + 演示数据 → 重建 H5
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f config/demo.env ]]; then
  # shellcheck disable=SC1091
  source config/demo.env
fi

GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"
echo "==> 拉取最新代码"
git -C "$GIT_ROOT" pull --ff-only || git -C "$GIT_ROOT" pull

chmod +x scripts/*.sh

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.staging.yml)
echo "==> 重启 PocketBase（加载最新 hooks）"
"${COMPOSE[@]}" restart pocketbase
sleep 3

NUANBAN_API=http://127.0.0.1:8090 ./scripts/pb-init-server.sh

STAGING_IP="${NUANBAN_STAGING_IP:-}"
if [[ -n "$STAGING_IP" ]]; then
  echo "==> 重建 H5（API: http://${STAGING_IP}/api）"
  cd packages/miniapp
  if [[ ! -d node_modules ]]; then
    npm install
  fi
  VITE_API_BASE_URL="http://${STAGING_IP}/api" npm run build:h5
  cd "$ROOT"
  echo "==> 重启 Caddy"
  "${COMPOSE[@]}" --profile staging restart caddy 2>/dev/null || "${COMPOSE[@]}" --profile staging up -d caddy
fi

echo ""
echo "完成。请强刷浏览器 (Ctrl+Shift+R):"
echo "  http://${STAGING_IP:-你的IP}/#/pages/common/login"
echo "测试: 13800000001 验证码留空"
